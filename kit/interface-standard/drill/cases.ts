// The engine's drill: each case is a small page with ONE planted defect, the archetype it is
// measured as, and the EXACT set of rules that must report it (nothing more, nothing less). Each
// archetype also has a clean page that must report nothing, so the drill proves the engine is
// neither blind nor trigger-happy. Product-independent: plain HTML and the default profile below.
// Run by the product's journey (The Gallery: e2e/16-interface-drill.spec.ts), which writes a receipt
// the merge gate requires.
import type { Profile } from "../engine/measure.ts";

export const DRILL_PROFILE: Profile = { primary_selector: ".primary", help_selector: ".help", field_selector: ".field", ignore_selector: ".skip" };

const BASE = `<style>
  body { margin: 0; font: 16px/1.5 sans-serif; } header { height: 56px; display: flex; align-items: center; padding: 0 16px; }
  main { padding: 16px; max-width: 560px; } a, button { display: inline-flex; align-items: center; min-height: 44px; min-width: 44px; font-size: 16px; }
  button { padding: 0 16px; }
  h1 { margin: 0 0 16px; font-size: 28px; } h2 { margin: 0 0 16px; font-size: 22px; } p { margin: 0 0 16px; } ul { margin: 0; padding: 0 0 0 24px; }
  .field { margin-top: 32px; } label { display: block; margin-bottom: 8px; font-size: 16px; }
  input { display: block; height: 48px; font-size: 16px; width: 100%; box-sizing: border-box; padding: 0 12px; }
  .help { margin-top: 8px; font-size: 14px; } .primary { padding: 0 16px; margin-top: 32px; }
  .skip { position: absolute; top: -80px; left: 8px; }
  [role=dialog] { position: fixed; inset: auto 0 0 0; background: #fff; padding: 16px; }
</style>`;
const VIEWPORT = `<meta name="viewport" content="width=device-width, initial-scale=1">`;
const page = (header: string, main: string, after = "") => `<!doctype html><html lang="en"><head>${VIEWPORT}<title>Drill</title>${BASE}</head><body>
  <a class="skip" href="#main">Skip to content</a>${header}<main id="main"><h1>A screen</h1>${main}</main>${after}</body></html>`;
const BACK = `<header><a href="/elsewhere" aria-label="Back">←</a></header>`;
const FORM = `<div class="field"><label for="a">Name</label><input id="a"><div class="help">Shown on your page.</div></div>
  <div class="field"><label for="b">Place</label><input id="b"></div><button class="primary">Save</button>`;
const PROSE = `<p>A short paragraph that a person reads from start to end.</p>`;
const DIALOG = (inner: string) => `<section role="dialog" aria-label="Message"><h2>Message</h2>${inner}</section>`;

/** viewports: where the case applies (a phone-only rule cannot fire on a desktop, a 120-character line cannot fit a phone). */
export type DrillCase = { id: string; archetype: string; html: string; expect: string[]; profile?: Partial<Profile>; viewports?: ("phone" | "desktop")[] };
export const CASES: DrillCase[] = [
  // ---- clean pages: nothing may be reported
  { id: "clean editor", archetype: "editor", html: page(BACK, FORM), expect: [] },
  { id: "clean sub-screen", archetype: "sub-screen", html: page(BACK, PROSE + `<p>Read <a href="/more">the rest of it</a> on the next page.</p>`), expect: [] },
  { id: "clean root (no Back needed)", archetype: "root", html: page(`<header></header>`, PROSE), expect: [] },
  { id: "clean dialog", archetype: "dialog", html: page(BACK, PROSE, DIALOG(`<p>Choose a way.</p><button aria-label="Close">×</button>`)), expect: [] },

  // ---- Back (IS-N1)
  { id: "Back clipped out of sight", archetype: "sub-screen", expect: ["IS-N1-back"],
    html: page(`<header style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)"><a href="/elsewhere" aria-label="Back">←</a></header>`, PROSE) },
  { id: "Back that goes nowhere (#)", archetype: "sub-screen", expect: ["IS-N1-back"], html: page(`<header><a href="#" aria-label="Back">←</a></header>`, PROSE) },
  { id: "Back to javascript:", archetype: "sub-screen", expect: ["IS-N1-back"], html: page(`<header><a href="javascript:history.back()" aria-label="Back">←</a></header>`, PROSE) },
  { id: "Back to this same page", archetype: "sub-screen", expect: ["IS-N1-back"], html: page(`<header><a href="/screen" aria-label="Back">←</a></header>`, PROSE) },
  { id: "Back itself almost transparent", archetype: "sub-screen", expect: ["IS-N1-back"], html: page(`<header><a href="/elsewhere" aria-label="Back" style="opacity:0.01">←</a></header>`, PROSE) },
  { id: "Back that ignores taps", archetype: "sub-screen", expect: ["IS-N1-back"], html: page(`<header><a href="/elsewhere" aria-label="Back" style="pointer-events:none">←</a></header>`, PROSE) },
  { id: "Back covered by another layer", archetype: "sub-screen", expect: ["IS-N1-back"],
    html: page(BACK, PROSE, `<div style="position:fixed;top:0;left:0;right:0;height:60px;background:#fff"></div>`) },
  { id: "Back below the top bar", archetype: "sub-screen", expect: ["IS-N1-back"], html: page(`<header></header>`, `<div style="height:120px"></div><a href="/elsewhere" aria-label="Back">←</a>` + PROSE) },
  { id: "dialog with no Close", archetype: "dialog", expect: ["IS-N1-back"], html: page(BACK, PROSE, DIALOG(`<p>Choose a way.</p>`)) },
  { id: "dialog state with no dialog open", archetype: "dialog", expect: ["IS-N1-back"], html: page(BACK, PROSE) },

  // ---- type (IS-T1..T7)
  { id: "a sentence in a div at 14 px", archetype: "sub-screen", expect: ["IS-T1-body-16"], html: page(BACK, `<div style="font-size:14px">This is a whole sentence that a person is meant to read.</div>`) },
  { id: "labels at 13 px", archetype: "editor", expect: ["IS-T2-label-16"], html: page(BACK, FORM.replace(/<label /g, `<label style="font-size:13px" `)) },
  { id: "untracked small capitals", archetype: "sub-screen", expect: ["IS-T3-secondary-14"], html: page(BACK, PROSE + `<span style="text-transform:uppercase;font-size:12px">Sold</span>`) },
  { id: "tracked capitals that are a sentence", archetype: "sub-screen", expect: ["IS-T3-secondary-14"], html: page(BACK, PROSE + `<span style="text-transform:uppercase;letter-spacing:0.1em;font-size:12px">Sold. Ask.</span>`) },
  { id: "aria-hidden text at 11 px", archetype: "sub-screen", expect: ["IS-T3-secondary-14", "IS-T4-absolute-12"], html: page(BACK, PROSE + `<div aria-hidden="true" style="font-size:11px">1 of 3</div>`) },
  { id: "line height 1.2 on running text", archetype: "sub-screen", expect: ["IS-T5-line-height"], html: page(BACK, `<p style="line-height:1.2">A paragraph long enough to be running text, set far too tight for a person to read with ease.</p>`) },
  { id: "lines of 120 characters", archetype: "sub-screen", expect: ["IS-T6-measure"], viewports: ["desktop"],
    html: page(BACK, `<p style="width:960px;max-width:none">${"A long line of running text that keeps going across the whole width of a very wide column. ".repeat(4)}</p>`).replace("max-width: 560px", "max-width: none") },
  { id: "typed text at 14 px", archetype: "editor", expect: ["IS-T7-field-text-16"], html: page(BACK, FORM.replace(`<input id="a">`, `<input id="a" style="font-size:14px">`)) },

  // ---- targets (IS-H1)
  { id: "a nav link 20 px tall", archetype: "sub-screen", expect: ["IS-H1-target-44"], html: page(BACK, PROSE + `<ul><li><a href="/x" style="display:inline;min-height:0;line-height:20px">Clay</a></li></ul>`) },

  // ---- actions (IS-A1)
  { id: "editor with no primary action", archetype: "editor", expect: ["IS-A1-one-primary"], html: page(BACK, FORM.replace(`class="primary"`, `class="secondary"`)) },
  { id: "two primary actions", archetype: "sub-screen", expect: ["IS-A1-one-primary"], html: page(BACK, PROSE + `<button class="primary">One</button> <button class="primary">Two</button>`) },

  // ---- forms (IS-F1)
  { id: "fields 24 px apart", archetype: "editor", expect: ["IS-F1-form-rhythm"], html: page(BACK, FORM.replace(/class="field"/g, `class="field" style="margin-top:24px"`)) },
  { id: "label touching its input", archetype: "editor", expect: ["IS-F1-form-rhythm"], html: page(BACK, FORM.replace(`<label for="a">`, `<label for="a" style="margin-bottom:0">`)) },
  { id: "input 40 px tall", archetype: "editor", expect: ["IS-F1-form-rhythm", "IS-H1-target-44"], html: page(BACK, FORM.replace(`<input id="a">`, `<input id="a" style="height:40px">`)) },
  { id: "help text touching its input", archetype: "editor", expect: ["IS-F1-form-rhythm"], html: page(BACK, FORM.replace(`<div class="help">`, `<div class="help" style="margin-top:0">`)) },
  { id: "a field with no label", archetype: "editor", expect: ["IS-F1-form-rhythm"], html: page(BACK, FORM.replace(`<label for="b">Place</label>`, ``).replace(`<input id="b">`, `<input id="b" aria-label="Place">`)) },
  { id: "an input outside any field", archetype: "editor", expect: ["IS-F1-form-rhythm"], html: page(BACK, FORM + `<input aria-label="Loose" style="margin-top:32px">`) },

  // ---- layout (IS-L1..L3)
  { id: "text touching the screen edge", archetype: "sub-screen", expect: ["IS-L1-side-margin"], viewports: ["phone"], html: page(BACK, PROSE).replace("main { padding: 16px;", "main { padding: 16px 0;") },
  { id: "no mobile viewport tag", archetype: "sub-screen", expect: ["IS-L4-viewport"], html: page(BACK, PROSE).replace(VIEWPORT, "") },
  { id: "sideways scroll", archetype: "sub-screen", expect: ["IS-L2-no-sideways"], html: page(BACK, PROSE + `<div style="width:2000px;height:8px"></div>`) },
  { id: "spacing off the grid", archetype: "sub-screen", expect: ["IS-L3-grid"], html: page(BACK, `<p style="margin-top:18px">Words to read here, a few of them.</p>`) },

  // ---- the profile cannot loosen a rule (PROFILE)
  { id: "the ignore list hides the page", archetype: "sub-screen", expect: ["PROFILE"], profile: { ignore_selector: ".skip, main" }, html: page(BACK, `<p style="font-size:10px">Tiny text the ignore list hides.</p>`) },
  { id: "the ignore list hides content below the fold", archetype: "sub-screen", expect: ["PROFILE"], profile: { ignore_selector: ".skip, footer" },
    html: page(BACK, PROSE + `<div style="height:2000px"></div>`, `<footer style="font-size:10px">Tiny footer far below.</footer>`) },
  { id: "help selector that swallows reading text", archetype: "sub-screen", expect: ["PROFILE"], profile: { help_selector: "main" }, html: page(BACK, PROSE) },
  { id: "primary selector on a span", archetype: "sub-screen", expect: ["PROFILE"], html: page(BACK, PROSE + `<span class="primary">Go</span>`) },
];
