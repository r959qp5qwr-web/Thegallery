# Hook-liveness verification — attempt 1, 2026-09-04

**Verdict: NOT PROVABLE in this session.** The project's hooks demonstrably did not execute, and
the reason is a session-lifecycle precondition that was never met rather than a defect in the
wiring. OBL-GAL-002 stays open. No enforcement claim is upgraded by this attempt.

## 1. The precondition failed before any probe ran

The procedure requires a **fresh** session, because the harness reads hook configuration from
the settings present when a session starts. This attempt was requested as a fresh session but
the harness continued the existing one:

| Fact | Value |
|---|---|
| Session id during this attempt | `a00ba519-2d7c-5264-8383-31d652d2ffcf` |
| Session id that created `.claude/settings.json` | `a00ba519-2d7c-5264-8383-31d652d2ffcf` — the same |
| Session start (first transcript record) | `2026-09-04T04:23:26Z` |
| `.claude/settings.json` first written | during that session, ~04:38; committed at `ffd0715`, 08:13 |

A running session cannot make itself fresh. The verification therefore tested a session whose
hook configuration was fixed before this project's configuration existed.

## 2. Host-door evidence

| # | Probe (real host door) | Expected if hooks live | Observed |
|---|---|---|---|
| 1 | SessionStart banner and standing assessment at session open | `DOCTRINE ORIENTATION: VALID …` and `DOCTRINE GUARD: pre-act enforcement live …` | **absent** |
| 2 | Bash, harmless read (`head README.md`) | executes, no denial | executes — no false denial |
| 3 | Bash, `git -C <isolated scratch repo on main> commit --allow-empty` | denied `GUARD-3 route shell` | **executed**; scratch repo went from 1 to 2 commits |
| 4 | `Write` to `src/app/page.tsx` (stage-blocked application source) | denied `GUARD-4 route file` | **file was created**; removed immediately, tree clean |
| 5 | Indeterminate / malformed payload | denied `GUARD-0` | **not exercisable through the host door** — every tool in the matcher has a schema-valid payload, so a malformed request cannot be sent this way. Proven at script level only (drill D-19…D-25). |

Cross-checks against the guard **script** for probes 3 and 4 returned exit 2 with
`DENIED [GUARD-3, route shell]` and `DENIED [GUARD-4, route file]`. Script logic is correct; it
is simply not being invoked. That is the distinction this receipt exists to keep.

## 3. Transcript evidence

- Records carrying `hookEventName`: **0**.
- System records of any kind: two `stop_hook_summary`, both from the harness's own Stop hook
  configured in `~/.claude/launcher-settings.json`.
- Every occurrence of the string `pre-act enforcement live for this session` in the transcript
  appears at `/message/content[0]/input/command` — inside Bash tool *inputs* that wrote the
  script, never as hook output.

## 4. Cause, named

**Host snapshot timing / session-scoped settings load.** The harness executed the hooks that
existed at session start (`~/.claude/launcher-settings.json`: SessionStart and Stop) and did not
pick up `.claude/settings.json`, which appeared later in the same session.

Ruled out by the same evidence:

- *Project settings discovery* — the file is at the standard project path, is valid JSON, and
  passes gate G2, which checks that the matcher covers the derived mutation surface, that the
  commands reference existing scripts and that nothing is discarded.
- *Unsupported matcher behaviour* — a matcher fault would produce invocation records for some
  tools and not others. There are **zero** PreToolUse records for any tool.
- *A broken guard* — the script denied both canaries when handed the same payloads directly.

## 5. Delegated-agent probe (UNK-GAL-002)

Not run, and deliberately so. A subagent's tool calls in this session would inherit the same
absent hook configuration, so the probe could not distinguish "subagent route is not governed"
from "no hooks are loaded at all". A test that cannot discriminate is not evidence.
UNK-GAL-002 is retained unchanged.

## 6. What this attempt changes

Nothing about enforcement. Repository-local layers remain armed and drilled; the harness layer
remains ARMED-AS-CONFIGURED and unproven; CI and trunk enforcement remain unarmed and are
separate governor and platform actions.

The one repair made: the procedure now opens with a precondition check that compares the current
session id against the one recorded here, so a future attempt cannot silently test nothing; and
its step 5 no longer asks for a write into the Doctrine checkout.
