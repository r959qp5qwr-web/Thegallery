// Interface Standard — the measuring engine (portable; no product code).
//
// Runs inside the page (Playwright `page.evaluate`). Measures what renders, by computed style and
// box geometry, against the numeric rules in STANDARD.json, for the screen's declared archetype.
// It never reads source code and never judges taste: every finding is a number against a sourced
// threshold. What cannot be measured is listed in STANDARD.json under "manual" and stays a review.
//
// Fail-closed by construction (independent review, 2026-11-10):
//   - "seen" means the browser reports it visible (checkVisibility, opacity included), it has a box
//     of at least 2 px, and no ancestor clips it away; a control that must be used (Back, the
//     primary action) must also be on screen and be what a tap at its centre reaches;
//   - the product's ignore_selector may hide only what is not on screen (a skip link until focused);
//     anything it hides that is on screen is itself a finding;
//   - a check that expects something (a primary action on an editor or a step, a field around every
//     input) reports its absence instead of passing silently.

export type Rule = { id: string; says: string; source: string[]; check: Record<string, any> & { kind: string } };
export type Standard = { version: string; rules: Rule[]; archetypes: Record<string, { root: boolean; says: string }> };
export type Profile = { primary_selector: string; ignore_selector?: string; field_selector?: string; help_selector?: string };
export type Finding = { rule: string; says: string; measured: string; where: string };

export function measure(args: { standard: Standard; archetype: string; profile: Profile }): Finding[] {
  const { standard, archetype, profile } = args;
  const out: Finding[] = [];
  const arche = standard.archetypes[archetype];
  if (!arche) return [{ rule: "ENGINE", says: "every screen declares a known archetype", measured: `unknown archetype "${archetype}"`, where: location.pathname }];

  const px = (v: string) => parseFloat(v) || 0;
  const ownText = (e: Element) => Array.from(e.childNodes).filter((n) => n.nodeType === 3).map((n) => n.textContent ?? "").join(" ").replace(/\s+/g, " ").trim();
  const words = (s: string) => s.split(/\s+/).filter((w) => /[A-Za-zÀ-ɏ]/.test(w)).length;
  const desc = (e: Element) => {
    const t = (e.getAttribute("aria-label") || ownText(e) || e.textContent || "").replace(/\s+/g, " ").trim().slice(0, 40);
    const cn = (e as HTMLElement).className;
    const cls = typeof cn === "string" && cn.trim() ? `.${cn.trim().split(/\s+/).slice(0, 2).join(".")}` : "";
    return `<${e.tagName.toLowerCase()}${cls}> "${t}"`;
  };
  const add = (id: string, says: string, measured: string, where: string) => out.push({ rule: id, says, measured, where });
  const addR = (r: Rule, measured: string, where: string) => add(r.id, r.says, measured, where);

  /** Visible to a person: rendered, not transparent, a real box, not clipped away by an ancestor. */
  const visible = (e: Element): boolean => {
    const h = e as HTMLElement;
    if (typeof h.checkVisibility === "function" && !h.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true } as any)) return false;
    const r = e.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return false;
    let alpha = 1;
    for (let n: Element | null = e; n && n !== document.documentElement; n = n.parentElement) {
      alpha *= px(getComputedStyle(n).opacity === "" ? "1" : getComputedStyle(n).opacity);
      if (alpha < 0.05) return false;
    }
    for (let n = e.parentElement; n && n !== document.body; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (n.tagName === "DETAILS" && !(n as HTMLDetailsElement).open && !e.closest("summary")) return false;
      const clips = cs.overflow !== "visible" || cs.clip !== "auto" || cs.clipPath !== "none";
      if (clips) {
        const p = n.getBoundingClientRect();
        if (p.width < 2 || p.height < 2) return false;                     // clipped to a pixel
        if (r.right <= p.left || r.left >= p.right || r.bottom <= p.top || r.top >= p.bottom) return false;
      }
    }
    return true;
  };
  const ignored = (e: Element) => !!(profile.ignore_selector && e.closest(profile.ignore_selector));
  const seen = (e: Element) => !ignored(e) && visible(e);
  /** A control a person must be able to use: seen, centre on screen, and a tap there reaches it. */
  const usable = (e: Element): boolean => {
    if (!seen(e)) return false;
    const r = e.getBoundingClientRect(); const x = r.left + r.width / 2, y = r.top + r.height / 2;
    if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) return false;
    const hit = document.elementFromPoint(x, y);
    return !!hit && (hit === e || e.contains(hit));
  };

  // The profile is policed, so its selectors cannot loosen a rule:
  //  - the ignore list may hide only what lies outside the page (a skip link parked above it);
  //  - help text must sit inside a field; a primary action must be a link or a button;
  //  - every field holds a label and something to fill or choose.
  const policy = (measured: string, where: string) => add("PROFILE", "the profile's selectors cannot loosen a rule", measured, where);
  if (profile.ignore_selector) {
    for (const e of Array.from(document.querySelectorAll(profile.ignore_selector))) {
      if (!visible(e)) continue;
      const r = e.getBoundingClientRect(); const top = r.top + scrollY, left = r.left + scrollX;
      if (top + r.height > 0 && left + r.width > 0) { policy("ignored but inside the page", desc(e)); break; }
    }
  }
  if (profile.help_selector) for (const e of Array.from(document.querySelectorAll(profile.help_selector)).filter(visible))
    if (!e.closest(profile.field_selector ?? ".field, fieldset")) { policy("help text outside any field", desc(e)); break; }
  for (const e of Array.from(document.querySelectorAll(profile.primary_selector)).filter(visible))
    if (!e.matches("a[href], button, input[type=submit], [role=button]")) { policy("a primary action that is not a link or button", desc(e)); break; }
  for (const f of Array.from(document.querySelectorAll(profile.field_selector ?? ".field, fieldset")).filter(visible))
    if (!f.querySelector("input:not([type=hidden]), textarea, select")) { policy("a field with nothing to fill or choose", desc(f)); break; }

  const textEls = Array.from(document.body.querySelectorAll("*")).filter((e) =>
    !["SCRIPT", "STYLE", "SVG", "PATH", "USE", "OPTION", "TITLE", "NOSCRIPT", "TEMPLATE"].includes(e.tagName) && /[A-Za-z0-9]/.test(ownText(e)) && seen(e));
  const roleOf = (e: Element): string => {
    const lab = e.closest("label");
    // A choice drawn as a label around its radio or checkbox is a control, not a field label.
    if (lab && lab.querySelector("input[type=radio], input[type=checkbox]")) return "control";
    // A label that opens a file picker is drawn and used as a button.
    if (lab && ((lab as HTMLLabelElement).control as HTMLInputElement | null)?.type === "file") return "control";
    if (e.closest("label, legend")) return "label";
    if (profile.help_selector && e.closest(profile.help_selector)) return "help";
    const cs = getComputedStyle(e); const t = ownText(e);
    // A short uppercase tracked label (a tab name, a status, "STEP 2 OF 3"): Material's 12sp label
    // role, held to the absolute floor. Real tracking (≥ 0.05 em) and no sentence in it.
    if (cs.textTransform === "uppercase" && words(t) <= 4 && px(cs.letterSpacing) >= 0.05 * px(cs.fontSize) && !/[.?!]\s|[.?!]$/.test(t)) return "caps";
    if (e.closest("button, a[href], summary, [role=button], input, select, textarea")) return "control";
    if (e.closest("h1, h2, h3, h4, h5, h6")) return "heading";
    // Reading text: any sentence, in whatever element it is set — a paragraph, a list item's prose,
    // a div. A list row's short supporting line or a chip stays secondary (Material 3, 14sp).
    if (e.closest("p, dd, blockquote")) return "body";
    if (words(t) >= 6 || t.length > 40) return "body";
    return "other";
  };
  const inSentence = (a: Element): boolean => {
    // WCAG 2.5.8 inline exception: a link inside a block that has words of its own besides links.
    const block = a.parentElement?.closest("p, li, dd, td, div");
    if (!block) return false;
    const rest = Array.from(block.childNodes).filter((n) => n.nodeType === 3).map((n) => n.textContent ?? "").join(" ");
    return words(rest) >= 2;
  };

  for (const rule of standard.rules) {
    const c = rule.check;
    if (c.archetypes && !c.archetypes.includes(archetype)) continue;
    switch (c.kind) {
      case "text-floor": {
        const min = window.innerWidth < 600 ? c.phone_px : (c.wide_px ?? c.phone_px);
        const roles: string[] | undefined = c.roles;
        const bad = textEls.filter((e) => (!roles || roles.includes(roleOf(e))) && px(getComputedStyle(e).fontSize) < min - 0.01);
        for (const e of bad.slice(0, 6)) addR(rule, `${px(getComputedStyle(e).fontSize)} px < ${min} px`, desc(e));
        if (bad.length > 6) addR(rule, `${bad.length - 6} more below ${min} px`, "");
        break;
      }
      case "field-text-floor": {
        // What is typed into a field (and its placeholder) is at least this size.
        for (const e of Array.from(document.querySelectorAll("input:not([type=hidden]):not([type=radio]):not([type=checkbox]):not([type=file]), textarea, select")).filter(seen)) {
          const s = px(getComputedStyle(e).fontSize);
          if (s < c.min_px - 0.01) { addR(rule, `typed text ${s} px < ${c.min_px} px`, desc(e)); }
        }
        break;
      }
      case "line-height": {
        const bad = textEls.filter((e) => roleOf(e) === "body" && ownText(e).length > 60).filter((e) => {
          const cs = getComputedStyle(e); const lh = cs.lineHeight === "normal" ? 1.2 * px(cs.fontSize) : px(cs.lineHeight);
          return lh / px(cs.fontSize) < c.min_ratio - 0.001;
        });
        for (const e of bad.slice(0, 4)) { const cs = getComputedStyle(e); addR(rule, `line height ${(px(cs.lineHeight) / px(cs.fontSize)).toFixed(2)} < ${c.min_ratio}`, desc(e)); }
        break;
      }
      case "measure": {
        // Characters per line of running text: box width / average glyph width (0.5 em).
        for (const e of textEls.filter((e) => roleOf(e) === "body" && ownText(e).length > 2 * c.max_chars)) {
          const cs = getComputedStyle(e); const chars = Math.round(e.getBoundingClientRect().width / (0.5 * px(cs.fontSize)));
          if (chars > c.max_chars) { addR(rule, `~${chars} characters per line > ${c.max_chars}`, desc(e)); break; }
        }
        break;
      }
      case "target-size": {
        const ctrls = Array.from(document.querySelectorAll("a[href], button, input:not([type=hidden]), select, textarea, summary, [role=button]")).filter(seen);
        for (const e of ctrls) {
          const cs = getComputedStyle(e); const r = e.getBoundingClientRect();
          if (e.tagName === "A" && cs.display === "inline" && inSentence(e)) continue;
          const t = (e as HTMLInputElement).type;
          if (t === "radio" || t === "checkbox" || t === "file") {
            const lab = e.closest("label") ?? (e.id ? document.querySelector(`label[for="${CSS.escape(e.id)}"]`) : null);
            if (lab && seen(lab)) { const lr = lab.getBoundingClientRect(); if (Math.min(lr.width, lr.height) >= c.min_px - 0.5) continue; }
          }
          if (Math.min(r.width, r.height) < c.min_px - 0.5) addR(rule, `${Math.round(r.width)}×${Math.round(r.height)} px < ${c.min_px}×${c.min_px}`, desc(e));
        }
        break;
      }
      case "has-back": {
        if (arche.root) break;
        const band = c.top_band_px as number; const names = new RegExp(c.names, "i");
        // A dialog's own Close must be inside the dialog; any other screen's Back sits in the top band.
        const dlg = document.querySelector("[role=dialog], dialog[open]");
        if (archetype === "dialog" && (!dlg || !visible(dlg))) { addR(rule, "no dialog is open", "archetype dialog"); break; }
        const scope: ParentNode = archetype === "dialog" ? dlg! : document;
        const here = location.pathname + location.search;
        const ok = Array.from(scope.querySelectorAll("a[href], button")).some((e) => {
          if (!usable(e) || !names.test((e.getAttribute("aria-label") || e.textContent || "").trim())) return false;
          const r = e.getBoundingClientRect();
          if (archetype !== "dialog" && (r.top < 0 || r.top >= band)) return false;
          if (e.tagName === "A") {
            const raw = e.getAttribute("href") ?? "";
            if (!raw || raw === "#") return false;
            const u = new URL((e as HTMLAnchorElement).href);
            if (!/^https?:$/.test(u.protocol)) return false;
            if (u.origin === location.origin && u.pathname + u.search === here && archetype !== "dialog") return false;
          }
          return true;
        });
        if (!ok) addR(rule, archetype === "dialog" ? "no usable Close inside the dialog" : `no usable Back / Close / Cancel in the top ${band} px that leads somewhere else`, `archetype ${archetype}`);
        break;
      }
      case "primary-count": {
        const n = Array.from(document.querySelectorAll(profile.primary_selector)).filter(seen).length;
        if (n > c.max) addR(rule, `${n} primary actions visible > ${c.max}`, "");
        const min = (c.min_by_archetype ?? {})[archetype] ?? 0;
        if (n < min) addR(rule, `${n} primary actions visible < ${min} (archetype ${archetype})`, "");
        break;
      }
      case "form-rhythm": {
        const sel = profile.field_selector ?? ".field, fieldset";
        const fields = Array.from(document.querySelectorAll(sel)).filter(seen);
        // Every input a person fills sits in a field (label, input, help) that the rhythm can measure.
        for (const i of Array.from(document.querySelectorAll("main input:not([type=hidden]):not([type=radio]):not([type=checkbox]):not([type=file]):not([type=search]), main textarea, main select")).filter(seen)) {
          if (!i.closest(sel)) addR(rule, "an input outside any field", desc(i));
        }
        fields.forEach((f, i) => {
          const lab = f.querySelector("label, legend"); const inp = f.querySelector("input:not([type=radio]):not([type=checkbox]):not([type=hidden]), textarea, select");
          const help = profile.help_selector ? f.querySelector(profile.help_selector) : null;
          if (!lab || !seen(lab)) addR(rule, "a field with no visible label", desc(f));
          if (lab && inp && seen(inp) && (inp as HTMLInputElement).type !== "file") {
            const g = inp.getBoundingClientRect().top - lab.getBoundingClientRect().bottom;
            if (g < c.label_to_input_min_px) addR(rule, `label to input ${Math.round(g)} px < ${c.label_to_input_min_px}`, desc(lab));
            const h = inp.getBoundingClientRect().height;
            if (inp.tagName !== "TEXTAREA" && h < c.input_min_height_px) addR(rule, `input ${Math.round(h)} px tall < ${c.input_min_height_px}`, desc(lab));
          }
          if (help && inp && seen(help) && seen(inp) && help.getBoundingClientRect().top > inp.getBoundingClientRect().top) {
            const g = help.getBoundingClientRect().top - inp.getBoundingClientRect().bottom;
            if (g < c.input_to_help_min_px) addR(rule, `input to help text ${Math.round(g)} px < ${c.input_to_help_min_px}`, desc(help));
          }
          if (i > 0) {
            const prev = fields[i - 1].getBoundingClientRect(), cur = f.getBoundingClientRect();
            const sameRow = cur.top < prev.bottom && cur.left >= prev.right - 1;   // fields set side by side
            const g = cur.top - prev.bottom;
            if (!sameRow && !fields[i - 1].contains(f) && !f.contains(fields[i - 1]) && g < c.field_gap_min_px) addR(rule, `gap between fields ${Math.round(g)} px < ${c.field_gap_min_px}`, desc(lab ?? f));
          }
        });
        break;
      }
      case "side-margin": {
        if (window.innerWidth >= 600) break;
        for (const e of textEls.filter((e) => ["body", "heading", "label", "help"].includes(roleOf(e)))) {
          const r = e.getBoundingClientRect(); const l = r.left, rt = window.innerWidth - r.right;
          if (l < c.min_px - 0.5 || rt < c.min_px - 0.5) { addR(rule, `text ${Math.round(Math.min(l, rt))} px from the screen edge < ${c.min_px}`, desc(e)); break; }
        }
        break;
      }
      case "viewport-meta": {
        // Without width=device-width a phone lays the page out about 980 px wide and shrinks it.
        const m = document.querySelector('meta[name="viewport"]')?.getAttribute("content") ?? "";
        if (!/width\s*=\s*device-width/.test(m)) addR(rule, m ? `viewport is "${m}"` : "no viewport meta tag", "");
        break;
      }
      case "no-overflow-x": {
        const d = document.documentElement;
        if (d.scrollWidth > d.clientWidth + 1) addR(rule, `scrollWidth ${d.scrollWidth} > ${d.clientWidth}`, "");
        break;
      }
      case "spacing-scale": {
        // The rhythm between blocks — vertical margins and paddings, and the gaps of grids and flex
        // rows — sits on the base unit. Not measured, because computed style cannot tell them from a
        // mistake: negative margins (optical alignment), horizontal margins (auto centring), margins
        // and paddings of media, values of 100 px or more (screen-relative layout such as 18vh), and
        // horizontal insets inside controls. Horizontal padding of every other block is measured.
        const unit = c.unit_px as number; const found = new Map<number, string>();
        for (const e of Array.from(document.querySelectorAll("body *")).filter(seen)) {
          if (["IMG", "VIDEO", "SVG", "PICTURE", "CANVAS", "IFRAME"].includes(e.tagName)) continue;
          const cs = getComputedStyle(e);
          const control = e.matches("a, button, input, select, textarea, label, summary, [role=button]");
          const vals = [cs.marginTop, cs.marginBottom, cs.paddingTop, cs.paddingBottom, cs.rowGap, cs.columnGap];
          if (!control) vals.push(cs.paddingLeft, cs.paddingRight);
          for (const v of vals.map(px)) {
            if (v > 0 && v < 100 && Math.abs(v / unit - Math.round(v / unit)) > 0.01 && !found.has(v)) found.set(v, desc(e));
          }
        }
        for (const [v, w] of Array.from(found).slice(0, 6)) addR(rule, `${v} px is off the ${unit} px grid`, w);
        if (found.size > 6) addR(rule, `${found.size - 6} more values off the grid`, "");
        break;
      }
      case "axe": break; // run by the journey with axe-core (tags in c.tags)
      default: addR(rule, `unknown check kind ${c.kind}: the engine cannot apply this rule`, "");
    }
  }
  return out;
}
