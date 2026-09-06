import { Client, Pool, type PoolClient } from "pg";

// One pool, connecting as gallery_app — a role with no privileges of its own. Every request
// runs inside a transaction that adopts either gallery_anon or gallery_auth and declares the
// account it is acting for. The database then decides what the request may see: the policies
// in db/migrations/002 are the permission model, and this file is only the door to them.
//
// Nothing in the application may connect as the owner. If it did, PostgreSQL would bypass
// every policy and the isolation proof would be theatre.

declare global {
  // eslint-disable-next-line no-var
  var __galleryPool: Pool | undefined;
}

/**
 * Where the connection string comes from, and why it differs by runtime.
 *
 * On Cloudflare there is no long-lived process to keep a pool warm in, and Hyperdrive already
 * holds the pool on Cloudflare's side. So a Worker takes ONE client per request from the
 * binding's connection string and closes it. Under Node the opposite is true and a real pool
 * is right. Both paths run the same SQL through the same roles; only the connection lifetime
 * differs, which is the honest place for a runtime to differ.
 */
async function connectionString(): Promise<{ url: string; workers: boolean }> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const ctx = await getCloudflareContext({ async: true });
    const hyperdrive = (ctx.env as { HYPERDRIVE?: { connectionString: string } }).HYPERDRIVE;
    if (hyperdrive?.connectionString) return { url: hyperdrive.connectionString, workers: true };
  } catch {
    /* not running on Workers */
  }
  const url = process.env.DATABASE_URL_APP;
  if (!url) throw new Error("no database connection: neither a HYPERDRIVE binding nor DATABASE_URL_APP");
  return { url, workers: false };
}

function pool(url: string): Pool {
  if (!global.__galleryPool) {
    global.__galleryPool = new Pool({ connectionString: url, max: 8, idleTimeoutMillis: 10_000 });
  }
  return global.__galleryPool;
}

export type Db = PoolClient | Client;

// The product owns one schema and never `public`. Every connection sets it explicitly rather
// than relying on a role's default search_path, so a shared database cannot resolve one of
// this product's names to another product's table.
const SCHEMA = process.env.GALLERY_SCHEMA ?? "gallery";
if (!/^[a-z_][a-z0-9_]{0,62}$/.test(SCHEMA)) throw new Error(`unsafe GALLERY_SCHEMA: ${SCHEMA}`);

async function inRole<T>(role: "gallery_anon" | "gallery_auth" | "gallery_authstore",
                         accountId: string | null,
                         fn: (db: Db) => Promise<T>): Promise<T> {
  const { url, workers } = await connectionString();
  const client = workers ? new Client({ connectionString: url }) : null;
  if (client) await client.connect();
  const c = (client ?? await pool(url).connect()) as Db;
  try {
    await c.query("BEGIN");
    // SET LOCAL ROLE is transaction-scoped, so a leaked connection cannot carry elevated
    // rights into the next request.
    await c.query(`SET LOCAL ROLE ${role}`);
    await c.query(`SET LOCAL search_path = "${SCHEMA}"`);
    await c.query("SELECT set_config('thegallery.account_id', $1, true)", [accountId ?? ""]);
    const out = await fn(c);
    await c.query("COMMIT");
    return out;
  } catch (e) {
    try { await c.query("ROLLBACK"); } catch { /* the connection is going back to the pool anyway */ }
    throw e;
  } finally {
    if (client) await client.end(); else (c as PoolClient).release();
  }
}

/** Anonymous request: reaches the public views and nothing else. */
export const asAnon = <T>(fn: (db: Db) => Promise<T>) => inRole("gallery_anon", null, fn);

/** Signed-in request: reaches its own maker's rows through row-level security. */
export const asAccount = <T>(accountId: string, fn: (db: Db) => Promise<T>) =>
  inRole("gallery_auth", accountId, fn);

/**
 * The authentication tables, reached as `gallery_authstore`.
 *
 * A session lookup happens before an identity exists, so it cannot be scoped by row-level
 * security the way every other read is. It used to run on the OWNER connection, which was
 * tolerable on a server and is not on Cloudflare — an edge Worker would carry owner
 * credentials for a database shared with another product.
 *
 * So it runs on the same connection as everything else and adopts a role that can reach the
 * four authentication tables and nothing else: no grant on makers, works, images, routes or
 * the operator record. "Read the session" cannot become a general-purpose privileged read,
 * and the limit is a grant in the database rather than a habit in this file.
 */
export async function asAuthStore<T>(fn: (db: Db) => Promise<T>): Promise<T> {
  return inRole("gallery_authstore", null, fn);
}
