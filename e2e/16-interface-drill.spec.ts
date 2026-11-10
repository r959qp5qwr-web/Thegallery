import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { measure, type Standard } from "../kit/interface-standard/engine/measure";
import { CASES, DRILL_PROFILE } from "../kit/interface-standard/drill/cases";

// The engine's drill (rule 19: every check must be able to fail). Each case plants one defect in a
// small page; the engine must report the rule that owns it. The clean case must report nothing.
// No server and no test data: the pages are set in the browser directly.
const STANDARD = JSON.parse(readFileSync(join(process.cwd(), "kit/interface-standard/STANDARD.json"), "utf8")) as Standard;

for (const c of CASES) {
  test(`drill: ${c.id}`, async ({ page }) => {
    await page.route("**/*", (r) => r.fulfill({ status: 200, contentType: "text/html", body: c.html }));
    await page.goto("http://drill.invalid/screen");
    const found = await page.evaluate(measure, { standard: STANDARD, archetype: c.archetype, profile: { ...DRILL_PROFILE, ...c.profile } });
    const rules = [...new Set(found.map((f) => f.rule))];
    if (c.expect === null) expect(found.map((f) => `${f.rule}: ${f.measured} ${f.where}`), "a clean page has no finding").toEqual([]);
    else expect(rules, `the planted defect (${c.id}) must be caught by ${c.expect}`).toContain(c.expect);
  });
}
