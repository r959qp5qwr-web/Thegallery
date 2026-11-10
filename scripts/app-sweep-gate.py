#!/usr/bin/env python3
"""The whole-app sweep gate (governor, 2026-11-10).

A pull request is opened or merged only when the whole-app sweep (e2e/14-whole-app.spec.ts) has
passed, on phone and on desktop, for exactly the code being proposed: every file under src/ and
public/, the rules (ux/APP_RULES.json) and the sweep itself, by path and content. The sweep writes
its receipts to .doctrine/runtime/app-sweep-<project>.json; this script recomputes the same
fingerprint and compares.

  python3 scripts/app-sweep-gate.py           report, exit 1 when the gate is shut
  python3 scripts/app-sweep-gate.py hook      Claude Code PreToolUse: read the payload on stdin and
                                              deny opening or merging a pull request while shut

An indeterminate verdict is a denial (CLAUDE.md standing rule 6): a missing, unreadable, stale or
failed receipt shuts the gate.
"""
import hashlib
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PROJECTS = ("phone", "desktop")
GUARDED = ("mcp__github__create_pull_request", "mcp__github__merge_pull_request")


def fingerprint() -> str:
    """The same fingerprint e2e/14-whole-app.spec.ts writes (codeFingerprint)."""
    files = [p for d in ("src", "public") for p in (ROOT / d).rglob("*") if p.is_file()]
    rel = [p.relative_to(ROOT).as_posix() for p in files] + ["ux/APP_RULES.json", "e2e/14-whole-app.spec.ts"]
    h = hashlib.sha256()
    for f in sorted(rel):
        h.update((f + "\0" + hashlib.sha256((ROOT / f).read_bytes()).hexdigest() + "\n").encode())
    return h.hexdigest()


def verdict() -> tuple[bool, list[str]]:
    try:
        now = fingerprint()
    except Exception as e:  # noqa: BLE001 — any failure to read the code is a shut gate
        return False, [f"the code could not be fingerprinted ({e})"]
    problems = []
    for project in PROJECTS:
        path = ROOT / ".doctrine" / "runtime" / f"app-sweep-{project}.json"
        try:
            r = json.loads(path.read_text())
        except Exception:  # noqa: BLE001
            problems.append(f"{project}: no sweep receipt — run the suite (bash e2e/run-hosted.sh --project={project})")
            continue
        if r.get("fingerprint") != now:
            problems.append(f"{project}: the sweep ran on other code ({r.get('at', '?')}); run it again on this code")
        elif r.get("result") != "PASS":
            n = sum(len(x.get("findings", [])) for x in r.get("findings", []))
            problems.append(f"{project}: the sweep FAILED with {n} finding(s) on {len(r.get('findings', []))} page(s) — see {path.relative_to(ROOT)}")
        elif r.get("swept") != r.get("pages"):
            problems.append(f"{project}: the sweep reached {r.get('swept')} of {r.get('pages')} pages")
    return not problems, problems


def main() -> int:
    if len(sys.argv) > 1 and sys.argv[1] == "hook":
        try:
            payload = json.load(sys.stdin)
        except Exception:  # noqa: BLE001
            payload = {}
        if payload.get("tool_name") not in GUARDED:
            return 0
        ok, problems = verdict()
        if ok:
            return 0
        print(json.dumps({"hookSpecificOutput": {
            "hookEventName": "PreToolUse", "permissionDecision": "deny",
            "permissionDecisionReason": "Whole-app sweep gate: a pull request is opened or merged only after "
            "the sweep passes on phone and desktop for exactly this code. " + " | ".join(problems)}}))
        return 0
    ok, problems = verdict()
    print("APP SWEEP GATE: " + ("OPEN — phone and desktop passed on this code" if ok else "SHUT"))
    for p in problems:
        print("  " + p)
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
