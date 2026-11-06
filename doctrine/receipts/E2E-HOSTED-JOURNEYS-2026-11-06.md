# Journeys against the hosted test project — 2026-11-06

Governor instruction (2026-11-05, option 1): run the journeys against a separate test project,
not the live site. Ledger GAL-L0017.

## Where it ran

| | Value |
|---|---|
| Supabase project | `thegallery-test`, ref `fbgrumcwlnoljkkbiqfe`, ap-south-1 — migrations 001–004, bucket `gallery-images` (private) |
| Test-only additions | `e2e/support/test-project.sql`: `test_support.outbox` + Send Email auth hook `pg-functions://postgres/test_support/send_email`; auth site URL `http://127.0.0.1:3100`; Data API exposes `gallery` |
| Application | `next build` + `next start` of branch `claude/e2e-hosted-journeys` at `56a54cf`, `.env.local` pointing at the test project |
| Owner access | Supabase Management API over HTTPS; token scoped to `thegallery-test` (live project refused it: HTTP 403); `e2e/helpers.ts` also refuses the live project and site |
| Seed | `e2e/support/seed-test-project.ts`: Anika Rao, Dhaaga Studio and the operator created through Supabase Auth sign-up and confirmation |

## SEEN

- First run, phone: 22 passed, 2 failed, 7 not run (serial walks after a failure).
  - The gallery link test expected "View the gallery"; the visual system revision (8d346d8) reworded it "The gallery, N works". Journey updated.
  - The retire test checked the visitor's page before the retire had been written; the row was retired when inspected. The journey now waits for the Studio to stop offering the control.
- Rerun of 02 and 04 after both fixes: 16 passed.
- **Full suite, phone and desktop: 62 passed, 0 failed, 0 skipped (15.8 min).** 31 journeys each width.
- `tsc --noEmit`: clean.

## NOT SEEN

- An email round trip. Links are read from `test_support.outbox`; no message was sent.
- The live project. Nothing here ran against `kemrceegbyizpcfewgri` or `atthegallery.in`.
- The 22 policy probes (`tests/policy/run.ts`): they still use a direct Postgres connection.
- CI.

## Finding for the live project (not fixed here)

The application expects confirmation and recovery links of the form
`/makers/confirm/<token_hash>` and `/makers/reset/<token_hash>`. Nothing in this repository sets
the live project's email templates to produce them, and Supabase's default templates link to its
own verify endpoint instead. Live sign-up confirmation is therefore expected to fail until the
live project's **Confirm signup** and **Reset password** templates link to
`{{ .RedirectTo }}/{{ .TokenHash }}`, and its Site URL and redirect allow-list name
`https://atthegallery.in`. UNKNOWN until walked on the live site.

## Exposure noted

Reading the test project's Data API configuration printed its legacy JWT secret into the session
transcript. It belongs to `thegallery-test` only; rotate it (Project Settings → JWT keys) if the
test project is kept.
