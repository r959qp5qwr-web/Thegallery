"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "./Icon";

/** Back: a real link to the place above this one, so it works without script and from a shared
 *  link opened cold. With script, and when the visitor came from inside The Gallery, it steps
 *  back instead, so the wall they were scrolling is where they left it. */
export function BackButton({ href, className = "roundbtn" }: { href: string; className?: string }) {
  const router = useRouter();
  return (
    <a className={className} href={href} aria-label="Back" data-testid="back"
       onClick={(e) => {
         // Inside = an earlier page of this visit was The Gallery: either the document was opened
         // from one of its pages, or the app has moved between pages since (ViewTransitions marks it).
         let inside = !!(window as unknown as { __galleryMoved?: boolean }).__galleryMoved;
         try { inside ||= !!document.referrer && new URL(document.referrer).origin === location.origin; } catch { /* no referrer */ }
         if (inside && history.length > 1) { e.preventDefault(); router.back(); }
       }}>
      <Icon name="back" />
    </a>
  );
}

/** Share: the phone's own share sheet (WhatsApp first, for most visitors). Where there is none
 *  (most desktops), the link is copied and the button says so. */
export function ShareButton({ title, path, className = "roundbtn" }: { title: string; path: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  // A button that needs script is offered only once script runs: without it, nothing shows.
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  async function share() {
    const url = new URL(path, location.origin).toString();
    if (navigator.share) {
      try { await navigator.share({ title, url }); } catch { /* the visitor closed the sheet */ }
      return;
    }
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2400); }
    catch { /* no clipboard: nothing to say */ }
  }
  if (!ready) return null;
  return (
    <>
      <button className={className} type="button" onClick={share} aria-label="Share" data-testid="share">
        <Icon name={copied ? "check" : "share"} />
      </button>
      <span className="sr-only" aria-live="polite">{copied ? "Link copied" : ""}</span>
    </>
  );
}
