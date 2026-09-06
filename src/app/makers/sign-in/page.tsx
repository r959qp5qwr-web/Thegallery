import Link from "next/link";
import { StudioHeader, Band } from "@/components/Chrome";
import { ActionForm, Field } from "@/components/ActionForm";
import { signInAction } from "@/app/actions/account";

export const dynamic = "force-dynamic";

export default async function SignIn(
  { searchParams }: { searchParams: Promise<{ next?: string; reset?: string; expired?: string }> },
) {
  const { next = "/studio", reset, expired } = await searchParams;
  return (
    <>
      <StudioHeader title="Sign in" back="/makers" />
      <div className="context"><span>Your Studio</span><span className="accent">Makers only</span></div>
      {reset ? <Band label="Password set">Your new password is in place. Sign in with it.</Band> : null}
      {expired ? <Band label="Session ended">You were signed out because the session expired. Sign in to carry on where you were.</Band> : null}
      <ActionForm action={signInAction} submitLabel="Sign in" busyLabel="Signing in…" hidden={{ next }}>
        <Field name="email" label="Email" type="email" required />
        <Field name="password" label="Password" type="password" required />
      </ActionForm>
      <div className="inline-actions">
        <Link className="btn quiet" href="/makers/reset"><span>I have forgotten my password</span></Link>
      </div>
      <div className="inline-actions">
        <Link className="btn quiet" href="/makers/create-account"><span>Create an account</span></Link>
      </div>
    </>
  );
}
