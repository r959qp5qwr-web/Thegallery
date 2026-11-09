import Link from "next/link";
import { listRecentWorks, imagesFor, materialsOnView, type PublicImage } from "@/lib/queries";
import { Header, Hero, WorkTile, Footer, orientation } from "@/components/Chrome";
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
    // Nothing on view (the live site before its first maker publishes). No picture of a pretend
    // work, no material doors into empty rooms; the one sentence is the image (Wave 5).
    return (
      <>
        <Header />
        <main id="main" tabIndex={-1}>
          <section className="opening" data-testid="opening">
            <h1>The first works are being hung.</h1>
            <p>The Gallery shows art and craft by makers in Bengaluru, potters, weavers, woodworkers and
              metalworkers, each in a room of their own. The first rooms open soon.</p>
            <div className="routes-on">
              <Link className="textlink" href="/about">What The Gallery is</Link>
              <Link className="textlink quiet" href="/makers">Are you a maker? Open your gallery</Link>
            </div>
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
        {/* Expanded: the featured work takes seven of twelve columns, its label at the foot of it. */}
        <div className="featured">
          <div className="featured-media">
            <Hero image={byWork.get(featured.id)}
                  alt={byWork.get(featured.id)?.alt_text ?? featured.title}
                  href={`/work/${featured.public_token}`} />
          </div>
          <div className="featured-label">
            <div className="label">
              <h1 className="title"><Link href={`/work/${featured.public_token}`}>{featured.title}</Link></h1>
              <div className="makerline">
                <Link href={`/m/${featured.maker_handle}`}>{featured.maker_display_name}</Link>, {featured.medium ?? featured.material}
              </div>
              {featured.status === "sold" || featuredPrice ? (
                <div className={`status ${featured.status === "sold" ? "sold" : "available"}`}>
                  {featured.status === "sold" ? <span>{STATUS_LABEL.sold}</span> : null}
                  {featuredPrice ? <span className="price">{featuredPrice}</span> : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {rest.length ? (
          <section className="wall" aria-labelledby="recent">
            <h2 className="lead" id="recent">Recently hung</h2>
            <div className="grid">
              {rest.map((w) => (
                <WorkTile key={w.id} work={w} image={byWork.get(w.id)}
                          wide={orientation(byWork.get(w.id)) === "landscape"} />
              ))}
            </div>
          </section>
        ) : null}

        {mats.length ? (
          <nav className="materials-line" aria-label="Material">
            <span>By material</span>
            {mats.map((m) => <Link key={m.key} href={`/browse/${m.key}`}>{m.label}</Link>)}
          </nav>
        ) : null}
      </main>
      <Footer />
    </>
  );
}
