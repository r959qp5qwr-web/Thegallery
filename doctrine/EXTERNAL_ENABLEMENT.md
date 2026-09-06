# External enablement instrument — what only the governor or the platform can do

**Date:** 2026-09-04 · **Raised by:** the enforcement-closure pass on the session report of the same date.

Everything in this document is blocked from inside a build session. Each item names the exact
setting, why it is needed, the check it activates, how its enforcement will be proven, and what
stays unenforced until then. Nothing here is claimed as done; `doctrine/PRODUCT_STATE.json`
carries the matching obligations with their activation conditions.

---

## 1. Enable GitHub Actions for `r959qp5qwr-web/Thegallery`

- **Exact setting:** repository → Settings → Actions → General → *Allow all actions and reusable workflows* (or at minimum allow `actions/checkout` and `actions/upload-artifact`).
- **Why:** `.github/workflows/doctrine.yml` exists in this branch and does nothing until Actions is on. It is the only enforcement layer that binds a human as well as an agent, and the only one that sees a commit made with `--no-verify` or pushed from a checkout whose `core.hooksPath` was never set.
- **Activates:** the `Doctrine` workflow — orientation against the bound Doctrine commit, the repository gates, and the full drill, on every pull request.
- **Proved by:** one completed run of the workflow on a pull request from this branch, green, with the drill artifact attached to the run.
- **Blocked until then:** obligation OBL-GAL-003. The trunk layer is UNARMED; a commit that bypassed the local hooks reaches the default branch unexamined.

## 2. Create the repository secret `DOCTRINE_READ_TOKEN`

- **Exact setting:** repository → Settings → Secrets and variables → Actions → *New repository secret*, name `DOCTRINE_READ_TOKEN`, value a fine-grained personal access token or a deploy key with **read-only** access to `r959qp5qwr-web/builders-doctrine` and nothing else.
- **Why:** the central Doctrine is private. Orientation means fingerprinting the Canon, Playbook, Audit Protocol, Candidate Register, `VERSION.json` and the twenty module files against the bound commit; without read access CI cannot do that and must not pretend to.
- **Activates:** the *Check out the central Doctrine at the bound commit* step. The workflow already refuses to continue when the secret is absent, so an unset secret produces a red check rather than a green one that verified nothing.
- **Proved by:** the workflow log showing `binding pins dfdecb651df8…` followed by a green orientation step.
- **Blocked until then:** the same obligation. Grant read-only scope: this credential must not be able to write to the Doctrine, and the product's own rule is that nothing writes there.

## 3. Create `main` by merging this branch, then protect it

- **Exact setting:** merge `claude/the-gallery-foundation-7plo1e` (the governor's act — this session must not do it), then Settings → Branches → add a rule for `main` with *Require a pull request before merging* and *Require status checks to pass* → select the `Doctrine / Orientation, gates and drill` check.
- **Why:** the product repository was unborn at binding, so `main` does not exist. Until it does, "the default branch is reached through review" is a rule with no branch to apply to. Branch protection is what makes the CI check compulsory rather than advisory.
- **Activates:** the required-check composition — a pull request cannot merge while orientation, the gates or the drill are red.
- **Proved by:** the branch-protection state showing the Doctrine check required and direct pushes refused. This is a dashboard fact, so it is recorded by observation and stays UNKNOWN until observed.
- **Blocked until then:** obligations OBL-GAL-005 and OBL-GAL-011.

## 4. Host topology — dispositioned 2026-09-06, not an open experiment

- **Exact act:** none, and none is authorised. Two verification attempts are recorded in `doctrine/receipts/HOOK_LIVENESS_ATTEMPT-2026-09-04.md` and `-2026-09-06.md`. The governed disposition is that the host hook is `ARMED_AS_CONFIGURED` **only when `Thegallery` is itself the host project root**, and is not a compulsory enforcement layer in the present multi-repository topology.
- **Why:** the harness discovers project settings at `<project root>/.claude/` only. Where a session opens this repository and the Doctrine checkout as siblings beneath a parent directory, that parent is the project root and `.claude/settings.json` one level deeper is never a discovery candidate. Attempt 2 established this with the harness's own record: exactly one hook spawn in the whole session, its own git-identity hook, and zero `PreToolUse` spawns against fifteen covered tool calls.
- **Activates:** nothing that this repository can act on. Should a future environment open `Thegallery` as the actual project root — with the Doctrine checkout supplied through `DOCTRINE_ROOT` rather than as a sibling — the procedure in `doctrine/receipts/HOOK_LIVENESS_VERIFICATION.md` becomes testable again.
- **Proved by:** the evidence in that procedure, if and when the topology materially changes. **No third liveness experiment is authorised before then**, and no session claims automatic host orientation while the topology prevents it.
- **Consequence today:** obligation OBL-GAL-002 stays open with that activation condition. It is **not a blocker**: the commit and push routes are held compulsorily by GAL-G7 and GAL-G8 in every checkout, armed by the seam rather than by the harness (OBL-GAL-013, repaired 2026-09-06), and the trunk boundary is items 1–3 below.

## 5. Stage 2 provisioning

Unchanged from `product/STAGE_2_VERTICAL_SLICE.md` §4 and obligation OBL-GAL-008: a database and auth project, a hosting project, a domain, a transactional email sender with SPF/DKIM records, an operator account, and a phone-reachable test mailbox. None of it is needed for enforcement closure; all of it is needed before any deployed proof.

---

## What remains unenforced while items 1–3 are open

| Route | Layer that would hold it | State today |
|---|---|---|
| An agent mutating files in a session where the host did not load the hooks | harness hook | executes nothing in the present multi-repository topology; dispositioned (item 4) |
| A commit made with `--no-verify` | CI at the pull-request chokepoint | UNARMED (items 1–2) |
| A commit made in a checkout that never oriented, so never armed `core.hooksPath` | CI at the pull-request chokepoint | UNARMED (items 1–2). The seam arms the path on every orientation and gate G3 goes red without it, so this is now a narrow residue rather than the default state |
| A merge performed in the GitHub UI | branch protection | UNARMED (item 3) |
| A tool the harness adds after 2026-09-04 | the mutation-surface inventory | UNARMED, declared (OBL-GAL-009) |
| A guard process that never starts | nothing at the hook layer, by the host's own protocol | structural; see OBL-GAL-010 |
