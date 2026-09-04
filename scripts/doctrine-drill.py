#!/usr/bin/env python3
"""
The Gallery — drill for the Doctrine seam and guards.

Proves that every protection fails when the violation it guards is introduced (Canon:
"drill every gate"; Audit Protocol L-A8 amendment: three-valued verdicts). Runs against
scratch clones of the Doctrine checkout and scratch copies of the binding and state; it
never mutates the real Doctrine checkout or this repository's governing files.

Verdicts
  PASS        the protection fired, for the expected reason
  DECORATIVE  the protection stayed green under its own violation — the law is broken
  STALE       the mutation could not be applied, or the protection failed for another
              reason — the law was never asked
  RED         a baseline that must be green is red; mutations mean nothing on a red baseline

Outputs are preserved in stamped artifacts under .doctrine/runtime/drills/<stamp>/ that no
later run overwrites (C-0009). Exit 0 only when every case is PASS.
"""
from __future__ import annotations

import contextlib
import importlib.util
import io
import json
import os
import shutil
import subprocess
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
SEAM = REPO / "scripts" / "doctrine-orient.py"
HOOK = REPO / "scripts" / "doctrine-hook.py"
BINDING = REPO / "doctrine" / "DOCTRINE_BINDING.json"
STATE = REPO / "doctrine" / "PRODUCT_STATE.json"
STAMP = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
ARTIFACTS = REPO / ".doctrine" / "runtime" / "drills" / STAMP
CLEAN_ENV_KEYS = ("DOCTRINE_SESSION_ID", "CLAUDE_CODE_SESSION_ID", "DOCTRINE_RUNTIME_DIR", "DOCTRINE_ROOT", "CLAUDE_PROJECT_DIR", "DOCTRINE_ALLOW_MAIN")


def base_env(**extra) -> dict:
    env = {k: v for k, v in os.environ.items() if k not in CLEAN_ENV_KEYS}
    env.update({"GIT_OPTIONAL_LOCKS": "0", "PYTHONDONTWRITEBYTECODE": "1", "CLAUDE_PROJECT_DIR": str(REPO)})
    env.update(extra)
    return env


def run(cmd, env=None, cwd=None, stdin=None):
    cp = subprocess.run(cmd, capture_output=True, text=True, env=env or base_env(), cwd=cwd or str(REPO), input=stdin, timeout=300)
    return cp.returncode, (cp.stdout + cp.stderr)


def seam(args, root, runtime, session=None, binding=BINDING, state=STATE, extra_env=None):
    env = base_env(DOCTRINE_ROOT=str(root), DOCTRINE_RUNTIME_DIR=str(runtime), **(extra_env or {}))
    cmd = [sys.executable, "-B", str(SEAM), *args, "--binding", str(binding), "--state", str(state)]
    if session:
        cmd += ["--session-id", session]
    return run(cmd, env=env)


def central(args, root, runtime, session, binding=BINDING, state=STATE):
    cmd = [sys.executable, "-B", str(root / "operating" / "doctrine_bootstrap.py"), *args, "--binding", str(binding), "--state", str(state),
           "--doctrine-root", str(root), "--session-id", session, "--receipt", str(runtime / "DOCTRINE_ORIENTATION_RECEIPT.json")]
    return run(cmd)


def hook(payload, root, runtime, extra_env=None):
    env = base_env(DOCTRINE_ROOT=str(root), DOCTRINE_RUNTIME_DIR=str(runtime), **(extra_env or {}))
    stdin = payload if isinstance(payload, str) else json.dumps(payload)
    return run([sys.executable, "-B", str(HOOK), "pre-tool-use"], env=env, stdin=stdin)


def bash_payload(command, cwd=None, session="drill-session"):
    return {"session_id": session, "tool_name": "Bash", "tool_input": {"command": command}, "cwd": str(cwd or REPO), "hook_event_name": "PreToolUse"}


def clone(root: Path, dest: Path, rev: str | None = None) -> Path:
    rc, out = run(["git", "clone", "--quiet", "--no-hardlinks", str(root), str(dest)])
    if rc != 0:
        raise RuntimeError("clone failed: " + out)
    if rev:
        rc, out = run(["git", "-C", str(dest), "checkout", "--quiet", rev])
        if rc != 0:
            raise RuntimeError("checkout failed: " + out)
    return dest


def tamper(path: Path):
    if not path.is_file():
        raise FileNotFoundError(f"mutation target missing: {path}")
    path.write_bytes(path.read_bytes() + b"\n# tampered by doctrine-drill\n")


def scratch_json(src: Path, dest: Path, mutate) -> Path:
    data = json.loads(src.read_text(encoding="utf-8"))
    mutate(data)
    dest.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
    return dest


def verdict(rc: int, out: str, expect_fail: bool, phrase: str | None = None) -> str:
    if not expect_fail:
        return "PASS" if rc == 0 else "RED"
    if rc == 0:
        return "DECORATIVE"
    if phrase and phrase not in out:
        return "STALE"
    return "PASS"


def load_seam():
    spec = importlib.util.spec_from_file_location("seam", SEAM)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def capture_exit(fn):
    """Run an in-process seam check; its fail() text goes to the artifact, not the console."""
    buf = io.StringIO()
    try:
        with contextlib.redirect_stderr(buf):
            fn()
        return 0, buf.getvalue()
    except SystemExit as e:
        return int(e.code or 0), buf.getvalue()


# --- cases --------------------------------------------------------------------------------

def build_cases(root: Path, tmp: Path):
    binding = json.loads(BINDING.read_text(encoding="utf-8"))
    canon_rel = binding["doctrine"]["artifacts"]["canon"]["path"]
    register_rel = binding["doctrine"]["artifacts"]["candidate_register"]["path"]
    module_rel = next((s["path"] for s in binding["doctrine"]["artifacts"].values() if s["path"].endswith("MODULE_MANIFEST.yaml")), None)
    rt = lambda name: (tmp / "rt" / name)
    cases = []

    def case(cid, title, law, fn, expect_fail=True, phrase=None):
        cases.append((cid, title, law, fn, expect_fail, phrase))

    case("D-01", "baseline: seam orient against the real checkout is green", "L-A8 — mutations run against a proven-green baseline",
         lambda: seam(["orient", "--quiet"], root, rt("base"), "drill-base"), expect_fail=False)
    case("D-02", "baseline: seam check for the same session is green", "Playbook §3 consequence gate",
         lambda: seam(["check", "--quiet"], root, rt("base"), "drill-base"), expect_fail=False)

    def d03():
        c = clone(root, tmp / "c03"); tamper(c / canon_rel)
        return central(["orient"], c, rt("c03"), "drill")
    case("D-03", "Canon byte-tampered in a clone → central bootstrap refuses", "README fail-closed: bound artifact hash mismatch", d03, phrase="canon fingerprint mismatch")

    def d04():
        c = clone(root, tmp / "c04"); tamper(c / canon_rel)
        return seam(["orient", "--quiet"], c, rt("c04"), "drill")
    case("D-04", "Canon tampered in a clone → seam sees the dirty working tree before the bootstrap runs", "README: a git-HEAD pin cannot see a working-tree edit", d04, phrase="modified in the working tree")

    def d05():
        c = clone(root, tmp / "c05"); (c / canon_rel).unlink()
        return central(["orient"], c, rt("c05"), "drill")
    case("D-05", "Canon removed (subject removal) → central bootstrap refuses", "L-A8 — every gate carries a subject-removal mutation", d05, phrase="missing required file")

    def d06():
        c = clone(root, tmp / "c06"); tamper(c / register_rel)
        return central(["orient"], c, rt("c06"), "drill")
    case("D-06", "Candidate Register tampered → central bootstrap refuses (trial defect B6 class)", "VERSION.json prior_propagation B6", d06, phrase="candidate_register fingerprint mismatch")

    marker = tmp / "bootstrap-executed.marker"

    def d07():
        c = clone(root, tmp / "c07"); bp = c / "operating" / "doctrine_bootstrap.py"
        text = bp.read_text(encoding="utf-8")
        needle = "from __future__ import annotations\n"
        if needle not in text:
            raise FileNotFoundError("bootstrap no longer carries the expected header; mutation did not apply")
        bp.write_text(text.replace(needle, needle + f'import pathlib as _p; _p.Path(r"{marker}").write_text("executed")\n', 1), encoding="utf-8")
        rc, out = seam(["orient", "--quiet"], c, rt("c07"), "drill")
        if marker.exists():
            return 0, out + "\nMARKER PRESENT: the tampered bootstrap was executed"
        return rc, out
    case("D-07", "bootstrap tampered → seam refuses BEFORE executing it (marker never written)", "README: fingerprint the bootstrap before running it", d07, phrase="bootstrap fingerprint mismatch")

    def d08():
        c = clone(root, tmp / "c08", rev="HEAD~1")
        return seam(["orient", "--quiet"], c, rt("c08"), "drill")
    case("D-08", "checkout on the parent commit → seam refuses: bound commit mismatch", "Commission §3: bind to the exact inspected commit", d08, phrase="bound commit mismatch")

    def d09():
        if not module_rel:
            raise FileNotFoundError("binding pins no module manifest")
        c = clone(root, tmp / "c09"); tamper(c / Path(module_rel).parent / "02A_INTERFACE_DESIGN_MODE.md")
        m = load_seam()
        return capture_exit(lambda: m.verify_module_manifests(c, binding))
    case("D-09", "module file tampered → manifest expansion refuses (the central bootstrap alone would not see this)", "Canon: derive every guarded set", d09, phrase="")

    def d10():
        b = scratch_json(BINDING, tmp / "b10.json", lambda d: d["doctrine"].__setitem__("version", "0.0.0"))
        m = load_seam()
        return capture_exit(lambda: m.verify_version_manifest(root, json.loads(b.read_text())))
    case("D-10", "binding claims another Doctrine version than VERSION.json → contradiction refused", "Commission §3: contradictory authority is BLOCKED", d10, phrase="")

    def d11():
        b = scratch_json(BINDING, tmp / "b11.json", lambda d: d.__setitem__("status", "SUSPENDED"))
        return seam(["orient", "--quiet"], root, rt("c11"), "drill", binding=b)
    case("D-11", "binding status not ACTIVE → refused", "bootstrap: binding must be ACTIVE", d11, phrase="not ACTIVE")

    def d12():
        s = scratch_json(STATE, tmp / "s12.json", lambda d: d.pop("release_verification_status"))
        return seam(["orient", "--quiet"], root, rt("c12"), "drill", state=s)
    case("D-12", "required continuity field missing from product state → refused", "bootstrap REQUIRED_STATE_KEYS", d12, phrase="missing required fields")

    def d13():
        s = scratch_json(STATE, tmp / "s13.json", lambda d: d["product_identity"].__setitem__("id", "someone-else"))
        return seam(["orient", "--quiet"], root, rt("c13"), "drill", state=s)
    case("D-13", "product id differs between binding and state → refused", "bootstrap: binding/state identity", d13, phrase="does not match")

    def d14():
        seam(["orient", "--quiet"], root, rt("c14"), "drill-a")
        return seam(["check", "--quiet"], root, rt("c14"), "drill-b")
    case("D-14", "receipt from another session → check refuses", "bootstrap: every blank session must orient", d14, phrase="different session")

    def d15():
        s = scratch_json(STATE, tmp / "s15.json", lambda d: None)
        seam(["orient", "--quiet"], root, rt("c15"), "drill", state=s)
        scratch_json(s, s, lambda d: d.__setitem__("updated_at", "drill-edit"))
        return seam(["check", "--quiet"], root, rt("c15"), "drill", state=s)
    case("D-15", "governing state edited after orientation → check reports STALE", "Playbook §3 invalidation", d15, phrase="STALE")

    case("D-16", "Doctrine root missing → seam refuses", "Commission §3: unavailable authority is BLOCKED",
         lambda: seam(["orient", "--quiet"], tmp / "nowhere", rt("c16"), "drill"), phrase="Doctrine root")

    case("D-17", "guard: `git commit` with no orientation for the session → DENIED", "L-A21 pre-act denial",
         lambda: hook(bash_payload("git commit -m 'x'", session="drill-unoriented"), root, rt("c17")), phrase="orientation is not valid")

    def d18():
        seam(["orient", "--quiet"], root, rt("c18"), "drill-oriented")
        return hook(bash_payload("git commit -m 'x'", session="drill-oriented"), root, rt("c18"))
    case("D-18", "guard: `git commit` with valid orientation → allowed (anti-vacuous)", "Canon: pair every must-not with proof the legitimate case passes", d18, expect_fail=False)

    case("D-19", "guard: commit inside builders-doctrine → DENIED regardless of orientation", "Commission §3 read-only authority",
         lambda: hook(bash_payload(f"cd {root} && git commit -am 'x'"), root, rt("c19")), phrase="read-only")
    case("D-20", "guard: `git push` to a builders-doctrine remote URL → DENIED", "Commission §3 read-only authority",
         lambda: hook(bash_payload("git push https://github.com/r959qp5qwr-web/builders-doctrine main"), root, rt("c20")), phrase="read-only")
    case("D-21", "guard: reading builders-doctrine → allowed", "reads are never denied",
         lambda: hook(bash_payload(f"cat {root}/README.md && git -C {root} log -1"), root, rt("c21")), expect_fail=False)
    case("D-22", "guard: benign command → allowed", "guard asks only about consequential acts",
         lambda: hook(bash_payload("ls -la && python3 scripts/doctrine-orient.py status"), root, rt("c22")), expect_fail=False)

    def d23():
        rc, out = hook("this is not json", root, rt("c23"))
        return (rc, out) if "FAIL-OPEN" in out else (1, out + "\nno FAIL-OPEN notice")
    case("D-23", "guard: malformed hook input → fails OPEN with a notice", "Governor ruling 2026-08-09: fail-open default", d23, expect_fail=False)

    def d24():
        repo = tmp / "mainrepo"; repo.mkdir()
        env = base_env(GIT_AUTHOR_NAME="drill", GIT_AUTHOR_EMAIL="drill@example.invalid", GIT_COMMITTER_NAME="drill", GIT_COMMITTER_EMAIL="drill@example.invalid")
        for cmd in (["git", "init", "-q", "-b", "main"], ["git", "commit", "-q", "--allow-empty", "-m", "init"]):
            rc, out = run(cmd, env=env, cwd=str(repo))
            if rc != 0:
                raise RuntimeError(out)
        return hook(bash_payload("git commit -m 'x'", cwd=repo), root, rt("c24"))
    case("D-24", "guard: commit on the default branch → DENIED", "Canon Day Zero #6 branch discipline", d24, phrase="default branch")

    def d25():
        settings = json.loads((REPO / ".claude" / "settings.json").read_text(encoding="utf-8"))
        hooks = settings.get("hooks", {})
        problems = []
        def refs(entries, expect_matcher=None):
            found = False
            for entry in entries:
                if expect_matcher and entry.get("matcher") != expect_matcher:
                    continue
                for h in entry.get("hooks", []):
                    cmd = h.get("command", "")
                    if "scripts/doctrine-hook.py" in cmd and ">/dev/null" not in cmd and "2>&1" not in cmd:
                        found = True
            return found
        if not refs(hooks.get("SessionStart", [])):
            problems.append("SessionStart hook does not run scripts/doctrine-hook.py")
        if not refs(hooks.get("PreToolUse", []), "Bash"):
            problems.append("PreToolUse hook for Bash does not run scripts/doctrine-hook.py")
        for name in ("pre-commit", "pre-push"):
            p = REPO / ".githooks" / name
            if not p.is_file() or not os.access(p, os.X_OK) or "doctrine-orient.py" not in p.read_text(encoding="utf-8"):
                problems.append(f".githooks/{name} missing, not executable, or does not call the seam")
        if not HOOK.is_file() or not SEAM.is_file():
            problems.append("hook or seam script missing")
        return (1 if problems else 0), "\n".join(problems) or "wiring intact"
    case("D-25", "wiring: hooks registered, match Bash, reference existing scripts, output not discarded; git hooks present", "L-A21 fail-closed wiring gate", d25, expect_fail=False)

    def d26():
        fixture = {
            "schema_version": "1.0", "product_identity": {"id": "fx", "name": "Fixture"}, "product_sentence": "fixture",
            "current_product_phase": {"code": "FX"}, "current_doctrine_binding": {"path": "doctrine/DOCTRINE_BINDING.json"},
            "active_stage": {"code": "FX_STAGE", "next_acceptance_condition": "none"},
            "fixed_product_decisions": [{"id": "F1", "enforcement_state": "ARMED"}, {"id": "F2", "enforcement_state": "UNARMED"}, {"id": "F3", "enforcement_state": "UNARMED"}],
            "open_governor_decisions": [{"id": "O1"}, {"id": "O2"}], "refusal_register": [{"id": "R1"}],
            "unresolved_material_findings_or_obligations": [{"id": "B1"}, {"id": "B2"}],
            "promise_table": [{"proof_state": "INTENDED"}, {"proof_state": "INTENDED"}, {"proof_state": "DESIGNED"}, {"proof_state": "DESIGNED"}],
            "most_recent_accepted_product_harvest": {"id": None}, "release_verification_status": {"state": "UNKNOWN"},
        }
        fx = tmp / "fixture-state.json"; fx.write_text(json.dumps(fixture), encoding="utf-8")
        ux = tmp / "fixture-ux.yaml"; ux.write_text("journeys:\n  - id: J-001\n    name: a\n    status: UX_READY\n  - id: J-002\n    name: b\n    criticality: CRITICAL\n    status: IDENTIFIED\n", encoding="utf-8")
        rc, out = run([sys.executable, "-B", str(SEAM), "assess", "--state", str(fx), "--ux-manifest", str(ux), "--json"])
        if rc != 0:
            return rc, out
        got = json.loads(out)
        expected = {"fixed_decisions": 3, "open_governor_decisions": 2, "refusals": 1, "obligations": 2, "promises": 4}
        ok = (got["counts"] == expected and got["enforcement_state_of_fixed_decisions"] == {"ARMED": 1, "UNARMED": 2}
              and got["promise_proof_states"] == {"INTENDED": 2, "DESIGNED": 2} and got["journeys"] == [{"id": "J-001", "status": "UX_READY"}, {"id": "J-002", "status": "IDENTIFIED"}])
        return (0 if ok else 1), out
    case("D-26", "assessment census against a planted fixture reports exactly the planted counts", "L-A20 anti-vacuous derivation self-test", d26, expect_fail=False)

    def d27():
        checks = [verdict(0, "", True, "x") == "DECORATIVE", verdict(2, "other reason", True, "expected") == "STALE", verdict(2, "expected reason", True, "expected") == "PASS",
                  verdict(0, "", False) == "PASS", verdict(1, "", False) == "RED"]
        return (0 if all(checks) else 1), f"verdict grammar checks: {checks}"
    case("D-27", "the drill's own verdict grammar distinguishes DECORATIVE from STALE", "L-A18 point the honesty instrument at itself", d27, expect_fail=False)
    return cases


def main() -> int:
    root = Path(os.environ.get("DOCTRINE_ROOT") or REPO.parent / "builders-doctrine").resolve()
    if not (root / "operating" / "doctrine_bootstrap.py").is_file():
        print(f"drill: Doctrine root not found at {root}", file=sys.stderr)
        return 2
    before = run(["git", "-C", str(root), "status", "--porcelain"])[1] + run(["git", "-C", str(root), "rev-parse", "HEAD"])[1]
    ARTIFACTS.mkdir(parents=True, exist_ok=True)
    tmp_base = os.environ.get("DOCTRINE_DRILL_TMP")
    tmp = Path(tempfile.mkdtemp(prefix="doctrine-drill-", dir=tmp_base))
    results = []
    try:
        for cid, title, law, fn, expect_fail, phrase in build_cases(root, tmp):
            try:
                rc, out = fn()
                v = verdict(rc, out, expect_fail, phrase)
            except Exception as exc:  # mutation could not be applied → the law was never asked
                rc, out, v = -1, f"{exc.__class__.__name__}: {exc}", "STALE"
            (ARTIFACTS / f"{cid}.txt").write_text(f"{title}\nlaw: {law}\nexit: {rc}\nverdict: {v}\n---\n{out}\n", encoding="utf-8")
            results.append({"id": cid, "title": title, "law": law, "exit": rc, "verdict": v})
            print(f"{v:10s} {cid}  {title}")
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    after = run(["git", "-C", str(root), "status", "--porcelain"])[1] + run(["git", "-C", str(root), "rev-parse", "HEAD"])[1]
    v = "PASS" if before == after else "RED"
    print(f"{v:10s} D-28  the real Doctrine checkout is byte-for-byte untouched by the drill (status/HEAD unchanged)")
    results.append({"id": "D-28", "title": "Doctrine checkout untouched", "law": "Commission §3 read-only", "exit": 0 if v == "PASS" else 1, "verdict": v})
    summary = {"stamp": STAMP, "doctrine_root": str(root), "doctrine_head": after.strip().splitlines()[-1] if after.strip() else None,
               "counts": {k: sum(1 for r in results if r["verdict"] == k) for k in ("PASS", "DECORATIVE", "STALE", "RED")}, "results": results}
    (ARTIFACTS / "SUMMARY.json").write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    print(f"drill: {summary['counts']} — artifacts in {ARTIFACTS}")
    return 0 if summary["counts"]["PASS"] == len(results) else 1


if __name__ == "__main__":
    raise SystemExit(main())
