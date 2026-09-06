#!/usr/bin/env python3
"""
The Gallery — drill for the Doctrine seam, the harness guard, the git layer and the gates.

Proves that every protection fails under the violation it guards, and that the legitimate
case still passes (Canon: drill every gate; pair every "X must not happen" with proof that X
is still seen where legitimate). Runs against scratch clones of the Doctrine checkout and
scratch copies of this repository; it never mutates either real tree.

A case passes only when the SPECIFIC denial or permission fired. A guard denial must name its
rule and route; a permission must name its reason. A case that failed for another reason is
STALE — the law was never asked — and is a failure, not a pass (L-A8 amendment).

Verdicts
  PASS        the protection fired for the stated reason, or the legitimate case was allowed
  DECORATIVE  the protection stayed green under its own violation: the law is broken
  STALE       the mutation did not apply, or the outcome came from an unrelated cause
  RED         a baseline that must be green is red; mutations mean nothing on a red baseline

Evidence for every case is preserved under .doctrine/runtime/drills/<stamp>/ where no later
run overwrites it (C-0009).
"""
from __future__ import annotations

import contextlib
import importlib.util
import io
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
SEAM = REPO / "scripts" / "doctrine-orient.py"
HOOK = REPO / "scripts" / "doctrine-hook.py"
GATE = REPO / "scripts" / "doctrine-gate.py"
BINDING = REPO / "doctrine" / "DOCTRINE_BINDING.json"
STATE = REPO / "doctrine" / "PRODUCT_STATE.json"
SURFACE = REPO / "doctrine" / "MUTATION_SURFACE.json"
STAMP = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
ARTIFACTS = REPO / ".doctrine" / "runtime" / "drills" / STAMP
CLEAN = ("DOCTRINE_SESSION_ID", "CLAUDE_CODE_SESSION_ID", "DOCTRINE_RUNTIME_DIR", "DOCTRINE_ROOT",
         "CLAUDE_PROJECT_DIR", "DOCTRINE_ALLOW_MAIN", "DOCTRINE_STAGE_OVERRIDE", "DOCTRINE_GUARD_EXPLAIN")
GOVERNANCE = ("doctrine", "scripts", ".claude", ".githooks", ".github")


def env(**extra) -> dict:
    e = {k: v for k, v in os.environ.items() if k not in CLEAN}
    e.update({"GIT_OPTIONAL_LOCKS": "0", "PYTHONDONTWRITEBYTECODE": "1"})
    e.update(extra)
    return e


def run(cmd, e=None, cwd=None, stdin=None):
    cp = subprocess.run(cmd, capture_output=True, text=True, env=e or env(), cwd=cwd or str(REPO), input=stdin, timeout=300)
    return cp.returncode, (cp.stdout + cp.stderr)


# --- expectations -------------------------------------------------------------------------

class Expect:
    def __init__(self, kind, **kw):
        self.kind, self.kw = kind, kw

    def judge(self, rc: int, out: str) -> str:
        if self.kind == "deny":
            if rc == 0:
                return "DECORATIVE"
            if rc != 2:
                return "STALE"
            m = re.search(r"DOCTRINE GUARD: DENIED \[([A-Z0-9-]+), route ([\w-]+)", out)
            if not m:
                return "STALE"
            if m.group(1) != self.kw["rule"]:
                return "STALE"
            if self.kw.get("route") and m.group(2) != self.kw["route"]:
                return "STALE"
            return "PASS"
        if self.kind == "allow":
            if rc != 0:
                return "DECORATIVE" if self.kw.get("legitimate") else "STALE"
            m = re.search(r"DOCTRINE GUARD: ALLOWED \[([\w-]+)\]", out)
            if not m:
                return "STALE"
            return "PASS" if m.group(1) == self.kw["reason"] else "STALE"
        if self.kind == "fail":
            if rc == 0:
                return "DECORATIVE"
            return "PASS" if self.kw["phrase"] in out else "STALE"
        if self.kind == "pass":
            return "PASS" if rc == 0 else "RED"
        raise ValueError(self.kind)


def deny(rule, route=None):
    return Expect("deny", rule=rule, route=route)


def allow(reason):
    return Expect("allow", reason=reason, legitimate=True)


def fails(phrase):
    return Expect("fail", phrase=phrase)


def green():
    return Expect("pass")


# --- fixtures -----------------------------------------------------------------------------

def clone_doctrine(root: Path, dest: Path, rev: str | None = None) -> Path:
    rc, out = run(["git", "clone", "--quiet", "--no-hardlinks", str(root), str(dest)])
    if rc != 0:
        raise RuntimeError("clone failed: " + out)
    if rev:
        rc, out = run(["git", "-C", str(dest), "checkout", "--quiet", rev])
        if rc != 0:
            raise RuntimeError("checkout failed: " + out)
    return dest


def scratch_project(dest: Path, arm: bool = True) -> Path:
    """A copy of the governed parts of this repository, for tests that must tamper with it.

    `arm=True` models an ORIENTED checkout: core.hooksPath points at the governed .githooks,
    exactly as `scripts/doctrine-orient.py orient` leaves it. Without that, gate G3 would be
    red in every fixture and a case expecting "repository gates failed" would pass whether or
    not its own planted violation fired — a vacuous pass. `arm=False` models a FRESH checkout
    that has never been oriented, which is what the OBL-GAL-013 sequence needs.
    """
    dest.mkdir(parents=True, exist_ok=True)
    for d in GOVERNANCE:
        if (REPO / d).is_dir():
            shutil.copytree(REPO / d, dest / d, dirs_exist_ok=True,
                            ignore=shutil.ignore_patterns("__pycache__", "runtime"))
    (dest / "ux" / "reference" / "interface").mkdir(parents=True, exist_ok=True)
    shutil.copytree(REPO / "ux" / "reference" / "interface" / "surfaces",
                    dest / "ux" / "reference" / "interface" / "surfaces", dirs_exist_ok=True)
    if not (dest / ".git").exists():
        e = env(GIT_AUTHOR_NAME="drill", GIT_AUTHOR_EMAIL="drill@example.invalid",
                GIT_COMMITTER_NAME="drill", GIT_COMMITTER_EMAIL="drill@example.invalid")
        run(["git", "init", "-q", "-b", "drill-branch"], e=e, cwd=str(dest))
        run(["git", "add", "-A"], e=e, cwd=str(dest))
        run(["git", "commit", "-q", "-m", "drill fixture"], e=e, cwd=str(dest))
    if arm:
        run(["git", "-C", str(dest), "config", "core.hooksPath", ".githooks"], e=env())
    return dest


def bare_remote(dest: Path) -> Path:
    """A local bare repository to push at, so the push route is drilled without a network."""
    rc, out = run(["git", "init", "-q", "--bare", str(dest)])
    if rc != 0:
        raise RuntimeError("bare init failed: " + out)
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


def load_seam():
    spec = importlib.util.spec_from_file_location("seam", SEAM)
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


def capture_exit(fn):
    buf = io.StringIO()
    try:
        with contextlib.redirect_stderr(buf):
            fn()
        return 0, buf.getvalue()
    except SystemExit as e:
        return int(e.code or 0), buf.getvalue()


# --- invocations --------------------------------------------------------------------------

def seam(args, root, runtime, session=None, binding=BINDING, state=STATE):
    cmd = [sys.executable, "-B", str(SEAM), *args, "--binding", str(binding), "--state", str(state)]
    if session:
        cmd += ["--session-id", session]
    return run(cmd, e=env(DOCTRINE_ROOT=str(root), DOCTRINE_RUNTIME_DIR=str(runtime)))


def central(args, root, runtime, session, binding=BINDING, state=STATE):
    return run([sys.executable, "-B", str(root / "operating" / "doctrine_bootstrap.py"), *args,
                "--binding", str(binding), "--state", str(state), "--doctrine-root", str(root),
                "--session-id", session, "--receipt", str(runtime / "DOCTRINE_ORIENTATION_RECEIPT.json")])


def guard(payload, root, runtime, project=REPO, hook=None, **extra):
    e = env(DOCTRINE_ROOT=str(root), DOCTRINE_RUNTIME_DIR=str(runtime),
            CLAUDE_PROJECT_DIR=str(project), DOCTRINE_GUARD_EXPLAIN="1", **extra)
    stdin = payload if isinstance(payload, str) else json.dumps(payload)
    return run([sys.executable, "-B", str(hook or HOOK), "pre-tool-use"], e=e, stdin=stdin, cwd=str(project))


def call(tool, tool_input, session="drill-oriented", cwd=None):
    return {"session_id": session, "tool_name": tool, "tool_input": tool_input,
            "cwd": str(cwd or REPO), "hook_event_name": "PreToolUse"}


def gate(project=REPO, only=None):
    cmd = [sys.executable, "-B", str(project / "scripts" / "doctrine-gate.py")]
    if only:
        cmd += ["--only", only]
    return run(cmd, cwd=str(project))


def githook(name, args=(), project=REPO, stdin="", path=None, e=None):
    return run(["sh", str(project / ".githooks" / name), *args], e=e or env(), cwd=str(project), stdin=stdin)


# --- cases --------------------------------------------------------------------------------

def build_cases(root: Path, tmp: Path):
    binding = json.loads(BINDING.read_text(encoding="utf-8"))
    canon = binding["doctrine"]["artifacts"]["canon"]["path"]
    register = binding["doctrine"]["artifacts"]["candidate_register"]["path"]
    module_manifest = next(s["path"] for s in binding["doctrine"]["artifacts"].values() if s["path"].endswith("MODULE_MANIFEST.yaml"))
    rt = lambda n: tmp / "rt" / n
    cases = []

    def case(cid, title, law, fn, expect):
        cases.append((cid, title, law, fn, expect))

    # -- baselines: mutations mean nothing on a red baseline -------------------------------
    case("D-01", "baseline: seam orient against the real checkout is green", "L-A8 proven-green baseline",
         lambda: seam(["orient", "--quiet"], root, rt("base"), "drill-base"), green())
    case("D-02", "baseline: seam check for the same session is green", "Playbook §3 consequence gate",
         lambda: seam(["check", "--quiet"], root, rt("base"), "drill-base"), green())
    case("D-03", "baseline: all repository gates are green on the real tree", "anti-vacuous baseline for G1–G5",
         lambda: gate(), green())

    # -- Doctrine integrity ---------------------------------------------------------------
    def d04():
        c = clone_doctrine(root, tmp / "c04"); tamper(c / canon)
        return central(["orient"], c, rt("c04"), "drill")
    case("D-04", "Canon byte-tampered in a clone → central bootstrap refuses", "README fail-closed", d04, fails("canon fingerprint mismatch"))

    def d05():
        c = clone_doctrine(root, tmp / "c05"); tamper(c / canon)
        return seam(["orient", "--quiet"], c, rt("c05"), "drill")
    case("D-05", "Canon tampered → the seam sees the dirty worktree before the bootstrap runs", "a git-HEAD pin cannot see a working-tree edit", d05, fails("modified in the working tree"))

    def d06():
        c = clone_doctrine(root, tmp / "c06"); (c / canon).unlink()
        return central(["orient"], c, rt("c06"), "drill")
    case("D-06", "Canon removed (subject removal) → central bootstrap refuses", "L-A8 subject-removal mutation", d06, fails("missing required file"))

    def d07():
        c = clone_doctrine(root, tmp / "c07"); tamper(c / register)
        return central(["orient"], c, rt("c07"), "drill")
    case("D-07", "Candidate Register tampered → refused (trial defect B6 class)", "VERSION.json prior_propagation B6", d07, fails("candidate_register fingerprint mismatch"))

    marker = tmp / "bootstrap-executed.marker"

    def d08():
        c = clone_doctrine(root, tmp / "c08"); bp = c / "operating" / "doctrine_bootstrap.py"
        text = bp.read_text(encoding="utf-8"); needle = "from __future__ import annotations\n"
        if needle not in text:
            raise FileNotFoundError("bootstrap header changed; mutation did not apply")
        bp.write_text(text.replace(needle, needle + f'import pathlib as _p; _p.Path(r"{marker}").write_text("executed")\n', 1), encoding="utf-8")
        rc, out = seam(["orient", "--quiet"], c, rt("c08"), "drill")
        if marker.exists():
            return 0, out + "\nMARKER PRESENT: the tampered bootstrap was executed"
        return rc, out
    case("D-08", "bootstrap tampered → the seam refuses BEFORE executing it (marker never written)", "README: fingerprint the bootstrap first", d08, fails("bootstrap fingerprint mismatch"))

    def d09():
        c = clone_doctrine(root, tmp / "c09", rev="HEAD~1")
        return seam(["orient", "--quiet"], c, rt("c09"), "drill")
    case("D-09", "checkout on the parent commit → bound commit mismatch", "bind to the exact inspected commit", d09, fails("bound commit mismatch"))

    def d10():
        c = clone_doctrine(root, tmp / "c10"); tamper(c / Path(module_manifest).parent / "02A_INTERFACE_DESIGN_MODE.md")
        m = load_seam()
        return capture_exit(lambda: m.verify_module_manifests(c, binding))
    case("D-10", "module file tampered → manifest expansion refuses (the bootstrap alone cannot see this)", "derive every guarded set", d10, fails("module file fingerprint mismatch"))

    def d11():
        b = scratch_json(BINDING, tmp / "b11.json", lambda d: d["doctrine"].__setitem__("version", "0.0.0"))
        m = load_seam()
        return capture_exit(lambda: m.verify_version_manifest(root, json.loads(b.read_text())))
    case("D-11", "binding claims a different Doctrine version than VERSION.json → contradiction refused", "contradictory authority is BLOCKED", d11, fails("version contradiction"))

    case("D-12", "binding status not ACTIVE → refused", "bootstrap: binding must be ACTIVE",
         lambda: seam(["orient", "--quiet"], root, rt("c12"), "drill", binding=scratch_json(BINDING, tmp / "b12.json", lambda d: d.__setitem__("status", "SUSPENDED"))), fails("not ACTIVE"))
    case("D-13", "required continuity field missing from product state → refused", "REQUIRED_STATE_KEYS",
         lambda: seam(["orient", "--quiet"], root, rt("c13"), "drill", state=scratch_json(STATE, tmp / "s13.json", lambda d: d.pop("release_verification_status"))), fails("missing required fields"))
    case("D-14", "product id differs between binding and state → refused", "binding/state identity",
         lambda: seam(["orient", "--quiet"], root, rt("c14"), "drill", state=scratch_json(STATE, tmp / "s14.json", lambda d: d["product_identity"].__setitem__("id", "someone-else"))), fails("does not match"))

    def d15():
        seam(["orient", "--quiet"], root, rt("c15"), "drill-a")
        return seam(["check", "--quiet"], root, rt("c15"), "drill-b")
    case("D-15", "receipt from another session → check refuses", "every blank session must orient", d15, fails("different session"))

    def d16():
        s = scratch_json(STATE, tmp / "s16.json", lambda d: None)
        seam(["orient", "--quiet"], root, rt("c16"), "drill", state=s)
        scratch_json(s, s, lambda d: d.__setitem__("updated_at", "drill-edit"))
        return seam(["check", "--quiet"], root, rt("c16"), "drill", state=s)
    case("D-16", "product state edited after orientation → check reports STALE", "Playbook §3 invalidation", d16, fails("STALE"))

    case("D-17", "Doctrine root missing → refused", "unavailable authority is BLOCKED",
         lambda: seam(["orient", "--quiet"], tmp / "nowhere", rt("c17"), "drill"), fails("Doctrine root"))
    case("D-18", "no orientation receipt at all → check refuses", "absent orientation is not permission",
         lambda: seam(["check", "--quiet"], root, rt("never-oriented"), "drill"), fails("has not oriented"))

    # -- the guard's indeterminacy property (the defect this drill was rewritten for) ------
    oriented_rt = rt("guard")
    githook_rt = rt("githook")
    GH = "drill-githook"

    def gh_env(**extra):
        base = {"DOCTRINE_ROOT": str(root), "DOCTRINE_RUNTIME_DIR": str(githook_rt), "DOCTRINE_SESSION_ID": GH}
        base.update(extra)
        return env(**base)

    def prepare():
        seam(["orient", "--quiet"], root, oriented_rt, "drill-oriented")
        seam(["orient", "--quiet"], root, githook_rt, GH)

    case("D-19", "guard: malformed JSON payload → DENIED, not allowed", "GUARD-0 indeterminate verdict is a denial",
         lambda: guard("this is not json", root, oriented_rt), deny("GUARD-0", "payload"))
    case("D-20", "guard: empty payload → DENIED", "GUARD-0 absent input is not permission",
         lambda: guard("", root, oriented_rt), deny("GUARD-0", "payload"))
    case("D-21", "guard: payload carrying no tool name → DENIED", "GUARD-0 unknown act",
         lambda: guard({"session_id": "x", "tool_input": {"command": "git push"}}, root, oriented_rt), deny("GUARD-0", "payload"))
    case("D-22", "guard: payload that is a JSON array, not an object → DENIED", "GUARD-0 malformed shape",
         lambda: guard("[1,2,3]", root, oriented_rt), deny("GUARD-0", "payload"))

    def d23():
        # THE REPLACED CASE. The superseded D-23 asserted that a malformed payload produced a
        # fail-open ALLOW and counted that as a PASS — it ratified the implementation instead
        # of testing the safety property. This one corrupts the guard's own mutation-surface
        # file, which is an internal malfunction rather than a bad payload, and requires the
        # consequential act to be denied.
        proj = scratch_project(tmp / "p23")
        (proj / "doctrine" / "MUTATION_SURFACE.json").write_text("{ not json", encoding="utf-8")
        return guard(call("Bash", {"command": "git commit -m x"}), root, oriented_rt, project=proj, hook=proj / "scripts" / "doctrine-hook.py")
    case("D-23", "guard: corrupt mutation-surface file (internal malfunction) → DENIED, not allowed", "GUARD-0; supersedes the fail-open case this drill previously ratified", d23, deny("GUARD-0", "guard-internal"))

    def d24():
        proj = scratch_project(tmp / "p24")
        (proj / "scripts" / "doctrine-orient.py").unlink()
        return guard(call("Bash", {"command": "git push origin HEAD"}), root, oriented_rt, project=proj, hook=proj / "scripts" / "doctrine-hook.py")
    case("D-24", "guard: the seam it depends on is missing → consequential act DENIED", "GUARD-0/2: a broken dependency is not permission", d24, deny("GUARD-2", "shell"))

    case("D-25", "guard: a tool outside the inventoried surface → DENIED as indeterminate", "GUARD-0 unknown tool",
         lambda: guard(call("SomeBrandNewMutatingTool", {"path": "x"}), root, oriented_rt), deny("GUARD-0", "unknown-tool"))

    # -- guard: shell route ----------------------------------------------------------------
    case("D-26", "guard: `git commit` with no orientation for the session → DENIED", "GUARD-2",
         lambda: guard(call("Bash", {"command": "git commit -m 'x'"}, session="drill-unoriented"), root, rt("unoriented")), deny("GUARD-2", "shell"))
    case("D-27", "guard: `git commit` with valid orientation → ALLOWED (anti-vacuous)", "prove the legitimate case still passes",
         lambda: guard(call("Bash", {"command": "git commit -m 'x'"}), root, oriented_rt), allow("shell-consequential-oriented"))
    case("D-28", "guard: reading files is allowed even with no orientation (inspection survives)", "Doctrine: inspection and diagnosis are always permitted",
         lambda: guard(call("Bash", {"command": "cat README.md && ls -la"}, session="drill-unoriented"), root, rt("unoriented")), allow("shell-not-consequential"))
    case("D-29", "guard: `rm` inside the Doctrine checkout → DENIED", "GUARD-1 read-only authority",
         lambda: guard(call("Bash", {"command": f"cd {root} && rm -f README.md"}), root, oriented_rt), deny("GUARD-1", "shell"))
    case("D-30", "guard: push to a builders-doctrine remote URL → DENIED", "GUARD-1 read-only authority",
         lambda: guard(call("Bash", {"command": "git push https://github.com/r959qp5qwr-web/builders-doctrine main"}), root, oriented_rt), deny("GUARD-1", "shell"))
    case("D-31", "guard: reading the Doctrine checkout → ALLOWED (anti-vacuous)", "reads are never denied",
         lambda: guard(call("Bash", {"command": f"cat {root}/README.md && git -C {root} log -1"}), root, oriented_rt), allow("shell-not-consequential"))

    def d32():
        repo = tmp / "mainrepo"; repo.mkdir(exist_ok=True)
        e = env(GIT_AUTHOR_NAME="drill", GIT_AUTHOR_EMAIL="drill@example.invalid", GIT_COMMITTER_NAME="drill", GIT_COMMITTER_EMAIL="drill@example.invalid")
        for cmd in (["git", "init", "-q", "-b", "main"], ["git", "commit", "-q", "--allow-empty", "-m", "init"]):
            rc, out = run(cmd, e=e, cwd=str(repo))
            if rc != 0:
                raise RuntimeError(out)
        return guard(call("Bash", {"command": "git commit -m 'x'"}, cwd=repo), root, oriented_rt)
    case("D-32", "guard: commit on the default branch → DENIED", "GUARD-3 branch discipline", d32, deny("GUARD-3", "shell"))

    # -- guard: local file-write routes (the surface the previous drill never covered) ------
    case("D-33", "guard: Write into the Doctrine checkout → DENIED", "GUARD-1 by file route, not shell",
         lambda: guard(call("Write", {"file_path": str(root / "THE-BUILDERS-CANON-v1.0.md"), "content": "x"}), root, oriented_rt), deny("GUARD-1", "file"))
    case("D-34", "guard: Edit inside the Doctrine checkout → DENIED", "GUARD-1 covers every local-write tool",
         lambda: guard(call("Edit", {"file_path": str(root / "VERSION.json"), "old_string": "a", "new_string": "b"}), root, oriented_rt), deny("GUARD-1", "file"))
    case("D-35", "guard: NotebookEdit inside the Doctrine checkout → DENIED", "the class is derived, not per-tool",
         lambda: guard(call("NotebookEdit", {"notebook_path": str(root / "x.ipynb")}), root, oriented_rt), deny("GUARD-1", "file"))
    case("D-36", "guard: Write to product source with no orientation → DENIED", "GUARD-2 by file route",
         lambda: guard(call("Write", {"file_path": str(REPO / "ux" / "notes.md")}, session="drill-unoriented"), root, rt("unoriented")), deny("GUARD-2", "file"))
    case("D-37", "guard: Write to a governance path with no orientation → ALLOWED (the repair path)", "a guard must remain repairable and Stage 0 must be able to bootstrap",
         lambda: guard(call("Write", {"file_path": str(REPO / "scripts" / "doctrine-hook.py")}, session="drill-unoriented"), root, rt("unoriented")), allow("write-governance-path"))
    case("D-38", "guard: Write application source while the stage blocks it → DENIED", "GUARD-4 the stage gate is enforced, not remembered",
         lambda: guard(call("Write", {"file_path": str(REPO / "src" / "app" / "page.tsx")}), root, oriented_rt), deny("GUARD-4", "file"))
    case("D-39", "guard: Write a product document while oriented → ALLOWED (anti-vacuous)", "the stage blocks application source, not documents",
         lambda: guard(call("Write", {"file_path": str(REPO / "product" / "NOTES.md")}), root, oriented_rt), allow("write-product-path-oriented"))
    case("D-40", "guard: local-write tool with no path this guard can read → DENIED", "GUARD-0 an unreadable target is indeterminate",
         lambda: guard(call("Write", {"content": "x"}), root, oriented_rt), deny("GUARD-0", "file"))

    # -- guard: GitHub API route (bypasses local git and .githooks entirely) ----------------
    case("D-41", "guard: GitHub API write to builders-doctrine → DENIED", "GUARD-1 by API route",
         lambda: guard(call("mcp__github__create_or_update_file", {"owner": "r959qp5qwr-web", "repo": "builders-doctrine", "path": "README.md", "branch": "main"}), root, oriented_rt), deny("GUARD-1", "github-api"))
    case("D-42", "guard: GitHub API push_files to the default branch → DENIED", "GUARD-3 the API path has no git hook in it",
         lambda: guard(call("mcp__github__push_files", {"owner": "r959qp5qwr-web", "repo": "Thegallery", "branch": "main", "files": []}), root, oriented_rt), deny("GUARD-3", "github-api"))
    case("D-43", "guard: merging a pull request → DENIED", "GUARD-3 the merge is the governor's act",
         lambda: guard(call("mcp__github__merge_pull_request", {"owner": "r959qp5qwr-web", "repo": "Thegallery", "pullNumber": 1}), root, oriented_rt), deny("GUARD-3", "github-api"))
    case("D-44", "guard: GitHub API write to the feature branch while oriented → ALLOWED (anti-vacuous)", "prove ordinary work is still possible",
         lambda: guard(call("mcp__github__create_or_update_file", {"owner": "r959qp5qwr-web", "repo": "Thegallery", "path": "x.md", "branch": "claude/the-gallery-foundation-7plo1e"}), root, oriented_rt), allow("github-api-oriented"))
    case("D-45", "guard: GitHub API read verb → ALLOWED as read-only", "namespace verb classification",
         lambda: guard(call("mcp__github__get_file_contents", {"owner": "x", "repo": "y", "path": "z"}), root, oriented_rt), allow("read_only-tool"))
    case("D-46", "guard: an unlisted GitHub write verb with no orientation → DENIED", "unknown-in-namespace defaults to write, not read",
         lambda: guard(call("mcp__github__create_something_new", {"owner": "x", "repo": "Thegallery"}, session="drill-unoriented"), root, rt("unoriented")), deny("GUARD-2", "github-api"))

    # -- guard: delegation, publication, external and scheduling routes ---------------------
    case("D-47", "guard: starting a subagent with no orientation → DENIED", "GUARD-2 delegation carries its own tool surface",
         lambda: guard(call("Agent", {"prompt": "do things"}, session="drill-unoriented"), root, rt("unoriented")), deny("GUARD-2", "delegation"))
    case("D-48", "guard: publishing an Artifact with no orientation → DENIED", "GUARD-2 publication is consequential",
         lambda: guard(call("Artifact", {"file_path": "x.html"}, session="drill-unoriented"), root, rt("unoriented")), deny("GUARD-2", "publication"))
    case("D-49", "guard: external write with no orientation → DENIED", "GUARD-2 external state is consequential",
         lambda: guard(call("mcp__Google_Drive__create_file", {"name": "x"}, session="drill-unoriented"), root, rt("unoriented")), deny("GUARD-2", "external_write"))
    case("D-50", "guard: creating a durable trigger with no orientation → DENIED", "GUARD-2 a trigger acts after the session ends",
         lambda: guard(call("mcp__Claude_Code_Remote__create_trigger", {"name": "x"}, session="drill-unoriented"), root, rt("unoriented")), deny("GUARD-2", "scheduling"))
    case("D-51", "guard: session-local bookkeeping → ALLOWED without orientation", "a guard that interrupts a to-do list gets switched off",
         lambda: guard(call("TaskCreate", {"subject": "x"}, session="drill-unoriented"), root, rt("unoriented")), allow("session_local-tool"))

    # -- the compulsory git layer ----------------------------------------------------------
    case("D-52", "git pre-commit with valid orientation and green gates → allows", "anti-vacuous: the legitimate commit still passes",
         lambda: githook("pre-commit", e=gh_env()), green())
    case("D-53", "git pre-commit with a foreign session id → refuses", "compulsory layer, independent of the harness",
         lambda: githook("pre-commit", e=gh_env(DOCTRINE_SESSION_ID="foreign-session")), fails("orientation invalid"))

    def d54():
        bindir = tmp / "nopython"; bindir.mkdir(exist_ok=True)
        for tool in ("git", "sh", "sed", "grep", "cat", "uname", "dirname", "readlink", "expr"):
            src = shutil.which(tool)
            if src and not (bindir / tool).exists():
                (bindir / tool).symlink_to(src)
        return githook("pre-commit", e={"PATH": str(bindir), "HOME": str(tmp), "DOCTRINE_ROOT": str(root), "DOCTRINE_RUNTIME_DIR": str(githook_rt), "DOCTRINE_SESSION_ID": GH})
    case("D-54", "git pre-commit with no python3 on PATH → REFUSES (was: exited 0)", "the fail-open path this drill previously did not test", d54, fails("commit refused"))

    def d55():
        proj = scratch_project(tmp / "p55")
        tamper(proj / "ux" / "reference" / "interface" / "surfaces" / "R-1-entrance.html")
        p = proj / "ux" / "reference" / "interface" / "surfaces" / "R-1-entrance.html"
        p.write_text(p.read_text(encoding="utf-8").replace("Anika Rao", "Verified maker Anika Rao"), encoding="utf-8")
        return githook("pre-commit", project=proj, e=gh_env())
    case("D-55", "git pre-commit with a red repository gate → refuses the commit", "the gates are on the commit path, not beside it", d55, fails("repository gates failed"))

    def d55b():
        proj = scratch_project(tmp / "p55b")
        run(["git", "branch", "-M", "main"], e=env(), cwd=str(proj))
        return githook("pre-commit", project=proj, e=gh_env())
    case("D-55b", "git pre-commit on a default branch → refuses", "branch discipline on the compulsory commit path", d55b, fails("direct commit on 'main'"))

    case("D-56", "git pre-push to a builders-doctrine URL → refuses", "read-only authority on the push route",
         lambda: githook("pre-push", ["origin", "https://github.com/r959qp5qwr-web/builders-doctrine"], e=gh_env()), fails("read-only"))
    case("D-57", "git pre-push to refs/heads/main → refuses", "branch discipline on the push route",
         lambda: githook("pre-push", ["origin", "https://github.com/r959qp5qwr-web/Thegallery"],
                         stdin="refs/heads/x 1111111111111111111111111111111111111111 refs/heads/main 0000000000000000000000000000000000000000\n",
                         e=gh_env()), fails("refs/heads/main"))
    case("D-58", "git pre-push to the feature branch with valid orientation → allows", "anti-vacuous: the legitimate push still passes",
         lambda: githook("pre-push", ["origin", "https://github.com/r959qp5qwr-web/Thegallery"],
                         stdin="refs/heads/claude/the-gallery-foundation-7plo1e 1111111111111111111111111111111111111111 refs/heads/claude/the-gallery-foundation-7plo1e 0000000000000000000000000000000000000000\n",
                         e=gh_env()), green())

    # -- the repository gates, each drilled under its own violation ------------------------
    def d59():
        proj = scratch_project(tmp / "p59")
        st = json.loads((proj / "doctrine" / "PRODUCT_STATE.json").read_text())
        st["fixed_product_decisions"].append({"id": "GAL-FAKE", "summary": "laundered", "status": "FIXED",
                                              "enforcement_locus": "scripts/does-not-exist.py holds this", "enforcement_state": "ARMED"})
        (proj / "doctrine" / "PRODUCT_STATE.json").write_text(json.dumps(st, indent=2))
        return gate(proj, "G1")
    case("D-59", "gate G1: a FIXED decision claiming ARMED on a locus that does not exist → RED", "C-0006 class: a document of rules held by a gate over itself", d59, fails("GAL-FAKE"))

    def d60():
        proj = scratch_project(tmp / "p60")
        st = json.loads((proj / "doctrine" / "PRODUCT_STATE.json").read_text())
        for d in st["fixed_product_decisions"]:
            if d["id"] == "GAL-G7":
                d["enforcement_state"] = "MANUAL"
        (proj / "doctrine" / "PRODUCT_STATE.json").write_text(json.dumps(st, indent=2))
        return gate(proj, "G1")
    case("D-60", "gate G1: the armed count falling below the ratchet → RED (two-sided)", "C-0005: honesty-by-surrender fails as loudly as regression", d60, fails("fell"))

    def d61():
        proj = scratch_project(tmp / "p61")
        st = json.loads((proj / "doctrine" / "PRODUCT_STATE.json").read_text())
        for d in st["fixed_product_decisions"]:
            if d["id"] == "GAL-G9":
                d["enforcement_state"] = "ARMED"
        (proj / "doctrine" / "PRODUCT_STATE.json").write_text(json.dumps(st, indent=2))
        return gate(proj, "G1")
    case("D-61", "gate G1: claiming ARMED on a hook-layer locus → RED (layers may not stand in for each other)", "host invocation is not repository enforcement", d61, fails("ARMED_AS_CONFIGURED at most"))

    def d62():
        proj = scratch_project(tmp / "p62")
        surf = json.loads((proj / "doctrine" / "MUTATION_SURFACE.json").read_text())
        surf["tools"]["LOCAL_WRITE"].append("BrandNewWriteTool")
        (proj / "doctrine" / "MUTATION_SURFACE.json").write_text(json.dumps(surf, indent=2))
        return gate(proj, "G2")
    case("D-62", "gate G2: a mutation-capable tool the matcher does not cover → RED", "wiring is derived, never hand-maintained in two places", d62, fails("does not cover"))

    def d63():
        proj = scratch_project(tmp / "p63")
        s = json.loads((proj / ".claude" / "settings.json").read_text())
        s["hooks"]["PreToolUse"][0]["hooks"][0]["command"] += " 2>&1"
        (proj / ".claude" / "settings.json").write_text(json.dumps(s, indent=2))
        return gate(proj, "G2")
    case("D-63", "gate G2: a hook that discards its own output → RED", "L-A21 wiring: output not discarded", d63, fails("discards its own output"))

    def d64():
        proj = scratch_project(tmp / "p64")
        p = proj / ".githooks" / "pre-commit"
        p.write_text(p.read_text().replace(
            '  echo "  This gate fails closed by Governor instruction 2026-09-04: an unverifiable state is not permission." >&2\n  exit 1',
            '  exit 0'), encoding="utf-8")
        return gate(proj, "G3")
    case("D-64", "gate G3: a git hook restored to fail-open on a missing interpreter → RED", "the defect this closure exists to prevent, caught by a machine", d64, fails("fail-open path"))

    def d65():
        proj = scratch_project(tmp / "p65")
        p = proj / "ux" / "reference" / "interface" / "surfaces" / "R-2-work-detail.html"
        p.write_text(p.read_text(encoding="utf-8").replace("Anika Rao · wood-fired stoneware", "Anika Rao · verified maker"), encoding="utf-8")
        return gate(proj, "G5")
    case("D-65", "gate G5: a banned platform claim planted in product copy → RED", "GAL-07; Canon banned-claim sweep", d65, fails("banned platform claim"))

    def d66():
        proj = scratch_project(tmp / "p66")
        p = proj / "ux" / "reference" / "interface" / "surfaces" / "R-2b-handoff-sheet.html"
        p.write_text(p.read_text(encoding="utf-8").replace("studio@anikarao.example", "anika.rao@gmail.com"), encoding="utf-8")
        return gate(proj, "G5")
    case("D-66", "gate G5: a real-world email planted in a committed surface → RED", "GAL-G4: no real person in a committed artifact", d66, fails("outside the reserved test domains"))

    def d67():
        proj = scratch_project(tmp / "p67")
        (proj / "doctrine" / "PRODUCT_STATE.json").unlink()
        return gate(proj, "G1")
    case("D-67", "gate G1: its subject removed → dies RED rather than passing vacuously", "every gate declares an anchor", d67, fails("ANCHOR MISSING"))

    def d68():
        proj = scratch_project(tmp / "p68")
        st = json.loads((proj / "doctrine" / "PRODUCT_STATE.json").read_text())
        st["unresolved_material_findings_or_obligations"].append({"id": "OBL-FAKE", "state": "UNARMED", "summary": "no way to close this"})
        (proj / "doctrine" / "PRODUCT_STATE.json").write_text(json.dumps(st, indent=2))
        return gate(proj, "G4")
    case("D-68", "gate G4: an obligation with no activation condition → RED", "L-A19: a debt is a counted ratchet, never a promise", d68, fails("OBL-FAKE"))

    # -- coverage and self-tests -----------------------------------------------------------
    def d69():
        surface = json.loads(SURFACE.read_text(encoding="utf-8"))
        body = Path(__file__).read_text(encoding="utf-8")
        uncovered = [cls for cls in surface["hook_matcher_classes"]
                     if not any(t in body for t in surface["tools"][cls])]
        return (1 if uncovered else 0), f"classes with no drill case: {uncovered or 'none'}"
    case("D-69", "drill coverage is DERIVED: every matched mutation class has at least one case", "L-A8: gate-to-mutation coverage is derived, never hand-listed", d69, green())

    def d70():
        checks = [
            Expect("deny", rule="GUARD-2").judge(2, "DOCTRINE GUARD: DENIED [GUARD-0, route payload") == "STALE",
            Expect("deny", rule="GUARD-2").judge(0, "") == "DECORATIVE",
            Expect("deny", rule="GUARD-2", route="shell").judge(2, "DOCTRINE GUARD: DENIED [GUARD-2, route shell, since x") == "PASS",
            Expect("allow", reason="a", legitimate=True).judge(2, "") == "DECORATIVE",
            Expect("allow", reason="a", legitimate=True).judge(0, "DOCTRINE GUARD: ALLOWED [b]") == "STALE",
            Expect("fail", phrase="x").judge(0, "x") == "DECORATIVE",
        ]
        return (0 if all(checks) else 1), f"verdict grammar: {checks}"
    case("D-70", "the drill's own grammar refuses a pass that fired for the wrong reason", "L-A18: point the honesty instrument at itself", d70, green())

    def d71():
        fixture = {"schema_version": "1.0", "product_identity": {"id": "fx", "name": "Fixture"}, "product_sentence": "fixture",
                   "current_product_phase": {"code": "FX"}, "current_doctrine_binding": {"path": "doctrine/DOCTRINE_BINDING.json"},
                   "active_stage": {"code": "FX_STAGE", "next_acceptance_condition": "none"},
                   "fixed_product_decisions": [{"id": "F1", "enforcement_state": "ARMED"}, {"id": "F2", "enforcement_state": "UNARMED"}, {"id": "F3", "enforcement_state": "UNARMED"}],
                   "open_governor_decisions": [{"id": "O1"}, {"id": "O2"}], "refusal_register": [{"id": "R1"}],
                   "unresolved_material_findings_or_obligations": [{"id": "B1"}, {"id": "B2"}],
                   "promise_table": [{"proof_state": "INTENDED"}, {"proof_state": "INTENDED"}, {"proof_state": "DESIGNED"}, {"proof_state": "DESIGNED"}],
                   "most_recent_accepted_product_harvest": {"id": None}, "release_verification_status": {"state": "UNKNOWN"}}
        fx = tmp / "fixture-state.json"; fx.write_text(json.dumps(fixture), encoding="utf-8")
        ux = tmp / "fixture-ux.yaml"; ux.write_text("journeys:\n  - id: J-001\n    name: a\n    status: UX_READY\n  - id: J-002\n    name: b\n    status: IDENTIFIED\n", encoding="utf-8")
        rc, out = run([sys.executable, "-B", str(SEAM), "assess", "--state", str(fx), "--ux-manifest", str(ux), "--json"])
        if rc != 0:
            return rc, out
        got = json.loads(out)
        ok = (got["counts"] == {"fixed_decisions": 3, "open_governor_decisions": 2, "refusals": 1, "obligations": 2, "promises": 4}
              and got["enforcement_state_of_fixed_decisions"] == {"ARMED": 1, "UNARMED": 2}
              and got["promise_proof_states"] == {"INTENDED": 2, "DESIGNED": 2}
              and got["journeys"] == [{"id": "J-001", "status": "UX_READY"}, {"id": "J-002", "status": "IDENTIFIED"}])
        return (0 if ok else 1), out
    case("D-71", "the standing assessment reports exactly the counts planted in a fixture", "L-A20 anti-vacuous derivation self-test", d71, green())


    # -- OBL-GAL-013: the git layer must stand without the harness hook -------------------
    #
    # One ORDERED sequence against a single fresh checkout that has never been oriented and
    # carries no inherited local git configuration. Every case drives the REAL door: git
    # itself runs the hook through core.hooksPath, rather than the drill executing the hook
    # file, which is what D-52 … D-58 already do for hook CONTENT. Content and invocation are
    # different claims and this repository has now been wrong about the difference once.
    fc: dict = {}
    fc_rt = rt("fresh-checkout")
    FC = "drill-fresh-checkout"

    def fc_env(**extra):
        base = {"DOCTRINE_ROOT": str(root), "DOCTRINE_RUNTIME_DIR": str(fc_rt), "DOCTRINE_SESSION_ID": FC,
                "GIT_AUTHOR_NAME": "drill", "GIT_AUTHOR_EMAIL": "drill@example.invalid",
                "GIT_COMMITTER_NAME": "drill", "GIT_COMMITTER_EMAIL": "drill@example.invalid"}
        base.update(extra)
        return env(**base)

    def fc_repo() -> Path:
        if "path" not in fc:
            fc["path"] = scratch_project(tmp / "fresh-checkout", arm=False)
        return fc["path"]

    def fc_seam(*args, **extra):
        p = fc_repo()
        return run([sys.executable, "-B", str(p / "scripts" / "doctrine-orient.py"), *args],
                   e=fc_env(**extra), cwd=str(p))

    def fc_config():
        rc, out = run(["git", "-C", str(fc_repo()), "config", "--get", "core.hooksPath"], e=fc_env())
        return out.strip()

    def fc_stage(text):
        p = fc_repo()
        (p / "product").mkdir(parents=True, exist_ok=True)
        (p / "product" / "DRILL_PROBE.md").write_text(text + "\n", encoding="utf-8")
        run(["git", "-C", str(p), "add", "-A"], e=fc_env())

    def d73():
        got = fc_config()
        return (0 if got == "" else 1), f"core.hooksPath in a fresh checkout: {got!r} — expected empty"
    case("D-73", "a fresh checkout carries no core.hooksPath (the state the repair must handle)", "OBL-GAL-013 precondition", d73, green())

    def d74():
        rc, out = fc_seam("status")
        ok = "git hooks: UNARMED" in out and "repair: python3 scripts/doctrine-orient.py orient" in out
        return (0 if rc == 0 and ok else 1), out
    case("D-74", "an unarmed checkout is TRUTHFULLY REPORTED as unarmed, with its repair named", "a layer that is not in force must say so before anything relies on it", d74, green())

    case("D-75", "gate G3 before orientation → RED naming core.hooksPath", "a fail-closed hook git never runs enforces nothing",
         lambda: gate(fc_repo(), "G3"), fails("core.hooksPath is not configured"))

    def d76():
        rc, out = fc_seam("orient", "--quiet")
        if rc != 0:
            return rc, out
        got = fc_config()
        return (0 if got == ".githooks" else 1), f"orient exit {rc}; core.hooksPath is now {got!r}\n{out}"
    case("D-76", "the canonical orientation command establishes core.hooksPath in the fresh checkout", "OBL-GAL-013 repair: the seam arms the git layer, not the harness hook", d76, green())

    case("D-77", "gate G3 after orientation → PASS (anti-vacuous: the repair is what changed)", "the same gate that was red is now green for the stated reason",
         lambda: gate(fc_repo(), "G3"), green())

    def d78():
        fc_stage("probe")
        return run(["git", "-C", str(fc_repo()), "commit", "-m", "drill probe"], e=fc_env(DOCTRINE_SESSION_ID="foreign-session"))
    case("D-78", "REAL `git commit` with a foreign session receipt → refused through core.hooksPath", "the compulsory layer fires by git's own invocation, not the drill's", d78, fails("orientation invalid"))

    def d79():
        p = fc_repo()
        before = run(["git", "-C", str(p), "rev-list", "--count", "HEAD"], e=fc_env())[1].strip()
        rc, out = run(["git", "-C", str(p), "commit", "-m", "drill probe"], e=fc_env())
        after = run(["git", "-C", str(p), "rev-list", "--count", "HEAD"], e=fc_env())[1].strip()
        return (0 if rc == 0 and after != before else 1), f"commit exit {rc}; HEAD count {before} -> {after}\n{out}"
    case("D-79", "REAL `git commit` on a feature branch with valid orientation and green gates → allowed", "anti-vacuous: the legitimate commit still lands", d79, green())

    def d80():
        p = fc_repo()
        run(["git", "-C", str(p), "branch", "-M", "main"], e=fc_env())
        fc_stage("on main")
        return run(["git", "-C", str(p), "commit", "-m", "on main"], e=fc_env())
    case("D-80", "REAL `git commit` on the default branch → refused", "Canon Day Zero #6 on the compulsory commit path", d80, fails("direct commit on 'main'"))

    def d81():
        remote = bare_remote(tmp / "fc-remote.git")
        return run(["git", "-C", str(fc_repo()), "push", str(remote), "HEAD:refs/heads/main"], e=fc_env())
    case("D-81", "REAL `git push` to refs/heads/main → refused", "the default branch is reached through review", d81, fails("refs/heads/main"))

    def d82():
        remote = bare_remote(tmp / "builders-doctrine.git")
        return run(["git", "-C", str(fc_repo()), "push", str(remote), "HEAD:refs/heads/x"], e=fc_env())
    case("D-82", "REAL `git push` at a builders-doctrine remote → refused", "Commission v1.1 §3: the central Doctrine is read-only from here", d82, fails("read-only"))

    def d83():
        remote = bare_remote(tmp / "fc-remote.git")
        return run(["git", "-C", str(fc_repo()), "push", str(remote), "HEAD:refs/heads/feature"], e=fc_env())
    case("D-83", "REAL `git push` to a feature ref on an ordinary remote → allowed (anti-vacuous)", "prove ordinary work still reaches its branch", d83, green())

    def d84():
        p = fc_repo()
        fc_stage("deliberate bypass")
        before = run(["git", "-C", str(p), "rev-list", "--count", "HEAD"], e=fc_env())[1].strip()
        rc, out = run(["git", "-C", str(p), "commit", "--no-verify", "-m", "deliberate bypass"], e=fc_env())
        after = run(["git", "-C", str(p), "rev-list", "--count", "HEAD"], e=fc_env())[1].strip()
        landed = rc == 0 and after != before
        named = all("--no-verify" in (REPO / f).read_text(encoding="utf-8")
                    for f in (".github/workflows/doctrine.yml", "doctrine/EXTERNAL_ENABLEMENT.md"))
        return (0 if landed and named else 1), (
            f"--no-verify on the default branch landed={landed} (HEAD count {before} -> {after}); "
            f"named as a residue by the CI workflow and the external-enablement instrument={named}\n{out}")
    case("D-84", "`--no-verify` still bypasses the git layer, and the repository says so", "L-A16: a residue that is not written down is a claim that is not true", d84, green())

    def d85():
        p = fc_repo()
        run(["git", "-C", str(p), "config", "--unset", "core.hooksPath"], e=fc_env())
        return gate(p, "G3")
    case("D-85", "core.hooksPath removed after orientation → gate G3 goes RED", "the gate holds the live configuration, not a memory of it", d85, fails("core.hooksPath is not configured"))

    def d86():
        p = fc_repo()
        other = p / ".other-hooks"
        other.mkdir(exist_ok=True)
        for n in ("pre-commit", "pre-push"):
            t = other / n
            t.write_text("#!/bin/sh\nexit 0\n", encoding="utf-8")
            t.chmod(0o755)
        run(["git", "-C", str(p), "config", "core.hooksPath", ".other-hooks"], e=fc_env())
        return gate(p, "G3")
    case("D-86", "core.hooksPath displaced to a directory of permissive hooks → gate G3 goes RED", "contradictory configuration is not permission; present-and-executable is not the test", d86, fails("not to the governed"))

    def d87():
        rc, out = fc_seam("orient", "--quiet")
        if rc != 0:
            return rc, out
        return gate(fc_repo(), "G3")
    case("D-87", "re-running orientation repairs the displaced configuration and G3 returns green", "the repair path survives the absence it exists to repair", d87, green())

    return cases, prepare


def main() -> int:
    root = Path(os.environ.get("DOCTRINE_ROOT") or REPO.parent / "builders-doctrine").resolve()
    if not (root / "operating" / "doctrine_bootstrap.py").is_file():
        print(f"drill: Doctrine root not found at {root}", file=sys.stderr)
        return 2
    before = run(["git", "-C", str(root), "status", "--porcelain"])[1] + run(["git", "-C", str(root), "rev-parse", "HEAD"])[1]
    ARTIFACTS.mkdir(parents=True, exist_ok=True)
    tmp = Path(tempfile.mkdtemp(prefix="doctrine-drill-", dir=os.environ.get("DOCTRINE_DRILL_TMP")))
    results = []
    try:
        cases, prepare = build_cases(root, tmp)
        prepare()
        for cid, title, law, fn, expect in cases:
            try:
                rc, out = fn()
                v = expect.judge(rc, out)
            except Exception as exc:
                rc, out, v = -1, f"{exc.__class__.__name__}: {exc}", "STALE"
            (ARTIFACTS / f"{cid}.txt").write_text(f"{title}\nlaw: {law}\nexpectation: {expect.kind} {expect.kw}\nexit: {rc}\nverdict: {v}\n---\n{out}\n", encoding="utf-8")
            results.append({"id": cid, "title": title, "law": law, "exit": rc, "verdict": v,
                            "expected": f"{expect.kind}:{expect.kw.get('rule') or expect.kw.get('reason') or expect.kw.get('phrase') or 'exit 0'}"})
            print(f"{v:10s} {cid}  {title}")
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    after = run(["git", "-C", str(root), "status", "--porcelain"])[1] + run(["git", "-C", str(root), "rev-parse", "HEAD"])[1]
    v = "PASS" if before == after else "RED"
    print(f"{v:10s} D-72  the central Doctrine worktree is byte-for-byte unchanged by this drill")
    results.append({"id": "D-72", "title": "central Doctrine worktree unchanged", "law": "Commission §3 read-only", "exit": 0 if v == "PASS" else 1, "verdict": v, "expected": "unchanged"})
    counts = {k: sum(1 for r in results if r["verdict"] == k) for k in ("PASS", "DECORATIVE", "STALE", "RED")}
    summary = {"stamp": STAMP, "doctrine_root": str(root), "doctrine_head": after.strip().splitlines()[-1] if after.strip() else None,
               "counts": counts, "results": results}
    (ARTIFACTS / "SUMMARY.json").write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    print(f"drill: {counts} — artifacts in {ARTIFACTS}")
    return 0 if counts["PASS"] == len(results) else 1


if __name__ == "__main__":
    raise SystemExit(main())
