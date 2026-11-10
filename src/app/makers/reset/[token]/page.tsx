import { Header } from "@/components/Chrome";
import { ActionForm, Field } from "@/components/ActionForm";
import { completeRecoveryAction } from "@/app/actions/account";

export const dynamic = "force-dynamic";
export const metadata = { title: "New password" };

/** The second step of a reset (drawing board, screen 11): the same screen with one field. */
export default async function ResetWithToken({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <>
      <Header back="/makers/sign-in" />
      <main id="main" tabIndex={-1} className="flow has-workbar">
        <h1>New password</h1>
        <ActionForm action={completeRecoveryAction} submitLabel="Set password" busyLabel="Saving…"
                    hidden={{ token }} dock>
          <Field name="password" label="New password" type="password" required autoComplete="new-password"
                 help="At least 10 characters. Every other session is signed out." />
        </ActionForm>
      </main>
    </>
  );
}
