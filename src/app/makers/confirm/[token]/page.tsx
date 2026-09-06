import Link from "next/link";
import { StudioHeader } from "@/components/Chrome";
import { confirmEmail } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Confirm({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const outcome = await confirmEmail(token);
  return (
    <>
      <StudioHeader title="Confirm your email" />
      <div className="centre">
        {outcome === "confirmed" ? (
          <>
            <div className="lbl">Confirmed</div>
            <h1>Your email is confirmed</h1>
            <p>Sign in and your Studio will open on the set-up steps.</p>
            <Link className="btn" href="/makers/sign-in">Sign in</Link>
          </>
        ) : (
          <>
            <div className="lbl">Link expired</div>
            <h1>That link no longer works</h1>
            <p>Confirmation links last 24 hours and can be used once. Ask for a fresh one.</p>
            <Link className="btn" href="/makers/check-email">Send a new link</Link>
          </>
        )}
      </div>
    </>
  );
}
