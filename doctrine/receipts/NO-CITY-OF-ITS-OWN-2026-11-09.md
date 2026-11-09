# Receipt: The Gallery names no city of its own (2026-11-09)

**Ruling (governor):** "One thing really important. This is not a Bengaluru centric store. Remove such references if they exist anywhere." This amends GAL-OD-04, which had ruled out a Bengaluru-only claim since 2026-09-06; the live site broke that rule (ledger GAL-L0032).

## Change
| Surface | Before | After |
|---|---|---|
| Colophon (every page, and the Menu) | The Gallery, Bengaluru | The Gallery |
| Empty entrance | …art and craft by makers in Bengaluru, in clay, textile, wood, metal and paper, each in a room of their own. | …art and craft in clay, textile, wood, metal and paper, each maker in a room of their own. |
| About lead | A quiet place to see art and craft by makers in Bengaluru, … | Art and craft in clay, textile, wood, metal and paper, and a way to talk to the person who made it. |
| Manifest description | Art and craft by makers in Bengaluru, shown by the makers themselves. | Art and craft, shown by the makers themselves. |
| Demonstration makers (seeds, domain model) | all Bengaluru | Khurja, Jaipur, Moradabad, Kolkata; the seeds now update the city |
| Design reference surfaces | "Featured work · Bengaluru", "Bengaluru and Mysuru", maker lines | no city of The Gallery's own; maker places varied |
| GAL-OD-04 | — | `amendment_2026_11_09`, with the governor's words; the old Bengaluru wording is marked superseded |

A place now appears only as a maker's own field. Historical receipts are unchanged.

## Proof
| Check | Result | Status |
|---|---|---|
| New journey 11 check: no public screen (including the work page and both makers), Menu, any meta content or the manifest names Bengaluru; the empty entrance is checked too | added | SEEN |
| The check can fail | planted "The Gallery, Bengaluru" in the colophon, rebuilt (`HFQlF7c5kav9cqzmTTq4Y`): 1 failed, "Expected pattern: not /bengaluru\|bangalore/i"; restored | SEEN |
| Desktop suite, clean build `t6MqlzCLviv9YqlEtt5RJ` | 79 passed, 1 skipped, exit 0 (19.3 min) | SEEN |
| Phone suite, clean build `t6MqlzCLviv9YqlEtt5RJ`, final test head | PHONE_RESULT | PHONE_STATUS |
| Earlier phone suite (before the check was tightened), build `bqWu98HBh3foqXtNWaR00` | 79 passed, 1 skipped, exit 0 (20.1 min) | SEEN |
| Independent review (builder-reviewer agent, did not write the code) | no blocking defect; 3 medium findings (db seed city, receipt citation, GAL-OD-04 main text) and 2 test weaknesses (meta read, coverage) fixed in this change set; city-name regex limited to Bengaluru/Bangalore (accepted, stated) | SEEN |
| Design skill | `design:ux-copy` on the four replacement strings: clear and terse. The About lead reads a little stiff; it is rewritten in the approved rebuild | SEEN |
| Axe, keyboard, reflow | AXE_RESULT | AXE_STATUS |
| Before/after renders | `no-city/` | RENDER_STATUS |

## Not seen / unknown
- The live database's maker rows (no live access from this environment; a 403 on live config). Any real maker's own city is theirs to state.
- The hosted Supabase auth email templates (not in the repository).
- The live result after merge (to confirm).
