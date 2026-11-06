import Link from "next/link";
import { redirect } from "next/navigation";
import { currentAccount } from "@/lib/auth";
import { studioContext } from "@/lib/queries";
import { StudioHeader, Band } from "@/components/Chrome";
import { StatusChip } from "@/components/StatusChip";
import { publishGalleryAction, changeStatusAction } from "@/app/actions/studio";
import { SheetFocus } from "@/components/SheetFocus";
import { Icon } from "@/components/Icon";
import { STATUS_LABEL, STATUS_ORDER } from "@/lib/format";

// The five statuses in the maker's own order (J-003 picker), named as every page names them.
const STATUSES: readonly string[] = STATUS_ORDER;

export const dynamic = "force-dynamic";
export const metadata = { title: "Studio" };

export default async function Studio({ searchParams }: {
  searchParams: Promise<{ saved?: string; status?: string; changed?: string; from?: string; unchanged?: string; restored_status?: string }> }) {
  const account = await currentAccount();
  if (!account) redirect("/makers/sign-in?next=/studio");
  const { saved, status: picking, changed, from, unchanged, restored_status } = await searchParams;
  const { maker, gallery, works, routes } = await studioContext(account.id);

  // A suspended maker is not signed out and not left guessing: the Studio states the
  // suspension, gives the reason and names the way to reply (GAL-OD-15).
  if (maker?.status === "suspended") {
    return (
      <>
        <StudioHeader title="Studio" />
      <main id="main" tabIndex={-1}>
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
      </main>
      </>
    );
  }

  if (!maker) {
    return (
      <>
        <StudioHeader title="Studio" />
      <main id="main" tabIndex={-1}>
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
      </main>
      </>
    );
  }

  const published = works.filter((w) => w.lifecycle === "published");
  return (
    <>
      <StudioHeader title="Studio" />
      <main id="main" tabIndex={-1}>
      {saved === "profile" ? <Band label="Saved">Your details are saved.</Band> : null}
      <div className="studio-state">
        <h1>{maker.display_name}</h1>
        <p className="small">
          {gallery?.lifecycle === "published"
            ? <>Your gallery is on view at <Link href={`/m/${maker.handle}`}>/m/{maker.handle}</Link>.</>
            : "Your gallery is a draft. Publishing your first work opens it."}
        </p>
      </div>

      {/* GAL-PR-01: Contact is not advertised until a way to contact exists, and the Studio shows the task. */}
      {!routes.some((r) => r.enabled && r.validated) ? (
        <Band label="No way to contact you yet">
          Your work is shown without a Contact button until you add a way to be contacted.{" "}
          <Link href="/studio/contact-routes">Add a way to contact you</Link>
        </Band>
      ) : null}

      {gallery && gallery.lifecycle !== "published" && published.length > 0 ? (
        <form action={publishGalleryAction} className="inline-actions">
          <input type="hidden" name="gallery_id" value={gallery.id} />
          <button className="btn" type="submit">Open my gallery</button>
        </form>
      ) : null}

      <div className="section">
        <div className="lead">Works</div>
        {works.length ? (
          <ul className="rowlist works" style={{ padding: 0 }}>
            {works.map((w) => (
              <li key={w.id}>
                {/* The maker's own work, seen: its cover beside its title (design review). */}
                <Link className="thumb" href={`/studio/works/${w.id}`} tabIndex={-1} aria-hidden>
                  {w.cover ? <img src={`/img/${w.cover}/w320`} alt="" /> : null}
                </Link>
                <Link className="grow" href={`/studio/works/${w.id}`} style={{ textDecoration: "none" }}>
                  <span className="primary">{w.title}</span>
                  <span className="secondary">
                    {/* Status is the chip's to say; the row's second line carries the material. */}
                    {w.material}
                  </span>
                </Link>
                {/* J-003: on a published work the chip is the status control — a button whose name
                    carries the value, opening the picker. A draft or retired work has no status yet. */}
                {w.lifecycle === "published" && !w.taken_down ? (
                  // A real button (Space and Enter both work), in a GET form so it opens the picker
                  // without script too. A pending Undo travels with it.
                  <form method="get" action="/studio" className="chip-form">
                    <input type="hidden" name="status" value={w.id} />
                    {changed && from ? <><input type="hidden" name="changed" value={changed} /><input type="hidden" name="from" value={from} /></> : null}
                    <button className={`chip ${w.status === "sold" ? "" : "available"}`} id={`chip-${w.id}`} type="submit"
                            aria-label={`Status: ${STATUS_LABEL[w.status] ?? w.status}. Change status of ${w.title}`}>
                      {STATUS_LABEL[w.status] ?? w.status}
                    </button>
                  </form>
                ) : <StatusChip lifecycle={w.lifecycle} status={w.status} />}
                {changed === w.id && from && STATUSES.includes(from) ? (
                  <form action={changeStatusAction} className="undo-line" role="status">
                    <span>Marked as {STATUS_LABEL[w.status]}</span>
                    <input type="hidden" name="work_id" value={w.id} />
                    <input type="hidden" name="status" value={from} />
                    <input type="hidden" name="undo" value="1" />
                    <button className="btn quiet" type="submit"><span>Undo</span></button>
                  </form>
                ) : null}
                {restored_status === w.id ? (
                  <p className="undo-line" role="status">Status put back to {STATUS_LABEL[w.status]}.</p>
                ) : null}
                {unchanged === w.id ? (
                  <p className="undo-line" role="status">That did not go through; the status is as it was.</p>
                ) : null}
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

      {(() => {
        const w = picking ? works.find((x) => x.id === picking && x.lifecycle === "published") : undefined;
        if (!w) return null;
        const close = changed && from ? `/studio?changed=${changed}&from=${encodeURIComponent(from)}` : "/studio";
        return (
          <>
            <Link className="contact-scrim" href={close} aria-hidden tabIndex={-1} scroll={false} />
            <section className="sheet contact" role="dialog" aria-modal="true" tabIndex={-1}
                     aria-labelledby="status-title" id="status-sheet">
              <SheetFocus sheetId="status-sheet" closeHref={close} returnFocusTo={`chip-${w.id}`} />
              <div className="handle" />
              <div className="head">
                <h2 id="status-title">{w.title} is</h2>
                <Link className="iconbtn" href={close} aria-label="Close" data-autofocus scroll={false}><Icon name="close" /></Link>
              </div>
              <ul className="choice">
                {STATUSES.map((st) => (
                  <li key={st}>
                    <form action={changeStatusAction} style={{ width: "100%" }}>
                      <input type="hidden" name="work_id" value={w.id} />
                      <input type="hidden" name="status" value={st} />
                      <input type="hidden" name="from" value={w.status} />
                      <button type="submit" aria-current={st === w.status ? "true" : undefined}>
                        {STATUS_LABEL[st]}{st === w.status ? <Icon name="check" /> : null}
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
              <p className="disclosure">Every page that shows this work reads this one setting, so a change
                shows everywhere at once.</p>
            </section>
          </>
        );
      })()}
      <div className="actions secondary">
        <Link className="btn quiet" href="/studio/profile"><span>Your details</span></Link>
        <Link className="btn quiet" href="/studio/contact-routes"><span>Ways to contact you</span></Link>
        <Link className="btn quiet" href="/studio/account"><span>Account</span></Link>
      </div>
      </main>
    </>
  );
}
