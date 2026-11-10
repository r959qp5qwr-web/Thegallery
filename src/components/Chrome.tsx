import Link from "next/link";
import { TransitionLink } from "./ViewTransition";
import { Icon } from "./Icon";
import { SectionNav } from "./SectionNav";
import { BackButton, ShareButton } from "./PageTools";
import type { PublicImage, PublicWork } from "@/lib/queries";
import { STATUS_LABEL, labelPrice } from "@/lib/format";

/** The public header: the wordmark, the way home. The four places are the bar below 900 px and
 *  sit in the header from 900 px (governor, 2026-11-09: drawing board). A page names itself in
 *  its own heading, once. */
export function Header({ className, back, share, step }:
  { className?: string; back?: string; share?: { title: string; path: string };
    /** Drawing board 8–9: a step of joining names itself in the header's middle ("Step 1 of 3"). */
    step?: string } = {}) {
  // A screen that is not a top-level place carries Back at every width (Interface Standard IS-N1):
  // back · wordmark · share on a phone; back · wordmark · the four places from 900 px.
  const tools = !!(back || share || step);
  return (
    <header className={["header public", tools ? "tools" : "", step ? "step" : "", className ?? ""].filter(Boolean).join(" ")}>
      {back ? <BackButton href={back} className="iconbtn lead back" /> : null}
      {step ? <span className="step-of">{step}</span> : null}
      <Link className="wordmark" href="/">The Gallery</Link>
      <span className="header-end">
        <SectionNav placement="header" />
        {share ? <ShareButton title={share.title} path={share.path} className="iconbtn" /> : null}
      </span>
    </header>
  );
}

export function StudioHeader({ title, back, end, lead }:
  { title: string; back?: string; end?: React.ReactNode;
    /** An editor's header (drawing board, screen 13): its own way out on the left (Cancel) in place of Back. */
    lead?: React.ReactNode }) {
  if (lead) {
    return (
      <header className="header studio editor">
        {lead}
        <span className="title">{title}</span>
        <span className="header-end"><SectionNav placement="header" />{end}</span>
      </header>
    );
  }
  // The Studio itself (drawing board, screen 12) names itself where the wordmark stands; its
  // pages carry Back and their title. The bar (or, from 900 px, the header) is the way home.
  if (!back) {
    return (
      <header className="header studio home">
        <span className="wordmark">{title}</span>
        <span className="header-end"><SectionNav placement="header" />{end}</span>
      </header>
    );
  }
  return (
    <header className="header studio">
      <Link className="iconbtn lead" href={back} aria-label="Back"><Icon name="back" /></Link>
      <span className="title">{title}</span>
      <span className="header-end"><SectionNav placement="header" />{end ?? <span className="header-spacer" />}</span>
    </header>
  );
}

export { imgSrc } from "@/lib/images";
import { imgSrc } from "@/lib/images";

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
          ? <img src={src} alt={image?.alt_text ?? ""} loading="lazy" data-hero={imgSrc(image, "w1280") ?? undefined} />
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

/** The colophon: one line that signs the room. The four places live in the bar (or the header
 *  when wide), so they are not repeated here: say it once. */
export function Footer({ here }: { here?: "about" } = {}) {
  // The colophon (drawing board): the name, and About, which holds who can open a gallery, what
  // we act on and privacy. /participation and /privacy stay for links already shared. On About
  // itself the link would lead to the same page, so only the name stands.
  return (
    <footer className="footer">
      <span className="sign">The Gallery</span>
      {here === "about" ? null : <Link href="/about">About</Link>}
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
