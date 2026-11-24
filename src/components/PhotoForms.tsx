"use client";
import { useRouter } from "next/navigation";
import { ActionForm, type FormState } from "./ActionForm";
import { preparePhoto, PhotoProblem, type PreparedPhoto } from "@/lib/photo-prepare";
import { beginPhotoAction, finishPhotoAction, createWorkAction, finishNewWorkAction } from "@/app/actions/studio";

/**
 * Adding a photograph without asking the server to touch its pixels (ledger GAL-L0044).
 *
 * The form, its fields, its button and its busy label are the same ActionForm as before; only
 * the action now runs here in the browser: prepare the photo (src/lib/photo-prepare.ts), ask the
 * server for signed upload addresses, send each file straight to storage, then ask the server to
 * check and record it. Each server step is a few milliseconds of work, inside the Worker's 10 ms.
 */

function chosenFile(form: FormData): File | null {
  const f = form.get("image");
  return f instanceof File && f.size > 0 ? f : null;
}

function problemText(e: unknown): string {
  return e instanceof PhotoProblem ? e.message : "We could not prepare that photo. Try again, or choose another.";
}

/** Reserve, send each file straight to storage, confirm. Null when the photo is ready. */
async function sendPhoto(workId: string, photo: PreparedPhoto, alt: string | null): Promise<string | null> {
  const ticket = await beginPhotoAction({
    workId, width: photo.width, height: photo.height, alt, files: photo.files.map((f) => f.name),
  });
  if ("error" in ticket) return ticket.error;
  let ok = true;
  for (const f of photo.files) {
    const url = ticket.uploads.find((u) => u.name === f.name)?.url;
    try {
      const res = url ? await fetch(url, { method: "PUT", headers: { "content-type": "image/jpeg" }, body: f.blob }) : null;
      if (!res?.ok) { ok = false; break; }
    } catch { ok = false; break; }
  }
  const done = await finishPhotoAction({ imageId: ticket.imageId, workId, ok });
  return done.error ?? null;
}

/** The work page's "Add image". */
export function AddPhotoForm({ workId, children }: { workId: string; children: React.ReactNode }) {
  const router = useRouter();
  async function add(_prev: FormState, form: FormData): Promise<FormState> {
    const file = chosenFile(form);
    if (!file) return { error: "Choose a photograph first.", field: "image" };
    const alt = String(form.get("alt_text") ?? "").trim() || null;
    let photo: PreparedPhoto;
    try { photo = await preparePhoto(file); } catch (e) {
      return { error: `That photo did not go up. ${problemText(e)}`, values: { alt_text: alt ?? "" } };
    }
    const problem = await sendPhoto(workId, photo, alt);
    router.refresh();
    return problem ? { error: problem } : { notice: "Image added." };
  }
  return (
    <ActionForm action={add} submitLabel="Add image" busyLabel="Uploading…">
      {children}
    </ActionForm>
  );
}

/** Add a work (drawing board, screen 13). The photo is prepared before anything is saved, so an
 *  unreadable file is refused with nothing created; the draft is then created, the photo sent,
 *  and the server lands the maker on the work's page (published, or saved as a draft). */
export function NewWorkForm({ children }: { children: React.ReactNode }) {
  async function create(prev: FormState, form: FormData): Promise<FormState> {
    const file = chosenFile(form);
    const alt = String(form.get("alt_text") ?? "").trim() || null;
    let photo: PreparedPhoto | null = null;
    if (file) {
      try { photo = await preparePhoto(file); } catch (e) {
        const values: Record<string, string> = {};
        form.forEach((v, k) => { if (typeof v === "string" && !k.startsWith("$")) values[k] = v; });
        return { error: `${problemText(e)} Choose the photo again.`, field: "image", values };
      }
    }
    const sent = new FormData();
    form.forEach((v, k) => { if (k !== "image") sent.append(k, v); });
    if (photo) sent.set("photo", "1");
    const state = await createWorkAction(prev, sent);
    if (!state.created || !photo) return state;
    const problem = await sendPhoto(state.created, photo, alt);
    await finishNewWorkAction({ workId: state.created, publishing: form.get("intent") === "publish", photoOk: !problem });
    return {};
  }
  return (
    <ActionForm action={create} submitLabel="Publish" busyLabel="Publishing…" id="new-work"
                dock={{ name: "intent", value: "publish", otherBusy: "Publish" }}>
      {children}
    </ActionForm>
  );
}
