# Interface Reference Set

**Product:** The Gallery  
**Version:** 2 (visual system revised 2026-09-06 under the governor's mandate; receipt `doctrine/receipts/VISUAL-SYSTEM-REVISION-2026-09-06.md`)  
**Status:** `DRAFT` — awaiting the governor's Stage 1 review; acceptance sets `INTERFACE_READY` for J-001, J-002 and J-004 and lets J-003 inherit  
**Interface Foundation:** `ux/INTERFACE_FOUNDATION.md` (tokens in `ux/reference/interface/tokens.css`)

## Revision of 2026-09-06
The governor judged the implemented treatment below the accepted artistic standard — orderly but dull, a museum directory rather than a living gallery — and mandated a recomposition of the visual system rather than a restyle of components. `tokens.css` and `system.css` were revised in place, so every plate below re-rendered on the new system without a change to its markup; the renders in `renders/` are from the revised system. What changed and what remains weak is recorded in the receipt. The grammar's names (frame, label, rail, bar, tile, band, sheet, field) are unchanged; their weight, colour and voice are not.

## Purpose
Bounded high-fidelity evidence establishing the reusable interface grammar of a new product (module `ux-design-assurance` v1.1, §7 and I4): three representative surfaces, not a mock-up of every screen. Six further key screens were rendered from the same tokens and components as **inheritance demonstrations**, because the governor's Stage 1 gate asks to see how the product moves, how the maker publishes and how the operator acts (ledger GAL-L0001 records the reconciliation). Nothing here is a second design direction.

## Reference surfaces
| ID | Surface/state | Viewport | Why selected | Artifact |
|---|---|---|---|---|
| R-1 | Entrance (Browse), populated | 390 × 844 @2x, plus full page | the first public screen and the approved visual floor: header, context line, featured frame, label block, material rail, grid tile, bottom bar | `renders/R-1-entrance.png`, `renders/R-1-entrance-full.png` |
| R-2 | Work detail, published and available, with the handoff sheet open | 390 wide full page; 390 × 844 sheet | the decision surface of J-001: image carousel, label, primary and secondary actions, maker strip, maker note, sheet, disclosure, route rows | `renders/R-2-work-detail.png`, `renders/R-2b-handoff-sheet.png` |
| R-3 | Studio: Add work, with upload states and draft saved | 390 wide full page | the maker's consequential form of J-002: Studio header, upload tiles (ready, uploading, failed, add), fields, segmented controls, select, help, saved line, action bar | `renders/R-3-studio-add-work.png` |

## Inheritance demonstrations (same tokens and components; inheritance recorded, not assumed)
| ID | Surface/state | Inherits | New pattern shown |
|---|---|---|---|
| I-1 | Maker gallery: identity, practice note, commissions open, collections, works, workshops | R-1 tiles and rail grammar, R-2 note and row grammar | identity block |
| I-2 | Discovery: search “bowl” in Clay with the New chip and results, makers section | R-1 rail (active state), tiles, rows | open search field, filter chip |
| I-3 | Workshops list (upcoming, cancelled with reason, past) and a workshop detail with external registration | R-2 label and action grammar, rows | date block, cancelled treatment, external-link action |
| I-4 | Maker door: sign-in denied without enumeration, create account, confirmation pending | R-3 fields and buttons | centred pending state |
| I-5 | No results naming query and filter; unreachable with skeleton; publish failed with draft kept | R-1 header, R-3 action bar | notice bands, skeleton, empty state |
| I-6 | Operator: report detail with the subject as the public sees it and governed state; suspend dialog with a required reason | R-3 Studio density, rows | required-reason dialog |

## Relation to the approved landing reference
Preserved: the typewriter wordmark, the context line, one work at substantial scale, the amber availability line with the price in ink, the light serif title, the mono maker line, *View work →*, the five-material rail, the four-item bottom bar with a dot on the active item. Two deliberate differences, both recorded: (1) the rail is a filter, so no material is active on the entrance itself — the reference's active *CLAY* state is what `/browse/clay` shows (I-2); (2) the reference's *COMING SOON* marker is refused as unsupported copy (GAL-R17) and replaced by *Rotates daily*, which names the entrance mechanism (GAL-09 explainable ordering).

## Synthetic content
Personas from `product/DOMAIN_MODEL.md` §7. The vessel photograph is the governor's approved reference image, cropped; every other work is a CSS placeholder plate (`plates.css`) that stands in for photography and is not to be judged as photography. No real person, address, phone number or email appears; addresses use the reserved `example` domain.

## Grammar demonstrated
- typography: Newsreader display/heading/grid-title/note; IBM Plex Mono wordmark/label/meta; IBM Plex Sans body/action/field — all roles in use across R-1 to R-3
- spacing: 20 px public side padding, 16 px Studio; 24/32 px section rhythm; rules instead of boxes
- navigation: header variants (wordmark + search; back + place; Studio title), bottom bar with active mark, rail tabs
- buttons/controls: primary ink, quiet underlined with icon and label, disabled, segmented control, native-style select, fields with help and error, chip, action bar
- list/card anatomy: no cards; tiles are image + title + meta + status; rows with primary/secondary/chevron
- iconography: one 24 px line family, labelled except Back/Close/Search
- colour: paper ground, ink structure, amber only on availability, active rail item and active bar dot, alarm text on failure bands
- state treatment: loading skeleton, empty, error band, disabled, selected, success line, waiting (upload progress), stale, unavailable
- responsive intent: specified in the Foundation §10; compact rendered; medium and expanded not rendered (NOT SEEN)
- brand expression: through restraint — serif for the object and the maker, mono for the institution, sans for operation

## Preflight
**Machine-checkable (measured on the token values):**
| Pair | Ratio | Requirement |
|---|---|---|
| ink on paper | 15.2:1 | ≥ 4.5:1 text — met |
| ink-muted on paper | 6.2:1 | ≥ 4.5:1 — met |
| amber on paper (12–13 px labels) | 5.2:1 | ≥ 4.5:1 — met |
| amber on paper-deep | 4.7:1 | ≥ 4.5:1 — met |
| ink on amber-tint | 13.8:1 | ≥ 4.5:1 — met |
| paper on ink (primary button) | 15.2:1 | ≥ 4.5:1 — met |
| paper on alarm | 8.2:1 | ≥ 4.5:1 — met |
| stone-strong field border on paper | 3.5:1 | ≥ 3:1 non-text — met |
| stone dividers on paper | 1.3:1 | decorative only; rows are identified by text — accepted |

Target sizes as specified in CSS: header icon buttons 44 px; bar items 64 px tall; rail tabs, chips, text links and fields ≥ 44 px; rows ≥ 56 px; buttons 48 px; carousel dots are indicators, the swipe is the control. Text resize to 200 %, focus rings and screen-reader semantics are specified in the Foundation and are **NOT SEEN** in these static renders; they are implementation-time checks.

**Manual (I6):** the primary action is visible on every surface without scrolling past the label (R-2 at 844 px shows title, maker line and the action); body text is comfortably readable at 16 px; every icon in a bar or action carries a label; targets are not crowded (worst case: the three-column upload grid); hierarchy survives colour removal (statuses are words, the active tab is underlined, the active bar item is dotted and bolder); larger text reflows because no text container has a fixed height; nothing requires precision or visual inference.

## Review matrix (fresh-eye, after corrections; per dimension, never averaged)
| Dimension | R-1 | R-2 | R-3 | I-1…I-6 roll-up | Evidence/finding |
|---|---|---|---|---|---|
| Hierarchy | PASS | PASS | PASS | PASS | image → status/title → maker → actions holds everywhere; Studio: images → title → the rest |
| Legibility | PASS | PASS | PASS | PASS | no text below 12 px; mono metadata wraps rather than shrinks (R-1 tile meta, I-1 workshop row) |
| Density | PASS | PASS | MINOR | PASS | R-3 is long by nature of the first publish; sections and rules keep it readable; the lone Add tile on the second row is a MINOR imbalance |
| Affordance | PASS | PASS | PASS | PASS | corrected in review: Save/Share were icon-only on R-2 and the workshop detail, now labelled (ledger GAL-L0005) |
| Component consistency | PASS | PASS | PASS | PASS | one header family, one row anatomy, one field anatomy across public, Studio and operator |
| Platform grammar | PASS | PASS | PASS | PASS | tab bar, sheet, dialog, fields, picker-style upload all familiar |
| Iconography | PASS | PASS | PASS | PASS | single line family; route icons paired with kind labels |
| State clarity | PASS | PASS | PASS | PASS | I-5 and R-3 show loading, empty, failure, waiting and disabled treatments as words plus form |
| Responsive intent | PASS | PASS | PASS | PASS | specified (Foundation §10); only compact rendered — NOT SEEN at medium/expanded |
| Visual craft | PASS | PASS | MINOR | MINOR | placeholder plates are visibly synthetic; this is a fixtures limitation, not a grammar defect |

No MAJOR and no material UNKNOWN remain. Two capture defects found and fixed during review, recorded in the ledger: sticky bars captured mid-page in full-page mode (GAL-L0004), and icon-only actions (GAL-L0005).

## Evidence identity (Audit Protocol L-A25)
Rendered 2026-09-04 with Chromium via Playwright 1.56 from the sources below; state, viewport and device pixel ratio per artifact. The build is the git commit that introduces these files (`git log -- ux/reference/interface`); a hash cannot be embedded in the file it identifies.

| Artifact | Surface | State depicted | Viewport | sha256 (first 16) |
|---|---|---|---|---|
| `renders/R-1-entrance.png` | R-1 | J-001 entrance, populated | 390×844 @2x, viewport | `35da0945e0723de9` |
| `renders/R-1-entrance-full.png` | R-1 | J-001 entrance, populated | 390 wide @2x, full page | `b9f20badd342ab08` |
| `renders/R-2-work-detail.png` | R-2 | J-001 work detail, published/available, maker note | 390 wide @2x, full page | `23d5daab4c7e9297` |
| `renders/R-2b-handoff-sheet.png` | R-2 | J-001 handoff sheet open, three routes | 390×844 @2x, viewport | `0180d61f46e67136` |
| `renders/R-3-studio-add-work.png` | R-3 | J-002 add work: cover ready, one uploading, one failed, draft saved | 390 wide @2x, full page | `5027b220f08b4a83` |
| `renders/I-1-maker-gallery.png` | I-1 | J-001 maker gallery, four works, commissions open | 390 wide @2x, full page | `8d0980792ccb8c49` |
| `renders/I-2-discovery.png` | I-2 | J-006 search “bowl” in Clay, New chip, results | 390×844 @2x, viewport | `73bf3bf5cff2da77` |
| `renders/I-3-workshops.png` | I-3 | J-006 workshops list (upcoming, cancelled, past) and detail | 2 frames, 390 wide @2x | `7476cc0454429f0d` |
| `renders/I-4-maker-door.png` | I-4 | J-002 sign-in denied (non-enumerating), create account, confirmation pending | 3 frames, 390 wide @2x | `c0460f887e224821` |
| `renders/I-5-states.png` | I-5 | no results; unreachable with skeleton; publish failed | 3 frames, 390 wide @2x | `b2b5cfcbc7a59875` |
| `renders/I-6-operator-report.png` | I-6 | J-004 report detail and suspend dialog with required reason | 2 frames, 390 wide @2x | `ce95974c5905b784` |

Sources:
| File | sha256 (first 16) |
|---|---|
| `surfaces/I-1-maker-gallery.html` | `af6b05ffcde9e278` |
| `surfaces/I-2-discovery.html` | `5779586373cefbbb` |
| `surfaces/I-3-workshops.html` | `3ba7f91f2c7c1951` |
| `surfaces/I-4-maker-door.html` | `632f7c07b24dc005` |
| `surfaces/I-5-states.html` | `b1673df56eb573ec` |
| `surfaces/I-6-operator-report.html` | `dbe81e4b3e760c0f` |
| `surfaces/R-1-entrance.html` | `e25f8c87eb7a7537` |
| `surfaces/R-2-work-detail.html` | `19a22c90c3bd4049` |
| `surfaces/R-2b-handoff-sheet.html` | `67c2445a9995f5ab` |
| `surfaces/R-3-studio-add-work.html` | `dec3a3c96d73a9df` |
| `tokens.css` | `a9fa7ca32085f708` |
| `system.css` | `e0c4723228d2987e` |
| `plates.css` | `64273fb399eef65b` |
| `icons.js` | `65cd0ae8e8db439e` |
| `fonts/fonts.css` | `701dcaf04e5557b1` |

## Acceptance
**Accepted direction:** pending — the governor reviews R-1, R-2 and R-3 (with I-1 to I-6 as inheritance evidence) at the Stage 1 gate.  
**Governor/authority:** the governor of The Gallery.  
**Date:** pending

## Stop rule
Once accepted, no further visual direction is explored without new evidence or explicit reopening; unmocked surfaces inherit this grammar (Foundation §13) and implementation produces the next evidence.
