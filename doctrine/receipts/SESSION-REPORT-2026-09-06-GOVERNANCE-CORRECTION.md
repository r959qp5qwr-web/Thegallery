# Session report — repository-governance correction, 2026-09-06

**Session:** `9e4e9e82-091a-58bd-96d4-39aae1304020` · **Branch:** `claude/gallery-hook-liveness-verify-bzn5c6`
**Commits produced:** `5575a7d`, `2789102`, **`b8e890e`**
**Doctrine:** `dfdecb651df8cef5387487fee21d8ee2f798db95`, read-only, byte-identical throughout

This is the **second** report of this session. The first, `SESSION-REPORT-2026-09-06.md`, covers
the hook-liveness verification pass and holds its raw evidence. This one covers the whole
session arc so it stands alone, and goes deep on the governance correction that followed.

**Result:** the local git layer no longer depends on the harness hook, and is proved to enforce
by git's own invocation in a checkout that inherited nothing. The host-hook limitation is
dispositioned rather than reopened. The repository layer is closed as far as a repository can
close it; CI and the trunk remain governor and platform actions.

---

## 1. Session arc, in two passes

| Pass | Bounded to | Outcome |
|---|---|---|
| 1 — verification | determine whether a fresh session closes the host-hook liveness gap | **FAILED**, cause named: project-settings discovery. Recorded, not compensated for |
| 2 — correction | make the git layer independent of the host hook; disposition the topology limitation | **DONE**, proved against a fresh checkout, 73 → 88 drill cases |

The two are causally linked, and that is the point of reporting them together. Pass 1 was asked
for a negative or a positive about hook liveness. It returned a negative — and, while returning
it, tripped over something nobody had asked about: the commit it used as a canary met **no
refusal from any layer**, including the one the binding documents called compulsory. Pass 2 is
the repair of that second finding.

---

## 2. Pass 1 — what was established, in one page

The session was genuinely fresh and `.claude/settings.json` was tracked in the checked-out
commit and on disk 1.87 seconds before the harness's first settings load. No project hook fired.
The harness's own diagnostics recorded exactly one hook spawn in the entire session:

```
05:15:24.556Z hook_spawn_started   {"hook_event_name":"SessionStart","index":0}
05:15:24.591Z hook_spawn_completed {"hook_event_name":"SessionStart","index":0,
                                    "duration_ms":58,"exit_code":0,"aborted":false}
```

That is the harness's own git-identity hook, from a settings file at the project root. Zero
`PreToolUse` spawns against fourteen `Bash` calls and one `Write` call the matcher covers.

**Cause: project-settings discovery.** The session's working directory was `/home/user`, the
parent of both repositories; the harness looks for project settings at `<project root>/.claude/`
only; the Gallery's file sits one level deeper and was never a candidate. Snapshot timing,
matcher behaviour, guard logic and a broken hook door were each ruled out by this session's own
evidence.

Both canaries were reversed in the session that made them. Full evidence:
`HOOK_LIVENESS_ATTEMPT-2026-09-06.md`.

### The finding pass 1 was not looking for

The canary commit `git commit --allow-empty` met **no refusal from `.githooks/pre-commit`
either**. `git config core.hooksPath` returned nothing. The reason was one line:

```
scripts/doctrine-hook.py:379   (inside session_start)
    git -C <project> config core.hooksPath .githooks
```

The arming lived only inside the harness hook. So the layer the binding documents described as
**compulsory** was armed by the layer they described as **as-configured**, and a fresh clone ran
no hook at all. Pass 1 recorded this as `OBL-GAL-013` with two candidate repairs and deliberately
did not act on it: moving `armed_fixed_decisions` is a recorded governed movement, and that pass
was bounded to verification.

---

## 3. Pass 2 — the defect, precisely

Two failures of the same kind, at different altitudes.

**At the mechanism.** `.githooks/pre-commit` and `pre-push` are fail-closed in content: they
refuse on an invalid orientation, a red gate, or a missing interpreter. None of that matters if
git never runs them, and git runs them only when `core.hooksPath` says so.

**At the instrument.** Gate G3 checked the hooks were present, executable and carried no `exit 0`
on any failure path — all true — and never checked that git was configured to run them. This
repository had already written down **L-A17: existence is not execution** and had not applied it
to itself. An honesty instrument that checks the artefact rather than the effect will certify a
dead layer indefinitely.

There was also a documentation falsehood sitting on top: `README.md` said "core.hooksPath is set
by the seam". `scripts/doctrine-orient.py` never touched it.

---

## 4. The repair

Both complementary mechanisms, adopted together rather than choosing between them. One arms; the
other refuses to believe the arming happened.

### 4.1 The orientation sequence

`scripts/doctrine-orient.py orient` is now six ordered steps, fail-closed at each:

| Step | Action | Function |
|---|---|---|
| 1 | Identify and validate the Gallery repository root | `validated_repo_root` |
| 2 | Validate the live Doctrine binding — bootstrap fingerprint, bound commit, bound artifacts, version manifest, module manifests | `preflight` |
| 3 | Configure `core.hooksPath` → `.githooks`, local repository configuration only | `arm_git_hooks` |
| 4 | Verify the **effective** configuration git would use | `inspect_git_hooks` |
| 5 | Establish the orientation receipt for this session | `run_bootstrap` |
| 6 | Run the repository gates | `run_gates` |

Three design decisions inside this are load-bearing:

**Verify the effect, not the write.** Step 4 does not trust the value step 3 just wrote. It asks
git what the effective `core.hooksPath` is, resolves a relative value against the worktree root
exactly as git does, and requires it to land on the governed directory with both hooks present
and executable. A configuration that was written and did not take effect fails orientation.

**Arm before you gate.** Step 6 runs last on purpose. A fresh checkout is red at G3 *because*
`core.hooksPath` is unset. If the gates ran first, the one command that repairs the absence would
be blocked by the absence it exists to repair — a governance instrument that locks the door on
the locksmith. The task called this "preserve a repair path"; the ordering is how it is preserved,
and drill case D-87 is what stops a later edit from reordering it silently.

**Refuse a displaced root.** `arm_git_hooks` fails when the checkout is not a git worktree, and
when the Gallery root is not the root of *its own* worktree — otherwise the governed hooks could
be armed onto some enclosing repository's commit path. That is the same class of mistake as the
project-root failure in pass 1, caught this time before it can happen.

### 4.2 The gate

`git_config_hooks_path` in `scripts/doctrine-gate.py` reads git directly. It does **not** import
the seam. A gate that asked `doctrine-orient.py` whether `doctrine-orient.py` had done its job
would be verifying nothing — the two implementations are deliberately independent so that a bug
in one is visible to the other.

Five red verdicts, each naming its cause:

| Status | Condition |
|---|---|
| `NOT_A_GIT_WORKTREE` | not inside a worktree, so `.githooks` runs on no commit path |
| `DISPLACED_WORKTREE` | governed hooks are not at the worktree root |
| `UNARMED` | `core.hooksPath` is not configured |
| `DISPLACED_HOOKS_PATH` | resolves somewhere other than the governed `.githooks` |
| `INCOMPLETE` | resolves correctly but carries no executable `pre-commit` / `pre-push` |

Each red verdict names the repair command, so a red gate teaches rather than merely blocks.

The arming in `scripts/doctrine-hook.py session_start` is **retained** as a convenience. Removing
it would have been tidier and worse: the defect was that it was the *only* place, not that it
existed. `README.md`'s claim is now true.

---

## 5. The proof

One **ordered sequence** against a single isolated checkout built with no inherited local git
configuration. Every case drives the real door: **git itself** runs the hook through
`core.hooksPath`. Cases D-52 … D-58 already prove hook *content* by executing the hook file.
Content and invocation are different claims, and this repository has been wrong about the
difference once.

| # | Case | Required | Result |
|---|---|---|---|
| D-73 | fresh checkout carries no `core.hooksPath` | empty | PASS |
| D-74 | it reports itself unarmed and names its repair | `git hooks: UNARMED` + repair line | PASS |
| D-75 | gate G3 before orientation | RED naming `core.hooksPath` | PASS |
| D-76 | `orient` establishes the configuration | `core.hooksPath` = `.githooks` | PASS |
| D-77 | gate G3 after orientation | PASS | PASS |
| D-78 | REAL `git commit`, foreign session receipt | refused, "orientation invalid" | PASS |
| D-79 | REAL `git commit`, feature branch, valid orientation, green gates | lands, HEAD count moves | PASS |
| D-80 | REAL `git commit` on the default branch | refused, "direct commit on 'main'" | PASS |
| D-81 | REAL `git push` to `refs/heads/main` | refused | PASS |
| D-82 | REAL `git push` at a `builders-doctrine` remote | refused, "read-only" | PASS |
| D-83 | REAL `git push` to a feature ref | allowed | PASS |
| D-84 | `--no-verify` bypasses, and the repository says so | bypass lands **and** is named in two places | PASS |
| D-85 | `core.hooksPath` unset after orientation | G3 RED | PASS |
| D-86 | `core.hooksPath` displaced to permissive hooks | G3 RED | PASS |
| D-87 | re-running orientation repairs it | G3 green | PASS |

### Why these particular cases

**D-86 is the anti-vacuity case for G3 itself.** It plants hooks that are present, executable and
would exit 0, then points `core.hooksPath` at them. A gate that merely asked "does some hook run?"
would pass. G3 goes red because the path is not the *governed* one. Contradictory configuration
is not permission.

**D-84 asserts an honesty claim, not only a behaviour.** It requires the `--no-verify` bypass to
land *and* to be named as a residue in both `.github/workflows/doctrine.yml` and
`doctrine/EXTERNAL_ENABLEMENT.md`. A residue that stops being written down becomes a claim that
is not true, and this is the case that notices.

**D-79 and D-83 are the anti-vacuous pair.** A layer that refuses everything is not enforcement,
it is breakage. The legitimate commit and the legitimate push must still land, and they do.

**D-82 avoids the network entirely.** It pushes at a *local bare repository* whose path contains
`builders-doctrine`, so the URL rule is drilled without approaching the real remote.

### Anti-vacuity elsewhere in the suite

`scratch_project` now arms `core.hooksPath` by default, modelling an oriented checkout. Without
that change, G3 would have been red in every fixture, and D-55's expectation of "repository gates
failed" would have passed whether or not its own planted violation fired. Adding a gate check
without this would have quietly hollowed out four existing cases — the failure mode is not
hypothetical, it is exactly what the drill's STALE verdict exists to catch.

**Totals: 88 cases, 88 PASS, 0 DECORATIVE, 0 STALE, 0 RED** (was 73). Gates 5 of 5.

---

## 6. Governance movement

### Resolved

`OBL-GAL-013` → **RESOLVED**, with both mechanisms described, the fifteen-case proof named, and
its acceptance test rewritten to something a future session can re-run.

### Corrected, without touching a product decision

| Clause | Change |
|---|---|
| `GAL-G7` | `enforcement_locus` now names the arming and the gate that holds it; `layer_note` names both residues and the drill range |
| `GAL-G1`, `GAL-G2`, `GAL-G6`, `GAL-G9` | `layer_note` carries the host-topology qualifier |

Field-level comparison against `HEAD` confirms: no change to any decision's substance, no change
to `open_governor_decisions`, `refusal_register`, `promise_table`, `active_stage`,
`product_sentence`, `human_surface_state`, `recommended_decisions` or `mandated_outcomes`.
Obligation membership unchanged apart from `OBL-GAL-013`'s state.

### The ratchet did not move — deliberately

`armed_fixed_decisions` stays at **8** and `RATCHETS.json` is untouched. This repair made a
*standing claim true* rather than arming a new one. `GAL-G7` claimed `ARMED` before and claims
`ARMED` now; what changed is that the claim is now supported. Moving the ratchet would have
recorded a payoff that did not happen, in the one instrument whose entire purpose is making
real movement visible.

### Preserved with truthful activation conditions

`OBL-GAL-002` (host topology), `OBL-GAL-003` (CI), `OBL-GAL-010` (host exit-code fail-open),
`OBL-GAL-011` (branch protection), and every other obligation, unchanged in substance.
`OBL-GAL-003` gained one sentence naming the two local residues that sit behind the CI boundary.

### Ledger

`GAL-L0011` records both the mechanism failure and the meta-failure: a limitation that cannot be
closed from inside the product is a disposition to record, not an experiment to repeat. Two
passes had each produced a truthful negative and left the same obligation open.

---

## 7. Host topology — dispositioned, not reopened

Recorded in three places so a future session cannot re-derive it as a fresh question:

- **`PRODUCT_STATE.json`** — `OBL-GAL-002` carries the disposition, the evidence from both
  attempts, and an activation condition that fires only on a material topology change. The four
  hook-layer clauses carry the qualifier in their layer notes.
- **`EXTERNAL_ENABLEMENT.md` item 4** — rewritten from "run the verification" to "dispositioned,
  not an open experiment", with **no third liveness experiment authorised** stated explicitly.
- **`CLAUDE.md`** — the line claiming the SessionStart hook "runs this automatically" is gone.
  A blank session is now told to orient by hand and to assume nothing oriented it.

The disposition itself:

> The host hook is `ARMED_AS_CONFIGURED` **only when `Thegallery` is itself the host project
> root**. It is **not a compulsory enforcement layer** in the present multi-repository topology.
> `OBL-GAL-002` stays activation-conditioned on a future environment that opens `Thegallery` as
> the actual project root. This is **not a blocker** to product development, because the commit
> and push routes are held compulsorily by `GAL-G7` and `GAL-G8` and the trunk boundary by CI and
> branch protection.

Correcting `CLAUDE.md` was the one edit outside the stated scope, and it is the one the
disposition compels: an orientation file that promises automatic orientation the platform cannot
deliver is the exact category of claim this pass exists to remove.

---

## 8. CI readiness — reviewed, not armed

Reviewed `.github/workflows/doctrine.yml` and `doctrine/EXTERNAL_ENABLEMENT.md` against the five
criteria. The job's logic needed no change; one ordering constraint became load-bearing and is now
commented so it survives editing.

| Criterion | Finding |
|---|---|
| Independent of host hooks and local git configuration | `actions/checkout` yields a fresh clone with no inherited configuration and no harness present; the Orient step arms `core.hooksPath` itself |
| Validates the live bound Doctrine commit and fingerprints | reads the pinned commit from the binding, clones and checks it out, and orientation fingerprints the bootstrap, bound artifacts, version manifest and module manifests |
| Runs the repository gates and relevant drills | both, as separate steps, drill evidence uploaded as a run artifact |
| Refuses to green without its read-only Doctrine credential | an explicit step fails with an error annotation when `DOCTRINE_READ_TOKEN` is unset, before anything can report success |
| Can become a required check on protected `main` | the job name `Doctrine / Orientation, gates and drill` is stable and is the string named in `EXTERNAL_ENABLEMENT.md` item 3 |

**New, load-bearing:** *Orient must run before Repository gates*, because G3 is red until
orientation has set the hook path. Commented in the workflow.

**CI is not armed.** Actions is off, the secret does not exist, `main` does not exist, branch
protection is unset. Nothing in this session makes CI or the trunk live, and nothing in this
report should be read as saying otherwise.

---

## 9. Enforcement by layer, after this session

| Layer | State | What holds it |
|---|---|---|
| Guard script behaviour | PROVEN | 88 drill cases, 0 red |
| Hook configuration | PROVEN | gate G2 |
| Repository gates | PROVEN | G1–G5, on the commit and push path |
| **Local git layer** | **ARMED, and independent** | armed by the seam on every orientation, verified independently by G3, drilled end to end through git's own invocation |
| Harness hook layer | `ARMED_AS_CONFIGURED` where this repository is the host project root; executes nothing in the present topology | dispositioned, `OBL-GAL-002` |
| CI at the pull-request chokepoint | UNARMED | `OBL-GAL-003`, external items 1–2 |
| Trunk / branch protection | UNARMED, state UNKNOWN | `OBL-GAL-005`, `OBL-GAL-011`, external item 3 |

### Residues, stated plainly

Two ways a change still reaches this repository without meeting the local layer:

1. **`--no-verify`** — deliberate and visible.
2. **A checkout that commits before it has ever oriented** — narrower than before, since the
   seam arms the path on every orientation and G3 is red without it, but real: the arming and
   the hook are reached by the same command.

Both are held by CI and a protected trunk and by nothing else. That is the honest reason items
1–3 of the enablement instrument matter, rather than a suggestion that the repository layer
suffices.

---

## 10. Verification performed in this session

| Check | Result |
|---|---|
| `doctrine-orient.py orient` (full six-step sequence) | VALID, hook path ARMED |
| `doctrine-orient.py check` | PASS for this session |
| `doctrine-gate.py` | 5 of 5 PASS |
| `doctrine-drill.py` | 88 PASS, 0 DECORATIVE, 0 STALE, 0 RED |
| Fresh-checkout sequence, manual, before encoding | all twelve required legs reproduced by hand |
| `PRODUCT_STATE.json` field-level diff against `HEAD` | only enforcement descriptions changed |
| `RATCHETS.json` | untouched |
| `product/`, `ux/` | byte-identical |
| `builders-doctrine` before / after | HEAD, tree, digest and worktree identical; reflog shows only the container's setup checkout |

The commit was made through the armed git layer: `.githooks/pre-commit` ran `orient check` and
the gates before it was accepted.

---

## 11. Files changed

Commit `b8e890e`, pushed to `claude/gallery-hook-liveness-verify-bzn5c6`.

| File | Change |
|---|---|
| `scripts/doctrine-orient.py` | six-step sequence; `validated_repo_root`, `arm_git_hooks`, `inspect_git_hooks`, `resolve_hooks_path`, `git_worktree_root`, `run_gates`; hook state in the seam receipt, the assessment and `status` |
| `scripts/doctrine-gate.py` | G3 gains `git_config_hooks_path`, an independent reading of the effective configuration |
| `scripts/doctrine-drill.py` | `scratch_project(arm=)`, `bare_remote`, and cases D-73 … D-87 |
| `doctrine/PRODUCT_STATE.json` | `OBL-GAL-013` resolved; `OBL-GAL-002` dispositioned; `OBL-GAL-003` residues; `GAL-G7` clause; four topology qualifiers |
| `doctrine/BUILD_LEARNING_LEDGER.md` | `GAL-L0011` |
| `doctrine/EXTERNAL_ENABLEMENT.md` | item 4 rewritten to the disposition; residue table corrected |
| `doctrine/receipts/GIT_LAYER_INDEPENDENCE-2026-09-06.md` | new — the proof receipt |
| `.github/workflows/doctrine.yml` | ordering dependence documented; independence from host hooks and local configuration stated |
| `CLAUDE.md` | the automatic-orientation claim removed |

Earlier in the same session: `5575a7d` (attempt 2 evidence, procedure preconditions, `OBL-GAL-013`
raised) and `2789102` (the pass 1 session report).

---

## 12. Untouched, as bounded

Stage 2 not begun. No interface or visual work — `ux/` byte-identical. No product decision
altered. No infrastructure provisioned. No branch merged, no `main` created. Nothing written to
`builders-doctrine`, verified twice by full-tree digest and re-asserted independently by drill
case D-72. No third host-hook liveness attempt was made.

---

## 13. Governor and platform actions required

1. Enable GitHub Actions for `r959qp5qwr-web/Thegallery`.
2. Create the repository secret `DOCTRINE_READ_TOKEN`, read-only to `builders-doctrine` and
   nothing else.
3. Merge to create `main`, then require the `Doctrine / Orientation, gates and drill` check and
   refuse direct pushes.
4. Rule on the Stage 1 strategic decisions and accept the interface reference set.

---

## 14. Honest ceiling

The repository layer is now closed as far as a repository can close it: it arms itself, verifies
its own arming with an independent instrument, and refuses when either is missing. It cannot
close the two residues in §9 — no repository can, since both describe acts that step around the
repository — and it cannot make the harness layer execute in a topology that does not discover
it. What this session removed is not the residues but the *false confidence*: a compulsory layer
that was not armed, a gate that certified it anyway, a README and a `CLAUDE.md` that said so, and
an obligation that would have been investigated a third time.

**Next action: Governor reviews and rules on Stage 1, then activates CI and protected trunk.**
