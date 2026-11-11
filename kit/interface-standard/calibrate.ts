// Calibration: run the engine on named outside references before trusting it on a product.
// A reference is a screen widely held up as good practice for its archetype. Findings on a
// reference are read one by one: an engine error (it measured the wrong thing) is fixed in the
// engine; a house rule stricter than the reference is expected and recorded as such. The result
// is written to kit/interface-standard/CALIBRATION.json and named in every receipt.
//
//   node --experimental-strip-types kit/interface-standard/calibrate.ts
import { chromium, devices } from "playwright";
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { measure, type Standard } from "./engine/measure.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const STANDARD = JSON.parse(readFileSync(join(HERE, "STANDARD.json"), "utf8")) as Standard;
const REFS = JSON.parse(readFileSync(join(HERE, "REFERENCES.json"), "utf8")) as { refs: { id: string; url: string; archetype: string; why: string; profile: any }[] };

const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined;
const browser = await chromium.launch({ proxy, executablePath: process.env.PLAYWRIGHT_CHROMIUM || undefined });
const out: any[] = [];
try {
  for (const [vp, use] of [["phone", devices["Pixel 7"]], ["desktop", { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 900 } }]] as const) {
    const ctx = await browser.newContext({ ...use, ignoreHTTPSErrors: true });
    for (const r of REFS.refs) {
      const page = await ctx.newPage();
      try {
        await page.goto(r.url, { waitUntil: "networkidle", timeout: 45_000 });
        const f = await page.evaluate(measure, { standard: STANDARD, archetype: r.archetype, profile: r.profile });
        out.push({ ref: r.id, viewport: vp, url: r.url, findings: f });
        console.log(`${vp.padEnd(8)} ${r.id.padEnd(24)} ${f.length} finding(s)`);
      } catch (e) {
        out.push({ ref: r.id, viewport: vp, url: r.url, error: String(e).slice(0, 160) });
        console.log(`${vp.padEnd(8)} ${r.id.padEnd(24)} ERROR ${String(e).slice(0, 80)}`);
      } finally { await page.close(); }
    }
    await ctx.close();
  }
} finally { await browser.close(); }
writeFileSync(join(HERE, "CALIBRATION.json"), JSON.stringify({ standard: STANDARD.version, at: new Date().toISOString(), results: out }, null, 1));
