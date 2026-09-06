import { notFound } from "next/navigation";
import { listWorksByMaterial, imagesFor, materials, type PublicImage } from "@/lib/queries";
import { Header, WorkTile, MaterialRail, Footer, EmptyPlinth, Action, orientation } from "@/components/Chrome";

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

  // The next material with something on view, so an empty room still has a door out of it.
  const next = mats.find((m) => m.key !== material);

  return (
    <>
      <Header place={found.label} />
      <MaterialRail materials={mats} active={material} />
      <div className="context">
        <span>{found.label}</span>
        <span className="accent">{works.length ? `${works.length} on view` : "Nothing on view"}</span>
      </div>
      {works.length ? (
        <div className="grid" style={{ paddingTop: 4 }}>
          {works.map((w) => (
            <WorkTile key={w.id} work={w} image={byWork.get(w.id)}
                      wide={orientation(byWork.get(w.id)) === "landscape"} />
          ))}
        </div>
      ) : (
        <EmptyPlinth material={material as "clay" | "textile" | "wood" | "metal" | "paper"}
                     title={`Nothing in ${found.label.toLowerCase()} yet`}
                     action={next ? <Action href={`/browse/${next.key}`}>See {next.label.toLowerCase()}</Action> : undefined}>
          No work in this material is on view. The room is ready for it.
        </EmptyPlinth>
      )}
      <Footer />
    </>
  );
}
