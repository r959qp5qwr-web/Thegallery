import Link from "next/link";
import { search, imagesFor, type PublicImage } from "@/lib/queries";
import { Header, WorkTile, Footer, EmptyState } from "@/components/Chrome";
import { KIND_LABEL } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Search" };

export default async function Search({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const { works, makers } = await search(q);
  const images = await imagesFor(works.map((w) => w.id));
  const byWork = new Map<string, PublicImage>();
  for (const i of images) if (!byWork.has(i.work_id)) byWork.set(i.work_id, i);

  return (
    <>
      <Header />
      <main id="main" tabIndex={-1}>
      <h1 className="sr-only">Search work and makers</h1>
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
        <EmptyState title={`Nothing found for “${q}”`}>
          Try a maker&rsquo;s name, or a material such as clay or brass.
        </EmptyState>
      ) : (
        <>
          {makers.length ? (
            <div className="section">
              <h2 className="lead">Makers</h2>
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
              <h2 className="lead">Work</h2>
              <div className="grid" style={{ padding: 0 }}>
                {works.map((w) => <WorkTile key={w.id} work={w} image={byWork.get(w.id)} />)}
              </div>
            </div>
          ) : null}
        </>
      )}
      </main>
      <Footer />
    </>
  );
}
