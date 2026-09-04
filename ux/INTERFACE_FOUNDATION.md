# Interface Foundation

**Product:** The Gallery  
**Module:** `ux-design-assurance` v1.1  
**Status:** DRAFT for governor review (Stage 1)  
**Reference set:** `ux/reference/interface/INTERFACE_REFERENCE_SET.md`

## 1. Interface proposition
The interface behaves like a contemporary exhibition space rendered as a precise application. A warm paper ground and near-black rules give the work room; photography supplies the colour; one burnt amber accent marks availability and the active place. Three typographic registers do the work of hierarchy — an editorial serif for the object and the maker, a small typewriter mono for the institution's labels, categories and states, and a plain sans for anything the person must operate. Chrome recedes but stays obvious: every control is labelled, sized for a thumb and drawn from familiar platform grammar. Nothing is boxed that a rule and space can separate.

## 2. Target platforms / form factors
Mobile web first (compact, 360–599 px, opened from a WhatsApp link); tablet (medium, 600–899 px); desktop (expanded, ≥ 900 px). Web only in the MVP; installability optional.

## 3. Typography

### Functional UI typeface
IBM Plex Sans (variable). Actions, form labels, help, disclosure, errors, explanatory copy.

### Expressive / display typeface
Newsreader (variable, optical sizes). Work titles, maker names as headings, section headings, and — in italic — maker-authored notes. IBM Plex Mono is the institution's utility register: wordmark, metadata, categories, statuses, places, timestamps.

### Semantic roles
| Role | Size/token | Weight | Line height | Use |
|---|---|---|---|---|
| wordmark | 15 px mono, tracking 0.18em, uppercase | 500 | 1 | THE GALLERY |
| display | 34 px serif (44 px expanded), opsz 36 | 300 | 1.1 | work title on entrance and detail |
| heading | 26 px serif | 400 | 1.15 | maker name as page heading |
| subheading | 20 px serif | 400 | 1.25 | section titles (Collections, Workshops, Practice) |
| grid-title | 17 px serif | 400 | 1.25 | work title in grids |
| meta | 13 px mono, tracking 0.06em | 400 | 1.4 | maker line, dimensions, place, timestamps |
| label | 12 px mono, tracking 0.12em, uppercase | 500 | 1.2 | categories, statuses, section labels, bar labels |
| body | 16 px sans | 400 | 1.5 | explanatory copy, disclosure, notes |
| body-small | 14 px sans | 400 | 1.45 | help text, secondary explanation |
| action | 15 px sans | 500 | 1 | buttons |
| field | 16 px sans | 400 | 1.4 | inputs (never smaller, to prevent zoom on focus) |
| note | 18 px serif italic | 400 | 1.45 | maker-authored notes, attributed |

### Scaling rules
Body and fields never below 16 px; metadata never below 12 px and only in mono, which reads larger; the display size steps 34 → 40 → 44 across form factors; text resizes to 200 % with reflow, no clipping.

### Forbidden / limited expressive use
Serif never for buttons, labels, fields, statuses, errors or navigation. Italic only for attributed maker notes. No handwritten or decorative faces anywhere.

## 4. Spacing / layout rhythm
- base unit: 4 px
- primary rhythm: 8 · 16 · 24 · 32 · 48
- compact side padding: 20 px (Studio and operator: 16 px)
- major section separation: 32 px public, 24 px Studio (the recorded Studio density variant)
- max content width: 720 px for text, 1200 px for grids; two-column work detail from 900 px

## 5. Colour roles
| Role | Token | Purpose | Contrast requirement |
|---|---|---|---|
| paper | `#F3EEE6` | canvas | ground |
| paper-deep | `#EAE3D8` | skeletons, image frames while loading, sheet handle, disabled fills | ground |
| stone | `#D8CFC2` | soft dividers inside lists, sheet handle | decorative; adjacent text identifies rows |
| stone-strong | `#857D73` | field borders, chip borders — anything a person must perceive as a control boundary | non-text ≥ 3:1 on paper (measured 3.4:1) |
| ink | `#1B1917` | text, strong rules, icons, primary button fill | ≥ 4.5:1 on paper (measured 15.2:1) |
| ink-muted | `#5C5751` | secondary metadata, timestamps, sold/retired labels | ≥ 4.5:1 on paper (measured 6.2:1) |
| amber | `#A04A1B` | available status, active category text + underline, active bar dot, focus of attention | ≥ 4.5:1 on paper for 12–13 px text (measured 5.2:1) |
| amber-tint | `#F4E1D4` | warning notice band ground with ink text | text on it is ink |
| alarm | `#7E2A17` | the irreversible act's confirm button fill (close account, take down) with paper text | ≥ 4.5:1 paper on alarm (measured 8.2:1) |
| scrim | ink at 40 % | behind sheets and dialogs | — |
Meaning is never colour alone: statuses are words; the active category is underlined; the active bar item carries a dot and a bolder label; errors carry text and an icon.

## 6. Iconography
- family: a single 24 px line family, 1.5 px stroke, round caps, drawn once as inline SVG symbols (search, back, close, bookmark, share, chevron, plus, image, check, warning, and route kinds: chat bubble for WhatsApp, envelope, handset, globe, form)
- size rules: 24 px in bars and headers; 20 px inline beside labels
- icon-only rule: only Back, Close and Search may be icon-only, each with an accessible name and the platform's standard shape
- labels: every bar item, route row and action carries a text label
- selected/disabled behaviour: selected fills the bookmark; disabled is ink at 38 % with the reason in text nearby

## 7. Component grammar

### Navigation
Header: 56 px, wordmark left, search right, hairline ink rule below. Bottom bar: 64 px plus safe area, four items with icon over label, hairline rule above, active item has a bolder label and an amber dot. Expanded: the four items sit in the header beside search.

### Buttons
Primary: ink fill, paper text, 48 px tall, 2 px radius, full width on compact in forms and sheets; inline width elsewhere. Secondary: text button, ink, underlined, 44 px hit area. Destructive confirm: alarm fill, paper text, the verb as label. Disabled: paper-deep fill, ink-muted text, reason beside it.

### Lists
Rows 56 px minimum, hairline stone divider, leading icon optional, trailing chevron for navigation rows, trailing status chip for work rows.

### Cards
No cards. Work tiles are image + text on the ground with 16 px gutters; grouping is by rules and space.

### Fields
Label above (label role, ink), field 48 px with a 1 px stone-strong border and 2 px radius, help below (body-small, ink-muted), error below in ink with a warning icon and the field border in ink. Segmented control for material and price mode (mono labels, underline mark). Native select for status and kind. Native date/time pickers.

### Chips / filters
Text chips in mono, 44 px tall, 1 px stone-strong border; selected: ink border and text with a check; the material rail uses tabs, not chips.

### Sheets / dialogs / menus
Bottom sheet: paper ground, 12 px top radius, 4 px × 36 px handle in paper-deep, Close in the top-right, scrim behind, URL-backed. Dialog (destructive or reason-required): centred on medium and expanded, bottom-anchored on compact; title in serif subheading, consequence in body, required field, two buttons with the verb on the confirming one.

### Search
Header icon opens a full-width field (16 px sans) with a clear button; results replace the surface; the query stays visible.

### Status / banners
Notice band: full width, 16 px padding, mono label + body text; stone ground for information and success, amber-tint for warnings, alarm text on paper for failures that need action. Never a toast that disappears with the only recovery.

### Media
Images sit in frames with reserved aspect (4:5, 3:4, 1:1 or 4:3 as the maker's image dictates; never forced square), paper-deep while loading, no rounding, no shadow, no tint over the photograph. Focal point drives any crop in grids.

## 8. Density rules

### Preview anatomy
Grid tile: image · grid-title · meta (maker) · label (status). Nothing else.

### Metadata policy
One mono line for maker and medium; one for dimensions and year; status on its own line; place only on the maker gallery and the entrance context line.

### Progressive disclosure
Process note collapsed under "About this work"; practice note on the gallery page; full dimensions on detail only; the disclosure once, on the sheet.

## 9. State grammar
| State | Visual treatment | Recovery/action |
|---|---|---|
| Loading | paper-deep skeleton blocks at true aspect; no spinner over the first work | — |
| Empty | serif subheading naming what is empty, one body line, one action | the action |
| Error | notice band (alarm text) naming the cause and the next step; input preserved | retry / go back |
| Disabled | paper-deep fill, ink-muted text, reason in body-small beside | the reason's action |
| Selected | ink text with underline (tabs) or check (chips); amber only on the active bar item and available status | — |
| Success | stone notice band with a check and up to two actions | the actions |
| Waiting | progress bar in the affected tile or row, mono percentage; the rest stays operable | cancel where safe |
| Stale | mono suffix in ink-muted on the status line | reconfirm (maker) |
| Unavailable / retired | label block only, ink-muted, one line explaining | maker's gallery / entrance |

## 10. Responsive behaviour

### Compact
Single column; bottom bar; work detail image up to 60 vh; sheets bottom-anchored; forms full width with a fixed action bar.

### Medium
Two-column work grid; work detail image 60 % beside the label column; Studio list-detail; dialogs centred.

### Expanded
Navigation in the header; three-column grids to 1200 px; work detail two columns with the label column sticky; operator area list-detail with a 380 px list.

## 11. Accessibility baseline
- contrast: all text roles ≥ 4.5:1 on paper (measured in `INTERFACE_REFERENCE_SET.md`); non-text structural rules in ink
- target size: 44 × 44 CSS px product policy for every control (stronger than the WCAG 2.2 AA 24 px minimum, not to be confused with it); bar items 64 px tall
- text scaling: 200 % with reflow; no fixed-height text containers
- focus: 2 px ink ring with 2 px offset on every focusable element; visible on paper and on ink fills (paper ring)
- semantics: landmarks for header, main, navigation; images carry maker-authored alt text or the factual fallback; status chips are buttons with names including the value; sheets and dialogs trap focus and restore it
- non-colour status: every state is a word; active category underlined; active bar item dotted and bolder; errors carry an icon and text
- motion: reduced-motion honoured; transitions are opacity and short translate only

## 12. Design token / implementation source
`ux/reference/interface/tokens.css` (CSS custom properties, the single source for the reference surfaces); to be ported verbatim into the application's global stylesheet with a small direction layer (`--paper`, `--ink`, `--amber`, type families) and a semantic layer (`--surface`, `--text`, `--text-muted`, `--accent`, `--rule`, `--field-border`, `--action-fill`, `--alarm-fill`).

## 13. Accepted reference surfaces
| ID | Surface | Viewport | What grammar it establishes | Artifact |
|---|---|---|---|---|
| R-1 | Entrance (Browse) | 390 × 844 @2x | header, featured frame, label block, material rail, bottom bar | `ux/reference/interface/renders/R-1-entrance.png` |
| R-2 | Work detail + handoff sheet | 390 × 844 @2x (full page) | image carousel, label, primary/secondary actions, maker strip, sheet, disclosure, route rows | `R-2-work-detail.png`, `R-2b-handoff-sheet.png` |
| R-3 | Studio: Add work | 390 × 844 @2x (full page) | Studio header, upload tiles with states, field groups, segmented control, publish bar | `R-3-studio-add-work.png` |
Acceptance status: DRAFT — awaiting the governor's Stage 1 review. Inheritance demonstrations I-1 to I-6 are listed in the reference set.

## 14. Explicit UNKNOWN / deferred interface decisions
- Photography direction for makers (guidance on backgrounds and light) — a Studio help page, Stage 3.
- The exact treatment of collections as "exhibitions" on the gallery page beyond a titled group — Stage 3.
- Expanded-width operator surfaces are specified but not rendered at Stage 1.
- Dark appearance: not designed; the paper ground is the product; a later decision if evidence shows demand.
