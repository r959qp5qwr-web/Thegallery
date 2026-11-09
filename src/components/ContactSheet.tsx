import Link from "next/link";
import { Icon } from "./Icon";
import { SheetFocus } from "./SheetFocus";
import { ROUTE_LABEL, routeHref, type MessageWork, type Route } from "@/lib/format";

const ROUTE_ICON: Record<string, string> = {
  whatsapp: "chat", email: "mail", phone: "phone", form: "form", website: "globe",
};

/**
 * Message the maker (drawing board, screen 2b): a sheet over the page, not a new page. A heading,
 * the handoff sentence, then one row per way to reach the maker.
 *
 * The drawing shows the sentence under the rows. It is placed above them here because GAL-C1 is
 * fixed in meaning: the visitor understands who arranges payment, delivery, returns and disputes
 * before any route is opened. Above the rows, a screen reader and a keyboard meet it first too.
 */
export function ContactSheet({ heading, closeHref, returnFocusTo, disclosure, routes, work }:
  { heading: string; closeHref: string; returnFocusTo: string; disclosure: React.ReactNode;
    routes: Route[]; work?: MessageWork }) {
  return (
    <>
      <Link className="contact-scrim" href={closeHref} aria-hidden tabIndex={-1} scroll={false} />
      <section className="sheet contact" role="dialog" aria-modal="true" tabIndex={-1}
               aria-labelledby="contact-title" id="contact">
        <SheetFocus sheetId="contact" closeHref={closeHref} returnFocusTo={returnFocusTo} />
        <div className="handle" />
        <div className="head">
          <h2 id="contact-title">{heading}</h2>
          <Link className="iconbtn" href={closeHref} aria-label="Close" scroll={false}><Icon name="close" /></Link>
        </div>
        <p className="disclosure" data-testid="disclosure">{disclosure}</p>
        <ul className="routes rows">
          {routes.map((r) => {
            const away = r.kind === "website" || r.kind === "form";
            return (
              <li key={r.id}>
                <a href={routeHref(r, work)} rel="noopener noreferrer" target={away ? "_blank" : undefined}
                   data-route-kind={r.kind}>
                  <Icon name={ROUTE_ICON[r.kind] ?? "globe"} />
                  <span className="kind">{r.kind === "form" && r.label ? r.label : ROUTE_LABEL[r.kind]}</span>
                  {away ? <span className="sr-only"> (opens in a new tab)</span> : null}
                  <Icon name="chevron" />
                </a>
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}
