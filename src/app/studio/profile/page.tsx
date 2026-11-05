import { redirect } from "next/navigation";
import { currentAccount } from "@/lib/auth";
import { studioContext } from "@/lib/queries";
import { StudioHeader } from "@/components/Chrome";
import { ActionForm, Field } from "@/components/ActionForm";
import { saveProfileAction } from "@/app/actions/studio";

export const dynamic = "force-dynamic";

export default async function Profile() {
  const account = await currentAccount();
  if (!account) redirect("/makers/sign-in?next=/studio/profile");
  const { maker, gallery } = await studioContext(account.id);

  return (
    <>
      <StudioHeader title="Identity" back="/studio" />
      <div className="studio-state">
        <h1>{maker ? "Your identity" : "Who is showing"}</h1>
        <p className="small" style={{ marginTop: 6 }}>
          Everything on this page is public. Your sign-in email is not on it.
        </p>
      </div>
      <ActionForm action={saveProfileAction} submitLabel="Save" busyLabel="Saving…">
        <Field name="display_name" label="Name shown to visitors" defaultValue={maker?.display_name}
               required placeholder="Anika Rao" />
        <Field name="handle" label="Gallery address" defaultValue={maker?.handle} required
               placeholder="anika-rao" help="Your gallery lives at /m/your-address. Lowercase and hyphens." />
        <div className="field">
          <label htmlFor="kind">How you work</label>
          <select id="kind" name="kind" defaultValue={maker?.kind ?? "individual"}>
            <option value="individual">On my own</option>
            <option value="studio">As a studio</option>
            <option value="collective">As a collective</option>
          </select>
          <div className="help">Studios and collectives are welcome. Retailers and resellers are not.</div>
        </div>
        <Field name="city" label="City" defaultValue={maker?.city} required placeholder="Bengaluru" />
        <Field name="practice_note" label="About your practice" textarea defaultValue={maker?.practice_note}
               help="In your own words. This is the wall text beside your work." />
        <Field name="intro" label="A line for the top of your gallery" textarea defaultValue={gallery?.intro} />
        <div className="field">
          <label htmlFor="commissions_open">Commissions</label>
          <label style={{ display: "flex", gap: 10, alignItems: "center", font: "var(--t-body)" }}>
            <input type="checkbox" id="commissions_open" name="commissions_open"
                   defaultChecked={maker?.commissions_open} />
            I am open to commissions
          </label>
        </div>
        <Field name="commissions_note" label="What you take on" textarea defaultValue={maker?.commissions_note} />
      </ActionForm>
    </>
  );
}
