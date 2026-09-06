import { Pool, type PoolClient } from "pg";

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

function pool(): Pool {
  if (!global.__galleryPool) {
    const connectionString = process.env.DATABASE_URL_APP;
    if (!connectionString) throw new Error("DATABASE_URL_APP is not set (see .env.example)");
    global.__galleryPool = new Pool({ connectionString, max: 8, idleTimeoutMillis: 10_000 });
  }
  return global.__galleryPool;
}

export type Db = PoolClient;

// The product owns one schema and never `public`. Every connection sets it explicitly rather
// than relying on a role's default search_path, so a shared database cannot resolve one of
// this product's names to another product's table.
const SCHEMA = process.env.GALLERY_SCHEMA ?? "gallery";
if (!/^[a-z_][a-z0-9_]{0,62}$/.test(SCHEMA)) throw new Error(`unsafe GALLERY_SCHEMA: ${SCHEMA}`);

async function inRole<T>(role: "gallery_anon" | "gallery_auth", accountId: string | null,
                         fn: (db: Db) => Promise<T>): Promise<T> {
  const c = await pool().connect();
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
    c.release();
  }
}

/** Anonymous request: reaches the public views and nothing else. */
export const asAnon = <T>(fn: (db: Db) => Promise<T>) => inRole("gallery_anon", null, fn);

/** Signed-in request: reaches its own maker's rows through row-level security. */
export const asAccount = <T>(accountId: string, fn: (db: Db) => Promise<T>) =>
  inRole("gallery_auth", accountId, fn);

// The authentication tables are deliberately unreachable from either request role: a session
// lookup happens before an identity exists, so it runs on a separate owner connection that
// touches auth tables only. Keeping it separate is what stops "read the session" from
// becoming a general-purpose privileged read inside request code.
let authPool: Pool | undefined;
export async function asAuthStore<T>(fn: (db: Db) => Promise<T>): Promise<T> {
  if (!authPool) {
    const connectionString = process.env.DATABASE_URL_OWNER;
    if (!connectionString) throw new Error("DATABASE_URL_OWNER is not set (see .env.example)");
    authPool = new Pool({ connectionString, max: 4, idleTimeoutMillis: 10_000 });
  }
  const c = await authPool.connect();
  try {
    await c.query(`SET search_path = "${SCHEMA}"`);
    return await fn(c);
  } finally { c.release(); }
}
