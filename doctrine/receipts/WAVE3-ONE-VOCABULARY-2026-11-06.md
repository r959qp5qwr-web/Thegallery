# Wave 3 — one vocabulary — 2026-11-06

Governor instruction: "Yes." to start Wave 3 after Wave 2 went live. Scope: the design review of
2026-11-06 ("One vocabulary, said plainly", its word table and canonical terms) and
`PRODUCT_STATE.json` `design_review_2026_11_06` R3 (shown labels "By enquiry" / "Not for sale";
stored `enquire` / `on_view` unchanged).

Branch `claude/wave3-one-vocabulary`, from `388f914` (Wave 2 live). Nothing merged or deployed by
this receipt.

## What Wave 3 changes

| Today | Now | Where |
|---|---|---|
| Status "Enquire" | **By enquiry** | `STATUS_LABEL` in `src/lib/format.ts`; every surface reads it |
| Status "On view" | **Not for sale** | same |
| Status options hand-written in two forms | All three pickers read `STATUS_ORDER` + `STATUS_LABEL` | `WorkLabelFields.tsx`, `studio/works/[id]`, Studio picker sheet |
| "3 images" under the strip | **1 of 3**, following the swipe (`ImageCount`, measured on arrival, scroll and resize) | work page |
| Contact routes, Add a route, Kind, The route, "… route" in notices and screen-reader names | **Ways to contact you**, Add a way to contact you, Way to contact, Number or address, plain notices | Studio, contact page, privacy page, actions, `validateRoute` |
| Identity (Studio link, page, notices) | **Your details** | Studio, details page, actions |
| This door is not yours | **Only the operator can open this page** | operator page |
| "Your gallery is live at" | **on view at** (on view = published) | Studio |
| "come off view" on account closure | **is / are retired** (closure retires, migration 002) | account page |

Shared names: the status words have one home (`format.ts`). Two forms used to hand-write the
options; all three pickers now read from that home.

New copy beyond the review's table, for the governor to read:
- "Nothing has been actioned." → "No actions recorded yet."
- "This form went stale…" → "This page is out of date. Reload it and publish again."
- "Closing is not a dead button. It does this, now:" → "Closing takes effect at once. It does this:"
- "Length beats punctuation." → "A longer password is stronger than one full of symbols."
- "…or it may have been withdrawn." → "…or it may no longer be shown."
- "For makers" → "For Makers" in three places, matching the navigation that a journey pins.

Already done in Wave 1, so not changed here:
- "Contact The" → full studio/collective name (`shortName`).
- "Take this work off view" → "Retire this work…" (held by e2e/04).

`public/gallery/tokens.css` and `system.css` are unchanged and byte-identical to
`ux/reference/interface/` (`cmp`). No CSS change.

## SEEN

- **Journeys**, run against the test project. The server was serving build
  `jlSNMqzE1esE2Ev2xuvx1`, and the served page was checked against `.next/BUILD_ID`. Runs were
  serialised, with nothing else running.
  - Phone: **52 passed, 1 skipped** (the check that only applies at 1 280 px).
  - Desktop: **53 passed**.
  - That is 46 existing journeys plus 7 in `e2e/08-one-vocabulary.spec.ts`. Each new journey
    fails if its old word returns on the pages it visits:
    - status words on the work page and on the work's tile;
    - all three pickers, checked for both the shown words and the stored values;
    - no "route" or "identity" on any Studio page, nor in screen-reader names;
    - no "route", "views" or "swipe" on the public pages;
    - account closure says the works are retired;
    - the operator page;
    - "1 of 3" moves to "3 of 3" and back as the strip scrolls.
  - Journeys 02, 03 and 06 were updated to the new text.
- **Accessibility**: axe-core 4.10.2, WCAG 2.0/2.1/2.2 A and AA. 16 states (visitor, maker and
  operator, including both sheets and the remove-confirmation) × 390 (Pixel 7) / 820 / 1 280 px:
  - **48 states, 0 violations**, each with one `h1` and one `main`.
  - First Tab lands on "Skip to content" on every page. Inside an open sheet it lands on the
    sheet's first choice.
- **Reflow**: 15 states at 320 px and at 200 % zoom of a 1 280 px window: **30 checks, 0
  sideways scroll**.
- **Independent review** by a reviewer who did not write the code. Fixed:
  - the tile check in 08;
  - "route" left on the privacy page;
  - two phrasings of the same idea ("a way to be contacted" against "a way to contact you");
  - an unclear error sentence;
  - a bare "Add" button, now "Add this way to contact you";
  - the image count not measured on arrival;
  - a stale comment in 03;
  - the 08 header overstating what it covers.

  Raised for the governor: see Open.
- **Doctrine**: gates 5/5 PASS; drill 89 PASS, 0 RED.
- **Renders**: `doctrine/receipts/wave3/wave3-before-after-{390,820,1440}.png`, 6 surfaces each:
  - work page, Studio, status picker, ways to contact, account closing, operator page as a maker.
  - Before = build `HBnfy9FlDugHI6-OV-vT7`, from `388f914`, served separately. After = build
    `jlSNMqzE1esE2Ev2xuvx1`.
  - Same test project. Monsoon's status was set to `enquire` for the renders and put back to
    `sold` afterwards.

## Incident

- **GAL-L0023.** The long publish journey timed out at 60 s on this build and on the Wave 2 build
  alike. Every request completed, but each act took 3–8 s on the hosted test project.
  - The builder first blamed a build running beside the suite. The control run disproved that.
  - Fix: that one journey's budget is 120 s. No assertion is loosened and no test is skipped.

## NOT SEEN

- Not live. Not deployed. Not seen on a physical phone.
- CI is still red for want of `DOCTRINE_READ_TOKEN`; no CI run is claimed.

## Open (governor)

1. **A price beside "Not for sale" and "By enquiry".**
   - A work stored `on_view` with a fixed price now reads "Not for sale · ₹6,800". A
     `by enquiry` work with a fixed price reads "By enquiry · ₹6,800". With price mode
     On enquiry it reads "By enquiry · Price on enquiry".
   - Only `sold` hides the price today.
   - Hiding the price for `on_view` (keyed on the stored value) is a product decision. No code
     settles it.
2. **"For Makers" or "for makers"** for the section name. The canonical list writes "maker" in
   lower case; the navigation, which a journey pins, says "For Makers". This wave followed the
   navigation.
3. **The URL** stays `/studio/contact-routes`. Only the words a person reads changed.
4. **Reference plates and journey documents** (`ux/reference/interface/surfaces`, `ux/journeys`)
   still carry the old status words in places. They are records, not rendered copy.
