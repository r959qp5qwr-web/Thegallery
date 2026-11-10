import Link from "next/link";
import { notFound } from "next/navigation";
import { getWork, getWorkEnding, imagesFor, routesFor } from "@/lib/queries";
import { Header, Footer, EmptyState, imgSrc } from "@/components/Chrome";
import { Icon } from "@/components/Icon";
import { ImageCount } from "@/components/ImageCount";
import { SaveButton } from "@/components/SaveButton";
import { BackButton, ShareButton } from "@/components/PageTools";
import { ContactSheet } from "@/components/ContactSheet";
import { STATUS_LABEL, labelPrice, dimensions, statusIsStale, confirmedAgo, shortName, parseIntent } from "@/lib/format";
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
        <Header back="/" />
        <main id="main" tabIndex={-1}>
          <EmptyState level={1} title={ending.title}
                      routes={ending.maker_status === "active"
                        ? <Link className="textlink" href={`/m/${ending.maker_handle}`}>Visit {ending.maker_display_name}</Link>
                        : <Link className="textlink" href="/">Back to The Gallery</Link>}>
            {reason}
          </EmptyState>
        </main>
        <Footer />
      </>
    );
  }

  const [images, routes] = await Promise.all([imagesFor([work.id]), routesFor(work.maker_id)]);
  const stale = statusIsStale(work.status_confirmed_at);
  const ago = confirmedAgo(work.status_confirmed_at);
  const sold = work.status === "sold";
  const shownPrice = labelPrice(work);
  const dims = dimensions(work.height_mm, work.width_mm, work.depth_mm);
  const who = shortName(work.maker_display_name, work.maker_kind);
  // What the message is about follows the work: a sold work asks about one like it, any other
  // asks about this one. The sheet no longer asks (drawing board, screen 2b); a link that names
  // an intent (?intent=commission) is still honoured.
  const intent = parseIntent(intentParam, sold);
  const here = `/work/${work.public_token}`;
  const message = { title: work.title, url: `${process.env.GALLERY_BASE_URL ?? ""}${here}`, intent,
                    status: STATUS_LABEL[work.status] };

  return (
    <>
      {/* On a phone the photograph takes the top of the screen (drawing board, screen 2): no
          header above it, Back, Share and the heart over it. From 900 px the header returns. */}
      <Header className="over-work" back={`/m/${work.maker_handle}`} />
      <main id="main" tabIndex={-1} className={`work-page${routes.length ? " has-workbar" : ""}`}>

      {/* Compact: one column. Expanded (§10): the image column (7 parts) beside the wall label
          (5 parts), the label sticky so it stays beside the work as the images scroll. */}
      <div className="detail">
      <div className="detail-media">
      <div className="photo-tools">
        <BackButton href={`/m/${work.maker_handle}`} className="roundbtn back" />
        <span className="photo-tools-end">
          <ShareButton title={`${work.title} by ${work.maker_display_name}`} path={here} />
          <SaveButton token={work.public_token} />
        </span>
      </div>
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
      {/* Where the visitor is among the images, never "views": a view count is a public
          engagement figure the product refuses (GAL-R07). A 2 px line shows the position and that
          the strip swipes; the words stay for assistive technology. */}
      {images.length > 1 ? <div className="image-count"><ImageCount stripId="work-images" total={images.length} /></div> : null}

      </div>
      <div className="detail-label">
      {/* The wall label (drawing board, screen 2): status first, then the title, the maker and
          the medium, then one line of facts ending in when the status was last stated. */}
      <div className="label">
        <div className={`status${sold ? " sold" : work.status === "available" ? " available" : ""}`}>
          <span>{STATUS_LABEL[work.status]}</span>
          {/* One price rule for every public surface (labelPrice): none beside Sold or Not for
              sale, and never a repeat of the status. */}
          {shownPrice ? <><span className="sep" aria-hidden>·</span><span className="price" data-testid="price">{shownPrice}</span></> : null}
        </div>
        <h1 className="title">{work.title}</h1>
        {/* The maker is named once on the page, as the way to their gallery (Wave 5). */}
        <div className="makerline">
          <Link href={`/m/${work.maker_handle}`}>{work.maker_display_name}</Link>
          {work.medium ?? work.material ? <> · {work.medium ?? work.material}</> : null}
        </div>
        <div className="facts">
          {/* Status you can trust (R4): when the maker last stated it, fed by their reconfirmation.
              Past 90 days it reads as a caution on its own line, never hidden (DOMAIN_MODEL §2.3, P-11). */}
          {dims || work.year || (ago && !stale) ? (
            <div className="dims">
              {[dims, work.year ? String(work.year) : null].filter(Boolean).join(" · ")}
              {ago && !stale ? <>{dims || work.year ? " · " : ""}<span className="fresh" data-testid="freshness">updated {ago}</span></> : null}
            </div>
          ) : null}
          {ago && stale ? <div className="stale" data-testid="freshness">Status last confirmed {ago}</div> : null}
        </div>
      </div>

      {/* The maker's own words fold away under one row, open on a tap (drawing board, screen 2). */}
      {work.process ? (
        <div className="folds">
          <details className="fold">
            <summary>In {who}&rsquo;s words<Icon name="chevron" /></summary>
            <p className="note">{work.process}</p>
          </details>
        </div>
      ) : null}

      {/* Contact is offered only once there is a way to be contacted (GAL-PR-01). The one filled
          action of the page: pinned to the foot of a phone screen, beside the label on a wide
          one; the same link, so the contact sheet and its disclosure come first either way.
          A sold work keeps it: the maker may make another. */}
      {routes.length ? (
        <div className="workbar">
          <Link className="btn solid" href={`${here}?contact=1`} id="contact-trigger" scroll={false}>
            <Icon name="chat" /> Message {who}
          </Link>
        </div>
      ) : (
        <div className="actions"><p className="small" data-testid="no-contact">{work.maker_display_name} is not taking enquiries here yet.</p></div>
      )}
      </div>
      </div>

      {contact && routes.length ? (
        <ContactSheet heading={`Message ${who}`} closeHref={here} returnFocusTo="contact-trigger"
                      routes={routes} work={message}
                      disclosure={<>You are contacting the maker directly. Payment, delivery, returns and any dispute are
                        arranged with them; The Gallery does not process the transaction.</>} />
      ) : null}
      </main>
      <Footer />
    </>
  );
}
