import Link from "next/link";
import { Icon } from "./Icon";
import type { PublicImage, PublicWork } from "@/lib/queries";
import { STATUS_LABEL, price } from "@/lib/format";

export function Header({ place, back, action }: { place?: string; back?: string; action?: React.ReactNode }) {
  return (
    <header className="header">
      {back
        ? <Link className="iconbtn lead" href={back} aria-label="Back"><Icon name="back" /></Link>
        : <Link className="wordmark" href="/">The Gallery</Link>}
      {place ? <span className="place">{place}</span> : <span />}
      {action ?? <Link className="iconbtn" href="/search" aria-label="Search"><Icon name="search" /></Link>}
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
      <span style={{ width: 44 }} />
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

/** An editorial action: a line and a label, the arrow in amber. Never a filled block. */
export function Action({ href, children, primary, block }:
                       { href: string; children: React.ReactNode; primary?: boolean; block?: boolean }) {
  return (
    <Link className={`act${primary ? " primary" : ""}${block ? " block" : ""}`} href={href}
          style={block ? { width: "100%" } : undefined}>
      <span>{children}</span><span className="arrow" aria-hidden>→</span>
    </Link>
  );
}

/**
 * One work at scale, on the wall.
 *
 * The image keeps its own proportion. A landscape image fills the width; a portrait or square
 * one stands on the limestone ground at the height it needs — that ground is the wall it hangs
 * on, not letterboxing, and it is the same limestone the plinths are made of.
 */
export function Hero({ image, alt, href }: { image?: PublicImage; alt: string; href: string }) {
  const src = imgSrc(image, "w1280");
  const o = orientation(image);
  return (
    <Link href={href} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
      <div className={`hero ${o}`}>
        <div className="wall">
          {src ? <img src={src} alt={alt} width={image?.width} height={image?.height} />
               : <div className="frame r43" style={{ width: "100%" }}><span className="notice">No image yet</span></div>}
        </div>
        <div className="ledge" aria-hidden />
      </div>
    </Link>
  );
}

/** A grid tile. A landscape image is given the full row so it is not squeezed into a
 *  portrait frame; the rest keep the 4:5 frame, covered inside it. The work's own proportion
 *  is honoured on the detail surface where it can be seen whole. */
export function WorkTile({ work, image, wide }: { work: PublicWork; image?: PublicImage; wide?: boolean }) {
  const src = imgSrc(image, "w640");
  const sold = work.status === "sold";
  return (
    <Link className={`tile${wide ? " wide" : ""}`} href={`/work/${work.public_token}`}>
      <div className={`frame ${wide ? "" : "r45"}`}>
        {src
          ? <img src={src} alt={image?.alt_text ?? ""} loading="lazy" />
          : <span className="notice">No image yet</span>}
      </div>
      <div className="gt">{work.title}</div>
      <div className="gm">{work.maker_display_name}, {work.maker_city}</div>
      <div className={`gs ${sold ? "" : "available"}`}>
        {STATUS_LABEL[work.status] ?? work.status}
        {work.price_mode === "exact" && !sold ? ` · ${price(work.price_mode, work.price_amount)}` : ""}
      </div>
    </Link>
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

export function Footer() {
  return (
    <div className="footer">
      <Link href="/about">About</Link>
      <Link href="/participation">Participation</Link>
      <Link href="/privacy">Privacy</Link>
      <Link href="/makers">For Makers</Link>
    </div>
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

/**
 * An empty state as a gallery moment rather than a field of text: a lit wall, a plinth with
 * nothing on it yet, optionally a fragment of the material in question, and then the truth of
 * the matter in words with a route onward. The plinth is not decoration — it is what an empty
 * gallery actually looks like, and it says "waiting" without inventing a work.
 */
export function EmptyPlinth({ material, title, children, action }:
                            { material?: "clay" | "textile" | "wood" | "metal" | "paper";
                              title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="empty">
      <div className="plinth" aria-hidden>
        <div className="wall">
          {material ? <div className={`fragment ${material}`} /> : null}
          <div className="slab" />
        </div>
      </div>
      <h2>{title}</h2>
      <p>{children}</p>
      {action}
    </div>
  );
}
