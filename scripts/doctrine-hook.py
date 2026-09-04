#!/usr/bin/env python3
"""
The Gallery — harness guard for the Doctrine seam.

  session-start   orient the blank session automatically and put the derived standing
                  assessment in front of it (Playbook Stage 0; Audit Protocol L-A20).
  pre-tool-use    decide one act. Reads and diagnosis are never touched; a consequential
                  act is denied unless the seam can positively establish that it is allowed.
  explain         classify a payload and print the verdict without acting (diagnosis).

POSTURE — amended 2026-09-04 by Governor instruction, superseding the fail-open default this
file shipped with on 2026-09-04 (Canon, "The hook surface": fail-open is the default *with
derogation*, and the derogation is a Governor decision, never an implementation choice):

    An indeterminate verdict is a denial for consequential acts.

A guard that turns its own crash, an unparseable payload, a missing stdin or a corrupt
mutation-surface file into permission is not a guard. So the failure path here exits 2 (deny)
rather than 0. Two things keep that from locking anyone out:

  1. The hook is matched ONLY to mutation-capable tools (derived from
     doctrine/MUTATION_SURFACE.json). Read, Grep, Glob and every other read-only tool are
     never matched, so a totally broken guard cannot stop inspection or diagnosis.
  2. Writes to the governance and bootstrap paths are always allowed, so a broken guard can
     always be repaired — and Stage 0 can bootstrap before any orientation exists.

The Canon's fail-open ruling protects the OPERATOR's access to the repository. It is not
touched by this derogation: a hook binds the harness's own agent sessions, never a human with
a terminal, who can still edit any file and run any git command.

HONEST LIMIT — the one fail-open this file cannot close. The host treats exit code 2 as a
block and EVERY OTHER non-zero exit as a non-blocking error, letting the tool proceed. So if
the interpreter is missing, the file is absent, or the process is killed before Python runs,
the act proceeds and nothing here can intervene. Enforcement at this layer is therefore
ARMED-AS-CONFIGURED at most; the fail-closed boundary for anything that reaches the
repository is .githooks/pre-commit and pre-push, and the boundary for anything that reaches
the default branch is the CI job named in doctrine/EXTERNAL_ENABLEMENT.md.

Every deny rule carries the date and the instrument that paid for it (candidate C-0003).
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
SURFACE = PROJECT / "doctrine" / "MUTATION_SURFACE.json"
STATE = PROJECT / "doctrine" / "PRODUCT_STATE.json"
DEFAULT_BRANCHES = {"main", "master"}

RULES = {
    "GUARD-0": {"since": "2026-09-04", "paid_for_by": "Governor enforcement-closure instruction 2026-09-04, on the session report's disclosure that this guard treated its own malfunction as permission (ledger GAL-L0006). An indeterminate verdict is a denial for consequential acts."},
    "GUARD-1": {"since": "2026-09-04", "paid_for_by": "Build Commission v1.1 §3 — builders-doctrine is the read-only central authority; no product session commits, pushes or edits it by any route."},
    "GUARD-2": {"since": "2026-09-04", "paid_for_by": "Playbook §3 consequence gate; Commission v1.1 §3 fail-closed rule — no consequential act on an invalid, stale or absent orientation."},
    "GUARD-3": {"since": "2026-09-04", "paid_for_by": "Canon Day Zero #6 — branch discipline enforced, not advised (the advisory form was broken 29 times on one build)."},
    "GUARD-4": {"since": "2026-09-04", "paid_for_by": "The active stage's own blocked_until_acceptance list in doctrine/PRODUCT_STATE.json — a stage gate that only a human remembers is a wish (Canon, first law)."},
}

# ---------------------------------------------------------------------------------------
# verdicts

class Verdict(Exception):
    pass


class Deny(Verdict):
    def __init__(self, rule: str, why: str, route: str, detail: str = ""):
        self.rule, self.why, self.route, self.detail = rule, why, route, detail


class Allow(Verdict):
    def __init__(self, reason: str):
        self.reason = reason


def emit_deny(d: Deny) -> int:
    meta = RULES[d.rule]
    print(f"DOCTRINE GUARD: DENIED [{d.rule}, route {d.route}, since {meta['since']}] — {d.why}", file=sys.stderr)
    if d.detail:
        print(d.detail.rstrip(), file=sys.stderr)
    print(f"  paid for by: {meta['paid_for_by']}", file=sys.stderr)
    return 2


def emit_allow(a: Allow) -> int:
    if os.environ.get("DOCTRINE_GUARD_EXPLAIN") == "1":
        print(f"DOCTRINE GUARD: ALLOWED [{a.reason}]", file=sys.stderr)
    return 0


# ---------------------------------------------------------------------------------------
# classification, derived from doctrine/MUTATION_SURFACE.json

def load_surface() -> dict:
    # A corrupt or missing surface file is an indeterminate verdict, not an open door.
    return json.loads(SURFACE.read_text(encoding="utf-8"))


def classify(tool: str, surface: dict) -> str:
    for cls, names in surface["tools"].items():
        if tool in names:
            return cls
    for ns, rule in surface.get("namespace_rules", {}).items():
        if tool.startswith(ns):
            leaf = tool[len(ns):]
            if any(leaf.startswith(v) or leaf == v for v in rule["read_verbs"]):
                return "READ_ONLY"
            return rule["default_for_unknown"]
    raise Deny("GUARD-0", f"tool {tool!r} is not in the inventoried mutation surface and matches no namespace rule, so this guard cannot say what it does.",
               "unknown-tool", "Add it to doctrine/MUTATION_SURFACE.json (and re-run scripts/doctrine-gate.py) before using it.")


# ---------------------------------------------------------------------------------------
# route helpers

def doctrine_root() -> Path:
    return Path(os.environ.get("DOCTRINE_ROOT") or PROJECT.parent / "builders-doctrine").resolve()


MUTATING_SHELL = re.compile(
    r"(?:^|[\s;&|(])(?:rm|mv|cp|tee|touch|chmod|chown|mkdir|truncate|ln|patch|install|dd)\b"
    r"|\bsed\s+-i\b|>>?\s*\S"
    r"|\bgit\s+(?:[-\w]+\s+)*(?:commit|push|add|rm|mv|checkout|switch|reset|clean|restore|stash|apply|am|rebase|merge|tag|update-ref|symbolic-ref|config)\b")
CONSEQUENTIAL_GIT = {"commit", "push", "merge", "rebase", "tag", "cherry-pick", "revert", "am", "reset", "filter-branch"}
CONSEQUENTIAL_OTHER = re.compile(
    r"\bgh\s+(?:pr|release|workflow|api)\b|\bvercel\b|\bnetlify\s+deploy\b|\bwrangler\s+(?:deploy|publish)\b|\bfly(?:ctl)?\s+deploy\b"
    r"|\bfirebase\s+deploy\b|\bsupabase\s+(?:db\s+push|functions\s+deploy|migration\s+up|link)\b|\bprisma\s+(?:migrate\s+deploy|db\s+push)\b"
    r"|\bdrizzle-kit\s+(?:push|migrate)\b|\bnpm\s+publish\b|\byarn\s+publish\b|\bpnpm\s+publish\b|\bdocker\s+push\b|\bterraform\s+apply\b|\bkubectl\s+apply\b")


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
    """Where the act runs: a leading `cd X`, a `git -C X`, else the tool's cwd. The guard asks
    about the ACT's directory, never about its own (AHOY-I-009)."""
    segs = segments(command)
    m = re.match(r"cd\s+(\S+)", segs[0]) if segs else None
    if m:
        return Path(os.path.expanduser(m.group(1).strip("'\""))).resolve()
    m = re.search(r"\bgit\s+-C\s+(\S+)", command)
    if m:
        return Path(os.path.expanduser(m.group(1).strip("'\""))).resolve()
    return Path(cwd or os.getcwd()).resolve()


def inside(path: Path, root: Path) -> bool:
    return path == root or root in path.parents


def current_branch(act_dir: Path) -> str | None:
    try:
        cp = subprocess.run(["git", "-C", str(act_dir), "rev-parse", "--abbrev-ref", "HEAD"],
                            capture_output=True, text=True, timeout=20, env=dict(os.environ, GIT_OPTIONAL_LOCKS="0"))
    except (OSError, subprocess.TimeoutExpired):
        return None
    return cp.stdout.strip() if cp.returncode == 0 else None


def orientation_valid(session_id: str | None) -> tuple[bool, str]:
    cmd = [sys.executable, "-B", str(SEAM), "check", "--quiet"]
    if session_id:
        cmd += ["--session-id", str(session_id)]
    cp = subprocess.run(cmd, capture_output=True, text=True, cwd=str(PROJECT), timeout=180)
    return cp.returncode == 0, (cp.stderr or cp.stdout)


def require_orientation(session_id: str | None, route: str, what: str):
    ok, out = orientation_valid(session_id)
    if not ok:
        raise Deny("GUARD-2", f"{what} refused: Doctrine orientation is not valid for this session.", route,
                   out + "\nRe-orient: python3 scripts/doctrine-orient.py orient   (inspection and diagnosis remain allowed)")


# ---------------------------------------------------------------------------------------
# path policy

ALWAYS_WRITABLE = ("doctrine/", "scripts/doctrine-", ".claude/", ".githooks/", ".github/workflows/doctrine", "CLAUDE.md")
APPLICATION_ROOTS = ("src/", "app/", "pages/", "components/", "lib/", "api/", "server/", "supabase/", "migrations/", "prisma/", "db/", "tests/", "e2e/", "public/")
APPLICATION_MANIFESTS = ("package.json", "package-lock.json", "pnpm-lock.yaml", "yarn.lock", "tsconfig.json", "next.config.js", "next.config.mjs", "next.config.ts", "vercel.json", "Dockerfile", "docker-compose.yml", "requirements.txt", "pyproject.toml", "vite.config.ts", "drizzle.config.ts")


def repo_relative(path_str: str) -> str | None:
    try:
        p = Path(os.path.expanduser(path_str)).resolve()
    except (OSError, ValueError):
        return None
    if not inside(p, PROJECT):
        return None
    return p.relative_to(PROJECT).as_posix()


def is_application_source(rel: str) -> bool:
    return rel.startswith(APPLICATION_ROOTS) or rel in APPLICATION_MANIFESTS


def stage_blocks_application_source() -> tuple[bool, str]:
    try:
        stage = json.loads(STATE.read_text(encoding="utf-8"))["active_stage"]
    except Exception:
        return False, ""
    blocked = [b for b in stage.get("blocked_until_acceptance", []) if isinstance(b, str)]
    if any("application source" in b or "schema" in b or "deployment" in b for b in blocked):
        return True, f"{stage.get('code')} — {stage.get('next_acceptance_condition', '')}"
    return False, ""


# ---------------------------------------------------------------------------------------
# per-class decisions

def decide_shell(payload: dict) -> Verdict:
    command = str((payload.get("tool_input") or {}).get("command") or "")
    if not command.strip():
        return Allow("empty-command")
    act_dir = act_directory(command, str(payload.get("cwd") or ""))
    droot = doctrine_root()
    names_doctrine = str(droot) in command or "builders-doctrine" in command
    if (inside(act_dir, droot) or names_doctrine) and MUTATING_SHELL.search(command):
        raise Deny("GUARD-1", "this command would write to the read-only builders-doctrine checkout. Doctrine is central; only a Governor-directed change made in its own repository may alter it.", "shell")
    subs = {git_subcommand(seg) for seg in segments(command)}
    if "push" in subs and re.search(r"builders-doctrine", command):
        raise Deny("GUARD-1", "this push targets the central Doctrine repository.", "shell")
    consequential = bool(CONSEQUENTIAL_OTHER.search(command)) or bool(subs & CONSEQUENTIAL_GIT)
    if not consequential:
        return Allow("shell-not-consequential")
    if {"commit", "push"} & subs and os.environ.get("DOCTRINE_ALLOW_MAIN") != "1":
        branch = current_branch(act_dir)
        if branch in DEFAULT_BRANCHES:
            raise Deny("GUARD-3", f"direct {'commit' if 'commit' in subs else 'push'} on the default branch '{branch}'. Work on a branch and merge through review.", "shell",
                       "  DOCTRINE_ALLOW_MAIN=1 exists only for an explicit Governor instruction.")
    require_orientation(payload.get("session_id"), "shell", "consequential shell act")
    return Allow("shell-consequential-oriented")


def decide_local_write(payload: dict) -> Verdict:
    ti = payload.get("tool_input") or {}
    raw = ti.get("file_path") or ti.get("notebook_path") or ti.get("path")
    if not raw:
        raise Deny("GUARD-0", "a local-write tool was called without a file path this guard can read, so the target cannot be established.", "file")
    target = Path(os.path.expanduser(str(raw)))
    resolved = target.resolve() if target.is_absolute() else (PROJECT / target).resolve()
    if inside(resolved, doctrine_root()):
        raise Deny("GUARD-1", f"this would write {resolved} inside the read-only builders-doctrine checkout.", "file")
    rel = repo_relative(str(resolved))
    if rel is None:
        require_orientation(payload.get("session_id"), "file", f"writing outside the product repository ({resolved})")
        return Allow("write-outside-repo-oriented")
    if rel.startswith(ALWAYS_WRITABLE):
        return Allow("write-governance-path")
    require_orientation(payload.get("session_id"), "file", f"writing {rel}")
    if is_application_source(rel):
        blocked, why = stage_blocks_application_source()
        if blocked and os.environ.get("DOCTRINE_STAGE_OVERRIDE") != "1":
            raise Deny("GUARD-4", f"creating application source ({rel}) while the active stage blocks it.", "file",
                       f"  active stage: {why}\n  DOCTRINE_STAGE_OVERRIDE=1 exists only for an explicit Governor instruction that advances the stage.")
    return Allow("write-product-path-oriented")


GITHUB_REPO_KEYS = ("repo", "repository", "repoName")


def decide_remote_repo_write(payload: dict, tool: str) -> Verdict:
    ti = payload.get("tool_input") or {}
    repo = next((str(ti[k]) for k in GITHUB_REPO_KEYS if ti.get(k)), "")
    owner = str(ti.get("owner") or "")
    if "builders-doctrine" in f"{owner}/{repo}".lower() or "builders-doctrine" in json.dumps(ti).lower():
        raise Deny("GUARD-1", f"{tool} targets the central Doctrine repository through the GitHub API. The API route bypasses the local git hooks entirely; it is denied here.", "github-api")
    branch = str(ti.get("branch") or ti.get("base") or "")
    if branch in DEFAULT_BRANCHES and os.environ.get("DOCTRINE_ALLOW_MAIN") != "1":
        raise Deny("GUARD-3", f"{tool} writes directly to the default branch '{branch}' through the GitHub API, with no local review and no git hook in the path.", "github-api")
    if tool.endswith("merge_pull_request") and os.environ.get("DOCTRINE_ALLOW_MAIN") != "1":
        raise Deny("GUARD-3", "merging a pull request is the governor's act, not this session's.", "github-api")
    require_orientation(payload.get("session_id"), "github-api", f"{tool}")
    return Allow("github-api-oriented")


def decide_generic_consequential(payload: dict, tool: str, cls: str) -> Verdict:
    if "builders-doctrine" in json.dumps(payload.get("tool_input") or {}).lower() and cls in ("EXTERNAL_WRITE", "PUBLICATION"):
        raise Deny("GUARD-1", f"{tool} would carry central Doctrine content outward from a product session.", cls.lower())
    require_orientation(payload.get("session_id"), cls.lower(), f"{tool} ({cls.lower().replace('_', ' ')})")
    return Allow(f"{cls.lower()}-oriented")


DECIDERS = {
    "SHELL": lambda p, t, c: decide_shell(p),
    "LOCAL_WRITE": lambda p, t, c: decide_local_write(p),
    "REMOTE_REPO_WRITE": lambda p, t, c: decide_remote_repo_write(p, t),
}


def decide(payload: dict) -> Verdict:
    tool = payload.get("tool_name")
    if not isinstance(tool, str) or not tool:
        raise Deny("GUARD-0", "the hook payload carries no tool name, so this guard cannot establish what act it is being asked about.", "payload")
    surface = load_surface()
    cls = classify(tool, surface)
    if cls in ("READ_ONLY", "SESSION_LOCAL"):
        return Allow(f"{cls.lower()}-tool")
    decider = DECIDERS.get(cls)
    if decider:
        return decider(payload, tool, cls)
    return decide_generic_consequential(payload, tool, cls)


# ---------------------------------------------------------------------------------------
# modes

def read_payload() -> dict:
    raw = sys.stdin.read() if not sys.stdin.isatty() else ""
    if not raw.strip():
        raise Deny("GUARD-0", "the hook received no payload on stdin, so it cannot establish what act it is being asked about.", "payload")
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise Deny("GUARD-0", f"the hook payload is not valid JSON ({exc}), so it cannot establish what act it is being asked about.", "payload")
    if not isinstance(payload, dict):
        raise Deny("GUARD-0", "the hook payload is not an object.", "payload")
    return payload


def pre_tool_use() -> int:
    try:
        verdict = decide(read_payload())
    except Deny as d:
        return emit_deny(d)
    except Allow as a:
        return emit_allow(a)
    except Exception as exc:
        return emit_deny(Deny("GUARD-0", f"this guard malfunctioned ({exc.__class__.__name__}: {exc}) and cannot establish that the act is permitted.",
                              "guard-internal",
                              "  An indeterminate verdict is a denial for consequential acts (Governor instruction 2026-09-04).\n"
                              "  Read-only tools are not matched by this hook, so inspection and diagnosis are unaffected;\n"
                              "  governance paths stay writable, so the guard itself can be repaired."))
    return emit_allow(verdict) if isinstance(verdict, Allow) else emit_deny(verdict)


def explain() -> int:
    try:
        verdict = decide(read_payload())
    except Deny as d:
        emit_deny(d)
        return 0
    except Exception as exc:
        print(f"DOCTRINE GUARD: DENIED [GUARD-0, route guard-internal] — {exc.__class__.__name__}: {exc}", file=sys.stderr)
        return 0
    print(f"DOCTRINE GUARD: ALLOWED [{verdict.reason}]", file=sys.stderr)
    return 0


def session_start(payload: dict) -> int:
    subprocess.run(["git", "-C", str(PROJECT), "config", "core.hooksPath", ".githooks"], capture_output=True, text=True, timeout=20)
    cmd = [sys.executable, "-B", str(SEAM), "orient"]
    if payload.get("session_id"):
        cmd += ["--session-id", str(payload["session_id"])]
    cp = subprocess.run(cmd, capture_output=True, text=True, cwd=str(PROJECT), timeout=180)
    sys.stdout.write(cp.stdout)
    if cp.returncode != 0:
        print("DOCTRINE ORIENTATION: INVALID — consequential acts are blocked until this is resolved; inspection and diagnosis remain allowed.")
        print(cp.stderr.rstrip())
    else:
        print("DOCTRINE ORIENTATION: VALID for this session. Governing truth: doctrine/PRODUCT_STATE.json (active_stage, next_acceptance_condition). Never write to builders-doctrine.")
    print(f"DOCTRINE GUARD: pre-act enforcement live for this session at {PROJECT}/scripts/doctrine-hook.py")
    return 0


def main() -> int:
    mode = sys.argv[1] if len(sys.argv) > 1 else ""
    if mode == "pre-tool-use":
        return pre_tool_use()
    if mode == "explain":
        return explain()
    if mode == "session-start":
        try:
            raw = sys.stdin.read() if not sys.stdin.isatty() else ""
            payload = json.loads(raw) if raw.strip() else {}
        except Exception:
            payload = {}
        # SessionStart cannot deny anything, so a malfunction here is reported, never fatal.
        try:
            return session_start(payload if isinstance(payload, dict) else {})
        except Exception as exc:
            print(f"DOCTRINE ORIENTATION: could not run ({exc.__class__.__name__}: {exc}). Run `python3 scripts/doctrine-orient.py orient` by hand before any consequential act.")
            return 0
    print(f"doctrine-hook: unknown mode {mode!r}", file=sys.stderr)
    return 2 if mode == "" else 1


if __name__ == "__main__":
    raise SystemExit(main())
