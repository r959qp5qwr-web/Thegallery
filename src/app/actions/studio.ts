"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { currentAccount } from "@/lib/auth";
import { client } from "@/lib/supabase";
import { ingestImage } from "@/lib/storage";
import { validateRoute } from "@/lib/format";

export type FormState = { error?: string; notice?: string; field?: string; values?: Record<string, string> };

async function requireActiveMaker() {
  const account = await currentAccount();
  if (!account) redirect("/makers/sign-in?next=/studio");
  return account;
}

// A short, unguessable public token. crypto.getRandomValues rather than node:crypto so the
// same code runs in a Worker isolate, which has no node:crypto by default.
function token(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => "abcdefghijklmnopqrstuvwxyz0123456789"[b % 36]).join("");
}

/** The next position in a maker-owned list. Read then write, because PostgREST has no
 *  expression-valued insert; the unique index is what actually prevents a collision. */
async function nextPosition(rows: { position: number }[] | null): Promise<number> {
  if (!rows?.length) return 0;
  return Math.max(...rows.map((r) => r.position)) + 1;
}

// ------------------------------------------------------------------ identity and gallery
export async function saveProfileAction(_prev: FormState, form: FormData): Promise<FormState> {
  const account = await requireActiveMaker();
  const handle = String(form.get("handle") ?? "").trim().toLowerCase();
  const display_name = String(form.get("display_name") ?? "").trim();
  const kind = String(form.get("kind") ?? "individual");
  const city = String(form.get("city") ?? "").trim();
  const practice_note = String(form.get("practice_note") ?? "").trim() || null;
  const commissions_open = form.get("commissions_open") === "on";
  const commissions_note = String(form.get("commissions_note") ?? "").trim() || null;
  const intro = String(form.get("intro") ?? "").trim() || null;

  if (!display_name) return { error: "Your name is how visitors will know you. Add it." };
  if (!city) return { error: "Add the city you work in." };
  if (!/^[a-z0-9]([a-z0-9-]{1,28}[a-z0-9])$/.test(handle)) {
    return { error: "The gallery address uses lowercase letters, numbers and hyphens, 3 to 30 characters." };
  }
  if (!["individual", "studio", "collective"].includes(kind)) return { error: "Choose how you work." };

  const db = await client();
  const fields = { handle, display_name, kind, city, practice_note, commissions_open, commissions_note };

  // Row-level security scopes this to the caller's own maker row, so there is no `where` on
  // identity here and there must not be one: a filter written here would be a second opinion
  // about who is calling.
  const { data: mine } = await db.from("makers").select("id").limit(1);
  const existing = mine?.[0] as { id: string } | undefined;

  if (existing) {
    const { error } = await db.from("makers")
      .update({ ...fields, updated_at: new Date().toISOString() }).eq("id", existing.id);
    if (error) {
      if (error.code === "23505") return { error: "That gallery address is taken. Try another." };
      return { error: "We could not save that just now. Nothing was changed." };
    }
    if (intro !== null) await db.from("galleries").update({ intro }).eq("maker_id", existing.id);
  } else {
    const { data: created, error } = await db.from("makers")
      .insert({ ...fields, user_id: account.id }).select("id").limit(1);
    if (error || !created?.length) {
      if (error?.code === "23505") return { error: "That gallery address is taken. Try another." };
      return { error: "We could not save that just now. Nothing was changed." };
    }
    const makerId = (created[0] as { id: string }).id;
    const { error: gErr } = await db.from("galleries").insert({ maker_id: makerId, intro });
    if (gErr) return { error: "We could not save that just now. Nothing was changed." };
  }
  revalidatePath("/studio");
  redirect("/studio?saved=profile");
}

// ------------------------------------------------------------------------- contact routes
export async function saveRouteAction(_prev: FormState, form: FormData): Promise<FormState> {
  await requireActiveMaker();
  const kind = String(form.get("kind") ?? "");
  const value = String(form.get("value") ?? "").trim();
  const label = String(form.get("label") ?? "").trim() || null;
  const problem = validateRoute(kind, value);
  if (problem) return { error: problem };

  const db = await client();
  const { data: mine } = await db.from("makers").select("id").limit(1);
  const maker = mine?.[0] as { id: string } | undefined;
  if (!maker) return { error: "Set up your maker identity first." };

  const { data: existing } = await db.from("contact_routes").select("position").eq("maker_id", maker.id);
  // validated = true because the format was checked here; enabled = true because a maker who
  // typed a route means it to be used. Both stay separate columns so a route can be turned off
  // without being deleted (DOMAIN_MODEL §2.7).
  const { error } = await db.from("contact_routes").insert({
    maker_id: maker.id, kind, value, label, enabled: true, validated: true,
    position: await nextPosition(existing as { position: number }[] | null),
  });
  if (error) return { error: "We could not add that route. Nothing was changed." };

  revalidatePath("/studio/contact-routes");
  return { notice: "Route added. It becomes an action on your gallery straight away." };
}

export async function toggleRouteAction(form: FormData): Promise<void> {
  await requireActiveMaker();
  const id = String(form.get("id") ?? "");
  const db = await client();
  // Read then write: PostgREST cannot negate a column in place. The read is itself scoped by
  // row-level security, so a route belonging to someone else is simply not found.
  const { data } = await db.from("contact_routes").select("enabled").eq("id", id).limit(1);
  const row = data?.[0] as { enabled: boolean } | undefined;
  if (row) await db.from("contact_routes").update({ enabled: !row.enabled }).eq("id", id);
  revalidatePath("/studio/contact-routes");
}

export async function deleteRouteAction(form: FormData): Promise<void> {
  await requireActiveMaker();
  const id = String(form.get("id") ?? "");
  const db = await client();
  await db.from("contact_routes").delete().eq("id", id);
  revalidatePath("/studio/contact-routes");
  revalidatePath("/", "layout");
  redirect("/studio/contact-routes?removed=1");
}

// -------------------------------------------------------------------------------- works
/** The label as the maker typed it, checked once for both create and edit. A refusal names the
 *  field it is about, so the form can put the message under that field and keep every value. */
function readLabel(form: FormData):
  { fields: Record<string, unknown> } | { error: string; field: string } {
  const title = String(form.get("title") ?? "").trim();
  const material = String(form.get("material") ?? "");
  const price_mode = String(form.get("price_mode") ?? "enquire");
  const rawPrice = String(form.get("price_amount") ?? "").trim();
  const year = String(form.get("year") ?? "").trim();
  const mm = (name: string) => {
    const v = String(form.get(name) ?? "").trim();
    if (!v) return null;
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? Math.round(n * 10) : null;  // entered in cm, stored in mm
  };

  if (!title) return { error: "Give the work a title.", field: "title" };
  if (!material) return { error: "Choose the material.", field: "material" };
  // Number("") is 0, so a blank price passed the very check that exists to catch it and then
  // failed at the database as an unreadable "we could not save that work". An empty field is
  // not a zero price; it is an unanswered question.
  if (price_mode === "exact" && !(rawPrice !== "" && Number.isFinite(Number(rawPrice)) && Number(rawPrice) >= 0)) {
    return { error: "Enter the price in rupees, or choose On enquiry.", field: "price_amount" };
  }
  if (year && !/^\d{4}$/.test(year)) return { error: "Enter the year as four digits, like 2026.", field: "year" };

  return { fields: {
    title, material,
    medium: String(form.get("medium") ?? "").trim() || null,
    process: String(form.get("process") ?? "").trim() || null,
    height_mm: mm("height_cm"), width_mm: mm("width_cm"), depth_mm: mm("depth_cm"),
    year: year ? Number(year) : null, price_mode,
    price_amount: price_mode === "exact" ? rawPrice : null,
  } };
}

/** What the person typed, handed back with a refusal so nothing they wrote is lost. */
function typed(form: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  form.forEach((v, k) => { if (typeof v === "string" && !k.startsWith("$")) out[k] = v; });
  return out;
}

export async function createWorkAction(_prev: FormState, form: FormData): Promise<FormState> {
  await requireActiveMaker();
  const label = readLabel(form);
  if ("error" in label) return { ...label, values: typed(form) };

  const db = await client();
  const { data: galleries } = await db.from("galleries").select("id").limit(1);
  const gallery = galleries?.[0] as { id: string } | undefined;
  if (!gallery) return { error: "Set up your maker identity first — that is what a work belongs to." };

  const { data, error } = await db.from("works").insert({
    public_token: token(), gallery_id: gallery.id, ...label.fields,
    status: String(form.get("status") ?? "available"),
  }).select("id").limit(1);

  if (error || !data?.length) return { error: "We could not save that work. Nothing was created.", values: typed(form) };
  redirect(`/studio/works/${(data[0] as { id: string }).id}?created=1`);
}

/** Correct a work's label after it was saved. Without this a typo in a title or a price was
 *  permanent. Row-level security decides whose work this is; a suspended maker cannot write. */
export async function updateWorkLabelAction(_prev: FormState, form: FormData): Promise<FormState> {
  await requireActiveMaker();
  const workId = String(form.get("work_id") ?? "");
  const label = readLabel(form);
  if ("error" in label) return { ...label, values: typed(form) };
  const db = await client();
  const { data, error } = await db.from("works")
    .update({ ...label.fields, updated_at: new Date().toISOString() }).eq("id", workId).select("id");
  if (error || !data?.length) return { error: "We could not save the label. Nothing was changed.", values: typed(form) };
  revalidatePath("/", "layout");
  return { notice: "The label is updated. Every page that shows this work now shows the change." };
}

export async function addImageAction(_prev: FormState, form: FormData): Promise<FormState> {
  await requireActiveMaker();
  const workId = String(form.get("work_id") ?? "");
  const alt = String(form.get("alt_text") ?? "").trim() || null;
  const file = form.get("image");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose an image file." };
  if (file.size > 12 * 1024 * 1024) return { error: "That image is larger than 12 MB. Export it smaller." };

  const db = await client();

  // The row is written first in `uploading`, then moved to `ready` once the bytes are stored,
  // and left at `failed` if they are not. A half-finished upload is therefore visible as
  // itself and never blocks the other images (DOMAIN_MODEL §2.4).
  // The storage key is chosen HERE and written before a single byte is uploaded. The storage
  // policy that decides whether an object is this maker's own looks the key up in this table,
  // so a key written afterwards would make the maker's own upload unauthorised.
  const storageKey = crypto.randomUUID();
  const { data: siblings } = await db.from("work_images").select("position").eq("work_id", workId);
  const { data: created, error: insertError } = await db.from("work_images").insert({
    work_id: workId, position: await nextPosition(siblings as { position: number }[] | null),
    storage_key: storageKey, width: 0, height: 0, alt_text: alt, state: "uploading",
  }).select("id").limit(1);

  if (insertError || !created?.length) return { error: "That work is not yours to add images to." };
  const imageId = (created[0] as { id: string }).id;

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const ingested = await ingestImage(bytes, db, storageKey);
    await db.from("work_images").update({
      width: ingested.width, height: ingested.height,
      variants: ingested.variants, state: "ready",
    }).eq("id", imageId);
  } catch (e) {
    await db.from("work_images").update({ state: "failed" }).eq("id", imageId);
    const why = e instanceof Error ? e.message : "we could not read that file";
    return { error: `That image did not go up — ${why}. The other images are untouched; try again.` };
  }
  revalidatePath(`/studio/works/${workId}`);
  return { notice: "Image added." };
}

export async function removeImageAction(form: FormData): Promise<void> {
  await requireActiveMaker();
  const id = String(form.get("id") ?? "");
  const workId = String(form.get("work_id") ?? "");
  const db = await client();
  // A published work keeps at least one image: removing the last one would leave a public page
  // with nothing to look at. The maker retires the work instead, which is a choice they make
  // knowingly, with its own confirmation.
  const { data: work } = await db.from("works").select("lifecycle").eq("id", workId).limit(1);
  const { data: ready } = await db.from("work_images").select("id").eq("work_id", workId).eq("state", "ready");
  const readyIds = (ready ?? []).map((r) => (r as { id: string }).id);
  if ((work?.[0] as { lifecycle: string } | undefined)?.lifecycle === "published"
      && readyIds.length <= 1 && readyIds.includes(id)) {
    redirect(`/studio/works/${workId}?kept=last-image`);
  }
  await db.from("work_images").delete().eq("id", id);
  revalidatePath(`/studio/works/${workId}`);
  redirect(`/studio/works/${workId}?removed=image`);
}

export async function publishWorkAction(_prev: FormState, form: FormData): Promise<FormState> {
  await requireActiveMaker();
  const workId = String(form.get("work_id") ?? "");
  const intent = String(form.get("intent_key") ?? "");
  if (!intent) return { error: "This form went stale. Reload the page and publish again." };

  const db = await client();
  const { data, error } = await db.rpc("publish_work", { p_work_id: workId, p_intent_key: intent });

  if (error) {
    if (error.message.includes("ready image")) {
      return { error: "Add at least one image that finished uploading, then publish." };
    }
    if (error.message.includes("not yours")) return { error: "That work is not yours." };
    return { error: "Publishing did not complete. Nothing was changed — your work is still here." };
  }
  revalidatePath("/"); revalidatePath(`/studio/works/${workId}`);
  const outcome = (data as { outcome: string }[] | null)?.[0]?.outcome;
  // A second press of the same button carries the same intent key and cannot publish twice.
  return { notice: outcome === "published" ? "Published." : "Already published — nothing changed." };
}

export async function setStatusAction(form: FormData): Promise<void> {
  await requireActiveMaker();
  const db = await client();
  await db.rpc("set_work_status", {
    p_work_id: String(form.get("work_id") ?? ""), p_status: String(form.get("status") ?? ""),
  });
  // Every public surface reads one column, so one revalidation is the whole propagation.
  revalidatePath("/", "layout");
}

export async function retireWorkAction(form: FormData): Promise<void> {
  await requireActiveMaker();
  const workId = String(form.get("work_id") ?? "");
  const db = await client();
  await db.rpc("retire_work", { p_work_id: workId });
  revalidatePath("/", "layout");
  redirect(`/studio/works/${workId}?retired=1`);
}

/** Put a retired work back on view. Retiring is the maker's own choice and must be undoable;
 *  a work taken down by an operator is not the maker's to restore. */
export async function restoreWorkAction(form: FormData): Promise<void> {
  await requireActiveMaker();
  const workId = String(form.get("work_id") ?? "");
  const db = await client();
  const { data: ready } = await db.from("work_images").select("id").eq("work_id", workId).eq("state", "ready").limit(1);
  if (!ready?.length) redirect(`/studio/works/${workId}?kept=no-image`);
  await db.from("works")
    .update({ lifecycle: "published", retired_at: null, updated_at: new Date().toISOString() })
    .eq("id", workId).eq("lifecycle", "retired").eq("taken_down", false);
  revalidatePath("/", "layout");
  redirect(`/studio/works/${workId}?restored=1`);
}

export async function publishGalleryAction(form: FormData): Promise<void> {
  await requireActiveMaker();
  const galleryId = String(form.get("gallery_id") ?? "");
  const db = await client();
  await db.from("galleries")
    .update({ lifecycle: "published", published_at: new Date().toISOString() })
    .eq("id", galleryId).in("lifecycle", ["draft", "hidden"]);
  revalidatePath("/", "layout");
}
