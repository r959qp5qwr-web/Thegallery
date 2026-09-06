import Link from "next/link";
import { StudioHeader } from "@/components/Chrome";
import { ActionForm, Field } from "@/components/ActionForm";
import { startRecoveryAction } from "@/app/actions/account";

export const dynamic = "force-dynamic";

export default function Reset() {
  return (
    <>
      <StudioHeader title="Set a new password" back="/makers/sign-in" />
      <div className="studio-state">
        <h1>Send yourself a link</h1>
        <p className="small" style={{ marginTop: 6 }}>
          We will reply the same way whether or not there is an account, so nobody can use this to find out
          who is registered.
        </p>
      </div>
      <ActionForm action={startRecoveryAction} submitLabel="Send the link" busyLabel="Sending…">
        <Field name="email" label="Email" type="email" required />
      </ActionForm>
      <div className="inline-actions">
        <Link className="btn quiet" href="/makers/sign-in"><span>Back to sign in</span></Link>
      </div>
    </>
  );
}
