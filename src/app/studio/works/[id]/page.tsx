import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { randomUUID } from "node:crypto";
import { currentAccount } from "@/lib/auth";
import { asAccount } from "@/lib/db";
import { StudioHeader, Band } from "@/components/Chrome";
import { ActionForm, Field } from "@/components/ActionForm";
import { PublishButton } from "@/components/PublishButton";
import { addImageAction, removeImageAction, setStatusAction, retireWorkAction } from "@/app/actions/studio";
import { STATUS_LABEL, price, dimensions } from "@/lib/format";

export const dynamic = "force-dynamic";

type Row = {
  id: string; title: string; material: string; medium: string | null; process: string | null;
  height_mm: number | null; width_mm: number | null; depth_mm: number | null; year: number | null;
  price_mode: string; price_amount: string | null; status: string; lifecycle: string;
  public_token: string; taken_down: boolean;
};
type Img = { id: string; position: number; width: number; height: number; alt_text: string | null; state: string };

export default async function EditWork(
  { params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> },
) {
  const account = await currentAccount();
  if (!account) redirect("/makers/sign-in");
  const { id } = await params;
  const { created } = await searchParams;

  const data = await asAccount(account.id, async (db) => {
    const w = (await db.query<Row>(
      `SELECT id, title, material, medium, process, height_mm, width_mm, depth_mm, year,
              price_mode, price_amount, status, lifecycle, public_token, taken_down
         FROM works WHERE id = $1`, [id])).rows[0] ?? null;
    if (!w) return null;
    const images = (await db.query<Img>(
      "SELECT id, position, width, height, alt_text, state FROM work_images WHERE work_id = $1 ORDER BY position",
      [id])).rows;
    return { work: w, images };
  });
  if (!data) notFound();
  const { work, images } = data;

  const ready = images.filter((i) => i.state === "ready");
  const failed = images.filter((i) => i.state === "failed");
  const dims = dimensions(work.height_mm, work.width_mm, work.depth_mm);

  // A fresh idempotency key per render of the page. Two presses of Publish in the same page
  // carry the same key and cannot publish twice; a reload issues a new key, which the
  // transition function then answers with "already published" rather than a second write.
  const intentKey = `publish:${work.id}:${randomUUID()}`;

  return (
    <>
      <StudioHeader title={work.lifecycle === "published" ? "Published work" : "Draft work"} back="/studio" />
      {created ? <Band label="Saved">The label is saved. Add images, then publish.</Band> : null}
      {work.taken_down ? (
        <Band kind="warn" label="Taken down">
          An operator has taken this work down. It is not shown publicly. Reply to the notice you were sent.
        </Band>
      ) : null}

      <div className="label" style={{ paddingTop: 16 }}>
        <div className={`status ${work.status === "sold" ? "sold" : "available"}`}>
          {work.lifecycle === "published" ? STATUS_LABEL[work.status] : "Draft"}
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
          {images.map((im) => (
            <form key={im.id} action={removeImageAction}>
              <input type="hidden" name="id" value={im.id} />
              <input type="hidden" name="work_id" value={work.id} />
              <button className="btn quiet" type="submit"><span>Remove {im.position + 1}</span></button>
            </form>
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
                <option value="available">Available</option>
                <option value="made_to_order">Made to order</option>
                <option value="enquire">Enquire</option>
                <option value="on_view">On view</option>
                <option value="sold">Sold</option>
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
          <form action={retireWorkAction} className="inline-actions">
            <input type="hidden" name="work_id" value={work.id} />
            <button className="btn quiet" type="submit"><span>Take this work off view</span></button>
          </form>
        </>
      ) : (
        <PublishButton workId={work.id} intentKey={intentKey} canPublish={ready.length > 0} />
      )}
    </>
  );
}
