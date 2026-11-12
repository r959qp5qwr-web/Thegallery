# The Gallery: pre-release review brief

Read this before anything else in the pack. It tells you what the app is, how it is built,
which behaviour is intended (so you don't report it as a fault), what is already known to be
weak, and how your findings must be written so they can be merged with other reviewers'.

The pack is a snapshot of one commit. The commit id is in `MANIFEST.txt`. Review that commit only.

---

## 1. What the product is

**The Gallery** (https://atthegallery.in) is a website where makers of art and craft objects
(pottery, textile, wood, metal, paper) show their work. Visitors browse, open a work, see who made
it, and contact the maker directly, mostly on WhatsApp, to buy, commission or ask.

> The Gallery hosts the encounter. The maker owns the transaction.

The site never handles payment, orders, delivery, returns or disputes. It takes no cut. It has no
likes, ratings, reviews, comments, follower counts, ads or paid ranking. These are deliberate
refusals, not missing features (section 5).

**Who uses it**

| Actor | Identity | Can do |
|---|---|---|
| Visitor | none. Saves are kept on the device only | browse, search, open works and galleries, save privately, share links, contact a maker |
| Maker (studio) | email + password account, one gallery per account | profile, WhatsApp number and other contact routes, add/edit/publish/retire works with photos, sign out, close account |
| Operator | separate account with an operator role | take a work down or restore it, suspend or reinstate a maker, with a required reason |

**Audience reality.** Makers and visitors are mostly in India, on mid-range Android phones in
Chrome, often on patchy mobile data, and communicate on WhatsApp. Many makers are not technical.
Aesthetic quality is a first-order requirement: this is a gallery, and the look is the product.

**Status.** Live on the domain. A first real studio is going through sign-up now. Wider public
release is close. Some of the repository's own documents still say "nothing is deployed" or
"hosting: Vercel". Those lines are out of date. **Where a document disagrees with the code, the
code is what ships. Report the disagreement as a finding if it could mislead.**

## 2. How it is built

| Layer | What | Where to look |
|---|---|---|
| App | Next.js 16 (App Router, React 19, TypeScript), server-rendered, server actions for writes | `src/app/**`, `src/components/**`, `src/lib/**`, `src/middleware.ts` |
| Hosting | Cloudflare Worker via `@opennextjs/cloudflare`; auto-deploys the default branch | `wrangler.jsonc`, `open-next.config.ts`, `worker-entry.ts`, `next.config.ts` |
| Data | Supabase Postgres, all objects in schema `gallery`, reached through PostgREST with `@supabase/supabase-js` | `src/lib/supabase.ts`, `src/lib/queries.ts` |
| Authorisation | **There is no service-role (server secret) key anywhere in the app.** The server uses the public *publishable* key plus the signed-in user's session. Every protection is a Postgres row-level-security policy, a grant, a view that omits private columns, or a `SECURITY DEFINER` function | `db/migrations/001..004_*.sql` (`db/supabase-schema.sql` is the same, generated) |
| Auth | Supabase Auth, email + password, email confirmation and password reset through the app's own routes (`/makers/confirm/{token}`, `/makers/reset/{token}`) with the token hash. Live email goes out through Resend as Supabase custom SMTP | `src/lib/auth.ts`, `src/app/actions/account.ts`, `src/app/makers/**` |
| Images | Upload in a server action; JPEG decode/resize/re-encode in WebAssembly inside the Worker; EXIF stripped; variants served through `/img/{id}/{variant}` from Supabase Storage bucket `gallery-images` | `src/lib/storage.ts`, `src/lib/images.ts`, `src/app/img/**`, `src/lib/wasm/*` (codec blobs omitted from the pack) |
| Styling | Design tokens and a system sheet (fixed, approved), plus an app layer | `public/gallery/tokens.css`, `system.css`, `app.css` |
| Tests | 16 Playwright journeys at phone (390 px) and desktop widths against a separate **test** Supabase project; journey 14 checks every page against rules from past corrections (`ux/APP_RULES.json`); journey 15 measures every screen state against a numeric interface standard (`ux/INTERFACE_PROFILE.json`); permission probes in `tests/policy` | `e2e/**`, `tests/**` |

The publishable key and Supabase URL in `wrangler.jsonc` are public by design. Assume an attacker
has them and can call PostgREST and Storage directly, bypassing the app entirely. **The database
policies are the security boundary, so test them as if the app did not exist.**

## 3. The main flows

**Maker:** `/makers` → `/makers/create-account` (email, password ≥ 10) → `/makers/check-email` →
email link `/makers/confirm/{token}` → `/studio/join` (name, place, how you work) →
`/studio/whatsapp?join=1` (WhatsApp number with country code) → `/studio` → `/studio/works/new`
(photo, title, material, status, price type and amount, medium, size, year, about) → Publish →
public work page `/work/{token}` and gallery `/m/{handle}`.
Also: sign in, reset password, edit profile and contact routes, edit/retire works, close account.

**Visitor:** `/` (one featured work at scale, then recent work) → `/browse/{material}`, `/search`,
`/work/{token}`, `/m/{handle}`, `/saved`; contact sheet on a work: a fixed disclosure sentence, then the
maker's routes (WhatsApp, email, call, website).

**Operator:** `/operator`, `/operator/makers/{id}`: take down, restore, suspend, reinstate.

## 4. What "correct" means here

Product promises the code must keep (from `doctrine/PRODUCT_STATE.json`, `promise_table`):

- P-01 You can contact the maker directly from a work or gallery.
- P-02 / P-03 No payment, order, shipping, return or dispute handling; no percentage taken.
- P-04 No public likes, ratings, reviews, comments or follower counts.
- P-05 / P-11 Work information and status are the maker's own statement, shown as such.
- P-06 Browse, open and share without an account.
- P-07 Makers sign up and sign in with email; can confirm, reset, sign out and close the account.
- P-08 The sign-in email stays private unless the maker publishes it as a contact route.
- P-09 Saves are private and never become a public count.
- P-10 A shared link returns to the exact work or gallery.
- P-12 Draft, retired, taken-down or suspended work is not public.
- P-15 Before contacting a maker, the visitor is told payment, delivery, returns and disputes are arranged with the maker.
- P-16 The site never says a maker or work is verified, vetted, certified, safe or authentic.
- P-17 Images keep their orientation, crop, order and usable quality.
- P-18 Only the maker can change their gallery, works and contact routes.
- P-20 An exact address appears only if the maker enters it for that purpose.

Authorisation rule (GAL-A1): anonymous users read only public, published material; a maker changes
only their own records; Maker A can never read Maker B's drafts or private fields.

Non-disclosure: the sign-up, sign-in and reset screens answer the same whether or not an email has
an account. That is intended.

`product/PRODUCT_ARCHITECTURE.md` §8 lists the failure states the design intended (publish fails
with nothing lost, duplicate tap creates one work, expired link has a named state, and so on).
**Several were designed but may not be built. Checking each intent against the code is part of
the review.**

## 5. Intended behaviour: do not report these as faults

- No cart, checkout, payment, shipping, reviews, likes, follower counts, ads, in-app chat, social or phone login (refusals GAL-R01 to R13).
- No service worker or offline cache (GAL-R15).
- No visitor accounts. Saves are device-local.
- The Gallery names no city of its own. Makers state their own place.
- Workshops are hidden until the first workshop exists.
- Footer reads "The Gallery · About" only. There is no separate Privacy link in the footer; privacy is on the About screen.
- The contact-sheet disclosure sentence is fixed wording (GAL-C1).
- Tiles show every work status except "Available". No price is shown beside "Sold" or "Not for sale".
- Price display "On enquiry" (price) vs "By enquiry" (status) is a known open decision. Mention it once at most.
- Fixed design tokens: type, spacing, colour (paper `#F8F3EA`, ink `#221E1A`, amber `#A5501F`). You may report a real legibility or contrast failure, but not a taste preference.

You may still argue that a refusal or intended behaviour is a risk. Put that under severity
"Advisory" and say why.

## 6. Already known: rank these, don't rediscover them

| # | Known weakness |
|---|---|
| K1 | A double tap or retried Publish can create the same work twice (no server-side create key). |
| K2 | Email security scanners that pre-open links can spend the one-time confirmation/reset link before the person taps it. |
| K3 | Only JPEG uploads are read. iPhone HEIC photos, PNG and screenshots fail. Uploads over 12 MB fail and may lose the label text typed. |
| K4 | No report route for visitors yet (designed in the architecture, not built). |
| K5 | Whether a live operator account exists is unknown, so taking down abusive content on the live site may not be possible today. |
| K6 | Supabase auth-email rate limit and Resend plan limits on live are unknown. |
| K7 | CI is red on every pull request because one repository secret is unset. Local gates are the only checks run. |
| K8 | Non-text contrast (WCAG 1.4.11) is not measured. |
| K9 | Publish takes up to about 10 s on the test project. Live time is unknown. |
| K10 | The live database is assumed to match `db/migrations`, but nobody has checked it directly. A reviewer can't confirm this from the pack; say what you would check. |

## 7. Your scope

Review everything a release could break, including:

1. **Security and privacy.** RLS policies, grants, views, `SECURITY DEFINER` functions (search path, owner checks, found-guards). Direct PostgREST and Storage abuse with the public key. Auth flows and token handling, the session cookie, open redirects, CSRF on server actions, file upload abuse (size, type, decompression bombs, malformed JPEG), image route, enumeration, leaking the sign-in email or private fields, security headers, dependency risk.
2. **Data integrity.** Duplicate or half-written records, races, state machine holes (draft → published → retired → taken down), what happens on account closure, orphaned images.
3. **Correctness and resilience.** Every flow in section 3 including failure paths: slow network, timeouts, Supabase down, expired session mid-edit, back button, refresh after submit, deep links.
4. **Abuse and moderation.** Spam sign-ups, fake galleries, offensive or illegal images, impersonation of a real artist, scraping of WhatsApp numbers, and what the operator can do about each today.
5. **Accessibility and interface.** WCAG 2.2 AA, keyboard, screen reader names, focus, touch targets, small Android phones, slow devices.
6. **Design and content.** Use the screenshots in `03-SCREENS`. Judge against a high-end gallery standard. Look for inconsistency, broken states, copy that is unclear for a non-technical Indian maker.
7. **Performance.** Payload, images, Worker CPU limits for WASM image work, cold start, on 4G in India.
8. **Operations and legal readiness.** Backups and restore, monitoring and alerting, error visibility, incident handling, India's Digital Personal Data Protection Act 2023 (notice, consent, grievance contact, deletion), IT Rules 2021 intermediary obligations (grievance officer, takedown timelines), terms of use, copyright complaints on uploaded art.
9. **Drift.** Documents, product state and code that disagree.

**Do not run active tests against https://atthegallery.in.** It holds a real studio's data. No
sign-ups, no form submissions, no load, no scanning. You may read public pages. Write each
suspected flaw as a hypothesis with exact repro steps; the builder reproduces it on the test
project before anything is fixed.

## 8. How to write findings

Use exactly this structure for every finding, one block each, so three reviewers' lists can be
merged. Findings without a file and line or a precise repro will be ranked last.

```
ID: <your prefix>-<number>        e.g. GEM-001, GRK-001
Title: <one line, specific>
Severity: S1 Blocker | S2 Major | S3 Minor | Advisory
Area: security | privacy | data | correctness | abuse | accessibility | design | content | performance | operations | legal | drift
Where: <file:line, route, or SQL object>
What happens: <the actual behaviour, concretely>
Why it matters: <who is harmed, how badly, how likely>
Repro: <numbered steps a person can follow on a fresh test project>
Evidence: <quote the exact code or SQL lines>
Fix: <the smallest change that removes the cause>
Confidence: High | Medium | Low
Known item: <K1..K10 if it extends one, else none>
```

Severity:
- **S1 Blocker:** data of one person exposed to another, account takeover, a maker's work changed or deleted by someone else, illegal content that can't be removed, a core flow (sign up → publish → contact) broken for many people, legal non-compliance that stops launch.
- **S2 Major:** a core flow broken in a realistic case, data loss, a serious accessibility barrier, abuse with no remedy, a broken state real users will hit.
- **S3 Minor:** cosmetic, rare edge cases, wording.
- **Advisory:** design or strategy opinions, hardening, future risk.

End with: (a) the five findings you would fix first, (b) which areas you could **not** review
from the pack and what evidence you would need, (c) anything in this brief you believe is wrong.

## 9. Pack contents

| File | What |
|---|---|
| `00-READ-FIRST.md` | this brief |
| `01-APP-SOURCE.md` | all application code, SQL migrations and policies, config, styles |
| `02-PRODUCT-AND-TESTS.md` | product architecture and domain model, product state (decisions, refusals, promises), incident ledger, UX rules, all journey tests |
| `03-SCREENS-phone.pdf`, `03-SCREENS-desktop.pdf` | every screen state rendered from the test project with synthetic makers (no real person's art) |
| `04-PROMPTS.md` | the messages the governor uses to start each review |
| `MANIFEST.txt` | commit id, file list with checksums, what was left out and why, secret scan result |

Left out on purpose: compiled image-codec blobs, binary images in the repo, past receipts, and
anything holding a secret or a real person's data. Test-account passwords are replaced with `[redacted]`.
