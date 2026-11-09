import Link from "next/link";
import { Header } from "@/components/Chrome";
import { ActionForm } from "@/components/ActionForm";
import { resendConfirmAction } from "@/app/actions/account";

export const dynamic = "force-dynamic";
export const metadata = { title: "Check your email" };

export default async function CheckEmail({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  const { e = "" } = await searchParams;
  return (
    <>
      <Header />
      <main id="main" tabIndex={-1}>
      <div className="centre">
        <h1>Check your email</h1>
        <p>If {e ? <strong>{e}</strong> : "that address"} can receive mail, a confirmation link is on its
          way. It is good for 24 hours.</p>
      </div>
      <ActionForm action={resendConfirmAction} submitLabel="Send it again" busyLabel="Sending…"
                  hidden={{ email: e }}>
        <div className="hint follow">Nothing arrived? Check the spam folder first.</div>
      </ActionForm>
      <div className="inline-actions">
        <Link className="textlink" href="/makers/sign-in">Back to sign in</Link>
      </div>
      </main>
    </>
  );
}
