import { redirect } from "next/navigation";
import { currentAccount } from "@/lib/auth";
import { studioContext } from "@/lib/queries";
import { StudioHeader } from "@/components/Chrome";
import { ActionForm, Field, KeptSelect, KeptCheckbox } from "@/components/ActionForm";
import { saveProfileAction } from "@/app/actions/studio";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your details" };

export default async function Profile() {
  const account = await currentAccount();
  if (!account) redirect("/makers/sign-in?next=/studio/profile");
  const { maker, gallery } = await studioContext(account.id);

  return (
    <>
      <StudioHeader title="Your details" back="/studio/settings" />
      <main id="main" tabIndex={-1}>
      <div className="studio-state">
        <h1>{maker ? "Your details" : "Who is showing"}</h1>
        <p className="small" style={{ marginTop: 6 }}>
          Everything on this page is public. Your sign-in email is not on it.
        </p>
      </div>
      <ActionForm action={saveProfileAction} submitLabel="Save" busyLabel="Saving…">
        <Field name="display_name" label="Name shown to visitors" defaultValue={maker?.display_name}
               required />
        {/* No example values inside fields: an empty field must look empty. */}
        <Field name="handle" label="Gallery address" defaultValue={maker?.handle} required
               help="Your gallery lives at /m/your-address. Lowercase and hyphens, for example “anika-rao”." />
        <div className="field">
          <label htmlFor="kind">How you work</label>
          <KeptSelect name="kind" defaultValue={maker?.kind ?? "individual"}>
            <option value="individual">On my own</option>
            <option value="studio">As a studio</option>
            <option value="collective">As a collective</option>
          </KeptSelect>
          <div className="help">Studios and collectives are welcome. Retailers and resellers are not.</div>
        </div>
        <Field name="city" label="Place" defaultValue={maker?.city} required help="Your town or city." />
        <Field name="practice_note" label="About your practice" textarea defaultValue={maker?.practice_note}
               help="In your own words. This is the wall text beside your work." />
        <Field name="intro" label="A line for the top of your gallery" textarea defaultValue={gallery?.intro} />
        <div className="field">
          <label htmlFor="commissions_open">Commissions</label>
          <label style={{ display: "flex", gap: 10, alignItems: "center", font: "var(--t-body)" }}>
            <KeptCheckbox name="commissions_open" defaultChecked={maker?.commissions_open} />
            I am open to commissions
          </label>
        </div>
        <Field name="commissions_note" label="What you take on" textarea defaultValue={maker?.commissions_note} />
      </ActionForm>
      </main>
    </>
  );
}
