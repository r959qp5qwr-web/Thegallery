# Interface Foundation

**Product:** The Gallery  
**Module:** `ux-design-assurance` v1.1  
**Status:** DRAFT for governor review (Stage 1)  
**Reference set:** `ux/reference/interface/INTERFACE_REFERENCE_SET.md`

## 1. Interface proposition
The interface behaves like a quiet, well-lit exhibition space rendered as a precise application. The work supplies the colour; the interface supplies the room. A luminous ivory wall and limestone plinths give the work its ground; a softened, warm near-black is the ink; burnt amber is the Gallery's curatorial mark — availability, the active place, the lead's short rule, the primary action's edge — visible and disciplined. Three typographic registers do the work of hierarchy, each with a job and a scale of its own: an editorial serif for the object, the maker and the curatorial voice (the lead and the maker line are serif italic); a small typewriter mono for the institution's labels — material, status, place, the wordmark — and only those; a plain sans for anything the person must operate. Actions are a line and a label with an amber edge, never a filled block. Rules are hairlines, and few. Chrome recedes but stays obvious: every control is labelled, sized for a thumb and drawn from familiar platform grammar. Nothing is boxed that light, a plinth and space can separate.

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
| wordmark | 14 px mono, tracking 0.2em, uppercase | 500 | 1 | THE GALLERY |
| display | 40 px serif (48 px medium, 56 px expanded), weight 350 | 350 | 1.04 | work title on entrance and detail; the door's headline |
| heading | 30 px serif (34 px medium) | 400 | 1.1 | maker name as page heading; empty-state title |
| subheading | 22 px serif | 400 | 1.2 | section titles (Collections, Workshops, Practice); the maker's name on a work page |
| grid-title | 18 px serif | 400 | 1.22 | work title in grids and rows |
| lead | 17 px serif italic | 400 | 1.3 | the curatorial voice: context line, section leads (with the short amber rule), the place in the header, a Studio page's title |
| maker | 17 px serif italic | 400 | 1.35 | the maker line under a title; the maker and city under a grid tile at 14 px |
| meta | 13 px mono, tracking 0.04em | 400 | 1.45 | dimensions, year, timestamps, the price beside a status |
| label | 11.5 px mono, tracking 0.14em, uppercase | 500 | 1.2 | the institution's labels only: material rail, status word, route kind, chips |
| nav | 10.5 px sans, tracking 0.1em, uppercase | 500 | 1 | bottom bar labels |
| body | 16 px sans | 400 | 1.55 | explanatory copy, disclosure, notes |
| body-small | 14 px sans | 400 | 1.5 | help text, secondary explanation |
| action | 15 px sans | 500 | 1 | the editorial action's label |
| field | 16 px sans | 400 | 1.4 | inputs (never smaller, to prevent zoom on focus) |
| field-label | 13 px sans | 500 | 1.3 | a field's label — a word, not signage |
| note | 19 px serif italic | 400 | 1.45 | maker-authored notes, attributed |

### Scaling rules
Body and fields never below 16 px; metadata never below 12 px and only in mono, which reads larger; the display size steps 34 → 40 → 44 across form factors; text resizes to 200 % with reflow, no clipping.

### Forbidden / limited expressive use
Serif never for buttons, fields, statuses, errors or navigation. Serif italic carries the curatorial voice — the lead, the maker line, the context line, attributed notes — and nothing operational. Mono uppercase is confined to the institution's labels listed above; it is a gallery label, not the product's voice, and it must not appear on a body-text surface as a heading. No handwritten or decorative faces anywhere.

## 4. Spacing / layout rhythm
- base unit: 4 px
- primary rhythm: 8 · 16 · 24 · 32 · 48
- compact side padding: 20 px (Studio and operator: 16 px)
- major section separation: 32 px public, 24 px Studio (the recorded Studio density variant)
- max content width: 720 px for text, 1200 px for grids; two-column work detail from 900 px

## 5. Colour roles

Revised 2026-09-06 under the governor's visual mandate (receipt `doctrine/receipts/VISUAL-SYSTEM-REVISION-2026-09-06.md`). The governing idea is unchanged and now enforced more literally: **the work supplies the colour; the interface supplies the room.** The ground became luminous ivory and limestone rather than grey-beige; ink softened and warmed; amber became the Gallery's curatorial mark rather than a technical indicator; the five materials gained tones that appear only as fragments, never as surfaces.

| Role | Value | Where | Contrast |
|---|---|---|---|
| paper | `#F8F3EA` | the wall: page ground | ground |
| paper-deep | `#F0E9DC` | sunken fields, notice bands, loading frames | ground |
| limestone | `#E7DECF` | plinths; the ground a work stands on in the hero and image strip | ground |
| stone | `#D5CAB8` | row dividers, soft rules | non-text |
| stone-strong | `#9A9082` | field and chip borders — anything a person must perceive as a control boundary | non-text ≥ 3:1 on paper (3.2:1) |
| ink | `#221E1A` | titles, body text, the editorial action's line | ≥ 4.5:1 on paper (15.6:1) |
| ink-soft | `#3D3630` | structural rules (used sparingly), secondary headings, icons at rest | ≥ 4.5:1 (10.4:1) |
| ink-muted | `#675F56` | metadata, help, the curatorial lead | ≥ 4.5:1 (5.4:1) |
| amber | `#A5501F` | the mark: availability, the active material and place, the lead's short rule, the primary action's left rule, focus | ≥ 4.5:1 for 12 px+ (5.0:1) |
| amber-deep | `#8A3F14` | amber as small text, where 4.5:1 must hold with margin | ≥ 4.5:1 (6.6:1) |
| amber-tint | `#F2E1D2` | warning band ground with ink text | text on it is ink |
| alarm | `#7E2A17` | the irreversible act's confirm fill with paper text; failure text | ≥ 4.5:1 paper on alarm (8.2:1) |
| m-clay · m-textile · m-wood · m-metal · m-paper | `#9B5E3A` · `#34466B` · `#7B5334` · `#8B8170` · `#CFC4B0` | material fragments in empty states only — never a surface, never behind text | — |
| scrim | ink at 42 % | behind sheets and dialogs | — |

Rules: three kinds and no more. The **hairline** (`ink` at 16 %) under the header and above the bar; the **soft rule** (`stone`) between rows; the **structural rule** (`ink-soft`), reserved. The black full-width rule that previously framed the header, the rail and the bar is gone.

Texture: one paper grain over the whole ground, multiplied in at 4.5 % — felt rather than seen. No texture behind fields, no gradients on surfaces, no shadow on a photograph. Light and shadow appear only where they are compositional: the ledge under a hero, the plinth's cast shadow, the lit wall of an empty state.

Meaning is never colour alone: statuses are words; the active material is underlined; the active bar item carries a rule above it and a bolder label; errors carry text and an icon.

## 6. Iconography
- family: a single 24 px line family, 1.5 px stroke, round caps, drawn once as inline SVG symbols (search, back, close, bookmark, share, chevron, plus, image, check, warning, and route kinds: chat bubble for WhatsApp, envelope, handset, globe, form)
- size rules: 24 px in bars and headers; 20 px inline beside labels
- icon-only rule: only Back, Close and Search may be icon-only, each with an accessible name and the platform's standard shape
- labels: every bar item, route row and action carries a text label
- selected/disabled behaviour: selected fills the bookmark; disabled is ink at 38 % with the reason in text nearby

## 7. Component grammar

### Navigation
Header: 60 px, wordmark left, the place in the lead voice centre, search right, one hairline below and no other rule. Bottom bar: 66 px plus safe area, four items with icon over a sans nav label, one hairline above; the active item is amber — icon and label — with a short amber rule above it. Expanded: the four items sit in the header beside search.

### Buttons
Editorial action (primary): a 1 px ink line, paper ground, ink label, 50 px tall, 2 px radius, an arrow in amber after the label and a 3 px amber rule on the left edge; fills ink on hover. Full width on compact in forms and sheets; inline width elsewhere. Never a filled ink block — a black block on this ground reads as a marketplace button and is refused. Secondary: text button, ink, underlined in stone, 44 px hit area. Destructive confirm: alarm fill, paper text, the verb as label — the one filled button, because the act is the one that cannot be undone. Disabled: stone line, ink-muted text, reason beside it.

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
