# Hook-liveness verification — procedure and expected evidence

**Why this exists.** Four enforcement claims in `doctrine/PRODUCT_STATE.json` (GAL-G1, GAL-G2,
GAL-G6, GAL-G9) rest on the harness executing this project's hooks. Whether it does cannot be
proven from inside the repository, and it cannot be proven by running the guard script by
hand — that proves script behaviour, which is a different layer. The obligation stays open
(OBL-GAL-002) until the evidence below exists.

**What is already known, and what is not.**

| Layer | State | Evidence |
|---|---|---|
| Script behaviour | PROVEN | 73 drill cases, `.doctrine/runtime/drills/` |
| Hook configuration | PROVEN | `.claude/settings.json` parses, matches the derived mutation surface, references existing scripts, discards nothing — gate G2, drilled by D-62 and D-63 |
| Host invocation of *some* hook in this environment | PROVEN | the harness's own SessionStart and Stop hooks ran in the session of 2026-09-04: the transcript carries a `stop_hook_summary` record and the git-identity hook took effect. The hook door exists and works here. |
| Host invocation of **this project's** hooks | NOT SEEN | this branch's `.claude/settings.json` was created after that session started, and hook configuration is snapshotted at session start, so no project hook has ever fired |

## Step 0 — the precondition, checked first (added after attempt 1 tested nothing)

A running session cannot make itself fresh. Asking the session in progress to "open a fresh
session" continues the same one, and the verification then exercises a session whose hook
configuration was fixed before this project's configuration existed. Attempt 1 of 2026-09-04
failed exactly this way; its evidence is in `HOOK_LIVENESS_ATTEMPT-2026-09-04.md`.

Before any probe, run:

```bash
echo "$CLAUDE_CODE_SESSION_ID"
```

and compare it with the session ids recorded in the attempt receipts beside this file. **If it
matches one of them, stop: this is not a fresh session and nothing below can prove anything.**
The new session must be started by the governor from the client — the web or desktop app, or a
new terminal invocation — with the branch already checked out.

## Procedure (about five minutes, in a genuinely fresh session on this branch)

1. Start a **new** session with `r959qp5qwr-web/Thegallery` on `claude/the-gallery-foundation-7plo1e` checked out, so that `.claude/settings.json` is present before the session begins. Accept the hook-trust prompt if the harness shows one.
2. Read the first output of the session, before typing anything.
3. Ask the session to run: `git commit --allow-empty -m "liveness probe"` **without** orienting first — that is, immediately, in a session where you have not asked for anything else.
4. Ask the session to run: `cat README.md`.
5. Ask the session to write `src/app/page.tsx` — stage-blocked application source in the product repository, reversible, and denied by `GUARD-4`. Do **not** probe by attempting a write into the Doctrine checkout: central protection is verified by the checkout remaining byte-identical, not by attacking it.

## Expected evidence

| Step | Expected | Meaning |
|---|---|---|
| 2 | The session opens with `DOCTRINE ORIENTATION: VALID for this session`, the derived standing assessment (product, stage, next acceptance condition, counts), and the line `DOCTRINE GUARD: pre-act enforcement live for this session at …/scripts/doctrine-hook.py` | SessionStart fired and orientation is automatic |
| 3 | The commit does **not** happen. The session reports a refusal quoting `DOCTRINE GUARD: DENIED [GUARD-…]` — `GUARD-2` if orientation had not been established, or `GUARD-3` if the branch were a default branch | PreToolUse fired on Bash and denied a consequential act |
| 4 | The file is read normally, with no denial | Inspection is unaffected — the guard is not simply blocking everything |
| 5 | The write does **not** happen; the refusal quotes `DOCTRINE GUARD: DENIED [GUARD-4, route file]` | PreToolUse fired on a **non-Bash** tool, which is the coverage this closure added |

An indeterminate-payload case (`GUARD-0`) cannot be exercised through the host door: every tool
in the matcher has a schema-valid payload. It stays proven at script level by drill cases
D-19 to D-25, and no attempt should claim otherwise.

If step 2 shows the assessment but steps 3–5 are not denied, the SessionStart hook is live and
the PreToolUse hook is not: record that split rather than treating either as proof of the other.

## Recording the result

- **All four as expected:** set OBL-GAL-002 to SEEN with the date and the session id, and paste the four quoted lines into a receipt beside this file. The hook-layer claims stay `ARMED_AS_CONFIGURED` — liveness in one session is not liveness in every session, and the host-level fail-open of OBL-GAL-010 is untouched by this test.
- **Any step not as expected:** leave OBL-GAL-002 open, record which step failed, and treat every hook-layer claim as UNARMED until the wiring is fixed. Do not weaken the drill to match.
