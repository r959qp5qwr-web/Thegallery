"use client";
import { useContext, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignedInContext } from "./SectionNav";

// The public navigation (governor, 2026-11-09, option B2): the wordmark, then Search and Menu.
// On a wide screen the three sections sit in the header itself and the Menu steps aside; on a
// phone they live in the Menu. One "Sections" navigation at any width: the links hidden below
// 900 px are display:none, so assistive technology meets them once, in the Menu.
//
// The Menu is a popover (top layer, Escape and light dismiss from the browser). Where the
// Popover API is missing (Safari before 17, Firefox before 125) the same buttons toggle a class
// instead, so the Menu still opens and closes; its base style is hidden either way.
const SECTIONS = [
  { href: "/saved", label: "Saved", match: (p: string) => p.startsWith("/saved") },
  { href: "/workshops", label: "Workshops", match: (p: string) => p.startsWith("/workshops") },
];

type PopoverEl = HTMLDivElement & { showPopover?: () => void; hidePopover?: () => void };
const hasPopover = () => typeof HTMLElement !== "undefined" && "showPopover" in HTMLElement.prototype;

export function PublicNav() {
  const path = usePathname();
  const signedIn = useContext(SignedInContext);
  const menu = useRef<PopoverEl>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const closer = useRef<HTMLButtonElement>(null);
  const [fallbackOpen, setFallbackOpen] = useState(false);
  const last = signedIn
    ? { href: "/studio", label: "Studio", match: (p: string) => p.startsWith("/studio") }
    : { href: "/makers", label: "For Makers", match: (p: string) => p === "/makers" };
  const items = [...SECTIONS, last];

  function hide() {
    const el = menu.current;
    if (!el) return;
    if (hasPopover()) { try { if (el.matches(":popover-open")) el.hidePopover?.(); } catch { /* already closed */ } }
    else setFallbackOpen(false);
  }

  useEffect(() => {
    const el = menu.current;
    if (!el) return;
    // Opened: focus goes to Close, inside the sheet. Closed: focus returns to Menu.
    const onToggle = (e: Event) => {
      const open = (e as Event & { newState?: string }).newState === "open";
      if (open) closer.current?.focus(); else if (el.contains(document.activeElement) || document.activeElement === document.body) opener.current?.focus();
    };
    // Focus leaving the sheet (Tab past its last link) closes it rather than wandering the page beneath.
    const onFocusOut = (e: FocusEvent) => {
      const to = e.relatedTarget as Node | null;
      if (to && !el.contains(to) && to !== opener.current) hide();
    };
    el.addEventListener("toggle", onToggle);
    el.addEventListener("focusout", onFocusOut);
    return () => { el.removeEventListener("toggle", onToggle); el.removeEventListener("focusout", onFocusOut); };
  }, []);

  useEffect(() => { if (fallbackOpen) closer.current?.focus(); }, [fallbackOpen]);

  const fallback = (open: boolean) => (e: React.MouseEvent) => {
    if (hasPopover()) return;          // the browser handles popovertarget itself
    e.preventDefault(); setFallbackOpen(open);
    if (!open) opener.current?.focus();
  };

  return (
    <>
      <nav className="header-end" aria-label="Sections">
        {items.map((i) => (
          <Link key={i.href} href={i.href} className="navlink wide"
                aria-current={i.match(path) ? "page" : undefined}>{i.label}</Link>
        ))}
        <Link href="/search" className="navlink" aria-current={path.startsWith("/search") ? "page" : undefined}>Search</Link>
        <button ref={opener} type="button" className="navlink menu-btn" popoverTarget="menu" aria-haspopup="dialog"
                aria-expanded={fallbackOpen || undefined} onClick={fallback(true)}>Menu</button>
      </nav>
      <div id="menu" ref={menu} popover="auto" className={`menu${fallbackOpen ? " open" : ""}`} role="dialog" aria-label="Menu"
           onClick={(e) => { if ((e.target as HTMLElement).closest("a")) hide(); }}
           onKeyDown={(e) => { if (e.key === "Escape" && !hasPopover()) { setFallbackOpen(false); opener.current?.focus(); } }}>
        <div className="header">
          <Link className="wordmark" href="/">The Gallery</Link>
          <span className="header-end">
            <Link href="/search" className="navlink">Search</Link>
            <button ref={closer} type="button" className="navlink" popoverTarget="menu" popoverTargetAction="hide"
                    onClick={fallback(false)}>Close</button>
          </span>
        </div>
        <ul>
          {items.map((i) => (
            <li key={i.href}><Link href={i.href} aria-current={i.match(path) ? "page" : undefined}>{i.label}</Link></li>
          ))}
        </ul>
        <div className="footer">
          <span className="sign">The Gallery</span>
          <Link href="/about">About</Link><Link href="/participation">Participation</Link><Link href="/privacy">Privacy</Link>
        </div>
      </div>
    </>
  );
}
