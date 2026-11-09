import Link from "next/link";
import { getMaker, listWorksByMaker, imagesFor, routesFor, type PublicImage } from "@/lib/queries";
import { Header, WorkTile, Footer, EmptyState, orientation } from "@/components/Chrome";
import { Icon } from "@/components/Icon";
import { KIND_LABEL, ROUTE_LABEL, routeHref, routeDisplay, shortName } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const maker = await getMaker(handle);
  return { title: maker ? maker.display_name : "Gallery not available" };
}

export default async function MakerGallery({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const maker = await getMaker(handle);

  // A hidden, suspended or closed gallery says so plainly, and says nothing else about why:
  // the reason is between the operator and the maker (DOMAIN_MODEL §1, status_reason private).
  if (!maker) {
    return (
      <>
        <Header />
        <main id="main" tabIndex={-1}>
          <EmptyState level={1} title="This gallery is not available"
                      routes={<Link className="textlink" href="/">Back to The Gallery</Link>}>
            It may not be published yet, or the maker has closed it.
          </EmptyState>
        </main>
        <Footer />
      </>
    );
  }

  const [works, routes] = await Promise.all([listWorksByMaker(handle), routesFor(maker.id)]);
  const images = await imagesFor(works.map((w) => w.id));
  const byWork = new Map<string, PublicImage>();
  for (const i of images) if (!byWork.has(i.work_id)) byWork.set(i.work_id, i);
  const leadHang = works.length >= 3
    && works.slice(0, 3).every((w) => orientation(byWork.get(w.id)) !== "landscape");

  const whatsapp = routes.find((r) => r.kind === "whatsapp");
  const who = shortName(maker.display_name, maker.kind);
  const others = routes.filter((r) => r !== whatsapp);

  return (
    <>
      <Header />
      <main id="main" tabIndex={-1}>
      {/* The page opens on the maker: the name at display size, the place, their own words
          (Wave 5). The kind is said only when it is not an individual maker. */}
      <section className="maker-head">
        {maker.kind !== "individual" ? <div className="kind">{KIND_LABEL[maker.kind]}</div> : null}
        <h1>{maker.display_name}</h1>
        <div className="where">
          {maker.city}{maker.region ? `, ${maker.region}` : ""}, {maker.country}
          {maker.exact_address ? <><br />{maker.exact_address}</> : null}
          {maker.commissions_open && !maker.commissions_note ? <><br />Open to commissions</> : null}
        </div>
        {maker.practice_note ? <p className="practice">{maker.practice_note}</p> : null}
        {maker.gallery_intro ? <p className="intro">{maker.gallery_intro}</p> : null}
      </section>

      {works.length ? (
        // The gallery's order sets the rhythm, not the image ratio (R4): from three works up, the
        // first in the maker's order hangs large with the next two beside it, on a wall wide
        // enough (>= 900 px), unless one of the three is landscape. Otherwise the plain hang.
        <section className={`grid${leadHang ? " hang-lead" : ""}`} aria-label="Work">
          {works.map((w, i) => (
            <WorkTile key={w.id} work={w} image={byWork.get(w.id)} inGallery
                      lead={leadHang && i === 0}
                      wide={orientation(byWork.get(w.id)) === "landscape"} />
          ))}
        </section>
      ) : (
        <EmptyState title="Nothing hung yet">
          Work appears here as soon as it is published.
        </EmptyState>
      )}

      {maker.commissions_open && maker.commissions_note ? (
        <section className="section">
          <h2 className="lead">Commissions</h2>
          <p className="body">{maker.commissions_note}</p>
        </section>
      ) : null}

      <section className="section contact-end" aria-labelledby="talk">
        <h2 className="lead" id="talk">Get in touch</h2>
        {routes.length ? (
          <>
            {/* GAL-C1, fixed in meaning (payment, delivery, returns and disputes are the maker's and
                the visitor's): said plainly here, before any route on this page is opened. */}
            <p className="disclosure" data-testid="disclosure">You&rsquo;re talking to {who} directly. Payment, delivery, returns and any
              dispute are arranged between you; The Gallery takes no part in the sale.</p>
            {whatsapp ? (
              <a className="btn primary" href={routeHref(whatsapp)} rel="noopener noreferrer" data-route-kind="whatsapp">
                <Icon name="chat" /> Message on WhatsApp
              </a>
            ) : null}
            {others.length ? (
              <ul className="routes">
                {others.map((r) => (
                  <li key={r.id}>
                    <span className="kind">{ROUTE_LABEL[r.kind]}</span>
                    <a className="val" href={routeHref(r)} rel="noopener noreferrer"
                       target={r.kind === "website" || r.kind === "form" ? "_blank" : undefined}>
                      {routeDisplay(r, maker.display_name, false, maker.kind)}
                      {r.kind === "website" || r.kind === "form" ? <span className="sr-only"> (opens in a new tab)</span> : null}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </>
        ) : (
          <p className="body">This maker has not published a way to be contacted.</p>
        )}
      </section>
      </main>
      <Footer />
    </>
  );
}
