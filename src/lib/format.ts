// Presentation helpers. Behaviour never keys on display copy (DOMAIN_MODEL §5): these turn
// stored tokens into the words the accepted interface uses, and nothing reads them back.

export const STATUS_LABEL: Record<string, string> = {
  available: "Available", made_to_order: "Made to order", enquire: "By enquiry",
  sold: "Sold", on_view: "Not for sale",
};

/** The order every status picker lists them in. Pickers read their words from STATUS_LABEL, so
 *  a status is named one way wherever it appears (design review R3: "Enquire" read as a button
 *  and "On view" already means published; the stored tokens are unchanged). */
export const STATUS_ORDER = ["available", "made_to_order", "enquire", "on_view", "sold"] as const;

export const KIND_LABEL: Record<string, string> = {
  individual: "Maker", studio: "Studio", collective: "Collective",
};

export function price(mode: string, amount: string | number | null, currency = "INR"): string | null {
  if (mode !== "exact" || amount === null) return mode === "made_to_order" ? "Made to order" : "Price on enquiry";
  const n = typeof amount === "string" ? Number(amount) : amount;
  if (!Number.isFinite(n)) return null;
  const symbol = currency === "INR" ? "₹" : `${currency} `;
  return `${symbol}${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

/** The price a visitor reads beside a work's status, or null for none. One rule for every public
 *  surface, keyed on the stored tokens (governor, 2026-11-07, decision 1):
 *  - "Sold" and "Not for sale" (stored `on_view`) carry no price: there is nothing to buy, and a
 *    figure beside them reads as an offer the maker is not making.
 *  - A price never repeats its status: "By enquiry" is not followed by "Price on enquiry", nor
 *    "Made to order" by "Made to order".
 *  With `exactOnly` (a wall tile, the entrance) only a stated amount is shown. */
export function labelPrice(work: { status: string; price_mode: string; price_amount: string | number | null; price_currency?: string },
                           opts: { exactOnly?: boolean } = {}): string | null {
  if (work.status === "sold" || work.status === "on_view") return null;
  if (work.price_mode === "exact") return price(work.price_mode, work.price_amount, work.price_currency);
  if (opts.exactOnly) return null;
  if (work.price_mode === work.status) return null;   // enquire/enquire, made_to_order/made_to_order
  return price(work.price_mode, null);
}

export function dimensions(h: number | null, w: number | null, d: number | null): string | null {
  const parts = [h, w, d].filter((v): v is number => typeof v === "number" && v > 0);
  if (!parts.length) return null;
  const cm = (mm: number) => (mm / 10).toLocaleString("en-IN", { maximumFractionDigits: 1 });
  const names = ["h", "w", "d"];
  return [h, w, d].map((v, i) => (v ? `${cm(v)} cm ${names[i]}` : null)).filter(Boolean).join(" · ");
}

/** A status the maker has not touched for 90 days is labelled unconfirmed, not hidden
 *  (DOMAIN_MODEL §2.3). Truthfulness here is promise P-11. */
export function statusIsStale(confirmedAt: string | Date | null): boolean {
  if (!confirmedAt) return false;
  const t = new Date(confirmedAt).getTime();
  return Date.now() - t > 90 * 86_400_000;
}

/** How long ago the maker last stated a status, in words a wall label would use: "today",
 *  "yesterday", "3 days ago", "2 weeks ago", "4 months ago", "over a year ago". Days are whole
 *  days elapsed; weeks and months are rounded to the nearest, so 89 days reads "3 months ago"
 *  rather than understating the age. Computed on the server, at request time. */
export function confirmedAgo(confirmedAt: string | Date | null, now: number = Date.now()): string | null {
  if (!confirmedAt) return null;
  const days = Math.floor((now - new Date(confirmedAt).getTime()) / 86_400_000);
  if (!Number.isFinite(days)) return null;
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 14) return `${days} days ago`;
  if (days < 45) return `${Math.round(days / 7)} weeks ago`;
  if (days < 365) return `${Math.max(2, Math.round(days / 30.44))} months ago`;
  return "over a year ago";
}

export type Route = { id: string; kind: string; value: string; label: string | null };

/** How the product addresses a maker in a short action. A person is called by their first
 *  name ("Contact Anika"); a studio or collective by its whole name, because its first word is
 *  rarely a name at all ("Contact The", "Message Studio"). */
export function shortName(displayName: string, kind?: string | null): string {
  return kind === "individual" ? displayName.split(" ")[0] : displayName;
}

/** What the visitor's message is about. Chosen on the contact sheet; carried into the text. */
export type Intent = "ask" | "commission" | "general";
export function parseIntent(v: string | undefined, sold: boolean): Intent {
  if (v === "ask" || v === "commission" || v === "general") return v;
  return sold ? "commission" : "ask";
}

/** A work as a message needs it: its title, its status as the visitor saw it, what the visitor
 *  wants, and the address that brings the maker back to it. The maker can answer from the
 *  message alone (design review R4). */
export type MessageWork = { title: string; url: string; intent: Intent; status?: string };

function messageText(work?: MessageWork): string {
  if (!work) return "Hello, I found your work on The Gallery.";
  const named = work.status ? `"${work.title}" (${work.status})` : `"${work.title}"`;
  const about = work.intent === "commission"
    ? `I saw ${named} on The Gallery and would like to ask about commissioning something like it.`
    : work.intent === "general"
    ? `I found your work on The Gallery while looking at ${named}.`
    : `I saw ${named} on The Gallery and would like to ask about it.`;
  return `Hello, ${about} ${work.url}`;
}

/**
 * Turn a maker's route into the link the visitor opens. The Gallery hands the visitor over
 * and stops: there is no in-product message, no relay and no record of what follows
 * (GAL-OD-06, GAL-R04).
 */
export function routeHref(route: Route, work?: MessageWork): string {
  // The message stands on its own: the maker reads the work's title, what the visitor wants
  // and the link back to the work, without needing any other context.
  const subject = !work ? "Enquiry from The Gallery"
    : work.intent === "commission" ? `Commission enquiry: "${work.title}" on The Gallery`
    : `About "${work.title}" on The Gallery`;
  const text = messageText(work);
  switch (route.kind) {
    case "whatsapp": {
      const digits = route.value.replace(/[^\d]/g, "");
      return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
    }
    case "email":
      return `mailto:${route.value}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
    case "phone": return `tel:${route.value.replace(/[^\d+]/g, "")}`;
    case "website":
    case "form": return route.value.startsWith("http") ? route.value : `https://${route.value}`;
    default: return "#";
  }
}

export const ROUTE_LABEL: Record<string, string> = {
  whatsapp: "WhatsApp", email: "Email", phone: "Phone", website: "Website", form: "Form",
};

/** What the visitor sees for a route before they open it. A phone number is shown; a
 *  WhatsApp route is described rather than printed, matching the accepted handoff sheet. */
export function routeDisplay(route: Route, makerName: string, aboutWork?: boolean, makerKind?: string | null): string {
  if (route.kind === "whatsapp") {
    const who = shortName(makerName, makerKind);
    return aboutWork ? `Message ${who} about this work` : `Message ${who}`;
  }
  if (route.kind === "form") return route.label ?? "Enquiry form";
  return route.value.replace(/^https?:\/\//, "");
}

export function validateRoute(kind: string, value: string): string | null {
  const v = value.trim();
  if (!v) return "Enter the number or address.";
  switch (kind) {
    case "whatsapp":
    case "phone":
      return /^\+[1-9]\d{7,14}$/.test(v.replace(/[\s-]/g, ""))
        ? null : "Use the full international form, starting with + and the country code.";
    case "email":
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? null : "That does not look like an email address.";
    case "website":
    case "form":
      return /^https?:\/\/[^\s]+\.[^\s]{2,}$/.test(v) ? null : "Use a full https:// address.";
    default: return "Choose a way to contact you.";
  }
}

/** An operator act as a person reads it. */
export const ACTION_LABEL: Record<string, string> = {
  suspend: "Suspended", reinstate: "Reinstated", take_down: "Taken down", restore: "Restored",
  dismiss_report: "Report dismissed", close_report: "Report closed", vocabulary_change: "Vocabulary changed",
};

/** A date that reads the same to everyone: "6 Nov 2026, 4:45 pm", never "6/11/2026", which half
 *  the world reads as June. Shown in India time, where the product and its operator work. */
export function recordedAt(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
  const time = d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" });
  return `${date}, ${time.toLowerCase()}`;
}
