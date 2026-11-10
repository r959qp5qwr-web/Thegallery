import Link from "next/link";
import { getMaker, listWorksByMaker, imagesFor, routesFor, materials, type PublicImage } from "@/lib/queries";
import { Header, Footer, EmptyState, imgSrc } from "@/components/Chrome";
import { Icon } from "@/components/Icon";
import { TransitionLink } from "@/components/ViewTransition";
import { ContactSheet } from "@/components/ContactSheet";
import { STATUS_LABEL, labelPrice, shortName } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const maker = await getMaker(handle);
  return { title: maker ? maker.display_name : "Gallery not available" };
}

export default async function MakerGallery(
  { params, searchParams }: { params: Promise<{ handle: string }>; searchParams: Promise<{ contact?: string }> },
) {
  const { handle } = await params;
  const { contact } = await searchParams;
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

  const [works, routes, mats] = await Promise.all([listWorksByMaker(handle), routesFor(maker.id), materials()]);
  const images = await imagesFor(works.map((w) => w.id));
  const byWork = new Map<string, PublicImage>();
  for (const i of images) if (!byWork.has(i.work_id)) byWork.set(i.work_id, i);

  // The label over the name (drawing board, screen 3): the material most of their work is in,
  // then the maker's own town. The place is only ever the maker's own field (GAL-OD-04).
  const counts = new Map<string, number>();
  for (const w of works) counts.set(w.material, (counts.get(w.material) ?? 0) + 1);
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const material = top ? mats.find((m) => m.key === top)?.label ?? null : null;
  const who = shortName(maker.display_name, maker.kind);
  const here = `/m/${maker.handle}`;

  return (
    <>
      <Header back="/" share={{ title: maker.display_name, path: here }} />
      <main id="main" tabIndex={-1}>
      {/* Built like a profile: who, where, one line in their words, one button, then the work. */}
      <section className="maker-head">
        <div className="lbl" data-testid="maker-label">{[material, maker.city].filter(Boolean).join(" · ")}</div>
        <h1>{maker.display_name}</h1>
        {maker.practice_note ? <p className="practice">&ldquo;{maker.practice_note}&rdquo;</p> : null}
        {maker.gallery_intro ? <p className="intro">{maker.gallery_intro}</p> : null}
        {maker.exact_address ? <p className="where">{maker.exact_address}</p> : null}
        {/* Contact is offered only once a route exists (GAL-PR-01). */}
        {routes.length ? (
          <div className="maker-act">
            <Link className="btn solid" href={`${here}?contact=1`} id="contact-trigger" scroll={false}>
              <Icon name="chat" /> Message
            </Link>
          </div>
        ) : <p className="small" data-testid="no-contact">{maker.display_name} is not taking enquiries here yet.</p>}
      </section>

      {works.length ? (
        <section className="profile-wall" aria-label="Work">
          <div className="count lbl">{works.length === 1 ? "1 work" : `${works.length} works`}</div>
          {/* Three across, edge to edge, like a profile. Each square is a glance: the status is
              said on it unless the work is Available, for which a stated price stands in
              (P-11, GAL-PR-02); the work's own page shows it whole. */}
          <div className="grid3">
            {works.map((w) => {
              const im = byWork.get(w.id);
              const src = imgSrc(im, "w640");
              const tilePrice = labelPrice(w, { exactOnly: true });
              // The tiles' rule (WorkTile): the status unless Available, then any stated price.
              const flag = [w.status !== "available" ? STATUS_LABEL[w.status] ?? w.status : null, tilePrice]
                .filter(Boolean).join(" · ");
              return (
                <TransitionLink key={w.id} className="tile sq" href={`/work/${w.public_token}`}>
                  {src ? <img src={src} alt="" loading="lazy" data-hero={imgSrc(im, "w1280") ?? undefined} /> : <span className="notice">No image yet</span>}
                  <span className="gt sr-only">{w.title}</span>
                  {flag ? <span className="sr-only">, </span> : null}
                  {flag ? <span className={`flag gs${w.status === "available" ? " available" : ""}`}>{flag}</span> : null}
                </TransitionLink>
              );
            })}
          </div>
        </section>
      ) : (
        <EmptyState title="Nothing hung yet">
          Work appears here as soon as it is published.
        </EmptyState>
      )}

      {maker.commissions_open ? (
        <section className="section">
          <h2 className="lead">Commissions</h2>
          <p className="body">{maker.commissions_note ?? `${who} is open to commissions.`}</p>
        </section>
      ) : null}

      {contact && routes.length ? (
        <ContactSheet heading={`Message ${who}`} closeHref={here} returnFocusTo="contact-trigger" routes={routes}
                      // GAL-C1, fixed in meaning (payment, delivery, returns and disputes are the maker's and
                      // the visitor's), said before any route on this page is opened.
                      disclosure={<>You&rsquo;re talking to {who} directly. Payment, delivery, returns and any dispute
                        are arranged between you; The Gallery takes no part in the sale.</>} />
      ) : null}
      </main>
      <Footer />
    </>
  );
}
