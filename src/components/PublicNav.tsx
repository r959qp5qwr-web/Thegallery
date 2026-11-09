"use client";
import { useContext, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignedInContext } from "./SectionNav";

// The public navigation (governor, 2026-11-09, option B2): the wordmark, then Search and Menu.
// On a wide screen the three sections sit in the header itself and the Menu steps aside; on a
// phone they live in the Menu. One "Sections" navigation at any width: the links hidden below
// 900 px are display:none, so assistive technology meets them once, in the Menu.
const SECTIONS = [
  { href: "/saved", label: "Saved", match: (p: string) => p.startsWith("/saved") },
  { href: "/workshops", label: "Workshops", match: (p: string) => p.startsWith("/workshops") },
];

export function PublicNav() {
  const path = usePathname();
  const signedIn = useContext(SignedInContext);
  const menu = useRef<HTMLDivElement>(null);
  const last = signedIn
    ? { href: "/studio", label: "Studio", match: (p: string) => p.startsWith("/studio") }
    : { href: "/makers", label: "For Makers", match: (p: string) => p === "/makers" };
  const items = [...SECTIONS, last];

  // A client-side navigation does not close a popover; the next page does.
  useEffect(() => {
    const el = menu.current as (HTMLDivElement & { hidePopover?: () => void }) | null;
    try { if (el?.matches(":popover-open")) el.hidePopover?.(); } catch { /* no popover support */ }
  }, [path]);

  return (
    <>
      <nav className="header-end" aria-label="Sections">
        {items.map((i) => (
          <Link key={i.href} href={i.href} className="navlink wide"
                aria-current={i.match(path) ? "page" : undefined}>{i.label}</Link>
        ))}
        <Link href="/search" className="navlink" aria-current={path.startsWith("/search") ? "page" : undefined}>Search</Link>
        <button type="button" className="navlink menu-btn" popoverTarget="menu" aria-haspopup="dialog">Menu</button>
      </nav>
      <div id="menu" ref={menu} popover="auto" className="menu" role="dialog" aria-label="Menu">
        <div className="header">
          <Link className="wordmark" href="/">The Gallery</Link>
          <span className="header-end">
            <Link href="/search" className="navlink">Search</Link>
            <button type="button" className="navlink" popoverTarget="menu" popoverTargetAction="hide">Close</button>
          </span>
        </div>
        <ul>
          {items.map((i) => (
            <li key={i.href}><Link href={i.href} aria-current={i.match(path) ? "page" : undefined}>{i.label}</Link></li>
          ))}
        </ul>
        <div className="footer">
          <span className="sign">The Gallery, Bengaluru</span>
          <Link href="/about">About</Link><Link href="/participation">Participation</Link><Link href="/privacy">Privacy</Link>
        </div>
      </div>
    </>
  );
}
