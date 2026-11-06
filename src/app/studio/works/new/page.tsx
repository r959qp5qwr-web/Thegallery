import { redirect } from "next/navigation";
import { currentAccount } from "@/lib/auth";
import { studioContext, materials } from "@/lib/queries";
import { client } from "@/lib/supabase";
import { StudioHeader } from "@/components/Chrome";
import { ActionForm, Field } from "@/components/ActionForm";
import { WorkLabelFields } from "@/components/WorkLabelFields";
import { createWorkAction } from "@/app/actions/studio";

export const dynamic = "force-dynamic";
export const metadata = { title: "Add a work" };

export default async function NewWork() {
  const account = await currentAccount();
  if (!account) redirect("/makers/sign-in?next=/studio/works/new");
  const [{ maker }, mats] = await Promise.all([studioContext(account.id), materials()]);
  if (!maker) redirect("/studio/profile");

  // Start on the material this maker last used: a weaver should not have to move off Clay
  // every time. Row-level security scopes this read to the maker's own works.
  const db = await client();
  const { data: last } = await db.from("works").select("material").order("created_at", { ascending: false }).limit(1);
  const defaultMaterial = (last?.[0] as { material: string } | undefined)?.material ?? mats[0]?.key;

  return (
    <>
      <StudioHeader title="Add a work" back="/studio" />
      <main id="main" tabIndex={-1}>
      <div className="studio-state">
        <h1>Add a work</h1>
        <p className="small" style={{ marginTop: 6 }}>Start with a picture or with the label, whichever you
          have. Nothing is public until you publish.</p>
      </div>
      <ActionForm action={createWorkAction} submitLabel="Save draft" busyLabel="Saving…"
                  bar={<span className="savedline">Nothing is public until you publish</span>}>
        {/* Plate R-3: images first — the first is the cover. Adding one saves the draft. */}
        <div className="group" style={{ marginTop: 16 }}><div className="ghead">Images · the first is the cover</div></div>
        <div className="field">
          <label htmlFor="image">Image file</label>
          <input id="image" name="image" type="file" accept="image/*" />
          <div className="help">Portrait, landscape or square — the shape you shot is the shape shown.
            Add more on the next page.</div>
        </div>
        <Field name="alt_text" label="Describe the image" help="For anyone who cannot see it." />
        {/* No example values inside fields: a filled-looking empty field leaves a first-time
            maker unsure what is saved. Examples, where useful, live in the help line. */}
        <WorkLabelFields materials={mats} defaultMaterial={defaultMaterial} titleOptional />
      </ActionForm>
      </main>
    </>
  );
}
