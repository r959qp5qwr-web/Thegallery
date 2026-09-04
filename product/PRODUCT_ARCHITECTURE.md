# The Gallery — Product architecture (Stage 1)

**Status:** DRAFT for governor review (Stage 1 gate) · **Date:** 2026-09-04 · **Governed by:** `doctrine/DOCTRINE_BINDING.json`; product law lives in `doctrine/PRODUCT_STATE.json` and is cited here by ID, never restated as new law.

## 1. The product, restated without change

The Gallery is a maker-led digital gallery for art and craft objects: makers present their own work with the dignity of an exhibition; visitors discover the object, understand who made it, and approach the maker directly to buy, commission or learn; payment, delivery, returns and disputes stay outside the product (GAL-T1). *The Gallery hosts the encounter. The maker owns the transaction* (GAL-T2).

Fixed boundaries this architecture obeys: GAL-01 to GAL-16, GAL-D1, GAL-D2, GAL-C1, GAL-P1, GAL-P2, GAL-A1. Refusals GAL-R01 to GAL-R22 are absent from the design, not disabled in it.

## 2. The nested-gallery system map (GAL-M1)

```text
SHARED GALLERY  ──────────────────────────────────────────────────────────────────────
  Entrance (Browse)   Material rail   Search   Workshops programme   Saved (private)
        │                                                     │
        ▼                                                     ▼
MAKER'S GALLERY  ─────────────────────────────────────  WORKSHOP
  identity · practice note · collections · works          date · place · registration route
  commissions open? · upcoming workshops · contact         │
        │                                                     │
        ▼                                                     │
WORK  ────────────────────────────────────────────────────   │
  images at scale · gallery label · status · price/enquire   │
  Save · Share · Contact maker ─────────────┐                │
                                            ▼                ▼
HANDOFF  ──────────────────────────────────────────────────────────────────────────────
  intention (buy · commission · learn · ask) → disclosure (GAL-C1) → the maker's own route
  (WhatsApp · public email · phone · website · external form).  Nothing follows in-product.
```

| Physical gallery idea | Product translation | Surface |
|---|---|---|
| Building / district | The shared discovery environment | Browse, Search, Workshops |
| Room | A maker-owned gallery | `/m/{handle}` |
| Work on wall or plinth | One object at meaningful scale | `/work/{id}` |
| Wall label | Title · maker · material · medium · dimensions · year · price or enquire · status | Work label block |
| Exhibition | A maker-arranged collection | `/m/{handle}/c/{collection}` |
| Artist statement | Practice note, place, process, in the maker's own words | Maker gallery, practice section |
| Open studio | Commissions open + contact | Maker gallery, work detail |
| Programme board | Upcoming workshops | `/workshops` |
| Visitor notebook | Private saves | `/saved` |
| Invitation card | Share link and preview card | Share action on every public object |

## 3. Actors

| Actor | Identity | Owns in the product | Never |
|---|---|---|---|
| Anonymous visitor | none; device-local saves only | browsing, saving privately, sharing, reporting, choosing to contact | is asked to sign in for public value (GAL-11) |
| Maker | email account → one maker identity → one gallery (MVP) | profile, contact routes, gallery, works, images, collections, commissions note, workshops, account | edits another maker's records; publishes while suspended |
| Operator | separate role on a separate account | reports, takedown/restore, suspend/reinstate, material vocabulary, failure inspection | ranks, features by taste, edits maker claims, sees private commerce (GAL-14, GAL-16) |

There is no registered visitor in the MVP (GAL-R13). A maker browsing the public Gallery is a visitor with a Studio.

## 4. Surface and route inventory

Every public object has one canonical URL that is the truth under any sheet or overlay; sheets add a query segment so a deep link reopens the same state.

### 4.1 Public

| Route | Surface job | Primary action | Major states | Journey |
|---|---|---|---|---|
| `/` | Entrance: one featured work at scale, then recent work, material rail, upcoming workshops | View work | loading skeleton · populated · empty gallery (no published work yet) · offline | J-001, J-006 |
| `/browse/{material}` | Work by material (clay, textile, wood, metal, paper); `?new=1` filter | View work | populated · empty category (names the material) · loading | J-006 |
| `/search?q=` | Search across works and makers | View work / View maker's gallery | idle · results (works, makers) · no result (names the query and filter, offers clearing) · loading · service unreachable | J-006 |
| `/work/{id}` | One work at meaningful scale with its label, status, maker strip | Contact maker | published · retired ("This work is no longer shown"; maker link remains) · taken down · stale status label · image loading/failed | J-001, J-003 |
| `/work/{id}?contact` | Handoff sheet: intention → disclosure → the maker's route(s) | Open route (WhatsApp / email / call / website / form) | routes available · single route · no route configured (state explains, offers maker gallery) · route invalid | J-001 |
| `/m/{handle}` | Maker's gallery: identity, place, practice, collections, works, commissions, workshops, contact | View work / Contact maker | published · hidden/suspended ("This gallery is not available") · empty (no published work) | J-001 |
| `/m/{handle}/c/{collection}` | One collection as an exhibition | View work | populated · empty | J-006 |
| `/workshops` | Programme: upcoming first, then past (separately, truthfully) | View workshop | upcoming · none upcoming · cancelled rendered as cancelled | J-006 |
| `/workshops/{id}` | Workshop detail with date, place, maker, registration route | Contact maker / Register (external) | upcoming · cancelled · completed · past-dated | J-006 |
| `/saved` | Private shelf (device-local) | Open saved work | populated · empty · a saved work now retired (kept, labelled) | J-006 |
| `/report?subject=work:{id}` | Report platform misuse | Submit report | form · submitted (receipt) · submission failed (retry, nothing lost) | J-004 |
| `/makers` | For Makers: what the Gallery is and is not, participation rules, doors | Create account / Sign in | — | J-002 |
| `/about`, `/participation`, `/privacy` | Boundary, participation and privacy information that describes what actually exists | — | — | launch prerequisite |
| `*` (unknown) | Lands on the entrance with a one-line notice | View work | — | total routing |

### 4.2 Studio (maker, authenticated)

| Route | Surface job | Primary action | Major states | Journey |
|---|---|---|---|---|
| `/makers/create-account` | Email + password; explains what will be public | Create account | validation · duplicate email (same wording as success path: "check your email") · service failure | J-002 |
| `/makers/check-email` | Confirmation pending; resend | Resend confirmation | pending · resent · link expired | J-002 |
| `/makers/sign-in` | Email + password | Sign in | denied (single non-enumerating wording) · suspended (named, with the appeal route) · session expired return | J-002, J-005 |
| `/makers/reset` → `/makers/reset/{token}` | Recovery | Send reset / Set new password | sent (same wording whether or not the email exists) · expired token | J-005 |
| `/studio` | Dashboard: gallery status, works with status, quick actions, failures needing attention | Add work | empty (no gallery yet → set-up steps) · draft gallery · published · suspended (read-only, reason, appeal) | J-002, J-003 |
| `/studio/profile` | Maker identity, kind, city, practice note, exact address opt-in | Save | draft · saved · validation | J-002 |
| `/studio/contact-routes` | Public routes with preview of what becomes public | Save | none configured (blocks contact advertising) · enabled/disabled · malformed | J-002 |
| `/studio/works/new`, `/studio/works/{id}` | Add / edit work: images, label fields, status, price visibility | Publish (or Save draft) | draft saved · uploading · partial upload · upload failed · preview · publish failed (nothing lost) · published · retired | J-002, J-003 |
| `/studio/collections` | Arrange collections and order | Save order | — | Stage 3 |
| `/studio/workshops`, `/studio/workshops/{id}` | Publish, update, cancel, archive workshops | Publish | draft · published · cancelled · completed · archived | Stage 3 |
| `/studio/account` | Sign out, close account with named consequence | Sign out / Close account | closure confirmation naming what becomes unavailable | J-005 |

### 4.3 Operator

| Route | Surface job | Primary action | Major states | Journey |
|---|---|---|---|---|
| `/operator` | Protected door (operator role only); queue summary | Open reports | denied for non-operators (same wording as not-signed-in? no: "not permitted" is distinct from "not signed in") | J-004 |
| `/operator/reports`, `/operator/reports/{id}` | Report queue and detail with the public and governed state of the subject | Act (take down / suspend / dismiss / close) with required reason | submitted · under review · actioned · dismissed · closed | J-004 |
| `/operator/makers/{id}` | Maker governed state; suspend / reinstate; history | Suspend / Reinstate (reason required) | active · suspended · closed | J-004 |
| `/operator/vocabulary` | Material categories (active, order, label) | Save | — | Stage 3 |
| `/operator/failures` | Failed publish, image and contact operations (operational log, no private conversations) | Inspect | — | Stage 3 |

## 5. Navigation architecture (GAL-RC2, with the required comparison)

**Chosen:** a four-item bottom bar — **Browse · Saved · Workshops · For Makers** — with search in the global header. For a signed-in maker the fourth slot reads **Studio**; the bar is otherwise identical, so the maker and the visitor share one grammar.

**Compared and not chosen:** (A) *Browse · Search · Saved · Workshops* with "For Makers" demoted to a header link. Search gains a tab but the maker door loses discoverability, and the door is the journey that failed on three prior products. (B) *Browse · Makers · Workshops · Saved*, a "Makers" directory tab. It makes people, not work, a top-level entrance and pulls toward a creator directory; discovery through work is the thesis (GAL-01). The approved candidate keeps work first, the door visible and search global. No journey is weakened.

Back returns to the previous surface; Close on a sheet returns to the underlying URL; Cancel on a dirty form asks before discarding; an unknown route lands on the entrance.

## 6. Discovery model (GAL-09, GAL-10, GAL-D2, GAL-OD-05)

- **Featured work:** one published work from the most recent thirty days, rotated deterministically per day across makers (no maker two days running where more than one is eligible). The label reads *Featured work · {maker's city}*. No editorial taste ranking; when the governor later wants a labelled editorial feature, it is a separate, visibly labelled slot.
- **Recent work:** newest published first, interleaved so no maker occupies adjacent positions. Explainable in one sentence on the surface ("Newest first").
- **Materials:** the five launch categories from the configured vocabulary. *New* is a filter (published within thirty days). *Nearby* does not exist (GAL-R14).
- **Search:** work title, medium, material, collection title, maker name, studio name, city; results in two sections, works and makers; makers shown by name and place, never by counts. Empty results name the query and any active material filter and offer to clear it.
- **Workshops:** upcoming by date; past and cancelled shown separately and labelled.
- Excluded from every discovery input: engagement, saves, contact clicks, payment status. Unpublished, retired, taken-down and suspended objects are absent from all discovery and search responses, not hidden client-side (GAL-A1).

## 7. Access and permission model (GAL-A1, GAL-P1, GAL-P2)

| Object | Anonymous | Maker (own) | Maker (other's) | Suspended maker | Operator |
|---|---|---|---|---|---|
| Published work, gallery, collection, workshop (public view) | read | read | read | read | read |
| Draft / retired / taken-down objects | none | read/write own | none | read own, no write | read (governed view) |
| Maker profile private fields (account email, private address) | none | read/write | none | read | read (logged) |
| Contact routes | read enabled routes only | read/write | none | read | read |
| Work images (originals) | variants only | read/write | none | read | read |
| Reports | create | create | create | create | read/write lifecycle |
| Operator actions | none | read those about own account | none | read own | append |
| Material vocabulary | read active | read active | read active | read active | write |

Enforcement is in the substrate: Postgres row-level security with explicit grants probed separately from policies; public reads through views that omit sensitive columns (absence in the payload, not UI hiding); every state transition through a `SECURITY DEFINER` function with a pinned search path, a found-guard, the owner predicate repeated on the write, an eligibility check of the maker's account state at every door, and an append-only audit insert for privileged acts. The operator role is a separate claim on a separate account and is modelled even while one person holds it. Two synthetic makers exist from the first migration so that A-cannot-touch-B is assertable before any feature.

## 8. Critical failure and recovery map

| Failure | What the person sees | Recovery | Mechanism |
|---|---|---|---|
| Entrance data unreachable | Wordmark, a named "The Gallery can't be reached right now" state, retry | Retry | deadline on the fetch; named state, never blank |
| Image fails to load | Frame keeps its aspect; "Image unavailable" with the label intact | Reload | reserved aspect boxes; per-image error state |
| Search service down | "Search is unavailable" distinct from "no results" | Retry; browse by material | error mapped to copy and destination |
| No contact route configured on a published gallery | Contact action absent; the label says "Contact routes not yet published"; maker sees a Studio task | Maker adds a route | publish gate + derived state on the work |
| Route malformed (bad number/URL) | Never rendered as an active action | Maker corrects in Studio | validation at save; render only validated routes |
| Sign-in denied | One sentence, identical for unknown email and wrong password | Reset | non-enumerating auth response |
| Confirmation link expired | Named state with resend | Resend | token lifetime; resend endpoint |
| Session expires mid-edit | Draft preserved locally; sign-in; return to the same form | Sign in | interrupted-flow state saved and restored |
| Upload fails or is partial | Per-image failed marker; the rest kept; retry only the failed ones | Retry | per-image state; idempotent upload keys |
| Publish fails | "Not published — your work is saved as a draft"; no half-published object | Retry | single transactional publish; never a success message on a failed write |
| Duplicate tap on publish / submit | One work, one report | — | idempotency keys |
| Stale status (unconfirmed 90+ days) | Public label "status last confirmed {n} months ago"; maker prompt to reconfirm | One-tap reconfirm | `status_confirmed_at` |
| Workshop date passed / cancelled | Rendered as past or cancelled, never as upcoming | — | structured dates and lifecycle |
| Maker suspended | Public gallery and works absent; Studio read-only with the reason and the appeal route | Operator reinstates | account state checked at every door |
| Report submission fails | Named failure; the text is kept | Retry | local draft |
| Operator acts without a reason | Action refused | Add reason | reason is a required field in the transition function |
| Unknown route | Entrance with a one-line notice | — | total routing |

## 9. Technical architecture (ordinary implementation decisions, recorded)

| Concern | Decision | Reason |
|---|---|---|
| Application | Next.js (App Router, TypeScript), server-rendered public routes | durable deep links, truthful share previews rendered on the server, one codebase for public, Studio and operator surfaces |
| Data, auth, storage | Supabase: Postgres with RLS, email/password auth with confirmation and reset, Storage for images | the Doctrine's paid-for lessons (RLS is not a grant; SECURITY DEFINER doors; migration VERIFY) transfer directly; managed email door |
| Email | provider-backed transactional email on the product's own sending domain | the deployed email round trip is the first proof (Playbook Stage 4); provider SMTP defaults are rate-limited and unbranded |
| Images | originals retained; delivery variants generated non-destructively at fixed widths; EXIF stripped; maker-set focal point; portrait/landscape/square preserved | GAL-M6 image behaviour; GAL-P2 |
| Hosting | Vercel (preview per branch, production on main) | a live URL early for every real-device walk |
| Caching | HTTP caching on hashed assets only; no service-worker fetch handler | GAL-R15 |
| Migrations | versioned SQL under `supabase/migrations`, each ending in an executing VERIFY block; a probeable handle per behaviour-changing migration | Canon, data & migrations |
| Tests and gates | Playwright journeys through the public doors; adversarial persona probes against the deployed database with the anon and maker keys; static gates (banned vocabulary, route inventory, name sweep, no-invented-content); a drill over the gates | Audit Protocol L-A8 to L-A12 |
| Observability | structured event log for auth, publish, image and contact operations; an operator-readable failures table; no visitor tracking beyond aggregate counts | commission §13, §18 |
| Environments and secrets | local, preview, production; `.env` ignored from commit #1; secrets in the hosting provider | Canon Day Zero #6 |

## 10. Measures that respect the product (GAL-RC7)

Aggregate, server-side, no per-visitor profile: work-detail opens; contact-handoff opens by route kind; publish attempts and failures; image upload failures; active makers with current published work; status reconfirmations; report count and time-to-close. Saves are device-local and therefore not counted server-side; that is the honest cost of P-09.

## 11. Archetype trace (by function, not imitation)

| Reference | Inherited here | Refused here |
|---|---|---|
| PLANBELLA | one governing metaphor (the physical gallery), typography as hierarchy, active white space, colour as annotation, object-like composition, identity that travels (share card) | its fonts, pastel palette, planner marks; delicate type for actions; hidden navigation; beauty before a reliable core |
| Are.na | quiet, non-algorithmic discovery through content and people | obscurity as an excuse for weak search |
| Behance | the work as a substantial primary object with maker connection and process context | appreciation counts, feed gravity, featuring as merit |
| ArtStation | a clear separation between the shared environment and the owned space, improved by making the owned gallery the primary identity | two competing profiles |
| AuthIndia | visible enquiry and external handoff (WhatsApp first) with seller-owned payment | listing presence implying verification; the vendor list as the experience |
| Cara | work-centred profiles and professional discovery | feed mechanics and public scorekeeping |
| Meta Verified | the idea that identity confirmation must be a narrow claim, separated from reach — kept as a deferred candidate | badge as merit, safety, authenticity or rank |
