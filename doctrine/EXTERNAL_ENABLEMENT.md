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

## 4. Run the hook-liveness verification in a fresh session

- **Exact act:** follow `doctrine/receipts/HOOK_LIVENESS_VERIFICATION.md` in a new session started on this branch.
- **Why:** hook configuration is snapshotted when a session starts. This branch's `.claude/settings.json` was written during the session that created it, so no project hook has ever fired. Script behaviour and hook wiring are proven; host invocation is not, and no amount of testing from inside this session can prove it.
- **Activates:** the pre-act enforcement layer for agent sessions (GAL-G1, GAL-G2, GAL-G6, GAL-G9 rest on it).
- **Proved by:** the exact evidence listed in that procedure.
- **Blocked until then:** obligation OBL-GAL-002. Everything at the hook layer is ARMED-AS-CONFIGURED and no more.

## 5. Stage 2 provisioning

Unchanged from `product/STAGE_2_VERTICAL_SLICE.md` §4 and obligation OBL-GAL-008: a database and auth project, a hosting project, a domain, a transactional email sender with SPF/DKIM records, an operator account, and a phone-reachable test mailbox. None of it is needed for enforcement closure; all of it is needed before any deployed proof.

---

## What remains unenforced while items 1–4 are open

| Route | Layer that would hold it | State today |
|---|---|---|
| An agent mutating files in a session where the host did not load the hooks | harness hook | ARMED-AS-CONFIGURED, unproven (item 4) |
| A commit made with `--no-verify` | CI at the pull-request chokepoint | UNARMED (items 1–2) |
| A push from a checkout that never set `core.hooksPath` | CI at the pull-request chokepoint | UNARMED (items 1–2) |
| A merge performed in the GitHub UI | branch protection | UNARMED (item 3) |
| A tool the harness adds after 2026-09-04 | the mutation-surface inventory | UNARMED, declared (OBL-GAL-009) |
| A guard process that never starts | nothing at the hook layer, by the host's own protocol | structural; see OBL-GAL-010 |
