import { listRecentWorks, imagesFor, materials, type PublicImage } from "@/lib/queries";
import { Header, Hero, WorkTile, MaterialRail, Footer, Mark, Action, EmptyPlinth, orientation } from "@/components/Chrome";
import { STATUS_LABEL, price } from "@/lib/format";

export const dynamic = "force-dynamic";

// The entrance: one published work at substantial scale before any feature tile (GAL-01),
// then the material rail, then recent work. A gallery opens on an object, not on a grid of
// controls — and the object supplies the colour; the room around it stays quiet.
export default async function Entrance() {
  const [works, mats] = await Promise.all([listRecentWorks(13), materials()]);
  const images = await imagesFor(works.map((w) => w.id));
  const byWork = new Map<string, PublicImage>();
  for (const i of images) if (!byWork.has(i.work_id)) byWork.set(i.work_id, i);

  const [featured, ...rest] = works;

  return (
    <>
      <Header place="Bengaluru" />
      {featured ? (
        <>
          <div className="context">
            <span>On view now</span>
            <span className="accent">Bengaluru</span>
          </div>
          <Hero image={byWork.get(featured.id)}
                alt={byWork.get(featured.id)?.alt_text ?? featured.title}
                href={`/work/${featured.public_token}`} />
          <div className="label">
            <div className={`status ${featured.status === "sold" ? "sold" : "available"}`}>
              <span><Mark muted={featured.status === "sold"} />{STATUS_LABEL[featured.status]}</span>
              {featured.price_mode === "exact" && featured.status !== "sold"
                ? <span className="price">{price(featured.price_mode, featured.price_amount)}</span> : null}
            </div>
            <h1 className="title">{featured.title}</h1>
            <div className="makerline">{featured.maker_display_name} <em>· {featured.medium ?? featured.material}</em></div>
          </div>
          <div className="actions">
            <Action href={`/work/${featured.public_token}`} primary>View the work</Action>
          </div>
          <div className="row-end" style={{ paddingTop: 10 }}>
            <a className="textlink" href={`/m/${featured.maker_handle}`}>
              {featured.maker_display_name}&rsquo;s gallery <span className="arrow" aria-hidden>→</span>
            </a>
          </div>
        </>
      ) : (
        <>
          <div className="context"><span>On view now</span><span className="accent">Bengaluru</span></div>
          <EmptyPlinth title="The Gallery is being hung"
                       action={<Action href="/makers" primary>For makers</Action>}>
            No work is on view yet. The first makers are setting up their galleries, and the
            first one to publish opens the room.
          </EmptyPlinth>
        </>
      )}

      <div style={{ marginTop: 28 }}>
        <MaterialRail materials={mats} />
      </div>

      {rest.length ? (
        <div className="section">
          <div className="lead">Recently added</div>
          <div className="grid" style={{ padding: 0 }}>
            {rest.map((w) => (
              <WorkTile key={w.id} work={w} image={byWork.get(w.id)}
                        wide={orientation(byWork.get(w.id)) === "landscape"} />
            ))}
          </div>
        </div>
      ) : null}
      <Footer />
    </>
  );
}
