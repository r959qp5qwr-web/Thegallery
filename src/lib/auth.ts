import { randomBytes, createHash } from "node:crypto";
import { cookies } from "next/headers";
import { asAuthStore } from "./db";
import { deliver } from "./mail";
import { hashPassword, verifyPassword } from "./password";

export { hashPassword, verifyPassword };
const SESSION_COOKIE = "gallery_session";
const SESSION_DAYS = 14;
const CONFIRM_HOURS = 24;
const RESET_HOURS = 2;

export type Account = {
  id: string; email: string; access_state: string;
  email_confirmed_at: string | null; is_operator: boolean;
};


// Passwords are checked for length and for not being one of the handful of strings that
// make a credential meaningless. No composition rules: they push people to "Password1!".
export function passwordProblem(password: string): string | null {
  if (password.length < 10) return "Use at least 10 characters.";
  if (password.length > 200) return "That is longer than we can store.";
  const weak = ["password12", "1234567890", "qwertyuiop", "thegallery"];
  if (weak.includes(password.toLowerCase())) return "That password is too easy to guess.";
  return null;
}

export function emailProblem(email: string): string | null {
  const v = email.trim();
  if (!v) return "Enter the email address you want to sign in with.";
  if (v.length > 254) return "That address is too long.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return "That does not look like an email address.";
  return null;
}

const digest = (raw: string) => createHash("sha256").update(raw).digest("hex");
const secret = () => randomBytes(32).toString("base64url");

// --- accounts ---------------------------------------------------------------------------
/**
 * Create an account and send a confirmation link.
 *
 * The caller is told the same thing whether or not the address is already registered
 * (PRODUCT_ARCHITECTURE §4.2: "duplicate email — same wording as success path"). An account
 * door that answers "this email is taken" is an account-enumeration oracle.
 */
export async function createAccount(email: string, password: string): Promise<void> {
  const hash = await hashPassword(password);
  await asAuthStore(async (db) => {
    const existing = await db.query<{ id: string; access_state: string }>(
      "SELECT id, access_state FROM auth_accounts WHERE email_normalised = lower(btrim($1))", [email]);
    if (existing.rowCount) {
      const acct = existing.rows[0];
      if (acct.access_state === "awaiting_email_confirmation") await issueConfirm(db, acct.id, email);
      return;
    }
    const created = await db.query<{ id: string }>(
      "INSERT INTO auth_accounts (email, password_hash) VALUES ($1, $2) RETURNING id", [email.trim(), hash]);
    await issueConfirm(db, created.rows[0].id, email);
  });
}

async function issueConfirm(db: import("./db").Db, accountId: string, email: string) {
  const raw = secret();
  await db.query(
    `INSERT INTO auth_tokens (account_id, purpose, token_hash, expires_at)
     VALUES ($1, 'confirm_email', $2, now() + ($3 || ' hours')::interval)`,
    [accountId, digest(raw), String(CONFIRM_HOURS)]);
  const base = process.env.GALLERY_BASE_URL ?? "http://127.0.0.1:3100";
  await deliver(db, {
    to: email,
    subject: "Confirm your email for The Gallery",
    body: "Confirm this address to open your Studio. The link is good for 24 hours.",
    link: `${base}/makers/confirm/${raw}`,
  });
}

export async function resendConfirm(email: string): Promise<void> {
  await asAuthStore(async (db) => {
    const r = await db.query<{ id: string }>(
      `SELECT id FROM auth_accounts
        WHERE email_normalised = lower(btrim($1)) AND access_state = 'awaiting_email_confirmation'`, [email]);
    if (r.rowCount) await issueConfirm(db, r.rows[0].id, email);
  });
}

export async function confirmEmail(rawToken: string): Promise<"confirmed" | "expired"> {
  return asAuthStore(async (db) => {
    const r = await db.query<{ id: string; account_id: string }>(
      `SELECT id, account_id FROM auth_tokens
        WHERE token_hash = $1 AND purpose = 'confirm_email'
          AND consumed_at IS NULL AND expires_at > now() FOR UPDATE`, [digest(rawToken)]);
    if (!r.rowCount) return "expired";
    await db.query("UPDATE auth_tokens SET consumed_at = now() WHERE id = $1", [r.rows[0].id]);
    await db.query(
      `UPDATE auth_accounts SET access_state = 'active', email_confirmed_at = now()
        WHERE id = $1 AND access_state = 'awaiting_email_confirmation'`, [r.rows[0].account_id]);
    return "confirmed";
  });
}

export async function startRecovery(email: string): Promise<void> {
  await asAuthStore(async (db) => {
    const r = await db.query<{ id: string }>(
      "SELECT id FROM auth_accounts WHERE email_normalised = lower(btrim($1)) AND access_state <> 'closed'", [email]);
    if (!r.rowCount) return; // same wording is returned to the caller either way
    const raw = secret();
    await db.query(
      `INSERT INTO auth_tokens (account_id, purpose, token_hash, expires_at)
       VALUES ($1, 'reset_password', $2, now() + ($3 || ' hours')::interval)`,
      [r.rows[0].id, digest(raw), String(RESET_HOURS)]);
    const base = process.env.GALLERY_BASE_URL ?? "http://127.0.0.1:3100";
    await deliver(db, {
      to: email, subject: "Set a new password for The Gallery",
      body: "Use this link within 2 hours to set a new password. If you did not ask, nothing has changed.",
      link: `${base}/makers/reset/${raw}`,
    });
  });
}

export async function completeRecovery(rawToken: string, password: string): Promise<"ok" | "expired"> {
  const hash = await hashPassword(password);
  return asAuthStore(async (db) => {
    const r = await db.query<{ id: string; account_id: string }>(
      `SELECT id, account_id FROM auth_tokens
        WHERE token_hash = $1 AND purpose = 'reset_password'
          AND consumed_at IS NULL AND expires_at > now() FOR UPDATE`, [digest(rawToken)]);
    if (!r.rowCount) return "expired";
    await db.query("UPDATE auth_tokens SET consumed_at = now() WHERE id = $1", [r.rows[0].id]);
    await db.query("UPDATE auth_accounts SET password_hash = $2 WHERE id = $1", [r.rows[0].account_id, hash]);
    // Every existing session ends: recovery is also the door someone uses after losing control.
    await db.query("UPDATE auth_sessions SET revoked_at = now() WHERE account_id = $1 AND revoked_at IS NULL",
      [r.rows[0].account_id]);
    return "ok";
  });
}

// --- sessions ---------------------------------------------------------------------------
export type SignInResult =
  | { ok: true }
  | { ok: false; reason: "denied" | "unconfirmed" | "closed" };

export async function signIn(email: string, password: string): Promise<SignInResult> {
  const outcome = await asAuthStore(async (db) => {
    const r = await db.query<{ id: string; password_hash: string; access_state: string }>(
      "SELECT id, password_hash, access_state FROM auth_accounts WHERE email_normalised = lower(btrim($1))", [email]);
    if (!r.rowCount) {
      // Spend comparable time so a missing address is not distinguishable by timing.
      await verifyPassword(password, "scrypt$00$00");
      return { kind: "denied" as const };
    }
    const a = r.rows[0];
    if (!(await verifyPassword(password, a.password_hash))) return { kind: "denied" as const };
    if (a.access_state === "awaiting_email_confirmation") return { kind: "unconfirmed" as const };
    if (a.access_state === "closed") return { kind: "closed" as const };
    const raw = secret();
    await db.query(
      `INSERT INTO auth_sessions (account_id, token_hash, expires_at)
       VALUES ($1, $2, now() + ($3 || ' days')::interval)`,
      [a.id, digest(raw), String(SESSION_DAYS)]);
    return { kind: "ok" as const, raw };
  });

  if (outcome.kind !== "ok") return { ok: false, reason: outcome.kind };
  const jar = await cookies();
  jar.set(SESSION_COOKIE, outcome.raw, {
    httpOnly: true, sameSite: "lax", path: "/", secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_DAYS * 86_400,
  });
  return { ok: true };
}

export async function signOut(): Promise<void> {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE)?.value;
  if (raw) {
    await asAuthStore((db) =>
      db.query("UPDATE auth_sessions SET revoked_at = now() WHERE token_hash = $1", [digest(raw)]));
  }
  jar.delete(SESSION_COOKIE);
}

/** The account behind this request, or null. A suspended account still resolves: the Studio
 *  must be able to state the suspension and its appeal route rather than silently sign out. */
export async function currentAccount(): Promise<Account | null> {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  return asAuthStore(async (db) => {
    const r = await db.query<Account>(
      `SELECT a.id, a.email, a.access_state, a.email_confirmed_at, a.is_operator
         FROM auth_sessions s JOIN auth_accounts a ON a.id = s.account_id
        WHERE s.token_hash = $1 AND s.revoked_at IS NULL AND s.expires_at > now()`, [digest(raw)]);
    if (!r.rowCount) return null;
    const acct = r.rows[0];
    return acct.access_state === "closed" ? null : acct;
  });
}

export async function expireSessionsForTest(accountId: string): Promise<void> {
  await asAuthStore((db) =>
    db.query("UPDATE auth_sessions SET expires_at = now() - interval '1 minute' WHERE account_id = $1", [accountId]));
}
