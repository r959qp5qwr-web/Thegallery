"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  createAccount, resendConfirm, signIn, signOut, startRecovery, completeRecovery,
  emailProblem, passwordProblem, currentAccount,
} from "@/lib/auth";
import { client } from "@/lib/supabase";

export type FormState = { error?: string; notice?: string };

export async function createAccountAction(_prev: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");
  const problem = emailProblem(email) ?? passwordProblem(password);
  if (problem) return { error: problem };
  try {
    await createAccount(email, password);
  } catch {
    return { error: "We could not create the account just now. Nothing was saved — try again." };
  }
  // The same destination whether or not the address already had an account: the door does not
  // tell a stranger who is registered here.
  redirect(`/makers/check-email?e=${encodeURIComponent(email)}`);
}

export async function resendConfirmAction(_prev: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "");
  if (emailProblem(email)) return { error: "Enter the address you signed up with." };
  await resendConfirm(email);
  return { notice: "If that address is waiting for confirmation, another link is on its way." };
}

export async function signInAction(_prev: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");
  const next = String(form.get("next") ?? "/studio");
  if (!email || !password) return { error: "Enter your email and password." };
  const result = await signIn(email, password);
  if (!result.ok) {
    if (result.reason === "unconfirmed") {
      return { error: "This address has not been confirmed yet. Check your email for the link." };
    }
    if (result.reason === "closed") return { error: "This account has been closed." };
    // One wording for a wrong address and a wrong password, so the door does not enumerate.
    return { error: "That email and password do not match an account." };
  }
  redirect(next.startsWith("/") ? next : "/studio");
}

export async function signOutAction(): Promise<void> {
  await signOut();
  redirect("/");
}

export async function startRecoveryAction(_prev: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "");
  if (emailProblem(email)) return { error: "Enter the address you signed up with." };
  await startRecovery(email);
  // Same answer either way.
  return { notice: "If that address has an account, a link to set a new password is on its way." };
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
