# Stage 2 authorisation — governor's sequencing decision, 2026-09-06

**Branch:** `claude/gallery-hook-liveness-verify-bzn5c6` · **From:** `e93082e`
**Doctrine:** `dfdecb651df8cef5387487fee21d8ee2f798db95`, read-only

## The decision

The `PLATFORM_ENABLEMENT_GATE` is no longer a prerequisite for Stage 2 implementation.

- **Stage 2 implementation is authorised** on the existing development branch, using the proved repository-local orientation, gates and git-hook mechanism.
- **Creation of `main`, GitHub Actions, `DOCTRINE_READ_TOKEN`, required status checks and branch protection remain mandatory** before production release or authoritative trunk integration.
- These protections are **deferred, not abandoned**.
- Their absence stays visible in the product state and in every proof report, and does not prevent building and locally proving the vertical slice.

## Why it is defensible

The layer that actually guards this checkout is in force and was proved on 2026-09-06: the seam arms and verifies `core.hooksPath` on every orientation, gate G3 holds it independently, and `.githooks/pre-commit` and `pre-push` run the seam and the gates on every commit and push — drilled end to end through git's own invocation by cases D-73 … D-87. A commit on this branch already meets orientation, the gates and the hooks. The trunk and CI boundary protects *release and integration*, which is a later act than building and locally proving a slice.

## What was recorded

| Where | Change |
|---|---|
| `GAL-SEQ-1` (new FIXED decision) | the sequencing decision, with reason, consequence of rejection and reopen condition; `enforcement_state: MANUAL`, so `armed_fixed_decisions` stays at 8 |
| `active_stage` | `STAGE_2`, `IN_PROGRESS`, with the vertical-slice acceptance condition |
| `active_stage.blocked_until_acceptance` | no longer refuses application source; refuses **production release**, **authoritative trunk integration**, **merge to the default branch**, **any claim of deployed proof** |
| `active_stage.not_authorised_by_this_stage` | states that Stage 2 authorisation does not authorise release, merge or any deployed claim |
| `active_stage.deferred_protections_visible` | names exactly what is absent, and what is in force meanwhile |
| `PLATFORM_ENABLEMENT_GATE` in the ladder | `DEFERRED`, with its gate text extended rather than replaced |
| `OBL-GAL-003`, `OBL-GAL-005`, `OBL-GAL-011` | stay **OPEN / UNARMED**, activation conditions and acceptance tests unchanged; each now says it is deferred and bounds release rather than implementation |

**No obligation was weakened, removed or closed.** `doctrine/RATCHETS.json` is untouched.

## Still absent, and still required before production release

`main` does not exist · branch protection unset, state UNKNOWN · GitHub Actions not enabled · `DOCTRINE_READ_TOKEN` does not exist · the check `Doctrine / Orientation, gates and drill` has never run.
