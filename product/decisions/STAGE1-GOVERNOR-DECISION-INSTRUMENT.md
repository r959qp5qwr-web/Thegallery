# Governor decision instrument — Stage 1 (2026-09-04)

Lettered options, one recommendation each, and the consequence of rejecting it (Canon: never an open question). Only the **STRATEGIC** items need the governor's ruling before Stage 2. Product recommendations and ordinary decisions are recorded as decided and are reversible; they are listed so nothing is settled silently. IDs refer to `doctrine/PRODUCT_STATE.json`.

## A. Strategic decisions — ruling required

### GAL-OD-01 · Working name
- A. Ratify **The Gallery** as the product name and machine-readable identity (`thegallery`). **RECOMMENDED**
- B. Rename before Stage 2.
- C. Defer the name and keep "The Gallery" as a working title.
**Consequence of rejecting A:** every render, copy string, route and fixture carries the name; a later rename is a governed sweep, cheap now and expensive after launch. C leaves a name the product wears anyway without being locked.

### GAL-OD-02 · Account boundary
- A. Individual makers only.
- B. **Makers, studios and collectives presenting work they created or materially produced.** **RECOMMENDED** (research brief D1-B; the domain model carries `kind`).
- C. Makers, galleries, retailers and cultural organisations.
**Consequence of rejecting B:** A excludes collective craft, which is common in the target context; C admits resale and turns the product into a listing platform, contradicting GAL-T1.

### GAL-OD-03 · Admission
- A. Open email account creation, self-declaration at gallery creation, published participation rules, post-publication moderation with report, takedown, suspension and reinstatement; no verification claim. **RECOMMENDED**
- B. Pre-publication review of the first work by the operator.
- C. Invitation-only launch cohort with A's mechanism thereafter.
**Consequence of rejecting A:** B installs a taste gate the operator is forbidden to hold (GAL-14) and makes the founder a blocking step in every first publish; C is compatible with A and can be layered on later without changing the mechanism.

### GAL-OD-04 · Launch geography
- A. Bengaluru as demonstration content and first real makers; geography configurable; no public "Bengaluru-only" or "India-wide" claim until ruled. **RECOMMENDED**
- B. India-wide from day one with city as a free field.
- C. A single-city product with city-locked discovery.
**Consequence of rejecting A:** B dilutes the first cohort and the Nearby question returns before location data exists; C hard-codes a boundary the domain model would then have to enforce.

### GAL-OD-06 · Contact routes
- A. Maker chooses any of WhatsApp, public email, phone, website, external form; a route is required before contact is advertised but not before publishing; account email stays private; no in-app chat. **RECOMMENDED**
- B. At least one route required to publish at all.
- C. Platform-relayed enquiry form as the only route.
**Consequence of rejecting A:** B blocks the one-sitting first publish for a maker who wants to add routes later (J-002 keeps the task visible instead); C makes the platform the intermediary and creates a moderation and privacy duty it has refused (GAL-R04).

### GAL-OD-09 · Social depth
- A. Private device-local saves only in the MVP; count-free following and low-volume notices as a Stage 3+ candidate requiring an optional visitor identity decision. **RECOMMENDED**
- B. Following in the MVP with a visitor account.
- C. No saves at all.
**Consequence of rejecting A:** B introduces a visitor identity, notification substrate and privacy surface before the core chain is proven; C removes the visitor's only memory and weakens return visits.

### GAL-OD-12 · Identity confirmation
- A. Deferred beyond the MVP; no badge, no vocabulary; the constraints in GAL-RC5 bind any reopening. **RECOMMENDED**
- B. Build a manual identity confirmation in the MVP.
**Consequence of rejecting A:** B needs review, privacy, renewal, appeal and revocation mechanisms before any badge may appear; none exist, so the badge would be a promise without a mechanism.

### GAL-OD-13 · Revenue and plan limits
- A. No monetisation implementation in the MVP; the presentation architecture stays subscription-ready (one gallery per maker, works and collections capped only by a configurable limit); plan limits decided with monetisation. **RECOMMENDED**
- B. Free and Studio plans implemented in the MVP.
**Consequence of rejecting A:** B adds billing, entitlements and limit enforcement before a single maker-to-visitor chain is proven; the Doctrine's admin-before-value scar.

### GAL-OD-15 · Moderation standard
- A. Publish a minimal standard before launch: five report categories (impersonation · prohibited or unlawful content · spam or systematic misuse · prohibited resale · safety concern); an intent, not a promise, on response time; every sanction reversible with a recorded reason; appeal by email to a published address. **RECOMMENDED**
- B. No published standard; operator discretion.
- C. A full policy document with response-time guarantees.
**Consequence of rejecting A:** B leaves the operator's authority unbounded and unexplained (GAL-14 needs a named standard); C makes promises the founder cannot keep alone.

## B. Product recommendations — decided and recorded, reversible

| ID | Decision taken at Stage 1 | Reason | Reversal cost |
|---|---|---|---|
| GAL-OD-05 | Entrance: one featured work rotated deterministically per day from the last thirty days across makers; then newest-first work interleaved by maker; materials; upcoming workshops | explainable in one sentence; no taste ranking; no engagement input | low |
| GAL-OD-07 | Price modes exact · enquire · made to order; amount required only for exact; status shown beside price; commissions carry a maker note, never a price | no false precision; maker-authored | low |
| GAL-OD-08 | Saves are device-local; no server table | no counts, no identity | low |
| GAL-OD-10 | One Gallery system; the `galleries` entity is separate from `makers` so 3–5 presentation modes can arrive later | avoids a rewrite later without building modes now | low |
| GAL-OD-11 | Workshop handoff: a contact route or an external registration URL; no ticketing | GAL-04 | low |
| GAL-OD-16 | Email + password + confirmation + reset as the door; an emailed code is the fallback design if the deployed walk shows the password flow failing | commission recommendation; Canon prefers a code only when links fail in the field | medium (form change) |
| new: GAL-PR-01 | A gallery may publish without a contact route; contact is simply not advertised and Studio shows the task | keeps first publish to one sitting; GAL-03 holds because no path is offered until a route exists | low |
| new: GAL-PR-02 | Sold and on-view works remain visible in Browse and the maker's gallery with their status; only retirement removes a work | a gallery shows sold work; status truth is the promise, not availability filtering | low |
| new: GAL-PR-03 | A status unconfirmed for 90 days is labelled publicly and prompts the maker; nothing is auto-retired | honest staleness without the platform inventing state | low |

## C. Ordinary implementation — decided

| Decision | Choice |
|---|---|
| GAL-OD-14 delivery surface | mobile-first responsive web; installability optional; no service-worker fetch handler |
| Stack | Next.js (App Router, TypeScript) on Vercel; Supabase (Postgres/RLS, email auth, Storage); provider transactional email on the product's domain; Playwright journeys; GitHub Actions |
| Typefaces | Newsreader (editorial serif), IBM Plex Mono (utility), IBM Plex Sans (functional), self-hosted, OFL |
| Fixtures | five synthetic makers (see `product/DOMAIN_MODEL.md` §7); Anika Rao and Dhaaga Studio for the Stage 2 slice |

## D. What Stage 1 did not decide
Nothing in sections B or C changes product meaning, user rights, money, identity promises, privacy or moderation authority. Anything the governor considers to cross that line is reopened here on request.
