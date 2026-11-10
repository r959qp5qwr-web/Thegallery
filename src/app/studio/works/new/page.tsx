import Link from "next/link";
import { redirect } from "next/navigation";
import { currentAccount } from "@/lib/auth";
import { studioContext, materials } from "@/lib/queries";
import { client } from "@/lib/supabase";
import { ActionForm } from "@/components/ActionForm";
import { PhotoTiles } from "@/components/PhotoPicker";
import { WorkLabelFields } from "@/components/WorkLabelFields";
import { createWorkAction } from "@/app/actions/studio";
import { DraftButton } from "@/components/DraftButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "New work" };

/** Add a work (drawing board, screen 13): photos first, choices as taps, size and a few words
 *  further down. Publish is docked at the foot; Save draft sits in the header. */
export default async function NewWork() {
  const account = await currentAccount();
  if (!account) redirect("/makers/sign-in?next=/studio/works/new");
  const [{ maker }, mats] = await Promise.all([studioContext(account.id), materials()]);
  if (!maker) redirect("/studio/join");

  // Start on the material this maker last used: a weaver should not have to move off Clay
  // every time. Row-level security scopes this read to the maker's own works.
  const db = await client();
  const { data: last } = await db.from("works").select("material").order("created_at", { ascending: false }).limit(1);
  const defaultMaterial = (last?.[0] as { material: string } | undefined)?.material ?? mats[0]?.key;

  return (
    <>
      <header className="header studio editor">
        <Link className="hdr-link" href="/studio">Cancel</Link>
        <span className="title">New work</span>
        {/* Submits the form below as a draft (the form attribute). It comes first in the page, so
            Enter in a field saves a draft — the safer of the two — and never publishes. */}
        <DraftButton form="new-work" />
      </header>
      <main id="main" tabIndex={-1} className="flow editor has-workbar">
        <h1 className="sr-only">New work</h1>
        <ActionForm action={createWorkAction} submitLabel="Publish" busyLabel="Publishing…" id="new-work"
                    dock={{ name: "intent", value: "publish", otherBusy: "Publish" }}>
          <PhotoTiles />
          <WorkLabelFields materials={mats} defaultMaterial={defaultMaterial} titleOptional />
        </ActionForm>
      </main>
    </>
  );
}
