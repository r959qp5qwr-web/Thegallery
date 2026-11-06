# Wave 1 — trust and access — 2026-11-06

Governor instruction: four design waves, each merged only after the full journey suite passes on
phone and desktop against the test project, an independent review, before/after renders and a
receipt. "Yes." to start Wave 1; "Yes. Please." to continue verification.

Branch `claude/wave1-trust-access` (on `claude/design-decisions`), commits `3a06777` → `0e5f085`.
Nothing merged or deployed by this receipt.

## What Wave 1 changes

| Area | Change |
|---|---|
| Truthful copy | Privacy page states what happens: request logs exist and are short-lived; the sign-in email is kept, private, after closing (`close_account()` does not delete it) |
| Contact (GAL-PR-01) | Contact shown only with a live route; the Studio home shows the "add a contact route" task when none is live |
| Contact intents | Ask about this work / Commission something like this / General enquiry change the WhatsApp text and email subject; the work's title and link travel with them |
| Label after save | `updateWorkLabelAction`: a title, medium or price can be corrected after saving |
| Retire / restore | Retire is confirmed with its consequence; `restoreWorkAction` puts it back; both say they happened only when a row changed, else "Nothing changed" |
| Last image | A published work keeps its last ready image; the delete is scoped to the work the guard checked |
| Destructive acts | Image and route removal confirmed first, in the alarm-fill destructive style (Foundation §7), consequence named; the last live route warns that Contact goes |
| Sign-in | `next` is followed only to a path on this site (`//host`, `/\host` refused) |
| Forms | Refusals sit under their field, `aria-invalid` set, everything typed kept (text, select, checkbox), autocomplete on account fields |
| Structure | One `h1` and one `main` per page, page titles, footer; "Skip to content" lands past the header |
| Sheet | Focus moves in, background inert, Escape closes, focus returns to the trigger |
| Tokens | Border token; focus ring; scroll padding; 44 px targets; reflow; stone-strong `#857A6B` (3.8:1) |
| Vocabulary | Operator log "Suspended · Anika Rao", dates "6 Nov 2026, 4:45 pm"; amber context labels muted; segmented controls (material; Fixed price / On enquiry / Made to order); retired works labelled retired, not draft |

## SEEN

- **Journeys** against `thegallery-test`, fresh server serving build `3wkVdP1JqT4FHahiMTIYv`
  (served page checked against `.next/BUILD_ID` by `e2e/run-hosted.sh`):
  phone **38 passed** (two consecutive runs), desktop **38 passed**. 38 = the 31 existing journeys
  plus 7 in `e2e/06-trust-and-access.spec.ts`, which prove the sign-in redirect refusal, kept
  values on a refused identity save, the restore round trip, the image-removal confirm and
  last-image guard, label correction, the last-route warning and Studio task, and the three
  intents in the handoff link.
- **Accessibility** (axe-core 4.10.2, WCAG 2.0/2.1/2.2 A and AA tags), 14 pages × phone and
  desktop, signed out, as a maker and as the operator: **0 violations**. Every page: one `h1`, one
  `main`, first Tab on "Skip to content" (except `/search`, whose field takes focus on load by
  design).
- **Keyboard**: 20 Tab presses on entrance, browse, work detail, contact sheet and sign-in at both
  widths — every focused element shows the focus ring; the contact sheet holds focus (6 controls).
- **Independent review** (a reviewer that did not write the change): 2 high, 8 medium and 6 low
  findings. All high and medium were confirmed in code; those inside Wave 1's scope were fixed in
  `634bd2a`. One more gap was then caught by the new journey (select reset after a refusal) and
  fixed in the same commit.
- **Doctrine**: `doctrine-orient.py check` PASS; gates 5/5 PASS; drill 89 PASS, 0 RED.
- **Design system**: `public/gallery/{tokens,system}.css` byte-identical to
  `ux/reference/interface/` (`cmp`).
- **Renders**: `doctrine/receipts/wave1/wave1-before-after-{phone,desktop}.png`, 16 surfaces each.
  Before = the live default branch `d7c00a1` built and served separately; after = this build; same
  test data.

## Runs that were not green, kept on the record

| Run | Result | Cause |
|---|---|---|
| Phone, old build, runs 1–2 of the session (first after container start) | 3 failed / 1 failed (sign-in wait timed out; not-an-image upload; a renders cascade) | **Not established.** Supabase auth answered every request in ≤ 1.1 s and showed no rate limiting; 25 isolated sign-ins passed; every later run (8 full runs) passed these journeys. Recorded as an environment flake, not proven. |
| Desktop, new build, first | 2 failed | Journey 06 left "Unfinished Warp" published; the next run's 02 found two works. Fixed in `1dd0f17`. |
| Desktop, new build, second | 2 failed | HTTP 502 from the Supabase Management API to the test helper; the app was not involved. One retry on 502/503/504 for non-insert owner SQL, `0e5f085`. |

## NOT SEEN / carried forward

- **Landmarks**: header and footer render inside `main` (25 pages compose their own header). The
  skip link now passes the header; moving header and footer out of `main` is Wave 2 work.
- **Last image, at the database**: the guard is in the server action only; a maker calling
  PostgREST directly could still delete it. A trigger needs a migration on the live project —
  governor's approval.
- **Governor's call**: "Commission something like this" is offered even when a maker's
  commissions are closed; field-error colour (Foundation §7 says ink, reference CSS uses alarm);
  focus-ring colour (§5 vs §11); a sold work still shows "Price on enquiry" beside Sold (Wave 3).
- **Desktop composition**: every surface is still the phone column centred (Wave 2).
- **Real devices and hand-offs**: no physical phone, no real WhatsApp or mail client opened, no
  email round trip. The live Supabase auth settings (Site URL, redirects, templates) are still the
  governor's task.
