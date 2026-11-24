# Pre-release review: the mechanism

**Trigger:** the governor's word that The Gallery goes to the public (2026-11-12).
**Outcome:** a release-readiness receipt with every finding from three independent reviewers
reproduced, fixed or explicitly accepted, and the governor's word "Release".

No review makes an app certain to be fault-free. This one aims for the faults that hurt real
people, in the places a single reviewer misses. It uses three readers who don't see each other's
work, one of them trying to break the app, and a builder who checks every claim before acting.

## Phases

| # | Phase | Who | Artefact | Gate to the next phase |
|---|---|---|---|---|
| 0 | **Freeze.** One release-candidate commit. During review, nothing merges except fixes from the register | builder | commit id in `MANIFEST.txt` | tree clean |
| 1 | **Baseline.** Full suite at phone and desktop on that commit; gate OPEN | builder | `doctrine/receipts/RC-BASELINE-<date>.md` | both suites pass; the sweep, standard and drill pass |
| 2 | **Pack.** `python3 scripts/review-pack.py <out> --screens test-results/interface-standard` | builder | the pack: brief, source, product+tests, screens, prompts, manifest | secret and email scan PASS (the script refuses otherwise) |
| 3a | **Broad audit** | Gemini | `GEM-*` findings | — |
| 3b | **Adversarial review** | Grok | `GRK-*` findings | — |
| 3c | **Live-behaviour review**: the checks a reader of files can't make (below) | builder (this session) | `CLA-*` findings + probe receipts | written before reading 3a/3b |
| 3d | Optional blind third reader | fresh Claude chat | `CLA2-*` findings | — |
| 4 | **Triage.** Merge into one register; reproduce each; set CONFIRMED / NOT REPRODUCED / BY DESIGN / DUPLICATE; final severity | builder, then governor reads | `doctrine/review/FINDINGS.md` | every row has a verdict with evidence |
| 5 | **Fix.** Grouped by area. Each fix goes through the full process (failing test first, suite, independent review, design skills, renders, receipt, PR, merge on the governor's word, live confirmed) | builder | PRs, ledger entries | — |
| 6 | **Second pass.** The reviewers read only the fix diffs and the register | Gemini, Grok | short findings lists | no new S1/S2 |
| 7 | **Release gate.** 0 open S1; 0 open S2 unless the governor accepts it in writing; S3 listed; full suite green on the final commit; live checks repeated | builder → governor | `doctrine/receipts/RELEASE-READINESS-<date>.md` | governor: "Release" |

## 3c. What only the live-behaviour review can check

The outside readers see files. These need a running system:

1. **Permission matrix, test project.** Raw PostgREST and Storage calls (no app) as anonymous, Maker A and Maker B, against every table, view, function and bucket path: read, insert, update, delete, rpc. Expected result per cell from `product/PRODUCT_ARCHITECTURE.md` §7.
2. **Live policy probe, read-only.** The same anonymous reads against the live project with its public key: GET only, no writes, record only allowed/denied and row counts, never values. This answers K10 (does live match the migrations) without dashboard access.
3. **Live surface.** Security headers, TLS, cookies, redirects, 404/500 pages, robots and sitemap, share previews (Open Graph) for a work and a gallery, caching headers. Read-only requests.
4. **Failure injection, test project.** Slow 3G, offline mid-publish, double tap, back after submit, refresh on every form, session expiry mid-edit, crafted and oversized JPEGs, HEIC, PNG, 0-byte file, 30 MB file, two tabs editing one work.
5. **Performance.** Mobile-throttled page loads of public pages on live; Worker CPU for image processing on the test build.
6. **Dependencies.** `npm audit` and versions of Next, Supabase and OpenNext against current advisories.
7. **Dashboard checklist for the governor** (things no file shows): backups and restore, auth settings (Site URL, redirect allowlist, email confirmation on, leaked-password protection, rate limits), Resend limits and bounce handling, Cloudflare settings, whether an operator account exists. Asked for once, as one list of screenshots.

## Rules for this review

- Nobody runs active tests against the live site. Live checks are read-only and anonymous.
- No real studio's name, contact or art goes into the pack, the register or the repository.
- A finding is not acted on until it is reproduced. A reviewer's confidence is not evidence.
- A reviewer's finding never loosens an `APP_RULES` or Interface Standard rule, and never reopens a FIXED decision. A finding that argues against one goes to the governor as a question.
- Settled design decisions stay settled. Design findings are judged against the approved drawing board.
