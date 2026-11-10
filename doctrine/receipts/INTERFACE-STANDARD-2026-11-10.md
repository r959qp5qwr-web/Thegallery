# Receipt: the Interface Standard, and the app held to it (2026-11-10)

**Authority:** the governor, 2026-11-10, on Join step 2:
- "How does one go back from this page? Also, the use of space looks off. Items too cramped together. Fonts too small."
- "Why are we stuck, how do you resolve this. Give me a mechanism level solution, that's replicable, rigid, and learns from itself, and can be applied elsewhere too. … Pause anything and everything to fix this now."
- On the two recommendations (raise the type tokens; take the standard to the Doctrine): "I will go by your recommendations. Do the most reliable thing."

**SYSTEM CHANGE (approved by those words).** `tokens.css` and `system.css` changed, and their reference copies changed with them, so journey 11 stays byte-identical:
- `--t-field-label` 13 → 16 px; `--t-label` 11.5 → 12; `--t-nav` 10.5 → 12; `--t-meta` 13 → 14; `--t-caption` 13 → 14; `--bar-h` 66 → 64.
- `.field` 20 → 32 px apart; help 8 px under its field.
- `.small`, `.disclosure` and `.band p` in the body face.
- The failure band is on the grid and announced as an alert.
- System spacing on the 4 px grid.

## Why it kept happening (evidence)
Full analysis: `doctrine/harvests/PRODUCT_HARVEST-GALLERY-H-INTERFACE-001.md`; ledger GAL-L0041.
1. The Doctrine's interface law names the right standards but is unarmed. Its numbers are hedged, it has no spacing number, and visual judgement is left to manual review.
2. The app's tokens broke its own foundation ("no text below 12 px").
3. Each correction became a check for that one fault; Back was required only on a hand-written route list.
4. Pages were checked, not states: a redirect hid Join step 2 from the sweep.
5. Type and spacing were judged by eye from scaled-down renders.

## The mechanism
| Layer | Where |
|---|---|
| Standard 1.3.0: 16 rules, each sourced (WCAG 2.2, Material 3, Apple HIG, GOV.UK), hard floor or house value stated | `kit/interface-standard/STANDARD.json` |
| Engine: measures the rendered DOM; fail-closed visibility, usability and profile policing | `kit/interface-standard/engine/measure.ts` |
| Calibration on outside references (GOV.UK, Are.na), each finding read | `calibrate.ts`, `REFERENCES.json`, `CALIBRATION.json` |
| Drill: 38 planted-defect pages per viewport plus a clean page per archetype; exact rule sets | `drill/cases.ts`, `e2e/16-interface-drill.spec.ts` |
| Profile: 35 states with archetypes; not-found measured; error and loading screens declared unmeasured with reasons | `ux/INTERFACE_PROFILE.json` |
| Journey: every state, phone and desktop, plus axe at WCAG 2.2 AA | `e2e/15-interface-standard.spec.ts` |
| Gate: needs a build stamped with this code (`npm run build`), and PASS receipts for the sweep, the standard and the drill on that code | `scripts/app-sweep-gate.py` |
| Guard SWEEP-1 / GUARD-3: covers the GitHub tools, `gh pr create`, `gh -R`, `curl …/pulls`; refuses `gh pr merge` | `scripts/doctrine-hook.py` |
| Loop: escapes classed C1–C4, fixed at their layer with a failing control | `ESCAPES.md`, `SKILL.md`, CLAUDE.md rule 8 |

**Configured vs enforced:**
- The suite, the drill and the gate run every time; the gate is OPEN only on PASS.
- The guard is configured. This session's topology does not load project hooks, so it is not live-validated here.
- CI cannot read local receipts, so it does not enforce the gate.

## Proof
| Check | Result | Status |
|---|---|---|
| Control on the live code (`CONTROL-2026-11-10-*.json`) | FAIL, 33 of 33 states: phone 391 findings, desktop 511. Join step 2: no Back; labels 13 px; "Step 2 of 3" 11.5 px; fields 24 px apart | SEEN |
| Calibration on references | No engine misreads. GOV.UK's 40 px inputs fail our stricter 48 (house value); Are.na's 10–12.5 px text fails, as intended | SEEN |
| Independent review 1 (builder-reviewer) | 10 ways to pass a bad screen, 2 journey breaks, doc over-claims. All fixed | SEEN |
| Independent review 2 (builder-reviewer) | 11 further holes: phone showed two Backs; gate could pass on a stale build; drill too narrow; `gh pr merge` not refused. All fixed | SEEN |
| Drill, build `xaeTYGiwrFqIRyaYfYDFZ` | 38/38 exact, phone and desktop. It also found its own fixture faults and one real gap (no viewport tag), now rule IS-L4 | SEEN |
| Journey 15, same build | PASS: 0 findings, 35 of 35 states, phone and desktop | SEEN |
| **Desktop full suite, same build** | **103 passed** (33.5 min), summary line read | SEEN |
| **Phone full suite, same build** | PENDING | — |
| Gate | PENDING (after the phone suite) | — |
| Renders beside references (IS-M1) | PENDING | — |

## Removed (rule 21)
- Back hidden from 900 px wide; the header was the only way back on desktop. Back now shows at every width.
- The 10.5–13 px type in labels, tabs, metadata and captions.
- 24 px form rhythm.
- Off-grid spacing (3, 6, 7, 10, 14, 18, 22 px).

## Open
- A screen held to "Back at every width" now shows Back on desktop next to the four places; the governor sees this in the renders.
- Error and loading screens are declared unmeasured (reasons in the profile).
- Non-text contrast (WCAG 1.4.11) is not measured; axe has no rule for it.
- The Doctrine candidate awaits the governor's decision (H-INTERFACE-001).
