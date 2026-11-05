"use client";
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

export function BottomBar({ signedIn }: { signedIn: boolean }) {
  const path = usePathname();
  if (path.startsWith("/operator")) return null;
  const last = signedIn
    ? { href: "/studio", label: "Studio", icon: "makers", match: (p: string) => p.startsWith("/studio") }
    : { href: "/makers", label: "For Makers", icon: "makers", match: (p: string) => p.startsWith("/makers") };
  return (
    <nav className="bar" aria-label="Sections">
      {[...ITEMS, last].map((i) => (
        <Link key={i.href} href={i.href} className={i.match(path) ? "active" : ""}
              aria-current={i.match(path) ? "page" : undefined}>
          <Icon name={i.icon} />
          {i.label}
        </Link>
      ))}
    </nav>
  );
}
