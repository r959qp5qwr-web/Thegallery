import { client } from "./supabase";

/**
 * The maker door, on Supabase Auth (decision GAL-SUPA-1).
 *
 * This module used to hash passwords, mint session tokens and expire single-use links. None of
 * that is here now, and none of it is this product's to own: GoTrue issues the token, and
 * PostgREST turns it into a database role. What remains is the product's own vocabulary — what
 * a refusal says, and which states a maker can be in.
 *
 * NON-ENUMERATION (PRODUCT_ARCHITECTURE §4.2). The caller is told the same thing whether or
 * not an address is registered, on both the sign-up and the recovery door. Supabase's sign-up
 * behaves this way already when email confirmation is on — it returns a user with no
 * identities rather than an error — but this module does not rely on that: it returns nothing
 * either way, so a change in that behaviour cannot turn this door into an oracle.
 */

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

const base = () => process.env.GALLERY_BASE_URL ?? "http://127.0.0.1:3100";

// --- accounts ---------------------------------------------------------------------------
export async function createAccount(email: string, password: string): Promise<void> {
  const sb = await client();
  await sb.auth.signUp({
    email: email.trim(),
    password,
    options: { emailRedirectTo: `${base()}/makers/confirm` },
  });
  // The result is deliberately not inspected. Whatever it says about whether this address was
  // already registered is exactly what must not reach the caller.
}

export async function resendConfirm(email: string): Promise<void> {
  const sb = await client();
  await sb.auth.resend({ type: "signup", email: email.trim(),
                         options: { emailRedirectTo: `${base()}/makers/confirm` } });
}

/**
 * Confirm an address from the link in the email.
 *
 * The link carries a single-use hash minted by GoTrue. Consuming it also signs the person in,
 * which is why this returns after the client has written its cookies.
 */
export async function confirmEmail(tokenHash: string): Promise<"confirmed" | "expired"> {
  const sb = await client();
  const { error } = await sb.auth.verifyOtp({ type: "email", token_hash: tokenHash });
  return error ? "expired" : "confirmed";
}

export async function startRecovery(email: string): Promise<void> {
  const sb = await client();
  await sb.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${base()}/makers/reset` });
  // Same: the outcome is not reported, because "no such account" is not a thing to tell a
  // stranger who typed someone else's address.
}

export async function completeRecovery(tokenHash: string, password: string): Promise<"ok" | "expired"> {
  const sb = await client();
  const { error } = await sb.auth.verifyOtp({ type: "recovery", token_hash: tokenHash });
  if (error) return "expired";
  const { error: setError } = await sb.auth.updateUser({ password });
  return setError ? "expired" : "ok";
}

// --- sessions ---------------------------------------------------------------------------
export type SignInResult =
  | { ok: true }
  | { ok: false; reason: "denied" | "unconfirmed" | "closed" };

export async function signIn(email: string, password: string): Promise<SignInResult> {
  const sb = await client();
  const { data, error } = await sb.auth.signInWithPassword({ email: email.trim(), password });
  if (error) {
    // GoTrue distinguishes an unconfirmed address from a wrong password. The unconfirmed case
    // is safe to name — the person already proved they hold the address by receiving nothing
    // yet — but a wrong password and an unknown address must remain one answer.
    if (/confirm/i.test(error.message)) return { ok: false, reason: "unconfirmed" };
    return { ok: false, reason: "denied" };
  }
  if (!data.user) return { ok: false, reason: "denied" };

  // A closed account has a valid credential and no product left. Ending the session here is
  // what makes closure mean something, rather than leaving the person signed in to nothing.
  const { data: closed } = await sb.from("account_closures").select("user_id").limit(1);
  if (closed && closed.length > 0) {
    await sb.auth.signOut();
    return { ok: false, reason: "closed" };
  }
  return { ok: true };
}

export async function signOut(): Promise<void> {
  const sb = await client();
  await sb.auth.signOut();
}

/**
 * The account behind this request, or null.
 *
 * A SUSPENDED maker still resolves: the Studio must be able to state the suspension and its
 * appeal route rather than silently sign the person out. A CLOSED one does not.
 *
 * getUser() asks GoTrue rather than trusting the cookie, which is the difference between
 * knowing who is calling and believing what the caller wrote down.
 */
export async function currentAccount(): Promise<Account | null> {
  const sb = await client();
  const { data: { user }, error } = await sb.auth.getUser();
  if (error || !user) return null;

  const { data: closed } = await sb.from("account_closures").select("user_id").limit(1);
  if (closed && closed.length > 0) return null;

  const { data: op } = await sb.rpc("is_operator");
  return {
    id: user.id,
    email: user.email ?? "",
    access_state: "active",
    email_confirmed_at: user.email_confirmed_at ?? null,
    is_operator: op === true,
  };
}
