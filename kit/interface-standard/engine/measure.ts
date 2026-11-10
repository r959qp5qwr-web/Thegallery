// Interface Standard — the measuring engine (portable; no product code).
//
// Runs inside the page (Playwright `page.evaluate`). Measures what renders, by computed style and
// box geometry, against the numeric rules in STANDARD.json, for the screen's declared archetype.
// It never reads source code and never judges taste: every finding is a number against a sourced
// threshold. What cannot be measured is listed in STANDARD.json under "manual" and stays a review.
//
// Vocabulary the product marks up (see README.md, "Adopting"):
//   - the screen's archetype comes from the product profile, not from the DOM;
//   - a Back / Close / Cancel control is a link or button whose accessible name matches
//     standard.nav.back_names, in the top band of the viewport;
//   - the primary action is any element matching profile.primary_selector.

export type Rule = { id: string; says: string; source: string[]; check: Record<string, any> & { kind: string } };
export type Standard = { version: string; rules: Rule[]; archetypes: Record<string, { root: boolean; says: string }> };
export type Profile = { primary_selector: string; ignore_selector?: string; field_selector?: string; help_selector?: string };
export type Finding = { rule: string; says: string; measured: string; where: string };

export function measure(args: { standard: Standard; archetype: string; profile: Profile }): Finding[] {
  const { standard, archetype, profile } = args;
  const out: Finding[] = [];
  const arche = standard.archetypes[archetype];
  if (!arche) return [{ rule: "ENGINE", says: "every screen declares a known archetype", measured: `unknown archetype "${archetype}"`, where: location.pathname }];

  const ignore = (e: Element) => !!(profile.ignore_selector && e.closest(profile.ignore_selector));
  const seen = (e: Element): boolean => {
    if (ignore(e)) return false;
    const r = e.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return false; // visually hidden (clip / 1px) is not on screen
    for (let n: Element | null = e; n; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.display === "none" || cs.visibility === "hidden" || cs.opacity === "0") return false;
      if (n.tagName === "DETAILS" && !(n as HTMLDetailsElement).open && n !== e && !e.closest("summary")) return false;
    }
    return true;
  };
  const ownText = (e: Element) => Array.from(e.childNodes).filter((n) => n.nodeType === 3).map((n) => n.textContent ?? "").join(" ").replace(/\s+/g, " ").trim();
  const desc = (e: Element) => {
    const t = (e.getAttribute("aria-label") || ownText(e) || e.textContent || "").replace(/\s+/g, " ").trim().slice(0, 40);
    const cls = typeof (e as HTMLElement).className === "string" && (e as HTMLElement).className ? `.${(e as HTMLElement).className.trim().split(/\s+/).slice(0, 2).join(".")}` : "";
    return `<${e.tagName.toLowerCase()}${cls}> "${t}"`;
  };
  const px = (v: string) => parseFloat(v) || 0;
  const add = (r: Rule, measured: string, where: string) => out.push({ rule: r.id, says: r.says, measured, where });
  const textEls = Array.from(document.body.querySelectorAll("*")).filter((e) => !["SCRIPT", "STYLE", "SVG", "PATH", "USE"].includes(e.tagName) && /[A-Za-z0-9]/.test(ownText(e)) && seen(e));
  const roleOf = (e: Element): string => {
    if (e.closest("label, legend")) return "label";
    if (profile.help_selector && e.closest(profile.help_selector)) return "help";
    if (e.closest("button, a[href], summary, [role=button], input, select, textarea")) return "control";
    if (e.closest("h1, h2, h3, h4, h5, h6")) return "heading";
    if (e.closest("p, li, dd, blockquote")) return "body";
    return "other";
  };

  for (const rule of standard.rules) {
    const c = rule.check;
    if (c.archetypes && !c.archetypes.includes(archetype)) continue;
    switch (c.kind) {
      // ---- type
      case "text-floor": {
        // Smallest font size for text of a role (or any role), at this viewport width.
        const min = window.innerWidth < 600 ? c.phone_px : (c.wide_px ?? c.phone_px);
        const roles: string[] | undefined = c.roles;
        const bad = textEls.filter((e) => (!roles || roles.includes(roleOf(e))) && px(getComputedStyle(e).fontSize) < min - 0.01);
        for (const e of bad.slice(0, 6)) add(rule, `${px(getComputedStyle(e).fontSize)} px < ${min} px`, desc(e));
        if (bad.length > 6) add(rule, `${bad.length - 6} more below ${min} px`, "");
        break;
      }
      case "line-height": {
        const bad = textEls.filter((e) => roleOf(e) === "body" && ownText(e).length > 60).filter((e) => {
          const cs = getComputedStyle(e); const lh = cs.lineHeight === "normal" ? 1.2 * px(cs.fontSize) : px(cs.lineHeight);
          return lh / px(cs.fontSize) < c.min_ratio - 0.001;
        });
        for (const e of bad.slice(0, 4)) { const cs = getComputedStyle(e); add(rule, `line height ${(px(cs.lineHeight) / px(cs.fontSize)).toFixed(2)} < ${c.min_ratio}`, desc(e)); }
        break;
      }
      case "measure": {
        // Characters per line of running text: box width / average glyph width (0.5 em is the
        // conventional estimate for Latin text; see STANDARD.json source).
        for (const e of textEls.filter((e) => roleOf(e) === "body" && ownText(e).length > 2 * c.max_chars)) {
          const cs = getComputedStyle(e); const chars = Math.round(e.getBoundingClientRect().width / (0.5 * px(cs.fontSize)));
          if (chars > c.max_chars) { add(rule, `~${chars} characters per line > ${c.max_chars}`, desc(e)); break; }
        }
        break;
      }
      // ---- touch
      case "target-size": {
        // Controls that are not links inside a sentence (WCAG 2.5.8 inline exception).
        const ctrls = Array.from(document.querySelectorAll("a[href], button, input:not([type=hidden]), select, textarea, summary, [role=button], label[for]")).filter(seen);
        for (const e of ctrls) {
          const cs = getComputedStyle(e); const r = e.getBoundingClientRect();
          if (cs.display === "inline" && e.closest("p, li, dd")) continue;
          if ((e as HTMLInputElement).type === "radio" || (e as HTMLInputElement).type === "checkbox") {
            const lab = e.closest("label") ?? (e.id ? document.querySelector(`label[for="${e.id}"]`) : null);
            if (lab && seen(lab)) { const lr = lab.getBoundingClientRect(); if (Math.min(lr.width, lr.height) >= c.min_px) continue; }
          }
          if (Math.min(r.width, r.height) < c.min_px - 0.5) add(rule, `${Math.round(r.width)}×${Math.round(r.height)} px < ${c.min_px}×${c.min_px}`, desc(e));
        }
        break;
      }
      // ---- navigation
      case "has-back": {
        if (arche.root) break;
        const band = c.top_band_px as number; const names = new RegExp(c.names, "i");
        const back = Array.from(document.querySelectorAll("a[href], button")).some((e) => seen(e) && e.getBoundingClientRect().top < band &&
          names.test((e.getAttribute("aria-label") || e.textContent || "").trim()));
        if (!back) add(rule, `no visible ${c.names.replace(/[\^$()]/g, "")} control in the top ${band} px`, `archetype ${archetype}`);
        break;
      }
      case "primary-count": {
        const n = Array.from(document.querySelectorAll(profile.primary_selector)).filter(seen).length;
        if (n > c.max) add(rule, `${n} primary actions visible > ${c.max}`, "");
        if (c.min && n < c.min) add(rule, `${n} primary actions visible < ${c.min}`, "");
        break;
      }
      // ---- forms
      case "form-rhythm": {
        const fields = Array.from(document.querySelectorAll(profile.field_selector ?? ".field, fieldset")).filter(seen);
        fields.forEach((f, i) => {
          const lab = f.querySelector("label, legend"); const inp = f.querySelector("input:not([type=radio]):not([type=checkbox]):not([type=hidden]), textarea, select");
          const help = profile.help_selector ? f.querySelector(profile.help_selector) : null;
          if (lab && inp && seen(inp)) {
            const g = inp.getBoundingClientRect().top - lab.getBoundingClientRect().bottom;
            if (g < c.label_to_input_min_px) add(rule, `label to input ${Math.round(g)} px < ${c.label_to_input_min_px}`, desc(lab));
            const h = inp.getBoundingClientRect().height;
            if (inp.tagName === "INPUT" && h < c.input_min_height_px) add(rule, `input ${Math.round(h)} px tall < ${c.input_min_height_px}`, desc(lab));
          }
          if (help && inp && seen(help) && seen(inp) && help.getBoundingClientRect().top > inp.getBoundingClientRect().top) {
            const g = help.getBoundingClientRect().top - inp.getBoundingClientRect().bottom;
            if (g < c.input_to_help_min_px) add(rule, `input to help text ${Math.round(g)} px < ${c.input_to_help_min_px}`, desc(help));
          }
          if (i > 0) {
            const g = f.getBoundingClientRect().top - fields[i - 1].getBoundingClientRect().bottom;
            if (g < c.field_gap_min_px) add(rule, `gap between fields ${Math.round(g)} px < ${c.field_gap_min_px}`, desc(lab ?? f));
          }
        });
        break;
      }
      // ---- layout
      case "side-margin": {
        if (window.innerWidth >= 600) break;
        for (const e of textEls.filter((e) => ["body", "heading", "label", "help"].includes(roleOf(e)))) {
          const r = e.getBoundingClientRect(); const l = r.left, rt = window.innerWidth - r.right;
          if (l < c.min_px - 0.5 || rt < c.min_px - 0.5) { add(rule, `text ${Math.round(Math.min(l, rt))} px from the screen edge < ${c.min_px}`, desc(e)); break; }
        }
        break;
      }
      case "no-overflow-x": {
        const d = document.documentElement;
        if (d.scrollWidth > d.clientWidth + 1) add(rule, `scrollWidth ${d.scrollWidth} > ${d.clientWidth}`, "");
        break;
      }
      case "spacing-scale": {
        // Margins and gaps between blocks are multiples of the base unit (4 px grid).
        const unit = c.unit_px as number; const seenVals = new Map<number, string>();
        for (const e of Array.from(document.querySelectorAll("main *")).filter(seen)) {
          const cs = getComputedStyle(e);
          for (const v of [cs.marginTop, cs.marginBottom, cs.rowGap, cs.paddingTop, cs.paddingBottom].map(px)) {
            if (v > 0 && Math.abs(v / unit - Math.round(v / unit)) > 0.01 && !seenVals.has(v)) seenVals.set(v, desc(e));
          }
        }
        for (const [v, w] of Array.from(seenVals).slice(0, 5)) add(rule, `${v} px is off the ${unit} px grid`, w);
        break;
      }
      case "axe": break; // run by the spec with axe-core (tags in c.tags); listed here so the rule is known
      default: add(rule, `unknown check kind ${c.kind}: the engine cannot apply this rule`, "");
    }
  }
  return out;
}
