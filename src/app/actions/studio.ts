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

  // Every refusal names its field and hands back what was typed: a first-time maker whose gallery
  // address is taken must not lose the whole identity form (J-002, one sitting).
  const refuse = (error: string, field?: string): FormState => ({ error, field, values: typed(form) });
  if (!display_name) return refuse("Your name is how visitors will know you. Add it.", "display_name");
  if (!city) return refuse("Add the city you work in.", "city");
  if (!/^[a-z0-9]([a-z0-9-]{1,28}[a-z0-9])$/.test(handle)) {
    return refuse("The gallery address uses lowercase letters, numbers and hyphens, 3 to 30 characters.", "handle");
  }
  if (!["individual", "studio", "collective"].includes(kind)) return refuse("Choose how you work.", "kind");

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
      if (error.code === "23505") return refuse("That gallery address is taken. Try another.", "handle");
      return refuse("We could not save that just now. Nothing was changed.");
    }
    if (intro !== null) await db.from("galleries").update({ intro }).eq("maker_id", existing.id);
  } else {
    const { data: created, error } = await db.from("makers")
      .insert({ ...fields, user_id: account.id }).select("id").limit(1);
    if (error || !created?.length) {
      if (error?.code === "23505") return refuse("That gallery address is taken. Try another.", "handle");
      return refuse("We could not save that just now. Nothing was changed.");
    }
    const makerId = (created[0] as { id: string }).id;
    const { error: gErr } = await db.from("galleries").insert({ maker_id: makerId, intro });
    if (gErr) return refuse("We could not save that just now. Nothing was changed.");
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
  if (problem) return { error: problem, field: "value", values: typed(form) };

  const db = await client();
  const { data: mine } = await db.from("makers").select("id").limit(1);
  const maker = mine?.[0] as { id: string } | undefined;
  if (!maker) return { error: "Add your details first: your name, how you work and your city." };

  const { data: existing } = await db.from("contact_routes").select("position").eq("maker_id", maker.id);
  // validated = true because the format was checked here; enabled = true because a maker who
  // typed a route means it to be used. Both stay separate columns so a route can be turned off
  // without being deleted (DOMAIN_MODEL §2.7).
  const { error } = await db.from("contact_routes").insert({
    maker_id: maker.id, kind, value, label, enabled: true, validated: true,
    position: await nextPosition(existing as { position: number }[] | null),
  });
  if (error) return { error: "We could not add that just now. Nothing was changed.", values: typed(form) };

  revalidatePath("/studio/contact-routes");
  return { notice: "Added. Visitors can use it from your gallery straight away." };
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
function readLabel(form: FormData, untitled?: string):
  { fields: Record<string, unknown> } | { error: string; field: string } {
  // `untitled`: a draft started from an image may be saved before it has a title (decision R1).
  const title = String(form.get("title") ?? "").trim() || (untitled ?? "");
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

/** The working name of a draft started from an image, until the maker gives it a title. */
const UNTITLED = "Untitled work";

export async function createWorkAction(_prev: FormState, form: FormData): Promise<FormState> {
  await requireActiveMaker();
  // Decision R1 (2026-11-06): the draft is created on the first image. A maker who starts with a
  // picture is not stopped for a title; the draft is named for now and the title is asked for
  // before publishing. Without an image, the title is required as before.
  const file = form.get("image");
  const hasImage = file instanceof File && file.size > 0;
  // The form is read, never rewritten: a refusal must hand back exactly what was typed, and a
  // browser cannot hand back a chosen file, so the refusal says to choose it again.
  const label = readLabel(form, hasImage ? UNTITLED : undefined);
  const again = hasImage ? " Choose the image again — a browser does not keep it after a refusal." : "";
  if ("error" in label) return { ...label, error: label.error + again, values: typed(form) };

  const db = await client();
  const { data: galleries } = await db.from("galleries").select("id").limit(1);
  const gallery = galleries?.[0] as { id: string } | undefined;
  if (!gallery) return { error: "Add your details first: your name, how you work and your city. Then add the work.", values: typed(form) };

  const { data, error } = await db.from("works").insert({
    public_token: token(), gallery_id: gallery.id, ...label.fields,
    status: String(form.get("status") ?? "available"),
  }).select("id").limit(1);

  if (error || !data?.length) return { error: "We could not save that work. Nothing was created." + again, values: typed(form) };
  const id = (data[0] as { id: string }).id;
  // The image goes up after the draft exists; if it fails, the draft is kept and the reason is
  // carried to the work's page, never lost behind a generic notice.
  if (hasImage) {
    const problem = await storeImage(db, id, file as File, String(form.get("alt_text") ?? "").trim() || null);
    // A code, never the message: text in a URL can be planted by anyone who sends a link.
    if (problem) {
      const code = problem.includes("12 MB") ? "too_large" : problem.includes("not yours") ? "not_yours" : "failed";
      redirect(`/studio/works/${id}?created=1&image_problem=${code}`);
    }
    redirect(`/studio/works/${id}?created=image`);
  }
  redirect(`/studio/works/${id}?created=1`);
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

type Db = Awaited<ReturnType<typeof client>>;

/** Store one image for a work: the row first (`uploading`), then the bytes, then `ready` — or
 *  `failed`, visible as itself, never blocking the other images (DOMAIN_MODEL §2.4). */
async function storeImage(db: Db, workId: string, file: File, alt: string | null): Promise<string | null> {
  if (file.size > 12 * 1024 * 1024) return "That image is larger than 12 MB. Export it smaller.";
  // The storage key is chosen HERE and written before a single byte is uploaded. The storage
  // policy that decides whether an object is this maker's own looks the key up in this table,
  // so a key written afterwards would make the maker's own upload unauthorised.
  const storageKey = crypto.randomUUID();
  const { data: siblings } = await db.from("work_images").select("position").eq("work_id", workId);
  const { data: created, error: insertError } = await db.from("work_images").insert({
    work_id: workId, position: await nextPosition(siblings as { position: number }[] | null),
    storage_key: storageKey, width: 0, height: 0, alt_text: alt, state: "uploading",
  }).select("id").limit(1);
  if (insertError || !created?.length) return "That work is not yours to add images to.";
  const imageId = (created[0] as { id: string }).id;
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const ingested = await ingestImage(bytes, db, storageKey);
    await db.from("work_images").update({
      width: ingested.width, height: ingested.height, variants: ingested.variants, state: "ready",
    }).eq("id", imageId);
    return null;
  } catch (e) {
    await db.from("work_images").update({ state: "failed" }).eq("id", imageId);
    const why = e instanceof Error ? e.message : "we could not read that file";
    return `That image did not go up — ${why}. The other images are untouched; try again.`;
  }
}

export async function addImageAction(_prev: FormState, form: FormData): Promise<FormState> {
  await requireActiveMaker();
  const workId = String(form.get("work_id") ?? "");
  const alt = String(form.get("alt_text") ?? "").trim() || null;
  const file = form.get("image");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose an image file." };
  const problem = await storeImage(await client(), workId, file, alt);
  if (problem) return { error: problem };
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
  // Scoped to the work the guard just checked, so a post pairing one work's image with another
  // work's id cannot slip past the last-image rule.
  const { data: gone } = await db.from("work_images").delete().eq("id", id).eq("work_id", workId).select("id");
  if (!gone?.length) redirect(`/studio/works/${workId}?kept=unchanged`);
  revalidatePath(`/studio/works/${workId}`);
  redirect(`/studio/works/${workId}?removed=image`);
}

export async function publishWorkAction(_prev: FormState, form: FormData): Promise<FormState> {
  await requireActiveMaker();
  const workId = String(form.get("work_id") ?? "");
  const intent = String(form.get("intent_key") ?? "");
  if (!intent) return { error: "This page is out of date. Reload it and publish again." };

  const db = await client();
  const { data: named } = await db.from("works").select("title").eq("id", workId).limit(1);
  if ((named?.[0] as { title: string } | undefined)?.title === UNTITLED) {
    return { error: "Give this work its title in the label below, then publish." };
  }
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

/** J-003 from the Studio row: one choice applies at once, and the row offers Undo. The previous
 *  status travels in the redirect so Undo is a plain form, and works without script. */
export async function changeStatusAction(form: FormData): Promise<void> {
  await requireActiveMaker();
  const workId = String(form.get("work_id") ?? "");
  const status = String(form.get("status") ?? "");
  const from = String(form.get("from") ?? "");
  const undo = form.get("undo") === "1";
  const db = await client();
  const { error } = await db.rpc("set_work_status", { p_work_id: workId, p_status: status });
  if (error) redirect(`/studio?unchanged=${workId}`);
  revalidatePath("/", "layout");
  redirect(undo ? `/studio?restored_status=${workId}` : `/studio?changed=${workId}&from=${encodeURIComponent(from)}`);
}

/** J-003 reconfirmation: "Status last confirmed 4 months ago · Confirm". One tap states the
 *  same status again, so status_confirmed_at becomes now, without opening the picker. The form
 *  carries the status the maker was shown; if the stored status differs (changed on another
 *  device since the page loaded), nothing is confirmed, because the maker did not see it. The
 *  status written is the stored one, never a value from the form. */
export async function reconfirmStatusAction(form: FormData): Promise<void> {
  await requireActiveMaker();
  const workId = String(form.get("work_id") ?? "");
  const db = await client();
  const { data } = await db.from("works").select("status").eq("id", workId).limit(1);
  const current = (data?.[0] as { status: string } | undefined)?.status;
  if (!current || current !== String(form.get("expected") ?? "")) redirect(`/studio?unchanged=${workId}`);
  const { error } = await db.rpc("set_work_status", { p_work_id: workId, p_status: current });
  if (error) redirect(`/studio?unchanged=${workId}`);
  revalidatePath("/", "layout");
  redirect(`/studio?confirmed=${workId}`);
}

export async function retireWorkAction(form: FormData): Promise<void> {
  await requireActiveMaker();
  const workId = String(form.get("work_id") ?? "");
  const db = await client();
  const { error } = await db.rpc("retire_work", { p_work_id: workId });
  // Say "retired" only when it was. A refused or failed retire leaves the work as it was.
  if (error) redirect(`/studio/works/${workId}?kept=unchanged`);
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
  const { data: back, error } = await db.from("works")
    .update({ lifecycle: "published", retired_at: null, updated_at: new Date().toISOString() })
    .eq("id", workId).eq("lifecycle", "retired").eq("taken_down", false).select("id");
  // Zero rows means nothing changed (taken down meanwhile, or not this maker's): say so.
  if (error || !back?.length) redirect(`/studio/works/${workId}?kept=unchanged`);
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
