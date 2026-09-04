# The Gallery — Domain and state model (Stage 1)

**Status:** DRAFT for governor review · **Date:** 2026-09-04 · Names may change in implementation; the distinctions may not (commission §6). One concept has one authoritative home.

## 1. Entities

| Entity | Home | Essential fields | Owner | Notes |
|---|---|---|---|---|
| Account | auth users | id, email (private), access_state, created_at | the person | Authentication only. Never the public identity (GAL-P1). |
| Maker | `makers` | id, account_id (unique), handle (unique, lowercase, immutable after first publish), display_name, kind (individual · studio · collective), city, region, country, exact_address (nullable) + exact_address_public (bool), practice_note (maker-authored), commissions_open (bool), commissions_note, status (active · suspended · closed), status_reason (operator, private) | maker | Public view omits account_id, exact_address unless public. |
| Gallery | `galleries` | id, maker_id (unique in MVP), lifecycle (draft · published · hidden · closed), published_at, intro (maker-authored), work_order_mode (manual) | maker | 1:1 per maker in the MVP; kept separate so institutional/collective galleries and 3–5 presentation modes can arrive without rewriting works. |
| Work | `works` | id, public_token (short, stable), gallery_id, title, material (enum from vocabulary), medium (text), process (text, optional), dimensions {height, width, depth, unit}, year (nullable), price_mode (exact · enquire · made_to_order), price_amount, price_currency, status (available · made_to_order · enquire · sold · on_view), status_confirmed_at, lifecycle (draft · published · retired), published_at, retired_at, position, alt_text_default | maker | Lifecycle and status are separate columns (commission §6). |
| Work image | `work_images` | id, work_id, position, storage_key (original), width, height, focal_x, focal_y, alt_text (maker-authored, nullable), variants {w320, w640, w1280, w1920}, state (uploading · ready · failed) | maker | Originals retained; variants derived; EXIF stripped on ingest. |
| Collection | `collections` | id, gallery_id, title, note, position, lifecycle (draft · published · retired) | maker | Exhibition logic. |
| Collection work | `collection_works` | collection_id, work_id, position | maker | Unique (collection_id, work_id). |
| Contact route | `contact_routes` | id, maker_id, kind (whatsapp · email · phone · website · form), value, label (optional), enabled (bool), validated (bool), position | maker | Rendered as an action only when enabled AND validated. |
| Workshop | `workshops` | id, public_token, maker_id, title, description (maker-authored), starts_at, ends_at, timezone, venue_name, city, venue_address (nullable) + venue_address_public, price_text (nullable), registration_mode (contact_route · external_url), registration_route_id / registration_url, lifecycle (draft · published · cancelled · completed · archived), cancelled_reason (maker-authored, public) | maker | Dates structured, never decorative text. |
| Save | device storage | work public_token, saved_at | visitor | No server table in the MVP (P-09, GAL-OD-08). |
| Report | `reports` | id, subject_type (work · maker · workshop · collection), subject_id, category (impersonation · prohibited_content · spam_or_misuse · prohibited_resale · safety · other), note, reporter_contact (optional), lifecycle (submitted · under_review · actioned · dismissed · closed), created_at, idempotency_key | reporter (write once) | Operator owns the lifecycle. |
| Operator action | `operator_actions` | id, actor_account_id, action (take_down · restore · suspend · reinstate · dismiss_report · close_report · vocabulary_change), subject_type, subject_id, reason (required), created_at, supersedes_action_id (nullable) | operator | INSERT-only; corrections supersede. |
| Material category | `material_categories` | key, label, position, active | operator | Seeded: clay, textile, wood, metal, paper. |
| Operational failure | `operational_failures` | id, kind (auth · publish · image · contact · email), subject, detail (no private conversation content), created_at, resolved_at | system → operator | Operator inspection, not user conduct. |

## 2. State machines

### 2.1 Account access
`awaiting_email_confirmation → active → suspended ⇄ active → closed`

| Transition | Who | Guard | Consequence |
|---|---|---|---|
| create → awaiting | person | valid email, password policy | confirmation email sent; no maker record yet |
| awaiting → active | person via link | unexpired token | Studio opens on set-up steps |
| active → suspended | operator | reason required; audit row | maker's gallery, works, workshops absent from public; Studio read-only; sign-in states the suspension and appeal route |
| suspended → active | operator | reason required; audit row | public presence returns exactly as it was; history intact |
| active → closed | maker | confirmation naming the consequence; not suspended | gallery closed; works retired; public routes end at "no longer shown"; account email retained only as long as legally required (privacy page states the real retention) |

### 2.2 Gallery
`draft → published → hidden → closed`, with `hidden` reachable by the maker (temporarily unpublish everything) or by suspension (derived, not written). Publish requires: maker profile complete (display name, kind, city) and at least one enabled validated contact route — or the gallery publishes without advertising contact (state named publicly, task shown in Studio). Decision: **publish is allowed without a route; contact is simply not advertised** (keeps first publish possible in one sitting; GAL-03 holds because no contact path is offered until a route exists).

### 2.3 Work lifecycle and status
Lifecycle: `draft → published → retired` (retire is reversible to published while the gallery is published; a retired work keeps its URL with a truthful ending).
Status (separate): `available · made_to_order · enquire · sold · on_view`, each maker-set; `status_confirmed_at` updated on every status write and by explicit reconfirmation; public surfaces label a status unconfirmed for 90 days.

| Transition | Who | Guard | Consequence |
|---|---|---|---|
| draft → published | maker | gallery published or publishing together; ≥1 image `ready`; title, material, price_mode, status present; maker active | appears in entrance, Browse, search, maker gallery, collections within one request; share preview live |
| published → retired | maker | confirmation | absent from discovery and search; URL renders "no longer shown"; saves keep it labelled |
| retired → published | maker | as draft → published | returns |
| status change | maker | maker active; work not draft | every surface reads the one column; `status_confirmed_at` set |
| reconfirm status | maker | — | `status_confirmed_at` set; label clears |

### 2.4 Work image
`uploading → ready | failed`; ordering by position; a work publishes only when at least one image is `ready`; a failed image never blocks the others.

### 2.5 Workshop
`draft → published → cancelled | completed → archived`. `completed` is derived from `ends_at` passing (rendered as past) and confirmed by archive; `cancelled` carries a maker-authored reason and remains visible as cancelled until archived; a changed registration destination is a plain update with `updated_at` shown.

### 2.6 Report and sanction
`submitted → under_review → actioned | dismissed → closed`. Every `actioned` row references the operator action that resolved it; take-down has restore; suspension has reinstatement; nothing terminal lacks a recorded reason.

### 2.7 Contact route
`entered → validated (format) → enabled` / `disabled`. A route renders as an action only when enabled and validated; WhatsApp is E.164 → `wa.me` link; phone is E.164 → `tel:`; email is a public address → `mailto:` with a prefilled subject naming the work; website and form are https URLs opened in a new context.

## 3. Visibility rules (what is public when)

An object is public only when every ancestor is public: work published ∧ gallery published ∧ maker active. Public views are database views that apply this predicate and omit private columns; discovery, search, share previews, sitemaps and saved-item refreshes all read the same views. Draft, retired, hidden, taken-down and suspended objects are absent from public payloads.

## 4. Substrate invariants

- `makers.account_id` unique; `makers.handle` unique, lowercase, regex-checked; `galleries.maker_id` unique (MVP).
- `works.lifecycle`, `works.status`, `works.price_mode`, `workshops.lifecycle`, `reports.lifecycle`, `contact_routes.kind` as enums or CHECK constraints; `price_amount` required iff `price_mode = exact`.
- Partial unique index on `work_images (work_id, position)`; on `collection_works (collection_id, work_id)`.
- `operator_actions.reason` NOT NULL and non-empty; table INSERT-only via grants (no UPDATE/DELETE for any role).
- `reports.idempotency_key` unique; publish and workshop creation take a client idempotency key.
- Status and lifecycle writes go through transition functions that re-read the row after locking and predicate the write on the current state.
- Every user-settable field is read by at least one surface (written-never-read is a defect): `alt_text` → image alt; `commissions_note` → maker gallery and handoff; `venue_address_public` → workshop detail; `exact_address_public` → maker gallery.

## 5. Identifiers

Stable UUIDs internally; a short `public_token` for works and workshops in URLs; the maker `handle` in URLs. Behaviour never keys on display copy; statuses and kinds are tokens rendered through the governed copy home.

## 6. History

`operator_actions` is the only history table in the MVP and it is append-only. Maker edits overwrite their own current record (works are not versioned in the MVP); retire does not delete; closure retires rather than deletes; a sanction never rewrites the underlying record.

## 7. Synthetic personas (fixtures, no real person)

| Persona | Kind | Material | City | Purpose |
|---|---|---|---|---|
| Anika Rao | individual | clay | Bengaluru | Maker A: the Stage 2 slice maker (already the persona of the approved landing reference) |
| Dhaaga Studio | collective | textile | Bengaluru | Maker B: isolation tests; collective kind |
| Tarun Pillai | individual | wood | Mysuru | Stage 3 discovery fixtures (second city) |
| Kabir Lohar Works | studio | metal | Bengaluru | Stage 3 fixtures |
| Folded Hours | studio | paper | Bengaluru | Stage 3 fixtures; workshop publisher |

All names, places and works are invented; addresses, phone numbers and emails in fixtures use reserved test values only.
