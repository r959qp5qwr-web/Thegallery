import { Client } from "pg";
import type { Page } from "@playwright/test";

const OWNER = process.env.DATABASE_URL_OWNER ?? "postgres://postgres@127.0.0.1:5432/gallery";

const SCHEMA = process.env.GALLERY_SCHEMA ?? "gallery";

export async function owner<T>(fn: (c: Client) => Promise<T>): Promise<T> {
  const c = new Client({ connectionString: OWNER });
  await c.connect();
  try {
    await c.query(`SET search_path = "${SCHEMA}"`);
    return await fn(c);
  } finally { await c.end(); }
}

/**
 * The confirmation or recovery link a person would read in their email.
 *
 * GALLERY_MAIL=outbox writes the message to dev_outbox and sends nothing, so this reads the
 * row. It proves the link is minted, addressed and single-use. It does NOT prove an email
 * round trip: no message left this machine, and no test here may claim one did.
 */
export async function linkFromOutbox(toEmail: string, contains: string): Promise<string> {
  return owner(async (c) => {
    const r = await c.query<{ link: string }>(
      `SELECT link FROM dev_outbox WHERE lower(to_email) = lower($1) AND link ILIKE $2
        ORDER BY created_at DESC LIMIT 1`, [toEmail, `%${contains}%`]);
    if (!r.rowCount) throw new Error(`no outbox message for ${toEmail} matching ${contains}`);
    return r.rows[0].link;
  });
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
