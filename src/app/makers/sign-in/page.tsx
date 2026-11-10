import Link from "next/link";
import { Header, Band } from "@/components/Chrome";
import { ActionForm, Field } from "@/components/ActionForm";
import { signInAction } from "@/app/actions/account";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sign in" };

/** Sign in (drawing board, screen 10): the minimum. */
export default async function SignIn(
  { searchParams }: { searchParams: Promise<{ next?: string; reset?: string; expired?: string; confirmed?: string }> },
) {
  const { next = "/studio", reset, expired, confirmed } = await searchParams;
  return (
    <>
      <Header back="/makers" />
      <main id="main" tabIndex={-1} className="flow has-workbar">
        <h1>Sign in</h1>
        {confirmed ? <Band label="Email confirmed">Sign in to carry on with your gallery.</Band> : null}
        {reset ? <Band label="Password set">Your new password is in place. Sign in with it.</Band> : null}
        {expired ? <Band label="Signed out">Your session ended. Sign in to carry on where you were.</Band> : null}
        <ActionForm action={signInAction} submitLabel="Sign in" busyLabel="Signing in…" hidden={{ next }} dock>
          <Field name="email" label="Email" type="email" required autoComplete="email" />
          <Field name="password" label="Password" type="password" required autoComplete="current-password" />
          <p className="flow-link"><Link className="textlink" href="/makers/reset">Forgot password?</Link></p>
        </ActionForm>
      </main>
    </>
  );
}
