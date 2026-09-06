// Migration runner. Applies db/migrations/*.sql in order against DATABASE_URL_OWNER.
// Deliberately dependency-free and reproducible: `npm run db:reset` from an empty cluster
// produces the exact schema the tests and the product run against.
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";

const HERE = dirname(fileURLToPath(import.meta.url));
const OWNER = process.env.DATABASE_URL_OWNER ?? "postgres://postgres@127.0.0.1:5432/gallery";
const ADMIN = process.env.DATABASE_URL_ADMIN ?? "postgres://postgres@127.0.0.1:5432/postgres";
const DB = process.env.GALLERY_DB ?? "gallery";

async function run(url: string, sql: string) {
  const c = new Client({ connectionString: url });
  await c.connect();
  try { await c.query(sql); } finally { await c.end(); }
}

// DROP/CREATE DATABASE cannot run inside a transaction block, and node-postgres sends a
// multi-statement string as one implicit transaction, so these go one statement at a time.
async function runEach(url: string, statements: string[]) {
  const c = new Client({ connectionString: url });
  await c.connect();
  try { for (const s of statements) await c.query(s); } finally { await c.end(); }
}

async function migrate() {
  const dir = join(HERE, "migrations");
  for (const f of readdirSync(dir).filter((n) => n.endsWith(".sql")).sort()) {
    process.stdout.write(`  ${f} … `);
    await run(OWNER, readFileSync(join(dir, f), "utf8"));
    process.stdout.write("ok\n");
  }
}

const cmd = process.argv[2];
if (cmd === "reset") {
  await runEach(ADMIN, [`DROP DATABASE IF EXISTS ${DB} WITH (FORCE)`, `CREATE DATABASE ${DB}`]);
  console.log(`database ${DB} recreated`);
  await migrate();
} else if (cmd === "migrate") {
  await migrate();
} else {
  console.error("usage: db/cli.ts reset|migrate");
  process.exit(2);
}
