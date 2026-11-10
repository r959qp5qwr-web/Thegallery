import { Header } from "@/components/Chrome";
import { ActionForm, Field } from "@/components/ActionForm";
import { createAccountAction } from "@/app/actions/account";

export const dynamic = "force-dynamic";
export const metadata = { title: "Open your gallery" };

/** Join, step 1 of 3 (drawing board, screen 8): the account. Your name and place come next,
 *  then WhatsApp; one question at a time. */
export default function CreateAccount() {
  return (
    <>
      <Header back="/makers" step="Step 1 of 3" />
      <main id="main" tabIndex={-1} className="flow has-workbar">
        <h1>Open your gallery</h1>
        <ActionForm action={createAccountAction} submitLabel="Continue" busyLabel="Creating…" dock>
          <Field name="email" label="Email" type="email" required autoComplete="email"
                 help="For signing in. Never shown." />
          <Field name="password" label="Password" type="password" required autoComplete="new-password"
                 help="At least 10 characters." />
        </ActionForm>
      </main>
    </>
  );
}
