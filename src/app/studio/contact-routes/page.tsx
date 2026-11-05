import { redirect } from "next/navigation";
import { currentAccount } from "@/lib/auth";
import { studioContext } from "@/lib/queries";
import { StudioHeader, Band } from "@/components/Chrome";
import { ActionForm, Field } from "@/components/ActionForm";
import { saveRouteAction, toggleRouteAction, deleteRouteAction } from "@/app/actions/studio";
import { ROUTE_LABEL, routeDisplay } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ContactRoutes() {
  const account = await currentAccount();
  if (!account) redirect("/makers/sign-in?next=/studio/contact-routes");
  const { maker, routes } = await studioContext(account.id);
  if (!maker) redirect("/studio/profile");

  const live = routes.filter((r) => r.enabled && r.validated);

  return (
    <>
      <StudioHeader title="Contact routes" back="/studio" />
      <div className="studio-state">
        <h1>How people reach you</h1>
        <p className="small" style={{ marginTop: 6 }}>
          These are public. Your sign-in email ({account.email}) is not one of them and never becomes one —
          if you want people to email you, add that address here as its own route.
        </p>
      </div>

      {live.length === 0 ? (
        <Band label="No route yet">
          Until you add one, your gallery shows your work but offers no way to contact you. You can publish
          without a route and add one later.
        </Band>
      ) : null}

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
              <form action={toggleRouteAction}>
                <input type="hidden" name="id" value={r.id} />
                <button className="btn quiet" type="submit"><span>{r.enabled ? "Turn off" : "Turn on"}</span></button>
              </form>
              <form action={deleteRouteAction}>
                <input type="hidden" name="id" value={r.id} />
                <button className="btn quiet" type="submit"><span>Remove</span></button>
              </form>
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
          <select id="kind" name="kind" defaultValue="whatsapp">
            <option value="whatsapp">WhatsApp</option>
            <option value="email">Public email</option>
            <option value="phone">Phone</option>
            <option value="website">Website</option>
            <option value="form">Enquiry form on your own site</option>
          </select>
        </div>
        <Field name="value" label="The route" required
               help="WhatsApp and phone in full international form, starting with + and the country code. Website and form as a full https:// address." />
        <Field name="label" label="Label (optional)" placeholder="Studio enquiries" />
      </ActionForm>
    </>
  );
}
