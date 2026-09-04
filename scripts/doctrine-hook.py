#!/usr/bin/env python3
"""
The Gallery — Claude Code hook adapter for the Doctrine seam.

  session-start   orient the blank session automatically and put the derived standing
                  assessment in front of it (Playbook Stage 0; Audit Protocol L-A20).
  pre-tool-use    deny a consequential act while orientation is invalid; deny any write to
                  the read-only Doctrine checkout; deny direct commits on the default branch
                  (Canon "The hook surface", Audit Protocol L-A21).

Posture (Governor ruling 2026-08-09): the guard FAILS OPEN on its own malfunction and asks
about the ACT, never about itself. A verdict the seam actually computed (orientation
invalid) is relayed as a denial. Every deny rule carries the date and incident that paid
for it, so an unattributed denial is indistinguishable from a frozen assumption (C-0003).
Exit 2 = deny (stderr reaches the model). Exit 0 = allow.
"""
from __future__ import annotations

import json
import os
import re
import shlex
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
PROJECT = Path(os.environ.get("CLAUDE_PROJECT_DIR") or HERE.parent).resolve()
SEAM = HERE / "doctrine-orient.py"
DEFAULT_BRANCHES = {"main", "master"}

RULES = {
    "GUARD-1": {"since": "2026-09-04", "paid_for_by": "Build Commission v1.1 §3 — builders-doctrine is read-only; never commit, push or edit it from a product session"},
    "GUARD-2": {"since": "2026-09-04", "paid_for_by": "Playbook §3 consequence gate; Commission v1.1 §3 fail-closed rule — no consequential act on an invalid orientation"},
    "GUARD-3": {"since": "2026-09-04", "paid_for_by": "Canon Day Zero #6 — branch discipline enforced, not advised (advisory form broken 29 times on one build)"},
}
CONSEQUENTIAL_GIT = {"commit", "push", "merge", "rebase", "tag", "cherry-pick", "revert", "am"}
CONSEQUENTIAL_OTHER = re.compile(
    r"\bgh\s+(?:pr|release)\b|\bvercel\b|\bnetlify\s+deploy\b|\bwrangler\s+(?:deploy|publish)\b|\bfly(?:ctl)?\s+deploy\b"
    r"|\bfirebase\s+deploy\b|\bsupabase\s+(?:db\s+push|functions\s+deploy|migration\s+up)\b|\bprisma\s+(?:migrate\s+deploy|db\s+push)\b"
    r"|\bdrizzle-kit\s+(?:push|migrate)\b|\bnpm\s+publish\b|\bgit\s+reset\s+--hard\b")
MUTATING = re.compile(r"(?:^|[\s;&|])(?:rm|mv|cp|tee|touch|chmod|chown|mkdir|sed\s+-i|truncate|ln|patch|install)\b|>>?\s*\S|\bgit\s+(?:[-\w]+\s+)*(?:commit|push|add|rm|mv|checkout|switch|reset|clean|restore|stash|apply|am|rebase|merge|tag|branch\s+-[dDm]|update-ref|symbolic-ref)\b")


def deny(rule: str, why: str, detail: str = "") -> int:
    meta = RULES[rule]
    print(f"DOCTRINE GUARD: DENIED [{rule}, since {meta['since']}] — {why}", file=sys.stderr)
    if detail:
        print(detail.rstrip(), file=sys.stderr)
    print(f"  paid for by: {meta['paid_for_by']}", file=sys.stderr)
    return 2


def doctrine_root() -> Path:
    return Path(os.environ.get("DOCTRINE_ROOT") or PROJECT.parent / "builders-doctrine").resolve()


def segments(command: str) -> list[str]:
    return [s.strip() for s in re.split(r"&&|\|\||;|\|", command) if s.strip()]


def git_subcommand(segment: str) -> str | None:
    try:
        toks = shlex.split(segment)
    except ValueError:
        toks = segment.split()
    if not toks or toks[0] != "git":
        return None
    i = 1
    while i < len(toks):
        t = toks[i]
        if t in ("-C", "-c", "--git-dir", "--work-tree", "--namespace"):
            i += 2
            continue
        if t.startswith("-"):
            i += 1
            continue
        return t
    return None


def act_directory(command: str, cwd: str) -> Path:
    """Where the act runs: a leading `cd X`, a `git -C X`, else the tool's cwd."""
    first = segments(command)[0] if segments(command) else ""
    m = re.match(r"cd\s+(\S+)", first)
    if m:
        return Path(os.path.expanduser(m.group(1).strip("'\""))).resolve()
    m = re.search(r"\bgit\s+-C\s+(\S+)", command)
    if m:
        return Path(os.path.expanduser(m.group(1).strip("'\""))).resolve()
    return Path(cwd or os.getcwd()).resolve()


def touches_doctrine(command: str, act_dir: Path) -> bool:
    root = doctrine_root()
    inside = act_dir == root or root in act_dir.parents
    named = str(root) in command or "builders-doctrine" in command
    return (inside or named) and bool(MUTATING.search(command))


def current_branch(act_dir: Path) -> str | None:
    try:
        cp = subprocess.run(["git", "-C", str(act_dir), "rev-parse", "--abbrev-ref", "HEAD"], capture_output=True, text=True, timeout=20,
                            env=dict(os.environ, GIT_OPTIONAL_LOCKS="0"))
    except (OSError, subprocess.TimeoutExpired):
        return None
    return cp.stdout.strip() if cp.returncode == 0 else None


def is_consequential(command: str) -> bool:
    if CONSEQUENTIAL_OTHER.search(command):
        return True
    return any(git_subcommand(seg) in CONSEQUENTIAL_GIT for seg in segments(command))


def seam_check(session_id: str | None) -> subprocess.CompletedProcess:
    cmd = [sys.executable, "-B", str(SEAM), "check", "--quiet"]
    if session_id:
        cmd += ["--session-id", session_id]
    return subprocess.run(cmd, capture_output=True, text=True, cwd=str(PROJECT), timeout=120)


def pre_tool_use(payload: dict) -> int:
    if payload.get("tool_name") != "Bash":
        return 0
    command = str((payload.get("tool_input") or {}).get("command") or "")
    if not command.strip():
        return 0
    act_dir = act_directory(command, str(payload.get("cwd") or ""))
    if touches_doctrine(command, act_dir):
        return deny("GUARD-1", "this command would write to the read-only builders-doctrine checkout. The Doctrine is central; only Governor-directed changes made in its own repository may alter it.")
    subs = {git_subcommand(seg) for seg in segments(command)}
    if "commit" in subs or "push" in subs:
        branch = current_branch(act_dir)
        if branch in DEFAULT_BRANCHES and os.environ.get("DOCTRINE_ALLOW_MAIN") != "1":
            return deny("GUARD-3", f"direct {'commit' if 'commit' in subs else 'push'} on the default branch '{branch}'. Work on a branch and merge through review; set DOCTRINE_ALLOW_MAIN=1 only under an explicit Governor instruction.")
    if not is_consequential(command):
        return 0
    cp = seam_check(payload.get("session_id"))
    if cp.returncode == 0:
        return 0
    return deny("GUARD-2", "consequential act refused: Doctrine orientation is not valid for this session.",
                (cp.stderr or cp.stdout) + "\nRe-orient: python3 scripts/doctrine-orient.py orient   (inspection and diagnosis remain allowed)")


def session_start(payload: dict) -> int:
    subprocess.run(["git", "-C", str(PROJECT), "config", "core.hooksPath", ".githooks"], capture_output=True, text=True, timeout=20)
    cmd = [sys.executable, "-B", str(SEAM), "orient"]
    if payload.get("session_id"):
        cmd += ["--session-id", str(payload["session_id"])]
    cp = subprocess.run(cmd, capture_output=True, text=True, cwd=str(PROJECT), timeout=180)
    sys.stdout.write(cp.stdout)
    if cp.returncode != 0:
        print("DOCTRINE ORIENTATION: INVALID — product mutation is blocked until this is resolved; inspection and diagnosis remain allowed.")
        print(cp.stderr.rstrip())
    else:
        print("DOCTRINE ORIENTATION: VALID for this session. Governing truth: doctrine/PRODUCT_STATE.json (active_stage, next_acceptance_condition). Never write to builders-doctrine.")
    return 0


def main() -> int:
    mode = sys.argv[1] if len(sys.argv) > 1 else ""
    raw = sys.stdin.read() if not sys.stdin.isatty() else ""
    payload = json.loads(raw) if raw.strip() else {}
    if not isinstance(payload, dict):
        raise ValueError("hook payload is not an object")
    if mode == "pre-tool-use":
        return pre_tool_use(payload)
    if mode == "session-start":
        return session_start(payload)
    raise ValueError(f"unknown mode {mode!r}")


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except SystemExit:
        raise
    except Exception as exc:  # the guard asks about the act, never about itself: malfunction fails OPEN
        print(f"doctrine-hook: malfunction ({exc.__class__.__name__}: {exc}); FAIL-OPEN per Governor ruling 2026-08-09 — run `python3 scripts/doctrine-orient.py check` by hand", file=sys.stderr)
        raise SystemExit(0)
