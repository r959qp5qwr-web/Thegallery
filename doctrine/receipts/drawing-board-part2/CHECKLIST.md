# Checklist — drawing board part 2, visitor screens (2, 2b, 3, 6)

Bound counted: the public pages under `src/app` (entrance, search, saved, browse, work, m, about,
participation, privacy, makers) and the shared pieces in `src/components`. Reference: the approved
board `doctrine/receipts/drawing-board/screens/index.html`, screens 2, 2b, 3 and 6, and the part 1
pages already live (Home, Search, Saved).

1. **Theme.** Every colour, type and spacing value comes from `public/gallery/tokens.css`
   variables (`--t-*`, `--s*`, `--pad-x`, `--target`, colour tokens). `tokens.css` and
   `system.css` are not edited (byte-identical to `ux/reference/interface/`); page styling lives
   in `public/gallery/app.css`.
2. **Type roles.** Status / small labels: `--t-label` mono capitals, tracking `--track-label`.
   Work title: `.title` (`--t-display`). Maker name on a gallery: `--t-monument`. Maker line and
   leads: `--t-maker` / `--t-lead` italic serif. Facts: `--t-meta` mono. The maker's own words:
   `--t-note`. Rows and body: `--t-body`.
3. **One solid action per screen** (`.btn.solid`): on a work, "Message {first name}" docked at
   the foot on a phone; on a maker's gallery, "Message" inline under the head. Every other action
   is the amber-edged line or a text link.
4. **Icons** come from the sprite (`<Icon name>`); the heart is `heart` / `heart-on`, the same mark
   as Saved in the bar. Round controls over a photograph are 44 px.
5. **Folding rows** are native `<details>/<summary>`, 54 px rows on `--rule-soft` hairlines, a
   chevron turned down closed and up open.
6. **The Message sheet** is the URL-backed sheet (`?contact=1`) with `SheetFocus`: scrim, handle,
   heading, close, the handoff sentence (GAL-C1, word for word), then one row per route.
7. **Status and price** follow `labelPrice` and `STATUS_LABEL` only; tiles say every status but
   Available, for which a stated price stands in.
8. **The bar** shows on `/m/*` and `/about`, not on `/work/*`; from 900 px the four places sit in
   the header.
9. **Words**: the project's vocabulary (work, maker, gallery, Message, Saved); no "route",
   "views", "swipe"; no city of The Gallery's own.
10. **Grids** on public pages: two columns of 4:5 tiles (Home, Search, Saved); the maker's
    gallery is the board's three-across square grid (new here, by the approved board).
11. **Not copied from the board**: its literal pixel values (`36px` titles, `470px` photo,
    `#D9CBB6` plinth); the theme's tokens stand in.
