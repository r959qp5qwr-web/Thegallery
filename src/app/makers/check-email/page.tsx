import Link from "next/link";
import { StudioHeader } from "@/components/Chrome";
import { ActionForm } from "@/components/ActionForm";
import { resendConfirmAction } from "@/app/actions/account";

export const dynamic = "force-dynamic";

export default async function CheckEmail({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  const { e = "" } = await searchParams;
  return (
    <>
      <StudioHeader title="Confirm your email" back="/makers/create-account" />
      <div className="centre">
        <div className="lbl">One step left</div>
        <h1>Check your email</h1>
        <p>If {e ? <strong>{e}</strong> : "that address"} can receive mail, a confirmation link is on its
          way. It is good for 24 hours.</p>
      </div>
      <ActionForm action={resendConfirmAction} submitLabel="Send it again" busyLabel="Sending…"
                  hidden={{ email: e }}>
        <div className="hint" style={{ padding: "24px 0 0" }}>Nothing arrived? Check the spam folder first.</div>
      </ActionForm>
      <div className="inline-actions">
        <Link className="btn quiet" href="/makers/sign-in"><span>Back to sign in</span></Link>
      </div>
    </>
  );
}
