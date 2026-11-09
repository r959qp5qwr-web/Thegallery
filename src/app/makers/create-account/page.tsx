import Link from "next/link";
import { Header } from "@/components/Chrome";
import { ActionForm, Field } from "@/components/ActionForm";
import { createAccountAction } from "@/app/actions/account";

export const dynamic = "force-dynamic";
export const metadata = { title: "Create an account" };

export default function CreateAccount() {
  return (
    <>
      <Header />
      <main id="main" tabIndex={-1}>
      <div className="studio-state">
        <h1>Create your account</h1>
        <p className="small">Your email is only for signing in to your Studio, where you hang your work. It stays
          private: it is never shown on your gallery.</p>
      </div>
      <ActionForm action={createAccountAction} submitLabel="Create account" busyLabel="Creating…">
        <Field name="email" label="Email" type="email" required autoComplete="email" />
        <Field name="password" label="Password" type="password" required autoComplete="new-password"
               help="At least 10 characters. A longer password is stronger than one full of symbols." />
      </ActionForm>
      <div className="inline-actions">
        <Link className="textlink" href="/makers/sign-in">I already have an account</Link>
      </div>
      </main>
    </>
  );
}
