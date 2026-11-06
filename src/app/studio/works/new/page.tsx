import { redirect } from "next/navigation";
import { currentAccount } from "@/lib/auth";
import { studioContext, materials } from "@/lib/queries";
import { client } from "@/lib/supabase";
import { StudioHeader } from "@/components/Chrome";
import { ActionForm } from "@/components/ActionForm";
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
      <div className="studio-state">
        <h1>The label</h1>
        <p className="small" style={{ marginTop: 6 }}>Images come next, on the work&rsquo;s own page.</p>
      </div>
      <ActionForm action={createWorkAction} submitLabel="Save draft" busyLabel="Saving…">
        {/* No example values inside fields: a filled-looking empty field leaves a first-time
            maker unsure what is saved. Examples, where useful, live in the help line. */}
        <WorkLabelFields materials={mats} defaultMaterial={defaultMaterial} />
      </ActionForm>
    </>
  );
}
