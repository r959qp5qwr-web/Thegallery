import Link from "next/link";
import { search, imagesFor, type PublicImage } from "@/lib/queries";
import { Header, WorkTile, Footer, EmptyPlinth, Action } from "@/components/Chrome";
import { KIND_LABEL } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Search({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const { works, makers } = await search(q);
  const images = await imagesFor(works.map((w) => w.id));
  const byWork = new Map<string, PublicImage>();
  for (const i of images) if (!byWork.has(i.work_id)) byWork.set(i.work_id, i);

  return (
    <>
      <Header place="Search" back="/" action={<span style={{ width: 44 }} />} />
      <form className="form" action="/search" method="get" style={{ paddingTop: 16 }}>
        <div className="field">
          <label htmlFor="q">Search work and makers</label>
          <input id="q" name="q" defaultValue={q} placeholder="A title, a maker, a material"
                 autoFocus autoComplete="off" />
        </div>
        <div className="inline-actions" style={{ padding: "12px 0 0" }}>
          <button className="btn" type="submit">Search</button>
          {q ? <Link className="btn quiet" href="/search">Clear</Link> : null}
        </div>
      </form>

      {!q ? (
        <div className="hint">Search looks at titles, makers, materials and medium.</div>
      ) : works.length === 0 && makers.length === 0 ? (
        <EmptyPlinth title={`Nothing found for “${q}”`} action={<Action href="/browse/clay">Browse by material</Action>}>
          No work or maker matches that. Try a shorter term, or browse by material.
        </EmptyPlinth>
      ) : (
        <>
          {makers.length ? (
            <div className="section">
              <div className="lead">Makers</div>
              <ul className="rowlist" style={{ padding: 0 }}>
                {makers.map((m) => (
                  <li key={m.id}>
                    <Link className="grow" href={`/m/${m.handle}`} style={{ textDecoration: "none" }}>
                      <div className="primary">{m.display_name}</div>
                      <div className="secondary">{KIND_LABEL[m.kind]} · {m.city}</div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {works.length ? (
            <div className="section">
              <div className="lead">{works.length} work{works.length === 1 ? "" : "s"}</div>
              <div className="grid" style={{ padding: 0 }}>
                {works.map((w) => <WorkTile key={w.id} work={w} image={byWork.get(w.id)} />)}
              </div>
            </div>
          ) : null}
        </>
      )}
      <Footer />
    </>
  );
}
