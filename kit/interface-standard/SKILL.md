---
name: interface-standard
description: The measured Interface Standard and its learning loop. Use before building or changing any screen a person sees, before showing the governor any screen, before opening or merging a pull request, and every time anyone (the governor above all) finds an interface fault — "fonts too small", "cramped", "how do I go back", a screenshot of a problem. Measures every screen state against sourced numeric rules (type, spacing, targets, Back, one action, forms, contrast) and turns every escape into a rule or a coverage fix before any screen is touched.
---

# Interface Standard

Taste is not the method. Every screen state is **measured** against `STANDARD.json` (numbers with
sources: WCAG 2.2, Material 3, Apple HIG, GOV.UK) by `engine/measure.ts`, on phone and desktop,
inside the full suite. The gate is OPEN only for a build stamped with this code (`npm run build`) and
PASS receipts for the sweep, the standard and the drill on that code; the builder runs it before
every PR, and the product guard enforces it where project hooks load (not in CI).
What cannot be measured is a fixed manual protocol, not an opinion.

## A. Building or changing a screen (before code)
1. **Archetype.** Name the state's archetype (`root`, `flow-step`, `sub-screen`, `editor`, `dialog`,
   `operator`). Add the state to the product profile (`ux/INTERFACE_PROFILE.json`) *first*: every
   state — empty, error, each step of a flow, a sheet open — not only the page.
2. **Rules that bind it.** Read the rules in `STANDARD.json` that apply to the archetype. A
   `flow-step` has Back at the top, at most one primary action, labels ≥ 16 px, fields ≥ 32 px apart;
   an `editor` has exactly one primary action.
3. **References (IS-M1).** Pick two named outside screens of the same archetype (`REFERENCES.json`
   or a product's own list). Build to sit beside them.
4. **Build**, using the product's tokens; never shrink type or spacing to make something fit.

## B. Before showing the governor anything, and before a PR
1. Run the full suite: journey 15 measures every state. Read the summary line.
2. `python3 scripts/app-sweep-gate.py` must say OPEN (sweep + standard, phone + desktop, this code).
3. **IS-M1:** make one image per changed state: the screen beside its two references at the same
   width. Show it with the measured numbers. **IS-M2:** say in one line what the eye lands on first.
4. Never call a screen done from a render the governor has not seen at phone size.

## C. When anyone finds a fault (the loop)
1. **Reproduce by measurement.** Open the exact state; run the engine. Note the numbers.
2. **Classify** (`ESCAPES.md`): C1 coverage, C2 measure, C3 standard, C4 judgement.
3. **Fix the layer, not the screen:**
   - C1: add the state to the profile (a redirect is never an exemption);
   - C2: fix the engine; re-run `calibrate.ts` and read every reference finding;
   - C3: add a numeric rule with its source to `STANDARD.json` (cross-product), or to the
     product's `APP_RULES.json` if it is that product's taste;
   - C4: tighten the manual protocol.
4. **Prove it fails** on the reported state (control) — the run must name the fault.
5. **Fix every state it flags**, app-wide, then the full suite and the gate.
6. **Record** the escape in `ESCAPES.md` (class, layer, rule, control) and in the product ledger.
7. Never loosen or delete a rule to pass. A rule that is wrong changes on the governor's word.

## D. Adopting in another product
See `README.md`. Copy the kit unchanged and record its `version` (nothing checks it yet); write the
profile; copy journeys 15 and 16; add the receipts to the gate.
