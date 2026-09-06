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
| Host invocation of **this project's** hooks | NOT SEEN | two attempts, two different causes. Attempt 1 (2026-09-04): the settings file was created *during* the session that tested it, so nothing could have fired. Attempt 2 (2026-09-06): the session was fresh and the file predated the harness's settings load by 1.87 s, and still not one hook spawned — because the session's project root was `/home/user`, the parent of the repository, and the harness looks for project settings at `<project root>/.claude/` only |

## Step 0 — two preconditions, both checked before any probe

Each was added because an attempt failed on it and tested nothing. Neither substitutes for the
other; check both.

### 0a — session freshness (added after attempt 1)

A running session cannot make itself fresh. Asking the session in progress to "open a fresh
session" continues the same one, and the verification then exercises a session whose hook
configuration was fixed before this project's configuration existed. Attempt 1 of 2026-09-04
failed exactly this way; its evidence is in `HOOK_LIVENESS_ATTEMPT-2026-09-04.md`.

```bash
echo "$CLAUDE_CODE_SESSION_ID"
```

Compare it with the session ids recorded in the attempt receipts beside this file. **If it
matches one of them, stop: this is not a fresh session and nothing below can prove anything.**
The new session must be started by the governor from the client — the web or desktop app, or a
new terminal invocation — with the branch already checked out.

### 0b — the repository is the session's project root (added after attempt 2)

The harness discovers project settings at `<project root>/.claude/settings.json` and nowhere
else. If the session opens on a parent directory holding this repository and the Doctrine
checkout as siblings, the project root is that parent, `.claude/` sits one level too deep, and
no project hook can fire. Attempt 2 of 2026-09-06 failed exactly this way; its evidence is in
`HOOK_LIVENESS_ATTEMPT-2026-09-06.md`.

```bash
pwd
ls -d "$(pwd)/.claude"
```

**If `pwd` is not this repository's root, or `.claude/` is not directly inside it, stop.** The
session must be opened with `Thegallery` itself as the working directory, with the Doctrine
checkout supplied through `DOCTRINE_ROOT` rather than as a sibling under a shared parent.

### 0c — confirm the door with the harness's own record, before trusting a probe

```bash
python3 - <<'EOF'
import json
for l in open(__import__("os").environ["CLAUDE_CODE_DIAGNOSTICS_FILE"]):
    r = json.loads(l)
    if "hook_spawn" in r.get("event", ""):
        print(r["timestamp"], r["event"], r["data"])
EOF
```

A live SessionStart from this project appears here as a `hook_spawn_completed` whose duration
is in the hundreds of milliseconds, not tens, because the seam verifies the Doctrine checkout.
The harness's own git-identity hook also appears; do not mistake one for the other. Zero
`PreToolUse` spawns after a covered tool call is a dead PreToolUse hook, whatever a probe
appears to show.

## Procedure (about five minutes, in a genuinely fresh session on this branch)

1. Start a **new** session with `r959qp5qwr-web/Thegallery` on `claude/the-gallery-foundation-7plo1e` checked out, so that `.claude/settings.json` is present before the session begins. Accept the hook-trust prompt if the harness shows one.
2. Read the first output of the session, before typing anything.
3. Ask the session to run: `git commit --allow-empty -m "liveness probe"` **without** orienting first — that is, immediately, in a session where you have not asked for anything else.
4. Ask the session to run: `cat README.md`.
5. Ask the session to write `src/app/page.tsx` — stage-blocked application source in the product repository, reversible, and denied by `GUARD-4`. Do **not** probe by attempting a write into the Doctrine checkout: central protection is verified by the checkout remaining byte-identical, not by attacking it.
6. Run `git config core.hooksPath` (added after attempt 2). It must print `.githooks`. The SessionStart hook is what sets it, so a blank answer means the git layer is inert in this clone as well and probe 3 tested nothing at either layer.

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
- **Any step not as expected:** leave OBL-GAL-002 open, record which step failed, and treat every hook-layer claim as UNARMED until the wiring is fixed. Do not weaken the drill to match. Record the cause against the two preconditions above: attempt 1 failed 0a, attempt 2 failed 0b, and a third mode would need naming rather than assuming.
- **Either way, reverse every canary in the same session that made it,** and record the before and after `HEAD`, commit count and `git status` in the receipt. Attempt 2's commit canary reached the branch and was reset; a canary left standing is a governed change nobody decided.
