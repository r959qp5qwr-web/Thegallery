"use client";
import Link from "next/link";
import { StudioHeader, Band } from "@/components/Chrome";

/** A Studio failure ends on a page that says what happened and what is safe, never the
 *  framework's default screen. The commonest cause is an image too large to send (over 12 MB). */
export default function StudioError({ reset }: { error: Error; reset: () => void }) {
  return (
    <>
      <StudioHeader title="Studio" back="/studio" />
      <main id="main" tabIndex={-1}>
        <Band kind="fail" label="That did not go through">
          Nothing you had already saved is lost. If you were adding an image, it may be too large to
          send: images up to 12 MB go up; export a larger one smaller and try again.
        </Band>
        <div className="inline-actions">
          <button className="btn" type="button" onClick={() => reset()}>Try again</button>
          <Link className="btn quiet" href="/studio"><span>Back to the Studio</span></Link>
        </div>
      </main>
    </>
  );
}
