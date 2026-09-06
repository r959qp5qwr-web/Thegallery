# The Gallery — full session report, 2026-09-06

**Session:** `9e4e9e82-091a-58bd-96d4-39aae1304020`
**Branch:** `claude/gallery-hook-liveness-verify-bzn5c6`
**Commits:** `5575a7d` · `2789102` · `b8e890e` · `41979ae` · `e93082e`
**Doctrine:** `dfdecb651df8cef5387487fee21d8ee2f798db95` — read-only, byte-identical throughout
**Active stage at close:** `PLATFORM_ENABLEMENT_GATE` (pre-Stage-2)

Three bounded passes in one session: a host-hook liveness verification that failed and named its
cause, the repair of the defect that verification uncovered, and the recording of the governor's
Stage 1 ruling.

This is the consolidated record. Two narrower reports sit beside it —
`SESSION-REPORT-2026-09-06.md` (pass 1) and `SESSION-REPORT-2026-09-06-GOVERNANCE-CORRECTION.md`
(pass 2) — along with the evidence receipts each pass produced.

---

## 1. The session in one table

| Pass | Bounded to | Outcome |
|---|---|---|
| 1 — Verification | Determine whether a fresh session closes the host-hook liveness gap | **FAILED**, cause named: project-settings discovery. Recorded, not compensated for |
| 2 — Correction | Make the git layer independent of the host hook; disposition the topology limitation | **DONE**. Proved against a fresh checkout; drill 73 → 88 cases |
| 3 — Ruling | Record the governor's Stage 1 acceptance and nine ratifications | **RECORDED**. Interface accepted, OBL-GAL-001 discharged, stage advanced to the enablement gate |

The three are causally linked, which is why they are reported together. Pass 1 was asked for a
verdict on hook liveness and returned a negative. While returning it, its canary commit met **no
refusal from any layer** — including the one the binding documents called compulsory. Pass 2 is
the repair of what pass 1 tripped over. Pass 3 could then be recorded against a repository that
actually enforces.

---

## 2. Pass 1 — hook liveness: FAILED, cause named

The session was genuinely fresh and `.claude/settings.json` was tracked in the checked-out commit
and on disk **1.87 seconds before** the harness's first settings load. No project hook fired. The
harness's own diagnostics recorded exactly one hook spawn in the entire session:

```
05:15:24.556Z hook_spawn_started   {"hook_event_name":"SessionStart","index":0}
05:15:24.591Z hook_spawn_completed {"hook_event_name":"SessionStart","index":0,
                                    "duration_ms":58,"exit_code":0,"aborted":false}
```

That is the harness's own git-identity hook, from a settings file at the project root. Zero
`PreToolUse` spawns against fourteen `Bash` calls and one `Write` call the matcher covers.

### Cause

**Project-settings discovery.** The session's working directory was `/home/user`, the parent of
both repositories. The harness looks for project settings at `<project root>/.claude/` only, so
the Gallery's file one level deeper was never a candidate.

| Candidate | Why it is not the cause |
|---|---|
| Host snapshot timing (attempt 1's diagnosis) | the file predates the first settings load by 1.87 s and was tracked in the checked-out commit |
| Unsupported matcher behaviour | the project's `SessionStart` entry carries no matcher and still did not fire; zero `PreToolUse` spawns for any tool, where a matcher fault gives partial coverage |
| A broken guard | the script returns the correct verdict for every canary payload |
| A hook door that does not work here | one hook did fire, from a settings file at the project root |

### Canary results, through the real host doors

| Probe | Expected | Observed |
|---|---|---|
| Harmless read | executes | executed — no false denial |
| Empty commit | denied | **executed**, reset to the prior HEAD |
| Write of stage-blocked application source | denied | **file created**, removed |
| Malformed payload | not reachable through a host door | not exercisable, unchanged |
| Central repository | byte-identical | byte-identical |

Both mutations were reversed in the session that made them. The guard script returned the correct
verdict for every payload when handed them directly: its logic is intact, it is simply never
invoked.

Full evidence: `HOOK_LIVENESS_ATTEMPT-2026-09-06.md`.

---

## 3. Pass 2 — the defect pass 1 uncovered

The canary commit met no refusal from the **git layer** either. One line explained it:

```
scripts/doctrine-hook.py:379   (inside session_start)
    git -C <project> config core.hooksPath .githooks
```

The arming lived only inside the harness hook. So the layer the binding documents described as
**compulsory** was armed by the layer they described as **as-configured**, and a fresh clone ran
no hook at all.

Two failures of the same kind, at different altitudes:

- **At the mechanism.** A fail-closed hook that git never runs enforces nothing.
- **At the instrument.** Gate G3 checked the hook files were present, executable and free of
  fail-open paths — all true — and never checked that git was configured to run them. This
  repository had already written down **L-A17: existence is not execution**, and had not applied
  it to itself.

A documentation falsehood sat on top: `README.md` said "core.hooksPath is set by the seam".
`scripts/doctrine-orient.py` never touched it.

### The repair — both mechanisms, together

`scripts/doctrine-orient.py orient` is now six ordered steps, fail-closed at each:

| # | Step | Function |
|---|---|---|
| 1 | Identify and validate the Gallery repository root | `validated_repo_root` |
| 2 | Validate the live Doctrine binding — bootstrap fingerprint, bound commit, bound artifacts, version manifest, module manifests | `preflight` |
| 3 | Configure `core.hooksPath` → `.githooks`, local repository configuration only | `arm_git_hooks` |
| 4 | Verify the **effective** configuration git would use, not the value just written | `inspect_git_hooks` |
| 5 | Establish the orientation receipt for this session | `run_bootstrap` |
| 6 | Run the repository gates | `run_gates` |

Three design decisions inside this are load-bearing:

**Verify the effect, not the write.** Step 4 asks git what the effective `core.hooksPath` is,
resolves a relative value against the worktree root exactly as git does, and requires it to land
on the governed directory with both hooks present and executable. A configuration that was written
and did not take effect fails orientation.

**Arm before you gate.** Step 6 runs last on purpose. A fresh checkout is red at G3 *because* the
path is unset; gating first would block the one command that repairs the absence — a governance
instrument locking the door on the locksmith. Drill case D-87 stops a later edit reordering it
silently.

**Refuse a displaced root.** `arm_git_hooks` fails when the checkout is not a git worktree, and
when the Gallery root is not the root of *its own* worktree — otherwise the governed hooks could
be armed onto some enclosing repository's commit path. The same class of mistake as pass 1's
project-root failure, caught before it can happen.

Gate G3 gained an independent reading of git configuration. It does **not** import the seam: a
gate that asked the seam whether the seam had done its job would verify nothing. Five red
verdicts, each naming its repair:

| Status | Condition |
|---|---|
| `NOT_A_GIT_WORKTREE` | not inside a worktree, so `.githooks` runs on no commit path |
| `DISPLACED_WORKTREE` | governed hooks are not at the worktree root |
| `UNARMED` | `core.hooksPath` is not configured |
| `DISPLACED_HOOKS_PATH` | resolves somewhere other than the governed `.githooks` |
| `INCOMPLETE` | resolves correctly but carries no executable `pre-commit` / `pre-push` |

The arming in `scripts/doctrine-hook.py session_start` is **retained**. Removing it would have
been tidier and worse: the defect was that it was the *only* place, not that it existed.

---

## 4. The fresh-checkout proof

One **ordered** sequence against a single isolated checkout with no inherited local git
configuration. Every case drives the real door: **git itself** runs the hook through
`core.hooksPath`. Existing cases D-52 … D-58 prove hook *content* by executing the hook file;
content and invocation are different claims, and this repository has been wrong about the
difference once.

| # | Required | Result |
|---|---|---|
| D-73 | fresh checkout carries no `core.hooksPath` | PASS |
| D-74 | it reports itself unarmed and names its repair | PASS |
| D-75 | gate G3 before orientation → RED naming `core.hooksPath` | PASS |
| D-76 | orientation establishes the configuration | PASS |
| D-77 | gate G3 after orientation → PASS | PASS |
| D-78 | real `git commit`, foreign session receipt → refused | PASS |
| D-79 | real commit, feature branch, valid orientation, green gates → lands | PASS |
| D-80 | real commit on the default branch → refused | PASS |
| D-81 | real push to `refs/heads/main` → refused | PASS |
| D-82 | real push at a `builders-doctrine` remote → refused | PASS |
| D-83 | real push to a feature ref → allowed (anti-vacuous) | PASS |
| D-84 | `--no-verify` bypasses, and the repository says so in both places | PASS |
| D-85 | `core.hooksPath` unset → G3 RED | PASS |
| D-86 | `core.hooksPath` displaced to permissive hooks → G3 RED | PASS |
| D-87 | re-running orientation repairs it → G3 green | PASS |

### Why these particular cases

**D-86 is the anti-vacuity case for G3 itself.** It plants hooks that are present, executable and
would exit 0, then points `core.hooksPath` at them. A gate that merely asked "does some hook run?"
would pass. G3 goes red because the path is not the *governed* one. Contradictory configuration is
not permission.

**D-84 asserts an honesty claim, not only a behaviour.** The bypass must land *and* be named as a
residue in both `.github/workflows/doctrine.yml` and `doctrine/EXTERNAL_ENABLEMENT.md`. A residue
that stops being written down becomes a claim that is not true.

**D-79 and D-83 are the anti-vacuous pair.** A layer that refuses everything is not enforcement,
it is breakage. The legitimate commit and the legitimate push must still land, and they do.

**D-82 avoids the network entirely.** It pushes at a *local bare repository* whose path contains
`builders-doctrine`, so the URL rule is drilled without approaching the real remote.

**Anti-vacuity elsewhere.** `scratch_project` now arms `core.hooksPath` by default, modelling an
oriented checkout. Without that, G3 would be red in every fixture and four existing cases would
have passed whether or not their own planted violations fired — the failure mode the drill's STALE
verdict exists to catch.

**Totals: 88 cases · 88 PASS · 0 DECORATIVE · 0 STALE · 0 RED** (was 73). Repository gates 5 of 5.

---

## 5. Pass 3 — the governor's Stage 1 ruling

The interface reference set is **accepted** as the authoritative design direction for
implementation, and all nine strategic decisions are **ratified as recommended**.

| Decision | Ruling |
|---|---|
| GAL-OD-01 · Working name | The Gallery, used consistently |
| GAL-OD-02 · Account boundary | Individual makers, studios and collectives presenting work they created or materially produced; retailers and ordinary resellers excluded |
| GAL-OD-03 · Admission | Open email account creation, self-declaration, post-publication moderation; no pre-publication taste or quality gate |
| GAL-OD-04 · Geography | Bengaluru for demonstration content, geography configurable; no Bengaluru-only and no India-wide launch claim |
| GAL-OD-06 · Direct contact | WhatsApp, public email, phone, website or external form; one route required before contact is advertised, not before publishing; account email stays private; no in-app chat |
| GAL-OD-09 · Social depth | Private device-local saves in the MVP; public counts, comments, reactions and popularity ranking refused; count-free following reconsidered later as a separate candidate |
| GAL-OD-12 · Identity confirmation | Deferred beyond the MVP; no verification claim at launch |
| GAL-OD-13 · Revenue | No monetisation in the MVP; architecture stays subscription-capable; no transaction percentage, advertising or paid ranking |
| GAL-OD-15 · Moderation standard | The minimal published standard — five report categories, recorded reasons, reversible where appropriate, appeal by email; protects access and safety, does not curate taste |

Each keeps its original id and carries `question`, `source`, `reason`,
`consequence_of_rejection` and `reopen_condition`. The rejected options stay verbatim in the
instrument: a ruling that erases what was rejected leaves no way to judge it later. Seven
product-recommendation and ordinary decisions remain open and reversible; none gates Stage 2.

### Why the ratchet did not move

All nine are recorded **MANUAL** or **UNARMED**, never armed. The mechanisms that will hold them —
the publish gate, the ownership rule, the route inventory, the schema, the claim sweep over
rendered surfaces — are Stage 2 code that does not exist. `armed_fixed_decisions` stays at **8**
and `doctrine/RATCHETS.json` is untouched.

A ruling is authority, not enforcement. Recording nine new ARMED claims on the strength of a
governor's signature is exactly the laundering gate G1 exists to catch, and it would have been
caught: G1 refuses an armed claim whose locus names nothing that executes.

### Interface state

| Journey | Status | Why |
|---|---|---|
| J-001, J-002, J-004 | **INTERFACE_READY** | carry interface references drawn from the accepted set; the status was withheld from exactly these pending acceptance (G-IF1) |
| J-003 | UX_READY | no interface references of its own; its surfaces are inherited, so there is nothing accepted to raise it on |
| J-005, J-006 | IDENTIFIED | deferral reasons unchanged |

`ux/UX_MANIFEST.yaml` records what acceptance fixes (`approved`), what stays the builder's
(`remains_the_builders`) and what it forbids (`boundary`) as three separate fields — and states in
the file that `INTERFACE_READY` is a design status, not authorisation to implement.

`OBL-GAL-001` is **RESOLVED**.

---

## 6. Where the product stands

| Layer | State |
|---|---|
| Guard script behaviour | **PROVEN** — 88 drill cases, 0 red |
| Hook configuration | **PROVEN** — gate G2 |
| Repository gates | **PROVEN** — G1–G5, on the commit and push path |
| **Local git layer** | **ARMED, and now independent** — armed by the seam on every orientation, verified independently by G3, drilled through git's own invocation |
| Harness hook layer | `ARMED_AS_CONFIGURED` only where this repository is the host project root; executes nothing in the present topology — *dispositioned* |
| CI at the pull-request chokepoint | **UNARMED** |
| Trunk / branch protection | **UNARMED**, state UNKNOWN |

### Residues, stated plainly

Two ways a change still reaches this repository without meeting the local layer:

1. **`--no-verify`** — deliberate and visible.
2. **A commit made in a checkout that has never oriented** — narrower than before, since the seam
   arms the path on every orientation and G3 is red without it, but real: the arming and the hook
   are reached by the same command.

Both are held by CI and a protected trunk and by nothing else. That is the honest reason the
enablement items matter, rather than a suggestion that the repository layer suffices.

### Host topology — dispositioned, not reopened

The host hook is `ARMED_AS_CONFIGURED` only when the Gallery is itself the host project root, and
is not a compulsory layer in the present multi-repository topology. `OBL-GAL-002` stays
activation-conditioned on a material topology change. No third liveness experiment is authorised.
`CLAUDE.md` no longer claims automatic host orientation, and `EXTERNAL_ENABLEMENT.md` item 4
records the disposition rather than an open experiment.

---

## 7. Active stage and what unlocks Stage 2

> **`PLATFORM_ENABLEMENT_GATE` — next acceptance condition.** The repository and platform
> enforcement boundary is live, and only then is Stage 2 authorised: `main` exists, created from
> `claude/gallery-hook-liveness-verify-bzn5c6` and protected so the default branch is reached
> through review; GitHub Actions is enabled and `DOCTRINE_READ_TOKEN` grants read-only access to
> `builders-doctrine`; and the check **`Doctrine / Orientation, gates and drill`** completes green
> on a pull request and is a required status check on `main`. Until every one is observed,
> application source, database schema and deployment configuration are not created and no session
> claims Stage 2 is authorised.

`blocked_until_acceptance` is unchanged, so `GAL-G9` denies exactly what it denied before. The
stage carries an explicit `not_authorised_by_this_stage` field, because "Stage 1 accepted" is the
sentence most likely to be misread as "Stage 2 may begin".

### Governor and platform actions

1. Create **`main`** from `claude/gallery-hook-liveness-verify-bzn5c6` at commit **`e93082e`**, and
   protect it: require a pull request before merging; require the Doctrine status check.
2. Enable GitHub Actions for `r959qp5qwr-web/Thegallery`.
3. Create the repository secret `DOCTRINE_READ_TOKEN`, read-only to `builders-doctrine` and nothing
   else.
4. Observe one green run of the check on a pull request, then authorise Stage 2.

Exact settings: `doctrine/EXTERNAL_ENABLEMENT.md` items 1–3.

---

## 8. CI readiness — reviewed, not armed

| Criterion | Finding |
|---|---|
| Independent of host hooks and local git configuration | `actions/checkout` yields a fresh clone with no inherited configuration and no harness; the Orient step arms `core.hooksPath` itself |
| Validates the live bound Doctrine commit and fingerprints | reads the pinned commit from the binding, clones and checks it out, and orientation fingerprints the bootstrap, bound artifacts, version manifest and module manifests |
| Runs the repository gates and the drill | both, as separate steps, drill evidence uploaded as a run artifact |
| Refuses to green without its read-only credential | an explicit step fails with an error annotation when `DOCTRINE_READ_TOKEN` is unset |
| Can become a required check on protected `main` | the job name `Doctrine / Orientation, gates and drill` is stable |

One ordering constraint is now load-bearing and commented in the file: **Orient must run before
Repository gates**, because G3 is red until orientation has set the hook path.

**CI is not armed.** Actions is off, the secret does not exist, `main` does not exist, branch
protection is unset.

---

## 9. Verification, and what was not touched

| Check | Result |
|---|---|
| `doctrine-orient.py orient` | VALID — six-step sequence, hook path ARMED |
| `doctrine-orient.py check` | PASS for this session |
| `doctrine-gate.py` | 5 of 5 PASS; G1 reports 8 armed, equal to the recorded ratchet |
| `doctrine-drill.py` | 88 PASS · 0 DECORATIVE · 0 STALE · 0 RED |
| `builders-doctrine` before / after | HEAD, tree, digest and worktree identical; reflog carries only the container's setup checkout |

Stage 2 not started: no `src/`, no `app/`, no `package.json`, no schema, no deployment
configuration. The approved screens, wireframes, journey contracts, both UX foundations, the
product architecture, the domain model and the Stage 2 slice document are byte-identical. No
infrastructure provisioned, no branch merged, no `main` created, nothing written to
`builders-doctrine`. No further Doctrine audit and no third hook-liveness experiment.

Every commit in this session was made through the armed git layer: `.githooks/pre-commit` ran
`orient check` and the gates before each was accepted.

---

## 10. Commits

| Commit | What it carries |
|---|---|
| `5575a7d` | Hook-liveness attempt 2 evidence; procedure preconditions; `OBL-GAL-013` raised |
| `2789102` | Session report for the verification pass |
| `b8e890e` | The git-layer repair: seam arms and verifies the hook path, G3 holds it, 15 new drill cases, topology dispositioned |
| `41979ae` | Detailed session report for the governance correction |
| `e93082e` | The governor's Stage 1 ruling: nine decisions ratified, interface accepted, stage advanced |

---

## 11. Honest ceiling

The repository layer is now closed as far as a repository can close it: it arms itself, verifies
its own arming with an independent instrument, and refuses when either is missing. It cannot close
the two residues in §6 — no repository can, since both describe acts that step around the
repository — and it cannot make the harness layer execute in a topology that does not discover it.

What this session removed is not the residues but the **false confidence**: a compulsory layer
that was not armed, a gate that certified it anyway, a `README.md` and a `CLAUDE.md` that said so,
and an obligation that would otherwise have been investigated a third time.

**Next action: Create and protect `main`, enable the Doctrine CI boundary, and then authorise
Stage 2.**
