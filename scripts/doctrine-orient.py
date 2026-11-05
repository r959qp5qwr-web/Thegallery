#!/usr/bin/env python3
"""
The Gallery — product-local Doctrine seam.

Wraps the central Builders' Doctrine bootstrap (`operating/doctrine_bootstrap.py` in the
bound `builders-doctrine` checkout) and closes the hole the central README names: the
caller must fingerprint the bootstrap against the binding BEFORE executing it, and must
verify that the checkout actually sits on the bound commit with every bound artifact
unmodified. A git-HEAD pin cannot see a working-tree edit; this seam can.

Commands
  orient   the whole orientation sequence, in this order and failing closed at any step:
             1. identify and validate the Gallery repository root (it must be the root of its
                own git worktree, so that what is armed below is this checkout and not a host);
             2. validate the live Doctrine binding — bootstrap fingerprint, bound commit,
                bound artifacts, version manifest, module manifests;
             3. configure the governed git-hook path (core.hooksPath -> .githooks) locally;
             4. verify the EFFECTIVE configuration, not the value just written;
             5. establish the orientation receipt for this session;
             6. run the repository gates.
  check    re-verify and run the central `check` for the current session (consequence gate).
  assess   print the standing assessment derived from doctrine/PRODUCT_STATE.json.
  status   print what the seam can see, without failing (diagnosis only).

STEPS 3 AND 4 EXIST BECAUSE OF OBL-GAL-013 (2026-09-06). Until then the only place that set
core.hooksPath was `session_start` in scripts/doctrine-hook.py — the harness hook. So the layer
described as compulsory was armed by the layer described as as-configured, and in a checkout
where the harness never loaded this project's configuration, .githooks ran on nothing: a
deliberate empty commit reached a branch with no refusal from any layer
(doctrine/receipts/HOOK_LIVENESS_ATTEMPT-2026-09-06.md §6). The seam arms it now, so the git
layer stands on its own and every route into this checkout — a session, a human terminal, a CI
job — arms it by running the one command it must run anyway.

The repair path is preserved deliberately: arming happens BEFORE the gates run, so `orient` in
a fresh clone establishes the configuration whose absence gate G3 refuses, rather than being
blocked by the very absence it exists to repair.

Fail-closed: any missing, stale, mismatched or contradictory input exits 2 with its cause.
Read-only towards the Doctrine checkout: git is invoked with optional locks disabled and
the bootstrap runs with bytecode writing disabled. No third-party dependencies.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import subprocess
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_BINDING = REPO_ROOT / "doctrine" / "DOCTRINE_BINDING.json"
DEFAULT_STATE = REPO_ROOT / "doctrine" / "PRODUCT_STATE.json"
DEFAULT_UX_MANIFEST = REPO_ROOT / "ux" / "UX_MANIFEST.yaml"
DEFAULT_RUNTIME = REPO_ROOT / ".doctrine" / "runtime"
BOOTSTRAP_REL = "operating/doctrine_bootstrap.py"
RECEIPT_NAME = "DOCTRINE_ORIENTATION_RECEIPT.json"
SEAM_RECEIPT_NAME = "SEAM_RECEIPT.json"
SESSION_FILE_NAME = "SESSION_ID"
GIT_ENV = dict(os.environ, GIT_OPTIONAL_LOCKS="0")
GOVERNED_HOOKS_DIRNAME = ".githooks"
GOVERNED_HOOKS = ("pre-commit", "pre-push")
GATE_SCRIPT = REPO_ROOT / "scripts" / "doctrine-gate.py"


def fail(msg: str, code: int = 2):
    print(f"DOCTRINE SEAM: FAIL — {msg}", file=sys.stderr)
    raise SystemExit(code)


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def load_json(path: Path, label: str):
    if not path.exists():
        fail(f"missing required file: {label} at {path}")
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        fail(f"invalid JSON in {label} ({path}): {e}")


def resolve_doctrine_root(explicit: str | None) -> Path:
    candidate = explicit or os.environ.get("DOCTRINE_ROOT") or str(REPO_ROOT.parent / "builders-doctrine")
    root = Path(candidate).expanduser().resolve()
    if not root.is_dir():
        fail(f"Doctrine root not found at {root}; pass --doctrine-root or set DOCTRINE_ROOT to the live builders-doctrine checkout")
    if not (root / BOOTSTRAP_REL).is_file():
        fail(f"Doctrine root {root} holds no {BOOTSTRAP_REL}; this is not a builders-doctrine checkout")
    return root


def git(root: Path, *args: str) -> subprocess.CompletedProcess:
    try:
        return subprocess.run(["git", "-C", str(root), *args], capture_output=True, text=True, timeout=60, env=GIT_ENV)
    except (OSError, subprocess.TimeoutExpired) as e:
        fail(f"cannot run git in the Doctrine checkout ({e}); the bound commit cannot be verified")


# --- verification steps, in the order they run -------------------------------------------

def verify_bootstrap(root: Path, binding: dict) -> Path:
    """Step 1. Fingerprint the orientation executable BEFORE anything executes it."""
    spec = binding.get("doctrine", {}).get("artifacts", {}).get("bootstrap")
    if not isinstance(spec, dict):
        fail("binding does not pin the bootstrap executable; refusing to run unpinned code")
    path = root / spec.get("path", "")
    if not path.is_file():
        fail(f"bootstrap executable missing at {path}")
    if sha256(path) != spec.get("sha256"):
        fail("bootstrap fingerprint mismatch — the orientation executable is not the one the Governor bound; it was NOT executed")
    return path


def bound_paths(binding: dict) -> list[str]:
    paths = []
    for spec in binding.get("doctrine", {}).get("artifacts", {}).values():
        rel = spec.get("path") if isinstance(spec, dict) else None
        if rel:
            paths.append(rel)
            if rel.endswith("MODULE_MANIFEST.yaml"):
                paths.append(str(Path(rel).parent))
    return paths


def verify_checkout(root: Path, binding: dict) -> dict:
    """Step 2. The checkout must sit on the bound commit with bound artifacts unmodified."""
    bound = binding.get("doctrine", {}).get("commit", "")
    if not re.fullmatch(r"[0-9a-f]{40}", bound or ""):
        fail("binding does not pin a full 40-character Doctrine commit")
    cp = git(root, "rev-parse", "HEAD")
    if cp.returncode != 0:
        fail("Doctrine root is not a git checkout; the bound commit cannot be verified (a copy or tarball is not authority)")
    head = cp.stdout.strip()
    if head != bound:
        fail(f"bound commit mismatch: binding pins {bound[:12]}, checkout HEAD is {head[:12]} — check out the bound commit, or re-pin in a governed change")
    cp = git(root, "status", "--porcelain", "--", *bound_paths(binding))
    if cp.returncode != 0:
        fail(f"git status failed in the Doctrine checkout: {cp.stderr.strip()}")
    if cp.stdout.strip():
        fail("bound Doctrine artifact modified in the working tree (a git-HEAD pin cannot see this; the seam can):\n" + cp.stdout.rstrip())
    branch = git(root, "rev-parse", "--abbrev-ref", "HEAD").stdout.strip()
    remote = git(root, "remote", "get-url", "origin").stdout.strip()
    return {"head": head, "branch": branch, "remote": remote}


def verify_version_manifest(root: Path, binding: dict):
    """Step 3. If VERSION.json is pinned, the Doctrine's own declaration must agree with the disk and the binding."""
    artifacts = binding.get("doctrine", {}).get("artifacts", {})
    spec = artifacts.get("version_manifest")
    if not isinstance(spec, dict):
        return None
    version = load_json(root / spec["path"], "Doctrine VERSION.json")
    declared = binding.get("doctrine", {}).get("version")
    if declared and version.get("version") != declared:
        fail(f"Doctrine version contradiction: binding says {declared}, VERSION.json says {version.get('version')}")
    for name, cspec in version.get("core_artifacts", {}).items():
        actual = sha256(root / cspec["path"])
        if actual != cspec.get("sha256"):
            fail(f"VERSION.json disagrees with the Doctrine on disk for {name}: the authority is internally contradictory")
        bspec = artifacts.get(name)
        if isinstance(bspec, dict) and bspec.get("sha256") != cspec.get("sha256"):
            fail(f"binding and VERSION.json disagree on {name}; re-pin in a governed change")
    return {"version": version.get("version"), "status": version.get("status")}


def verify_module_manifests(root: Path, binding: dict) -> dict:
    """Step 4. Expand every pinned module manifest and verify each file it lists (derived, never hand-listed)."""
    verified = {}
    for name, spec in binding.get("doctrine", {}).get("artifacts", {}).items():
        rel = spec.get("path", "") if isinstance(spec, dict) else ""
        if not rel.endswith("MODULE_MANIFEST.yaml"):
            continue
        mpath = root / rel
        if not mpath.is_file():
            fail(f"module manifest missing: {rel}")
        entries = re.findall(r"^\s*-\s*path:\s*(\S+)\s*\n\s*sha256:\s*([0-9a-f]{64})\s*\n\s*bytes:\s*(\d+)", mpath.read_text(encoding="utf-8"), re.M)
        if not entries:
            fail(f"module manifest {rel} lists no files; an empty manifest cannot be treated as verified")
        for frel, fsha, fbytes in entries:
            fpath = mpath.parent / frel
            if not fpath.is_file():
                fail(f"module file missing: {frel} (listed by {rel})")
            if fpath.stat().st_size != int(fbytes) or sha256(fpath) != fsha:
                fail(f"module file fingerprint mismatch: {frel} (listed by {rel})")
        verified[name] = len(entries)
    return verified


# --- the governed git-hook path (OBL-GAL-013) -------------------------------------------
#
# Two functions, deliberately separate. `inspect_git_hooks` never writes and is what `status`
# and step 4 of `orient` read; `arm_git_hooks` writes once and then calls the inspector, so
# what is verified is the EFFECTIVE configuration git would use, never the value this process
# just wrote. scripts/doctrine-gate.py G3 implements the same check independently: a gate that
# asked this module whether this module had done its job would be verifying nothing.


def git_worktree_root(path: Path) -> Path | None:
    """The root of the git worktree containing `path`, or None when there is no worktree."""
    cp = subprocess.run(["git", "-C", str(path), "rev-parse", "--show-toplevel"],
                        capture_output=True, text=True, env=GIT_ENV)
    if cp.returncode != 0 or not cp.stdout.strip():
        return None
    return Path(cp.stdout.strip()).resolve()


def resolve_hooks_path(repo_root: Path, configured: str) -> Path:
    """git resolves a relative core.hooksPath against the worktree root, so this does too."""
    candidate = Path(configured).expanduser()
    return (candidate if candidate.is_absolute() else (repo_root / candidate)).resolve()


def inspect_git_hooks(repo_root: Path) -> dict:
    """Report this checkout's effective hook path. Never writes, never raises."""
    governed = (repo_root / GOVERNED_HOOKS_DIRNAME).resolve()
    out = {"governed_path": str(governed), "worktree_root": None, "configured": None, "effective": None}
    top = git_worktree_root(repo_root)
    if top is None:
        return dict(out, status="NOT_A_GIT_WORKTREE",
                    detail=f"{repo_root} is not inside a git worktree, so no git hook can run from it")
    out["worktree_root"] = str(top)
    if top != repo_root.resolve():
        return dict(out, status="DISPLACED_WORKTREE",
                    detail=f"the Gallery root {repo_root} is not the root of its git worktree ({top}); "
                           "the governed hooks would belong to another repository's commit path")
    cp = subprocess.run(["git", "-C", str(repo_root), "config", "--get", "core.hooksPath"],
                        capture_output=True, text=True, env=GIT_ENV)
    configured = cp.stdout.strip() if cp.returncode == 0 else ""
    if not configured:
        return dict(out, status="UNARMED",
                    detail="core.hooksPath is not configured, so .githooks/pre-commit and pre-push run on nothing")
    out["configured"] = configured
    effective = resolve_hooks_path(repo_root, configured)
    out["effective"] = str(effective)
    if effective != governed:
        return dict(out, status="DISPLACED_HOOKS_PATH",
                    detail=f"core.hooksPath resolves to {effective}, not the governed {governed}")
    missing = [n for n in GOVERNED_HOOKS if not os.access(effective / n, os.X_OK)]
    if missing:
        return dict(out, status="INCOMPLETE",
                    detail=f"the configured hook path carries no executable {', '.join(missing)}")
    return dict(out, status="ARMED", detail=f"core.hooksPath resolves to {effective}")


def arm_git_hooks(repo_root: Path) -> dict:
    """Configure this checkout to run the repository's governed hooks, then verify it.

    Local repository configuration only — never --global, never another repository. Fails
    closed: an unverifiable hook path is not permission to continue orienting.
    """
    before = inspect_git_hooks(repo_root)
    if before["status"] in ("NOT_A_GIT_WORKTREE", "DISPLACED_WORKTREE"):
        fail(f"the governed git-hook path cannot be armed — {before['detail']}")
    cp = subprocess.run(["git", "-C", str(repo_root), "config", "core.hooksPath", GOVERNED_HOOKS_DIRNAME],
                        capture_output=True, text=True, env=GIT_ENV)
    if cp.returncode != 0:
        fail(f"git refused to set core.hooksPath in {repo_root}: {cp.stderr.strip() or cp.stdout.strip()}")
    after = inspect_git_hooks(repo_root)
    if after["status"] != "ARMED":
        fail(f"the governed git-hook path was written and did not take effect — {after['detail']}")
    after["was"] = before["status"]
    return after


def run_gates(quiet: bool) -> int:
    """Step 6. The gates run last, so that steps 3 and 4 can repair what G3 refuses."""
    if not GATE_SCRIPT.is_file():
        fail(f"the repository gates are missing at {GATE_SCRIPT}; an unverifiable repository is not permission")
    cmd = [sys.executable, "-B", str(GATE_SCRIPT)]
    if quiet:
        cmd.append("--quiet")
    cp = subprocess.run(cmd, capture_output=True, text=True, cwd=str(REPO_ROOT),
                        env=dict(GIT_ENV, PYTHONDONTWRITEBYTECODE="1"))
    sys.stdout.write(cp.stdout)
    sys.stderr.write(cp.stderr)
    return cp.returncode


def validated_repo_root() -> Path:
    """Step 1. The seam governs the checkout it lives in, and says which one that is."""
    if not (REPO_ROOT / "doctrine").is_dir() or not (REPO_ROOT / GOVERNED_HOOKS_DIRNAME).is_dir():
        fail(f"{REPO_ROOT} does not look like the Gallery repository root "
             f"(no doctrine/ or {GOVERNED_HOOKS_DIRNAME}/ beside scripts/)")
    return REPO_ROOT


def preflight(args):
    root = resolve_doctrine_root(args.doctrine_root)
    binding = load_json(args.binding, "Doctrine binding")
    bootstrap = verify_bootstrap(root, binding)
    checkout = verify_checkout(root, binding)
    version = verify_version_manifest(root, binding)
    modules = verify_module_manifests(root, binding)
    return root, binding, bootstrap, checkout, version, modules


def run_bootstrap(bootstrap: Path, command: str, root: Path, args, session_id: str) -> int:
    cmd = [sys.executable, "-B", str(bootstrap), command, "--binding", str(args.binding), "--state", str(args.state),
           "--doctrine-root", str(root), "--session-id", session_id, "--receipt", str(args.runtime_dir / RECEIPT_NAME)]
    cp = subprocess.run(cmd, capture_output=True, text=True, cwd=str(REPO_ROOT), env=dict(GIT_ENV, PYTHONDONTWRITEBYTECODE="1"))
    if not args.quiet:
        sys.stdout.write(cp.stdout)
    sys.stderr.write(cp.stderr)
    return cp.returncode


# --- session identity -------------------------------------------------------------------

def env_session_id() -> str | None:
    return os.environ.get("DOCTRINE_SESSION_ID") or os.environ.get("CLAUDE_CODE_SESSION_ID")


def session_for_orient(args) -> str:
    return args.session_id or env_session_id() or f"local-{uuid.uuid4()}"


def session_for_check(args) -> str:
    if args.session_id:
        return args.session_id
    sid = env_session_id()
    if sid:
        return sid
    f = args.runtime_dir / SESSION_FILE_NAME
    if not f.is_file():
        fail("no session id: this session has not oriented (run: python3 scripts/doctrine-orient.py orient)")
    return f.read_text(encoding="utf-8").strip()


# --- standing assessment (derived, never hand-written) ----------------------------------

def derive_assessment(state: dict, ux_text: str | None) -> dict:
    fixed = state.get("fixed_product_decisions", [])
    enforcement = {}
    for d in fixed:
        key = str(d.get("enforcement_state", "UNSTATED"))
        enforcement[key] = enforcement.get(key, 0) + 1
    promises = state.get("promise_table", [])
    proof = {}
    for p in promises:
        key = str(p.get("proof_state", "UNSTATED"))
        proof[key] = proof.get(key, 0) + 1
    journeys = []
    if ux_text:
        for m in re.finditer(r"^\s*-\s*id:\s*(\S+)\s*\n(?:\s+\S.*\n)*?\s+status:\s*(\S+)", ux_text, re.M):
            journeys.append({"id": m.group(1), "status": m.group(2)})
    stage = state.get("active_stage", {})
    return {
        "product": state.get("product_identity", {}).get("name"),
        "product_sentence": state.get("product_sentence"),
        "phase": state.get("current_product_phase", {}).get("code"),
        "active_stage": stage.get("code"),
        "next_acceptance_condition": stage.get("next_acceptance_condition"),
        "counts": {
            "fixed_decisions": len(fixed),
            "open_governor_decisions": len(state.get("open_governor_decisions", [])),
            "refusals": len(state.get("refusal_register", [])),
            "obligations": len(state.get("unresolved_material_findings_or_obligations", [])),
            "promises": len(promises),
        },
        "enforcement_state_of_fixed_decisions": enforcement,
        "promise_proof_states": proof,
        "release_verification_state": state.get("release_verification_status", {}).get("state", "UNKNOWN"),
        "journeys": journeys,
    }


def print_assessment(a: dict, extra: dict | None = None):
    c = a["counts"]
    print("DOCTRINE STANDING ASSESSMENT (derived from doctrine/PRODUCT_STATE.json)")
    print(f"  product: {a['product']} — phase {a['phase']}, active stage {a['active_stage']}")
    print(f"  next acceptance condition: {a['next_acceptance_condition']}")
    print(f"  fixed {c['fixed_decisions']} · open governor decisions {c['open_governor_decisions']} · refusals {c['refusals']} · obligations {c['obligations']} · promises {c['promises']}")
    print(f"  enforcement of fixed decisions: {a['enforcement_state_of_fixed_decisions']}")
    print(f"  promise proof states: {a['promise_proof_states']} · release verification: {a['release_verification_state']}")
    if a["journeys"]:
        print("  journeys: " + ", ".join(f"{j['id']}={j['status']}" for j in a["journeys"]))
    for k, v in (extra or {}).items():
        print(f"  {k}: {v}")


def read_ux(path: Path) -> str | None:
    return path.read_text(encoding="utf-8") if path.is_file() else None


# --- commands ---------------------------------------------------------------------------

def cmd_orient(args) -> int:
    repo = validated_repo_root()                                            # 1
    root, binding, bootstrap, checkout, version, modules = preflight(args)  # 2
    hooks = arm_git_hooks(repo)                                             # 3 and 4
    session_id = session_for_orient(args)
    args.runtime_dir.mkdir(parents=True, exist_ok=True)
    rc = run_bootstrap(bootstrap, "orient", root, args, session_id)         # 5
    if rc != 0:
        return rc
    (args.runtime_dir / SESSION_FILE_NAME).write_text(session_id + "\n", encoding="utf-8")
    seam = {
        "status": "VALID", "session_id": session_id, "generated_at": datetime.now(timezone.utc).isoformat(),
        "repo_root": str(repo), "git_hooks": hooks,
        "doctrine_root": str(root), "doctrine_commit": checkout["head"], "doctrine_branch": checkout["branch"],
        "doctrine_remote": checkout["remote"], "doctrine_version": version, "module_files_verified": modules,
        "bootstrap_sha256": sha256(bootstrap), "note": "Seam evidence only; the central receipt and governing files remain authority.",
    }
    (args.runtime_dir / SEAM_RECEIPT_NAME).write_text(json.dumps(seam, indent=2) + "\n", encoding="utf-8")
    if run_gates(args.quiet) != 0:                                          # 6
        fail("the repository gates are red, so this checkout is not oriented "
             "(run: python3 scripts/doctrine-gate.py for the failing check)")
    if not args.quiet:
        state = load_json(args.state, "product state")
        print_assessment(derive_assessment(state, read_ux(args.ux_manifest)), {
            "doctrine": f"{checkout['head'][:12]} on {checkout['branch']} · version {version['version'] if version else 'unpinned'} ({version['status'] if version else '-'})",
            "module files verified": modules, "session": session_id,
            "git hooks": f"{hooks['status']} — core.hooksPath -> {hooks['effective']} (was {hooks['was']})",
        })
    return 0


def cmd_check(args) -> int:
    root, binding, bootstrap, checkout, version, modules = preflight(args)
    session_id = session_for_check(args)
    if not (args.runtime_dir / RECEIPT_NAME).is_file():
        fail("no orientation receipt for this checkout; this session has not oriented (run: python3 scripts/doctrine-orient.py orient)")
    return run_bootstrap(bootstrap, "check", root, args, session_id)


def cmd_assess(args) -> int:
    state = load_json(args.state, "product state")
    a = derive_assessment(state, read_ux(args.ux_manifest))
    if args.json:
        print(json.dumps(a, indent=2))
    else:
        print_assessment(a)
    return 0


def cmd_status(args) -> int:
    print(f"repo root: {REPO_ROOT}")
    print(f"binding: {args.binding} ({'present' if args.binding.is_file() else 'MISSING'})")
    print(f"state: {args.state} ({'present' if args.state.is_file() else 'MISSING'})")
    receipt = args.runtime_dir / RECEIPT_NAME
    print(f"receipt: {receipt} ({'present' if receipt.is_file() else 'absent'})")
    h = inspect_git_hooks(REPO_ROOT)
    print(f"git hooks: {h['status']} — {h['detail']}")
    if h["status"] != "ARMED":
        print("  repair: python3 scripts/doctrine-orient.py orient")
    try:
        root = resolve_doctrine_root(args.doctrine_root)
        print(f"doctrine root: {root} HEAD={git(root, 'rev-parse', 'HEAD').stdout.strip()[:12]} branch={git(root, 'rev-parse', '--abbrev-ref', 'HEAD').stdout.strip()}")
    except SystemExit:
        print("doctrine root: unresolved (see failure above)")
    return 0


def parse_args():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="command", required=True)
    for name, fn in (("orient", cmd_orient), ("check", cmd_check), ("assess", cmd_assess), ("status", cmd_status)):
        sp = sub.add_parser(name)
        sp.set_defaults(fn=fn)
        sp.add_argument("--binding", type=Path, default=DEFAULT_BINDING)
        sp.add_argument("--state", type=Path, default=DEFAULT_STATE)
        sp.add_argument("--ux-manifest", type=Path, default=DEFAULT_UX_MANIFEST)
        sp.add_argument("--doctrine-root", default=None)
        sp.add_argument("--runtime-dir", type=Path, default=Path(os.environ.get("DOCTRINE_RUNTIME_DIR") or DEFAULT_RUNTIME))
        sp.add_argument("--session-id", default=None)
        sp.add_argument("--quiet", action="store_true")
        sp.add_argument("--json", action="store_true")
    return p.parse_args()


if __name__ == "__main__":
    a = parse_args()
    raise SystemExit(a.fn(a))
