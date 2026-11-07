import Link from "next/link";
import { notFound } from "next/navigation";
import { getWork, getWorkEnding, imagesFor, routesFor, listWorksByMaker } from "@/lib/queries";
import { Header, Band, Footer, Mark, imgSrc } from "@/components/Chrome";
import { Icon } from "@/components/Icon";
import { ImageCount } from "@/components/ImageCount";
import { SaveButton } from "@/components/SaveButton";
import { SheetFocus } from "@/components/SheetFocus";
import { STATUS_LABEL, price, dimensions, statusIsStale, confirmedAgo, routeHref, routeDisplay, ROUTE_LABEL,
         shortName, INTENTS, parseIntent } from "@/lib/format";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params;
  const work = await getWork(token);
  if (!work) return { title: "No longer on view" };
  // What a link to this work shows when it is shared on WhatsApp or elsewhere: the work's own
  // cover, its title, the maker and the status as the maker last stated it. Nothing else.
  const [cover] = await imagesFor([work.id]);
  const title = `${work.title} by ${work.maker_display_name}`;
  const description = [work.medium ?? work.material, STATUS_LABEL[work.status]].filter(Boolean).join(" · ");
  const url = `/work/${work.public_token}`;
  return {
    title, description,
    alternates: { canonical: url },
    openGraph: {
      type: "article", siteName: "The Gallery", title, description, url,
      // The w1280 variant is at most 1280 wide, keeping the image's proportion.
      images: cover ? [{ url: `/img/${cover.id}/w1280`, width: Math.min(1280, cover.width),
                         height: Math.round(cover.height * Math.min(1280, cover.width) / cover.width),
                         alt: cover.alt_text ?? work.title }] : undefined,
    },
    twitter: { card: cover ? "summary_large_image" : "summary", title, description },
  };
}

export default async function WorkDetail(
  { params, searchParams }:
  { params: Promise<{ token: string }>; searchParams: Promise<{ contact?: string; intent?: string }> },
) {
  const { token } = await params;
  const { contact, intent: intentParam } = await searchParams;
  const work = await getWork(token);

  // A URL that was public and is not any more still answers, truthfully
  // (PRODUCT_ARCHITECTURE §4.1). It does not 404 and it does not pretend.
  if (!work) {
    const ending = await getWorkEnding(token);
    if (!ending) notFound();
    const reason = ending.maker_status !== "active"
      ? "This gallery is not available."
      : ending.taken_down ? "This work has been taken down."
      : ending.lifecycle === "retired" ? "This work is no longer shown."
      : "This work is not on view.";
    return (
      <>
        <Header place={ending.maker_status === "active" ? ending.maker_display_name : undefined} back="/" />
      <main id="main" tabIndex={-1}>
        <div className="centre">
          <div className="lbl">No longer on view</div>
          <h1>{ending.title}</h1>
          <p>{reason}</p>
          {ending.maker_status === "active"
            ? <Link className="btn" href={`/m/${ending.maker_handle}`}>Visit {ending.maker_display_name}</Link>
            : <Link className="btn" href="/">Back to the entrance</Link>}
        </div>
        </main>
      <Footer />
      </>
    );
  }

  const [images, routes, siblings] = await Promise.all([
    imagesFor([work.id]), routesFor(work.maker_id), listWorksByMaker(work.maker_handle),
  ]);
  const stale = statusIsStale(work.status_confirmed_at);
  const ago = confirmedAgo(work.status_confirmed_at);
  const sold = work.status === "sold";
  const dims = dimensions(work.height_mm, work.width_mm, work.depth_mm);
  const who = shortName(work.maker_display_name, work.maker_kind);
  const intent = parseIntent(intentParam, sold);
  const here = `/work/${work.public_token}`;
  const message = { title: work.title, url: `${process.env.GALLERY_BASE_URL ?? ""}${here}`, intent,
                    status: STATUS_LABEL[work.status] };

  return (
    <>
      <Header place={work.maker_display_name} back="/" />
      <main id="main" tabIndex={-1}>

      {/* Compact: one column. Expanded (§10): the image column (7 parts) beside the wall label
          (5 parts), the label sticky so it stays beside the work as the images scroll. */}
      <div className="detail">
      <div className="detail-media">
      {/* Each image keeps its own proportion. Nothing is cropped to a common shape: the
          maker framed the object, and a gallery that re-crops is editing the work. */}
      <div className="imgstrip" id="work-images" role="region" aria-label={`Images of ${work.title}`} tabIndex={0}>
        {images.length ? images.map((im, i) => (
          <figure className="shot" key={im.id} style={{ margin: 0 }}>
            {/* The first image is the hero a tile becomes (one view transition, R4). */}
            <img src={imgSrc(im, "w1280") ?? undefined} alt={im.alt_text ?? `${work.title}, image ${im.position + 1}`}
                 width={im.width} height={im.height}
                 style={i === 0 ? { viewTransitionName: "work-hero" } : undefined} />
          </figure>
        )) : <div className="frame r45" style={{ width: "100%" }}><span className="notice">No image yet</span></div>}
      </div>
      <div className="hero" aria-hidden><div className="ledge" /></div>
      {/* Where the visitor is among the images, never "views": a view count is a public
          engagement figure the product refuses (GAL-R07). */}
      {images.length > 1 ? <div className="context image-count" style={{ paddingTop: 10, paddingBottom: 0 }}><ImageCount stripId="work-images" total={images.length} /></div> : null}

      </div>
      <div className="detail-label">
      <div className="label">
        <div className={`status ${sold ? "sold" : "available"}`}>
          <span><Mark muted={sold} />{STATUS_LABEL[work.status]}</span>
          {work.price_mode === "exact" && !sold
            ? <span className="price">{price(work.price_mode, work.price_amount)}</span>
            : work.price_mode !== "exact" ? <span className="price">{price(work.price_mode, null)}</span> : null}
          {/* Status you can trust (R4): when the maker last stated it, fed by their reconfirmation.
              Past 90 days it reads as a caution, never hidden (DOMAIN_MODEL §2.3, P-11). */}
          {ago ? (stale
            ? <span className="stale" data-testid="freshness">Status last confirmed {ago}</span>
            : <span className="fresh" data-testid="freshness"><span aria-hidden>· </span>confirmed {ago}</span>) : null}
        </div>
        <h1 className="title">{work.title}</h1>
        <div className="makerline">{work.maker_display_name} <em>· {work.medium ?? work.material}</em></div>
        {dims ? <div className="dims">{dims}{work.year ? ` · ${work.year}` : ""}</div> : null}
      </div>

      {/* Contact is offered only once there is a way to be contacted (GAL-PR-01). A button
          that opens onto "no route yet" is a promise the page cannot keep. */}
      <div className="actions">
        {routes.length ? (
          <Link className="btn block" href={`${here}?contact=1`} id="contact-trigger" scroll={false}>
            <Icon name="chat" /> Contact {who} <span className="arrow" aria-hidden>→</span>
          </Link>
        ) : (
          <p className="small" data-testid="no-contact">{work.maker_display_name} is not taking enquiries here yet.</p>
        )}
      </div>
      <div className="actions secondary">
        <SaveButton token={work.public_token} />
      </div>

      {work.process ? (
        <div className="section">
          <div className="lead">About this work</div>
          <p className="body">{work.process}</p>
        </div>
      ) : null}

      <div className="section">
        <div className="lead">The maker</div>
        <h2 style={{ margin: "0 0 4px" }}>{work.maker_display_name}</h2>
        <div className="makerline"><em>{work.maker_city}</em></div>
        <div className="inline-actions" style={{ padding: "14px 0 0" }}>
          <Link className="textlink" href={`/m/${work.maker_handle}`}>
            The gallery, {siblings.length} work{siblings.length === 1 ? "" : "s"} <span className="arrow" aria-hidden>→</span>
          </Link>
        </div>
      </div>
      </div>
      </div>

      {contact && routes.length ? (
        <>
        <Link className="contact-scrim" href={here} aria-hidden tabIndex={-1} scroll={false} />
        <section className="sheet contact" role="dialog" aria-modal="true" tabIndex={-1}
                 aria-labelledby="contact-title" id="contact">
          <SheetFocus sheetId="contact" closeHref={here} returnFocusTo="contact-trigger" />
          <div className="handle" />
          <div className="head">
            <h2 id="contact-title">Contact {work.maker_display_name}</h2>
            <Link className="iconbtn" href={here} aria-label="Close" data-autofocus scroll={false}><Icon name="close" /></Link>
          </div>
          {/* The choice is real: it changes the message the maker receives. Each option is a link
              to the same sheet with that intent, so it works without script and the URL says
              which one is chosen. */}
          <nav aria-label="What your message is about">
            <ul className="choice">
              {INTENTS.map((i) => (
                <li key={i.key}>
                  <Link href={`${here}?contact=1&intent=${i.key}`} replace scroll={false}
                        aria-current={intent === i.key ? "true" : undefined} data-intent={i.key}>
                    {i.label}{intent === i.key ? <Icon name="check" /> : null}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          {/* GAL-C1: the disclosure appears once, here, before any route is opened. */}
          <p className="disclosure">
            You are contacting the maker directly. Payment, delivery, returns and any dispute are arranged
            with them; The Gallery does not process the transaction.
          </p>
          <ul className="routes">
            {routes.map((r) => (
              <li key={r.id}>
                <Icon name={r.kind === "whatsapp" ? "chat" : r.kind === "email" ? "mail"
                         : r.kind === "phone" ? "phone" : r.kind === "form" ? "form" : "globe"} />
                <span className="kind">{ROUTE_LABEL[r.kind]}</span>
                <a className="val" href={routeHref(r, message)} rel="noopener noreferrer"
                   target={r.kind === "website" || r.kind === "form" ? "_blank" : undefined}
                   data-route-kind={r.kind}>
                  {routeDisplay(r, work.maker_display_name, true, work.maker_kind)}
                  {r.kind === "website" || r.kind === "form" ? <span className="sr-only"> (opens in a new tab)</span> : null}
                </a>
                <Icon name="external" small />
              </li>
            ))}
          </ul>
        </section>
        </>
      ) : null}
      </main>
      <Footer />
    </>
  );
}
