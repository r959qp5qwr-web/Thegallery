"use server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import {
  createAccount, resendConfirm, signIn, signOut, startRecovery, completeRecovery,
  emailProblem, passwordProblem, currentAccount, JOIN_COOKIE, joinMark,
} from "@/lib/auth";
import { client } from "@/lib/supabase";

export type FormState = { error?: string; notice?: string; field?: string; values?: Record<string, string> };

export async function createAccountAction(_prev: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");
  const problem = emailProblem(email) ?? passwordProblem(password);
  if (problem) return { error: problem, values: { email } };
  try {
    await createAccount(email, password);
  } catch {
    return { error: "We could not create the account just now. Nothing was saved — try again.", values: { email } };
  }
  // This browser began joining with this address: its confirmation link may sign it in here.
  (await cookies()).set(JOIN_COOKIE, await joinMark(email), {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" && !/^http:/.test(process.env.GALLERY_BASE_URL ?? ""),
    path: "/", maxAge: 60 * 60 * 24 * 3,
  });
  // The same destination whether or not the address already had an account: the door does not
  // tell a stranger who is registered here.
  redirect(`/makers/check-email?e=${encodeURIComponent(email)}`);
}

export async function resendConfirmAction(_prev: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "");
  if (emailProblem(email)) return { error: "Enter the address you signed up with.", values: { email } };
  await resendConfirm(email);
  return { notice: "If that address is waiting for a link, a new one is on its way." };
}

export async function signInAction(_prev: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");
  const next = String(form.get("next") ?? "/studio");
  if (!email || !password) return { error: "Enter your email and password.", values: { email } };
  const result = await signIn(email, password);
  if (!result.ok) {
    if (result.reason === "unconfirmed") {
      return { error: "This address has not been confirmed yet. Check your email for the link.", values: { email } };
    }
    if (result.reason === "closed") return { error: "This account has been closed.", values: { email } };
    // One wording for a wrong address and a wrong password, so the door does not enumerate.
    return { error: "That email and password do not match an account.", values: { email } };
  }
  redirect(safeNext(next));
}

/** Only a path on this site. "//host" and "/\\host" are read by browsers as another site, so a
 *  crafted sign-in link could otherwise hand a maker to a look-alike page after a real sign-in. */
function safeNext(next: string): string {
  // Parsed the way a browser will read it (tabs and newlines are dropped, so "/\t/host" becomes
  // "//host"): only a path on this same origin is kept.
  try {
    const u = new URL(next, "https://gallery.invalid");
    if (u.origin === "https://gallery.invalid" && /^\/(?![\/\\])/.test(u.pathname)) return u.pathname + u.search + u.hash;
  } catch { /* not a URL at all */ }
  return "/studio";
}

export async function signOutAction(): Promise<void> {
  await signOut();
  redirect("/");
}

export async function startRecoveryAction(_prev: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "");
  if (emailProblem(email)) return { error: "Enter the address you signed up with.", values: { email } };
  await startRecovery(email);
  // Same answer either way.
  return { notice: "If it has a gallery, a link is on its way." };
}

export async function completeRecoveryAction(_prev: FormState, form: FormData): Promise<FormState> {
  const token = String(form.get("token") ?? "");
  const password = String(form.get("password") ?? "");
  const problem = passwordProblem(password);
  if (problem) return { error: problem };
  const outcome = await completeRecovery(token, password);
  if (outcome === "expired") return { error: "That link has expired or has already been used. Ask for a new one." };
  redirect("/makers/sign-in?reset=1");
}

export async function closeAccountAction(_prev: FormState, form: FormData): Promise<FormState> {
  const account = await currentAccount();
  if (!account) redirect("/makers/sign-in");
  if (String(form.get("confirm") ?? "") !== "close") {
    return { error: "Type close to confirm. Nothing has been changed." };
  }
  const db = await client();
  const { error } = await db.rpc("close_account");
  if (error) {
    if (error.message.includes("suspended")) {
      return { error: "A suspended account cannot be closed here. Reply to the notice you were sent." };
    }
    return { error: "We could not close the account just now. Nothing was changed." };
  }
  await signOut();
  revalidatePath("/", "layout");
  redirect("/?closed=1");
}
