import Link from "next/link";
import { search, imagesFor, type PublicImage } from "@/lib/queries";
import { Header, WorkTile, Footer, EmptyState, MaterialRail } from "@/components/Chrome";
import { Icon } from "@/components/Icon";
import { materialsOnView } from "@/lib/queries";
import { KIND_LABEL } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Search" };

export default async function Search({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const [{ works, makers }, mats] = await Promise.all([search(q), materialsOnView()]);
  const images = await imagesFor(works.map((w) => w.id));
  const byWork = new Map<string, PublicImage>();
  for (const i of images) if (!byWork.has(i.work_id)) byWork.set(i.work_id, i);

  return (
    <>
      <Header />
      <main id="main" tabIndex={-1}>
      <h1 className="sr-only">Search work and makers</h1>
      {/* One field with its icon; the phone's own Search key sends it (drawing board, screen 4). */}
      <form className="search-form" action="/search" method="get" role="search">
        <label className="sr-only" htmlFor="q">Search work and makers</label>
        <div className="searchbox">
          <Icon name="search" />
          <input id="q" name="q" type="search" enterKeyHint="search" defaultValue={q}
                 placeholder="A title, a maker, a material" autoFocus autoComplete="off" />
          <button className="sr-only" type="submit">Search</button>
        </div>
      </form>
      {mats.length ? <MaterialRail materials={mats} /> : null}

      {!q ? null : works.length === 0 && makers.length === 0 ? (
        <EmptyState title={`Nothing found for “${q}”`}>
          Try a maker&rsquo;s name, or a material such as clay or brass.
        </EmptyState>
      ) : (
        <>
          {makers.length ? (
            <div className="section">
              <h2 className="lead">Makers</h2>
              <ul className="rowlist flush">
                {makers.map((m) => (
                  <li key={m.id}>
                    <Link className="grow plain" href={`/m/${m.handle}`}>
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
              <h2 className="lead">{works.length} {works.length === 1 ? "work" : "works"}</h2>
              <div className="grid flush">
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
