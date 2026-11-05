import Link from "next/link";
import { redirect } from "next/navigation";
import { currentAccount } from "@/lib/auth";
import { studioContext } from "@/lib/queries";
import { StudioHeader, Band } from "@/components/Chrome";
import { StatusChip } from "@/components/StatusChip";
import { publishGalleryAction } from "@/app/actions/studio";
import { STATUS_LABEL } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Studio({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const account = await currentAccount();
  if (!account) redirect("/makers/sign-in?next=/studio");
  const { saved } = await searchParams;
  const { maker, gallery, works } = await studioContext(account.id);

  // A suspended maker is not signed out and not left guessing: the Studio states the
  // suspension, gives the reason and names the way to reply (GAL-OD-15).
  if (maker?.status === "suspended") {
    return (
      <>
        <StudioHeader title="Studio" />
        <Band kind="warn" label="Your gallery is suspended">
          {maker.status_reason ?? "An operator has suspended this gallery."} Your work is not shown publicly
          while this stands. Reply to the email you were sent and it will be looked at again.
        </Band>
        <div className="studio-state">
          <h1>{maker.display_name}</h1>
          <p className="small">The Studio is read-only until the suspension is lifted. Nothing has been
            deleted.</p>
        </div>
        <ul className="rowlist">
          {works.map((w) => (
            <li key={w.id}>
              <span className="grow"><span className="primary">{w.title}</span>
                <span className="secondary">{w.lifecycle}</span></span>
            </li>
          ))}
        </ul>
      </>
    );
  }

  if (!maker) {
    return (
      <>
        <StudioHeader title="Studio" />
        <div className="studio-state">
          <h1>Set up your gallery</h1>
          <p className="small" style={{ marginTop: 6 }}>Three steps, and you can publish in one sitting.</p>
        </div>
        <ol className="steps">
          <li><span className="num">1</span><span className="grow">Your name, how you work, your city</span>
            <Link className="textlink" href="/studio/profile">Start</Link></li>
          <li><span className="num">2</span><span className="grow done">Add a work with its images</span></li>
          <li><span className="num">3</span><span className="grow done">Publish</span></li>
        </ol>
        <div className="hint">A public way to be contacted is separate, and you can add it whenever you
          like — it is not needed to publish.</div>
      </>
    );
  }

  const published = works.filter((w) => w.lifecycle === "published");
  return (
    <>
      <StudioHeader title="Studio" />
      {saved === "profile" ? <Band label="Saved">Your identity is saved.</Band> : null}
      <div className="studio-state">
        <h1>{maker.display_name}</h1>
        <p className="small">
          {gallery?.lifecycle === "published"
            ? <>Your gallery is live at <Link href={`/m/${maker.handle}`}>/m/{maker.handle}</Link>.</>
            : "Your gallery is a draft. Publishing your first work opens it."}
        </p>
      </div>

      {gallery && gallery.lifecycle !== "published" && published.length > 0 ? (
        <form action={publishGalleryAction} className="inline-actions">
          <input type="hidden" name="gallery_id" value={gallery.id} />
          <button className="btn" type="submit">Open my gallery</button>
        </form>
      ) : null}

      <div className="section">
        <div className="lead">Works</div>
        {works.length ? (
          <ul className="rowlist" style={{ padding: 0 }}>
            {works.map((w) => (
              <li key={w.id}>
                <Link className="grow" href={`/studio/works/${w.id}`} style={{ textDecoration: "none" }}>
                  <span className="primary">{w.title}</span>
                  <span className="secondary">
                    {w.lifecycle === "published" ? STATUS_LABEL[w.status] : w.lifecycle} · {w.material}
                  </span>
                </Link>
                <StatusChip lifecycle={w.lifecycle} status={w.status} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="body">No works yet. The first one is the gallery.</p>
        )}
      </div>

      <div className="actions">
        <Link className="btn block" href="/studio/works/new">Add a work</Link>
      </div>
      <div className="actions secondary">
        <Link className="btn quiet" href="/studio/profile"><span>Identity</span></Link>
        <Link className="btn quiet" href="/studio/contact-routes"><span>Contact routes</span></Link>
        <Link className="btn quiet" href="/studio/account"><span>Account</span></Link>
      </div>
    </>
  );
}
