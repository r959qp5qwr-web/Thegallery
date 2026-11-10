import { Header } from "@/components/Chrome";
import { ActionForm, Field } from "@/components/ActionForm";
import { startRecoveryAction } from "@/app/actions/account";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reset password" };

/** Reset password (drawing board, screen 11). The answer is the same whether or not the address
 *  has a gallery: the page does not tell a stranger who is registered. */
export default async function Reset({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  const { e } = await searchParams;
  return (
    <>
      <Header back="/makers/sign-in" />
      <main id="main" tabIndex={-1} className="flow has-workbar">
        <h1>Reset password</h1>
        <ActionForm action={startRecoveryAction} submitLabel="Send link" busyLabel="Sending…" dock>
          <Field name="email" label="Email" type="email" required autoComplete="email" defaultValue={e}
                 help="We’ll send a link if it has a gallery." />
        </ActionForm>
      </main>
    </>
  );
}
