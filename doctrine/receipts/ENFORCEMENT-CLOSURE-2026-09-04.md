# Enforcement-closure receipt — 2026-09-04

**Session:** `a00ba519-2d7c-5264-8383-31d652d2ffcf` · **Branch:** `claude/the-gallery-foundation-7plo1e`  
**Task:** close the governance and enforcement matters disclosed in `THE_GALLERY_SESSION_REPORT_2026-09-04.md`. No Stage 2 work, no application stack, no regeneration of the Stage 1 visual work, no product-decision changes, no merge.

## 1. Inspected

| Repository | Branch | HEAD at inspection | Worktree |
|---|---|---|---|
| `builders-doctrine` (read-only authority) | `origin/main` | `dfdecb651df8cef5387487fee21d8ee2f798db95` | clean before and after |
| `Thegallery` (product) | `claude/the-gallery-foundation-7plo1e` | `fe71d0c23b919cb8c6aa2c2e8e6c7476ebda721d` at start of this pass | clean |

`git fetch origin main` in the Doctrine checkout returned the same commit the binding pins, so
**no re-pin was required** and none was performed (OBL-GAL-004 stays standing with its
activation condition).

## 2. Defects found, and what actually caused them

| # | Defect | Cause |
|---|---|---|
| 1 | The guard converted its own malfunction into permission, and drill case D-23 recorded that as a PASS | A top-level `except` returning exit 0, written under a misreading of the Canon's fail-open ruling — which protects a human operator's access to a repository, something a hook cannot take away — plus a drill case written against the implementation rather than the property |
| 2 | Only `Bash` was guarded | The matcher was a hand-written list of one. The session's real surface offers 61 mutation-capable tools across six classes, including 4 local-write tools and 24 GitHub API tools that reach the remote repository — the Doctrine included — without touching the working tree or any git hook |
| 3 | Both git hooks exited 0 when `python3` was missing | The same misread ruling applied to the one layer that binds a human, leaving no fail-closed boundary anywhere |
| 4 | No gate held the binding documents to their own claims (C-0006 class) | Nothing parsed the enforcement clauses; a decision could claim ARMED with a locus that did not exist |
| 5 | Hook liveness was recorded as NOT SEEN without saying what *kind* of evidence was missing | Script behaviour, hook configuration and host invocation were not being distinguished |

## 3. Mechanisms changed

- **`scripts/doctrine-hook.py`** — rewritten. `GUARD-0` denies every indeterminate path (unparseable payload, absent payload, missing tool name, unknown tool, corrupt configuration, unhandled exception). `GUARD-1` now covers the shell, file and GitHub-API routes. `GUARD-3` covers default-branch writes through the shell and the API, including pull-request merges. `GUARD-4` enforces the active stage's own blocked list. Read-only tools are excluded from the matcher and governance paths stay writable, so neither inspection nor repair can be blocked by a broken guard.
- **`doctrine/MUTATION_SURFACE.json`** — new. The inventory the matcher, the guard and the drill are all derived from, with verb rules for unlisted tools inside covered namespaces and an explicit list of routes that remain uncovered.
- **`.claude/settings.json`** — the matcher is generated from that inventory; gate G2 fails when they drift.
- **`.githooks/pre-commit`, `.githooks/pre-push`** — fail closed on a missing interpreter, an invalid orientation, red gates, a default-branch target and a Doctrine remote.
- **`scripts/doctrine-gate.py`** — new. Five anchored gates: G1 the C-0006-class gate over the binding documents with a two-sided armed-count ratchet and a refusal to let the hook layer claim `ARMED`; G2 the wiring gate; G3 the git-hook fail-closed gate; G4 obligation honesty; G5 banned claims and reserved contact values in rendered copy.
- **`doctrine/RATCHETS.json`** — new. The armed count is 8, equal in both directions.
- **`.github/workflows/doctrine.yml`** — new, inert until the governor enables Actions and adds the read credential; it refuses to run without the credential rather than passing having verified nothing.
- **`scripts/doctrine-drill.py`** — rewritten. Every case asserts the specific rule and route of a denial, or the specific reason of a permission; a case that fired for another reason is STALE and fails.

## 4. Mutation surface examined

27 read-only and 6 session-local tools (never matched, so inspection survives any guard malfunction), and 61 mutation-capable tools in the matched classes: LOCAL_WRITE 4, SHELL 1, REMOTE_REPO_WRITE 24, PUBLICATION 2, DELEGATION 3, EXTERNAL_WRITE 19, SCHEDULING 8.

Declared uncovered, honestly:

| Route | State |
|---|---|
| A tool the harness adds after this inventory that matches no namespace rule | UNARMED at the hook layer — OBL-GAL-009 |
| Tool calls made inside a subagent | UNKNOWN — UNK-GAL-002; delegation is itself a guarded act |
| A guard process that never starts (missing interpreter, deleted file) | Structurally fail-open: the host treats any non-zero exit other than 2 as non-blocking — OBL-GAL-010 |
| A human with a terminal | By design outside the hook's reach; held by the git hooks, and by CI once enabled |

## 5. Drill

Stamp `20260904T081008Z` · **{'PASS': 73, 'DECORATIVE': 0, 'STALE': 0, 'RED': 0}** · artifacts under `.doctrine/runtime/drills/20260904T081008Z/`.

| Case | Verdict | Asserted | Title |
|---|---|---|---|
| D-01 | PASS | pass:exit 0 | baseline: seam orient against the real checkout is green |
| D-02 | PASS | pass:exit 0 | baseline: seam check for the same session is green |
| D-03 | PASS | pass:exit 0 | baseline: all repository gates are green on the real tree |
| D-04 | PASS | fail:canon fingerprint mismatch | Canon byte-tampered in a clone → central bootstrap refuses |
| D-05 | PASS | fail:modified in the working tree | Canon tampered → the seam sees the dirty worktree before the bootstrap runs |
| D-06 | PASS | fail:missing required file | Canon removed (subject removal) → central bootstrap refuses |
| D-07 | PASS | fail:candidate_register fingerprint mismatch | Candidate Register tampered → refused (trial defect B6 class) |
| D-08 | PASS | fail:bootstrap fingerprint mismatch | bootstrap tampered → the seam refuses BEFORE executing it (marker never written) |
| D-09 | PASS | fail:bound commit mismatch | checkout on the parent commit → bound commit mismatch |
| D-10 | PASS | fail:module file fingerprint mismatch | module file tampered → manifest expansion refuses (the bootstrap alone cannot see this) |
| D-11 | PASS | fail:version contradiction | binding claims a different Doctrine version than VERSION.json → contradiction refused |
| D-12 | PASS | fail:not ACTIVE | binding status not ACTIVE → refused |
| D-13 | PASS | fail:missing required fields | required continuity field missing from product state → refused |
| D-14 | PASS | fail:does not match | product id differs between binding and state → refused |
| D-15 | PASS | fail:different session | receipt from another session → check refuses |
| D-16 | PASS | fail:STALE | product state edited after orientation → check reports STALE |
| D-17 | PASS | fail:Doctrine root | Doctrine root missing → refused |
| D-18 | PASS | fail:has not oriented | no orientation receipt at all → check refuses |
| D-19 | PASS | deny:GUARD-0 | guard: malformed JSON payload → DENIED, not allowed |
| D-20 | PASS | deny:GUARD-0 | guard: empty payload → DENIED |
| D-21 | PASS | deny:GUARD-0 | guard: payload carrying no tool name → DENIED |
| D-22 | PASS | deny:GUARD-0 | guard: payload that is a JSON array, not an object → DENIED |
| D-23 | PASS | deny:GUARD-0 | guard: corrupt mutation-surface file (internal malfunction) → DENIED, not allowed |
| D-24 | PASS | deny:GUARD-2 | guard: the seam it depends on is missing → consequential act DENIED |
| D-25 | PASS | deny:GUARD-0 | guard: a tool outside the inventoried surface → DENIED as indeterminate |
| D-26 | PASS | deny:GUARD-2 | guard: `git commit` with no orientation for the session → DENIED |
| D-27 | PASS | allow:shell-consequential-oriented | guard: `git commit` with valid orientation → ALLOWED (anti-vacuous) |
| D-28 | PASS | allow:shell-not-consequential | guard: reading files is allowed even with no orientation (inspection survives) |
| D-29 | PASS | deny:GUARD-1 | guard: `rm` inside the Doctrine checkout → DENIED |
| D-30 | PASS | deny:GUARD-1 | guard: push to a builders-doctrine remote URL → DENIED |
| D-31 | PASS | allow:shell-not-consequential | guard: reading the Doctrine checkout → ALLOWED (anti-vacuous) |
| D-32 | PASS | deny:GUARD-3 | guard: commit on the default branch → DENIED |
| D-33 | PASS | deny:GUARD-1 | guard: Write into the Doctrine checkout → DENIED |
| D-34 | PASS | deny:GUARD-1 | guard: Edit inside the Doctrine checkout → DENIED |
| D-35 | PASS | deny:GUARD-1 | guard: NotebookEdit inside the Doctrine checkout → DENIED |
| D-36 | PASS | deny:GUARD-2 | guard: Write to product source with no orientation → DENIED |
| D-37 | PASS | allow:write-governance-path | guard: Write to a governance path with no orientation → ALLOWED (the repair path) |
| D-38 | PASS | deny:GUARD-4 | guard: Write application source while the stage blocks it → DENIED |
| D-39 | PASS | allow:write-product-path-oriented | guard: Write a product document while oriented → ALLOWED (anti-vacuous) |
| D-40 | PASS | deny:GUARD-0 | guard: local-write tool with no path this guard can read → DENIED |
| D-41 | PASS | deny:GUARD-1 | guard: GitHub API write to builders-doctrine → DENIED |
| D-42 | PASS | deny:GUARD-3 | guard: GitHub API push_files to the default branch → DENIED |
| D-43 | PASS | deny:GUARD-3 | guard: merging a pull request → DENIED |
| D-44 | PASS | allow:github-api-oriented | guard: GitHub API write to the feature branch while oriented → ALLOWED (anti-vacuous) |
| D-45 | PASS | allow:read_only-tool | guard: GitHub API read verb → ALLOWED as read-only |
| D-46 | PASS | deny:GUARD-2 | guard: an unlisted GitHub write verb with no orientation → DENIED |
| D-47 | PASS | deny:GUARD-2 | guard: starting a subagent with no orientation → DENIED |
| D-48 | PASS | deny:GUARD-2 | guard: publishing an Artifact with no orientation → DENIED |
| D-49 | PASS | deny:GUARD-2 | guard: external write with no orientation → DENIED |
| D-50 | PASS | deny:GUARD-2 | guard: creating a durable trigger with no orientation → DENIED |
| D-51 | PASS | allow:session_local-tool | guard: session-local bookkeeping → ALLOWED without orientation |
| D-52 | PASS | pass:exit 0 | git pre-commit with valid orientation and green gates → allows |
| D-53 | PASS | fail:orientation invalid | git pre-commit with a foreign session id → refuses |
| D-54 | PASS | fail:commit refused | git pre-commit with no python3 on PATH → REFUSES (was: exited 0) |
| D-55 | PASS | fail:repository gates failed | git pre-commit with a red repository gate → refuses the commit |
| D-55b | PASS | fail:direct commit on 'main' | git pre-commit on a default branch → refuses |
| D-56 | PASS | fail:read-only | git pre-push to a builders-doctrine URL → refuses |
| D-57 | PASS | fail:refs/heads/main | git pre-push to refs/heads/main → refuses |
| D-58 | PASS | pass:exit 0 | git pre-push to the feature branch with valid orientation → allows |
| D-59 | PASS | fail:GAL-FAKE | gate G1: a FIXED decision claiming ARMED on a locus that does not exist → RED |
| D-60 | PASS | fail:fell | gate G1: the armed count falling below the ratchet → RED (two-sided) |
| D-61 | PASS | fail:ARMED_AS_CONFIGURED at most | gate G1: claiming ARMED on a hook-layer locus → RED (layers may not stand in for each other) |
| D-62 | PASS | fail:does not cover | gate G2: a mutation-capable tool the matcher does not cover → RED |
| D-63 | PASS | fail:discards its own output | gate G2: a hook that discards its own output → RED |
| D-64 | PASS | fail:fail-open path | gate G3: a git hook restored to fail-open on a missing interpreter → RED |
| D-65 | PASS | fail:banned platform claim | gate G5: a banned platform claim planted in product copy → RED |
| D-66 | PASS | fail:outside the reserved test domains | gate G5: a real-world email planted in a committed surface → RED |
| D-67 | PASS | fail:ANCHOR MISSING | gate G1: its subject removed → dies RED rather than passing vacuously |
| D-68 | PASS | fail:OBL-FAKE | gate G4: an obligation with no activation condition → RED |
| D-69 | PASS | pass:exit 0 | drill coverage is DERIVED: every matched mutation class has at least one case |
| D-70 | PASS | pass:exit 0 | the drill's own grammar refuses a pass that fired for the wrong reason |
| D-71 | PASS | pass:exit 0 | the standing assessment reports exactly the counts planted in a fixture |
| D-72 | PASS | unchanged | central Doctrine worktree unchanged |

## 6. Repository gates

```text
PASS G1  8 armed (GAL-07:ARMED, GAL-G1:ARMED_AS_CONFIGURED, GAL-G2:ARMED_AS_CONFIGURED, GAL-G4:ARMED, GAL-G6:ARMED_AS_CONFIGURED, GAL-G7:ARMED, GAL-G8:ARMED, GAL-G9:ARMED_AS_CONFIGURED), 25 honestly disarmed, 0 laundering; count equals the recorded ratchet
PASS G2  matcher covers all 61 mutation-capable tools; read-only tools excluded; commands reference existing scripts and discard nothing
PASS G3  pre-commit and pre-push present, executable, invoke the seam and the gates, and carry no fail-open path
PASS G4  15 obligations each carry an activation condition and a future acceptance test; the active stage names its acceptance condition
PASS G5  10 rendered copy surfaces carry no banned platform claim and no real-person contact value
DOCTRINE GATES: PASS — 5 of 5 checks green
```

## 7. What is now genuinely enforced, by layer

| Layer | Binds | State | Evidence |
|---|---|---|---|
| Seam (`doctrine-orient.py`) | anything that calls it | ARMED | D-01 to D-18 |
| Repository gates (`doctrine-gate.py`) | the commit and push path | ARMED | D-03, D-59 to D-68 |
| Git hooks | every local commit and push in this checkout, by any actor | ARMED (residue: `--no-verify`) | D-52 to D-58 |
| Harness guard | agent sessions whose host loaded the hook configuration | ARMED-AS-CONFIGURED | D-19 to D-51 |
| CI at the pull-request chokepoint | everyone, including a human | UNARMED — not enabled | — |
| Branch protection | pushes and merges to the default branch | UNARMED — `main` does not exist | — |

Armed FIXED decisions: 8 of 33 (GAL-07, GAL-G1, GAL-G2, GAL-G4, GAL-G6, GAL-G7, GAL-G8, GAL-G9), held as a two-sided ratchet.

## 8. Still NOT SEEN, UNKNOWN, UNARMED or BLOCKED

| Item | State | Activation condition |
|---|---|---|
| OBL-GAL-001 | OPEN | The governor reviews the Stage 1 artefacts and rules on the strategic decisions in product/decisions/STAGE1-GOVERNOR-DECISION-INSTRUMENT.md. |
| OBL-GAL-002 | NOT_SEEN | A fresh harness session starts with this branch checked out and .claude/settings.json present at session start. |
| OBL-GAL-003 | UNARMED | GitHub Actions is enabled for the repository and a read credential for builders-doctrine is stored as the repository secret named in doctrine/EXTERNAL |
| OBL-GAL-004 | STANDING | The default branch of builders-doctrine advances beyond the bound commit. |
| OBL-GAL-005 | OPEN | The governor merges this branch, creating main. |
| OBL-GAL-006 | UNARMED | Stage 2 creates the first executable test suite. |
| OBL-GAL-008 | OPEN | The governor provisions the items listed in product/STAGE_2_VERTICAL_SLICE.md §4 and doctrine/EXTERNAL_ENABLEMENT.md. |
| UNK-GAL-001 | UNKNOWN | The governor reports the state of OBL-UXDA-001 in builders-doctrine, or that repository's VERSION.json records its closure. |
| OBL-GAL-009 | UNARMED | The harness announces a tool that is not in the inventory and not covered by a namespace rule. |
| OBL-GAL-010 | UNARMED | CI runs the gates at the pull-request chokepoint, so that any act which slipped a dead hook is still caught before it reaches the default branch. |
| UNK-GAL-002 | UNKNOWN | A fresh session with hooks live runs a delegated agent that attempts a denied act. |
| OBL-GAL-011 | OPEN | main exists and GitHub Actions is enabled. |
| OBL-GAL-012 | UNARMED | Stage 2 creates the first application source file or committed fixture. |

## 9. Governor and platform actions required

`doctrine/EXTERNAL_ENABLEMENT.md` carries the five items in full: enable GitHub Actions; add the
read-only `DOCTRINE_READ_TOKEN` secret; create `main` by merging this branch and protect it with
the Doctrine check required; run `doctrine/receipts/HOOK_LIVENESS_VERIFICATION.md` in a fresh
session; and the Stage 2 provisioning that was already outstanding.

## 10. Honest ceiling

Stage 0 is **not** completely closed. Host invocation of this project's hooks has never been
observed, CI is not enabled, `main` does not exist and branch protection is unset. The strongest
truthful statement the evidence supports is: the repository-local layers are fail-closed,
compulsory for local git, and drilled under their own violations; the harness layer is
fail-closed in its logic and unproven in its execution; the trunk layer does not exist yet.
