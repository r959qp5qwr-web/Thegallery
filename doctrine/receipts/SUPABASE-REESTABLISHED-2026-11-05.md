# Supabase project re-established — 2026-11-05

**Why:** `atthegallery.in` returned HTTP 500 on `/`. The previous project
(`ljbsrrctpynyarmlqkba`, shared with Ustaad) no longer resolves in DNS and is absent from the
connected Supabase account; the governor could not find it in any account.

**Governor instructions (this session):** "Let's create a project." · "Pause Ahoy" (to free the
free-tier slot) · option 1: apply 004 without its `DROP POLICY IF EXISTS` lines.

| Item | Value |
|---|---|
| Project | `thegallery`, ref `kemrceegbyizpcfewgri`, ap-south-1, free tier, own project (not shared) |
| Paused to make room | AHOY RIDESHARING APP (`mupctqclstbnvrvxycep`), data retained |
| Migrations applied | 001, 002, 003 verbatim (`@schema@` → `gallery`); 004 with its five `DROP POLICY IF EXISTS` lines omitted |
| Bucket | `gallery-images`, private |

**Deviation, stated:** the Supabase connector asks for interactive approval on destructive
statements, and the approval prompt timed out twice. On a project created minutes earlier the
five `DROP POLICY IF EXISTS` lines had nothing to drop, so they were omitted; every CREATE and the
V11 verify block ran unchanged. The repository migration is not edited.

## SEEN
- Migration 003 VERIFY V1–V10 executed and passed (a failure raises and aborts the migration).
- Migration 004 VERIFY V11 executed and passed.
- Post-check by SQL: 11 tables in `gallery`, 5 materials, 5 `gallery_images_*` policies, bucket private.
- `wrangler.jsonc` now names the new URL and publishable key.

## NOT SEEN
- `gallery` added to the Data API exposed schemas (dashboard setting; the governor's act).
- Redeploy of the Worker; the live site still points at the vanished project.
- Policy probes (`npm run test:policy`) and journeys against the new project.
- Auth settings: site URL / redirect URLs for `atthegallery.in`; custom SMTP sender.

## Data
Nothing carried over. The old project's makers, works and images are lost.
