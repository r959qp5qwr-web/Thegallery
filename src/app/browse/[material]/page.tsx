import { notFound } from "next/navigation";
import { listWorksByMaterial, imagesFor, materials, type PublicImage } from "@/lib/queries";
import { Header, WorkTile, MaterialRail, Footer } from "@/components/Chrome";

export const dynamic = "force-dynamic";

export default async function Browse({ params }: { params: Promise<{ material: string }> }) {
  const { material } = await params;
  const mats = await materials();
  const found = mats.find((m) => m.key === material);
  if (!found) notFound();

  const works = await listWorksByMaterial(material);
  const images = await imagesFor(works.map((w) => w.id));
  const byWork = new Map<string, PublicImage>();
  for (const i of images) if (!byWork.has(i.work_id)) byWork.set(i.work_id, i);

  return (
    <>
      <Header place={found.label} />
      <MaterialRail materials={mats} active={material} />
      <div className="context"><span>{found.label}</span><span>{works.length} on view</span></div>
      {works.length ? (
        <div className="grid">
          {works.map((w) => <WorkTile key={w.id} work={w} image={byWork.get(w.id)} />)}
        </div>
      ) : (
        <div className="empty">
          <h2>Nothing in {found.label.toLowerCase()} yet</h2>
          <p>No work in this material is on view. Other materials may have work waiting.</p>
        </div>
      )}
      <Footer />
    </>
  );
}
