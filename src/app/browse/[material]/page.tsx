import Link from "next/link";
import { notFound } from "next/navigation";
import { listWorksByMaterial, imagesFor, materials, materialsOnView, type PublicImage } from "@/lib/queries";
import { Header, WorkTile, MaterialRail, Footer, EmptyState, orientation } from "@/components/Chrome";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ material: string }> }) {
  const { material } = await params;
  const found = (await materials()).find((m) => m.key === material);
  return { title: found ? found.label : "Browse" };
}

export default async function Browse({ params }: { params: Promise<{ material: string }> }) {
  const { material } = await params;
  const [all, onView] = await Promise.all([materials(), materialsOnView()]);
  const found = all.find((m) => m.key === material);
  if (!found) notFound();

  const works = await listWorksByMaterial(material);
  const images = await imagesFor(works.map((w) => w.id));
  const byWork = new Map<string, PublicImage>();
  for (const i of images) if (!byWork.has(i.work_id)) byWork.set(i.work_id, i);

  // The rail offers only rooms with something in them, plus this one so the visitor sees where
  // they are. An empty room's way out goes to a material that has work, never to another empty
  // room (Wave 5: the old "next" was merely a different material, so two empty rooms pointed at
  // each other).
  const rail = all.filter((m) => m.key === material || onView.some((o) => o.key === m.key));
  const next = onView.find((m) => m.key !== material);

  return (
    <>
      <Header />
      <main id="main" tabIndex={-1}>
      <h1 className="sr-only">{found.label}</h1>
      {rail.length > 1 ? <MaterialRail materials={rail} active={material} /> : null}
      {works.length ? (
        <div className="grid browse-grid">
          {works.map((w) => (
            <WorkTile key={w.id} work={w} image={byWork.get(w.id)}
                      wide={orientation(byWork.get(w.id)) === "landscape"} />
          ))}
        </div>
      ) : (
        <EmptyState title={`No ${found.label.toLowerCase()} on view yet`}
                    routes={next
                      ? <Link className="textlink" href={`/browse/${next.key}`} data-testid="next-material">See {next.label.toLowerCase()}</Link>
                      : <Link className="textlink" href="/about">What The Gallery is</Link>}>
          {next ? "Work in other materials is on view." : "The first makers are setting up their rooms."}
        </EmptyState>
      )}
      </main>
      <Footer />
    </>
  );
}
