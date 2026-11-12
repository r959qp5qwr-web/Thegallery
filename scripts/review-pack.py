#!/usr/bin/env python3
"""Build the pre-release review pack for outside reviewers (Gemini, Grok, a fresh Claude).

    python3 scripts/review-pack.py OUT_DIR [--screens test-results/interface-standard]

The pack is a snapshot of one commit: the tree must be clean, and the commit id goes into
MANIFEST.txt. Files are copied as text with path headers. Secrets are redacted, and the build
fails closed if a secret pattern or a real-looking email address remains after redaction.

Outputs:
  00-READ-FIRST.md         doctrine/review/REVIEW-BRIEF.md
  01-APP-SOURCE.md         application code, SQL, config, styles
  02-PRODUCT-AND-TESTS.md  product docs, product state, ledger, UX rules, journeys, probes
  03-SCREENS-{phone,desktop}.pdf  (only with --screens; made by tools/review-pack-screens.mjs)
  04-PROMPTS.md            doctrine/review/REVIEW-PROMPTS.md
  MANIFEST.txt             commit, files with sha256, omissions, scan result
"""
from __future__ import annotations

import argparse
import fnmatch
import hashlib
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

APP = [
    "src/**", "db/migrations/*.sql", "db/supabase-verify.sql", "db/cli.ts", "db/seed.ts",
    "public/gallery/*.css", "public/*.webmanifest", "worker-entry.ts", "wrangler.jsonc",
    "open-next.config.ts", "next.config.ts", "package.json", "tsconfig.json", ".env.example",
    "ux/APP_RULES.json", "ux/INTERFACE_PROFILE.json", "DEPLOY.md", "README.md",
]
PRODUCT = [
    "product/*.md", "product/decisions/*.md", "ux/UX_FOUNDATION.md", "ux/INTERFACE_FOUNDATION.md",
    "ux/UX_MANIFEST.yaml", "ux/journeys/*.md", "doctrine/PRODUCT_STATE.json",
    "doctrine/BUILD_LEARNING_LEDGER.md", "doctrine/EXTERNAL_ENABLEMENT.md",
    "kit/interface-standard/STANDARD.json", "kit/interface-standard/ESCAPES.md",
    "e2e/*.ts", "e2e/support/*", "e2e/run-hosted.sh", "tests/**", "playwright.config.ts",
    "doctrine/onboarding/FIRST-STUDIO-INSTRUCTIONS.md",
]
# Compiled WebAssembly codecs embedded as base64: unreadable, and hundreds of KB each.
OMIT = {
    "src/lib/wasm/jpeg-dec.ts": "base64-embedded JPEG decoder (@jsquash/jpeg build)",
    "src/lib/wasm/jpeg-enc.ts": "base64-embedded JPEG encoder (@jsquash/jpeg build)",
    "src/lib/wasm/resize.ts": "base64-embedded resizer (@jsquash/resize build)",
}
BINARY = re.compile(r"\.(png|jpe?g|webp|gif|ico|pdf|wasm|woff2?|ttf|otf|zip)$", re.I)

# Values that are not secret enough to break anything but have no business leaving the repo.
REDACT = [
    (re.compile(r"kiln-and-monsoon-9|warp-and-weft-11|operator-of-record-7"), "[redacted]"),
    (re.compile(r"sb_publishable_0KNPc4WopVsLNttgeBD43A_O6yyDiJd"), "sb_publishable_[test-project-redacted]"),
    (re.compile(r"fbgrumcwlnoljkkbiqfe"), "[test-project-ref]"),
]
# Anything matching these after redaction stops the build.
SECRETS = [
    ("supabase secret key", re.compile(r"sb_secret_[A-Za-z0-9_-]{10,}")),
    ("JWT", re.compile(r"eyJ[A-Za-z0-9_-]{15,}\.eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{10,}")),
    ("Resend key", re.compile(r"\bre_[A-Za-z0-9]{16,}")),
    ("private key", re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY-----")),
    ("password in URL", re.compile(r"postgres(?:ql)?://[^:\s/]+:[^@\s<]{3,}@(?!(?:127\.0\.0\.1|localhost)[:/])")),
    ("GitHub token", re.compile(r"\bgh[pousr]_[A-Za-z0-9]{30,}")),
    ("Cloudflare/API token", re.compile(r"(?i)(api[_-]?token|secret)\s*[:=]\s*['\"][A-Za-z0-9_-]{24,}['\"]")),
]
EMAIL = re.compile(r"[A-Za-z0-9._%+-]+@([A-Za-z0-9.-]+\.[A-Za-z]{2,})")
EMAIL_OK = re.compile(
    r"(^|\.)(example(\.(com|org|net|test))?|test|invalid|localhost|atthegallery\.in|"
    r"supabase\.co|supabase\.com|resend\.com|anthropic\.com|users\.noreply\.github\.com)$", re.I)


def git(*args: str) -> str:
    return subprocess.run(["git", *args], cwd=ROOT, check=True, capture_output=True, text=True).stdout


def select(patterns: list[str], tracked: list[str]) -> list[str]:
    out = []
    for f in tracked:
        if BINARY.search(f):
            continue
        if any(fnmatch.fnmatch(f, p) or (p.endswith("/**") and f.startswith(p[:-2])) for p in patterns):
            out.append(f)
    return sorted(set(out))


LANG = {".ts": "ts", ".tsx": "tsx", ".mjs": "js", ".js": "js", ".sql": "sql", ".css": "css",
        ".json": "json", ".jsonc": "jsonc", ".md": "markdown", ".yaml": "yaml", ".sh": "bash",
        ".py": "python"}


def bundle(title: str, intro: str, files: list[str], omitted: dict[str, str]) -> tuple[str, list[tuple[str, str]]]:
    parts = [f"# {title}\n\n{intro}\n\n## Files\n\n" + "\n".join(f"- `{f}`" for f in files) + "\n"]
    sums = []
    for f in files:
        if f in omitted:
            parts.append(f"\n---\n\n## `{f}`\n\nOmitted: {omitted[f]}.\n")
            continue
        text = (ROOT / f).read_text(encoding="utf-8", errors="replace")
        for pat, rep in REDACT:
            text = pat.sub(rep, text)
        sums.append((f, hashlib.sha256((ROOT / f).read_bytes()).hexdigest()))
        fence = "`" * max(3, max((len(m) for m in re.findall(r"`{3,}", text)), default=0) + 1)
        lang = LANG.get(Path(f).suffix, "")
        parts.append(f"\n---\n\n## `{f}`\n\n{fence}{lang}\n{text.rstrip()}\n{fence}\n")
    return "".join(parts), sums


def scan(name: str, text: str) -> list[str]:
    problems = []
    for label, pat in SECRETS:
        for m in pat.finditer(text):
            problems.append(f"{name}: {label}: {m.group(0)[:12]}…")
    for m in EMAIL.finditer(text):
        if not EMAIL_OK.search(m.group(1)):
            problems.append(f"{name}: email outside the synthetic/allowed domains: {m.group(0)}")
    return problems


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("out")
    ap.add_argument("--screens", help="folder holding phone/ and desktop/ PNGs from journey 15")
    ap.add_argument("--allow-dirty", action="store_true", help="for trying the script only; never for a pack you send")
    a = ap.parse_args()

    dirty = git("status", "--porcelain").strip()
    if dirty and not a.allow_dirty:
        print("refused: the working tree is not clean, so the pack would not match any commit\n" + dirty)
        return 2
    sha = git("rev-parse", "HEAD").strip()
    tracked = git("ls-files").splitlines()
    out = Path(a.out).resolve()
    out.mkdir(parents=True, exist_ok=True)

    app = select(APP, tracked)
    prod = select(PRODUCT, tracked)
    a_text, a_sums = bundle(
        "The Gallery — application source",
        f"Commit `{sha}`. Everything that runs: Next.js app, server actions, Supabase queries, SQL "
        "schema with row-level-security policies, storage policies, Worker config and styles.",
        app, OMIT)
    p_text, p_sums = bundle(
        "The Gallery — product, decisions and tests",
        f"Commit `{sha}`. What the product is meant to do (architecture, domain model, fixed "
        "decisions, refusals, promises), the incident ledger, the UX rules and every journey test.",
        prod, {})
    brief = (ROOT / "doctrine/review/REVIEW-BRIEF.md").read_text()
    prompts = (ROOT / "doctrine/review/REVIEW-PROMPTS.md").read_text()

    outputs = {"00-READ-FIRST.md": brief, "01-APP-SOURCE.md": a_text,
               "02-PRODUCT-AND-TESTS.md": p_text, "04-PROMPTS.md": prompts}
    problems = [p for n, t in outputs.items() for p in scan(n, t)]
    if problems:
        print("refused: the pack still holds secrets or real-looking emails after redaction:")
        print("\n".join(sorted(set(problems))))
        return 3
    for n, t in outputs.items():
        (out / n).write_text(t, encoding="utf-8")

    shots = ""
    if a.screens:
        r = subprocess.run(["node", str(ROOT / "tools/review-pack-screens.mjs"), a.screens, str(out)],
                           cwd=ROOT, capture_output=True, text=True)
        print(r.stdout.strip())
        if r.returncode != 0:
            print("refused: screens could not be rendered\n" + r.stderr)
            return 4
        shots = r.stdout.strip()

    man = [f"The Gallery review pack", f"commit {sha}", f"tree clean: {not dirty}",
           "secret and email scan: PASS (fail-closed patterns: " + ", ".join(l for l, _ in SECRETS) + ")",
           f"redacted: test-account passwords, test project key and ref", "",
           "omitted:"] + [f"  {f}: {why}" for f, why in OMIT.items()] + [
           "  binary files (images, fonts, PDFs, wasm), past receipts and handoffs", "",
           "sizes:"] + [f"  {n}: {len(t.encode()):,} bytes (~{len(t)//4:,} tokens)" for n, t in outputs.items()] + [
           "", "screens: " + (shots or "not included"), "", "files (sha256 of the committed file):"] + [
           f"  {h}  {f}" for f, h in a_sums + p_sums]
    (out / "MANIFEST.txt").write_text("\n".join(man) + "\n")
    print("\n".join(man[:12]))
    print(f"pack written to {out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
