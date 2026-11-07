"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useRef, type ReactNode, type MouseEvent } from "react";

/**
 * The one orchestrated motion (design review R4): a grid tile becomes the work's hero.
 *
 * Built on the browser's own view transitions, not a motion library. The tile's image and the
 * work page's first image share the name "work-hero"; the browser animates between them. The
 * timing lives in app.css (about 280 ms, no other ambient movement).
 *
 * It never stands in the way of the page:
 * - no support for view transitions, reduced motion asked for, a modified click (new tab,
 *   new window), or no script → an ordinary link;
 * - the transition waits for the new page to commit, and gives up after 1.5 s rather than
 *   holding the old page on screen.
 */
type Waiter = { resolve: () => void } | null;
const Arrived = createContext<{ current: Waiter } | null>(null);

export function ViewTransitions({ children }: { children: ReactNode }) {
  const waiter = useRef<Waiter>(null);
  const pathname = usePathname();
  useEffect(() => {
    // The new route has committed: let the browser capture it and animate.
    waiter.current?.resolve();
    waiter.current = null;
  }, [pathname]);
  return <Arrived.Provider value={waiter}>{children}</Arrived.Provider>;
}

type StartViewTransition = (update: () => Promise<void>) => { finished: Promise<void> };

export function TransitionLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  const router = useRouter();
  const arrived = useContext(Arrived);

  function onClick(e: MouseEvent<HTMLAnchorElement>) {
    const start = (document as unknown as { startViewTransition?: StartViewTransition }).startViewTransition;
    if (!start || !arrived || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    e.preventDefault();

    const img = e.currentTarget.querySelector("img");
    if (img) img.style.viewTransitionName = "work-hero";
    start.call(document, () => new Promise<void>((resolve) => {
      const done = () => { if (img) img.style.viewTransitionName = ""; resolve(); };
      arrived.current = { resolve: done };
      setTimeout(done, 1500);
      router.push(href);
    }));
  }

  return <Link href={href} className={className} onClick={onClick}>{children}</Link>;
}
