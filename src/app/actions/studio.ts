"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { randomBytes } from "node:crypto";
import { currentAccount } from "@/lib/auth";
import { asAccount } from "@/lib/db";
import { ingestImage } from "@/lib/storage";
import { validateRoute } from "@/lib/format";

export type FormState = { error?: string; notice?: string };

async function requireActiveMaker() {
  const account = await currentAccount();
  if (!account) redirect("/makers/sign-in?next=/studio");
  return account;
}

const token = () => randomBytes(5).toString("base64url").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8);

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

  try {
    await asAccount(account.id, async (db) => {
      const existing = await db.query<{ id: string }>("SELECT id FROM makers WHERE account_id = $1", [account.id]);
      if (existing.rowCount) {
        await db.query(
          `UPDATE makers SET handle = $2, display_name = $3, kind = $4, city = $5, practice_note = $6,
                             commissions_open = $7, commissions_note = $8, updated_at = now()
             WHERE account_id = $1`,
          [account.id, handle, display_name, kind, city, practice_note, commissions_open, commissions_note]);
      } else {
        const maker = await db.query<{ id: string }>(
          `INSERT INTO makers (account_id, handle, display_name, kind, city, practice_note,
                               commissions_open, commissions_note)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
          [account.id, handle, display_name, kind, city, practice_note, commissions_open, commissions_note]);
        await db.query("INSERT INTO galleries (maker_id, intro) VALUES ($1, $2)", [maker.rows[0].id, intro]);
      }
      if (intro !== null) {
        await db.query(
          `UPDATE galleries SET intro = $2 WHERE maker_id = (SELECT id FROM makers WHERE account_id = $1)`,
          [account.id, intro]);
      }
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("makers_handle_key")) {
      return { error: "That gallery address is taken. Try another." };
    }
    return { error: "We could not save that just now. Nothing was changed." };
  }
  revalidatePath("/studio");
  redirect("/studio?saved=profile");
}

// ------------------------------------------------------------------------- contact routes
export async function saveRouteAction(_prev: FormState, form: FormData): Promise<FormState> {
  const account = await requireActiveMaker();
  const kind = String(form.get("kind") ?? "");
  const value = String(form.get("value") ?? "").trim();
  const label = String(form.get("label") ?? "").trim() || null;
  const problem = validateRoute(kind, value);
  if (problem) return { error: problem };

  await asAccount(account.id, async (db) => {
    const maker = await db.query<{ id: string }>("SELECT id FROM makers WHERE account_id = $1", [account.id]);
    if (!maker.rowCount) return;
    // validated = true because the format was checked here; enabled = true because a maker
    // who typed a route means it to be used. Both stay separate columns so a route can be
    // turned off without being deleted (DOMAIN_MODEL §2.7).
    await db.query(
      `INSERT INTO contact_routes (maker_id, kind, value, label, enabled, validated, position)
       VALUES ($1, $2, $3, $4, true, true,
               COALESCE((SELECT max(position) + 1 FROM contact_routes WHERE maker_id = $1), 0))`,
      [maker.rows[0].id, kind, value, label]);
  });
  revalidatePath("/studio/contact-routes");
  return { notice: "Route added. It becomes an action on your gallery straight away." };
}

export async function toggleRouteAction(form: FormData): Promise<void> {
  const account = await requireActiveMaker();
  const id = String(form.get("id") ?? "");
  await asAccount(account.id, (db) =>
    db.query("UPDATE contact_routes SET enabled = NOT enabled WHERE id = $1", [id]));
  revalidatePath("/studio/contact-routes");
}

export async function deleteRouteAction(form: FormData): Promise<void> {
  const account = await requireActiveMaker();
  const id = String(form.get("id") ?? "");
  await asAccount(account.id, (db) => db.query("DELETE FROM contact_routes WHERE id = $1", [id]));
  revalidatePath("/studio/contact-routes");
}

// -------------------------------------------------------------------------------- works
export async function createWorkAction(_prev: FormState, form: FormData): Promise<FormState> {
  const account = await requireActiveMaker();
  const title = String(form.get("title") ?? "").trim();
  const material = String(form.get("material") ?? "");
  const medium = String(form.get("medium") ?? "").trim() || null;
  const process = String(form.get("process") ?? "").trim() || null;
  const price_mode = String(form.get("price_mode") ?? "enquire");
  const rawPrice = String(form.get("price_amount") ?? "").trim();
  const status = String(form.get("status") ?? "available");
  const year = String(form.get("year") ?? "").trim();
  const mm = (name: string) => {
    const v = String(form.get(name) ?? "").trim();
    if (!v) return null;
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? Math.round(n * 10) : null;  // entered in cm, stored in mm
  };

  if (!title) return { error: "A work needs a title." };
  if (!material) return { error: "Choose the material." };
  if (price_mode === "exact" && !(Number(rawPrice) >= 0)) {
    return { error: "Enter the price, or choose price on enquiry." };
  }

  let workId = "";
  try {
    workId = await asAccount(account.id, async (db) => {
      const gallery = await db.query<{ id: string }>(
        "SELECT g.id FROM galleries g JOIN makers m ON m.id = g.maker_id WHERE m.account_id = $1", [account.id]);
      if (!gallery.rowCount) throw new Error("no gallery");
      const r = await db.query<{ id: string }>(
        `INSERT INTO works (public_token, gallery_id, title, material, medium, process,
                            height_mm, width_mm, depth_mm, year, price_mode, price_amount, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id`,
        [token(), gallery.rows[0].id, title, material, medium, process,
         mm("height_cm"), mm("width_cm"), mm("depth_cm"),
         year ? Number(year) : null, price_mode, price_mode === "exact" ? rawPrice : null, status]);
      return r.rows[0].id;
    });
  } catch (e) {
    if (e instanceof Error && e.message === "no gallery") {
      return { error: "Set up your maker identity first — that is what a work belongs to." };
    }
    return { error: "We could not save that work. Nothing was created." };
  }
  redirect(`/studio/works/${workId}?created=1`);
}

export async function addImageAction(_prev: FormState, form: FormData): Promise<FormState> {
  const account = await requireActiveMaker();
  const workId = String(form.get("work_id") ?? "");
  const alt = String(form.get("alt_text") ?? "").trim() || null;
  const file = form.get("image");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose an image file." };
  if (file.size > 12 * 1024 * 1024) return { error: "That image is larger than 12 MB. Export it smaller." };

  // The row is written first in `uploading`, then moved to `ready` once the bytes are on
  // disk, and left at `failed` if they are not. A half-finished upload is therefore visible
  // as itself and never blocks the other images (DOMAIN_MODEL §2.4).
  let imageId = "";
  try {
    imageId = await asAccount(account.id, async (db) => {
      const r = await db.query<{ id: string }>(
        `INSERT INTO work_images (work_id, position, storage_key, width, height, alt_text, state)
         VALUES ($1, COALESCE((SELECT max(position) + 1 FROM work_images WHERE work_id = $1), 0),
                 '', 0, 0, $2, 'uploading') RETURNING id`, [workId, alt]);
      return r.rows[0].id;
    });
  } catch {
    return { error: "That work is not yours to add images to." };
  }

  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    const ingested = await ingestImage(bytes);
    await asAccount(account.id, (db) =>
      db.query(
        `UPDATE work_images SET storage_key = $2, width = $3, height = $4, variants = $5, state = 'ready'
          WHERE id = $1`,
        [imageId, ingested.storageKey, ingested.width, ingested.height, JSON.stringify(ingested.variants)]));
  } catch (e) {
    await asAccount(account.id, (db) =>
      db.query("UPDATE work_images SET state = 'failed' WHERE id = $1", [imageId]));
    const why = e instanceof Error ? e.message : "we could not read that file";
    return { error: `That image did not go up — ${why}. The other images are untouched; try again.` };
  }
  revalidatePath(`/studio/works/${workId}`);
  return { notice: "Image added." };
}

export async function removeImageAction(form: FormData): Promise<void> {
  const account = await requireActiveMaker();
  const id = String(form.get("id") ?? "");
  const workId = String(form.get("work_id") ?? "");
  await asAccount(account.id, (db) => db.query("DELETE FROM work_images WHERE id = $1", [id]));
  revalidatePath(`/studio/works/${workId}`);
}

export async function publishWorkAction(_prev: FormState, form: FormData): Promise<FormState> {
  const account = await requireActiveMaker();
  const workId = String(form.get("work_id") ?? "");
  const intent = String(form.get("intent_key") ?? "");
  if (!intent) return { error: "This form went stale. Reload the page and publish again." };

  try {
    const outcome = await asAccount(account.id, async (db) => {
      const r = await db.query<{ outcome: string; public_token: string }>(
        "SELECT * FROM app.publish_work($1, $2)", [workId, intent]);
      return r.rows[0];
    });
    revalidatePath("/"); revalidatePath(`/studio/works/${workId}`);
    // A second press of the same button carries the same intent key and cannot publish twice.
    return { notice: outcome.outcome === "published" ? "Published." : "Already published — nothing changed." };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("ready image")) return { error: "Add at least one image that finished uploading, then publish." };
    if (msg.includes("not yours")) return { error: "That work is not yours." };
    return { error: "Publishing did not complete. Nothing was changed — your work is still here." };
  }
}

export async function setStatusAction(form: FormData): Promise<void> {
  const account = await requireActiveMaker();
  const workId = String(form.get("work_id") ?? "");
  const status = String(form.get("status") ?? "");
  await asAccount(account.id, (db) => db.query("SELECT app.set_work_status($1, $2)", [workId, status]));
  // Every public surface reads one column, so one revalidation is the whole propagation.
  revalidatePath("/", "layout");
}

export async function retireWorkAction(form: FormData): Promise<void> {
  const account = await requireActiveMaker();
  const workId = String(form.get("work_id") ?? "");
  await asAccount(account.id, (db) => db.query("SELECT app.retire_work($1)", [workId]));
  revalidatePath("/", "layout");
}

export async function publishGalleryAction(form: FormData): Promise<void> {
  const account = await requireActiveMaker();
  const galleryId = String(form.get("gallery_id") ?? "");
  await asAccount(account.id, (db) =>
    db.query(`UPDATE galleries SET lifecycle = 'published', published_at = now()
               WHERE id = $1 AND lifecycle IN ('draft','hidden')`, [galleryId]));
  revalidatePath("/", "layout");
}
