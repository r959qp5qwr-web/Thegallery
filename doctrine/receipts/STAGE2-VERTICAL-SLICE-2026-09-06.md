# Stage 2 — the vertical slice, built and proved locally, 2026-09-06

**Branch:** `claude/gallery-hook-liveness-verify-bzn5c6` · **Doctrine:** `dfdecb651df8cef5387487fee21d8ee2f798db95`, read-only, unchanged
**Authorised by:** the governor's sequencing decision of 2026-09-06 (`GAL-SEQ-1`, commit `479f363`)

> **Stage 2 implementation complete; deployed proof pending.**
> The single next external boundary is a hosting project with a real domain and a transactional email sender.

---

## 1. What was built

A complete, working vertical slice of The Gallery: Next.js 16 App Router with TypeScript, PostgreSQL 16 with real row-level security, local object storage with derived image variants, and Playwright journeys through the product's own doors.

**Stack deviation, and why.** The approved stack names Supabase for Postgres, RLS, email auth and image storage. **Docker is not available in this environment** (`docker info` fails; there is no daemon), and the Supabase local stack is Docker-only. That is a material incompatibility, so the slice is built on the pieces Supabase itself is made of, arranged the same way:

| Approved | Built | Why it is the same shape |
|---|---|---|
| Supabase Postgres + RLS | PostgreSQL 16 with RLS policies and `SET LOCAL ROLE` per request | The permission model is identical: an `authenticator`-style login role that may only become `gallery_anon` or `gallery_auth`, with policies deciding what each may see |
| Supabase Auth (GoTrue) | Server-side email credentials: scrypt hashes, single-use confirmation and recovery tokens, httpOnly session cookies | Same doors, same states; GoTrue is a service this environment cannot run |
| Supabase Storage | Local object store behind a narrow adapter (`src/lib/storage.ts`) | Swapping it is a change to one file; nothing above it knows where the bytes live |
| Next.js, TypeScript, Playwright | unchanged | — |

Nothing about this deviation is hidden: the environment contract is `.env.example`, and every value in it is local.

---

## 2. The chain, walked in the running product

All eighteen steps of the required journey, through the browser, at phone width.

| # | Step | Where it was proved |
|---|---|---|
| 1 | Maker creates an account by email | `e2e/01` |
| 2 | Email confirmation completed (single-use link) | `e2e/01` |
| 3 | Sign in, sign out, recovery initiated and completed | `e2e/01` |
| 4 | Maker identity and Gallery created | `e2e/02`, `e2e/03` |
| 5 | Public contact routes supplied, separate from the private account email | `e2e/02` |
| 6 | One work with three differently shaped images | `e2e/02` |
| 7 | Preview and publish | `e2e/02` |
| 8 | Anonymous visitor meets the work at the entrance | `e2e/02` |
| 9 | Discoverable through Clay and through search | `e2e/02` |
| 10 | Work opened, then the maker's wider gallery | `e2e/02` |
| 11 | Correct disclosure, then the maker-selected route | `e2e/02` |
| 12 | Available → sold | `e2e/03` |
| 13 | Every public surface follows | `e2e/03` |
| 14 | Operator suspends and reinstates with recorded reasons | `e2e/03` |
| 15 | Maker B cannot read, alter, retire or obtain Maker A's private data | `tests/policy`, `e2e/03` |
| 16 | Draft, retired, taken-down and suspended material absent anonymously | `e2e/03`, `e2e/04` |
| 17 | Account-email privacy survives every public page and payload | `e2e/03`, `tests/policy`, migration VERIFY |
| 18 | Account closure has a truthful consequence | `e2e/03` |

---

## 3. Routes and data mechanisms

**Public:** `/` · `/browse/[material]` · `/search` · `/work/[token]` (`?contact=1` for the handoff sheet) · `/m/[handle]` · `/saved` · `/workshops` · `/about` · `/participation` · `/privacy` · `/makers`
**Studio:** `/makers/create-account` · `/makers/check-email` · `/makers/confirm/[token]` · `/makers/sign-in` · `/makers/reset` · `/makers/reset/[token]` · `/studio` · `/studio/profile` · `/studio/contact-routes` · `/studio/works/new` · `/studio/works/[id]` · `/studio/account`
**Operator:** `/operator` · `/operator/makers/[id]`
**Machine:** `/img/[id]/[variant]` · `/api/saved`

**The permission model is in the database, twice over.**

1. **Grants.** The anonymous role holds **no grant on any base table**. A direct anonymous read of `works` raises `permission denied`, not an empty result a policy bug could turn into rows.
2. **Row-level security.** Every governed table has RLS with explicit policies. The authenticated role reaches only its own maker's rows.

Public reads go through views carrying the visibility predicate from `DOMAIN_MODEL §3` — *work published AND gallery published AND maker active* — written once and read by every surface, the image route included.

The application connects as `gallery_app`: a login role with **no privileges of its own**, which may only `SET ROLE` to `gallery_anon` or `gallery_auth`, inside a transaction that also declares the acting account. Because that connection is not a superuser, RLS actually applies. A pool connecting as the owner would bypass every policy and the isolation proof would be theatre; migration 004 has a VERIFY block that fails if any application role gains `SUPERUSER` or `BYPASSRLS`.

**Transition functions** (`app.publish_work`, `app.set_work_status`, `app.retire_work`, `app.set_maker_access`, `app.close_account`) re-read their row under a lock and predicate the write on the current state. `publish_work` takes an idempotency key: a replayed submit is answered, not applied. `operator_actions` is append-only — no `UPDATE`/`DELETE` grant to any role, and triggers that refuse both even for the owner.

**Images** are stored with EXIF dropped, upright, and resized with `fit: inside, withoutEnlargement`. Nothing is cropped: a maker's framing is the maker's decision.

---

## 4. Verification

### 4.1 Browser journeys — 31 of 31 green, at phone and desktop width

`e2e/01` the maker door (4) · `e2e/02` publish and discovery (6) · `e2e/03` status, authority, privacy, closure (8) · `e2e/04` failure endings and boundary sweeps (10) · `e2e/05` renders (3).

Every journey enters through the same doors the product exposes. Where a test needs a value a person would read in their email, it reads the local outbox row and says so.

### 4.2 Permission probes — 20 of 20 green

`tests/policy/run.ts`, run through the same roles the product uses. Each probe attempts something the product must refuse and passes only on the **right** refusal — a permission error, an empty result, or a named exception — so a typo cannot masquerade as a denial.

| Probe | What it establishes |
|---|---|
| P-01 … P-04 | Anonymous cannot read `works`, `auth_accounts`, `makers` or `contact_routes` at all |
| P-05 | Anonymous **can** read the public view — the refusals above are not "everything is off" |
| P-06 | No unpublished work reaches the public view |
| P-07 … P-12 | Maker B cannot read Maker A's works, rename them, retire their work, change its status, read their routes or read their account row |
| P-13 | Maker B **can** read their own maker row |
| P-14, P-15 | A maker cannot suspend anyone; an operator cannot suspend without a written reason |
| P-16, P-17 | The operator record cannot be rewritten or deleted, even by an operator |
| P-18 | No account email appears in any public view |
| P-19, P-20 | No transaction table and no engagement column exists |

### 4.3 Migration VERIFY blocks — 8 of 8 green

Executed inside the migrations: vocabulary seeded; no anonymous grant on any base table; no public view exposing an identity column; RLS on for every governed table; `operator_actions` append-only; no commerce table; no engagement column; no application role bypassing RLS.

### 4.4 Governance — green

Orientation VALID · repository gates 5 of 5 · **doctrine drill 89 of 89, 0 DECORATIVE, 0 STALE, 0 RED** (was 88; `D-38` was rewritten and `D-38b` added, see §6).

---

## 5. Defects found and fixed during the walk

**Two of three images rendered broken.** The work detail asked for a `w1280` variant, which is never generated for an image narrower than 1280 — upscaling would show the maker a worse image than they gave. Fixed on both sides: the surface now asks for a width the image actually has, and the read falls back to the largest that exists. The journey now asserts that every image returns real bytes and decodes at its own ratio, so the defect cannot return silently.

**The handoff sat below the fold.** The disclosure and routes were rendered inline at the bottom of the work page, so a visitor had to scroll to reach the thing they had just asked for. Rebuilt as the accepted `R-2b` surface has it: the work stays visible behind a scrim and the sheet rises from the bottom.

**No defect remains that prevents the vertical slice from functioning.**

---

## 6. One drill case went DECORATIVE, and what that was

After the sequencing decision opened application source at Stage 2, drill case `D-38` — "Write application source while the stage blocks it → DENIED" — passed vacuously, because the active stage no longer blocks it. The drill reported it as **DECORATIVE**: a protection staying green under its own violation.

It was not weakened and the stage was not re-blocked. `D-38` now plants a fixture whose stage **does** block application source, orients that fixture against its own state, and requires the denial; `D-38b` plants a stage that permits it and requires the write to be allowed. The rule is drilled from both sides, against the stage record rather than against whichever stage happens to be active.

---

## 7. What is NOT SEEN

| Not seen | Why | What would show it |
|---|---|---|
| **Any deployed build** | Nothing is deployed. No hosting project exists | A hosting project connected to the repository |
| **A real email round trip** | `GALLERY_MAIL=outbox` writes the message to a local table and **sends nothing** | A transactional sender on a domain with SPF/DKIM |
| **The handoff opening a real WhatsApp or mail client** | The links are asserted to be correctly formed; opening them is a device behaviour | The same walk on a physical phone |
| **Image storage on a hosted object store** | Bytes are on local disk behind the storage adapter | A storage bucket and its credentials |
| **CI and branch protection** | Never run; `main` does not exist | Enablement items 1–3 |

No mocked success stands in for any of these. The local outbox is named as a local outbox everywhere it appears, including in the code that writes it.

---

## 8. Minimum external provisioning for deployed proof

1. **A hosting project** connected to the repository, production on `main`, previews per branch.
2. **A domain**, or a provider subdomain, so links in email and share previews are real URLs.
3. **A managed Postgres** (Supabase, region Mumbai, per the Stage 1 plan) with its connection string in the hosting environment — never in git.
4. **A transactional email sender** on that domain with SPF/DKIM records, so the confirmation and recovery doors can be walked with real mail.
5. **A test mailbox reachable on a phone**, so the round trip is walked rather than assumed.
6. **Object storage** for images, or a persistent disk on the hosting project.

Items 1–3 of `doctrine/EXTERNAL_ENABLEMENT.md` (`main`, Actions, `DOCTRINE_READ_TOKEN`, branch protection) remain separately required before production release or authoritative trunk integration. They are deferred, not abandoned, and nothing here changes that.

---

## 9. Scope held

Not built, deliberately: following, notifications, visitor accounts, in-app messaging, payments, shipping, order tracking, public reactions, gallery customisation, paid identity confirmation, subscriptions, workshops beyond a route that states its own emptiness. No general Doctrine audit was conducted; `builders-doctrine` is byte-identical.

---

## 10. How to run it

```bash
npm install
cp .env.example .env.local              # every value is local; no production credential
npm run db:reset && npm run db:seed     # reproducible from an empty cluster
npm run build && npm start              # http://127.0.0.1:3100
npm run test:policy                     # 20 permission probes
npx playwright test                     # 31 journeys, phone and desktop
```

The seed creates two synthetic makers and an operator and **no works**: the slice is proved by walking the product, and a seed that pre-baked a published work would be proving the seed. Every persona, address, phone number and email is invented and uses reserved test values.
