import Link from "next/link";
import { Header } from "@/components/Chrome";
import { ActionForm, Field } from "@/components/ActionForm";
import { startRecoveryAction } from "@/app/actions/account";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reset your password" };

export default function Reset() {
  return (
    <>
      <Header />
      <main id="main" tabIndex={-1}>
      <div className="studio-state">
        <h1>Get a link to reset your password</h1>
        <p className="small">Enter the email you sign in with. If it has an account, a link is on its way.</p>
      </div>
      <ActionForm action={startRecoveryAction} submitLabel="Send the link" busyLabel="Sending…">
        <Field name="email" label="Email" type="email" required autoComplete="email" />
      </ActionForm>
      <div className="inline-actions">
        <Link className="textlink" href="/makers/sign-in">Back to sign in</Link>
      </div>
      </main>
    </>
  );
}
