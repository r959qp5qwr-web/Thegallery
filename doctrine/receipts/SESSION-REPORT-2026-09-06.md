# Session report — hook-liveness verification, 2026-09-06

**Session:** `9e4e9e82-091a-58bd-96d4-39aae1304020` · **Branch:** `claude/gallery-hook-liveness-verify-bzn5c6`
**Commit produced:** `5575a7d`
**Task, as bounded:** determine whether a fresh session closes the host-hook liveness gap left by the enforcement-closure pass at `ffd0715`. No general Doctrine audit, no regeneration of the Stage 1 visual work, no product-decision change, no Stage 2, no provisioning, no merge, no `main`.

**Verdict: HOOK LIVENESS — FAILED.** This project's hooks did not execute. The cause is not the one attempt 1 named, and a second defect was found beside it.

---

## 1. Inspected

| Repository | Role | Branch | HEAD | Worktree |
|---|---|---|---|---|
| `builders-doctrine` | read-only central authority | `claude/gallery-hook-liveness-verify-bzn5c6` (container's own checkout, same commit as `main`) | `dfdecb651df8cef5387487fee21d8ee2f798db95` | clean before and after |
| `Thegallery` | writable product | `claude/gallery-hook-liveness-verify-bzn5c6` | `eb1e006` at start, `5575a7d` at end | clean at both points |

The Doctrine checkout sits on the commit the binding pins, so no re-pin was required and none was performed. `OBL-GAL-004` stays standing with its activation condition untouched.

---

## 2. Preconditions — one met, one newly discovered and failed

| # | Precondition | Result |
|---|---|---|
| 0a | The session is fresh — its id differs from every id in the attempt receipts | **MET.** `9e4e9e82…` ≠ `a00ba519…` (attempt 1) |
| 0b | The repository is the session's project root | **FAILED, and not previously checked.** Working directory `/home/user`; repository at `/home/user/Thegallery` |

Attempt 1 failed 0a and therefore tested nothing. This attempt cleared 0a and failed on a precondition nobody had written down, because nobody had reason to suspect it.

---

## 3. What was done, in order

1. Established the session id and compared it against the recorded attempts.
2. Read the harness's own diagnostics file and the session transcript for hook records, before running any probe.
3. Ran the five host-door probes the procedure specifies, using the real tool doors rather than the scripts.
4. Reversed both mutating canaries in the same session that made them.
5. Cross-checked the guard **script** against the same payloads, as diagnosis only.
6. Fingerprinted the Doctrine checkout before the first probe and after the last.
7. Attempted the one bounded repair reachable from a running session; it was refused by the harness and not routed around.
8. Recorded the result: a new attempt receipt, two new preconditions in the procedure, one rewritten obligation, one new obligation, one ledger entry.

---

## 4. Evidence — SEEN, NOT SEEN, UNKNOWN

### 4.1 SEEN

**The hook door works in this environment, and exactly one hook used it.** Across the whole session the harness recorded a single spawn:

```
05:15:24.556Z hook_spawn_started   {"hook_event_name":"SessionStart","index":0}
05:15:24.591Z hook_spawn_completed {"hook_event_name":"SessionStart","index":0,
                                    "duration_ms":58,"exit_code":0,"aborted":false}
```

That is the harness's own git-identity hook, configured at the project root. It completed in 58 ms and wrote no orientation receipt, which `scripts/doctrine-hook.py session-start` always does.

**The project's configuration was in place before it could have been read.**

| Fact | Value |
|---|---|
| `.claude/settings.json` first committed | `61fec2e`, an ancestor of the checked-out `eb1e006` |
| Its mtime on disk | `05:15:21.034Z` |
| Harness `settings_load_started` | `05:15:22.898Z`, and again `05:15:23.685Z` |

A 1.87-second margin, and the file was already tracked in the commit that was checked out.

**The canary results.**

| Probe | Door | Expected | Observed |
|---|---|---|---|
| Read `README.md` | Bash | executes | executed — no false denial |
| `git commit --allow-empty` | Bash | denied | **executed** as `e934b6b`, 4 → 5 commits |
| Write `src/app/page.tsx` | Write | denied | **file created**, 173 bytes |
| Malformed payload | — | not reachable through a host door | not exercisable, as the procedure predicts |
| Central repository | — | byte-identical | byte-identical |

Both mutations were reversed. `git reset --hard eb1e006` restored the history; `src/` was removed. Neither was pushed.

**The guard script is correct and simply never called.** Handed the same payloads directly, it returned `GUARD-2` for the commit, `GUARD-2` for the write, `ALLOWED` for the read, `GUARD-0` for a malformed payload and `GUARD-1` for a write into the Doctrine checkout. The procedure predicted `GUARD-3`/`GUARD-4`; `GUARD-2` precedes them because no orientation exists when the SessionStart hook never runs, which the procedure itself anticipates.

**The central repository is untouched.**

| | Before first probe | After last probe |
|---|---|---|
| `HEAD` | `dfdecb651df8cef5387487fee21d8ee2f798db95` | identical |
| `HEAD^{tree}` | `71366c55ed1de19ffe31c9f65744dc98048c6a8e` | identical |
| `git status --porcelain` | empty | empty |
| sha256 over every file | `c2265b45354c9b7c858920f7eebe4ef4335279f806f348159d19a90bd721ba64` | identical |

Its reflog carries only the container's own setup checkout. No write into it was attempted by any route; central protection is evidenced by the checkout being unchanged and by the guard classifying such a payload `GUARD-1`, not by attacking it.

### 4.2 NOT SEEN

- Any SessionStart output from this project — no banner, no standing assessment, no runtime directory at session open.
- Any `PreToolUse` hook spawn, against 14 `Bash` calls and 1 `Write` call that the matcher covers.
- Any hook-output record in the transcript. Every occurrence of the guard's banner text sits inside this session's own tool inputs, read from files.
- Any refusal from `.githooks/pre-commit` when the empty commit was made — see §6.

### 4.3 UNKNOWN

- Whether hook configuration placed at the project root is also fixed at session start, or only discovered there. The discriminating probe was refused (§7).
- Whether this project's hooks govern a delegated-agent route. `UNK-GAL-002`, retained — see §8.

---

## 5. Cause, named

**Project-settings discovery. The repository is not the session's project root.**

| Fact | Value |
|---|---|
| Session working directory | `/home/user` |
| Transcript project directory | `/root/.claude/projects/-home-user/` |
| `CLAUDE_PROJECT_DIR` | empty |
| Repository | `/home/user/Thegallery`, one level below |
| `/home/user/.claude/` | does not exist |
| Every `settings.json` on the machine | `/home/user/Thegallery/.claude/settings.json` — the only one |

The session opened on a parent directory holding the product repository and the Doctrine checkout as siblings, and that parent became the project root. The harness looks for project settings directly inside the project root. The Gallery's configuration is one directory deeper and was never a candidate.

**Ruled out by this session's own evidence:**

| Candidate | Why it is not the cause |
|---|---|
| Host snapshot timing (attempt 1's diagnosis) | The file predates the first settings load by 1.87 s and was tracked in the checked-out commit |
| Unsupported matcher behaviour | The project's `SessionStart` entry carries no matcher at all and still did not fire; and there are **zero** `PreToolUse` spawns for any tool, where a matcher fault gives partial coverage |
| A broken guard | The script returns the correct verdict for every canary payload |
| A hook door that does not work here | One hook did fire, from a settings file at the project root |

Attempt 1 ruled settings discovery out using only facts about the repository — standard path, valid JSON, passes gate G2. All of that was true, and the conclusion was still wrong: the path is standard *relative to the repository*, and the harness resolves it relative to the *session's* project root.

---

## 6. Second finding — the compulsory git layer was inert in the same clone

The empty commit met no refusal from `.githooks/pre-commit` either. The reason:

```
scripts/doctrine-hook.py:379   (inside session_start)
    git -C <project> config core.hooksPath .githooks
```

`core.hooksPath` is armed **only** by the SessionStart hook. A fresh clone does not carry it — `git config core.hooksPath` returned nothing in this container — so where the harness hook does not fire, the git layer does not fire either.

The two layers are not independent. The layer described as compulsory is armed by the layer described as as-configured. `README.md` attributes that arming to the seam; `scripts/doctrine-orient.py` never touches it. Gate G3 checks that the hook files exist, are executable and carry no fail-open path — all true — and does not check that git is configured to run them.

This puts `GAL-G7`'s `ARMED` classification in question. It is **deliberately not reclassified here** and `armed_fixed_decisions` is **deliberately not moved**: that is a recorded governed movement, and this session was bounded to verification. Recorded as `OBL-GAL-013` with two candidate repairs named for the governor to choose between:

1. Arm `core.hooksPath` in `scripts/doctrine-orient.py orient`, so the seam does what the README already claims and the git layer stops depending on the harness.
2. Extend gate G3 to fail when `core.hooksPath` does not name `.githooks`, so an unarmed clone is red rather than silently inert.

Either needs its own drill case and its own ratchet movement.

---

## 7. The bounded repair — attempted, refused, not worked around

The only repair reachable from inside a running session is to place hook configuration at the actual project root. A **non-blocking** version was attempted first, purely as a discriminator: a `PreToolUse` entry that appends one line to a scratch log and always exits 0, denying nothing, to settle whether a hook at the project root is invoked mid-session or whether configuration is additionally fixed at session start.

The harness's own auto-mode classifier refused the write. That refusal was respected and not routed through another tool.

It would not have been a repair in any case. It writes outside both repositories, into a container reclaimed when the session ends, and it would arm a hand-installed copy rather than the project's own discovered configuration — which is precisely what `OBL-GAL-002` requires to be seen.

**There is no repair inside the repository.** `.claude/settings.json` is already at the standard project path, is valid, and passes gate G2. Nothing the repository can contain makes the host look one directory deeper.

---

## 8. Standing by layer, after this session

| Layer | State | Change from 2026-09-04 |
|---|---|---|
| Guard script behaviour | PROVEN | unchanged — 73 drill cases, 0 red |
| Hook configuration | PROVEN | unchanged — gate G2 green |
| Repository gates | PROVEN | unchanged — 5 of 5 green |
| Compulsory git layer | **ARMED ONLY WHERE `core.hooksPath` IS SET** | **corrected.** Previously reported as armed; observed inert in a fresh clone |
| Harness hook layer | ARMED_AS_CONFIGURED, never observed executing | unchanged in state, cause re-diagnosed |
| CI at the pull-request chokepoint | UNARMED | unchanged — governor and platform action |
| Trunk / branch protection | UNARMED, state UNKNOWN | unchanged — governor and platform action |

The honest description of this container: **no enforcement layer was live in it.** A deliberate empty commit and a stage-blocked source file both went through, and only this session's own discipline reversed them.

### Obligations

| ID | State | Movement |
|---|---|---|
| `OBL-GAL-002` — host invocation of this project's hooks | NOT_SEEN | summary rewritten with the real cause; new activation condition requiring the repository to be the project root; acceptance test now also requires a `PreToolUse` spawn in the harness's own record |
| `OBL-GAL-013` — the git layer is armed by the hook layer | NOT_SEEN | **new** |
| `UNK-GAL-002` — delegated-agent route | UNKNOWN | retained, unprobed, same reason as before: in a session with no hooks loaded, a subagent probe cannot distinguish an ungoverned delegation route from an absent configuration. A test that cannot discriminate is not evidence, and the task was not expanded to force one |
| `OBL-GAL-010` — host-level fail-open residue | UNARMED | untouched |
| All others | — | untouched |

---

## 9. What changed in the repository

Commit `5575a7d`, pushed to `claude/gallery-hook-liveness-verify-bzn5c6`. Receipts and state only.

| File | Change |
|---|---|
| `doctrine/receipts/HOOK_LIVENESS_ATTEMPT-2026-09-06.md` | new — the full evidence record |
| `doctrine/receipts/HOOK_LIVENESS_VERIFICATION.md` | preconditions 0b (project root) and 0c (read the harness's own hook-spawn record before trusting a probe); step 6 (`core.hooksPath` must print `.githooks`); a recording rule requiring every canary to be reversed in the session that made it |
| `doctrine/PRODUCT_STATE.json` | `OBL-GAL-002` rewritten, `OBL-GAL-013` added, `UNK-GAL-002` note, `update_reason` |
| `doctrine/BUILD_LEARNING_LEDGER.md` | `GAL-L0010` |

**Not changed:** no enforcement script, no gate, no drill case, no ratchet, no product decision, no UX manifest entry, no Stage 1 artefact.

Verification after the edits: gates 5 of 5 PASS (G4 now counts 16 obligations); drill 73 PASS, 0 RED, 0 DECORATIVE, 0 STALE. The commit itself was made through the compulsory layer: `scripts/doctrine-orient.py orient` was run and `core.hooksPath` set by hand first, so the commit passed through `.githooks/pre-commit` rather than around it. That is a local git configuration in an ephemeral container, not a repair — the next clone starts unarmed again.

---

## 10. Untouched, as bounded

Stage 2 not begun. No visual or interface work. No product decision altered. No infrastructure provisioned. No branch merged and no `main` created. `builders-doctrine` byte-identical, verified twice by full-tree digest.

**CI, branch protection and the trunk layer are not armed.** They remain separate governor and platform actions and nothing in this session moved them.

---

## 11. Governor action required — the session is BLOCKED on this

> Open the session with **`r959qp5qwr-web/Thegallery` as the session's working directory and project root**, not as a subdirectory of a parent that also holds the Doctrine checkout. The Doctrine checkout must stay reachable, so supply it through **`DOCTRINE_ROOT`** rather than as a sibling under a shared parent — the seam reads that variable and falls back to a sibling only when it is unset.

Then re-run `doctrine/receipts/HOOK_LIVENESS_VERIFICATION.md` from its preconditions. Both known failure modes are now checked before any probe runs, and the third check reads the harness's own record rather than trusting a probe's appearance.

Separately, and not blocking: `OBL-GAL-013` needs a ruling on which of the two named repairs to make.

---

## 12. Honest ceiling

This session proved a negative and named its cause. It did not prove that the hooks work when the session is shaped correctly — that remains `NOT_SEEN`, and one session's liveness would not be liveness in every session in any case. The host-level fail-open of `OBL-GAL-010` is untouched by any of this, and remains the reason the git layer and the CI layer exist rather than an argument that the hook layer suffices.
