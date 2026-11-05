// Presentation helpers. Behaviour never keys on display copy (DOMAIN_MODEL §5): these turn
// stored tokens into the words the accepted interface uses, and nothing reads them back.

export const STATUS_LABEL: Record<string, string> = {
  available: "Available", made_to_order: "Made to order", enquire: "Enquire",
  sold: "Sold", on_view: "On view",
};

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

export type Route = { id: string; kind: string; value: string; label: string | null };

/**
 * Turn a maker's route into the link the visitor opens. The Gallery hands the visitor over
 * and stops: there is no in-product message, no relay and no record of what follows
 * (GAL-OD-06, GAL-R04).
 */
export function routeHref(route: Route, workTitle?: string): string {
  const subject = workTitle ? `About "${workTitle}" on The Gallery` : "Enquiry from The Gallery";
  switch (route.kind) {
    case "whatsapp": {
      const digits = route.value.replace(/[^\d]/g, "");
      const text = workTitle ? `Hello — I saw "${workTitle}" on The Gallery.` : "Hello — I found you on The Gallery.";
      return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
    }
    case "email": return `mailto:${route.value}?subject=${encodeURIComponent(subject)}`;
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
export function routeDisplay(route: Route, makerName: string, workTitle?: string): string {
  if (route.kind === "whatsapp") {
    return workTitle ? `Message ${makerName.split(" ")[0]} about this work` : `Message ${makerName.split(" ")[0]}`;
  }
  if (route.kind === "form") return route.label ?? "Enquiry form";
  return route.value.replace(/^https?:\/\//, "");
}

export function validateRoute(kind: string, value: string): string | null {
  const v = value.trim();
  if (!v) return "Enter the route, or leave it out.";
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
    default: return "Unknown route.";
  }
}
