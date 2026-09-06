# Git-layer independence — OBL-GAL-013 repaired and proved, 2026-09-06

**Branch:** `claude/gallery-hook-liveness-verify-bzn5c6` · **Doctrine:** `dfdecb651df8cef5387487fee21d8ee2f798db95`
**Bounded to:** making the local git layer independent of the host hook, proving it against an isolated fresh checkout, and dispositioning the host-topology limitation. No Stage 2, no interface work, no product-decision change, no provisioning, no `main`, no write to `builders-doctrine`.

## 1. The defect

`core.hooksPath` was set in exactly one place: `session_start` in `scripts/doctrine-hook.py` — the harness hook. So the layer the binding documents described as **compulsory** was armed by the layer they described as **as-configured**, and in a checkout where the harness never loaded this project's configuration the governed hooks ran on nothing. Observed directly on 2026-09-06: a deliberate `git commit --allow-empty` reached a branch with no refusal from any layer.

Gate G3 checked that the hook files existed, were executable and carried no `exit 0` on a failure path — all true, and none of it evidence that git would ever run them. Existence is not execution; this repository had written that down as L-A17 and had not applied it to itself.

## 2. The repair — both complementary mechanisms

### 2.1 `scripts/doctrine-orient.py orient` is now a coherent six-step sequence

| Step | What it does | Function |
|---|---|---|
| 1 | Identify and validate the Gallery repository root | `validated_repo_root` |
| 2 | Validate the live Doctrine binding — bootstrap fingerprint, bound commit, bound artifacts, version manifest, module manifests | `preflight` |
| 3 | Configure the governed git-hook path, local repository configuration only | `arm_git_hooks` |
| 4 | Verify the **effective** configuration git would use, not the value just written | `inspect_git_hooks` |
| 5 | Establish the orientation receipt for this session | `run_bootstrap` |
| 6 | Run the repository gates | `run_gates` |

Fail-closed at every step. `arm_git_hooks` refuses when the checkout is not a git worktree or when the Gallery root is not the root of its own worktree, refuses when git rejects the write, and refuses when the value written does not take effect.

**The arming is deliberately placed before the gating.** A fresh checkout is red at G3 precisely because `core.hooksPath` is unset; if the gates ran first, the command that repairs the absence would be blocked by the absence it exists to repair. Step 6 runs last so that steps 3 and 4 can heal the checkout on the way past.

### 2.2 Gate G3 verifies the effective configuration, independently

`git_config_hooks_path` in `scripts/doctrine-gate.py` reads git directly. It does not import the seam and does not ask the seam whether the seam did its job — a gate that trusts the thing it checks verifies nothing. Five red verdicts:

| Status | Condition |
|---|---|
| `NOT_A_GIT_WORKTREE` | the checkout is not inside a git worktree, so `.githooks` runs on no commit path |
| `DISPLACED_WORKTREE` | the governed hooks are not at the worktree root, so they belong to another repository's commit path |
| `UNARMED` | `core.hooksPath` is not configured |
| `DISPLACED_HOOKS_PATH` | it resolves somewhere other than the governed `.githooks` |
| `INCOMPLETE` | it resolves correctly but carries no executable `pre-commit` / `pre-push` |

A relative value is resolved against the worktree root, as git resolves it.

The arming in `scripts/doctrine-hook.py session_start` is retained as a convenience. It is no longer the only place it happens, which was the whole defect.

## 3. The fresh-checkout proof

One **ordered** sequence against a single isolated checkout with no inherited local git configuration, built by `scratch_project(..., arm=False)`. Every case drives the real door: **git itself** runs the hook through `core.hooksPath`. Cases D-52 … D-58 already prove hook *content* by executing the hook file; content and invocation are different claims, and this repository has been wrong about the difference once.

| # | Case | Required | Result |
|---|---|---|---|
| D-73 | a fresh checkout carries no `core.hooksPath` | empty | PASS |
| D-74 | it reports itself unarmed and names its repair | `git hooks: UNARMED` + repair line | PASS |
| D-75 | gate G3 before orientation | RED naming `core.hooksPath` | PASS |
| D-76 | `orient` establishes the configuration | `core.hooksPath` = `.githooks` | PASS |
| D-77 | gate G3 after orientation | PASS | PASS |
| D-78 | REAL `git commit` with a foreign session receipt | refused, "orientation invalid" | PASS |
| D-79 | REAL `git commit` on a feature branch, valid orientation, green gates | lands, HEAD count moves | PASS |
| D-80 | REAL `git commit` on the default branch | refused, "direct commit on 'main'" | PASS |
| D-81 | REAL `git push` to `refs/heads/main` | refused | PASS |
| D-82 | REAL `git push` at a `builders-doctrine` remote | refused, "read-only" | PASS |
| D-83 | REAL `git push` to a feature ref | allowed (anti-vacuous) | PASS |
| D-84 | `--no-verify` still bypasses, and the repository says so | bypass lands **and** is named in the CI workflow and the external-enablement instrument | PASS |
| D-85 | `core.hooksPath` unset after orientation | G3 RED | PASS |
| D-86 | `core.hooksPath` displaced to a directory of permissive hooks | G3 RED | PASS |
| D-87 | re-running orientation repairs it | G3 green | PASS |

Every case asserts its specific mechanism and verdict. `fails(phrase)` requires a non-zero exit **and** the exact refusal text; a case that failed for another reason is STALE, which is a failure. D-86 plants hooks that are present, executable and would exit 0 — proving G3 tests the *governed* path and not merely that some hook exists. D-84 asserts an honesty claim, not only a behaviour: the bypass must land **and** be written down in both places that promise to catch it.

**Anti-vacuity elsewhere.** `scratch_project` now arms `core.hooksPath` by default, modelling an oriented checkout. Without that, G3 would be red in every fixture and D-55's "repository gates failed" would pass whether or not its own planted violation fired.

**Drill totals: 73 → 88 cases, 0 DECORATIVE, 0 STALE, 0 RED.** Gates 5 of 5 PASS.

## 4. `builders-doctrine` — unchanged

| | Before | After |
|---|---|---|
| `HEAD` | `dfdecb651df8cef5387487fee21d8ee2f798db95` | identical |
| `HEAD^{tree}` | `71366c55ed1de19ffe31c9f65744dc98048c6a8e` | identical |
| `git status --porcelain` | empty | empty |
| sha256 over every file | `c2265b45354c9b7c858920f7eebe4ef4335279f806f348159d19a90bd721ba64` | identical |

Drill case D-72 re-asserts this independently at the end of every run. The push-refusal case D-82 targets a **local bare repository** whose path contains `builders-doctrine`, so the URL rule is drilled without a network and without approaching the real remote.

## 5. Host topology — dispositioned, not reopened

Recorded in `doctrine/PRODUCT_STATE.json` (OBL-GAL-002, and a topology qualifier on the layer notes of GAL-G1, GAL-G2, GAL-G6 and GAL-G9), in `doctrine/EXTERNAL_ENABLEMENT.md` item 4, and in `CLAUDE.md`:

- The host hook is `ARMED_AS_CONFIGURED` **only when `Thegallery` is itself the host project root**.
- It is **not a compulsory enforcement layer** in the present multi-repository topology, where the product and the Doctrine checkout sit as siblings beneath a parent the harness treats as the project root.
- OBL-GAL-002 stays open, activation-conditioned on a future environment that opens `Thegallery` as the actual project root.
- This is **not a blocker** to product development once independent repository and trunk enforcement exist — which, for the repository layer, is what §2 and §3 above establish.
- **No third liveness experiment is authorised** unless the hosting topology materially changes, and no session claims automatic host orientation while the topology prevents it. `CLAUDE.md` no longer claims it.

## 6. CI readiness — reviewed, not armed

`.github/workflows/doctrine.yml` and `doctrine/EXTERNAL_ENABLEMENT.md` were reviewed against the five criteria. No change to the job's logic was needed; the ordering dependence the repair introduces is now written into the file so it survives editing.

| Criterion | Finding |
|---|---|
| Independent of host hooks and local git configuration | `actions/checkout` produces a fresh clone with no inherited configuration and no harness; the Orient step arms `core.hooksPath` itself |
| Validates the live bound Doctrine commit and fingerprints | reads the pinned commit from the binding, clones and checks it out, and orientation fingerprints the bootstrap, the bound artifacts, the version manifest and the module manifests |
| Runs the repository gates and the drill | both, as separate steps, with the drill's evidence uploaded as a run artifact |
| Refuses to green without its read-only Doctrine credential | an explicit step fails with an error annotation when `DOCTRINE_READ_TOKEN` is unset, before anything can report success |
| Can become a required check on protected main | the job name `Doctrine / Orientation, gates and drill` is stable and is the string named in `EXTERNAL_ENABLEMENT.md` item 3 |

One ordering constraint is now load-bearing and is commented in the file: **Orient must run before Repository gates**, because G3 is red until orientation has set the hook path.

**CI is not armed.** GitHub Actions is not enabled, `DOCTRINE_READ_TOKEN` does not exist, `main` does not exist and branch protection is unset. Those are items 1–3 of the external-enablement instrument and remain governor and platform actions. Nothing in this change makes CI or the trunk layer live.

## 7. Enforcement, layer by layer, after this change

| Layer | State | Holds |
|---|---|---|
| Guard script behaviour | PROVEN | 88 drill cases, 0 red |
| Hook configuration | PROVEN | gate G2 |
| Repository gates | PROVEN | gate G1–G5, on the commit and push path |
| **Local git layer** | **ARMED, and now independent** | armed by the seam on every orientation, verified by G3, drilled end to end through git's own invocation. Residues: `--no-verify`, and a checkout that commits before it has ever oriented — both held only by CI and a protected trunk |
| Harness hook layer | ARMED_AS_CONFIGURED where this repository is the host project root; executes nothing in the present topology | dispositioned, OBL-GAL-002 |
| CI at the pull-request chokepoint | UNARMED | OBL-GAL-003, external items 1–2 |
| Trunk / branch protection | UNARMED, state UNKNOWN | OBL-GAL-005, OBL-GAL-011, external item 3 |

`armed_fixed_decisions` stays at **8** and `doctrine/RATCHETS.json` is unchanged. This repair made a standing claim true rather than arming a new one, and a ratchet that moved without a state change would be noise in the one instrument that exists to make movement visible.
