# The schema is applied on the hosted project — verified, 2026-09-06

**Project:** the governor's existing Supabase project, shared with **Ustaad**
**Applied by:** the governor, through the Supabase SQL editor, from `db/supabase-schema.sql`
**Verified by:** `db/supabase-verify.sql`, run in the same editor; output pasted back in full

This is the first evidence of this product against a hosted database. It is **not** evidence of
a deployment, and the receipt is written so the two cannot be confused.

## What the project reported

```
| table_schema | count |
| public       | 9     |
| gallery      | 18    |
```

`gallery | 18` matches the local build object-for-object. The 9 in `public` are Ustaad's own and
none of them is ours — established by C1 below, not by assuming.

| Result | Check | Detail |
|---|---|---|
| PASS | C1 nothing of ours landed in public | clean |
| PASS | C2 our tables are in gallery | 13 of 13 present |
| PASS | C3 anon holds no grant on any private table | clean |
| PASS | C4 no public view exposes identity columns | clean |
| PASS | C5 row-level security is on everywhere | all on |
| PASS | C6 operator record is append-only | no update/delete granted |
| PASS | C7 no transaction table, no engagement column | clean |
| PASS | C8 app roles cannot bypass RLS | none bypass |
| PASS | C9 gallery_app can log in and must SET ROLE | login=true inherit=false |
| PASS | C10 the vocabulary seeded | 5 materials |

**C1 and C2 are a pair.** C1 alone would pass if the schema had created nothing at all; C2 is
what stops that. They are the SQL-editor form of policy probes P-21 and P-22.

**C9 was the one at risk.** A hosted platform may refuse a login role, in which case the
application would have had to connect as `postgres` and the permission model would have needed
re-proving. It did not: `gallery_app` exists, can log in, and does not inherit its member roles,
so it must `SET ROLE` explicitly — which is what makes row-level security apply to every request.

The migrations check themselves with `VERIFY` blocks that `RAISE NOTICE`, and the SQL editor
does not surface notices. That is why these ten checks exist as a result table: a notice nobody
sees is not evidence.

## What this establishes, and what it does not

**SEEN.** The schema exists on the hosted project, in one isolated schema, correctly shaped:
grants, row-level security, append-only history, no commerce table, no engagement column, and a
runtime role that cannot bypass any of it. Ustaad's `public` schema carries nothing of ours.

**NOT SEEN.** That the product works against it. No application has connected to this database:
the 31 journeys and the 22 permission probes have run only against the local cluster. The
structural checks above cannot show that a maker can publish or that a visitor sees the right
thing — only that the substrate they would run on is shaped correctly.

Also still absent: a hosting project, DNS for `atthegallery.in`, a transactional sender, and
durable image storage. `GALLERY_STORAGE_DIR` writes to local disk, which does not survive a
serverless host.

## Reachability, recorded because it decides what can be proved from a build session

| Endpoint | From this environment |
|---|---|
| `<project>.supabase.co/auth/v1/*`, `/rest/v1/*`, `/storage/v1/*` | **reachable** over HTTPS |
| `db.<ref>.supabase.co:5432` | IPv6-only; no IPv6 here |
| `aws-N-<region>.pooler.supabase.com:5432` and `:6543` | TCP blocked |
| `api.supabase.com` | refused by egress policy |

So the database cannot be reached from a build session, and the schema had to be applied by the
governor by hand — which is why `db/supabase-schema.sql` exists. Storage, by contrast, answers
over HTTPS, so an image adapter written against it **can** be proved from here given a
credential that may write to a bucket.

**Status unchanged: Stage 2 implementation complete; deployed proof pending.**
