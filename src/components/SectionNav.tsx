"use client";
import { createContext, useContext } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./Icon";

// The app's four places (governor, 2026-11-09: drawing board approved; bottom bar on public
// pages; Workshops hidden until the first workshop exists). The fourth reads Studio for everyone:
// a signed-in maker goes to their Studio, anyone else to For Makers, which is how a Studio begins.
const ITEMS = [
  { href: "/", label: "Home", icon: "browse",
    match: (p: string) => p === "/" || p.startsWith("/browse") || p.startsWith("/m/") || p.startsWith("/about")
      || p.startsWith("/participation") || p.startsWith("/privacy") || p.startsWith("/workshops") },
  { href: "/search", label: "Search", icon: "search", match: (p: string) => p.startsWith("/search") },
  { href: "/saved", label: "Saved", icon: "heart", match: (p: string) => p.startsWith("/saved") },
];

/** Screens that dock their own one action at the foot (a work's Message, a sign-up or sign-in
 *  form's action, the editor's Publish) carry no bar: two things fixed at the bottom of a phone is one too many. */
function docked(p: string) {
  return p.startsWith("/work/") || p.startsWith("/makers/") || p.startsWith("/studio/works/");
}

export const SignedInContext = createContext(false);
export function SignedIn({ value, children }: { value: boolean; children: React.ReactNode }) {
  return <SignedInContext.Provider value={value}>{children}</SignedInContext.Provider>;
}

/**
 * The four places, in one of two positions: the bottom bar below 900 px, the header from 900 px
 * (INTERFACE_FOUNDATION §7). Both are rendered; CSS shows exactly one, and the hidden one is
 * display:none, so assistive technology meets a single "Sections" navigation at any width.
 */
export function SectionNav({ placement }: { placement: "bar" | "header" }) {
  const path = usePathname();
  const signedIn = useContext(SignedInContext);
  if (placement === "bar" && docked(path)) return null;
  if (path.startsWith("/operator")) return null;
  const last = { href: signedIn ? "/studio" : "/makers", label: "Studio", icon: "studio",
                 match: (p: string) => p.startsWith("/studio") || p.startsWith("/makers") };
  return (
    <nav className={placement === "bar" ? "bar" : "topnav"} aria-label="Sections">
      {[...ITEMS, last].map((i) => (
        <Link key={i.label} href={i.href} className={i.match(path) ? "active" : ""}
              aria-current={i.match(path) ? "page" : undefined}>
          {placement === "bar" ? <Icon name={i.icon} /> : null}
          {i.label}
        </Link>
      ))}
    </nav>
  );
}
