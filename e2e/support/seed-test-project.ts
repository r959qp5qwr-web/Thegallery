/**
 * Journey fixtures on the hosted TEST project (thegallery-test). Never the live project:
 * every database call goes through e2e/helpers.ts, which refuses any other project.
 *
 * The three people are created through Supabase Auth's own sign-up and confirmed with the
 * token hash the Send Email hook recorded, so a seeded maker holds a real password and a real
 * confirmed identity, exactly like a person who came through the door. Only the product's own
 * rows (maker profile, gallery, operator authority) are written directly.
 *
 * Synthetic people and reserved values only: `.example` is reserved by RFC 2606.
 *
 * Run: NODE_USE_ENV_PROXY=1 node --experimental-strip-types e2e/support/seed-test-project.ts
 */
import { sql, TEST_REF, MAKER_A, MAKER_B, OPERATOR } from "../helpers.ts";

const AUTH = `https://${TEST_REF}.supabase.co/auth/v1`;
// The publishable key is meant to be public; it is the same value the app is given.
const KEY = process.env.SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_0KNPc4WopVsLNttgeBD43A_O6yyDiJd";
const REDIRECT = `${process.env.GALLERY_BASE_URL ?? "http://127.0.0.1:3100"}/makers/confirm`;

const PROFILES = [
  { who: MAKER_A, handle: "anika-rao", display_name: "Anika Rao", kind: "individual", city: "Bengaluru",
    practice_note: "I fire in a wood kiln outside the city. Ash settles where it wants to; I decide "
                 + "only where the pot stands in the fire." },
  { who: MAKER_B, handle: "dhaaga-studio", display_name: "Dhaaga Studio", kind: "collective", city: "Bengaluru",
    practice_note: "Six weavers, one loom room, natural dyes." },
];

async function auth(path: string, body: unknown): Promise<void> {
  const res = await fetch(`${AUTH}${path}`, {
    method: "POST",
    headers: { apikey: KEY, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${path} failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
}

async function person(email: string, password: string): Promise<string> {
  const existing = await sql<{ id: string; confirmed: boolean }>(
    `SELECT id, email_confirmed_at IS NOT NULL AS confirmed FROM auth.users WHERE lower(email) = lower($1)`, [email]);
  if (existing.length && existing[0].confirmed) return existing[0].id;

  if (!existing.length) await auth(`/signup?redirect_to=${encodeURIComponent(REDIRECT)}`, { email, password });
  const mail = await sql<{ hash: string }>(
    `SELECT payload->'email_data'->>'token_hash' AS hash FROM test_support.outbox
      WHERE lower(to_email) = lower($1) AND action_type = 'signup' ORDER BY id DESC LIMIT 1`, [email]);
  if (!mail.length) throw new Error(`no confirmation mail recorded for ${email}`);
  await auth("/verify", { type: "email", token_hash: mail[0].hash });

  const row = await sql<{ id: string }>(
    `SELECT id FROM auth.users WHERE lower(email) = lower($1) AND email_confirmed_at IS NOT NULL`, [email]);
  if (!row.length) throw new Error(`${email} did not confirm`);
  return row[0].id;
}

for (const p of PROFILES) {
  const uid = await person(p.who.email, p.who.password);
  await sql(
    `INSERT INTO makers (user_id, handle, display_name, kind, city, practice_note)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (user_id) DO UPDATE SET status = 'active', status_reason = NULL,
       display_name = EXCLUDED.display_name, practice_note = EXCLUDED.practice_note;
     INSERT INTO galleries (maker_id) SELECT id FROM makers WHERE user_id = $1
     ON CONFLICT (maker_id) DO NOTHING`,
    [uid, p.handle, p.display_name, p.kind, p.city, p.practice_note]);
  console.log(`  maker ${p.display_name} (${p.who.email})`);
}

const op = await person(OPERATOR.email, OPERATOR.password);
await sql(`INSERT INTO operators (user_id, note) VALUES ($1, 'journey operator of record')
           ON CONFLICT (user_id) DO NOTHING`, [op]);
console.log(`  operator (${OPERATOR.email})`);
