# Hook-liveness verification — attempt 2, 2026-09-06

**Verdict: FAILED.** The session was genuinely fresh and `.claude/settings.json` was on disk
before the harness read settings, and this project's hooks still did not execute — not one
spawn, for any event, for any tool. The cause named by attempt 1 (host snapshot timing) is
ruled out by this session's own timestamps. The operative cause is **project-settings
discovery**: the session's project root is `/home/user`, the parent of the repository, so
`/home/user/Thegallery/.claude/settings.json` is never a discovery candidate.

OBL-GAL-002 stays open. UNK-GAL-002 stays unknown. No enforcement claim is upgraded.

A second finding, not sought and more serious, is recorded in §6: because the SessionStart
hook is also what arms `core.hooksPath`, the compulsory git layer was inert in this clone too.
A deliberate empty commit reached the branch with no refusal from any layer.

## 0. Precondition — met, unlike attempt 1

| Fact | Value |
|---|---|
| Session id, this attempt | `9e4e9e82-091a-58bd-96d4-39aae1304020` |
| Session id, attempt 1 | `a00ba519-2d7c-5264-8383-31d652d2ffcf` — **different** |
| Branch checked out at start | `claude/gallery-hook-liveness-verify-bzn5c6` (the designated development branch) |
| `.claude/settings.json` first committed | `61fec2e`, an ancestor of the checked-out `HEAD` `eb1e006` |
| `.claude/settings.json` mtime on disk | `2026-09-06T05:15:21.034Z` |
| Harness `settings_load_started` | `2026-09-06T05:15:22.898Z`, and again at `05:15:23.685Z` |

The file existed **1.87 seconds before** the harness first read settings, and was already
tracked in the commit that was checked out. Snapshot timing cannot explain this attempt.

## 1. Host-door evidence

| # | Probe (real host door) | Expected if hooks live | Observed |
|---|---|---|---|
| A | SessionStart output at session open | `DOCTRINE ORIENTATION: VALID …` and `DOCTRINE GUARD: pre-act enforcement live …` | **absent**; `.doctrine/runtime/` did not exist at session open |
| B | Bash, harmless read (`cat README.md`) | executes, no denial | executes — **no false denial** |
| C | Bash, `git commit --allow-empty -m "liveness probe"` in this repository | denied `GUARD-2` (orientation never established) | **executed** — commit `e934b6b`, history 4 → 5 commits |
| D | `Write` to `src/app/page.tsx` (stage-blocked application source) | denied `GUARD-4`/`GUARD-2`, route file | **file was created**, 173 bytes |
| E | Indeterminate / malformed payload | denied `GUARD-0` | **not exercisable through the host door** — every tool in the matcher has a schema-valid payload. Proven at script level only (D-19 … D-25) |
| F | Central `builders-doctrine` protection | checkout byte-identical | **byte-identical**, see §5 |

Both canaries were reversed immediately. `git reset --hard eb1e006` restored the history to 4
commits; `src/` was removed. `git status --porcelain` is empty and `HEAD` is `eb1e006`, the
commit the session started on. Neither canary was pushed.

## 2. Harness instrumentation — the decisive record

The harness writes its own diagnostics to `$CLAUDE_CODE_DIAGNOSTICS_FILE`. Across the whole
session, for every hook event and every tool call, it recorded **exactly one** hook spawn:

```
05:15:24.556Z hook_spawn_started   {"hook_event_name": "SessionStart", "index": 0}
05:15:24.591Z hook_spawn_completed {"hook_event_name": "SessionStart", "index": 0,
                                    "duration_ms": 58, "exit_code": 0, "aborted": false}
```

That one is the harness's own git-identity hook from `~/.claude/launcher-settings.json`: it
completed in 58 ms, it set `user.name=Claude`, and it left no `.doctrine/runtime/` behind,
which `scripts/doctrine-hook.py session-start` always writes.

- `hook_spawn` events for `PreToolUse`: **0**, against 14 `Bash` calls and 1 `Write` call, all
  of which the project matcher covers.
- Records in the session transcript carrying hook output: **0**. Every occurrence of
  `DOCTRINE ORIENTATION`, `pre-act enforcement live` and `hookEventName` in the transcript sits
  inside this session's own tool inputs and outputs — text read from files, never hook output.

`settings_load_completed` reports `source_count: 4, error_count: 0`. Four sources loaded
cleanly; the project's file was not among them, and nothing errored, because from the
harness's point of view there was nothing at the project path to load.

## 3. Cause, named

**Project-settings discovery. The repository is not the session's project root.**

| Fact | Value |
|---|---|
| Session working directory | `/home/user` |
| Transcript project directory | `/root/.claude/projects/-home-user/` |
| `CLAUDE_PROJECT_DIR` | empty |
| Repository | `/home/user/Thegallery` — one level **below** the project root |
| `/home/user/.claude/` | **does not exist** |
| Every `settings.json` on the machine | `/home/user/Thegallery/.claude/settings.json` — the only one |

The session was opened with two sibling repositories under a common parent, and the parent
became the project root. The harness looks for project settings at `<project root>/.claude/`.
The Gallery's configuration is one directory deeper and is never a candidate.

Ruled out by this session's evidence:

- *Host snapshot timing* — the file predates the first settings load by 1.87 s and was tracked
  in the checked-out commit (§0).
- *Unsupported matcher behaviour* — the project's `SessionStart` entry carries no matcher at
  all and still did not fire, and there are **zero** `PreToolUse` spawns for any tool. A
  matcher fault produces partial coverage, not none.
- *A broken guard* — the script returns the correct verdict for every canary payload (§4).
- *A hook door that does not work here* — one did fire, from a settings file at the project
  root. The door works; the project's file is not behind it.

## 4. Script-level cross-check (diagnosis, not proof of invocation)

`scripts/doctrine-hook.py explain`, same payloads as the host-door probes:

```
Bash  git commit --allow-empty  → DENIED [GUARD-2, route shell]  orientation is not valid for this session
Write src/app/page.tsx          → DENIED [GUARD-2, route file]   orientation is not valid for this session
Bash  cat README.md             → ALLOWED [shell-not-consequential]
malformed stdin                 → DENIED [GUARD-0, route payload] payload is not valid JSON
Write into builders-doctrine    → DENIED [GUARD-1, route file]   read-only central checkout
```

The guard logic is correct and unchanged; it is simply never invoked. The procedure predicted
`GUARD-3`/`GUARD-4` for probes C and D and the script returns `GUARD-2` for both — because the
SessionStart hook never ran, no orientation exists, and `GUARD-2` precedes the more specific
rules. The procedure anticipates this ("`GUARD-2` if orientation had not been established").

`scripts/doctrine-gate.py`: PASS, 5 of 5. `scripts/doctrine-drill.py`: 73 PASS, 0 RED.
Neither is evidence of host invocation and neither is offered as such.

## 5. Central repository — unchanged

Fingerprint of `/home/user/builders-doctrine`, taken before the first probe and again after
the last:

| | Before | After |
|---|---|---|
| `HEAD` | `dfdecb651df8cef5387487fee21d8ee2f798db95` | identical |
| `HEAD^{tree}` | `71366c55ed1de19ffe31c9f65744dc98048c6a8e` | identical |
| `git status --porcelain` | empty | empty |
| sha256 over every tracked and untracked file | `c2265b45354c9b7c858920f7eebe4ef4335279f806f348159d19a90bd721ba64` | identical |

`git reflog` carries only the container's own setup checkout (`main` → the development branch,
same commit). No write into the Doctrine checkout was attempted through any route. Central
protection is evidenced by the checkout being byte-identical and by the guard classifying such
a write `GUARD-1` when handed the payload, not by attacking it.

## 6. Second finding — the compulsory git layer was inert in this clone

Probe C committed with **no refusal from `.githooks/pre-commit` either**. The reason:

```
scripts/doctrine-hook.py:379  (inside session_start)
    git -C <project> config core.hooksPath .githooks
```

`core.hooksPath` is armed **only** by the SessionStart hook. A fresh clone does not carry it —
`git config core.hooksPath` returned nothing in this container — so in a session where the
harness hook does not fire, the git layer does not fire either. The two layers are not
independent: the layer described as compulsory is armed by the layer described as
as-configured.

`README.md` states "core.hooksPath is set by the seam". It is not; `scripts/doctrine-orient.py`
never touches it. Gate G3 checks that the hook files exist, are executable and carry no
fail-open path, all of which is true; it does not check that git is configured to run them.

For this receipt's own commit, `core.hooksPath` was then set to `.githooks` by hand and
`scripts/doctrine-orient.py orient` was run, so that the commit passed through the compulsory
layer rather than around it — the seam's documented posture, performed manually because the
hook that normally performs it did not fire. That is a local git configuration in an ephemeral
container, not a repair: the next clone starts unarmed again.

This puts `GAL-G7`'s `ARMED` classification in question. It is not reclassified here: moving
`armed_fixed_decisions` is a deliberate recorded movement and this session is bounded to
verification. Recorded as **OBL-GAL-013** and ledger **GAL-L0010**, with the two candidate
repairs named there.

## 7. Delegated-agent probe (UNK-GAL-002) — not run, again, and for the same reason

In a session where no project hook is loaded at all, a subagent probe cannot distinguish "the
delegation route is ungoverned" from "no hooks are loaded". A test that cannot discriminate is
not evidence. UNK-GAL-002 is retained unchanged. The task did not ask for it to be closed at
the cost of expanding the work, and it is not expanded.

## 8. Bounded repair — attempted, blocked, not worked around

The one repair reachable from inside a running session is to place hook configuration at the
actual project root, `/home/user/.claude/settings.json`. A **non-blocking** version was
attempted first, as a discriminator: a `PreToolUse` entry that appends a line to a scratch log
and always exits 0, denying nothing, purely to answer whether a hook at the project root is
invoked mid-session or whether configuration is additionally fixed at session start.

The harness's own auto-mode classifier denied the write. That denial was respected and not
routed around through another tool. So the discrimination between "project root only" and
"project root **and** session-start fixed" is not settled here, and neither is claimed.

It would not have been a repair in any case. It writes outside both repositories, into a
container that is reclaimed when the session ends, and it would arm a *hand-installed* copy
rather than the project's own discovered configuration — which is the thing OBL-GAL-002
requires to be seen. There is no repair inside the repository: `.claude/settings.json` is
already at the standard project path, is valid, and passes gate G2. Nothing the repository can
contain makes the host look one directory deeper.

## 9. External action required — BLOCKED on this

> Open the session with **`r959qp5qwr-web/Thegallery` as the session's working directory and
> project root**, not as a subdirectory of a parent that also holds the Doctrine checkout.
> The Doctrine checkout must remain reachable, so provide it through `DOCTRINE_ROOT` rather
> than as a sibling under a shared parent — the seam reads that variable and falls back to a
> sibling only when it is unset.

Then re-run this procedure. The precondition check now covers both failure modes: session
freshness (§0, added after attempt 1) and project-root identity (added after this attempt).

## 10. What this attempt changes

Nothing about enforcement, and one correction to the standing assessment.

- Harness layer: still `ARMED_AS_CONFIGURED`, still never observed executing. OBL-GAL-002 open.
- Repository-local layer: the scripts and the drill are unchanged and green, but the previous
  session's phrase "repository-local enforcement: armed and drilled" is too strong for a fresh
  clone. The drill proves the logic; `core.hooksPath` proves nothing was armed here. §6.
- CI and trunk layers: unarmed, unchanged, and separate governor and platform actions.

The honest summary of this container: **no enforcement layer was live in it**. A deliberate
empty commit and a stage-blocked source file both went through, and only this session's own
discipline reversed them.
