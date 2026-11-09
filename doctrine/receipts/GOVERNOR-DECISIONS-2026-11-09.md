# Governor decisions — Studio order, section name, reference words — 2026-11-09

Governor instruction, 2026-11-09: "Go with your recommendation." This answers the three items left
open by `GOVERNOR-DECISIONS-2026-11-07.md` (Still open, 1–3):

| # | Question | Decision | Change |
|---|---|---|---|
| 1 | Confirming a status moves the work to the top of the Studio list, which is ordered by `updated_at` | **Accept.** The maker sees first what they just touched | None |
| 2 | "For Makers" or "for makers" | **Keep "For Makers"** as the section name everywhere. The navigation already uses it and a journey pins it. "maker" stays lower case in running text | None |
| 3 | Reference plates and journey docs still carry old status and contact words | **Update them**, documents only | Below |

Branch `claude/eloquent-mccarthy-3o5s8m`, restarted from `5563d28` (PR #8 live). Nothing merged
or deployed by this receipt. No application code, test or stylesheet changes;
`public/gallery/tokens.css`, `system.css` and `ux/reference/interface/{tokens,system}.css` are
untouched.

## What changes (documents only)

| File | Was | Now |
|---|---|---|
| `surfaces/R-1-entrance.html` (tile status) | On view | Not for sale |
| `surfaces/I-1-maker-gallery.html`, `I-2-discovery.html` (tile status) | Enquire | By enquiry |
| `surfaces/I-4-maker-door.html` | contact routes | ways to contact you |
| `surfaces/R-3-studio-add-work.html`, price control | Exact · Enquire · Made to order | Fixed price · On enquiry · Made to order (the product's control) |
| `surfaces/R-3-studio-add-work.html`, status help | available · made to order · enquire · sold · on view | available · made to order · by enquiry · not for sale · sold (`STATUS_ORDER`) |
| `ux/journeys/J-002-…md` | Identity; contact routes; "routes are not yet published" | Your details; ways to contact you; the work shows no Contact button (GAL-PR-01) |
| `ux/journeys/J-001-…md` | "The maker has not published a contact route yet" | the product's line: "<Maker> is not taking enquiries here yet." |

Renders re-made for the changed plates at 390 px @2x, the way the set specifies:
`renders/R-1-entrance.png`, `R-1-entrance-full.png`, `I-1-maker-gallery.png`, `I-2-discovery.png`,
`I-4-maker-door.png`, `R-3-studio-add-work.png`. The renders pick up the current `system.css`, so
I-1's footer row now shows the current footer style. Only these two things differ from the
previous render; seen side by side.

## SEEN
- Every old word listed above is gone from `ux/reference/interface/surfaces` and `ux/journeys`.
  The search covered Enquire, On view, contact route(s), Identity and "This door is not yours".
- The I-1 render was compared side by side with the previous one.
- Doctrine: gates 5/5 PASS (G5 scans these plates for banned vocabulary and real contact values).

## NOT SEEN
- Journeys were not rerun: nothing they exercise changed.
- No live check is needed: nothing served changed.
