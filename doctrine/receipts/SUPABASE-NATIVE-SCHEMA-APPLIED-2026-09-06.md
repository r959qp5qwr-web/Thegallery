# The Supabase-native schema, applied to the hosted project — 2026-09-06

Session `9e4e9e82-091a-58bd-96d4-39aae1304020`, decision GAL-SUPA-1.

Applied by the governor through the Supabase SQL editor, one statement group at a time, with
the result of each pasted back into the session. This receipt records what those results said
and nothing beyond them.

## SEEN, on the hosted project

| Step | Instrument | Result |
|---|---|---|
| Teardown of the previous schema | `db/supabase-reset.sql` | `gallery` schema dropped; `gallery_anon`, `gallery_auth`, `gallery_authstore` dropped directly |
| Teardown of the last role | `db/supabase-drop-app-role.sql` | `gallery_app` dropped after revoking database privileges |
| Tables and identity functions | migration 001 | 11 of 11 tables present |
| Views, grants, policies | migration 002 first part | 19 policies, exactly the 19 named |
| Transition functions and grants | migration 002 second part | `anon` may execute only `storage_key_for_public_image` |
| Vocabulary and self-verification | migration 003 | applied without raising; V1–V10 each raise rather than warn |
| Full schema check | `db/supabase-verify.sql` | **12 of 12 PASS** |

The twelve, as returned: nothing of ours in `public`; 11 of 11 tables in `gallery`; `anon`
holds no grant on any private table; no public view exposes an identity column; row-level
security on for every table in the schema; the operator record append-only; no transaction
table and no engagement column; `anon` may execute one function only; the operator table
reachable by nobody; the vocabulary seeded; the previous design's four roles gone; every write
policy refusing a suspended maker.

## What the teardown cost, and why it is worth recording

Three roles dropped on their own. `gallery_app` refused twice before the reason was visible,
because the SQL editor swallows `NOTICE` and `WARNING` and — the second time — shows only the
last of several result sets. Two rounds of this session's diagnostics reported into the void.
The third returned everything as one result set and named it: *permission denied to reassign
objects*, then *privileges for database*.

`REASSIGN OWNED BY` and `DROP OWNED BY` both need membership in the role. Supabase's
`postgres` holds `ADMIN OPTION` on roles it created, without `SET` or `INHERIT` — authority
over a role rather than membership of it. An explicit `REVOKE` worked, because `postgres`
granted the privilege in the first place. The situation was reproduced locally first — a role
plus `GRANT CONNECT ON DATABASE` gives the identical refusal — so the fix was tested before it
was sent rather than guessed at across a chat window.

That role was a `LOGIN` role with a password on a database shared with another product. It is
gone.

## NOT SEEN

- Any application reaching this schema. No client has connected; PostgREST does not yet expose
  `gallery`, so nothing outside the SQL editor can read a row of it.
- The policies behaving as intended **on this project**. They are proved locally, through the
  same mechanism PostgREST uses, at 28 of 28 probes. The hosted project has been checked for
  structure, not behaviour: no probe has run against it.
- Supabase Auth. No account has been created, no token issued, and `auth.users` on this
  project has never been read by this product.
- Storage. No bucket exists.

## UNKNOWN

- Whether exposing `gallery` to PostgREST surfaces anything these checks did not think to ask
  about. The check that would catch a table nobody remembered (C5, which names no table) is
  the reason to expect not, and it is not the same as having looked.

---

# Addendum — the schema exposed, and probed over HTTP, 2026-09-06

The governor added `gallery` to the project's exposed schemas (Data API → Settings → Exposed
schemas, 3 of 3), leaving "Exposed tables" at 0 of 25, "Exposed functions" at 0 of 23 and
"Automatically expose new tables" off. Those two counters are a dashboard convenience over
grants; PostgREST serves what the grants say, which this addendum establishes.

This is the first proof of BEHAVIOUR on the hosted project. Everything before it there was
structural.

## SEEN — anonymous, over HTTPS, with the project's publishable key

| Probe | Expected | Result |
|---|---|---|
| `material_categories` | readable | HTTP 200, five materials |
| `public_works` view | readable | HTTP 200, `[]` (nothing published yet) |
| `public_makers` view | readable | HTTP 200, `[]` |
| `works` base table | refused | HTTP 401, `42501 permission denied for table works` |
| `makers` base table | refused | HTTP 401, `42501` |
| `contact_routes` base table | refused | HTTP 401, `42501` |
| `operators` base table | refused | HTTP 401, `42501` |
| `rpc/storage_key_for_public_image` | callable | HTTP 200, `null` for an unknown id |
| `rpc/publish_work` | refused | HTTP 401, `permission denied for function` |
| `rpc/set_maker_access` | refused | HTTP 401 |
| `rpc/close_account` | refused | HTTP 401 |
| `rpc/is_operator` | refused | HTTP 401 |
| `rpc/writing_maker_id` | refused | HTTP 401 |

The refusals are grant-level, not policy-level: PostgREST returns the privilege error and even
names the grant that is missing. An empty result would have been the weaker outcome, because a
policy bug can turn an empty result into rows and cannot turn a missing grant into one.

The two readable views returning `[]` is correct and is also the reason this is not yet a
complete proof: nothing is published on this project, so "no private row leaked" has not been
tested against any private row. That is what the journeys will do.

## NOT SEEN

- Anything authenticated. No account exists on this project, no token has been issued, and
  every probe above ran as `anon`. Maker isolation, operator authority and the suspended-maker
  refusal are proved locally at 28 of 28 and not here.
- Storage. Whether the bucket exists could not be established from here: Supabase hides
  buckets from the anonymous key, so the empty list this session received distinguishes
  nothing.
