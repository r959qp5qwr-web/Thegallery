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

/** A grid tile. The frame keeps the accepted 4:5 proportion; the image is covered inside it,
 *  and the work's own proportion is honoured on the detail surface where it can be seen. */
export function WorkTile({ work, image }: { work: PublicWork; image?: PublicImage }) {
  const src = imgSrc(image, "w640");
  const sold = work.status === "sold";
  return (
    <Link className="tile" href={`/work/${work.public_token}`}>
      <div className="frame r45">
        {src
          ? <img src={src} alt={image?.alt_text ?? ""} loading="lazy" />
          : <span className="notice">No image yet</span>}
      </div>
      <div className="gt">{work.title}</div>
      <div className="gm">{work.maker_display_name} · {work.maker_city}</div>
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
        <Link key={m.key} href={`/browse/${m.key}`} className={active === m.key ? "active" : ""}>{m.label}</Link>
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
