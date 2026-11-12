import Link from "next/link";
import { Header } from "@/components/Chrome";
import { ActionForm, Field } from "@/components/ActionForm";
import { Icon } from "@/components/Icon";
import { resendConfirmAction } from "@/app/actions/account";

export const dynamic = "force-dynamic";
export const metadata = { title: "Check your email" };

/** Join, between steps 1 and 2 (drawing board, screen 9). The link signs the maker in and
 *  brings them straight to step 2. */
export default async function CheckEmail({ searchParams }: { searchParams: Promise<{ e?: string; expired?: string }> }) {
  const { e = "", expired } = await searchParams;
  return (
    <>
      <Header back="/makers/create-account" step="Step 1 of 3" />
      <main id="main" tabIndex={-1} className="flow centred">
        <Icon name="mail" className="flow-mark" />
        <h1>{expired ? "That link has expired" : "Check your email"}</h1>
        <p className="flow-line">
          {expired
            ? "It was used already, or is too old. Ask for a new one, or sign in if you confirmed before."
            : <>Tap the link we sent to {e ? <span className="addr">{e}</span> : "your address"}.</>}
        </p>
        <ActionForm action={resendConfirmAction} submitLabel="Send it again" busyLabel="Sending…"
                    hidden={e ? { email: e } : undefined} className="form resend">
          {e ? null : <Field name="email" label="Email" type="email" required autoComplete="email" />}
        </ActionForm>
        {expired ? <Link className="textlink" href="/makers/sign-in">Sign in</Link> : (
          <>
            <p className="flow-line">No email? You may already have a gallery with this address.</p>
            <div className="flow-links">
              <Link className="textlink" href="/makers/sign-in">Sign in</Link>
              <Link className="textlink" href="/makers/reset">Reset your password</Link>
            </div>
          </>
        )}
      </main>
    </>
  );
}
