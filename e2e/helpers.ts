import type { Page } from "@playwright/test";

/**
 * Owner access for the journeys, over HTTPS.
 *
 * The journeys run against a hosted TEST project (thegallery-test). Its Postgres ports are not
 * reachable from the build environment, so owner reads and writes go through the Supabase
 * Management API's SQL endpoint, authorised by a token the environment's proxy injects.
 *
 * HARD GUARD: the project ref is a constant, and anything that would point a journey at the
 * live product is refused before a request is made. A journey deletes rows; it must never be
 * able to delete them from the gallery people actually visit.
 */
export const TEST_REF = "fbgrumcwlnoljkkbiqfe";
const LIVE_REF = "kemrceegbyizpcfewgri";
const SCHEMA = process.env.GALLERY_SCHEMA ?? "gallery";

function guard(): void {
  const base = process.env.GALLERY_BASE_URL ?? "";
  const url = process.env.SUPABASE_URL ?? "";
  if (/atthegallery\.in/i.test(base)) throw new Error("journeys refuse the live site as GALLERY_BASE_URL");
  if (url.includes(LIVE_REF)) throw new Error("journeys refuse the live Supabase project");
  if (url && !url.includes(TEST_REF)) throw new Error(`journeys run only against ${TEST_REF}, not ${url}`);
}

// Values are inlined as SQL literals: the Management API takes one query string. Only strings,
// numbers, booleans and null are accepted, and strings are quoted the way Postgres quotes them,
// so a value can never close its literal.
function literal(v: unknown): string {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "string") return "'" + v.replace(/'/g, "''") + "'";
  throw new Error(`unsupported SQL parameter: ${typeof v}`);
}

export function bind(text: string, params: unknown[] = []): string {
  return text.replace(/\$(\d+)/g, (_, n: string) => {
    const i = Number(n) - 1;
    if (i < 0 || i >= params.length) throw new Error(`missing parameter $${n}`);
    return literal(params[i]);
  });
}

export async function sql<R = Record<string, unknown>>(text: string, params: unknown[] = []): Promise<R[]> {
  guard();
  const query = `SET search_path = "${SCHEMA}", public;\n` + bind(text, params);
  // A gateway error (502/503/504) from the Management API is the platform, not the product: one
  // retry after a pause. Only reads and idempotent writes go through here (SELECT, DELETE,
  // UPDATE to a fixed value), so a retried query cannot double an effect. Any other status fails
  // at once. Seen 2026-11-06: two desktop journeys failed on a 502 page, the app untouched.
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(`https://api.supabase.com/v1/projects/${TEST_REF}/database/query`, {
      method: "POST",
      // The real token is injected by the environment's network proxy; this value is replaced.
      headers: { "Content-Type": "application/json", Authorization: "Bearer proxy-injected" },
      body: JSON.stringify({ query }),
    });
    const body = await res.text();
    if (res.ok) return JSON.parse(body) as R[];
    if (attempt === 1 && [502, 503, 504].includes(res.status) && !/\bINSERT\b/i.test(text)) {
      await new Promise((r) => setTimeout(r, 3_000));
      continue;
    }
    throw new Error(`owner SQL failed (${res.status}): ${body.slice(0, 300)}`);
  }
}

/** A pg-shaped client, so the journeys keep their `owner((c) => c.query(...))` form. */
export type OwnerClient = {
  query<R = Record<string, unknown>>(text: string, params?: unknown[]): Promise<{ rows: R[]; rowCount: number }>;
};

export async function owner<T>(fn: (c: OwnerClient) => Promise<T>): Promise<T> {
  const c: OwnerClient = {
    async query<R>(text: string, params: unknown[] = []) {
      const rows = await sql<R>(text, params);
      return { rows, rowCount: rows.length };
    },
  };
  return fn(c);
}

/**
 * The confirmation or recovery link a person would read in their email.
 *
 * On the test project a Send Email auth hook writes every message to test_support.outbox
 * instead of sending it (e2e/support/test-project.sql). This reads that row. It proves the
 * link is minted, addressed and single-use. It does NOT prove an email round trip: no message
 * left the project, and no test here may claim one did.
 */
export async function linkFromOutbox(toEmail: string, contains: string): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const rows = await sql<{ link: string }>(
      `SELECT link FROM test_support.outbox WHERE lower(to_email) = lower($1) AND link ILIKE $2
        ORDER BY id DESC LIMIT 1`, [toEmail, `%${contains}%`]);
    if (rows.length) return rows[0].link;
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`no outbox message for ${toEmail} matching ${contains}`);
}

/** Remove a person entirely: their auth identity, the product's record (by cascade), closures, mail. */
export async function forgetPerson(email: string): Promise<void> {
  await sql(
    `DELETE FROM account_closures WHERE user_id IN (SELECT id FROM auth.users WHERE lower(email) = lower($1));
     DELETE FROM test_support.outbox WHERE lower(to_email) = lower($1);
     DELETE FROM auth.users WHERE lower(email) = lower($1)`, [email]);
}

export async function signIn(page: Page, email: string, password: string, expectSuccess = true) {
  await page.goto("/makers/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  // Wait for the door to answer. Without this the next navigation races the redirect and
  // lands back on the form, which looks exactly like a permission failure and is not one.
  if (expectSuccess) await page.waitForURL((u) => !u.pathname.includes("/sign-in"), { timeout: 15_000 });
}

export const MAKER_A = { email: "anika.rao@makers.example", password: "kiln-and-monsoon-9" };
export const MAKER_B = { email: "studio@dhaaga.example", password: "warp-and-weft-11" };
export const OPERATOR = { email: "operator@thegallery.example", password: "operator-of-record-7" };

// Reserved values only: .example is reserved by RFC 2606 and +99 is an unassigned country
// code, so nothing here can reach a real person.
export const ROUTE_WHATSAPP = "+999700000001";
export const ROUTE_EMAIL = "studio@anikarao.example";
