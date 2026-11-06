# Interface conformance pass — 2026-11-06

Governor instruction: review the site against its UI/UX parameters (design council), then
"Sure. Go." for the fixes. Spec: `ux/INTERFACE_FOUNDATION.md`; references R-1, I-1.

## What changed (branch `claude/ui-conformance`)

| Finding | Clause | Change |
|---|---|---|
| Entrance and work-detail image filled ~120% of a phone screen; label and action below it | §10 compact (detail ≤ 60 vh), R-1 | `.hero` capped at 46 vh (min-height `min(52vw, 46vh)` so landscape has no empty wall); `.imgstrip img` at 60 vh |
| Same fact stated two or three times | §8 metadata policy | place off the entrance and maker-gallery headers; material named only by the active tab; no city on work tiles; status only in the Studio chip |
| Maker-gallery header had an empty centre once the place was removed | §7 navigation, I-1 | header shows the wordmark beside Back when no place is given |
| Browse count in amber | §5 amber roles | count in the plain context voice |
| Footer links in mono | §3 forbidden use | footer in the sans operable register |
| Example values inside empty fields | §7 fields; clarity | removed from Add work, profile and contact routes; examples moved to help lines |

`public/gallery/system.css` stays byte-identical to `ux/reference/interface/system.css`.

## Recorded deviation

On the maker's own gallery a tile carries the medium (or material) in the maker-line slot, since
the maker's name is the page heading. §8 preview anatomy names "meta (maker)" for that slot. This
is a deliberate local reading for the governor to confirm or reverse.

## SEEN

- Independent reviewer (did not write the change): the five fixes confirmed; one defect (empty
  maker-gallery header) and one marginal fit (action half under the bar with a two-line title at
  390 × 844) found, both fixed; remaining instances of the same classes listed, the in-scope ones
  fixed.
- `tsc --noEmit` clean; `next build` clean.
- Full journey suite against `thegallery-test`, fresh server serving build `shixGt7OqsVd8C0QwJaxS`:
  phone 31 passed, desktop 31 passed.
- An earlier 62/62 for this change ran against a stale server and is void (ledger GAL-L0018).

## NOT SEEN / left for the governor

- Amber on context labels outside §5's mapping: `makers` ("One gallery of your own"),
  `makers/sign-in` ("Makers only"), `workshops` ("Nothing scheduled"), Studio step numbers.
  R-1 shows the entrance place in muted text, not amber.
- Header place repeating the heading on `makers` ("For Makers") and `workshops`.
- Material and price as segmented controls, and image upload inside Add work (R-3): product
  decisions, not changed.
- The live site: nothing deployed.
