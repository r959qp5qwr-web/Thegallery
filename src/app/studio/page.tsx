import Link from "next/link";
import { redirect } from "next/navigation";
import { currentAccount } from "@/lib/auth";
import { studioContext } from "@/lib/queries";
import { StudioHeader, Band } from "@/components/Chrome";
import { StatusChip } from "@/components/StatusChip";
import { publishGalleryAction, changeStatusAction, reconfirmStatusAction } from "@/app/actions/studio";
import { SheetFocus } from "@/components/SheetFocus";
import { Icon } from "@/components/Icon";
import { STATUS_LABEL, STATUS_ORDER, confirmedAgo, statusIsStale } from "@/lib/format";
import { ShareButton } from "@/components/PageTools";

// The five statuses in the maker's own order (J-003 picker), named as every page names them.
const STATUSES: readonly string[] = STATUS_ORDER;

export const dynamic = "force-dynamic";
export const metadata = { title: "Studio" };

export default async function Studio({ searchParams }: {
  searchParams: Promise<{ saved?: string; joined?: string; status?: string; changed?: string; from?: string; unchanged?: string; restored_status?: string; confirmed?: string }> }) {
  const account = await currentAccount();
  if (!account) redirect("/makers/sign-in?next=/studio");
  const { saved, joined, status: picking, changed, from, unchanged, restored_status, confirmed } = await searchParams;
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

  // No gallery yet: joining carries on at step 2 (drawing board, screen 8).
  if (!maker) redirect("/studio/join");

  const published = works.filter((w) => w.lifecycle === "published");
  const open = gallery?.lifecycle === "published";
  const host = (process.env.GALLERY_BASE_URL ?? "").replace(/^https?:\/\//, "").replace(/\/$/, "");
  const reachable = routes.some((r) => r.enabled && r.validated);
  // The flag over each of the maker's own works: where it stands, in the gallery's own words.
  const flag = (w: (typeof works)[number]) =>
    w.taken_down ? "Taken down" : w.lifecycle === "published" ? "On view" : w.lifecycle === "retired" ? "Retired" : "Draft";

  return (
    <>
      <StudioHeader title="Studio" end={<>
        {open ? <ShareButton title={maker.display_name} path={`/m/${maker.handle}`} className="iconbtn" /> : null}
        <Link className="hdr-link" href="/studio/settings">Settings</Link>
      </>} />
      <main id="main" tabIndex={-1} className="studio-home">
      {saved === "profile" ? <Band label="Saved">Your details are saved.</Band> : null}
      {saved === "whatsapp" ? <Band label="Saved">Visitors can now message you on WhatsApp.</Band> : null}
      <div className="studio-head">
        <h1>{maker.display_name}</h1>
        <p className="addr">
          {open ? <Link href={`/m/${maker.handle}`}>{host}/m/{maker.handle}</Link>
                : <>{host}/m/{maker.handle}</>}
        </p>
      </div>

      {/* One missing step at a time, shown as one task until it is done (drawing board, screen 12).
          A gallery with work on view that is still a draft comes first: nothing is public until it opens.
          Then a way to be contacted — GAL-PR-01: Message is not offered until one exists. */}
      {gallery && !open && published.length > 0 ? (
        <form action={publishGalleryAction} className="task-form">
          <input type="hidden" name="gallery_id" value={gallery.id} />
          <button className="task" type="submit" data-testid="task">
            <span>Your gallery is still a draft. Open it</span><Icon name="chevron" />
          </button>
        </form>
      ) : !reachable ? (
        <Link className="task" href="/studio/whatsapp" data-testid="task">
          <span>Add WhatsApp so visitors can message you</span><Icon name="chevron" />
        </Link>
      ) : null}
      {joined && !works.length ? <p className="studio-note">Your gallery opens with your first work.</p> : null}

      <ul className="studio-wall" aria-label="Your works">
        <li className="add-cell">
          <Link className="add-work" href="/studio/works/new"><Icon name="plus" /><span>Add a work</span></Link>
        </li>
        {works.map((w) => (
          <li key={w.id}>
            <Link className="studio-tile" href={`/studio/works/${w.id}`}>
              <span className="frame r45">
                {w.cover ? <img src={`/img/${w.cover}/w640`} alt="" /> : <span className="notice">No image yet</span>}
              </span>
              <span className={`flag${w.lifecycle === "published" && !w.taken_down ? " available" : ""}`}>{flag(w)}</span>
              <span className="st-title">{w.title}</span>
            </Link>
            {/* J-003: on a published work the chip is the status control — a button whose name
                carries the value, opening the picker. A GET form, so it works without script. */}
            {w.lifecycle === "published" && !w.taken_down ? (
              <form method="get" action="/studio" className="chip-form">
                <input type="hidden" name="status" value={w.id} />
                {changed && from ? <><input type="hidden" name="changed" value={changed} /><input type="hidden" name="from" value={from} /></> : null}
                <button className={`chip ${w.status === "sold" ? "" : "available"}`} id={`chip-${w.id}`} type="submit"
                        aria-label={`Status: ${STATUS_LABEL[w.status] ?? w.status}. Change status of ${w.title}`}>
                  {STATUS_LABEL[w.status] ?? w.status}
                </button>
              </form>
            ) : null}
            {changed === w.id && from && STATUSES.includes(from) ? (
              <form action={changeStatusAction} className="undo-line" role="status">
                <span>Marked as {STATUS_LABEL[w.status]}</span>
                <input type="hidden" name="work_id" value={w.id} />
                <input type="hidden" name="status" value={from} />
                <input type="hidden" name="undo" value="1" />
                <button className="btn quiet" type="submit"><span>Undo</span></button>
              </form>
            ) : null}
            {/* J-003 reconfirmation: past 90 days the work asks, and one tap answers. */}
            {w.lifecycle === "published" && !w.taken_down && statusIsStale(w.status_confirmed_at) && confirmed !== w.id ? (
              <form action={reconfirmStatusAction} className="undo-line" data-testid="reconfirm">
                <span>Status last confirmed {confirmedAgo(w.status_confirmed_at)}</span>
                <input type="hidden" name="work_id" value={w.id} />
                <input type="hidden" name="expected" value={w.status} />
                <button className="btn quiet" type="submit"
                        aria-label={`Confirm ${w.title} is still ${STATUS_LABEL[w.status] ?? w.status}`}><span>Confirm</span></button>
              </form>
            ) : null}
            {confirmed === w.id ? (
              <p className="undo-line" role="status">Confirmed. Visitors now see {STATUS_LABEL[w.status]} as current.</p>
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
      </main>
    </>
  );
}
