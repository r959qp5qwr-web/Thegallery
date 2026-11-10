import { test, expect } from "@playwright/test";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { measure, type Standard } from "../kit/interface-standard/engine/measure";
import { CASES, DRILL_PROFILE } from "../kit/interface-standard/drill/cases";
import { codeFingerprint } from "./support/fingerprint";

// The engine's drill (rule 19: every check must be able to fail). Each case plants one defect in a
// small page; the engine must report exactly the rules named — not fewer (blind), not more
// (trigger-happy). Clean pages must report nothing. No server and no test data: each page is served
// from memory. The receipt is required by scripts/app-sweep-gate.py.
const ROOT = process.cwd();
const STANDARD = JSON.parse(readFileSync(join(ROOT, "kit/interface-standard/STANDARD.json"), "utf8")) as Standard;

test("the engine catches every planted defect, and only that", async ({ browser }, info) => {
  const receipt = join(ROOT, `.doctrine/runtime/interface-drill-${info.project.name}.json`);
  mkdirSync(join(ROOT, ".doctrine/runtime"), { recursive: true });
  rmSync(receipt, { force: true });
  const failures: string[] = [];
  for (const c of CASES) {
    const ctx = await browser.newContext({ ...info.project.use });
    const page = await ctx.newPage();
    await page.route("**/*", (r) => r.fulfill({ status: 200, contentType: "text/html", body: c.html }));
    await page.goto("http://drill.invalid/screen");
    const found = await page.evaluate(measure, { standard: STANDARD, archetype: c.archetype, profile: { ...DRILL_PROFILE, ...c.profile } });
    await ctx.close();
    const got = [...new Set(found.map((f) => f.rule))].sort();
    const want = [...c.expect].sort();
    if (JSON.stringify(got) !== JSON.stringify(want))
      failures.push(`${c.id}: expected [${want.join(", ")}], got [${got.join(", ")}] — ${found.map((f) => `${f.rule}: ${f.measured} ${f.where}`).join(" | ")}`);
  }
  writeFileSync(receipt, JSON.stringify({
    project: info.project.name, result: failures.length ? "FAIL" : "PASS", fingerprint: codeFingerprint(),
    standard: STANDARD.version, pages: CASES.length, swept: CASES.length, at: new Date().toISOString(),
    findings: failures.map((f) => ({ route: "drill", findings: [{ detail: f }] })),
  }, null, 2));
  expect(failures, `${failures.length} of ${CASES.length} drill cases wrong`).toEqual([]);
});
