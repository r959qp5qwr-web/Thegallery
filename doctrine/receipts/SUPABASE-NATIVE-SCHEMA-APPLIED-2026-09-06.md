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
