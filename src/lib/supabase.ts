import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * The one place this product talks to Supabase.
 *
 * Decision GAL-SUPA-1: the application is an ordinary Supabase client. It holds no database
 * connection, mints no session and knows no password. PostgREST holds the connection and
 * switches into `anon` or `authenticated` according to the token this client sends; the
 * policies in db/migrations decide the rest.
 *
 * There is no service-role client here, and that is deliberate rather than pending. A key
 * that bypasses row-level security, held by the thing serving public requests, makes every
 * policy in this product advisory. Both clients below are bounded by the same policies as any
 * other caller — the difference between them is only whose token is attached.
 */

const SCHEMA = process.env.GALLERY_SCHEMA ?? "gallery";

function config() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY must be set; see .env.example");
  }
  return { url, key };
}

/**
 * The client type, with supabase-js's default generics.
 *
 * There are no generated database types here, and adding them would be a second description of
 * a schema that db/migrations already defines — one that goes stale silently the first time a
 * migration lands without someone remembering to regenerate. The checks that matter are in the
 * database: grants, policies, and the VERIFY blocks. TypeScript is not the thing keeping a
 * maker out of another maker's rows.
 */
export type Db = SupabaseClient;

/**
 * A client carrying the caller's session, read from and written back to the request's cookies.
 *
 * Every read and write through this is subject to row-level security as that person — or as
 * `anon` when nobody is signed in, which is the correct default rather than a failure.
 */
export async function client(): Promise<Db> {
  const { url, key } = config();
  const jar = await cookies();
  return createServerClient(url, key, {
    db: { schema: SCHEMA },
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) jar.set(name, value, options);
        } catch {
          // Server Components may not set cookies. The session is refreshed by the middleware
          // instead, which runs where it can; swallowing here is the documented arrangement,
          // not a lost write.
        }
      },
    },
  }) as unknown as Db;
}

/**
 * A client with no session attached at all, for surfaces a visitor reaches without an account.
 *
 * Distinct from `client()` on purpose. A public page that happens to be viewed by a signed-in
 * maker must render what a stranger would see, or the maker's own drafts leak into a surface
 * everyone else sees differently — and nobody would notice, because the person testing it is
 * signed in.
 */
export async function anon(): Promise<Db> {
  const { url, key } = config();
  return createServerClient(url, key, {
    db: { schema: SCHEMA },
    cookies: { getAll: () => [], setAll: () => {} },
  }) as unknown as Db;
}

/**
 * PostgREST reports a refusal as a code, not an exception. `42501` is the database refusing —
 * a missing grant or a policy that did not match — and it is never something to retry or to
 * paper over with an empty state.
 */
export function refused(error: { code?: string } | null): boolean {
  return error?.code === "42501" || error?.code === "PGRST301";
}

export function must<T>(result: { data: T | null; error: { message: string; code?: string } | null },
                        what: string): T {
  if (result.error) throw new Error(`${what}: ${result.error.message} (${result.error.code ?? "?"})`);
  if (result.data === null) throw new Error(`${what}: no data and no error, which should not happen`);
  return result.data;
}
