# E2E journeys against a hosted test project — finding and plan (2026-11-05)

**Governor instruction:** run the journeys against a separate test project (option 1), not live.

## Done in this session (SEEN)
- treksfit-prod (`yeyaaufiitsznxtuhoee`) **paused** by the governor's instruction to free a
  free-tier slot. Restore it from the Supabase dashboard when the test run is finished.
- Test project created: `thegallery-test`, ref **`fbgrumcwlnoljkkbiqfe`**, ap-south-1.
- Migrations 001–003 applied verbatim, 004 without its `DROP POLICY IF EXISTS` lines (same as
  live; see SUPABASE-REESTABLISHED-2026-11-05.md). VERIFY V1–V11 passed. Private bucket
  `gallery-images` created. 11 tables, 5 materials, 5 storage policies.
- Live site, database-free journeys only: 6 of 6 passed (04: marketplace/claim sweeps and their
  non-vacuity checks, served navigation, no real contact values).

## Finding: the journey suite predates GAL-SUPA-1
`e2e/*.spec.ts` and `e2e/helpers.ts` were written for the self-hosted auth design and were not
migrated when the application moved onto Supabase Auth (commit 83f0901). They query
`auth_accounts`, `auth_sessions`, `dev_outbox`, `makers.account_id` and `auth_accounts.access_state`,
none of which exist in migrations 001–004. The "31 journeys green" in
STAGE2-VERTICAL-SLICE-2026-09-06.md proved the pre-Supabase design. **No journey has run against
the Supabase-native build.** This belongs in BUILD_LEARNING_LEDGER.md with the change that fixes it.

## Blockers
1. This sandbox reaches Supabase over HTTPS only; Postgres ports 5432/6543 (pooler and direct)
   are blocked, so `pg`-based helpers cannot connect.
2. Supabase's built-in mailer only delivers to organisation members, so a sign-up through the UI
   with a reserved `.example` address cannot receive mail on the test project as configured.

## Plan (next session, needs `SUPABASE_ACCESS_TOKEN` in the environment)
1. `owner()` → Supabase Management API `POST /v1/projects/{ref}/database/query` over HTTPS.
   Guard: refuses any ref other than `fbgrumcwlnoljkkbiqfe`, so a journey can never write live.
2. Rewrite every query to the Supabase-native model: `auth.users` + `makers.user_id`; sessions
   expired via `auth.sessions`; closure via `account_closures` and `makers.status`.
3. Confirmation and recovery links: test project auth config set by API so mail goes nowhere
   real; the link is built from the token hash GoTrue stores, the same value the email template
   carries. States plainly that this proves the link, not an email round trip.
4. Seed: `db/seed.ts` rewritten to create the two synthetic makers and the operator via the Auth
   admin API.
5. Expose `gallery` on the test project's Data API (auto-expose off), run the app built from this
   branch against the test project, all journeys at phone and desktop width.
6. Report pass/fail per journey with the HTML report; failures that are product defects are
   fixed in their own change with a ledger entry.

Not authorised by this plan: any write to the live project `kemrceegbyizpcfewgri`.
