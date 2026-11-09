"use client";
import { createContext, useContext } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./Icon";

// PRODUCT_ARCHITECTURE §5: Browse · Saved · Workshops · For Makers, with the fourth slot
// reading Studio for a signed-in maker. The maker and the visitor share one grammar.
const ITEMS = [
  { href: "/", label: "Browse", icon: "browse", match: (p: string) => p === "/" || p.startsWith("/browse") || p.startsWith("/work/") || p.startsWith("/m/") },
  { href: "/saved", label: "Saved", icon: "bookmark", match: (p: string) => p.startsWith("/saved") },
  { href: "/workshops", label: "Workshops", icon: "workshops", match: (p: string) => p.startsWith("/workshops") },
];

export const SignedInContext = createContext(false);
export function SignedIn({ value, children }: { value: boolean; children: React.ReactNode }) {
  return <SignedInContext.Provider value={value}>{children}</SignedInContext.Provider>;
}

/**
 * The Studio's four sections, in one of two places: the bottom bar below 900 px, the header from
 * 900 px (INTERFACE_FOUNDATION §7). Both are rendered; CSS shows exactly one, and the hidden one
 * is display:none, so assistive technology meets a single "Sections" navigation at any width.
 * Since Wave 5 (governor option B2) the bar is the Studio's alone: public pages carry the
 * wordmark, Search and Menu (PublicNav).
 */
export function SectionNav({ placement }: { placement: "bar" | "header" }) {
  const path = usePathname();
  const signedIn = useContext(SignedInContext);
  if (!path.startsWith("/studio")) return null;
  const last = signedIn
    ? { href: "/studio", label: "Studio", icon: "makers", match: (p: string) => p.startsWith("/studio") }
    : { href: "/makers", label: "For Makers", icon: "makers", match: (p: string) => p.startsWith("/makers") };
  return (
    <nav className={placement === "bar" ? "bar" : "topnav"} aria-label="Sections">
      {[...ITEMS, last].map((i) => (
        <Link key={i.href} href={i.href} className={i.match(path) ? "active" : ""}
              aria-current={i.match(path) ? "page" : undefined}>
          {placement === "bar" ? <Icon name={i.icon} /> : null}
          {i.label}
        </Link>
      ))}
    </nav>
  );
}
