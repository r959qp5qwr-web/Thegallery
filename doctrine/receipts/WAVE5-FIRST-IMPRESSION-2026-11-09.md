# Wave 5 — first impression: receipt, 2026-11-09

**Governor's decisions:** A2 (targeted system change), B2 (public navigation), C later. The design pass was
approved ("Looks good. Approved."). The app icon is option 4, the stacked wordmark.
See `GOVERNOR-DECISIONS-2026-11-09-WAVE5.md`.

**Branch:** `claude/great-edison-33c2ex`.
**Build proved:** `njBeMoHo-oqzbxTCKElVB1`, application code at `8bb15d2`. Later commits change only
`public/` CSS, journeys, documents and receipts; Next does not compile any of those. The
server's BUILD_ID was checked before every run (`e2e/run-hosted.sh`).
**Before:** the live default-branch tip `5a23906`, built in a worktree as `C019BiWtkr74F0tTHwmhF`.

## What changed

- **System (A2):** `tokens.css` and `system.css`, with `ux/reference/interface/` copies kept byte-identical and now
  guarded by a journey. Changes:
  - a serif wordmark;
  - mono for dimensions and price only;
  - sentence-case sans labels with a 12 px floor;
  - a roman serif section line;
  - display type 42/56/72 px, and a "monument" step of 52/76/104 px;
  - one filled action per screen (ink ground, paper text);
  - no arrow glyph anywhere;
  - an empty state in words only;
  - a colophon;
  - a Menu sheet;
  - the work page's pinned action bar.

  The palette is unchanged. `ux/INTERFACE_FOUNDATION.md` carries a dated amendment recording all of this.
- **Navigation (B2):**
  - Public pages carry the wordmark, Search and the Menu. The Menu is a popover, with a class-toggle fallback where
    the Popover API is missing; focus moves into it, and Escape, leaving the sheet or tapping a link closes it.
  - From 900 px, Saved, Workshops and For Makers sit inline.
  - The bottom bar renders in the Studio only.
- **Pages (from the approved pass):**
  - Entrance: an empty site and a populated one.
  - Work page:
    - the maker is named once, as the link to their gallery;
    - "Message {name}" is pinned on a phone;
    - "Updated N ago";
    - a segmented image line.
  - Maker's gallery: name at display size, their own words in roman, one column on a phone, and contact with the
    GAL-C1 meaning kept.
  - For Makers, About, Participation, Privacy, Saved, Workshops, Search, Not found, the work ending, and the
    maker-door pages: all on the same header, empty state and colophon.
- **Rooms:**
  - Browse offers only materials with work on view.
  - An empty room leads only to a room with work. The old "next" pointed two empty rooms at each other.
- **Studio:**
  - A designed photo picker that clears its line when the form resets.
  - "Remove image 1" and "Remove WhatsApp" in full.
  - One filled action per screen: Publish, and Add a work.
- **Installable:** `src/app/manifest.ts`, icons at 192/512 (any and maskable), an Apple touch icon at 180 and a
  favicon. The middleware skips them.

## Two deviations from the approved pass, and why

1. **The contact line on the maker's gallery.**
   - The pass showed "Price, delivery and payment are agreed between you."
   - That drops returns and disputes from GAL-C1, which is fixed in meaning, so it was not built as drawn (GAL-L0027).
   - Built: "You're talking to {name} directly. Payment, delivery, returns and any dispute are arranged between you;
     The Gallery takes no part in the sale."
   - The contact sheet keeps the governed sentence word for word.
2. **The status on tiles.**
   - The pass showed tiles carrying only "Sold" or a price.
   - P-11 (status surfaces include Browse and the maker gallery) and GAL-PR-02 ("stay visible with their status") would
     have been narrowed silently.
   - Built: every status except "Available" is said on the wall; for an available work, a stated price stands in.
   - The independent review raised this (its item 7).

## Proof

| Check | Result | Where |
|---|---|---|
| **Phone suite, final** | **78 passed, 1 skipped (a desktop-only check), 0 failed**: build `njBeMoHo-oqzbxTCKElVB1`, CSS and journeys at `f83450f` plus the design-pass fixes, 22.4 min | `phone4.log` |
| **Desktop suite, final** | **78 passed, 1 skipped (the phone-only Menu check), 0 failed**: same state, 20.8 min | `desktop3.log` |
| Earlier green runs, superseded | phone 77+1 (run 3), desktop 77+1 (run 2), before the byte-identity journey and the design-pass CSS | `phone3.log`, `desktop2.log` |
| Earlier failed runs | see GAL-L0029 (upload wait), and the first phone run (journeys still on old copy) | ledger |
| Independent code review | 1 BLOCKER and 11 SHOULD-FIX items, all fixed or resolved in `8bb15d2`. Item 11 (foundation document) is resolved by amendment. Item 12's weak checks were strengthened. | this receipt |
| Design skills on the result | `design-skills:design-critique`, `vectorlab-ux-skills:anti-slop`, `vectorlab-ux-skills:empty-states`, by an agent that did not build it; 2 MUSTs (material rail) fixed; the third MUST was checked and is not a change | below |
| axe-core 4.10.2, WCAG 2.0/2.1/2.2 A and AA tags | 0 violations, run again on the final state, across 33 states (17 at 390 px including the open menu and the contact sheet, 16 at 1440 px) | `a11y.mjs` |
| Reflow at 320 px | 16 of 16 pages, no horizontal scroll | same |
| Keyboard, work page | skip link > wordmark > Search > Menu > images > maker > Save > Message > colophon; every control shows a focus ring | same |
| Gates / drill / check | gates 5 of 5; drill 89 PASS, 0 RED; orientation check PASS | `scripts/doctrine-*.py` |
| Reference copies | `cmp` identical; the journey proved to fail on a planted one-line drift | GAL-L0030 |
| Upload timing (control) | 8 uploads each: Wave 5 5.9–7.4 s, live build 6.4–7.9 s | GAL-L0029 |

**Design pass on the build:**
- MUST, fixed: the browse rail at 390 px (two tabs pushed to opposite edges) and at 1440 px (its rule wider than the
  grid).
- Also taken:
  - the featured image left on the grid;
  - no pale bands beside a work's image;
  - a lone work spans the wide column.
- Checked, not changed: a sold work keeps "Message {name}". This is the pre-Wave 5 behaviour; a sold work defaults the
  message to "Commission something like this", and no decision moves.
- LATER (not in this change):
  - About's first sentence echoes the empty entrance;
  - About ends with no forward link;
  - the progress line's inactive segments stay `--stone-strong`. They are darker than the pass's pale tone because
    WCAG 1.4.11 needs 3:1 for the only visual cue.

## Renders

- `wave5/renders/before-*.jpg` and `after-*.jpg` at 390 and 1440 px:
  - entrance, the empty entrance, work, maker gallery, For Makers, an empty material, About and the empty browse page;
  - "empty" means every published work taken down for the render and restored exactly afterwards (1 of 1 restored,
    `updated_at` included).
- `wave5/sheet-ba-390.jpg` and `sheet-ba-1440.jpg`: before on top, after below.
- The images in the test project are synthetic placeholders.
- The approved pass is `wave5-design-pass/`; its objects are rendered 3D pieces and no one's work.

## SEEN / NOT SEEN / UNKNOWN

- **SEEN:**
  - both suites green on the served build;
  - axe, reflow and keyboard as above;
  - before/after renders from the two served builds;
  - the manifest and icons served with matching pixel sizes (journey).
- **NOT SEEN:**
  - any of this on the live site (not merged);
  - an install prompt on a physical Android phone;
  - the Menu on a browser without the Popover API (the fallback is read in code; Chromium only here).
- **UNKNOWN:**
  - whether the live project has an operator account;
  - the live Supabase auth settings (403 from this environment);
  - the `DOCTRINE_READ_TOKEN` (CI stays red on that check alone).

## Ledger

GAL-L0026 (no design review before Wave 5), GAL-L0027 (GAL-C1 meaning kept), GAL-L0028 (picker selector),
GAL-L0029 (upload wait), GAL-L0030 (reference copy drift).
