import { redirect } from "next/navigation";
import { currentAccount } from "@/lib/auth";
import { studioContext } from "@/lib/queries";
import { StudioHeader, Band } from "@/components/Chrome";
import { ActionForm, Field, KeptSelect } from "@/components/ActionForm";
import { saveRouteAction, toggleRouteAction, deleteRouteAction } from "@/app/actions/studio";
import { ROUTE_LABEL, routeDisplay } from "@/lib/format";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "Contact routes" };

export default async function ContactRoutes({ searchParams }: { searchParams: Promise<{ remove?: string; removed?: string }> }) {
  const { remove, removed } = await searchParams;
  const account = await currentAccount();
  if (!account) redirect("/makers/sign-in?next=/studio/contact-routes");
  const { maker, routes } = await studioContext(account.id);
  if (!maker) redirect("/studio/profile");

  const live = routes.filter((r) => r.enabled && r.validated);

  return (
    <>
      <StudioHeader title="Contact routes" back="/studio" />
      <main id="main" tabIndex={-1}>
      <div className="studio-state">
        <h1>How people reach you</h1>
        <p className="small" style={{ marginTop: 6 }}>
          These are public. Your sign-in email ({account.email}) is not one of them and never becomes one —
          if you want people to email you, add that address here as its own route.
        </p>
      </div>

      {live.length === 0 ? (
        <Band label="No route yet">
          Until you add one, your work is shown with &ldquo;not taking enquiries here yet&rdquo; and no
          Contact button. You can publish without a route and add one later.
        </Band>
      ) : null}

      {removed ? <Band label="Removed">The route is removed. Visitors no longer see it.</Band> : null}
      {routes.length ? (
        <ul className="rowlist">
          {routes.map((r) => (
            <li key={r.id}>
              <span className="grow">
                <span className="primary">{ROUTE_LABEL[r.kind]}</span>
                <span className="secondary">
                  {routeDisplay(r, maker.display_name)}{r.enabled ? "" : " · switched off"}
                </span>
              </span>
              {/* Each control names its route, so a screen reader does not hear "Remove" three times. */}
              <form action={toggleRouteAction}>
                <input type="hidden" name="id" value={r.id} />
                <button className="btn quiet" type="submit" aria-label={`${r.enabled ? "Turn off" : "Turn on"} ${ROUTE_LABEL[r.kind]} route`}>
                  <span>{r.enabled ? "Turn off" : "Turn on"}</span></button>
              </form>
              {remove === r.id ? (
                <form action={deleteRouteAction} className="inline-confirm" role="group"
                      aria-labelledby={`remove-${r.id}`}>
                  <input type="hidden" name="id" value={r.id} />
                  <p className="small" id={`remove-${r.id}`} style={{ margin: "0 0 8px" }}>
                    {live.length === 1 && r.enabled && r.validated
                      ? "This is your only live route. Removing it takes the Contact button off every work until you add another. This cannot be undone."
                      : "Visitors will no longer see this route. This cannot be undone; you can turn it off instead and keep it."}
                  </p>
                  <button className="btn alarm" type="submit">Remove {ROUTE_LABEL[r.kind]}</button>
                  <Link className="btn quiet" href="/studio/contact-routes"><span>Keep</span></Link>
                </form>
              ) : (
                <Link className="btn quiet" href={`/studio/contact-routes?remove=${r.id}`}
                      aria-label={`Remove ${ROUTE_LABEL[r.kind]} route`}><span>Remove…</span></Link>
              )}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="group" style={{ margin: "28px var(--pad-x-studio) 0" }}>
        <div className="ghead">Add a route</div>
      </div>
      <ActionForm action={saveRouteAction} submitLabel="Add route" busyLabel="Adding…">
        <div className="field">
          <label htmlFor="kind">Kind</label>
          <KeptSelect name="kind" defaultValue="whatsapp">
            <option value="whatsapp">WhatsApp</option>
            <option value="email">Public email</option>
            <option value="phone">Phone</option>
            <option value="website">Website</option>
            <option value="form">Enquiry form on your own site</option>
          </KeptSelect>
        </div>
        <Field name="value" label="The route" required
               help="WhatsApp and phone in full international form, starting with + and the country code. Website and form as a full https:// address." />
        <Field name="label" label="Label (optional)" help="For example “Studio enquiries”." />
      </ActionForm>
      </main>
    </>
  );
}
