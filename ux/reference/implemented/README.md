# Implemented surfaces — visual system version 2, 2026-09-06

Screenshots of the **running product** at phone width (390 × 844 CSS px, 2×), captured with
Playwright against a local `next start` build of the same commit, with the three synthetic works
on the hosted Supabase project. They are here to be compared by eye with the accepted reference
set in `../interface/renders/` (Audit Protocol L-A24) and are the rendered evidence behind
`doctrine/receipts/VISUAL-SYSTEM-REVISION-2026-09-06.md`.

These are not mockups and not a deployed build. Nothing in this directory is evidence of
deployment.

| File | Surface | Accepted reference it inherits from |
|---|---|---|
| `S1-entrance.png` | Entrance: context, one work at scale, label, rail, recently added | `R-1-entrance.png` |
| `S2-browse-clay.png` | A material with work in it | `I-2-discovery.png` |
| `S3-browse-empty.png` | A material with nothing hung: plinth and fragment | `I-5-states.png` |
| `S4-work-detail.png` | Work detail, label, actions, the maker | `R-2-work-detail.png` |
| `S5-handoff.png` | Handoff sheet: intention, disclosure, maker routes | `R-2b-handoff-sheet.png` |
| `S6-maker-gallery.png` | Maker gallery: identity, practice, works, contact | `I-1-maker-gallery.png` |
| `S7-maker-door.png` | For Makers | `I-4-maker-door.png` |
| `S8-sign-in.png` | Sign in | `I-4-maker-door.png` |
| `S9-studio.png` | Studio dashboard | `I-5-states.png` |
| `S10-saved-empty.png` | The saved shelf, empty | `I-5-states.png` |
| `S11-workshops-empty.png` | Workshops, nothing scheduled | `I-3-workshops.png` |
| `S12-studio-add-work.png` | Add a work: the label | `R-3-studio-add-work.png` |
| `S13-studio-work.png` | A published work: images, status | `R-3-studio-add-work.png` |
| `S14-studio-identity.png` | Identity | `I-5-states.png` |
| `S16-studio-routes.png` | Contact routes | `I-5-states.png` |
| `S17-operator-refused.png` | The operator door, refused to a non-operator | `I-6-operator-report.png` |

Not present: the operator's maker list and the suspend dialog. No operator exists on the
hosted project, so those surfaces carry the revised grammar unrendered; the receipt says so.
