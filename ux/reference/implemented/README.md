# Implemented surfaces — Stage 2, 2026-09-06

Screenshots of the **running product** at phone width (Pixel 7, 412 CSS px), captured by
`e2e/05-renders.spec.ts` against a local `next start` build. They are here to be compared by eye
with the accepted reference set in `../interface/renders/` (Audit Protocol L-A24).

These are not mockups and not a deployed build. Nothing in this directory is evidence of
deployment; see `doctrine/receipts/STAGE2-VERTICAL-SLICE-2026-09-06.md` for what was and was not
seen.

| File | Surface | Accepted reference it inherits from |
|---|---|---|
| `S1-entrance.png` | Entrance, one work at scale, material rail | `R-1-entrance.png` |
| `S4-work-detail.png` | Work detail, label, actions, maker strip | `R-2-work-detail.png` |
| `S5-handoff.png` | Handoff sheet: intention, disclosure, maker routes | `R-2b-handoff-sheet.png` |
| `S6-maker-gallery.png` | Maker gallery: identity, practice, works, contact | `I-1-maker-gallery.png` |
| `S7-maker-door.png` | For Makers | `I-4-maker-door.png` |
| `S9-studio.png` | Studio dashboard | `I-5-states.png` |
| `S12-studio-add-work.png` | Add a work: the label | `R-3-studio-add-work.png` |
| `S13-studio-work.png` | A work: images, publish, status | `R-3-studio-add-work.png` |
| `S15-operator.png` | Operator: makers and the recorded actions | `I-6-operator-report.png` |

The full set, including full-page captures and the surfaces not listed here, is written to
`var/renders/` on every test run and is not committed.
