# Stage 2 — the vertical slice recommended next

**Status:** proposal for governor authorisation after the Stage 1 review · **Date:** 2026-09-04

## 1. The exact chain

One primary synthetic maker (Anika Rao, clay, Bengaluru), one second maker for isolation (Dhaaga Studio), one anonymous visitor, one operator account — on the deployed product, at phone width:

1. `/makers` → Create account with a real test email → confirmation email received on a phone mail client → link → Studio set-up.
2. Identity saved; one WhatsApp route and one public email route saved and previewed.
3. Add work: three images (portrait, landscape, square) uploaded, reordered, focal point set, alt text written; label fields; price mode exact; status available.
4. Preview → Publish.
5. Anonymous visitor: the entrance shows the work as featured or in recent work; Browse → Clay shows it; search by title and by maker name finds it; the share link renders a truthful preview.
6. Work detail at scale; images keep orientation, crop, order and quality; View maker's gallery shows the body of work (one work) and the practice.
7. Contact maker → intention → disclosure → WhatsApp route opens `wa.me` with the prefilled line; the email route opens `mailto:`; the private account email is absent from every public payload.
8. Maker marks the work sold → entrance, Browse, search, work detail, maker gallery and a saved reference all show sold; no cache keeps "available".
9. Operator suspends Anika Rao with a reason → every public surface loses the work and gallery; Studio is read-only and states the reason; operator reinstates → everything returns unchanged; both actions are in the append-only record.
10. Isolation: Dhaaga Studio, signed in with ordinary credentials, cannot read Anika Rao's drafts or write to her profile, work, routes or gallery; the anonymous key cannot read any draft or private column.
11. Foundation doors walked: sign out, sign in, reset, expired session return, account closure consequence screen (closure itself may be walked on a third disposable maker).

**Stage 2 gate:** the whole chain works on the deployed product on a phone; Maker A cannot alter Maker B; anonymous sees only published material; failure anywhere keeps the stage open.

## 2. Journeys implemented
J-001, J-002, J-003 in full; J-004 minimal (suspend / reinstate / take down with reason); J-005 doors as listed in 11. J-006 (material, search, saves, share) enters through step 5 in its simplest form.

## 3. What is built to prove it (the proof machine, before features)
- Migrations with executing VERIFY blocks; two synthetic makers in the first data migration.
- Public views omitting private columns; RLS policies with explicit grants; transition functions for publish, status, suspend/reinstate, take down/restore, report lifecycle.
- Static gates: banned-vocabulary sweep (`verified|vetted|certified|safe|guaranteed|authentic`, and commerce words `cart|checkout|order|payment|wallet|escrow|refund|shipping` outside the disclosure copy), route inventory against `product/PRODUCT_ARCHITECTURE.md` §4, name sweep, no-real-content fixture check; a drill extension so each gate fails under its violation.
- Playwright journeys through the public doors; adversarial persona probes with the anon and maker keys against the deployed database; a deploy probe that greps the served bundle for the change.
- A receipt writer for suite results (Audit Protocol L-A22) so numeric claims in commit messages become allowed only with a receipt.
- `scripts/doctrine-orient.py check` in CI at the pull-request chokepoint once the Doctrine checkout is readable there.

## 4. Provisioning the governor must batch ahead of dependence (OBL-GAL-008)
| Item | Needed by | Notes |
|---|---|---|
| A database/auth/storage project (Supabase; region Mumbai) with its keys placed in the hosting provider's environment, never in git | step 1 | the sign-in email door is the first seam proved |
| A hosting project (Vercel) connected to the repository, production on `main`, previews per branch | step 1 | a live URL for every phone walk |
| A domain the governor owns, or a provider subdomain for the slice | step 1 | share previews and email links must be real URLs |
| A transactional email sender (Resend or Postmark) on that domain with SPF/DKIM DNS records | step 1 | provider default SMTP is rate-limited and unbranded; the door must be walked with real mail |
| An operator account email | step 9 | separate from any maker |
| A test mailbox reachable on a phone | step 1 | the round trip is walked, not assumed |
| Read access for CI to `builders-doctrine` (deploy key or fine-grained token) | §3 last item | otherwise the CI orientation layer stays UNARMED, honestly |
| `main` created by merging the Stage 0/1 branch, with branch protection requiring CI | before step 1 | OBL-GAL-005 |

## 5. Proof plan (target rungs)
| Journey or promise | Rung targeted in Stage 2 | Evidence |
|---|---|---|
| Maker creates an email account (P-07) | OBSERVED | phone screenshots of the confirmation email and first Studio screen |
| Maker publishes work (P-05, P-17) | OBSERVED | stored object, stored images, public route, discovery result, all naming the same maker |
| Visitor discovers and opens (P-06, P-10) | OBSERVED | anonymous phone walk from a shared link and from the entrance |
| Visitor contacts maker (P-01, P-15, P-08) | OBSERVED | route opens; payload absence probe for the account email |
| Status is truthful (P-11) | OBSERVED | one change observed across every surface |
| Maker owns only their work (P-18) | TESTED + DEPLOYED | adversarial probe output against the deployed database |
| Anonymous sees only public (P-12) | TESTED + DEPLOYED | probe output |
| Suspension is reversible (P-14) | OBSERVED | operator walk with the append-only record |
| No transaction implied (P-02, P-03, P-04, P-16) | TESTED | vocabulary and route-inventory gates green with drill receipts |
| Interface meets the accepted direction | MANUAL | phone-width renders compared with the accepted reference set (L-A24) |

## 6. Not in Stage 2
Collections, workshops, search beyond title and maker name, report submission by visitors (the operator acts on a fixture report), the vocabulary console, the failures console, privacy and participation pages in final form.
