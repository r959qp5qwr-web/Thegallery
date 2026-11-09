# Wave 5 design review — shared brief (read fully before starting)

## The product
**The Gallery** (https://atthegallery.in) is a maker-led digital gallery for art and craft objects:
potters, weavers, woodworkers, metalworkers, paper artists, mostly in India (Bengaluru first).
- Makers present their own work with the dignity of an exhibition.
- Visitors discover an object, learn who made it, and contact the maker directly, mostly on
  WhatsApp.
- No cart, no payment, no ranking, no follower counts.
- Phone-first: most visitors and makers are on Android phones.

## The governor's brief, in their words
"This is artists oriented portal… aesthetic look is the priority… maintain that highest standard of
design orientation… be cutting edge."

On seeing the live site on 9 Nov 2026: "The interface looks so novice like. There is duplication.
Very pathetic."

Your job is to find out exactly why, and to say what would make it world-class. Be specific and
unsparing. Politeness is not useful here.

## What to look at
Captures are in `/tmp/claude-0/-workspace/75f6409c-b829-5874-b75e-f444b1240fa6/scratchpad/captures/`:
- `live/`: the LIVE site today. It has no published works, so every visitor currently sees the
  empty states. 15 pages.
- `populated/`: the same build on a test project with a believable wall of works, plus the maker's
  Studio and the operator page. 14 pages. The object photos are synthetic placeholders (gradient
  ovals); judge the layout around them, not the photos themselves.
- File names are `<page>-<width>-fold.png` (the first screen) and `<page>-<width>-full.png` (the
  whole page), at widths 390 (phone), 820 (tablet) and 1440 (desktop).
- Start from the contact sheets `sheet-live-390.png`, `sheet-live-1440.png`,
  `sheet-populated-390.png` and `sheet-populated-1440.png`, then open individual files as needed.
  Phone (390) matters most.

Source, read-only: `/workspace/Thegallery`.
- Pages: `src/app/**/page.tsx`.
- Shared chrome: `src/components/Chrome.tsx`.
- Styles: `public/gallery/tokens.css`, `public/gallery/system.css` (the design system) and
  `public/gallery/app.css` (app-specific).

The design intent you are judging against:
- `ux/INTERFACE_FOUNDATION.md`
- `ux/UX_FOUNDATION.md`
- `ux/reference/interface/INTERFACE_REFERENCE_SET.md`, with its plate renders in
  `ux/reference/interface/renders/`

You may also find the foundation itself wrong or weak; say so.

## Constraints on your proposals
- The colour and type tokens and the component grammar (frame, label, rail, bar, tile, band,
  sheet, field) are the accepted design system. Mark any proposal that would change
  `tokens.css` or `system.css` as **SYSTEM CHANGE**; the governor decides those. Everything else
  goes in `app.css` or the page code.
- Keep accessibility (WCAG 2.2 AA) and reduced motion intact.
- Never propose engagement mechanics: counts, likes, ranking, "trending".

## Do not
- Do not edit any file in `/workspace/Thegallery`.
- Do not run builds or tests.
- Do not open the live site in a browser. The captures are your evidence.

## Output
Write your findings to the file named in your task, in this exact shape: a one-paragraph verdict,
then a table, most severe first.

| ID | Severity | Page(s) · width | Evidence (capture file) | What is wrong | Why (cite the skill rule or foundation section) | Proposed fix | SYSTEM CHANGE? |

Severity:
- **P0**: damages trust or the first impression on its own.
- **P1**: reads as amateur or template-like.
- **P2**: polish.

Every finding must point at a capture file you actually looked at. No generic advice ("improve
hierarchy") without the exact element and the exact change. After the table, list at most five
"moves": changes that would lift the whole product, not fix one spot.

End your reply to me with the path of your findings file and a 5-line summary.
