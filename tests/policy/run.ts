/**
 * Permission probes, through the same roles and the same identity mechanism PostgREST uses.
 *
 * These are adversarial: each one attempts something the product must refuse, and passes only
 * when the refusal is the RIGHT refusal. A probe that fails because of a typo in a table name
 * would look identical to a probe that fails because access was denied, so every denial is
 * matched against its expected shape (a permission error, an empty result, or a raised
 * exception naming the rule).
 *
 * WHAT THIS RUNS AGAINST. A Supabase request arrives at PostgREST, which opens a transaction,
 * does `SET LOCAL ROLE anon|authenticated` and `SET LOCAL request.jwt.claims '{"sub": ...}'`,
 * and runs the statement. This file does exactly that against a Postgres connection. It is the
 * real mechanism, not an approximation of it — `auth.uid()` reads the same setting either way.
 *
 * WHAT IT DOES NOT PROVE. It does not prove that GoTrue issues a token only to someone who
 * knows the password, and it does not prove that PostgREST rejects a forged one. Those are
 * Supabase's to keep and are proved, if at all, against the hosted project. What is proved
 * here is what the POLICIES do once an identity is asserted.
 *
 * Browser journeys do not replace these, and these do not replace browser journeys: a policy
 * can be right while the surface that reads it is wrong, and the reverse.
 */
import { Client } from "pg";

const AUTHENTICATOR = process.env.DATABASE_URL_AUTHENTICATOR
  ?? "postgres://authenticator:local_dev_only@127.0.0.1:5432/gallery";
const OWNER = process.env.DATABASE_URL_OWNER ?? "postgres://postgres@127.0.0.1:5432/gallery";
const SCHEMA = process.env.GALLERY_SCHEMA ?? "gallery";

type Result = { id: string; title: string; verdict: "PASS" | "FAIL"; detail: string };
const results: Result[] = [];

function record(id: string, title: string, ok: boolean, detail: string) {
  results.push({ id, title, verdict: ok ? "PASS" : "FAIL", detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${id}  ${title}${ok ? "" : `\n        ${detail}`}`);
}

/** One request, exactly as PostgREST shapes it. */
async function asRole<T>(role: "anon" | "authenticated", userId: string | null,
                         fn: (c: Client) => Promise<T>): Promise<T> {
  const c = new Client({ connectionString: AUTHENTICATOR });
  await c.connect();
  try {
    await c.query("BEGIN");
    await c.query(`SET LOCAL ROLE ${role}`);
    await c.query(`SET LOCAL search_path = "${SCHEMA}"`);
    await c.query("SELECT set_config('request.jwt.claims', $1, true)",
                  [userId ? JSON.stringify({ sub: userId, role }) : ""]);
    const out = await fn(c);
    await c.query("COMMIT");
    return out;
  } finally { await c.end(); }
}

/** Run something expected to be refused, and report HOW it was refused. */
async function refused(role: "anon" | "authenticated", userId: string | null,
                       sql: string, params: unknown[] = []) {
  try {
    const r = await asRole(role, userId, (c) => c.query(sql, params));
    return { denied: false, rows: r.rowCount ?? 0, code: "", message: "" };
  } catch (e) {
    const err = e as { code?: string; message?: string };
    return { denied: true, rows: -1, code: err.code ?? "", message: err.message ?? "" };
  }
}

async function main() {
  const owner = new Client({ connectionString: OWNER });
  await owner.connect();
  await owner.query(`SET search_path = "${SCHEMA}"`);

  const ids = await owner.query<{ handle: string; maker_id: string; user_id: string; gallery_id: string }>(
    `SELECT m.handle, m.id AS maker_id, m.user_id, g.id AS gallery_id
       FROM makers m JOIN galleries g ON g.maker_id = m.id`);
  const A = ids.rows.find((r) => r.handle === "anika-rao");
  const B = ids.rows.find((r) => r.handle === "dhaaga-studio");
  const op = await owner.query<{ user_id: string }>("SELECT user_id FROM operators LIMIT 1");
  // The co-tenancy case, and the reason this project's arrangement needs its own probe: a
  // valid token from the shared auth.users that has never had anything to do with The Gallery.
  // Not merely "has no maker profile": the operator has none either, and would sail through
  // every one of these probes by holding authority rather than by any policy being right.
  const stranger = await owner.query<{ id: string }>(
    `SELECT id FROM auth.users
      WHERE id NOT IN (SELECT user_id FROM makers)
        AND id NOT IN (SELECT user_id FROM operators) LIMIT 1`);

  if (!A || !B || !op.rowCount || !stranger.rowCount) {
    console.error("fixtures missing — run: npm run db:seed");
    process.exit(2);
  }
  const workA = await owner.query<{ id: string; public_token: string; lifecycle: string }>(
    "SELECT id, public_token, lifecycle FROM works WHERE gallery_id = $1 ORDER BY created_at LIMIT 1",
    [A.gallery_id]);

  // ---------------------------------------------------------------- anonymous reach
  const t1 = await refused("anon", null, "SELECT * FROM works");
  record("P-01", "anonymous cannot read the works table at all", t1.denied && t1.code === "42501",
    `expected permission denied (42501), got ${t1.denied ? t1.code : `${t1.rows} rows`}`);

  const t2 = await refused("anon", null, "SELECT email FROM auth.users");
  record("P-02", "anonymous cannot read the identity table", t2.denied && t2.code === "42501",
    `expected permission denied (42501), got ${t2.denied ? t2.code : `${t2.rows} rows`}`);

  const t3 = await refused("anon", null, "SELECT * FROM makers");
  record("P-03", "anonymous cannot read the makers table", t3.denied && t3.code === "42501",
    `expected permission denied (42501), got ${t3.denied ? t3.code : `${t3.rows} rows`}`);

  const t4 = await refused("anon", null, "SELECT * FROM contact_routes");
  record("P-04", "anonymous cannot read raw contact routes", t4.denied && t4.code === "42501",
    `expected permission denied (42501), got ${t4.denied ? t4.code : `${t4.rows} rows`}`);

  // Anonymous CAN reach the public views — the refusals above must not be "everything is off".
  const pub = await asRole("anon", null, (c) => c.query("SELECT count(*)::int AS n FROM public_works"));
  record("P-05", "anonymous can reach the public view (anti-vacuous)", (pub.rows[0].n as number) >= 0,
    "the public view must be readable, or the refusals above prove nothing");

  // ---------------------------------------------------------------- draft invisibility
  const unpublished = await owner.query<{ n: number }>(
    "SELECT count(*)::int AS n FROM works WHERE lifecycle <> 'published' OR taken_down");
  const anonSees = await asRole("anon", null, (c) =>
    c.query<{ n: number }>("SELECT count(*)::int AS n FROM public_works"));
  const publishedTruly = await owner.query<{ n: number }>(
    `SELECT count(*)::int AS n FROM works w
       JOIN galleries g ON g.id = w.gallery_id JOIN makers m ON m.id = g.maker_id
      WHERE w.lifecycle = 'published' AND NOT w.taken_down
        AND g.lifecycle = 'published' AND m.status = 'active'`);
  record("P-06", "no unpublished work appears in the public view",
    (anonSees.rows[0].n as number) === (publishedTruly.rows[0].n as number),
    `anon sees ${anonSees.rows[0].n}, truly public ${publishedTruly.rows[0].n}, ` +
    `with ${unpublished.rows[0].n} unpublished or taken down`);

  // ---------------------------------------------------------------- maker isolation
  const readOther = await asRole("authenticated", B.user_id, (c) =>
    c.query<{ n: number }>("SELECT count(*)::int AS n FROM works WHERE gallery_id = $1", [A.gallery_id]));
  record("P-07", "Maker B cannot read Maker A's works", (readOther.rows[0].n as number) === 0,
    `Maker B saw ${readOther.rows[0].n} of Maker A's works`);

  const writeOther = await asRole("authenticated", B.user_id, (c) =>
    c.query("UPDATE makers SET display_name = 'Taken over' WHERE id = $1", [A.maker_id]));
  record("P-08", "Maker B cannot rename Maker A", (writeOther.rowCount ?? 0) === 0,
    `${writeOther.rowCount} rows updated`);

  if (workA.rowCount) {
    const retireOther = await asRole("authenticated", B.user_id, (c) =>
      c.query("UPDATE works SET lifecycle = 'retired' WHERE id = $1", [workA.rows[0].id]));
    record("P-09", "Maker B cannot retire Maker A's work", (retireOther.rowCount ?? 0) === 0,
      `${retireOther.rowCount} rows updated`);

    const statusOther = await refused("authenticated", B.user_id,
      "SELECT set_work_status($1, 'sold')", [workA.rows[0].id]);
    record("P-10", "Maker B cannot change the status of Maker A's work through the transition function",
      statusOther.denied && /not yours/.test(statusOther.message),
      `expected "not yours", got ${statusOther.denied ? statusOther.message : "it succeeded"}`);
  } else {
    record("P-09", "Maker B cannot retire Maker A's work", false, "no work exists yet — walk the journey first");
    record("P-10", "Maker B cannot change Maker A's work status", false, "no work exists yet");
  }

  const routeOther = await asRole("authenticated", B.user_id, (c) =>
    c.query<{ n: number }>("SELECT count(*)::int AS n FROM contact_routes WHERE maker_id = $1", [A.maker_id]));
  record("P-11", "Maker B cannot read Maker A's contact routes", (routeOther.rows[0].n as number) === 0,
    `Maker B saw ${routeOther.rows[0].n} routes`);

  const makerRowOther = await asRole("authenticated", B.user_id, (c) =>
    c.query<{ n: number }>("SELECT count(*)::int AS n FROM makers WHERE id = $1", [A.maker_id]));
  record("P-12", "Maker B cannot read Maker A's maker row", (makerRowOther.rows[0].n as number) === 0,
    `Maker B saw ${makerRowOther.rows[0].n} of Maker A's rows`);

  // Anti-vacuous: Maker B can reach their OWN records.
  const own = await asRole("authenticated", B.user_id, (c) =>
    c.query<{ n: number }>("SELECT count(*)::int AS n FROM makers WHERE id = $1", [B.maker_id]));
  record("P-13", "Maker B can read their own maker row (anti-vacuous)", (own.rows[0].n as number) === 1,
    "row-level security must not deny a maker their own record");

  // ---------------------------------------------------------------- operator authority
  const makerSuspends = await refused("authenticated", B.user_id,
    "SELECT set_maker_access($1, 'suspend', 'because I felt like it')", [A.maker_id]);
  record("P-14", "an ordinary maker cannot suspend another maker",
    makerSuspends.denied && /operator authority/.test(makerSuspends.message),
    `expected "operator authority required", got ${makerSuspends.denied ? makerSuspends.message : "it succeeded"}`);

  const noReason = await refused("authenticated", op.rows[0].user_id,
    "SELECT set_maker_access($1, 'suspend', '   ')", [B.maker_id]);
  record("P-15", "an operator cannot suspend without a written reason",
    noReason.denied && /recorded reason/.test(noReason.message),
    `expected "recorded reason", got ${noReason.denied ? noReason.message : "it succeeded"}`);

  const rewrite = await refused("authenticated", op.rows[0].user_id,
    "UPDATE operator_actions SET reason = 'something else'");
  record("P-16", "the operator record cannot be rewritten, even by an operator", rewrite.denied,
    `expected a refusal, got ${rewrite.rows} rows updated`);

  const del = await refused("authenticated", op.rows[0].user_id, "DELETE FROM operator_actions");
  record("P-17", "the operator record cannot be deleted", del.denied,
    `expected a refusal, got ${del.rows} rows deleted`);

  const whoIsOperator = await refused("authenticated", B.user_id, "SELECT * FROM operators");
  record("P-23", "nobody can enumerate who holds operator authority",
    whoIsOperator.denied && whoIsOperator.code === "42501",
    `expected permission denied (42501), got ${whoIsOperator.denied ? whoIsOperator.code : `${whoIsOperator.rows} rows`}`);

  // ------------------------------------------------- the stranger with a valid token
  // GAL-SUPA-1 accepted consequence 1: auth.users is shared with another product, so a
  // structurally valid token proves nothing about whether its holder belongs here. These
  // probe the case the shared project makes real.
  const strangerId = stranger.rows[0].id;
  const strangerReads = await asRole("authenticated", strangerId, (c) =>
    c.query<{ n: number }>("SELECT count(*)::int AS n FROM works"));
  record("P-24", "an authenticated stranger with no maker profile reads no work",
    (strangerReads.rows[0].n as number) === 0,
    `the stranger saw ${strangerReads.rows[0].n} works`);

  const strangerRoutes = await asRole("authenticated", strangerId, (c) =>
    c.query<{ n: number }>("SELECT count(*)::int AS n FROM contact_routes"));
  record("P-25", "an authenticated stranger reads no contact route",
    (strangerRoutes.rows[0].n as number) === 0,
    `the stranger saw ${strangerRoutes.rows[0].n} routes`);

  const strangerClaims = await refused("authenticated", strangerId,
    `INSERT INTO makers (user_id, handle, display_name, kind, city)
     VALUES ($1,'stranger','Stranger','individual','Nowhere')`, [A.user_id]);
  record("P-26", "an authenticated stranger cannot create a maker owned by someone else",
    strangerClaims.denied && strangerClaims.code === "42501",
    `expected a row-level security refusal, got ${strangerClaims.denied ? strangerClaims.code : `${strangerClaims.rows} rows inserted`}`);

  // ---------------------------------------------------------------- suspension bites
  await owner.query("UPDATE makers SET status = 'suspended', status_reason = 'probe' WHERE id = $1", [B.maker_id]);
  const suspendedWrite = await asRole("authenticated", B.user_id, (c) =>
    c.query("UPDATE makers SET display_name = 'Still here' WHERE id = $1", [B.maker_id]));
  record("P-27", "a suspended maker cannot write, in the data layer",
    (suspendedWrite.rowCount ?? 0) === 0, `${suspendedWrite.rowCount} rows updated while suspended`);
  const suspendedReads = await asRole("authenticated", B.user_id, (c) =>
    c.query<{ n: number }>("SELECT count(*)::int AS n FROM makers WHERE id = $1", [B.maker_id]));
  record("P-28", "a suspended maker can still read their own record and the reason (anti-vacuous)",
    (suspendedReads.rows[0].n as number) === 1,
    "a suspension nobody can read is a suspension nobody can appeal");
  await owner.query("UPDATE makers SET status = 'active', status_reason = NULL WHERE id = $1", [B.maker_id]);

  // ---------------------------------------------------------------- the image bytes
  // The storage policies are the second wall behind /img. The route decides which key to look
  // up; these decide whether the bytes come back. Probed here as rows in storage.objects,
  // which is what those policies actually gate.
  const keys = await owner.query<{ storage_key: string; lifecycle: string }>(
    `SELECT i.storage_key, w.lifecycle FROM work_images i JOIN works w ON w.id = i.work_id
      JOIN galleries g ON g.id = w.gallery_id JOIN makers m ON m.id = g.maker_id
      WHERE m.handle = 'anika-rao'`);
  const publishedKey = keys.rows.find((k) => k.lifecycle === "published")?.storage_key;
  const draftKey = keys.rows.find((k) => k.lifecycle === "draft")?.storage_key;

  if (publishedKey && draftKey) {
    await owner.query(
      `INSERT INTO storage.objects (bucket_id, name) VALUES
         ('gallery-images', $1), ('gallery-images', $2)
       ON CONFLICT DO NOTHING`,
      [`${publishedKey}/w640.jpg`, `${draftKey}/w640.jpg`]);

    const anonSeesPublished = await asRole("anon", null, (c) =>
      c.query<{ n: number }>(
        "SELECT count(*)::int AS n FROM storage.objects WHERE name = $1", [`${publishedKey}/w640.jpg`]));
    record("P-29", "a published work's image bytes are readable anonymously (anti-vacuous)",
      (anonSeesPublished.rows[0].n as number) === 1,
      "if this fails no visitor sees a picture, and the refusals below prove nothing");

    const anonSeesDraft = await asRole("anon", null, (c) =>
      c.query<{ n: number }>(
        "SELECT count(*)::int AS n FROM storage.objects WHERE name = $1", [`${draftKey}/w640.jpg`]));
    record("P-30", "a draft work's image bytes are not readable anonymously",
      (anonSeesDraft.rows[0].n as number) === 0,
      `anon reached ${anonSeesDraft.rows[0].n} draft objects`);

    const bWritesAsA = await refused("authenticated", B.user_id,
      "INSERT INTO storage.objects (bucket_id, name) VALUES ('gallery-images', $1)",
      [`${publishedKey}/forged.jpg`]);
    record("P-31", "Maker B cannot write bytes under Maker A's storage key",
      bWritesAsA.denied && bWritesAsA.code === "42501",
      `expected a refusal, got ${bWritesAsA.denied ? bWritesAsA.code : "it succeeded"}`);

    const unclaimed = await refused("authenticated", B.user_id,
      "INSERT INTO storage.objects (bucket_id, name) VALUES ('gallery-images', $1)",
      ["00000000-0000-0000-0000-000000000000/anything.jpg"]);
    record("P-32", "nobody can write bytes under a key no image row claims",
      unclaimed.denied && unclaimed.code === "42501",
      `expected a refusal, got ${unclaimed.denied ? unclaimed.code : "it succeeded"}`);
  } else {
    for (const [id, title] of [["P-29", "published image bytes readable"],
                               ["P-30", "draft image bytes not readable"],
                               ["P-31", "no writing under another maker's key"],
                               ["P-32", "no writing under an unclaimed key"]] as const) {
      record(id, title, false, "no seeded images — run: npm run db:seed");
    }
  }

  // ---------------------------------------------------------------- account email privacy
  const emails = await owner.query<{ email: string }>("SELECT email FROM auth.users WHERE email IS NOT NULL");
  const views = ["public_works", "public_makers", "public_work_images", "public_contact_routes",
                 "public_work_endings"];
  let leak = "";
  for (const v of views) {
    const rows = await asRole("anon", null, (c) => c.query(`SELECT * FROM ${v}`));
    const blob = JSON.stringify(rows.rows).toLowerCase();
    for (const e of emails.rows) {
      if (blob.includes(e.email.toLowerCase())) leak += `${v} contains ${e.email}; `;
    }
  }
  record("P-18", "no account email appears in any public view", leak === "", leak || "clean");

  // ---------------------------------------------------------------- no commerce, no counts
  // Co-tenancy: this product must own exactly one schema and leave `public` alone, because
  // the database it runs in belongs to another product as well.
  const strays = await owner.query<{ table_name: string }>(
    `SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('makers','galleries','works','work_images','contact_routes',
                           'operator_actions','write_intents','operational_failures',
                           'material_categories','operators','account_closures')`);
  record("P-21", "this product created nothing in the public schema", strays.rowCount === 0,
    `found in public: ${strays.rows.map((r) => r.table_name).join(", ")}`);

  const owned = await owner.query<{ n: number }>(
    `SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema = $1`, [SCHEMA]);
  record("P-22", `the product's tables live in the ${SCHEMA} schema (anti-vacuous)`,
    (owned.rows[0].n as number) >= 9, `only ${owned.rows[0].n} tables found in ${SCHEMA}`);

  const commerce = await owner.query<{ n: number }>(
    `SELECT count(*)::int AS n FROM information_schema.tables
      WHERE table_schema = $1
        AND table_name ~ '(cart|checkout|order|payment|wallet|escrow|refund|shipping|dispute)'`, [SCHEMA]);
  record("P-19", "no transaction table exists in the schema", (commerce.rows[0].n as number) === 0,
    `${commerce.rows[0].n} transaction tables found`);

  const counts = await owner.query<{ n: number }>(
    `SELECT count(*)::int AS n FROM information_schema.columns
      WHERE table_schema = $1
        AND column_name ~ '(like_count|likes|follower|following|reaction|comment_count|view_count|popularity)'`, [SCHEMA]);
  record("P-20", "no engagement-count column exists in the schema", (counts.rows[0].n as number) === 0,
    `${counts.rows[0].n} engagement columns found`);

  await owner.end();

  const failed = results.filter((r) => r.verdict === "FAIL");
  console.log(`\npolicy probes: ${results.length - failed.length}/${results.length} passed`);
  process.exit(failed.length ? 1 : 0);
}

await main();
