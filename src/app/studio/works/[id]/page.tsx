import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { currentAccount } from "@/lib/auth";
import { client } from "@/lib/supabase";
import { StudioHeader, Band } from "@/components/Chrome";
import { ActionForm, Field } from "@/components/ActionForm";
import { PublishButton } from "@/components/PublishButton";
import { addImageAction, removeImageAction, setStatusAction, retireWorkAction, restoreWorkAction,
         updateWorkLabelAction } from "@/app/actions/studio";
import { STATUS_LABEL, STATUS_ORDER, price, dimensions } from "@/lib/format";
import { materials } from "@/lib/queries";
import { WorkLabelFields } from "@/components/WorkLabelFields";

export const dynamic = "force-dynamic";

/** What the first image's failure means, by code (the URL carries only the code). */
const IMAGE_PROBLEM: Record<string, string> = {
  too_large: "That image is larger than 12 MB; export it smaller.",
  not_yours: "That work could not take images.",
  failed: "We could not read that file; a JPEG works best.",
};
export const metadata = { title: "Your work" };

type Row = {
  id: string; title: string; material: string; medium: string | null; process: string | null;
  height_mm: number | null; width_mm: number | null; depth_mm: number | null; year: number | null;
  price_mode: string; price_amount: string | null; status: string; lifecycle: string;
  public_token: string; taken_down: boolean;
};
type Img = { id: string; position: number; width: number; height: number; alt_text: string | null; state: string };

export default async function EditWork(
  { params, searchParams }: { params: Promise<{ id: string }>;
    searchParams: Promise<{ created?: string; confirm?: string; retired?: string; restored?: string; kept?: string; removed?: string; image_problem?: string }> },
) {
  const account = await currentAccount();
  if (!account) redirect("/makers/sign-in");
  const { id } = await params;
  const { created, confirm, retired, restored, kept, removed, image_problem } = await searchParams;
  const mats = await materials();

  const db = await client();
  const { data: workRows } = await db.from("works")
    .select("id,title,material,medium,process,height_mm,width_mm,depth_mm,year," +
            "price_mode,price_amount,status,lifecycle,public_token,taken_down")
    .eq("id", id).limit(1);
  const w = (workRows?.[0] as unknown as Row | undefined) ?? null;
  const { data: imageRows } = w
    ? await db.from("work_images").select("id,position,width,height,alt_text,state")
        .eq("work_id", id).order("position")
    : { data: [] };
  const data = w ? { work: w, images: (imageRows ?? []) as unknown as Img[] } : null;
  if (!data) notFound();
  const { work, images } = data;

  const ready = images.filter((i) => i.state === "ready");
  // The publish moment (R4): what the work's link will look like when it is shared.
  const { data: me } = await db.from("makers").select("display_name").limit(1);
  const makerName = (me?.[0] as { display_name: string } | undefined)?.display_name ?? "";
  const base = process.env.GALLERY_BASE_URL ?? "";
  const publicUrl = `${base}/work/${work.public_token}`;
  const shareText = `${work.title} — ${publicUrl}`;
  const failed = images.filter((i) => i.state === "failed");
  const dims = dimensions(work.height_mm, work.width_mm, work.depth_mm);

  // A fresh idempotency key per render of the page. Two presses of Publish in the same page
  // carry the same key and cannot publish twice; a reload issues a new key, which the
  // transition function then answers with "already published" rather than a second write.
  const intentKey = `publish:${work.id}:${crypto.randomUUID()}`;   // Web Crypto: a Worker has no node:crypto

  return (
    <>
      <StudioHeader title={work.lifecycle === "published" ? "Published work" : work.lifecycle === "retired" ? "Retired work" : "Draft work"} back="/studio" />
      <main id="main" tabIndex={-1}>
      {created === "image" ? <Band label="Saved">Your draft is saved with its first image. Add the rest, give it a
        title if it has none, then publish.</Band> : created && !image_problem ? <Band label="Saved">The label is saved. Add images, then publish.</Band> : null}
      {image_problem && IMAGE_PROBLEM[image_problem] ? <Band kind="fail" label="The image did not go up">Your draft is saved. {IMAGE_PROBLEM[image_problem]} Add the image again below.</Band> : null}
      {retired ? <Band label="Retired">This work is no longer on view. Its link now says so. You can restore it below.</Band> : null}
      {restored ? <Band label="Restored">This work is on view again, with its status as it was.</Band> : null}
      {removed === "image" ? <Band label="Removed">The image is removed. The others are unchanged.</Band> : null}
      {kept === "last-image" ? (
        <Band kind="warn" label="Image kept">A published work keeps at least one image. Add another first, or retire the work.</Band>
      ) : null}
      {kept === "unchanged" ? (
        <Band kind="warn" label="Nothing changed">That did not go through, so the work is as it was. Reload the page and try again.</Band>
      ) : null}
      {kept === "no-image" ? (
        <Band kind="warn" label="Not restored">Add an image that finished uploading, then restore the work.</Band>
      ) : null}
      {work.taken_down ? (
        <Band kind="warn" label="Taken down">
          An operator has taken this work down. It is not shown publicly. Reply to the notice you were sent.
        </Band>
      ) : null}

      <div className="label" style={{ paddingTop: 16 }}>
        <div className={`status ${work.status === "sold" ? "sold" : "available"}`}>
          {work.lifecycle === "published" ? STATUS_LABEL[work.status] : work.lifecycle === "retired" ? "Retired" : "Draft"}
          {work.price_mode === "exact"
            ? <span className="price">· {price(work.price_mode, work.price_amount)}</span> : null}
        </div>
        <h1 className="title">{work.title}</h1>
        <div className="meta">{work.medium ?? work.material}</div>
        {dims ? <div className="dims">{dims}</div> : null}
      </div>

      <div className="group" style={{ margin: "28px var(--pad-x-studio) 0" }}>
        <div className="ghead">Images · {ready.length} ready</div>
      </div>
      <div className="uploads" style={{ margin: "12px var(--pad-x-studio) 0" }}>
        {images.map((im) => (
          <div className="uptile" key={im.id}>
            {im.state === "ready" ? (
              <img src={`/img/${im.id}/w320`} alt={im.alt_text ?? ""}
                   style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : im.state === "failed" ? (
              <span className="failed">Failed<u>remove and try again</u></span>
            ) : <span className="failed">Uploading</span>}
            <span className="pos">{im.position + 1}</span>
          </div>
        ))}
      </div>
      {images.length ? (
        <div className="inline-actions">
          {/* Removing an image deletes it; there is no undo, so the act is confirmed first. */}
          {images.map((im) => confirm === `remove-${im.id}` ? (
            <form key={im.id} action={removeImageAction} className="inline-confirm" role="group"
                  aria-labelledby={`remove-${im.id}`}>
              <input type="hidden" name="id" value={im.id} />
              <input type="hidden" name="work_id" value={work.id} />
              <p className="small" id={`remove-${im.id}`} style={{ margin: "0 0 8px" }}>
                Image {im.position + 1} is deleted. This cannot be undone.</p>
              <button className="btn alarm" type="submit">Remove image {im.position + 1}</button>
              <Link className="btn quiet" href={`/studio/works/${work.id}`}><span>Keep</span></Link>
            </form>
          ) : (
            <Link key={im.id} className="btn quiet" href={`/studio/works/${work.id}?confirm=remove-${im.id}`}
                  aria-label={`Remove image ${im.position + 1}`}><span>Remove {im.position + 1}…</span></Link>
          ))}
        </div>
      ) : null}
      {failed.length ? (
        <Band kind="fail" label="An image did not go up">
          {failed.length} image{failed.length === 1 ? "" : "s"} failed. The others are safe — remove the
          failed one and try it again.
        </Band>
      ) : null}

      <ActionForm action={addImageAction} submitLabel="Add image" busyLabel="Uploading…"
                  hidden={{ work_id: work.id }}>
        <div className="field">
          <label htmlFor="image">Image file</label>
          <input id="image" name="image" type="file" accept="image/*" required />
          <div className="help">Portrait, landscape or square — the shape you shot is the shape shown.
            Nothing is cropped.</div>
        </div>
        <Field name="alt_text" label="Describe the image" help="For anyone who cannot see it." />
      </ActionForm>

      <div className="group" style={{ margin: "28px var(--pad-x-studio) 0" }}>
        <div className="ghead">{work.lifecycle === "published" ? "Status" : "Publish"}</div>
      </div>

      {work.lifecycle === "published" ? (
        <>
          <form action={setStatusAction} className="form">
            <div className="field">
              <label htmlFor="status">This work is</label>
              <select id="status" name="status" defaultValue={work.status}>
                {STATUS_ORDER.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
              </select>
              <div className="help">Every public page reads this one setting, so a change shows everywhere
                at once.</div>
            </div>
            <input type="hidden" name="work_id" value={work.id} />
            <div className="inline-actions" style={{ padding: "16px 0 0" }}>
              <button className="btn" type="submit">Save status</button>
              <Link className="btn quiet" href={`/work/${work.public_token}`}><span>View public page</span></Link>
            </div>
          </form>
          {!work.taken_down ? (
            <section className="share" aria-labelledby="share-title" data-testid="share">
              <div className="group" style={{ margin: "28px 0 0" }}><div className="ghead" id="share-title">Share</div></div>
              <p className="small" style={{ margin: "8px 0 12px" }}>This is how its link looks when you send it on WhatsApp.</p>
              {/* Built from the same fields as the page's share tags (generateMetadata in
                  /work/[token]): the cover, the title with your name, the medium and the status. */}
              <div className="share-card" aria-hidden>
                {ready[0] ? <img src={`/img/${ready[0].id}/w640`} alt="" /> : null}
                <div className="share-text">
                  <div className="share-title">{work.title} by {makerName}</div>
                  <div className="share-desc">{[work.medium ?? work.material, STATUS_LABEL[work.status]].filter(Boolean).join(" · ")}</div>
                  <div className="share-host">{base.replace(/^https?:\/\//, "")}</div>
                </div>
              </div>
              <div className="inline-actions" style={{ padding: "16px 0 0" }}>
                <a className="btn" href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer"
                   data-testid="share-whatsapp"><span>Share on WhatsApp</span><span className="sr-only"> (opens in a new tab)</span></a>
              </div>
            </section>
          ) : null}
          {/* Retiring takes a work off every public page. It is never one tap: the consequence is
              named first, and the act can be undone from this page (UX_FOUNDATION). */}
          {confirm === "retire" ? (
            <div className="confirm" role="group" aria-labelledby="retire-title" style={{ margin: "20px var(--pad-x-studio) 0" }}>
              <Band kind="warn" label="Retire this work?">
                <span id="retire-title">&ldquo;{work.title}&rdquo; leaves the entrance, its material, search and
                your gallery. Its link stays and says it is no longer on view. You can restore it later.</span>
              </Band>
              <div className="inline-actions">
                <form action={retireWorkAction}>
                  <input type="hidden" name="work_id" value={work.id} />
                  <button className="btn" type="submit">Retire work</button>
                </form>
                <Link className="btn quiet" href={`/studio/works/${work.id}`}><span>Keep it on view</span></Link>
              </div>
            </div>
          ) : (
            <div className="inline-actions">
              <Link className="btn quiet" href={`/studio/works/${work.id}?confirm=retire`}><span>Retire this work…</span></Link>
            </div>
          )}
        </>
      ) : work.lifecycle === "retired" ? (
        <div className="inline-actions">
          <p className="small" style={{ margin: 0 }}>Retired. Not shown on any public page.</p>
          {!work.taken_down ? (
            <form action={restoreWorkAction}>
              <input type="hidden" name="work_id" value={work.id} />
              <button className="btn" type="submit">Restore to view</button>
            </form>
          ) : null}
        </div>
      ) : (
        <PublishButton workId={work.id} intentKey={intentKey} canPublish={ready.length > 0} />
      )}

      <ActionForm action={updateWorkLabelAction} submitLabel="Save label" busyLabel="Saving…"
                  hidden={{ work_id: work.id }} bar={null}>
        <WorkLabelFields materials={mats} withStatus={false} values={work} />
      </ActionForm>
      </main>
    </>
  );
}
