import { redirect } from "next/navigation";
import { currentAccount } from "@/lib/auth";
import { studioContext, materials } from "@/lib/queries";
import { StudioHeader } from "@/components/Chrome";
import { ActionForm, Field } from "@/components/ActionForm";
import { createWorkAction } from "@/app/actions/studio";

export const dynamic = "force-dynamic";

export default async function NewWork() {
  const account = await currentAccount();
  if (!account) redirect("/makers/sign-in?next=/studio/works/new");
  const [{ maker }, mats] = await Promise.all([studioContext(account.id), materials()]);
  if (!maker) redirect("/studio/profile");

  return (
    <>
      <StudioHeader title="Add a work" back="/studio" />
      <div className="studio-state">
        <h1>The label</h1>
        <p className="small" style={{ marginTop: 6 }}>Images come next, on the work&rsquo;s own page.</p>
      </div>
      <ActionForm action={createWorkAction} submitLabel="Save draft" busyLabel="Saving…">
        <Field name="title" label="Title" required placeholder="Monsoon Vessel No. 4" />
        <div className="field">
          <label htmlFor="material">Material</label>
          <select id="material" name="material" defaultValue="clay">
            {mats.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
          </select>
        </div>
        <Field name="medium" label="Medium" placeholder="Wood-fired stoneware"
               help="How you would write it on a wall label." />
        <Field name="process" label="About this work" textarea
               help="Optional. Shown under “About this work”." />
        <div className="field">
          <label>Dimensions (cm)</label>
          <div className="field inline" style={{ marginTop: 0 }}>
            <input name="height_cm" placeholder="Height" inputMode="decimal" aria-label="Height in centimetres" />
            <input name="width_cm" placeholder="Width" inputMode="decimal" aria-label="Width in centimetres" />
            <input name="depth_cm" placeholder="Depth" inputMode="decimal" aria-label="Depth in centimetres" />
          </div>
        </div>
        <Field name="year" label="Year" placeholder="2026" />
        <div className="field">
          <label htmlFor="price_mode">Price</label>
          <select id="price_mode" name="price_mode" defaultValue="exact">
            <option value="exact">Show a price</option>
            <option value="enquire">Price on enquiry</option>
            <option value="made_to_order">Made to order</option>
          </select>
          <div className="help">Whatever you choose, the sale happens between you and the visitor. The
            Gallery takes no part in it.</div>
        </div>
        <Field name="price_amount" label="Amount (₹)" placeholder="6800" />
        <div className="field">
          <label htmlFor="status">Status</label>
          <select id="status" name="status" defaultValue="available">
            <option value="available">Available</option>
            <option value="made_to_order">Made to order</option>
            <option value="enquire">Enquire</option>
            <option value="on_view">On view</option>
            <option value="sold">Sold</option>
          </select>
        </div>
      </ActionForm>
    </>
  );
}
