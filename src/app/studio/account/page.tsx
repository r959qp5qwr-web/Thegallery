import { redirect } from "next/navigation";
import { currentAccount } from "@/lib/auth";
import { studioContext } from "@/lib/queries";
import { StudioHeader } from "@/components/Chrome";
import { ActionForm, Field } from "@/components/ActionForm";
import { closeAccountAction } from "@/app/actions/account";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your account" };

export default async function Account() {
  const account = await currentAccount();
  if (!account) redirect("/makers/sign-in?next=/studio/account");
  const { maker, works } = await studioContext(account.id);
  const published = works.filter((w) => w.lifecycle === "published").length;

  return (
    <>
      <StudioHeader title="Close account" back="/studio/settings" />
      <main id="main" tabIndex={-1}>
      <div className="studio-state">
        <h1>Close account</h1>
        <p className="small" style={{ marginTop: 6 }}>
          Signed in as {account.email}. This address is private and appears on no public page.
        </p>
      </div>

      <div className="form">
        <p className="body" style={{ marginTop: 12 }}>Closing takes effect at once. It does this:</p>
        <ul className="rowlist" style={{ padding: 0, marginTop: 12 }}>
          <li><span className="grow"><span className="primary">
            {published} published work{published === 1 ? " is" : "s are"} retired</span>
            <span className="secondary sentence">Their links keep working and say the work is no longer shown</span></span></li>
          <li><span className="grow"><span className="primary">Your gallery closes</span>
            <span className="secondary">{maker ? `/m/${maker.handle}` : "Your gallery"} stops being reachable</span></span></li>
          <li><span className="grow"><span className="primary">You are signed out everywhere</span>
            <span className="secondary sentence">And cannot sign in again with this address</span></span></li>
          <li><span className="grow"><span className="primary">Nothing is deleted for you to recover</span>
            <span className="secondary sentence">Closing is not the same as erasure; see the privacy page</span></span></li>
        </ul>
      </div>
      <ActionForm action={closeAccountAction} submitLabel="Close my account" busyLabel="Closing…">
        <Field name="confirm" label="Type close to confirm" placeholder="close" required />
      </ActionForm>
      </main>
    </>
  );
}
