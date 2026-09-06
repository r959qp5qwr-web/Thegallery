import Link from "next/link";
import { getMaker, listWorksByMaker, imagesFor, routesFor, type PublicImage } from "@/lib/queries";
import { Header, WorkTile, Footer, Mark, EmptyPlinth, orientation } from "@/components/Chrome";
import { Icon } from "@/components/Icon";
import { KIND_LABEL, ROUTE_LABEL, routeHref, routeDisplay } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function MakerGallery({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const maker = await getMaker(handle);

  // A hidden, suspended or closed gallery says so plainly, and says nothing else about why:
  // the reason is between the operator and the maker (DOMAIN_MODEL §1, status_reason private).
  if (!maker) {
    return (
      <>
        <Header back="/" />
        <div className="centre">
          <div className="lbl">Not available</div>
          <h1>This gallery is not available</h1>
          <p>It may not be published yet, or it may have been withdrawn.</p>
          <Link className="btn" href="/">Back to the entrance</Link>
        </div>
        <Footer />
      </>
    );
  }

  const [works, routes] = await Promise.all([listWorksByMaker(handle), routesFor(maker.id)]);
  const images = await imagesFor(works.map((w) => w.id));
  const byWork = new Map<string, PublicImage>();
  for (const i of images) if (!byWork.has(i.work_id)) byWork.set(i.work_id, i);

  return (
    <>
      <Header place={maker.city} back="/" />
      <div className="label">
        <div className="status"><span><Mark muted />{KIND_LABEL[maker.kind]}</span></div>
        <h1 className="title">{maker.display_name}</h1>
        <div className="makerline"><em>{maker.city}{maker.region ? `, ${maker.region}` : ""} · {maker.country}</em></div>
        {maker.exact_address ? <div className="dims">{maker.exact_address}</div> : null}
      </div>

      {maker.practice_note ? (
        <div className="section">
          <div className="lead">Practice</div>
          <p className="note">{maker.practice_note}</p>
          <div className="attrib">In {maker.display_name}&rsquo;s words</div>
        </div>
      ) : null}

      {maker.gallery_intro ? (
        <div className="section"><p className="body">{maker.gallery_intro}</p></div>
      ) : null}

      <div className="section">
        <div className="lead">{works.length ? `${works.length} work${works.length === 1 ? "" : "s"}` : "Works"}</div>
        {works.length ? (
          <div className="grid" style={{ padding: 0 }}>
            {works.map((w) => (
              <WorkTile key={w.id} work={w} image={byWork.get(w.id)}
                        wide={orientation(byWork.get(w.id)) === "landscape"} />
            ))}
          </div>
        ) : (
          <div style={{ margin: "0 calc(-1 * var(--pad-x))" }}>
            <EmptyPlinth title="Nothing on view yet">
              {maker.display_name} has a gallery and has not hung anything in it yet.
            </EmptyPlinth>
          </div>
        )}
      </div>

      {maker.commissions_open ? (
        <div className="section">
          <div className="lead">Commissions</div>
          <p className="body">{maker.commissions_note ?? "Open to commissions."}</p>
        </div>
      ) : null}

      <div className="section">
        <div className="lead">Contact</div>
        {routes.length ? (
          <>
            <p className="disclosure" style={{ padding: "0 0 4px" }}>
              You are contacting the maker directly. Payment, delivery, returns and any dispute are
              arranged with them; The Gallery does not process the transaction.
            </p>
            <ul className="routes" style={{ padding: 0 }}>
              {routes.map((r) => (
                <li key={r.id}>
                  <Icon name={r.kind === "whatsapp" ? "chat" : r.kind === "email" ? "mail"
                           : r.kind === "phone" ? "phone" : r.kind === "form" ? "form" : "globe"} />
                  <span className="kind">{ROUTE_LABEL[r.kind]}</span>
                  <a className="val" href={routeHref(r)} rel="noopener noreferrer"
                     target={r.kind === "website" || r.kind === "form" ? "_blank" : undefined}>
                    {routeDisplay(r, maker.display_name)}
                  </a>
                  <Icon name="external" small />
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="body">This maker has not published a way to be contacted.</p>
        )}
      </div>
      <Footer />
    </>
  );
}
