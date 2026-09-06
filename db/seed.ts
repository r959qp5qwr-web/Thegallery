/**
 * Synthetic fixtures. Every persona, address and route value here is invented, and the
 * contact values use reserved test domains and the reserved +99 country code range so that
 * nothing in this repository can reach a real person (DOMAIN_MODEL §7, GAL-G4).
 *
 * The seed creates accounts and identities only. It does NOT create works or publish
 * anything: the vertical slice is proved by walking the product, and a seed that pre-baked a
 * published work would be proving the seed.
 */
import { Client } from "pg";
import { hashPassword } from "../src/lib/password.ts";

const OWNER = process.env.DATABASE_URL_OWNER ?? "postgres://postgres@127.0.0.1:5432/gallery";
const SCHEMA = process.env.GALLERY_SCHEMA ?? "gallery";

export const PERSONAS = {
  makerA: { email: "anika.rao@makers.example", password: "kiln-and-monsoon-9", handle: "anika-rao",
            display_name: "Anika Rao", kind: "individual", city: "Bengaluru",
            practice_note: "I fire in a wood kiln outside the city. Ash settles where it wants to; I decide "
                         + "only where the pot stands in the fire." },
  makerB: { email: "studio@dhaaga.example", password: "warp-and-weft-11", handle: "dhaaga-studio",
            display_name: "Dhaaga Studio", kind: "collective", city: "Bengaluru",
            practice_note: "Six weavers, one loom room, natural dyes." },
  operator: { email: "operator@thegallery.example", password: "operator-of-record-7" },
};

async function main() {
  const db = new Client({ connectionString: OWNER });
  await db.connect();
  await db.query(`SET search_path = "${SCHEMA}"`);
  try {
    for (const p of [PERSONAS.makerA, PERSONAS.makerB]) {
      const hash = await hashPassword(p.password);
      const acct = await db.query<{ id: string }>(
        `INSERT INTO auth_accounts (email, password_hash, access_state, email_confirmed_at)
         VALUES ($1, $2, 'active', now())
         ON CONFLICT (email_normalised) DO UPDATE SET password_hash = EXCLUDED.password_hash
         RETURNING id`, [p.email, hash]);
      const maker = await db.query<{ id: string }>(
        `INSERT INTO makers (account_id, handle, display_name, kind, city, practice_note)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (account_id) DO UPDATE SET display_name = EXCLUDED.display_name
         RETURNING id`,
        [acct.rows[0].id, p.handle, p.display_name, p.kind, p.city, p.practice_note]);
      await db.query(
        `INSERT INTO galleries (maker_id) VALUES ($1) ON CONFLICT (maker_id) DO NOTHING`,
        [maker.rows[0].id]);
      console.log(`  maker ${p.display_name} (${p.email})`);
    }

    const opHash = await hashPassword(PERSONAS.operator.password);
    await db.query(
      `INSERT INTO auth_accounts (email, password_hash, access_state, email_confirmed_at, is_operator)
       VALUES ($1, $2, 'active', now(), true)
       ON CONFLICT (email_normalised) DO UPDATE SET is_operator = true, password_hash = EXCLUDED.password_hash`,
      [PERSONAS.operator.email, opHash]);
    console.log(`  operator (${PERSONAS.operator.email})`);
  } finally {
    await db.end();
  }
}

await main();
