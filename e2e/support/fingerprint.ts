import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();

// ------------------------------------------------------------------- the code this sweep saw
/** Files outside src/ and public/ that change what renders or how the sweep sees it. The gate
 *  (scripts/app-sweep-gate.py EXTRA_FILES) lists the same. */
export const EXTRA_FILES = ["ux/APP_RULES.json", "e2e/14-whole-app.spec.ts", "e2e/helpers.ts", "next.config.ts",
  "next.config.js", "next.config.mjs", "package.json", "package-lock.json",
  "ux/INTERFACE_PROFILE.json", "kit/interface-standard/STANDARD.json", "kit/interface-standard/engine/measure.ts",
  "e2e/15-interface-standard.spec.ts", "e2e/support/fingerprint.ts",
  "playwright.config.ts", "tsconfig.json", "open-next.config.ts", "e2e/support/test-project.sql",
  "e2e/16-interface-drill.spec.ts", "kit/interface-standard/drill/cases.ts",
  "e2e/support/seed-test-project.ts"];
/** The same fingerprint scripts/app-sweep-gate.py computes: every file of the app, its styles,
 *  the rules and this sweep, by path and content. A receipt is good only for exactly this code. */
export function codeFingerprint(): string {
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) walk(p); else files.push(relative(ROOT, p));
    }
  };
  walk(join(ROOT, "src")); walk(join(ROOT, "public")); walk(join(ROOT, "db/migrations"));
  files.push(...EXTRA_FILES.filter((f) => { try { return statSync(join(ROOT, f)).isFile(); } catch { return false; } }));
  const h = createHash("sha256");
  for (const f of files.map((f) => f.split("\\").join("/")).sort()) {
    h.update(f + "\0" + createHash("sha256").update(readFileSync(join(ROOT, f))).digest("hex") + "\n");
  }
  return h.digest("hex");
}

