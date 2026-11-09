# 03 — Art direction: critique and elevation

Lens: is this a world-class, artist-first gallery or a template? Skills applied:
`design-skills:design-critique` (Nielsen H4/H8, Von Restorff, Prägnanz, Jakob's law, Krug
"goodwill"), `design-skills:design-elevation` (functional vs perceptual patterns, "make it feel
intentional, not defaulted", scale contrast as premium), `frontend-design:frontend-design` (open on
the most characteristic thing in the subject's world; spend boldness in one place; the catalogue of
generated-design tells).

Captures referred to below are under
`/tmp/claude-0/-workspace/75f6409c-b829-5874-b75e-f444b1240fa6/scratchpad/captures/`.

## Verdict

The governor is right, and the cause is mostly not a bug. It is the art direction. The product is
the textbook "tasteful generated site". It uses a warm cream wall (#F8F3EA), a light serif display
with a burnt-terracotta accent (#A5501F), tracked mono-caps eyebrows (MAKER, BENGALURU, NOT
AVAILABLE, ONE GALLERY OF YOUR OWN), a short amber rule plus an italic lead before every section,
"A · B" metadata strings, and a "→" after every link and button. The frontend-design skill lists
each of these as a default that marks a page as generated (traits 1 and 5). The foundation does
not resist them; it requires them (INTERFACE_FOUNDATION §1, §3). The product then adds stock
app chrome around those choices: a centred page-title bar, a four-icon bottom tab bar, and a footer
link row that repeats the navigation. The work is shown smaller than the empty space around it: the
featured work takes 33% of a 1440 screen, the display type stops at 56 px, and the phone work page
puts the image inside a 5 px matte. Every name and route is said three to five times on a screen.

On the live site there is no work, so the first thing a visitor sees is a beige rectangle with a
beige shelf in it. It reads as a broken image. The same rectangle appears on five pages. The best
gallery sites (David Zwirner, Hauser & Wirth, Experimenter in Kolkata, Chemould Prescott Road, and
craft houses like The New Craftsmen) open on one image at full bleed. A name is set large with
nothing above it, and the type is a voice, not a set of labels. The Gallery does the opposite: it
opens on labels and keeps the work small. The fix is mostly subtraction plus a few
**SYSTEM CHANGE**s to scale, voice and chrome.

## Findings

| ID | Severity | Page(s) · width | Evidence (capture file) | What is wrong | Why (cite the skill rule or foundation section) | Proposed fix | SYSTEM CHANGE? |
|---|---|---|---|---|---|---|---|
| AD-01 | P0 | Live entrance · 390, 1440 | `live/entrance-390-fold.png`, `live/entrance-1440-fold.png` | The first screen of the live product is a 350×168 px (phone) / 1104×168 px (desktop) beige-on-beige box with a beige "shelf" bar. It sits under two labels ("On view now" / "BENGALURU") that state the opposite of the truth: nothing is on view. It reads as a failed image load or a skeleton, not as an intention. | frontend-design: "open with the most characteristic thing in the subject's world"; critique H1 (status) and Krug goodwill: a placeholder that looks broken drains trust. Foundation §9 says Empty = "serif subheading, one body line, one action". It does not call for a fake image. | Remove the `EmptyPlinth` image on the entrance. Make the empty entrance a typographic page: the name of the place set large, one sentence, one text link (see Direction). Remove the "On view now · BENGALURU" context line when `featured` is null. The work is `app.css` plus `(entrance)/page.tsx`. | No |
| AD-02 | P0 | Live entrance, browse, saved, workshops, not-found, search-none · 390 | `sheet-live-390.png`; `live/not-found-390-fold.png`, `live/saved-390-fold.png`, `live/workshops-390-fold.png`, `live/search-none-390-fold.png` | The same plinth rectangle (a gradient box with a shelf) is the hero of six different pages. Only the object on the shelf changes: nothing, a clay egg, a card. A visitor who taps around the live site sees one illustration six times. That is where the governor's "duplication" and "novice" both come from. | critique H4/H8 and Law of Similarity: different states look identical, so none of them means anything. frontend-design: "an empty screen is an invitation to act", not mood. | Remove the plinth from every empty state. Use a typographic empty state: a 30–34 px serif line naming what is empty, one body line, one action. On not-found and search-none, show the material words as the way out, not a picture. | No |
| AD-03 | P0 | Live entrance · 390 | `live/entrance-390-fold.png` | On a site with no work, the entrance still shows the material rail (CLAY TEXTILE WOOD METAL PAPER). It is a promise of five rooms that are all empty (`live/browse-clay-390-fold.png` "Nothing in clay yet" → "See textile", which is also empty). The visitor is sent on a tour of empty rooms. | critique: false affordance, excise (navigation that cannot advance the goal); Krug goodwill. | Hide `MaterialRail` on the entrance and in browse when a material has 0 works. Show only the materials that have work. When none do, show none. | No |
| AD-04 | P0 | Entrance (populated) · 1440 | `populated/entrance-1440-full.png` | The featured work is about 475 px wide on a 1440 screen, 33% of the width, while a 640 px empty field sits beside the short label. The "Recently added" wall below is an accidental layout: two 267 px tiles centred under a left-aligned lead, then a wide tile, then one tile orphaned in the centre. It looks broken, not curated. | elevation: "scale contrasts, restraint as premium" (Apple/Zwirner exemplars); critique visual hierarchy: the work must be the dominant element. Foundation §4 grid is 1200 px with three columns, which this does not follow. | Desktop: the featured image is about 60% of the content width and up to 80 vh tall, with the label in a 4-column side band aligned to the image bottom, not floating mid-height. The wall is a true left-aligned 12-column grid: each tile spans 4 or 6 columns by aspect ratio, rows start at the left edge, and nothing is centred or orphaned. This goes in `app.css` `.featured` and `.grid`. | No |
| AD-05 | P1 | Whole product · all | `populated/work-1440-fold.png`, `populated/maker-gallery-1440-fold.png`, `live/for-makers-1440-fold.png`, `tokens.css` | The palette and voice match generated-design defaults almost point for point: cream #F8F3EA ground, light serif display, a terracotta accent, mono tracked caps for labels, middle-dot metadata, an em-rule plus italic eyebrow before sections, and "→" on links and buttons. Nothing in the system belongs to Indian craft, to Bengaluru, or to the five materials. The material tones exist in the tokens but are never used visibly. | frontend-design calibration list, traits 1 and 5: "defaults rather than choices… they appear regardless of subject". The foundation (§1, §3, §5) writes these defaults into law, so the foundation is the weak point. | Keep the ivory wall, since a light wall is right for objects. Remove the defaults that mark it as generated: (a) drop the amber short rule and the italic lead as the universal section opener; (b) confine mono to dimensions and price only, with no uppercase eyebrows; (c) remove the "→" glyph from all buttons and links; (d) reconsider whether the accent should be terracotta. A deep indigo ink (the existing `--m-textile` #34466B) used only for the single primary action would separate the product from the generated look and take its colour from Indian dyeing, not from a template. The governor decides this. | **SYSTEM CHANGE** (tokens `--accent`, `--t-label` usage, foundation §1/§3) |
| AD-06 | P1 | Work · 390, 1440 | `populated/work-390-full.png`, `populated/work-1440-fold.png` | The maker's name appears five times on one work page: the header title "Anika Rao", the byline "Anika Rao · Wood-fired stoneware", the button "Contact Anika", the section "The maker / Anika Rao / Bengaluru", and the link "The gallery, 6 works". The "About this work" section holds a single sentence under its own rule and lead. The status line carries "· confirmed 3 days ago", which is the system's bookkeeping, not a museum label. | critique H8 (every element earns its place), Miller/Prägnanz; foundation §8 metadata policy ("one line for maker and medium"). | The header shows no title (back and search only). One byline: "Anika Rao" is a link to the gallery, followed by the medium. Delete the "The maker" block and the "The gallery, 6 works" link. Set the process note directly under the title as 19 px serif with no rule or lead. Move "confirmed N days ago" to the Studio; the public sees "Available" or nothing. This is in `work/[token]/page.tsx` and `app.css`. | No |
| AD-07 | P1 | Work · 390 | `populated/work-390-fold.png` | The image is inset about 5 px inside a limestone matte, so thin beige slivers show at both edges. It looks like a misaligned image, not a frame. "1 of 3" is a small italic counter with no swipe cue. The primary action (Contact) sits below the fold, behind the tab bar. | elevation: "make it feel intentional"; critique Fitts and the primary action must be visible; foundation §10 compact ("image up to 60 vh"). | Show the image full-bleed at 0 px margin, at its true aspect, up to 70 vh, with no matte. Replace "1 of 3" with a 2 px segmented progress line under the image, which shows both position and that the image can be swiped. Pin "Message Anika on WhatsApp" as a full-width bar at the bottom of the work page, replacing the tab bar on that page. | Partly: the pinned action bar changes the bar grammar (**SYSTEM CHANGE**) |
| AD-08 | P1 | All public pages · 390 | `sheet-live-390.png`, `sheet-populated-390.png` | Each phone page carries three navigation systems. There is a header (wordmark or centred italic title, plus search), a 66 px icon tab bar (house, bookmark, pencil, person), and a footer link row (About · Participation · Privacy · For Makers). "For Makers" appears three times on the live entrance fold. The pencil icon for "Workshops" is the wrong metaphor, and the person icon for "For Makers" reads as "my account". The tab bar uses 8% of the screen and tells the visitor this is an app, not a gallery. | critique H4/H8, Hick's law; Jakob's law (people know gallery and magazine sites, not utility tab bars, as places for art). No gallery site named above uses a persistent icon tab bar. | Public pages: a 52 px header with the wordmark on the left and "Search" and "Menu" text controls on the right. The menu sheet holds Browse, Saved, Workshops and For Makers, plus the colophon links. Remove the footer link row from pages where the menu holds those links, keeping one colophon line. Keep the tab bar in the Studio, where it suits a tool. | **SYSTEM CHANGE** (component grammar: bar) |
| AD-09 | P1 | Header, all · 390, 1440 | `live/entrance-390-fold.png`, `populated/maker-gallery-1440-fold.png` | The wordmark "THE GALLERY" is set as a 14 px tracked monospace label, the same register as the "CLAY" and "SOLD" tags, so the institution has no mark. On desktop the maker gallery centres the wordmark while other pages put it on the left or replace it with an italic page title, so the brand moves from page to page. | elevation: "feel intentional, not defaulted"; critique H4 consistency. | Make the wordmark a fixed, left-aligned typographic mark in the display serif, "The Gallery" at 20–22 px, weight 400, tracking -0.01em, sentence case. It is never replaced by a page title and never centred. Page titles belong in the page, not the header. | **SYSTEM CHANGE** (`--t-wordmark`) |
| AD-10 | P1 | Maker gallery · 390, 1440 | `populated/maker-gallery-390-full.png`, `populated/maker-gallery-1440-fold.png` | The maker's page opens on labels, not on the maker. A grey square bullet and "MAKER" sit above the name, then "Bengaluru · India", then "— Practice", then an italic note, then a mono "In Anika Rao's words", then "— 6 works". That is five typographic voices before the first object, and there is no image of the maker's world. Comparable maker pages (The New Craftsmen, Kettle's Yard shop, Experimenter artist pages) lead with the name at scale and then the work or the studio. | frontend-design: "spend your boldness in one place"; elevation "reduce to 2–3 type sizes per view"; critique Prägnanz. | Delete the "MAKER" eyebrow and its square, the "— Practice" and "— 6 works" leads, and the "In Anika Rao's words" attribution, since the page is hers. Name at 56 px on phone and 112 px on desktop, weight 300, tracking -0.02em. City on one line at 15 px sans. The practice note at 22 px serif roman (not italic) with a measure of about 34ch. The first work follows immediately. An optional maker-supplied studio image is a product decision (OPEN, governor), not settled here. | Display scale: **SYSTEM CHANGE** (`--t-display`) |
| AD-11 | P1 | Grid tiles · 390 | `populated/entrance-390-full.png`, `populated/browse-clay-390-fold.png` | Two-up 162 px phone tiles each carry three lines in three type families: a serif title, an italic maker, and a mono-caps amber status ("MADE TO ORDER", "BY ENQUIRY", "AVAILABLE · ₹4,200"). Six to ten amber caps labels on one screen turn the wall into a price list. | Von Restorff: when everything is amber, nothing stands out; foundation §5 says amber is "disciplined". | Tile caption: the title only, in 16 px serif. The maker name only where works by several makers are mixed. The status in 13 px sans ink-muted, and only when it is "Sold" or a price. Remove the amber from tiles; keep amber for one thing on a screen. | No (app.css), but conflicts with foundation §8 tile anatomy |
| AD-12 | P1 | For Makers · 1440, 390 | `live/for-makers-1440-fold.png`, `live/for-makers-390-fold.png` | "For Makers" appears in the header nav (active), the centred header title, and an italic context line, with a mono "ONE GALLERY OF YOUR OWN" set against it. Three section leads ("What this is not", "Who may hold a gallery") turn a pitch to artists into a terms-of-service page. The 1440 "Create an account" button is a 870 px outlined box, a form control rather than an invitation. | critique H8, "happy talk"/legalese in the useful lens; frontend-design: "a CTA says exactly what happens". | Remove the context line and the mono tagline. Keep the headline, which is the best copy on the site, at 72 px desktop / 44 px phone. Follow it with one paragraph and one action, "Open your gallery", at its natural width. Move "what this is not" and the eligibility text to Participation and link to it once. | No |
| AD-13 | P1 | Actions · all | `live/entrance-390-fold.png`, `populated/work-1440-fold.png`, `live/not-found-390-fold.png` | Every action is the same outlined box with a 3 px amber left edge and a "→". That treatment reads as a callout or alert, not a button. The primary action on a work page ("Contact Anika") looks the same as "Back to the entrance" on a 404. | critique Law of Similarity (different functions styled the same); Von Restorff. | One true primary per screen: a filled ink button with paper text (WhatsApp contact; "Open your gallery"). Everything else is a plain underlined text link without an arrow. Remove the amber left edge. | **SYSTEM CHANGE** (foundation §1 "never a filled block"; `system.css` action) |
| AD-14 | P2 | Contact sheet · 390 | `populated/work-contact-sheet-390-full.png` | The sheet opens on a settings-style radio list ("Ask about this work ✓ / Commission… / General enquiry") followed by a paragraph of disclosure. The actual WhatsApp link is the fourth thing down, set as a small underlined link beside a mono "WHATSAPP" label. | critique: the primary action must be the most prominent; excise. | Put the WhatsApp action first as a full-width filled button; the enquiry type is a single segmented row below it. Keep the disclosure line, at 14 px, under the button. | No |
| AD-15 | P2 | Desktop header · 1440 | `populated/work-1440-fold.png` | The nav labels are 10.5 px tracked caps at about 50% visual weight. The amber underline on BROWSE shows even on a work page, so the visitor is told "Browse" while looking at a single object. | critique H1 "you are here" must be accurate; legibility. | 15 px sans sentence case for desktop nav. No active state on work pages, or the active state goes to the maker. | **SYSTEM CHANGE** (`--t-nav`) |
| AD-16 | P2 | Typography scale · all | `tokens.css` `--t-display` 40/48/56 px | The display scale stops at 56 px on a 1440 screen, so the largest type on the site is only 3.5× the body. Gallery sites use the name or title as the image when there is no image: 96–160 px on desktop. The serif is used at a single weight (350–400) everywhere, so it never gets to show its range. | elevation "scale contrasts"; frontend-design: "type treatment as an active part of the design". | Display 44 px phone / 72 px tablet / 104 px desktop, weight 300, tracking -0.02em, line-height 0.95. Use it only for the one name or title on a screen. Step headings down to 26/30 px so the contrast is deliberate. | **SYSTEM CHANGE** (`--t-display`, `--t-heading`) |

## Moves (at most five)

1. **Subtract the scaffolding.** Remove the "—" amber rule plus italic lead as the universal section
   opener, the mono-caps eyebrows, the "→" glyphs, and the context line on every page. These four
   devices produce most of the "template" feel, and they repeat on every screen. (Foundation §1/§3:
   **SYSTEM CHANGE**.)
2. **Make the work the largest thing on every screen.** Full-bleed images on the phone with no
   matte, about 60% width and up to 80 vh on desktop, and a true left-aligned grid for the wall. If
   a page has no work, it has no picture of a pretend work.
3. **One navigation, one mention.** Each name, route and action appears once per screen. On public
   pages, replace the header title, icon tab bar and footer link row with a wordmark plus Search and
   Menu, and keep the tab bar in the Studio. (**SYSTEM CHANGE**: bar.)
4. **Use type as the image.** A real wordmark, display sizes up to about 104 px, two families only
   (serif for the gallery's voice, sans for operation; mono only for dimensions and price), and one
   bold typographic moment per screen. (**SYSTEM CHANGE**: type tokens.)
5. **One unmistakable action: WhatsApp.** A filled, full-width "Message {maker} on WhatsApp" pinned
   on the work page. Every other action becomes a quiet text link. (**SYSTEM CHANGE**: action
   grammar.)

## Direction: what the first screens should feel like

**Feeling.** Walking into a whitewashed room in Bengaluru at 10 a.m. You see one object and its
name, and nothing asks you to do anything. Quiet because there are few things, not because they
are small.

**Entrance, populated, phone 390×844**
- 0–52 px: header. "The Gallery" in Newsreader 21 px, roman, sentence case, left at 20 px. "Search"
  and "Menu" in 15 px sans on the right. A hairline under it, or none.
- 52–540 px: the featured work, full-bleed edge to edge at its own aspect (4:5 is 390×488), with no
  matte, no frame line and no plinth strip.
- About 24 px below it: the title in Newsreader 44 px / 0.98, weight 300, tracking -0.02em, at most
  two lines.
- One line: "Anika Rao, wood-fired stoneware", 15 px sans, ink-muted, with the name as the link.
- One line, only if it applies: "₹4,200" in 15 px sans tabular. No "AVAILABLE" in amber caps, no
  square mark.
- The next work of the wall starts above the fold edge, about 40 px visible, as the scroll cue.
- **Removed:** the "On view now / BENGALURU" line, the "View the work" button (the image and title
  are the link), the "Anika Rao's gallery →" link, the material rail (it moves to the Menu and to the
  foot of the wall, showing only materials that have work), the bottom tab bar, and the footer link
  row (one colophon line at the very end).

**Entrance, populated, desktop 1440**
- Image 7 of 12 columns, up to 80 vh, flush left in the 1200 grid.
- Label in columns 9–12, bottom-aligned to the image: title at 88–104 px, byline at 17 px, price at
  15 px.
- The wall below is a left-aligned 12-column grid with spans of 4 or 6 by aspect ratio, a 32 px
  gutter, 64 px between rows, and captions of the title only.

**Entrance, live and empty (today)**
- No image box.
- "The Gallery" set at 64 px phone / 128 px desktop, weight 300, as the only large element.
- Under it, at 19 px serif: "Opening in Bengaluru. The first makers are hanging their work."
- One text link: "Are you a maker? Open your gallery." There is no rail and no context line.
- Typography carries the page with confidence. Do not apologise with a fake shelf.

**A maker's gallery (phone)**
- Name at 56 px, weight 300. City at 15 px sans. The practice note at 22 px serif roman, about
  34ch, not italic.
- Then works in a single full-width column on the phone, each at its own aspect, with 48 px between
  works. Captions are the title at 17 px serif, with the price or "Sold" at 14 px sans.
- Contact (WhatsApp, filled) at the foot of the page and pinned once the visitor has scrolled past
  the first work.
- **Removed:** the "MAKER" eyebrow and its square, "— Practice", "In Anika Rao's words",
  "— 6 works", and the maker name repeated under each tile.

**A work page (phone)**
- Image full-bleed up to 70 vh, swipeable, with a 2 px segmented progress line beneath it.
- Title 40–44 px. One byline. Price.
- The process note at 19 px serif directly below, with no "About this work" lead.
- Dimensions in 13 px mono, the only mono on the page.
- A pinned bottom bar, "Message Anika on WhatsApp", in filled ink, 56 px tall.
- **Removed:** the header title, "confirmed N days ago", the "The maker" block, "The gallery, 6
  works →", and the tab bar.

**Real references to study.** David Zwirner and Hauser & Wirth: full-bleed image first, the name
as the headline, almost no labels. Experimenter (Kolkata) and Chemould Prescott Road: artist name
set as the page's only large type. The New Craftsmen (London): maker pages for craft objects, with
the object large and captions minimal. Do not copy their layouts. Copy their discipline: one
image, one name, one voice, and nothing said twice.
