"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useRef, type ReactNode, type MouseEvent } from "react";

/**
 * The one orchestrated motion (design review R4): a grid tile becomes the work's hero.
 *
 * Built on the browser's own view transitions, not a motion library. The tile's image and the
 * work page's first image share the name "work-hero"; the browser animates between them. The
 * timing lives in app.css (about 280 ms).
 *
 * It never stands in the way of the page:
 * - no support for view transitions, reduced motion asked for, a modified click (new tab,
 *   new window), or no script → an ordinary link;
 * - the new state is captured once the new route has committed AND its hero image has decoded,
 *   so the tile morphs into the picture, not into an empty box;
 * - if that takes longer than 1.5 s the transition is skipped (no animation, no stale capture)
 *   and the navigation simply completes;
 * - only one element carries the name at a time: a second click clears the first.
 */
const LIMIT_MS = 1500;
type Pending = { arrive: () => void; named: HTMLElement | null } | null;
const Shared = createContext<{ current: Pending } | null>(null);

export function ViewTransitions({ children }: { children: ReactNode }) {
  const pending = useRef<Pending>(null);
  const pathname = usePathname();
  useEffect(() => {
    // The new route has committed: let the browser capture it.
    pending.current?.arrive();
  }, [pathname]);
  return <Shared.Provider value={pending}>{children}</Shared.Provider>;
}

type VT = { finished: Promise<void>; skipTransition: () => void };
type StartViewTransition = (update: () => Promise<void>) => VT;

/** The hero on the new page, decoded; bounded by the time left. */
async function heroReady(msLeft: number) {
  const hero = Array.from(document.images).find((i) => i.style.viewTransitionName === "work-hero");
  if (!hero) return;
  await Promise.race([hero.decode().catch(() => undefined), new Promise((r) => setTimeout(r, Math.max(0, msLeft)))]);
}

export function TransitionLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  const router = useRouter();
  const pending = useContext(Shared);

  function onClick(e: MouseEvent<HTMLAnchorElement>) {
    const start = (document as unknown as { startViewTransition?: StartViewTransition }).startViewTransition;
    if (!start || !pending || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    e.preventDefault();

    // A transition already under way gives up its name first, so two elements never share it.
    if (pending.current?.named) pending.current.named.style.viewTransitionName = "";
    const img = e.currentTarget.querySelector("img");
    if (img) img.style.viewTransitionName = "work-hero";
    // The work's own hero (data-hero, the large variant) starts loading now, beside the page
    // rather than after it, so the morph lands within its budget (part 2: the square tiles
    // carry only the small variant).
    const hero = img?.dataset.hero;
    if (hero) { const pre = new Image(); pre.decoding = "async"; pre.src = hero; }

    const began = performance.now();
    let settle: () => void = () => {};
    const committed = new Promise<void>((resolve) => { settle = resolve; });
    pending.current = { arrive: () => settle(), named: img };

    // The update runs after the old page is captured, so vt is assigned by the time it reads it.
    const vt: VT = start.call(document, async () => {
      router.push(href);
      const inTime = await Promise.race([
        committed.then(() => true),
        new Promise<boolean>((r) => setTimeout(() => r(false), LIMIT_MS)),
      ]);
      if (img) img.style.viewTransitionName = "";
      // Too slow: no animation, rather than a capture of the page we are leaving.
      if (!inTime) { vt.skipTransition(); return; }
      await heroReady(LIMIT_MS - (performance.now() - began));
    });
    vt.finished.catch(() => undefined).finally(() => {
      if (pending.current?.named === img) pending.current = null;
    });
  }

  return <Link href={href} className={className} onClick={onClick}>{children}</Link>;
}
