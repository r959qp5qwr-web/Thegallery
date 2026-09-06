#!/usr/bin/env python3
"""
The Gallery — repository gates.

The layer below the harness hook and above CI. It runs from .githooks/pre-commit and
pre-push (fail-closed) and from the CI workflow once the governor enables it, and it holds
the things a check can actually decide inside this repository:

  G1  the binding documents are held by a gate over themselves (candidate C-0006 class):
      every FIXED decision that claims enforcement must name a locus that exists and is
      executed, a weakening word anywhere in the clause disarms it, and the armed count is a
      TWO-SIDED ratchet so honesty-by-surrender fails as loudly as a silent regression.
  G2  the hook wiring covers the declared mutation surface, references scripts that exist,
      and does not discard its output.
  G3  the git hooks are present, executable, fail CLOSED on every failure path, AND this
      checkout's effective core.hooksPath actually resolves to them — a fail-closed hook that
      git never runs enforces nothing (OBL-GAL-013).
  G4  product state is structurally honest: legal enforcement vocabulary, and every UNARMED
      or NOT SEEN obligation carries an activation condition and a future acceptance test.
  G5  the rendered product copy carries no banned platform claim and no real-person contact.

Every gate is anchored: if its subject cannot be found the gate goes RED rather than passing
vacuously (Canon: every gate declares an anchor and dies red without it).
"""
from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
STATE = REPO / "doctrine" / "PRODUCT_STATE.json"
SURFACE = REPO / "doctrine" / "MUTATION_SURFACE.json"
SETTINGS = REPO / ".claude" / "settings.json"
RATCHETS = REPO / "doctrine" / "RATCHETS.json"

# Disarming vocabulary. Narrowed 2026-09-04 after this gate's first run disarmed two clauses
# for the words "when" and "once", which described a mechanism rather than weakening it — the
# same over-anchoring mistake in the other direction as AHOY-I-003. What must disarm is a
# clause that names a real locus and then admits its substance is not built.
WEAKENING = re.compile(
    r"\b(MANUAL|UNARMED|ADVISORY|TODO|PLANNED|NOT YET|NOT_YET|WILL BE|WOULD BE|IS NOT BUILT"
    r"|DOES NOT EXIST|DO NOT EXIST|NOTHING (?:RUNS|EXECUTES|CHECKS|EVALUATES))\b", re.I)
ARMED_STATES = {"ARMED", "ARMED_AS_CONFIGURED"}
LEGAL_STATES = {"ARMED", "ARMED_AS_CONFIGURED", "MANUAL", "UNARMED", "NOT_APPLICABLE"}
PATH_TOKEN = re.compile(r"(?:^|[\s`(])((?:scripts|doctrine|\.githooks|\.claude|\.github|ux|product)/[\w./\-]+|CLAUDE\.md)")
# The layers are NOT interchangeable, and G1 refuses to let one stand in for another.
# COMPULSORY: git itself runs it on the commit/push path, in every session and for a human
#   with a terminal. A clause citing one of these may claim ARMED.
# AS_CONFIGURED: the harness runs it only if the host loaded this project's hook
#   configuration, which cannot be proven from inside the repository. A clause citing one of
#   these may claim ARMED_AS_CONFIGURED and no more.
# Anything else (the drill, a CI workflow that is not enabled) executes on no compulsory
#   path today and arms nothing.
COMPULSORY_LOCI = ("scripts/doctrine-orient.py", "scripts/doctrine-gate.py", ".githooks/pre-commit", ".githooks/pre-push")
AS_CONFIGURED_LOCI = ("scripts/doctrine-hook.py", ".claude/settings.json")

results: list[tuple[str, str, str]] = []


def record(gate: str, ok: bool, detail: str):
    results.append((gate, "PASS" if ok else "FAIL", detail))


def anchor(path: Path, gate: str) -> dict | str | None:
    if not path.exists():
        record(gate, False, f"ANCHOR MISSING: {path.relative_to(REPO)} — the gate cannot see its subject and dies red rather than passing")
        return None
    return path.read_text(encoding="utf-8")


# ---------------------------------------------------------------------------------------

def g1_binding_documents() -> int:
    raw = anchor(STATE, "G1")
    if raw is None:
        return 1
    state = json.loads(raw)
    decisions = state.get("fixed_product_decisions", [])
    if not decisions:
        record("G1", False, "no FIXED decisions found — a binding document with no obligations is not a binding document")
        return 1
    armed, disarmed, broken = [], [], []
    for d in decisions:
        did, locus, st = d.get("id", "?"), str(d.get("enforcement_locus", "")), str(d.get("enforcement_state", ""))
        if st not in LEGAL_STATES:
            broken.append(f"{did}: illegal enforcement_state {st!r}")
            continue
        if not locus.strip():
            broken.append(f"{did}: claims a state but names no locus")
            continue
        if st not in ARMED_STATES or WEAKENING.search(locus):
            disarmed.append(did)
            continue
        cited = [m.group(1) for m in PATH_TOKEN.finditer(locus)]
        real = [c for c in cited if (REPO / c).exists()]
        if not real:
            broken.append(f"{did}: claims {st} but names no locus that exists in the tree ({cited or 'no path cited'})")
            continue
        compulsory = [c for c in real if c.startswith(COMPULSORY_LOCI)]
        configured = [c for c in real if c.startswith(AS_CONFIGURED_LOCI)]
        if not compulsory and not configured:
            broken.append(f"{did}: cites {real}, which no compulsory or configured path executes — existence is not execution (L-A17)")
            continue
        if st == "ARMED" and not compulsory:
            broken.append(f"{did}: claims ARMED while citing only {configured}, which runs only if the host loaded this project's hook configuration. That claim is ARMED_AS_CONFIGURED at most.")
            continue
        armed.append(f"{did}:{st}")
    ratchets = json.loads(RATCHETS.read_text(encoding="utf-8")) if RATCHETS.exists() else {}
    floor = ratchets.get("armed_fixed_decisions", {}).get("value")
    ok = not broken
    for b in broken:
        record("G1", False, b)
    if floor is None:
        record("G1", False, "doctrine/RATCHETS.json declares no armed_fixed_decisions baseline; the count cannot move visibly")
        ok = False
    elif len(armed) != floor:
        direction = "rose" if len(armed) > floor else "fell"
        record("G1", False, f"armed FIXED decisions {direction} from the recorded {floor} to {len(armed)} ({', '.join(armed)}). A two-sided ratchet: update doctrine/RATCHETS.json in the same change, so every payoff and every regression is a visible diff line (C-0005).")
        ok = False
    if ok:
        record("G1", True, f"{len(armed)} armed ({', '.join(armed)}), {len(disarmed)} honestly disarmed, 0 laundering; count equals the recorded ratchet")
    return 0 if ok else 1


def g2_hook_wiring() -> int:
    sraw, mraw = anchor(SETTINGS, "G2"), anchor(SURFACE, "G2")
    if sraw is None or mraw is None:
        return 1
    settings, surface = json.loads(sraw), json.loads(mraw)
    problems = []
    hooks = settings.get("hooks", {})
    pre = hooks.get("PreToolUse", [])
    if not pre:
        problems.append("no PreToolUse hook is registered")
    matcher = pre[0].get("matcher", "") if pre else ""
    expected = set()
    for cls in surface["hook_matcher_classes"]:
        expected |= set(surface["tools"].get(cls, []))
    missing = []
    for tool in sorted(expected):
        if tool.startswith("mcp__"):
            ns = "mcp__" + tool.split("__")[1] + "__"
            if ns not in matcher:
                missing.append(tool)
        elif not re.search(rf"(^|\|){re.escape(tool)}(\||$)", matcher):
            missing.append(tool)
    if missing:
        problems.append(f"the PreToolUse matcher does not cover {len(missing)} tool(s) declared mutation-capable in doctrine/MUTATION_SURFACE.json: {missing[:8]}{'…' if len(missing) > 8 else ''}")
    for event in ("SessionStart", "PreToolUse"):
        for entry in hooks.get(event, []):
            for h in entry.get("hooks", []):
                cmd = h.get("command", "")
                if "scripts/doctrine-hook.py" not in cmd:
                    problems.append(f"{event} hook does not invoke scripts/doctrine-hook.py")
                if ">/dev/null" in cmd or "2>&1" in cmd or "|| true" in cmd:
                    problems.append(f"{event} hook discards its own output or exit status: {cmd!r}")
    for script in ("scripts/doctrine-hook.py", "scripts/doctrine-orient.py"):
        if not (REPO / script).exists():
            problems.append(f"{script} is referenced by the wiring and does not exist")
    read_only = set(surface["tools"].get("READ_ONLY", [])) | set(surface["tools"].get("SESSION_LOCAL", []))
    leaked = [t for t in ("Read", "Grep", "Glob") if t in read_only and re.search(rf"(^|\|){t}(\||$)", matcher)]
    if leaked:
        problems.append(f"read-only tools {leaked} are matched by the guard; a malfunctioning guard would then block inspection")
    for p in problems:
        record("G2", False, p)
    if not problems:
        record("G2", True, f"matcher covers all {len(expected)} mutation-capable tools; read-only tools excluded; commands reference existing scripts and discard nothing")
    return 0 if not problems else 1


def git_config_hooks_path() -> tuple[str, str]:
    """This checkout's effective hook path, decided independently of the seam.

    G3 must not ask scripts/doctrine-orient.py whether scripts/doctrine-orient.py did its job,
    so this reads git directly. Returns (status, detail); every status but ARMED is red.
    """
    governed = (REPO / ".githooks").resolve()

    def git(*args) -> tuple[int, str]:
        cp = subprocess.run(["git", "-C", str(REPO), *args], capture_output=True, text=True,
                            env=dict(os.environ, GIT_OPTIONAL_LOCKS="0"))
        return cp.returncode, cp.stdout.strip()

    rc, top = git("rev-parse", "--show-toplevel")
    if rc != 0 or not top:
        return "NOT_A_GIT_WORKTREE", (f"{REPO} is not inside a git worktree, so .githooks runs on no commit path "
                                      "and the compulsory layer does not exist in this checkout")
    if Path(top).resolve() != REPO.resolve():
        return "DISPLACED_WORKTREE", (f"the governed hooks live in {REPO} but the git worktree root is {top}; "
                                      "they would belong to another repository's commit path")
    rc, configured = git("config", "--get", "core.hooksPath")
    if rc != 0 or not configured:
        return "UNARMED", ("core.hooksPath is not configured in this checkout, so .githooks/pre-commit and "
                           "pre-push never run — repair: python3 scripts/doctrine-orient.py orient")
    candidate = Path(configured).expanduser()
    effective = (candidate if candidate.is_absolute() else (REPO / candidate)).resolve()
    if effective != governed:
        return "DISPLACED_HOOKS_PATH", (f"core.hooksPath is '{configured}', which resolves to {effective} and not to "
                                        f"the governed {governed} — the hooks git would run are not these hooks")
    absent = [n for n in ("pre-commit", "pre-push") if not os.access(effective / n, os.X_OK)]
    if absent:
        return "INCOMPLETE", f"core.hooksPath resolves to {effective}, which carries no executable {', '.join(absent)}"
    return "ARMED", f"core.hooksPath resolves to {effective}"


def g3_git_hooks() -> int:
    problems = []
    for name in ("pre-commit", "pre-push"):
        p = REPO / ".githooks" / name
        text = anchor(p, "G3")
        if text is None:
            return 1
        if not os.access(p, os.X_OK):
            problems.append(f".githooks/{name} is not executable")
        if "doctrine-orient.py" not in text:
            problems.append(f".githooks/{name} does not invoke the seam")
        # the specific fail-open shape this gate exists to forbid: a missing interpreter or a
        # failed check must never reach `exit 0`.
        for m in re.finditer(r"if ! command -v python3[^\n]*\n(?:[^\n]*\n){0,4}?\s*exit 0", text):
            problems.append(f".githooks/{name} exits 0 when python3 is unavailable — that is a fail-open path")
        if re.search(r"check --quiet[^\n]*\n(?:[^\n]*\n){0,3}?\s*exit 0", text):
            problems.append(f".githooks/{name} exits 0 on a failed orientation check")
    status, detail = git_config_hooks_path()
    if status != "ARMED":
        problems.append(f"the governed hook path is not in force [{status}]: {detail}")
    for p in problems:
        record("G3", False, p)
    if not problems:
        record("G3", True, f"pre-commit and pre-push present, executable, invoke the seam and the gates, carry no "
                           f"fail-open path, and git runs them — {detail}")
    return 0 if not problems else 1


def g4_state_honesty() -> int:
    raw = anchor(STATE, "G4")
    if raw is None:
        return 1
    state = json.loads(raw)
    problems = []
    for o in state.get("unresolved_material_findings_or_obligations", []):
        st = str(o.get("state", ""))
        if st in ("UNARMED", "NOT_SEEN", "OPEN", "UNKNOWN", "STANDING"):
            if not str(o.get("activation_condition", "")).strip():
                problems.append(f"{o.get('id')} is {st} with no activation_condition — an obligation nobody can close is a promise, not a mechanism (L-A19)")
            if not str(o.get("future_acceptance_test", "")).strip():
                problems.append(f"{o.get('id')} is {st} with no future_acceptance_test — name the artifact that will discharge it")
    stage = state.get("active_stage", {})
    if not str(stage.get("next_acceptance_condition", "")).strip():
        problems.append("active_stage carries no next_acceptance_condition")
    for p in problems:
        record("G4", False, p)
    if not problems:
        record("G4", True, f"{len(state.get('unresolved_material_findings_or_obligations', []))} obligations each carry an activation condition and a future acceptance test; the active stage names its acceptance condition")
    return 0 if not problems else 1


BANNED = re.compile(r"\b(verified|vetted|certified|guaranteed|authentic|trusted seller|safe to buy)\b", re.I)
EMAIL = re.compile(r"[\w.+-]+@([\w-]+(?:\.[\w-]+)+)")
# RFC 2606 / RFC 6761 reserved names. A fixture address must sit inside one of these.
RESERVED_DOMAIN = re.compile(r"(^|\.)(example|invalid|test|localhost)$|^example\.(com|net|org)$", re.I)
PHONE = re.compile(r"(?<![\d·])(?:\+91[\s-]?)?[6-9]\d{9}(?![\d·])")


def g5_copy_and_fixtures() -> int:
    surfaces = sorted((REPO / "ux" / "reference" / "interface" / "surfaces").glob("*.html"))
    if not surfaces:
        record("G5", False, "ANCHOR MISSING: no rendered copy surfaces under ux/reference/interface/surfaces/")
        return 1
    problems = []
    for f in surfaces:
        text = f.read_text(encoding="utf-8")
        body = re.sub(r"<!--.*?-->", "", text, flags=re.S)
        for m in BANNED.finditer(body):
            problems.append(f"{f.relative_to(REPO)}: banned platform claim {m.group(0)!r} in product copy (GAL-07, GAL-R10)")
        for m in EMAIL.finditer(body):
            if not RESERVED_DOMAIN.search(m.group(1)):
                problems.append(f"{f.relative_to(REPO)}: email {m.group(0)!r} is outside the reserved test domains (GAL-G4, GAL-R21)")
        for m in PHONE.finditer(body):
            problems.append(f"{f.relative_to(REPO)}: phone-shaped value {m.group(0)!r} in a committed surface (GAL-G4, GAL-R21)")
    for p in problems:
        record("G5", False, p)
    if not problems:
        record("G5", True, f"{len(surfaces)} rendered copy surfaces carry no banned platform claim and no real-person contact value")
    return 0 if not problems else 1


GATES = {"G1": g1_binding_documents, "G2": g2_hook_wiring, "G3": g3_git_hooks, "G4": g4_state_honesty, "G5": g5_copy_and_fixtures}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--quiet", action="store_true")
    ap.add_argument("--only", default=None)
    args = ap.parse_args()
    rc = 0
    for name, fn in GATES.items():
        if args.only and name != args.only:
            continue
        try:
            rc |= fn()
        except Exception as exc:
            record(name, False, f"gate raised {exc.__class__.__name__}: {exc} — a gate that cannot run reports RED, never PASS")
            rc = 1
    failed = [r for r in results if r[1] == "FAIL"]
    if not args.quiet or failed:
        for gate, verdict, detail in results:
            print(f"{verdict:4s} {gate}  {detail}")
        print(f"DOCTRINE GATES: {'PASS' if not failed else 'FAIL'} — {len(results) - len(failed)} of {len(results)} checks green")
    return rc


if __name__ == "__main__":
    raise SystemExit(main())
