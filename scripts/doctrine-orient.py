#!/usr/bin/env python3
"""
The Gallery — product-local Doctrine seam.

Wraps the central Builders' Doctrine bootstrap (`operating/doctrine_bootstrap.py` in the
bound `builders-doctrine` checkout) and closes the hole the central README names: the
caller must fingerprint the bootstrap against the binding BEFORE executing it, and must
verify that the checkout actually sits on the bound commit with every bound artifact
unmodified. A git-HEAD pin cannot see a working-tree edit; this seam can.

Commands
  orient   verify the checkout, run the central `orient`, print the derived assessment.
  check    re-verify and run the central `check` for the current session (consequence gate).
  assess   print the standing assessment derived from doctrine/PRODUCT_STATE.json.
  status   print what the seam can see, without failing (diagnosis only).

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
    root, binding, bootstrap, checkout, version, modules = preflight(args)
    session_id = session_for_orient(args)
    args.runtime_dir.mkdir(parents=True, exist_ok=True)
    rc = run_bootstrap(bootstrap, "orient", root, args, session_id)
    if rc != 0:
        return rc
    (args.runtime_dir / SESSION_FILE_NAME).write_text(session_id + "\n", encoding="utf-8")
    seam = {
        "status": "VALID", "session_id": session_id, "generated_at": datetime.now(timezone.utc).isoformat(),
        "doctrine_root": str(root), "doctrine_commit": checkout["head"], "doctrine_branch": checkout["branch"],
        "doctrine_remote": checkout["remote"], "doctrine_version": version, "module_files_verified": modules,
        "bootstrap_sha256": sha256(bootstrap), "note": "Seam evidence only; the central receipt and governing files remain authority.",
    }
    (args.runtime_dir / SEAM_RECEIPT_NAME).write_text(json.dumps(seam, indent=2) + "\n", encoding="utf-8")
    if not args.quiet:
        state = load_json(args.state, "product state")
        print_assessment(derive_assessment(state, read_ux(args.ux_manifest)), {
            "doctrine": f"{checkout['head'][:12]} on {checkout['branch']} · version {version['version'] if version else 'unpinned'} ({version['status'] if version else '-'})",
            "module files verified": modules, "session": session_id,
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
