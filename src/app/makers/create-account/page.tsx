import Link from "next/link";
import { StudioHeader } from "@/components/Chrome";
import { ActionForm, Field } from "@/components/ActionForm";
import { createAccountAction } from "@/app/actions/account";

export const dynamic = "force-dynamic";

export default function CreateAccount() {
  return (
    <>
      <StudioHeader title="Create account" back="/makers" />
      <div className="studio-state">
        <h1>Your email opens the Studio</h1>
        <p className="small" style={{ marginTop: 6 }}>
          This address is how you sign in. It stays private — it is never shown on your gallery and never
          appears in a public page. If you want people to email you, you add a separate public address later.
        </p>
      </div>
      <ActionForm action={createAccountAction} submitLabel="Create account" busyLabel="Creating…">
        <Field name="email" label="Email" type="email" required placeholder="you@example.com" />
        <Field name="password" label="Password" type="password" required
               help="At least 10 characters. Length beats punctuation." />
      </ActionForm>
      <div className="inline-actions">
        <Link className="btn quiet" href="/makers/sign-in"><span>I already have an account</span></Link>
      </div>
    </>
  );
}
