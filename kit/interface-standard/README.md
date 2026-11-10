# Interface Standard (kit)

A product-independent mechanism that holds every screen of an app to measured, sourced interface
rules, blocks a pull request until they pass, and learns from every fault a person still finds.
First adopted by The Gallery (2026-11-10). Written to be lifted into any web app built under the
Builders' Doctrine.

## Why it exists (the diagnosis, 2026-11-10)
- The Doctrine names the right standards (WCAG 2.2, Material, Apple HIG, Nielsen) but states sizes
  as "around" / "generally", has no number for spacing, and leaves visual judgement to manual review;
  the Canon and Playbook call this law centrally **unarmed**. Nothing measured a pixel.
- The product's own foundation said "no text below 12 px" and "44 px targets"; its tokens set
  11.5 px and 10.5 px text and nothing checked.
- Each governor correction became a check for *that* fault only (APP_RULES), so the governor stayed
  the detector. Back was required on a hand-written route list; a new page escaped it.
- Screens were checked per page, not per state: a redirect hid the Join steps from the sweep, so the
  screen the governor opened had never been measured.
- Reviews read renders scaled down; type size and spacing cannot be judged by eye from a thumbnail.

## The layers
| Layer | File | Does |
|---|---|---|
| Standard | `STANDARD.json` | numeric rules, each with sources and status (hard floor or house value); archetypes |
| Engine | `engine/measure.ts` | measures a rendered state (computed styles, boxes) against the rules for its archetype |
| Calibration | `calibrate.ts`, `REFERENCES.json`, `CALIBRATION.json` | runs the engine on outside reference screens; every finding read: engine error or stricter house rule |
| Product profile | `<app>/ux/INTERFACE_PROFILE.json` | every screen **state** with its archetype and viewer; the product's selectors; stricter overrides only |
| Journey | `<app>/e2e/15-interface-standard.spec.ts` | opens every state as its viewer, phone and desktop; engine + axe (WCAG 2.2 AA, target-size on); receipt bound to a code fingerprint |
| Gate | `<app>/scripts/app-sweep-gate.py` | no PR opened or merged without PASS receipts for the exact code |
| Loop | `SKILL.md`, `ESCAPES.md` | every escape classified C1–C4, fixed at its layer with a failing control, counted |

## Adopting in another product
1. Copy `kit/interface-standard/` unchanged (engine and standard are pinned by `version`).
2. Write `ux/INTERFACE_PROFILE.json`: selectors for the primary action, help text and fields; one
   entry per screen state with its archetype and viewer.
3. Copy the journey (`e2e/15-interface-standard.spec.ts`) and adapt only the viewer sign-ins and the
   state setups (`setup` names).
4. Add the receipts to the PR gate. Run `calibrate.ts` once in the new environment.

## Hard rules
- A profile may make a rule stricter, never looser (the journey refuses a loosening override).
- A state that lands elsewhere fails; there is no redirect exemption.
- An unknown archetype or check kind fails.
- A rule changes on the governor's word only, recorded in `ESCAPES.md`.
