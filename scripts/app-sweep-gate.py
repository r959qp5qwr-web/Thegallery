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
# Two receipts per viewport: the governor's corrections (journey 14) and the Interface Standard
# (journey 15, kit/interface-standard). Either missing, stale or failed keeps the gate shut.
RECEIPTS = {"app-sweep": "whole-app sweep", "interface": "interface standard"}
GUARDED = ("mcp__github__create_pull_request", "mcp__github__merge_pull_request")
# The same list as EXTRA_FILES in e2e/14-whole-app.spec.ts: files outside src/ and public/ that
# change what renders or how the sweep sees it.
EXTRA_FILES = ("ux/APP_RULES.json", "e2e/14-whole-app.spec.ts", "e2e/helpers.ts", "next.config.ts",
               "next.config.js", "next.config.mjs", "package.json", "package-lock.json",
               "ux/INTERFACE_PROFILE.json", "kit/interface-standard/STANDARD.json",
               "kit/interface-standard/engine/measure.ts", "e2e/15-interface-standard.spec.ts",
               "e2e/support/fingerprint.ts", "playwright.config.ts", "tsconfig.json",
               "open-next.config.ts", "e2e/support/test-project.sql")


def fingerprint() -> str:
    """The same fingerprint e2e/14-whole-app.spec.ts writes (codeFingerprint)."""
    files = [p for d in ("src", "public", "db/migrations") for p in (ROOT / d).rglob("*") if p.is_file()]
    rel = [p.relative_to(ROOT).as_posix() for p in files] + [f for f in EXTRA_FILES if (ROOT / f).is_file()]
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
    try:
        build = (ROOT / ".next" / "BUILD_ID").read_text().strip()
    except Exception:  # noqa: BLE001 — no build is a shut gate for the standard's receipts
        build = ""
    for kind, project in [(k, p) for k in RECEIPTS for p in PROJECTS]:
        path = ROOT / ".doctrine" / "runtime" / f"{kind}-{project}.json"
        project = f"{RECEIPTS[kind]} ({project})"
        try:
            r = json.loads(path.read_text())
            if not isinstance(r, dict):
                raise ValueError("not an object")
        except Exception:  # noqa: BLE001 — missing or unreadable is shut
            problems.append(f"{project}: no readable sweep receipt — run the full suite on this code")
            continue
        pages, swept = r.get("pages"), r.get("swept")
        if not (isinstance(pages, int) and isinstance(swept, int) and pages > 0):
            problems.append(f"{project}: the receipt does not say how many pages were swept")
            continue
        if kind == "interface" and r.get("build") != build:
            problems.append(f"{project}: measured on build {r.get('build', '?')}, but the build on disk is {build or 'missing'}")
        elif r.get("fingerprint") != now:
            problems.append(f"{project}: the sweep ran on other code ({r.get('at', '?')}); run it again on this code")
        elif r.get("result") != "PASS":
            n = sum(len(x.get("findings", [])) for x in r.get("findings", []))
            problems.append(f"{project}: the sweep FAILED with {n} finding(s) on {len(r.get('findings', []))} page(s) — see {path.relative_to(ROOT)}")
        elif swept != pages:
            problems.append(f"{project}: the sweep reached {swept} of {pages} pages")
    return not problems, problems


def main() -> int:
    if len(sys.argv) > 1 and sys.argv[1] == "hook":
        # An indeterminate verdict is a denial: an unreadable payload or a crash shuts the gate.
        try:
            payload = json.load(sys.stdin)
            tool = payload.get("tool_name") if isinstance(payload, dict) else None
        except Exception:  # noqa: BLE001
            tool = None
        if tool is not None and tool not in GUARDED:
            return 0
        try:
            ok, problems = verdict()
        except Exception as e:  # noqa: BLE001
            ok, problems = False, [f"the gate could not decide ({e})"]
        if tool is None:
            ok, problems = False, ["the hook payload could not be read"] + ([] if ok else problems)
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
