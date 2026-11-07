# Wave 4 — cutting edge — 2026-11-07

Governor instruction: "Go." to start Wave 4 after Wave 3 went live. Scope: the design review's
four recommended moves ("To reach cutting edge"), `PRODUCT_STATE.json` `design_review_2026_11_06`
R4, and J-003's reconfirmation line.

Branch `claude/wave4-cutting-edge`, from `4986e07` (Wave 3 live). Nothing merged or deployed by
this receipt.

## What Wave 4 changes

| Move | What a person sees | Where |
|---|---|---|
| Desktop hang | From 900 px a work's images hang one under another at up to 85vh, the wall label staying beside them. Below 720 px of window height the label scrolls with the page, so its lower half is never out of reach | `app.css`, work page |
| Lead work | From 900 px, with three or more works and none of the first three landscape, the first in the maker's order hangs two columns wide and two rows tall, with the next two beside it. Screen order = page order = focus order | maker gallery, `Chrome.tsx`, `app.css` |
| One motion | Clicking a tile, the tile's picture becomes the work's first image (browser view transitions, about 280 ms). Waits for the hero to decode; skipped past 1.5 s; a plain link without support, on modified clicks and under reduced motion | `ViewTransition.tsx`, `app.css` |
| Self-standing message | WhatsApp and email text name the work, its status, what the visitor wants, and its link: `I saw "Monsoon Vessel No. 4" (Available) on The Gallery and would like to ask about commissioning something like it. <link>` | `format.ts` |
| Share preview | Work pages carry share tags: cover, "Title by Maker", medium · status, canonical address. A non-public work shares nothing | work page `generateMetadata`, `layout.tsx` (metadataBase) |
| Publish moment | A published work's Studio page shows the link as it will look when shared (built from the public view), with "Share on WhatsApp". If the work is not public, it says so instead | Studio work page |
| Status you can trust | Visitors read "Available · confirmed 3 days ago"; past 90 days "Status last confirmed 4 months ago". The Studio row shows the same; past 90 days it asks, and one tap ("Confirm") restates the status. If the status changed elsewhere since the page loaded, Confirm refuses | work page, Studio, `reconfirmStatusAction` |

Also fixed, found while building:
- **Phone gallery columns.** The phone hang's two columns are now equal. `system.css` writes
  `1fr 1fr`, which let a photograph's own width push its neighbour down to 80 px. This only showed
  once a gallery held mixed tiles.
- **Lone last tile.** A lone last tile on phone is now centred, as it already is from 600 px.

No database change. The status function already sets `status_confirmed_at` on every write.
`public/gallery/tokens.css` and `system.css` are unchanged and byte-identical to
`ux/reference/interface/` (`cmp`).

## SEEN

- **Journeys**, test project, served build `9lpPSAy5dMRepbVMeKGr5`, checked against `.next/BUILD_ID`.
  - The short-window rule landed after this build. It is CSS only, served from `public/`, and the
    suite exercised it.
  - Runs were serialised, with nothing else running:
    - phone **61 passed, 1 skipped** (the 1 280 px-only sticky check);
    - desktop **62 passed**.
  - `e2e/09-cutting-edge.spec.ts` adds 9 journeys; each fails without its move:
    - **Hang:** stacked images at 85vh (taller than the old 80vh cap) with the label held beside
      them. On phone, a swiped strip.
    - **Short window:** the label scrolls on a 600 px tall window and stays put at 900 px.
    - **Lead work:** two columns wide, two works beside it, still a tile (frame across, label
      below).
    - **One motion:** the view transition ran once and animated; zero runs under reduced motion;
      one element carries the name.
    - **Message:** carries the title with its status, the intent and the link.
    - **Share tags:** origin is the site's address; the cover image is served; a retired work has
      no cover or description.
    - **Publish moment:** the preview card and a WhatsApp share link.
    - **Freshness:** "confirmed 3 days ago", then "Status last confirmed 4 months ago". One-tap
      Confirm leaves the status unchanged and the confirmation fresh.
    - **Stale Confirm:** refused when the status changed after the page loaded; nothing changes.
  - `e2e/08` knows that from 900 px there is no strip to follow.
- **Accessibility**: axe-core 4.10.2, WCAG 2.0/2.1/2.2 A and AA. 16 states × 390 / 820 / 1 280 px,
  including the lead hang (three works with images) and a stale Confirm row:
  **48 states, 0 violations**, one `h1` and one `main` each. First Tab lands on "Skip to content",
  or on the first choice inside an open sheet.
- **Reflow**: 30 checks at 320 px and at 200 % zoom, **0 sideways scroll**.
- **Short window**: label 635 px against 540 px of room at 1024 × 600, which is why the rule exists.
  It fits at 1280 × 720 (660 px) and at 1440 × 900 (840 px).
- **Independent review** by a reviewer who did not write the code. It found:
  - the lead tile catching the section-heading style at every width;
  - landscape works reordering the lead hang;
  - a low-resolution lead image;
  - a lone-tile rule misfiring after a landscape tile;
  - the transition capturing an empty hero, flashing on a slow network, and allowing a duplicate
    name;
  - Confirm able to confirm a status the maker never saw;
  - the share card's maker name read from the wrong row, and the card offered for a non-public
    work;
  - `metadataBase` failing on an empty value;
  - og:image size and confirmed-ago rounding;
  - weak tests.

  All are fixed above. The motion-rule point is under Open.
- **Doctrine**: gates 5/5 PASS; drill 89 PASS, 0 RED.
- **Renders**: `doctrine/receipts/wave4/wave4-before-after-{390,820,1440}.png`, 5 surfaces each:
  maker gallery, work, work scrolled, Studio list, Studio share preview.
  - Before = live Wave 3 build `8C2cXhrkqgnL3zVZY7FqT` (`4986e07`), served separately.
  - After = build `9lpPSAy5dMRepbVMeKGr5`, before the short-window rule, which does not apply at
    these window heights.
  - Render fixture: two extra published works reusing Monsoon's stored images, one 125 days stale,
    and Monsoon set to Available, confirmed 3 days ago. All removed or restored afterwards.

## NOT SEEN

- Not live; not deployed; not on a physical phone.
- The share preview inside WhatsApp itself: only the tags were seen, not WhatsApp's own rendering
  or its cache.
- The transition was proven by call and animation counts, not watched frame by frame.
- CI still red for want of `DOCTRINE_READ_TOKEN`.

## Open (governor)

1. **The motion rule.**
   - The foundation says transitions are "opacity and short translate only"; the review said
     "opacity and position only".
   - The tile-to-hero transition also changes size: the tile's crop grows into the full picture
     over about 280 ms.
   - Keep it, or reduce it to a cross-fade with a short rise (no size change)?
2. **The lead work** is "first in the maker's order". Makers cannot set an order yet
   (`position` is never written), so today the lead is the most recently published work.
   A "hang this first" control would be new Studio scope.
3. **Reconfirming moves a work to the top of the Studio list.** The list orders by `updated_at`,
   which every status write updates.
4. **Carried from Wave 3:** whether to hide a price beside "Not for sale".
