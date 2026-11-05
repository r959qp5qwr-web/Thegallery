# Decision GAL-SUPA-1 — return the data and auth path to Supabase-native

**Decided:** 2026-09-06 by the governor, in session
`9e4e9e82-091a-58bd-96d4-39aae1304020`, after the substitution recorded in
`doctrine/receipts/STAGE2-VERTICAL-SLICE-2026-09-06.md` §1 was put to them as a live question
rather than left standing.

## What was wrong

`product/PRODUCT_ARCHITECTURE.md` §9 fixed the stack at Stage 1: *"Data, auth, storage —
Supabase: Postgres with RLS, email/password auth with confirmation and reset, Storage for
images."* The Stage 2 build did not do that. It substituted a hand-built authentication store
and a raw Postgres connection, for a stated and true reason — the build environment could not
run GoTrue — and recorded the substitution honestly at the time as the same shape, to be
swapped later.

Storage was swapped back when a real project appeared. Auth and the data path were not. They
were carried into the Cloudflare build instead, and were hardening into the deployed
architecture without anyone deciding to keep them. The governor asked why this product's
deployment looked unlike their others; the answer was that.

## The decision

Return both to the accepted architecture. Supabase Auth owns the maker door. The application
reaches its data through PostgREST with `@supabase/supabase-js`, as an ordinary Supabase
client, and row-level security keys on `auth.uid()`.

What that removes: Hyperdrive, the raw Postgres connection, the `gallery_app`, `gallery_anon`,
`gallery_auth` and `gallery_authstore` roles, the `auth_accounts`, `auth_sessions`,
`auth_tokens` and `dev_outbox` tables, password hashing, session minting and token expiry as
this product's code to own.

What it keeps: server-rendered routes and therefore the Worker (architecture §9, for durable
deep links and truthful share previews); the `gallery` schema isolation; `/img` as the single
door to image bytes; every governed behaviour in the domain model.

## Consequences accepted, not discovered later

The Gallery stays inside the governor's existing Supabase project, which carries Ustaad. That
was put to them alongside the alternative of a dedicated project, with these three consequences
stated. They chose to stay. Each is therefore an accepted cost, and a later session must not
treat any of them as an incident:

1. **One identity table.** `auth.users` is per project. Makers and Ustaad's users share one
   identity store, one JWT issuer, one password policy. A token minted for either product is
   structurally valid at the other's API; only row-level security separates them. Every policy
   this product writes must therefore be written as if an authenticated stranger is calling —
   which is the correct posture regardless, and is what the probes exist to establish.

2. **The `gallery` schema goes on the public internet.** PostgREST exposes only the schemas
   named in the project's settings; adding `gallery` makes every table in it reachable by
   anyone holding the publishable key, behind grants and row-level security alone. Verified
   before the decision: the project today exposes `public` and `graphql_public` only. The
   probe suite moves to HTTP for this reason — the door being probed is now a real door.

3. **Email confirmation is a project-wide setting.** The project had `mailer_autoconfirm: true`,
   which confirms new accounts without sending anything. GAL-12 requires a real confirmation
   step, so it must be turned off, and that changes Ustaad's signup behaviour too.

## What this does not change

GAL-11, GAL-12, GAL-A1, GAL-06, GAL-15 and the domain model are untouched. This is a decision
about mechanism, not about what the product promises. The eighteen-step chain must be walked
again afterwards, and until it has been, nothing about the rewritten path is proved.

## Still true, and still the hard part

The environment cannot run GoTrue or PostgREST locally: the Docker daemon is unusable here.
That was the original reason for the substitution and it has not changed. The rewritten path
can only be proved against a hosted project, so the journeys move from a local cluster to the
live one, with synthetic makers and reserved `.example` addresses. A local run is no longer
available as a fallback, and no session may report a green suite without saying which project
it ran against.
