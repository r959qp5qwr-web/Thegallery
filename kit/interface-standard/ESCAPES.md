# Escapes — the Interface Standard's learning record

An **escape** is any interface fault found by a person after the gate was open: the governor on a
phone, a reviewer, a user. Each escape is classified by the layer that should have caught it, and
fixed at that layer first, with a failing control, before any screen is touched. The count per
class over time is the measure of whether the mechanism is learning: escapes of a class that has
been fixed must not recur.

| Class | Meaning | Fixed at |
|---|---|---|
| **C1 coverage** | the screen state was never measured (not in the profile; a redirect hid it) | the product profile: add the state |
| **C2 measure** | a rule exists, the engine measured the wrong thing or nothing | the engine, then calibrate.ts on the references |
| **C3 standard** | no rule covers it, and it is measurable | STANDARD.json (cross-product) with a source; or the product's APP_RULES.json when it is that product's taste |
| **C4 judgement** | not measurable (character, hierarchy, fit with references) | the manual protocol (IS-M1/M2): the side-by-side image shown before a PR |

## Record

| # | Date | Product | Escape (as the governor put it) | Class | Layer fixed | Rule / change | Control |
|---|---|---|---|---|---|---|---|
| E01 | 2026-11-09 | The Gallery | Wave 5 "reads like a doctor's notebook"; copy "written by an AI" | C4 + C3 | manual protocol; APP_RULES R02–R04 | references named in every design review; copy rules | sweep FAIL on live code, 2026-11-10 |
| E02 | 2026-11-09 | The Gallery | the site named a city of its own | C3 (product) | APP_RULES R01 | R01 | sweep FAIL on live code |
| E03 | 2026-11-10 | The Gallery | Participation had no way back | C3 (as a route list) → reclassified C1/C3 | STANDARD IS-N1 by archetype | IS-N1 | journey 15 FAIL on join-2, join-3, for-makers, browse, workshops |
| E04 | 2026-11-10 | The Gallery | "not X, or not Y" copy passed R03 | C2 | APP_RULES R03 widened | R03 | sweep FAIL on /about, /participation |
| E05 | 2026-11-10 | The Gallery | Join step 2: "How does one go back from this page?" | C1 (the sweep never saw join-2: it redirected) + C3 (Back was a route list) | profile states join-2, join-3 (joiner viewers); IS-N1 by archetype | IS-N1 | journey 15 FAIL on join-2: "no visible back control in the top 96 px" |
| E06 | 2026-11-10 | The Gallery | Join step 2: "Fonts too small" | C3 | STANDARD IS-T2 (labels 16), IS-T4 (12 floor) | IS-T2, IS-T4 | journey 15 FAIL: labels 13 px, "Step 2 of 3" 11.5 px |
| E07 | 2026-11-10 | The Gallery | Join step 2: "Items too cramped together" | C3 | STANDARD IS-F1 (32 px between fields) | IS-F1 | journey 15 FAIL: 24 px between fields |
| E08 | 2026-11-11 | The Gallery | Join, real sign-up: "it says the email has been sent, no email received" (the address already had an account) | C3 (product) | APP_RULES R13 | R13 | journey 14 FAIL on `/makers/check-email`: no link to sign in, none to reset |

## Counts

| Class | Escapes | Since the mechanism (2026-11-10) |
|---|---|---|
| C1 coverage | 2 (E03, E05) | 0 |
| C2 measure | 1 (E04) | 0 |
| C3 standard | 7 (E01, E02, E03, E05, E06, E07, E08) | 1 |
| C4 judgement | 1 (E01) | 0 |

An escape can carry more than one class; each class it carries is counted. Controls for E05–E07 are recorded in `CONTROL-2026-11-10-phone.json` and `CONTROL-2026-11-10-desktop.json`.
