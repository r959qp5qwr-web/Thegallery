import Link from "next/link";
import { listRecentWorks, imagesFor, materialsOnView, type PublicImage } from "@/lib/queries";
import { Header, Hero, WorkTile, Footer, MaterialRail, Plinth, orientation } from "@/components/Chrome";
import { STATUS_LABEL, labelPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

// The entrance: one published work at substantial scale before any feature tile (GAL-01),
// then recent work, then the materials that have something on view (GAL-OD-05). A gallery
// opens on an object; while there is none, it opens on a sentence that says so plainly.
export default async function Entrance() {
  const [works, mats] = await Promise.all([listRecentWorks(13), materialsOnView()]);
  const images = await imagesFor(works.map((w) => w.id));
  const byWork = new Map<string, PublicImage>();
  for (const i of images) if (!byWork.has(i.work_id)) byWork.set(i.work_id, i);

  const [featured, ...rest] = works;

  if (!featured) {
    // Nothing on view yet (the live site before its first maker publishes): the empty plinth, one
    // sentence, one line, and one way in for a maker (drawing board, screen 1b).
    return (
      <>
        <Header />
        <main id="main" tabIndex={-1}>
          <div className="context"><span>Opening soon</span></div>
          <section className="opening" data-testid="opening">
            <Plinth />
            <h1>The first works are being hung.</h1>
            <p>The first makers are setting up their rooms.</p>
            <Link className="act primary" href="/makers">Open your gallery</Link>
          </section>
        </main>
        <Footer />
      </>
    );
  }

  const featuredPrice = labelPrice(featured, { exactOnly: true });
  return (
    <>
      <Header />
      <main id="main" tabIndex={-1}>
        <div className="context"><span>On view now</span></div>
        {/* Expanded: the featured work takes seven of twelve columns, its label at the foot of it. */}
        <div className="featured">
          <div className="featured-media">
            <Hero image={byWork.get(featured.id)}
                  alt={byWork.get(featured.id)?.alt_text ?? featured.title}
                  href={`/work/${featured.public_token}`} />
          </div>
          <div className="featured-label">
            <div className="label">
              {/* Every status but "Available" is said; for an available work a stated price stands in. */}
              {featured.status !== "available" || featuredPrice ? (
                <div className={`status ${featured.status === "available" ? "available" : featured.status === "sold" ? "sold" : ""}`}>
                  {featured.status !== "available" ? <span>{STATUS_LABEL[featured.status]}</span> : null}
                  {featuredPrice ? <span className="price">{featuredPrice}</span> : null}
                </div>
              ) : null}
              <h1 className="title"><Link href={`/work/${featured.public_token}`}>{featured.title}</Link></h1>
              <div className="makerline">
                <Link href={`/m/${featured.maker_handle}`}>{featured.maker_display_name}</Link> · {featured.medium ?? featured.material}
              </div>
            </div>
          </div>
        </div>

        {mats.length ? <MaterialRail materials={mats} /> : null}

        {rest.length ? (
          <section className="section wall" aria-labelledby="recent">
            <h2 className="lead" id="recent">Recently hung</h2>
            <div className="grid">
              {rest.map((w) => (
                <WorkTile key={w.id} work={w} image={byWork.get(w.id)}
                          wide={orientation(byWork.get(w.id)) === "landscape"} />
              ))}
            </div>
          </section>
        ) : null}
      </main>
      <Footer />
    </>
  );
}
