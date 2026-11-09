import { Header } from "@/components/Chrome";
import { ActionForm, Field } from "@/components/ActionForm";
import { completeRecoveryAction } from "@/app/actions/account";

export const dynamic = "force-dynamic";
export const metadata = { title: "Set a new password" };

export default async function ResetWithToken({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <>
      <Header />
      <main id="main" tabIndex={-1}>
      <div className="studio-state">
        <h1>Choose a new password</h1>
        <p className="small">Setting it signs out every other session.</p>
      </div>
      <ActionForm action={completeRecoveryAction} submitLabel="Set password" busyLabel="Saving…"
                  hidden={{ token }}>
        <Field name="password" label="New password" type="password" required autoComplete="new-password"
               help="At least 10 characters." />
      </ActionForm>
      </main>
    </>
  );
}
