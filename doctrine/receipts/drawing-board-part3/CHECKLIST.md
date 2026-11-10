# Part 3 checklist (ui-consistency:finding-patterns, read 2026-11-10)

Maker screens against the approved board (screens 7–14), built from the part 1–2 pieces.

- [x] Docked action (Continue, Sign in, Send link, Set password, Publish, Open your gallery): `.workbar` + `.btn.solid` via `ActionForm dock`. No bar on these screens (`SectionNav.docked`). Settled by: the board, and part 2's Message bar (shared piece).
- [x] Step header: the shared `Header` with `step` (and `back` on step 1). Board 8–9.
- [x] Tap choices: the shared `Segmented` with `pick`, real radios in a fieldset; its help is the group's description. Board `.pick`.
- [x] Studio wall: 2 columns of 4:5 tiles (3 from 600 px), a flag on each, "Add a work" first; the J-003 chip kept (fixed decision).
- [x] Task row: one at a time, amber edge, paper-deep, chevron. Board `.task`.
- [x] Settings: rows label · value · chevron; each opens the existing detail page. Board 14.
- [x] Editor header: `StudioHeader` with `lead` (Cancel) and `end` (Save draft); the four places from 900 px.
- [x] Errors: `ActionForm`'s band and field errors; inputs through `Field`.
- [x] Colour, type and spacing through tokens; no colour literals. Spacing literals off the --s scale remain, as in parts 1–2 (recorded).
- [x] Not copied from the board: its sample photographs (GAL-G4), its city wording (GAL-OD-04), rows that lead nowhere (correction 24).
