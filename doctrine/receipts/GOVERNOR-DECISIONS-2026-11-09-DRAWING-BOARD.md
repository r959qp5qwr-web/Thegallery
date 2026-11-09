# Governor decisions — 2026-11-09 — drawing board after Wave 5

## Context
After Wave 5 went live, the governor judged the site a regression. The earlier gallery character had been removed. The copy reads as machine-written, and the site does not look or behave like an app. One defect was found: "Make an account" on For Makers is a list step styled like a control, and tapping it does nothing.

Evidence:
- `drawing-board/live/` and `live-sheet-390.jpg`: all 15 live public screens at 390 px, with word counts.
- `drawing-board/REFERENCES-2026-11-09.md`: the reference research. Third-party screenshots are kept out of the repository under rule 3.

## Decisions (governor's words)
| # | Question | Answer |
|---|---|---|
| 1 | Restore the original Gallery look as the base (option 1) | "Of course I want the old look. That is option 1 for sure." |
| 2 | Bottom bar with icons on public pages, which reverses B2 | "Yes" |
| 3 | Workshops | "hide": shown when the first workshop exists |
| 4 | Merge About, Participation and Privacy into one screen | "yes": full text kept, folded per row |

A2 (the Wave 5 type change) and B2 (Studio-only tab bar) are reopened by the governor and superseded by 1 and 2. Applying them is a SYSTEM CHANGE. Tokens and system are copied back from the 2026-09-06 system, plus the app layer. This happens only after the screens are approved.

## Unchanged in meaning
- GAL-C1 handoff sentence (word for word on the contact sheet).
- P-11 / GAL-PR-02: every status is shown except "Available", where a stated price stands in; sold works stay visible.
- GAL-PR-01: contact is not advertised until a route exists.
- The maker's sign-in email is never shown.

## Next
Layer 4: sixteen rendered phone screens with rewritten copy at `drawing-board/screens/`, published as an artifact at https://claude.ai/artifact/NhfhLaQztV53zwQpYaho7g, awaiting approval. Nothing is built until they are approved. The phone walk is paused.

## Learning (GAL-L0031, to be entered in the ledger with the fix)
Wave 5 ran rule-based design checks (type floor, one action, no duplication, no decoration) and passed them all. Nothing checked the gallery character or compared the screens against real apps. Each check passed while the product's identity was removed. From now on, a design review compares rendered screens against named external references and the original foundation's proposition, and lists what each change removes.

## Later the same day
| # | Question | Answer |
|---|---|---|
| 5 | The 16 rendered screens (https://claude.ai/artifact/NhfhLaQztV53zwQpYaho7g), including the solid ink bars for Message, Continue and Publish | "Approved." |
| 6 | Geography | "One thing really important. This is not a Bengaluru centric store. Remove such references if they exist anywhere." |

Decision 6 amends GAL-OD-04 (`amendment_2026_11_09`):
- The Gallery names no city of its own on any surface.
- A place appears only as a maker's own field.
- Demonstration content spans several places.

The fix ships as its own change set ahead of the rebuild (ledger GAL-L0032). The design reference surfaces in `ux/reference/interface/surfaces/` are cleaned too, so a rebuild cannot copy a city line back. Historical receipts stay as they were.
