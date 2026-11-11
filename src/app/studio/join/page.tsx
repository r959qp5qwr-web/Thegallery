import Link from "next/link";
import { redirect } from "next/navigation";
import { currentAccount } from "@/lib/auth";
import { studioContext } from "@/lib/queries";
import { Header } from "@/components/Chrome";
import { ActionForm, Field } from "@/components/ActionForm";
import { Segmented } from "@/components/WorkLabelFields";
import { joinAction } from "@/app/actions/studio";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your name and place" };

const KINDS = [
  { key: "individual", label: "On my own" },
  { key: "studio", label: "A studio" },
  { key: "collective", label: "A collective" },
];

/** Join, step 2 of 3 (drawing board, screen 8). The confirmation link lands here signed in. */
export default async function Join() {
  const account = await currentAccount();
  if (!account) redirect("/makers/sign-in?next=/studio/join");
  const { maker } = await studioContext(account.id);
  if (maker) redirect("/studio");
  return (
    <>
      <Header back="/makers" step="Step 2 of 3" />
      <main id="main" tabIndex={-1} className="flow has-workbar">
        <h1>Your name and place</h1>
        <ActionForm action={joinAction} submitLabel="Continue" busyLabel="Saving…" dock>
          <Field name="display_name" label="Name" required autoComplete="name"
                 help="Your own name, or your studio’s. Shown on your gallery." />
          <Field name="city" label="Place" required autoComplete="address-level2"
                 help="Your town or city. Shown on your gallery." />
          {/* The self-declaration made when a gallery is created (GAL-OD-02, GAL-OD-03). */}
          <Segmented name="kind" legend="How you work" options={KINDS} pick value="individual"
                     help={<>Show only work you made or had a real hand in making. Not resale.{" "}
                       <Link className="textlink" href="/participation">Who can open a gallery</Link></>} />
        </ActionForm>
      </main>
    </>
  );
}
