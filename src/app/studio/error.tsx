"use client";
import Link from "next/link";
import { StudioHeader, Band } from "@/components/Chrome";

/** A Studio failure ends on a page that says what happened and what is safe, never the
 *  framework's default screen. It used to blame image size; photographs no longer pass through
 *  the server (ledger GAL-L0044), so it names only what is true for every cause. */
export default function StudioError({ reset }: { error: Error; reset: () => void }) {
  return (
    <>
      <StudioHeader title="Studio" back="/studio" />
      <main id="main" tabIndex={-1}>
        <Band kind="fail" label="That did not go through">
          Nothing you had already saved is lost. Try again; if it happens again, come back to it in a
          few minutes.
        </Band>
        <div className="inline-actions">
          <button className="btn" type="button" onClick={() => reset()}>Try again</button>
          <Link className="btn quiet" href="/studio"><span>Back to the Studio</span></Link>
        </div>
      </main>
    </>
  );
}
