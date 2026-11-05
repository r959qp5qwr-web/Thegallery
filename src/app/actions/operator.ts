"use server";
import { revalidatePath } from "next/cache";
import { currentAccount } from "@/lib/auth";
import { client } from "@/lib/supabase";

export type FormState = { error?: string; notice?: string };

/**
 * Suspend or reinstate a maker.
 *
 * The authority check is in the database, not here: set_maker_access refuses a caller
 * who is not an operator and refuses an empty reason. This action can therefore be wrong
 * without being dangerous — the sanction still cannot happen without authority and a reason,
 * and the append-only record is written in the same transaction as the status change.
 */
export async function setMakerAccessAction(_prev: FormState, form: FormData): Promise<FormState> {
  const account = await currentAccount();
  if (!account) return { error: "Not signed in." };
  const makerId = String(form.get("maker_id") ?? "");
  const action = String(form.get("action") ?? "");
  const reason = String(form.get("reason") ?? "").trim();
  if (!reason) return { error: "A sanction needs a written reason. Nothing has been changed." };

  const db = await client();
  const { data, error } = await db.rpc("set_maker_access", {
    p_maker_id: makerId, p_action: action, p_reason: reason,
  });
  if (error) {
    if (error.message.includes("operator authority")) return { error: "You do not have operator authority." };
    if (error.message.includes("recorded reason")) return { error: "A sanction needs a written reason." };
    return { error: "That action did not complete. Nothing was changed." };
  }
  revalidatePath("/", "layout");
  const outcome = data as string | null;
  if (outcome === "unchanged") return { notice: "That maker was already in this state. Nothing changed." };
  return { notice: outcome === "suspended"
    ? "Suspended. Their gallery and work are no longer public, and the reason is recorded."
    : "Reinstated. Their gallery and work are public again, exactly as they were." };
}
