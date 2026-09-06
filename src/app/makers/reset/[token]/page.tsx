import { StudioHeader } from "@/components/Chrome";
import { ActionForm, Field } from "@/components/ActionForm";
import { completeRecoveryAction } from "@/app/actions/account";

export const dynamic = "force-dynamic";

export default async function ResetWithToken({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <>
      <StudioHeader title="Set a new password" />
      <div className="studio-state">
        <h1>Choose a new password</h1>
        <p className="small" style={{ marginTop: 6 }}>Setting it signs out every other session.</p>
      </div>
      <ActionForm action={completeRecoveryAction} submitLabel="Set password" busyLabel="Saving…"
                  hidden={{ token }}>
        <Field name="password" label="New password" type="password" required
               help="At least 10 characters." />
      </ActionForm>
    </>
  );
}
