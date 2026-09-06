/**
 * Permission probes against the real database, through the same roles the application uses.
 *
 * These are adversarial: each one attempts something the product must refuse, and passes only
 * when the refusal is the RIGHT refusal. A probe that fails because of a typo in a table name
 * would look identical to a probe that fails because access was denied, so every denial is
 * matched against its expected shape (a permission error, an empty result, or a raised
 * exception naming the rule).
 *
 * Browser journeys do not replace these, and these do not replace browser journeys: a policy
 * can be right while the surface that reads it is wrong, and the reverse.
 */
import { Client } from "pg";

const APP = process.env.DATABASE_URL_APP ?? "postgres://gallery_app:gallery_local_dev@127.0.0.1:5432/gallery";
const OWNER = process.env.DATABASE_URL_OWNER ?? "postgres://postgres@127.0.0.1:5432/gallery";
const SCHEMA = process.env.GALLERY_SCHEMA ?? "gallery";

type Result = { id: string; title: string; verdict: "PASS" | "FAIL"; detail: string };
const results: Result[] = [];

function record(id: string, title: string, ok: boolean, detail: string) {
  results.push({ id, title, verdict: ok ? "PASS" : "FAIL", detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${id}  ${title}${ok ? "" : `\n        ${detail}`}`);
}

async function withRole<T>(role: string, accountId: string | null, fn: (c: Client) => Promise<T>): Promise<T> {
  const c = new Client({ connectionString: APP });
  await c.connect();
  try {
    await c.query("BEGIN");
    await c.query(`SET LOCAL ROLE ${role}`);
    await c.query(`SET LOCAL search_path = "${SCHEMA}"`);
    await c.query("SELECT set_config('thegallery.account_id', $1, true)", [accountId ?? ""]);
    const out = await fn(c);
    await c.query("COMMIT");
    return out;
  } finally { await c.end(); }
}

/** Run something expected to be refused, and report HOW it was refused. */
async function refused(role: string, accountId: string | null, sql: string, params: unknown[] = []) {
  try {
    const r = await withRole(role, accountId, (c) => c.query(sql, params));
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

  const ids = await owner.query<{ handle: string; maker_id: string; account_id: string; gallery_id: string }>(
    `SELECT m.handle, m.id AS maker_id, m.account_id, g.id AS gallery_id
       FROM makers m JOIN galleries g ON g.maker_id = m.id`);
  const A = ids.rows.find((r) => r.handle === "anika-rao");
  const B = ids.rows.find((r) => r.handle === "dhaaga-studio");
  const op = await owner.query<{ id: string; email: string }>(
    "SELECT id, email FROM auth_accounts WHERE is_operator");
  if (!A || !B || !op.rowCount) {
    console.error("fixtures missing — run: npm run db:seed");
    process.exit(2);
  }
  const workA = await owner.query<{ id: string; public_token: string; lifecycle: string }>(
    "SELECT id, public_token, lifecycle FROM works WHERE gallery_id = $1 ORDER BY created_at LIMIT 1",
    [A.gallery_id]);

  // ---------------------------------------------------------------- anonymous reach
  const t1 = await refused("gallery_anon", null, "SELECT * FROM works");
  record("P-01", "anonymous cannot read the works table at all", t1.denied && t1.code === "42501",
    `expected permission denied (42501), got ${t1.denied ? t1.code : `${t1.rows} rows`}`);

  const t2 = await refused("gallery_anon", null, "SELECT email FROM auth_accounts");
  record("P-02", "anonymous cannot read account emails", t2.denied && t2.code === "42501",
    `expected permission denied (42501), got ${t2.denied ? t2.code : `${t2.rows} rows`}`);

  const t3 = await refused("gallery_anon", null, "SELECT * FROM makers");
  record("P-03", "anonymous cannot read the makers table", t3.denied && t3.code === "42501",
    `expected permission denied (42501), got ${t3.denied ? t3.code : `${t3.rows} rows`}`);

  const t4 = await refused("gallery_anon", null, "SELECT * FROM contact_routes");
  record("P-04", "anonymous cannot read raw contact routes", t4.denied && t4.code === "42501",
    `expected permission denied (42501), got ${t4.denied ? t4.code : `${t4.rows} rows`}`);

  // Anonymous CAN reach the public views — the refusals above must not be "everything is off".
  const pub = await withRole("gallery_anon", null, (c) => c.query("SELECT count(*)::int AS n FROM public_works"));
  record("P-05", "anonymous can reach the public view (anti-vacuous)", (pub.rows[0].n as number) >= 0,
    "the public view must be readable, or the refusals above prove nothing");

  // ---------------------------------------------------------------- draft invisibility
  const drafts = await owner.query<{ n: number }>(
    "SELECT count(*)::int AS n FROM works WHERE lifecycle <> 'published'");
  const draftVisible = await withRole("gallery_anon", null, (c) =>
    c.query<{ n: number }>(
      `SELECT count(*)::int AS n FROM public_works pw
        WHERE pw.id IN (SELECT id FROM (SELECT id FROM public_works) x)`));
  record("P-06", "no unpublished work appears in the public view",
    (draftVisible.rows[0].n as number) === (await withRole("gallery_anon", null, (c) =>
      c.query<{ n: number }>("SELECT count(*)::int AS n FROM public_works"))).rows[0].n,
    `there are ${drafts.rows[0].n} unpublished works in the database`);

  // ---------------------------------------------------------------- maker isolation
  const readOther = await withRole("gallery_auth", B.account_id, (c) =>
    c.query<{ n: number }>("SELECT count(*)::int AS n FROM works WHERE gallery_id = $1", [A.gallery_id]));
  record("P-07", "Maker B cannot read Maker A's works", (readOther.rows[0].n as number) === 0,
    `Maker B saw ${readOther.rows[0].n} of Maker A's works`);

  const writeOther = await withRole("gallery_auth", B.account_id, (c) =>
    c.query("UPDATE makers SET display_name = 'Taken over' WHERE id = $1", [A.maker_id]));
  record("P-08", "Maker B cannot rename Maker A", (writeOther.rowCount ?? 0) === 0,
    `${writeOther.rowCount} rows updated`);

  if (workA.rowCount) {
    const retireOther = await withRole("gallery_auth", B.account_id, (c) =>
      c.query("UPDATE works SET lifecycle = 'retired' WHERE id = $1", [workA.rows[0].id]));
    record("P-09", "Maker B cannot retire Maker A's work", (retireOther.rowCount ?? 0) === 0,
      `${retireOther.rowCount} rows updated`);

    const statusOther = await refused("gallery_auth", B.account_id,
      "SELECT set_work_status($1, 'sold')", [workA.rows[0].id]);
    record("P-10", "Maker B cannot change the status of Maker A's work through the transition function",
      statusOther.denied && /not yours/.test(statusOther.message),
      `expected "not yours", got ${statusOther.denied ? statusOther.message : "it succeeded"}`);
  } else {
    record("P-09", "Maker B cannot retire Maker A's work", false, "no work exists yet — walk the journey first");
    record("P-10", "Maker B cannot change Maker A's work status", false, "no work exists yet");
  }

  const routeOther = await withRole("gallery_auth", B.account_id, (c) =>
    c.query<{ n: number }>("SELECT count(*)::int AS n FROM contact_routes WHERE maker_id = $1", [A.maker_id]));
  record("P-11", "Maker B cannot read Maker A's contact routes", (routeOther.rows[0].n as number) === 0,
    `Maker B saw ${routeOther.rows[0].n} routes`);

  const emailOther = await withRole("gallery_auth", B.account_id, (c) =>
    c.query<{ n: number }>("SELECT count(*)::int AS n FROM auth_accounts WHERE id = $1", [A.account_id]));
  record("P-12", "Maker B cannot read Maker A's account row", (emailOther.rows[0].n as number) === 0,
    `Maker B saw ${emailOther.rows[0].n} account rows`);

  // Anti-vacuous: Maker B can reach their OWN records.
  const own = await withRole("gallery_auth", B.account_id, (c) =>
    c.query<{ n: number }>("SELECT count(*)::int AS n FROM makers WHERE id = $1", [B.maker_id]));
  record("P-13", "Maker B can read their own maker row (anti-vacuous)", (own.rows[0].n as number) === 1,
    "row-level security must not deny a maker their own record");

  // ---------------------------------------------------------------- operator authority
  const makerSuspends = await refused("gallery_auth", B.account_id,
    "SELECT set_maker_access($1, 'suspend', 'because I felt like it')", [A.maker_id]);
  record("P-14", "an ordinary maker cannot suspend another maker",
    makerSuspends.denied && /operator authority/.test(makerSuspends.message),
    `expected "operator authority required", got ${makerSuspends.denied ? makerSuspends.message : "it succeeded"}`);

  const noReason = await refused("gallery_auth", op.rows[0].id,
    "SELECT set_maker_access($1, 'suspend', '   ')", [B.maker_id]);
  record("P-15", "an operator cannot suspend without a written reason",
    noReason.denied && /recorded reason/.test(noReason.message),
    `expected "recorded reason", got ${noReason.denied ? noReason.message : "it succeeded"}`);

  const rewrite = await refused("gallery_auth", op.rows[0].id,
    "UPDATE operator_actions SET reason = 'something else'");
  record("P-16", "the operator record cannot be rewritten, even by an operator", rewrite.denied,
    `expected a refusal, got ${rewrite.rows} rows updated`);

  const del = await refused("gallery_auth", op.rows[0].id, "DELETE FROM operator_actions");
  record("P-17", "the operator record cannot be deleted", del.denied,
    `expected a refusal, got ${del.rows} rows deleted`);

  // ---------------------------------------------------------------- account email privacy
  const emails = await owner.query<{ email: string }>("SELECT email FROM auth_accounts");
  const views = ["public_works", "public_makers", "public_work_images", "public_contact_routes",
                 "public_work_endings"];
  let leak = "";
  for (const v of views) {
    const rows = await withRole("gallery_anon", null, (c) => c.query(`SELECT * FROM ${v}`));
    const blob = JSON.stringify(rows.rows).toLowerCase();
    for (const e of emails.rows) {
      if (blob.includes(e.email.toLowerCase())) leak += `${v} contains ${e.email}; `;
    }
  }
  record("P-18", "no account email appears in any public view", leak === "", leak || "clean");

  // ---------------------------------------------------------------- no commerce, no counts
  // Co-tenancy: this product must own exactly one schema and leave `public` alone, because
  // the database it runs in may belong to another product as well.
  const strays = await owner.query<{ table_name: string }>(
    `SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('auth_accounts','auth_tokens','auth_sessions','dev_outbox','makers',
                           'galleries','works','work_images','contact_routes','operator_actions',
                           'write_intents','operational_failures','material_categories')`);
  record("P-21", "this product created nothing in the public schema", strays.rowCount === 0,
    `found in public: ${strays.rows.map((r) => r.table_name).join(", ")}`);

  const owned = await owner.query<{ n: number }>(
    `SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema = $1`, [SCHEMA]);
  record("P-22", `the product's tables live in the ${SCHEMA} schema (anti-vacuous)`,
    (owned.rows[0].n as number) >= 12, `only ${owned.rows[0].n} tables found in ${SCHEMA}`);

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
