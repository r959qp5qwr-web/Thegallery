# Governor decisions — price, motion, Hang this first — 2026-11-07

Governor instruction, 2026-11-07: "Yes. With your recommendations." This answers the open items
1–3 left by Wave 4 (`WAVE4-CUTTING-EDGE-2026-11-07.md`, Open):

| # | Question | Decision |
|---|---|---|
| 1 | A price beside "Not for sale"; "By enquiry · Price on enquiry" says the same thing twice | Show no price beside Sold or Not for sale. A price never repeats its status. Keyed on the stored status and price mode |
| 2 | Tile-to-hero transition: keep the size morph, or reduce it to a cross-fade with a short rise | **Keep** the size morph (about 280 ms, R4) over INTERFACE_FOUNDATION line 163. No code change |
| 3 | The lead work is the most recently published, because nothing sets the order | Add a Studio control, **Hang this first** |

Branch `claude/eloquent-mccarthy-3o5s8m`, from `fa59a7c` (Wave 4 live). Nothing is merged or
deployed by this receipt. This change sits within GAL-OD-07 (price rule, decided at Stage 1 and
reversible): "display makes the maker-authored nature and current status clear".

## What changes

| Decision | What a person sees | Where |
|---|---|---|
| One price rule | On the work page: "Not for sale" and "Sold" carry no price, where they were "Not for sale · ₹6,800" and "Sold · Price on enquiry". "By enquiry" stands alone, where it was "By enquiry · Price on enquiry"; "Made to order" likewise. Tiles and the entrance show only a stated amount, as before, and none beside Not for sale | `labelPrice` in `format.ts`; work page, `WorkTile`, entrance |
| The maker is told | The Studio work page still shows the maker their stored price, followed by "not shown while Not for sale" (or Sold) in sentence case | Studio work page, `app.css` `.status .price-note` |
| Hang this first | A published work's Studio page has an **Order in your gallery** section. If the work is not first, a "Hang this first" button, with a line explaining it. If it is first: "First in your gallery. Visitors meet it before your other works." A band confirms the move: "This work now opens your gallery." The section appears only when the wall is public and has more than one work | Studio work page, `hangFirstAction` |

`hangFirstAction` changes only `works.position`, setting it one below the gallery's lowest. It
leaves `updated_at`, status, its confirmation and price alone, so the Studio list does not
reshuffle and nothing a visitor reads about the work changes. Row-level security
(`work_self_update`, `writing_maker_id`) keeps the move to the maker's own works and refuses a
suspended maker. The action does nothing when the work is already first (a second press, a stale
page). It refuses a taken-down work.

There is no database change. "Order in your gallery" and "Share" are now real `h2` headings, with
the group style kept. `public/gallery/tokens.css` and `system.css` are unchanged and
byte-identical to `ux/reference/interface/` (`cmp`).

## SEEN

- **Journeys**, test project, served build `hY1Ph5UPDYQ6rusmYPJ5G`, checked against `.next/BUILD_ID`.
  - Suite runs were serialised, with nothing else running:
    - phone **67 passed, 1 skipped** (the 1 280 px-only sticky check);
    - desktop **68 passed** (rerun alone; GAL-L0024).
  - An earlier phone run on the pre-review build `J9XgdgdBIhxPxIj9N349E` (66 passed, 1 skipped)
    does not count as proof.
  - `e2e/10-governor-decisions.spec.ts` adds 6 journeys; each fails without its decision:
    - **Price line on the work page:** all 15 combinations of status and price mode.
      - No ₹ beside Sold or Not for sale.
      - "Price on enquiry" only where the status does not already say it.
      - "Made to order" at most once.
      - Read as `textContent` (GAL-L0025).
    - **Tile and entrance:** "Available · ₹6,800", then "Not for sale" with no ₹. Price-in-words
      modes show the status alone.
    - **Studio note:** "not shown while Not for sale", not set in label capitals (`text-transform`
      none). Gone once the work is Available.
    - **Hang this first:** the work leads the maker gallery. A stale-tab second press moves
      nothing. Every field except `position` is unchanged, compared as text. Another work is
      offered the act.
    - **One work on the wall:** no order section.
    - **Wall no visitor can see** (gallery a draft): no order section.
- **Accessibility**: axe-core 4.10.2, WCAG 2.0/2.1/2.2 A and AA, reduced motion. 8 states × 390 /
  820 / 1 280 px: entrance, maker gallery, work Not for sale, work By enquiry, Studio list,
  Studio work with the price note and Hang this first, Studio work hung first, about.
  **24 states, 0 violations**, one `h1` and one `main` each. First Tab lands on "Skip to content".
- **Reflow**: 16 checks (the 8 states at 320 px and at 200 % zoom), **0 sideways scroll**.
- **Independent review** by a reviewer who did not write the code. It confirmed the price rule
  over all 15 combinations and found that the Studio's "first" matches the public order. It found:
  - the blind repeat check (GAL-L0025);
  - the tile and entrance rule untested;
  - the note set in label capitals;
  - "Order" as an ambiguous heading;
  - the section offered on a non-public wall and to a suspended maker;
  - a second press that decremented again;
  - the update not refusing a taken-down work;
  - currency not passed through;
  - the heading not a real heading, and the button not described by its help line.

  All are fixed above. Not fixed: two concurrent first presses from two devices can both land at
  the same position, and `published_at` then decides. This is harmless; a database function
  would close it.
- **Doctrine**: orientation check PASS; gates 5/5 PASS; drill 89 PASS, 0 RED.
- **Renders**: `doctrine/receipts/decisions/decisions-before-after-{390,820,1440}.png`, 4 surfaces
  each: maker gallery, work Not for sale (stored ₹6,800), work By enquiry, Studio work page.
  - Before = live build `OXHiDrCvRr7rERHCSVLHr` (`fa59a7c`), served separately.
  - After = `hY1Ph5UPDYQ6rusmYPJ5G`.
  - Fixture: two extra published works reusing Monsoon's stored images, and Monsoon set Not for
    sale at ₹6,800. All removed or restored afterwards.
  - Studio renders are capped at 1 800 px tall. The Hang button shows in full at 390 px.

## NOT SEEN

- Not live; not deployed; not on a physical phone.
- Hang this first with real makers' galleries: only the test fixture.
- CI still red for want of `DOCTRINE_READ_TOKEN`.

## Still open (governor), carried

1. Reconfirming a status moves the work to the top of the Studio list (ordered by `updated_at`).
2. "For Makers" or "for makers".
3. Reference plates and journey docs still carry the old status words.
4. Carried items from the handoff: live Supabase auth settings; the R1 save moment; the live
   migration for "no untitled publish"; JPEG-only reading.
