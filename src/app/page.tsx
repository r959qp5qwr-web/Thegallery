import Link from "next/link";
import { listRecentWorks, imagesFor, materials, type PublicImage } from "@/lib/queries";
import { Header, WorkTile, MaterialRail, Footer, imgSrc } from "@/components/Chrome";
import { STATUS_LABEL, price } from "@/lib/format";

export const dynamic = "force-dynamic";

// The entrance: one published work at substantial scale before any feature tile (GAL-01),
// then recent work, then the material rail. A gallery opens on an object, not on a grid of
// controls.
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
          <div className="context"><span>On view now</span><span className="accent">Bengaluru</span></div>
          <Link href={`/work/${featured.public_token}`} style={{ textDecoration: "none", color: "inherit" }}>
            <div className="frame r45">
              {byWork.get(featured.id)
                ? <img src={imgSrc(byWork.get(featured.id), "w1280") ?? undefined}
                       alt={byWork.get(featured.id)!.alt_text ?? ""} />
                : <span className="notice">No image yet</span>}
            </div>
            <div className="label">
              <div className={`status ${featured.status === "sold" ? "sold" : "available"}`}>
                {STATUS_LABEL[featured.status]}
                {featured.price_mode === "exact" && featured.status !== "sold"
                  ? <span className="price">· {price(featured.price_mode, featured.price_amount)}</span> : null}
              </div>
              <h1 className="title">{featured.title}</h1>
              <div className="meta">{featured.maker_display_name} · {featured.medium ?? featured.material}</div>
            </div>
          </Link>
          <div className="row-end">
            <Link className="textlink" href={`/m/${featured.maker_handle}`}>
              View {featured.maker_display_name}&rsquo;s gallery
            </Link>
          </div>
        </>
      ) : (
        <div className="empty">
          <h2>The Gallery is being hung</h2>
          <p>No work is on view yet. The first makers are setting up their galleries.</p>
          <Link className="btn" href="/makers">For makers</Link>
        </div>
      )}

      <MaterialRail materials={mats} />

      {rest.length ? (
        <div className="section">
          <div className="lead">Recently added</div>
          <div className="grid" style={{ padding: "0" }}>
            {rest.map((w) => <WorkTile key={w.id} work={w} image={byWork.get(w.id)} />)}
          </div>
        </div>
      ) : null}
      <Footer />
    </>
  );
}
