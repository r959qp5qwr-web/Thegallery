# Wave 2 — the room at every width — 2026-11-06

Governor instruction: "Go." to start Wave 2 after Wave 1 went live. Scope from the design review of
2026-11-06 ("The room is missing") and `PRODUCT_STATE.json` `design_review_2026_11_06` (R1: image
upload inside Add work). Spec: `ux/INTERFACE_FOUNDATION.md` §2, §4, §7, §9, §10, §11; plate R-3;
journey contract J-003.

Branch `claude/wave2-every-width`, from `336928b` (Wave 1 live). Nothing merged or deployed by this
receipt.

## What Wave 2 changes

| Area | Change |
|---|---|
| Breakpoints | The theme's own 600 / 900 px (`tokens.css`) replace 760 / 1080 in `app.css` |
| Room | Page to 1200 px; the paper grain covers the window; the header's ground and hairline run the full width (border-image outset, painted, never laid out) |
| Navigation | From 900 px the four sections sit in the header beside search (§7); the bottom bar below 900. One "Sections" navigation is exposed at any width |
| Landmarks | Header and footer are landmarks outside `<main>` on every page; the skip link lands on main; a not-found page inside the same landmarks |
| Hang | Two columns from 600 px, three from 900 px; a landscape work spans two, never all; a short row is centred |
| Work detail and entrance | Image beside the wall label (3 : 2 at medium, 7 : 5 expanded); label sticky from 900 px; image to 80vh |
| Studio | Each work's cover on its row; the status chip is a button that opens a picker sheet, applies at once and offers "Marked as … · Undo" (J-003) |
| Add work (R-3, R1) | Images first ("the first is the cover"); grouped label; short fields sized short; an action bar that stays in reach. A draft can start from a picture alone (saved as "Untitled work", refused at publish until titled); a new work starts On enquiry |
| States | Loading on the entrance only (paper-deep at the page's shape); a Studio error page; the bottom bar steps aside while a sheet is open |
| Text measure | Prose ≤ 66ch; Studio forms ≤ 560 px; Studio and operator content in a 760 px column; one side padding from 600 px |

`public/gallery/tokens.css` and `system.css` are unchanged and byte-identical to
`ux/reference/interface/` (`cmp`).

## SEEN

- **Journeys**, test project, fresh server serving build `IqPuDP-80DoMKus9X1xRn` (served page checked
  against `.next/BUILD_ID`; runs serialised by the new lock): phone **45 passed, 1 skipped**
  (the 1 280 px-only sticky check); desktop **46 passed**. 46 = 38 existing journeys + 8 in
  `e2e/07-room-at-every-width.spec.ts`:
  - one Sections navigation per width;
  - landmarks on 12 public pages, 404 included, and the skip link;
  - the window stays screen-sized with no sideways scroll;
  - 404 for an unknown work or material and 307 for a signed-out Studio visit;
  - the label stays put while the page scrolls;
  - the status chip → picker → Undo;
  - a refused image-first save keeps what was typed;
  - a picture-alone draft that cannot be published untitled.
  The phone run used the spec before the sticky check's spacer was added; that check is skipped on
  phone.
- **Accessibility**: axe-core 4.10.2, WCAG 2.0/2.1/2.2 A and AA, 16 states × 390 (Pixel 7) / 820 /
  1 280 px, including the status sheet and the work editor, as visitor, maker and operator:
  **48 states, 0 violations**. Every state: one `h1`, one `main`, first Tab on "Skip to content"
  (on `/search` the field takes focus on load by design).
- **Reflow**: 13 pages at 320 px and at 200 % zoom of a 1 280 px window — no sideways scroll.
- **Keyboard**: every focused element on entrance, browse, work, contact sheet and sign-in shows
  the ring, phone and desktop.
- **Pixels**: header hairline present at x = 40, 700, 1 400 at 1 440 px and across a phone.
- **Independent reviews**, two, by reviewers who did not write the code:
  - The first found 12 defects. All in Wave 2's scope are fixed; the carried items are below.
  - The second confirmed those fixes and found 8 more. The header hairline, the Status select, the
    URL-text plant, the `:has` fallback, the not-found landmark and the test gaps are fixed; three
    owner decisions are listed below.
- **Doctrine**: gates 5/5 PASS; drill 89 PASS, 0 RED.
- **Renders**: `doctrine/receipts/wave2/wave2-before-after-{390,820,1440}.png`, 7 surfaces each.
  Before = live default branch `336928b` built and served separately; after = this build; same test
  data.

## Runs that were not green, kept on the record

| Run | Result | Cause |
|---|---|---|
| Phone, first Wave 2 build | 5 failed | `overflow-x: clip` on `<html>`: phones sized the viewport to the whole page and taps missed (GAL-L0021); fixed |
| Desktop old build + phone new build | void | the two runs overlapped on the test project (GAL-L0020); the runner now takes a lock |
| One run | lost | the container restarted; the run was repeated |
| Phone and desktop, loading-state build | 1 failed each | a loading boundary sent 200 instead of 404 for a foreign work (GAL-L0022); loading kept on the entrance only |
| Desktop, second-review build | 1 failed, 3 did not run | the sticky check could not scroll a one-image page; the check now adds a spacer, and the full desktop suite was rerun |

## NOT SEEN / carried forward

- **Governor's call:**
  - Decision R1 is implemented as "the draft is saved when Save is pressed with an image, without a
    title". A literal reading would save the moment an image is chosen, which needs script.
  - §4 ("two-column work detail from 900 px") and §10 ("medium: image 60 % beside the label")
    disagree. §10 was followed for the columns; sticky starts at 900 px as §10 says.
  - The "Untitled work" sentinel blocks publishing a work deliberately named so.
  - An image over the 12 MB body limit lands on the Studio error page and the typed label is lost.
  - The status picker on drafts (J-003 §7) and the "confirmed … ago · Confirm" line (J-003 §6, and
    Wave 4 status freshness) are not built.
- **Needs a live migration**, governor approval: enforce "no untitled publish" and "a published work
  keeps its last image" in the database, not only in server actions.
- **Not built**: the medium Studio list-detail and the expanded operator list-detail (§10). §14
  already defers the expanded operator surfaces.
- **Image formats**: only JPEG is read (`storage.ts`), while the picker accepts `image/*`. The
  failure is reported, not prevented. Wave 3 or later.
- **Real devices**: no physical phone or tablet; no iOS safe-area or a browser without `:has` seen
  live.

## Merge — governor override of an unverifiable CI check

PR #5's "Orientation, gates and drill" check was red for the same reason as PR #4: the repository
secret `DOCTRINE_READ_TOKEN` is not set (`doctrine/EXTERNAL_ENABLEMENT.md` item 2). The job stops
before reading the Doctrine and verifies nothing (log seen, job 127870391509). The Cloudflare
build check was green. Presented with this, the governor chose to merge ("Yes", 2026-11-06). The
evidence for the merge is the local record above.
