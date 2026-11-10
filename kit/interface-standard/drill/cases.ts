// The engine's drill: each case is a small page with ONE planted defect, the archetype it is
// measured as, and the rule that must catch it. A clean page must produce no finding at all, so
// the drill also proves the engine is not trigger-happy. Product-independent: plain HTML, the
// default profile below. Run by the product's journey (The Gallery: e2e/16-interface-drill.spec.ts).
import type { Profile } from "../engine/measure.ts";

export const DRILL_PROFILE: Profile = { primary_selector: ".primary", help_selector: ".help", field_selector: ".field", ignore_selector: ".skip" };

const BASE = `<style>
  body { margin: 0; font: 16px/1.5 sans-serif; } header { height: 56px; display: flex; align-items: center; padding: 0 16px; }
  main { padding: 16px; } a, button { display: inline-flex; align-items: center; min-height: 44px; min-width: 44px; }
  .field { margin-top: 32px; } label { display: block; margin-bottom: 8px; font-size: 16px; }
  input { display: block; height: 48px; font-size: 16px; width: 100%; box-sizing: border-box; }
  .help { margin-top: 8px; font-size: 14px; } .primary { padding: 0 16px; font-size: 16px; margin-top: 32px; }
  h1 { margin: 0 0 16px; font-size: 28px; } p { margin: 0 0 16px; } input { padding: 0 12px; }
  .skip { position: absolute; top: -80px; left: 8px; }
</style>`;
const page = (header: string, main: string) => `<!doctype html><html lang="en"><head><title>Drill</title>${BASE}</head><body>
  <a class="skip" href="#main">Skip to content</a>${header}<main id="main"><h1>A screen</h1>${main}</main></body></html>`;
const BACK = `<header><a href="/elsewhere" aria-label="Back">←</a></header>`;
const FORM = `<div class="field"><label for="a">Name</label><input id="a"><div class="help">Shown on your page.</div></div>
  <div class="field"><label for="b">Place</label><input id="b"></div><button class="primary">Save</button>`;

export type DrillCase = { id: string; archetype: string; html: string; expect: string | null; profile?: Partial<Profile> };
export const CASES: DrillCase[] = [
  { id: "clean editor", archetype: "editor", html: page(BACK, FORM), expect: null },
  { id: "Back clipped out of sight", archetype: "sub-screen", expect: "IS-N1-back",
    html: page(`<header style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)"><a href="/elsewhere" aria-label="Back">←</a></header>`, `<p>Some words to read here.</p>`) },
  { id: "Back that goes nowhere", archetype: "sub-screen", expect: "IS-N1-back", html: page(`<header><a href="#" aria-label="Back">←</a></header>`, `<p>Words.</p>`) },
  { id: "Back almost transparent", archetype: "sub-screen", expect: "IS-N1-back", html: page(`<header style="opacity:0.01"><a href="/elsewhere" aria-label="Back">←</a></header>`, `<p>Words.</p>`) },
  { id: "dialog with no Close", archetype: "dialog", expect: "IS-N1-back", html: page(BACK, `<section role="dialog"><h2>Message</h2><p>Choose a way.</p></section>`) },
  { id: "labels at 13 px", archetype: "editor", expect: "IS-T2-label-16", html: page(BACK, FORM.replace(/<label /g, `<label style="font-size:13px" `)) },
  { id: "typed text at 14 px", archetype: "editor", expect: "IS-T7-field-text-16", html: page(BACK, FORM.replace(`<input id="a">`, `<input id="a" style="font-size:14px">`)) },
  { id: "fields 24 px apart", archetype: "editor", expect: "IS-F1-form-rhythm", html: page(BACK, FORM.replace(/class="field"/g, `class="field" style="margin-top:24px"`)) },
  { id: "an input outside any field", archetype: "editor", expect: "IS-F1-form-rhythm", html: page(BACK, FORM + `<input aria-label="Loose">`) },
  { id: "editor with no primary action", archetype: "editor", expect: "IS-A1-one-primary", html: page(BACK, FORM.replace(`class="primary"`, ``)) },
  { id: "a sentence in a div at 14 px", archetype: "sub-screen", expect: "IS-T1-body-16", html: page(BACK, `<div style="font-size:14px">This is a whole sentence that a person is meant to read.</div>`) },
  { id: "aria-hidden text at 11 px", archetype: "sub-screen", expect: "IS-T4-absolute-12", html: page(BACK, `<div aria-hidden="true" style="font-size:11px">1 of 3</div>`) },
  { id: "untracked small capitals", archetype: "sub-screen", expect: "IS-T3-secondary-14", html: page(BACK, `<span style="text-transform:uppercase;font-size:12px">Sold</span>`) },
  { id: "a nav link 20 px tall", archetype: "sub-screen", expect: "IS-H1-target-44", html: page(BACK, `<ul><li><a href="/x" style="display:inline;min-height:0;font-size:16px;line-height:20px">Clay</a></li></ul>`) },
  { id: "the ignore list hides the page", archetype: "sub-screen", expect: "ENGINE", profile: { ignore_selector: ".skip, main" }, html: page(BACK, `<p style="font-size:10px">Tiny text the ignore list hides.</p>`) },
  { id: "spacing off the grid", archetype: "sub-screen", expect: "IS-L3-grid", html: page(BACK, `<p style="margin-top:18px">Words.</p>`) },
  { id: "sideways scroll", archetype: "sub-screen", expect: "IS-L2-no-sideways", html: page(BACK, `<div style="width:2000px;height:10px"></div>`) },
];
