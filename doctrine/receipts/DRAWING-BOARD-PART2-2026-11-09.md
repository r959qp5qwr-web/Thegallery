# Receipt: drawing board, part 2 — the visitor's screens (2026-11-09)

**Authority:** governor, 2026-11-09:
- "Approved." (the 16 screens)
- "Yes." (continue with part 2)

Not a SYSTEM CHANGE: `tokens.css` and `system.css` are untouched and byte-identical to `ux/reference/interface/`. Page styling is in the "Drawing board, part 2" block of `public/gallery/app.css`.

## What changed
| Screen | Before (live, part 1) | After (board 2, 2b, 3, 6) |
|---|---|---|
| A work (2) | Header, then the images, then title, maker, status; a bookmark "Save" under the label | **Phone:** the photograph takes the top of the screen, with Back, Share and the heart over it. **Label:** status first (Available in amber, every other status quiet), then the title, "Anika Rao · wood-fired stoneware", then one line of facts ending "updated N ago". The maker's words fold under "In Anika's words". "Message Anika" stays docked. From 900 px the header returns and Back steps aside |
| Message the maker (2b) | Heading with the full name; three intent choices; the sentence; routes with their values and external icons | "Message Anika". The GAL-C1 sentence word for word, then one row per way: WhatsApp, Email (icon, name, chevron). The sentence sits **above** the rows, not below as drawn, so a screen reader and a keyboard meet it before any route (GAL-C1 is fixed in meaning) |
| A maker's gallery (3) | Name, "Khurja, India", the practice note, a one-column hang (lead work large from 900 px), then "Get in touch" with the sentence and bare routes | Back · wordmark · Share. "CLAY · KHURJA", the name, their line in quotes, one solid "Message" that opens the sheet (maker version of the sentence first). Then "N works" and the work three across in squares, each saying its status, or a stated price, on the tiles' rule. Commissions stays below |
| About (6) | "What The Gallery is", "How it works", "What you won't find here"; Participation and Privacy as separate pages | Back, "About", three lines ("Art and craft, shown by the people who made it…"), then three rows that open in place: Who can open a gallery · What we act on · Privacy. The full Participation and Privacy text sits under them. `/participation` and `/privacy` stay and show the same text, from one source (`Policies.tsx`) |

### Removed (rule 21)
- **The three intent choices on the sheet** ("Ask about this work", "Commission something like this", "General enquiry"). The message now follows the work's status: about this work while it can be had, about one like it once sold. A link with `?intent=` is still honoured. *To restore: one word.*
- Route values on the sheet: the email address and the "Message Anika about this work" line. The row names the way; the address opens in the mail app.
- On a maker's gallery: the bare routes and "Get in touch"; the kind label ("Studio", "Collective"); region and country after the town; the large lead hang from 900 px.
- On About: "How it works" and "What you won't find here". Their substance remains in the lead, the GAL-C1 sentence and "What we act on" ("We do not judge whether work is good, and we do not verify that a maker is who they say they are"). These sentences are no longer said anywhere: "no advertising", "sells no ranking", "no follower counts, likes or popularity charts".
- `INTENTS` in `src/lib/format.ts` (unused).

### Departures from the board, on purpose
- **The GAL-C1 sentence above the rows.** The board draws it below; reason above.
- **No "Newest" beside the count** on a maker's gallery. Works hang in the maker's own order ("Hang this first"), so "Newest" would be untrue.
- **No "Report a gallery or a work" row on About.** No report route exists: no reports table, no address. A row with a chevron that goes nowhere is what correction 24 forbids. It needs its own change (schema + operator queue).
- **The maker's head keeps their intro, a public exact address and commissions.** These are the maker's own words and choices, and the board's head shows only one line.
- **The maker's squares say status or price** (P-11, GAL-PR-02). The board draws bare squares; the fixed rule wins.

## Proof
| Check | Result | Status |
|---|---|---|
| Phone suite, build `QRdLEjL0sUPlglMRNBfkZ` (code `eb2cf52`) | **90 passed, 1 skipped, exit 0** (24.8 min) | SEEN |
| Earlier phone runs on the same build | Run 1: 87 passed, 1 failed, 1 skipped. Journey 10, "Hang this first": the last step did not find the button on another work, and the test hit its 60 s timeout. A control run of journey 10 alone failed at the same step; the next control (trace on, clean state) passed 6/6. **Cause UNKNOWN.** A scripted repro of the same steps offered the button on both works. Run 2: 81 passed, 1 failed, 8 did not run; the test helper's database call returned HTTP 502 from the management API (infrastructure), and serial mode stopped journey 12. Journey 10 passed in runs 2 and 3 | SEEN |
| Desktop suite, same build | **91 passed, exit 0** (24.0 min) | SEEN |
| Phone suite on the build before (`6acYWtftuarvZDhiOxwfn`) | 86 passed, 1 failed, exit 1: journey 07, "header and footer are landmarks": the phone work page hid its header with `display:none`, so it had no banner landmark. Fixed: the header stays a landmark and the way home, out of sight above the photograph, and shows when the keyboard reaches it (rendered: `drawing-board-part2/hdr-rest-and-focus.png`). Journey 12 now asserts both; this run is its control | SEEN |
| Targeted run on an earlier build (7 journeys, both devices) | 86 passed, 5 failed: 4 from the subset leaving out fixture journeys 03 and 04, 1 a view-transition timing miss. Ledger GAL-L0034 | SEEN |
| New and changed tests fail without their change | On the build before the review fixes (`z9U0wYgyjdf-Q_UKeW29u`): the heart's one name, amber only for Available, a square's price beside its status, Back steps back — each **failed**. With the sheet's focus trap removed (planted, build `AC4r1Mi5P3YUW0ThrKPKL`): "Tab 4 left the sheet" — **failed**. All pass on the final build | SEEN |
| Independent review (builder-reviewer agent; did not write the code) | M1 second handoff sentence: kept (pre-existing, approved maker variant, decision log). M2 no-contact line: restored to "{maker} is not taking enquiries here yet." M3 square dropped the price beside Made to order: fixed + test. M4 tests that could not fail: focus trap, folds and Dhaaga tightened. L5 Share without script: shown only once it works. L6 Back after an outside landing: fixed + test. L7 heart named twice: fixed. L8 no Home on a cold work page (Back → maker → bar): recorded. L9 About row and heading repeat: recorded | SEEN |
| Design consistency check (`ui-consistency:verifying`, separate agent) | Calibrated on a copy with one planted literal; it found it, **by diffing the copy against the real file**, which is a weaker proof than reading. Real findings fixed: amber on non-Available statuses (pre-existing), no-contact type and words, About Back, a colour literal, a 72 px gap, the flag inheriting a margin. Kept on purpose: amber price in the work label (board), About's heading size (board), the maker variant of the sentence | SEEN |
| axe (WCAG 2.1 A/AA, axe-core 4.10.2), build `bmXTgd4Nh8gcIYsHJQ1XI` | 0 violations on 9 states × phone and desktop: a work, its sheet, a maker, their sheet, an empty gallery, About (closed and all rows open), Participation, Privacy | SEEN |
| Reflow at 320 px | scrollWidth 320 on all 8 pages | SEEN |
| Keyboard | Work: Skip → Back → Share → Save → images → maker → words → Message. Maker: Skip → Back → wordmark → Share → Message → squares. About: Skip → wordmark → three rows. Sheet: Tab never reaches the page behind; Escape returns focus to Message (after the 1.3–1.8 s close) | SEEN |
| Renders | `drawing-board-part2/before/` (build `G4ORn7kKWkZuqJ42xo5JU`, part 1 code) and `after/` (Pixel 7 and 1440 desktop; empty gallery included); `sheet-ba-phone.jpg` | SEEN |
| Byte identity, system and reference | `cmp`: tokens.css and system.css identical; journey 11 asserts it | SEEN |
| Design skills | `design:design-critique` (below), `ui-consistency:verifying` (above) | SEEN |

## Design critique (design:design-critique), against board screens 2, 2b, 3, 6
- **First impression:** the work is the screen. On a phone the photograph runs edge to edge under three quiet round controls, and the wall label reads like a gallery label: status, title, maker in italic, facts in mono. Closer to the board and to real collection apps than part 1's header-and-strip.
- **Usability:**
  - 🟡 The Email row no longer shows the address before it opens. On a phone with no mail app set up, the tap goes nowhere visible. *Option:* show the address under "Email" in the meta style.
  - 🟢 A maker's gallery with one work shows one small square on a wide page. It reads sparse until there are three or more.
  - 🟢 From a work opened cold, the way home is Back (to the maker), then the bar. A keyboard or screen reader also has the header, which shows on focus.
- **Hierarchy:** photograph, status, title, maker, facts, then the one action. The sheet: heading, the sentence on paper-deep, then the ways.
- **Consistency:** labels and counts are mono capitals; the maker's line and words are italic serif; one solid action per screen; rows are the same 54–56 px hairline rows across the work, the sheet and About.
- **Accessibility:**
  - All controls are 44 px or more.
  - The round controls over a photograph are paper at 88 %.
  - The heart is a toggle with one name.
  - The sentence comes before the routes in reading order.

## Merge and live (2026-11-10)
- Governor: "Merge PR 13, Keep, Show". Merged with expectedHeadSha `82f6c29` → `3e1af09`. CI red only for `DOCTRINE_READ_TOKEN` (log read).
- Keep: the sheet's three intent choices stay removed. Show: the Email row will show the address. This lands with part 3, so it gets the same full process.
- Live, atthegallery.in, about 1 min after merge:
  - SEEN: app.css carries the part 2 block; /about shows the new lead and its three rows; /participation and /privacy return 200 with their text unchanged.
  - SEEN: /, /search, /saved and /makers return 200.
  - NOT SEEN: a work page, its sheet or a maker's gallery with content live, because the live entrance has no published work yet.

## Not seen
- The cause of the two journey 10 failures in phone run 1 (above). Open item: if it recurs, rerun with traces on and keep the trace.
- The live result (after merge).
- Real devices and a real share sheet (Share is tested for presence only; the phone walk follows part 3).
- Share's clipboard fallback on a desktop without `navigator.share`.
