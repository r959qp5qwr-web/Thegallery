/**
 * Local fixtures for the policy probes.
 *
 * These rows exist so the probes have someone to be refused as. They are NOT the journey
 * fixtures any more: signing in needs GoTrue, which this environment cannot run, so a maker
 * who can actually sign in exists only on a hosted project. What this seeds is identity as
 * the database sees it — a row in auth.users and the product's record of that person.
 *
 * Synthetic makers and reserved values only: `.example` is reserved by RFC 2606, so nothing
 * here can reach a real person.
 */
import { Client } from "pg";

const OWNER = process.env.DATABASE_URL_OWNER ?? "postgres://postgres@127.0.0.1:5432/gallery";
const SCHEMA = process.env.GALLERY_SCHEMA ?? "gallery";

const MAKERS = [
  { email: "anika.rao@makers.example", handle: "anika-rao", name: "Anika Rao",
    kind: "individual", city: "Bengaluru" },
  { email: "studio@dhaaga.example", handle: "dhaaga-studio", name: "Dhaaga Studio",
    kind: "studio", city: "Jaipur" },
];
const OPERATOR = "operator@thegallery.example";
// A person who holds a valid identity in the shared project and has nothing to do with The
// Gallery. GAL-SUPA-1 accepted consequence 1 made this a real case rather than a hypothetical.
const STRANGER = "someone.else@another-product.example";

async function main() {
  const c = new Client({ connectionString: OWNER });
  await c.connect();
  await c.query(`SET search_path = "${SCHEMA}"`);

  const user = async (email: string) => {
    const r = await c.query<{ id: string }>(
      `INSERT INTO auth.users (email, email_confirmed_at) VALUES ($1, now())
       ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email RETURNING id`, [email]);
    return r.rows[0].id;
  };

  for (const m of MAKERS) {
    const uid = await user(m.email);
    const maker = await c.query<{ id: string }>(
      `INSERT INTO makers (user_id, handle, display_name, kind, city)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (user_id) DO UPDATE SET display_name = EXCLUDED.display_name
       RETURNING id`, [uid, m.handle, m.name, m.kind, m.city]);
    await c.query(
      `INSERT INTO galleries (maker_id) VALUES ($1) ON CONFLICT (maker_id) DO NOTHING`,
      [maker.rows[0].id]);
    console.log(`  maker ${m.name} (${m.email})`);
  }

  const opId = await user(OPERATOR);
  await c.query(`INSERT INTO operators (user_id, note) VALUES ($1, 'seed operator of record')
                 ON CONFLICT (user_id) DO NOTHING`, [opId]);
  console.log(`  operator (${OPERATOR})`);

  await user(STRANGER);
  console.log(`  stranger with a valid identity and no maker profile (${STRANGER})`);

  // A published work and a draft, so the isolation probes have something real to be refused.
  // Without them P-09 and P-10 would pass by there being nothing to reach, which is the
  // vacuous kind of green this suite exists to avoid.
  const a = await c.query<{ gallery_id: string }>(
    `SELECT g.id AS gallery_id FROM galleries g JOIN makers m ON m.id = g.maker_id
      WHERE m.handle = 'anika-rao'`);
  const gid = a.rows[0].gallery_id;
  await c.query(`UPDATE galleries SET lifecycle = 'published', published_at = now() WHERE id = $1`, [gid]);

  for (const [token, title, life] of [
    ["seed-published-vessel", "Seeded Vessel", "published"],
    ["seed-draft-vessel", "Seeded Draft", "draft"],
  ] as const) {
    const w = await c.query<{ id: string }>(
      `INSERT INTO works (public_token, gallery_id, title, material, price_mode, lifecycle, published_at)
       VALUES ($1,$2,$3,'clay','enquire',$4, CASE WHEN $4 = 'published' THEN now() END)
       ON CONFLICT (public_token) DO UPDATE SET title = EXCLUDED.title RETURNING id`,
      [token, gid, title, life]);
    await c.query(
      `INSERT INTO work_images (work_id, position, storage_key, width, height, state, alt_text)
       VALUES ($1, 0, $2, 1200, 1600, 'ready', 'a seeded image')
       ON CONFLICT (work_id, position) DO NOTHING`, [w.rows[0].id, `seed-${token}`]);
  }
  console.log("  one published work and one draft, each with a ready image");

  await c.end();
}

await main();
