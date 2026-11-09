import Link from "next/link";
import { TransitionLink } from "./ViewTransition";
import { Icon } from "./Icon";
import { SectionNav } from "./SectionNav";
import type { PublicImage, PublicWork } from "@/lib/queries";
import { STATUS_LABEL, labelPrice } from "@/lib/format";

/** The public header: the wordmark, the way home. The four places are the bar below 900 px and
 *  sit in the header from 900 px (governor, 2026-11-09: drawing board). A page names itself in
 *  its own heading, once. */
export function Header() {
  return (
    <header className="header public">
      <Link className="wordmark" href="/">The Gallery</Link>
      <span className="header-end"><SectionNav placement="header" /></span>
    </header>
  );
}

export function StudioHeader({ title, back }: { title: string; back?: string }) {
  return (
    <header className="header studio">
      {back
        ? <Link className="iconbtn lead" href={back} aria-label="Back"><Icon name="back" /></Link>
        : <Link className="wordmark" href="/">The Gallery</Link>}
      <span className="title">{title}</span>
      <span className="header-end"><SectionNav placement="header" /><span className="header-spacer" /></span>
    </header>
  );
}

/**
 * The URL for an image at roughly the width a surface needs.
 *
 * `variants` records what was actually written for this image, so this picks the requested
 * width when it exists and otherwise the largest that does. Asking for a width that was never
 * made is how two of three images came back broken the first time this ran.
 */
export function imgSrc(image: PublicImage | undefined, variant: "w320" | "w640" | "w1280" | "w1920") {
  if (!image) return null;
  if (image.variants[variant]) return `/img/${image.id}/${variant}`;
  const available = ["w1920", "w1280", "w640", "w320"].filter((v) => image.variants[v]);
  const chosen = available[0] ?? "original";
  return `/img/${image.id}/${chosen}`;
}

/** The shape of an image, for deciding how it hangs. */
export function orientation(image?: PublicImage): "portrait" | "landscape" | "square" {
  if (!image || !image.width || !image.height) return "portrait";
  const r = image.width / image.height;
  return r > 1.15 ? "landscape" : r < 0.87 ? "portrait" : "square";
}

/**
 * The curatorial mark: a small amber square. It precedes what the Gallery is pointing at —
 * availability, the active place, a lead — and nothing else, which is what keeps it legible.
 */
export function Mark({ muted }: { muted?: boolean }) {
  return <span className={`mark${muted ? " muted" : ""}`} aria-hidden />;
}

/** An action: a line and a label, the primary with the amber edge (the original grammar,
 *  restored 2026-11-09). A screen's one docked action is solid ink; that is `solid`. */
export function Action({ href, children, primary, solid }:
                       { href: string; children: React.ReactNode; primary?: boolean; solid?: boolean }) {
  return (
    <Link className={solid ? "act solid" : primary ? "act primary" : "textlink"} href={href}>{children}</Link>
  );
}

/** One work at scale, edge to edge on a phone: no matte and no ledge (Wave 5). */
export function Hero({ image, alt, href }: { image?: PublicImage; alt: string; href: string }) {
  const src = imgSrc(image, "w1280");
  return (
    // The title beside it is the work's link for keyboard and screen reader; the picture is the
    // same link for a tap, kept out of the tab order so the work is not offered twice.
    <Link href={href} className="hero-link" tabIndex={-1} aria-hidden>
      <div className="hero">
        {src ? <img src={src} alt={alt} width={image?.width} height={image?.height} loading="eager" />
             : <div className="frame r43" style={{ width: "100%" }}><span className="notice">No image yet</span></div>}
      </div>
    </Link>
  );
}

/** A grid tile. A landscape image is given the full row so it is not squeezed into a
 *  portrait frame; the rest keep the 4:5 frame, covered inside it. The work's own proportion
 *  is honoured on the detail surface where it can be seen whole.
 *  The caption is the title, then the maker (left out on the maker's own gallery, where it
 *  would repeat the page), then the status and any stated price, quietly (Wave 5). "Available"
 *  is the one status left unsaid on the wall: a stated price says it, and the work's page names it. */
export function WorkTile({ work, image, wide, inGallery, lead }:
  { work: PublicWork; image?: PublicImage; wide?: boolean; inGallery?: boolean; lead?: boolean }) {
  // The lead of a maker's hang is about twice a tile's width, so it takes the larger variant.
  const src = imgSrc(image, lead ? "w1280" : "w640");
  const tilePrice = labelPrice(work, { exactOnly: true });
  return (
    <TransitionLink className={`tile${wide ? " wide" : ""}${lead ? " hang-first" : ""}`} href={`/work/${work.public_token}`}>
      <div className={`frame ${wide ? "" : "r45"}`}>
        {src
          ? <img src={src} alt={image?.alt_text ?? ""} loading="lazy" />
          : <span className="notice">No image yet</span>}
      </div>
      <div className="gt">{work.title}</div>
      {inGallery ? null : <div className="gm">{work.maker_display_name}</div>}
      {/* Every status but "Available" is said (P-11, GAL-PR-02: a work stays visible with its
          status); for an available work a stated price stands in for the word. */}
      {work.status !== "available" || tilePrice ? (
        <div className={`gs${work.status === "available" ? " available" : ""}`}>
          {work.status !== "available" ? STATUS_LABEL[work.status] ?? work.status : null}
          {work.status !== "available" && tilePrice ? " · " : null}
          {tilePrice ? <span className="price">{tilePrice}</span> : null}
        </div>
      ) : null}
    </TransitionLink>
  );
}

export function MaterialRail({ materials, active }: { materials: { key: string; label: string }[]; active?: string }) {
  return (
    <nav className="rail" aria-label="Material">
      {materials.map((m) => (
        <Link key={m.key} href={`/browse/${m.key}`} className={active === m.key ? "active" : ""}
              aria-current={active === m.key ? "page" : undefined}>{m.label}</Link>
      ))}
    </nav>
  );
}

/** The colophon: one line that signs the room. The sections live in the header and the Menu,
 *  so they are not repeated here (Wave 5: say it once). */
export function Footer() {
  return (
    <footer className="footer">
      <span className="sign">The Gallery</span>
      <Link href="/about">About</Link>
      <Link href="/participation">Participation</Link>
      <Link href="/privacy">Privacy</Link>
    </footer>
  );
}

export function Band({ kind, label, children }: { kind?: "warn" | "fail"; label?: string; children: React.ReactNode }) {
  return (
    <div className={`band ${kind ?? ""}`}>
      <div className="grow">
        {label ? <div className="lbl">{label}</div> : null}
        <p>{children}</p>
      </div>
    </div>
  );
}

/** The empty plinth: limestone wall and a slab with nothing on it. Decoration, hidden from
 *  assistive technology; it shows a room waiting, never a pretend work. */
export function Plinth() {
  return (
    <div className="plinth" aria-hidden data-testid="plinth">
      <div className="wall"><div className="slab" /></div>
    </div>
  );
}

/**
 * An empty state: the plinth (where the room itself is empty), what is empty, one line, and only
 * routes that lead somewhere with something in it, never a door into another empty room.
 */
export function EmptyState({ title, children, routes, level = 2, plinth }:
                           { title: string; children?: React.ReactNode; routes?: React.ReactNode; level?: 1 | 2; plinth?: boolean }) {
  const H = level === 1 ? "h1" : "h2";
  return (
    <div className="empty">
      {plinth ? <Plinth /> : null}
      <H>{title}</H>
      {children ? <p>{children}</p> : null}
      {routes ? <div className="routes-on">{routes}</div> : null}
    </div>
  );
}
