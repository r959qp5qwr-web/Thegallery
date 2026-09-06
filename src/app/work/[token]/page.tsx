import Link from "next/link";
import { notFound } from "next/navigation";
import { getWork, getWorkEnding, imagesFor, routesFor, listWorksByMaker } from "@/lib/queries";
import { Header, Band, Footer, imgSrc } from "@/components/Chrome";
import { Icon } from "@/components/Icon";
import { SaveButton } from "@/components/SaveButton";
import { STATUS_LABEL, price, dimensions, statusIsStale, routeHref, routeDisplay, ROUTE_LABEL } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function WorkDetail(
  { params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ contact?: string }> },
) {
  const { token } = await params;
  const { contact } = await searchParams;
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
        <div className="centre">
          <div className="lbl">No longer on view</div>
          <h1>{ending.title}</h1>
          <p>{reason}</p>
          {ending.maker_status === "active"
            ? <Link className="btn" href={`/m/${ending.maker_handle}`}>Visit {ending.maker_display_name}</Link>
            : <Link className="btn" href="/">Back to the entrance</Link>}
        </div>
        <Footer />
      </>
    );
  }

  const [images, routes, siblings] = await Promise.all([
    imagesFor([work.id]), routesFor(work.maker_id), listWorksByMaker(work.maker_handle),
  ]);
  const stale = statusIsStale(work.status_confirmed_at);
  const sold = work.status === "sold";
  const dims = dimensions(work.height_mm, work.width_mm, work.depth_mm);

  return (
    <>
      <Header place={work.maker_display_name} back="/" />

      {/* Each image keeps its own proportion. Nothing is cropped to a common shape: the
          maker framed the object, and a gallery that re-crops is editing the work. */}
      <div className="imgstrip" style={{ paddingTop: 12 }}>
        {images.length ? images.map((im) => (
          <figure className="shot" key={im.id} style={{ margin: 0 }}>
            <img src={imgSrc(im, "w1280") ?? undefined} alt={im.alt_text ?? `${work.title}, image ${im.position + 1}`}
                 width={im.width} height={im.height} />
          </figure>
        )) : <div className="frame r45" style={{ width: "100%" }}><span className="notice">No image yet</span></div>}
      </div>

      <div className="label">
        <div className={`status ${sold ? "sold" : "available"}`}>
          {STATUS_LABEL[work.status]}
          {work.price_mode === "exact" && !sold
            ? <span className="price">· {price(work.price_mode, work.price_amount)}</span>
            : work.price_mode !== "exact" ? <span className="price">· {price(work.price_mode, null)}</span> : null}
          {stale ? <span className="stale">Status last confirmed some time ago</span> : null}
        </div>
        <h1 className="title">{work.title}</h1>
        <div className="meta">{work.maker_display_name} · {work.medium ?? work.material}</div>
        {dims ? <div className="dims">{dims}{work.year ? ` · ${work.year}` : ""}</div> : null}
      </div>

      <div className="actions">
        <Link className="btn block" href={`/work/${work.public_token}?contact=1`}>
          <Icon name="chat" /> Contact {work.maker_display_name.split(" ")[0]}
        </Link>
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
        <p className="body">{work.maker_display_name} · {work.maker_city}</p>
        <div className="inline-actions" style={{ padding: "12px 0 0" }}>
          <Link className="textlink" href={`/m/${work.maker_handle}`}>
            View the gallery ({siblings.length} work{siblings.length === 1 ? "" : "s"})
          </Link>
        </div>
      </div>

      {contact ? (
        <>
        <Link className="contact-scrim" href={`/work/${work.public_token}`} aria-label="Close" />
        <section className="sheet contact" role="dialog" aria-modal="true"
                 aria-label={`Contact ${work.maker_display_name}`} id="contact">
          <div className="handle" />
          <div className="head">
            <h2>Contact {work.maker_display_name}</h2>
            <Link className="iconbtn" href={`/work/${work.public_token}`} aria-label="Close"><Icon name="close" /></Link>
          </div>
          <ul className="choice">
            <li>Ask about this work <Icon name="check" /></li>
            <li>Commission something like this</li>
            <li>General enquiry</li>
          </ul>
          {/* GAL-C1: the disclosure appears once, here, before any route is opened. */}
          <p className="disclosure">
            You are contacting the maker directly. Payment, delivery, returns and any dispute are arranged
            with them; The Gallery does not process the transaction.
          </p>
          {routes.length ? (
            <ul className="routes">
              {routes.map((r) => (
                <li key={r.id}>
                  <Icon name={r.kind === "whatsapp" ? "chat" : r.kind === "email" ? "mail"
                           : r.kind === "phone" ? "phone" : r.kind === "form" ? "form" : "globe"} />
                  <span className="kind">{ROUTE_LABEL[r.kind]}</span>
                  <a className="val" href={routeHref(r, work.title)} rel="noopener noreferrer"
                     target={r.kind === "website" || r.kind === "form" ? "_blank" : undefined}
                     data-route-kind={r.kind}>
                    {routeDisplay(r, work.maker_display_name, work.title)}
                  </a>
                  <Icon name="external" small />
                </li>
              ))}
            </ul>
          ) : (
            <Band label="No route yet">
              {work.maker_display_name} has not published a way to be contacted. Their gallery may
              say more about the practice.
            </Band>
          )}
        </section>
        </>
      ) : null}
      <Footer />
    </>
  );
}
