# Receipt: drawing board, part 1 — the look and the shell (2026-11-09)

**Authority:** governor, 2026-11-09:
- "Of course I want the old look. That is option 1 for sure."
- "Yes, hide, yes" (a bottom bar on public pages; Workshops hidden; one About).
- "Approved." (the 16 screens)
- "Go." (part 1)

Record: `GOVERNOR-DECISIONS-2026-11-09-DRAWING-BOARD.md`. This is a SYSTEM CHANGE, authorised by decision 1.

## What changed
| Area | Before (live, Wave 5) | After |
|---|---|---|
| Design system | A2: serif wordmark, sentence-case sans labels, roman lead, filled ink primary, no plinth | The 2026-09-06 system restored as it was. One appended app layer adds the bar of four, a work shown whole on the limestone wall, the solid docked action (`.solid`) and the pinned work bar. `ux/reference/interface/` copies are byte-identical, and the icons gain heart and studio |
| Navigation | Wordmark, Search and Menu; the bar only in the Studio | The bar on every screen below 900 px (Home, Search, Saved, Studio, with icons); the header from 900 px. The Menu is removed and Workshops is not offered. Studio leads a visitor to For Makers and a maker to the Studio. Screens that dock their own action (a work, the sign-in and sign-up forms, the editor) carry no bar |
| Home | A sentence on an empty site; work with a byline | "On view now", the work whole on the wall, the wall label (status or price), title, italic maker line, materials, then "Recently hung". Empty site: "Opening soon", the empty plinth, "The first works are being hung.", one line and "Open your gallery" |
| Search | Field, Search button, Clear, a hint line | One field with its icon; results follow the typing; materials; results as pictures |
| Saved | A list of names with chips | Pictures, "N works · on this phone", the tiles' price rule |

### Removed
- The Menu.
- Wave 5's serif wordmark and sentence-case labels.
- The filled primary on screens that do not dock an action.
- "What The Gallery is" on the empty home. About stays in the colophon on every screen.
- The Search hint.
- "Kept on this device only. There is no account." This now reads as "on this phone" on the count and in the empty line.
- Workshops from navigation. The page stays reachable.

## Proof
| Check | Result | Status |
|---|---|---|
| Phone suite, build `6GlFOZpa4BS4HQUuI8xVv` | 80 passed, 1 skipped, exit 0 (21.7 min) | SEEN |
| Desktop suite, same build | 81 passed, exit 0 (20.7 min) | SEEN |
| An earlier phone run on `v42Weil…`/`R-gbUu…` (before fixes) | 1 failed: the featured image's box was stretched (`max-height` with `width: 100%`), so the "shown whole" check failed even though contain did not crop. Fixed with the box at the work's own ratio | SEEN |
| Independent review (builder-reviewer agent; did not write the code) | **H1:** the pinned Message rule was lost in the restore, so a phone work page had no bar and no pinned Message; restored and now tested. **M1:** the action bar was lifted over a missing bar. **M2:** /makers was treated as docked. **M3:** Saved tiles said "Available"; now on the price rule. **L1–L4:** `:has()` fallback, image helper moved to lib, the submit tab stop, autofocus only on an empty search. Stale comments and unused tokens fixed | SEEN |
| New and rewritten tests, each able to fail | the bar on public screens and off docked ones, with presence checked on desktop too; Message pinned to the foot on a phone; the empty plinth (aria-hidden); one solid action per screen; Saved as pictures on the price rule; search as you type; the navigation is exactly Home, Search, Saved, Studio with no Workshops | SEEN |
| axe (WCAG 2.1 A/AA, axe-core 4.10.2) | 0 violations on `/`, `/search`, `/search?q=monsoon`, `/saved`, `/browse/clay`, `/m/anika-rao`, `/about`, `/makers`, `/makers/sign-in` | SEEN |
| Reflow at 320 px | scrollWidth 320 on all 9 | SEEN |
| Keyboard | the first Tab lands on "Skip to content" on 8 of 9; on an empty Search the field already has focus, so the first Tab is "Clay" | SEEN |
| Renders | `drawing-board-part1/before/` (live), `after/` (Pixel 7 412 px and desktop 1280 px, empty site included), `sheet-ba-phone.jpg` | SEEN |
| Design skill | `design:design-critique`, below | SEEN |
| Byte identity, system and reference | journey 11 passes | SEEN |

## Design critique (design:design-critique), against the approved board and the references
- **First impression:** an object on a wall, a wall label, the maker in italic. It reads as a gallery again. On the empty site the plinth and the monument sentence carry the first screen, as on board 1b.
- **Usability:**
  - The bar gives four obvious places within thumb reach.
  - Search needs no button.
  - The empty Saved stacks two headings, "Saved" and "Nothing saved yet". Minor; the board shows the count line instead once something is saved.
- **Hierarchy:** the image, then the label, then the title, then the maker. The status label sits above the title, as in the board and the original R-1.
- **Consistency:**
  - Labels and the bar are mono uppercase.
  - The only solid block is the docked Message.
  - The empty-home action is the amber-edged line, as drawn on board 1b.
- **Departures from the board** (minor; for the governor's eye):
  - Search has no "All" chip; the material rail lists only materials with work.
  - The board's home label reads "Available · ₹6,800", but the fixed rule shows the price alone for an available work, and the rule is followed.
  - The work page's Save is still a bookmark; it becomes the heart in part 2.
- **Bar labels:** 10.5 px, which is the original system's nav role.

## Not seen
- The live result (after merge).
- Real devices: the phone walk follows part 3.
