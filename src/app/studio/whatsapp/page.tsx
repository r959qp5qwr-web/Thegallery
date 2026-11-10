import Link from "next/link";
import { redirect } from "next/navigation";
import { currentAccount } from "@/lib/auth";
import { studioContext } from "@/lib/queries";
import { Header, StudioHeader } from "@/components/Chrome";
import { ActionForm, Field } from "@/components/ActionForm";
import { saveWhatsappAction } from "@/app/actions/studio";

export const dynamic = "force-dynamic";
export const metadata = { title: "WhatsApp" };

/** Join, step 3 of 3, and the Studio's task when no way to contact exists. It is public — the
 *  maker sees that before saving (GAL-P1) — and it can wait: a work can be published without it
 *  (GAL-OD-06). */
export default async function Whatsapp({ searchParams }: { searchParams: Promise<{ join?: string }> }) {
  const account = await currentAccount();
  if (!account) redirect("/makers/sign-in?next=/studio/whatsapp");
  const { maker } = await studioContext(account.id);
  if (!maker) redirect("/studio/join");
  const join = !!(await searchParams).join;
  return (
    <>
      {join ? <Header back="/studio/profile" step="Step 3 of 3" /> : <StudioHeader title="WhatsApp" back="/studio" />}
      <main id="main" tabIndex={-1} className="flow has-workbar">
        <h1>Your WhatsApp</h1>
        <p className="flow-line">Visitors tap Message and it opens a chat with you.</p>
        <ActionForm action={saveWhatsappAction} submitLabel={join ? "Continue" : "Save"} busyLabel="Saving…"
                    hidden={join ? { join: "1" } : undefined}
                    dock={{ extra: join ? <Link className="textlink" href="/studio?joined=1">Skip for now</Link> : undefined }}>
          <Field name="value" label="WhatsApp number" type="tel" required autoComplete="tel"
                 help="With + and the country code. Shown to visitors." />
        </ActionForm>
      </main>
    </>
  );
}
