import { test, expect, type Browser, type BrowserContext, type Page } from "@playwright/test";
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { owner, signIn, sql, linkFromOutbox, forgetPerson, MAKER_A, OPERATOR } from "./helpers";
import { codeFingerprint } from "./support/fingerprint";
import { measure, type Standard, type Profile, type Finding } from "../kit/interface-standard/engine/measure";

// The Interface Standard (governor, 2026-11-10: "a mechanism level solution, that's replicable,
// rigid, and learns from itself"). Every screen STATE in ux/INTERFACE_PROFILE.json is opened as
// its viewer and measured by the engine against kit/interface-standard/STANDARD.json: type floors,
// line height and length, target size, Back by archetype, one primary action, form rhythm, side
// margins, the spacing grid, and axe under WCAG 2.2 AA with target-size on. Numbers, not taste.
// A page with no state fails; a state that lands somewhere else fails. The receipt it writes is
// required by scripts/app-sweep-gate.py beside the whole-app sweep's.

const ROOT = process.cwd();
type State = { id: string; page: string; who: string; path: string; archetype: string; setup?: string };
const PROFILE = JSON.parse(readFileSync(join(ROOT, "ux/INTERFACE_PROFILE.json"), "utf8")) as Profile & { standard: string; states: State[]; overrides: Record<string, Record<string, number>> };
const STANDARD = JSON.parse(readFileSync(join(ROOT, PROFILE.standard), "utf8")) as Standard;
// A profile may only make a rule stricter: numbers that are floors may rise, ceilings may fall.
for (const [id, o] of Object.entries(PROFILE.overrides ?? {})) {
  const r = STANDARD.rules.find((x) => x.id === id);
  if (!r) throw new Error(`profile overrides unknown rule ${id}`);
  for (const [k, v] of Object.entries(o)) {
    const was = r.check[k] as number; const ceiling = /^max/.test(k);
    if (ceiling ? v > was : v < was) throw new Error(`profile would loosen ${id}.${k} (${was} → ${v})`);
    r.check[k] = v;
  }
}
const AXE = readFileSync(join(ROOT, "node_modules/axe-core/axe.min.js"), "utf8");
const JOINER = { email: "standard.joiner@makers.example", password: "standard-joiner-pass-1" };

function pagesOnDisk(): string[] {
  const out: string[] = [];
  const walk = (dir: string) => { for (const n of readdirSync(dir)) { const p = join(dir, n);
    if (statSync(p).isDirectory()) walk(p); else if (n === "page.tsx") out.push(relative(join(ROOT, "src/app"), dir)); } };
  walk(join(ROOT, "src/app"));
  return out.map((d) => "/" + d.split("/").filter((s) => s && !/^\(.*\)$/.test(s)).join("/")).sort();
}

test("every page has at least one state in the interface profile", async () => {
  const listed = new Set(PROFILE.states.map((s) => s.page));
  expect(pagesOnDisk().filter((p) => !listed.has(p)), "pages with no state in ux/INTERFACE_PROFILE.json").toEqual([]);
  expect(PROFILE.states.filter((s) => !STANDARD.archetypes[s.archetype]).map((s) => s.id), "states with an unknown archetype").toEqual([]);
});

async function joinerContext(browser: Browser, use: object, baseURL: string, named: boolean): Promise<BrowserContext> {
  const ctx = await browser.newContext({ ...use, baseURL });
  const p = await ctx.newPage();
  await p.goto("/makers/create-account");
  await p.getByLabel("Email").fill(JOINER.email);
  await p.getByLabel("Password").fill(JOINER.password);
  await p.getByRole("button", { name: "Continue" }).click();
  await p.getByRole("heading", { name: "Check your email" }).waitFor();
  await p.goto(await linkFromOutbox(JOINER.email, "/makers/confirm/"));
  await p.waitForURL(/\/studio\/join$/);
  if (named) {
    await p.getByLabel("Name").fill("Standard Joiner");
    await p.getByLabel("Place").fill("Khurja");
    await p.getByRole("button", { name: "Continue" }).click();
    await p.waitForURL(/\/studio\/whatsapp/);
  }
  await p.close();
  return ctx;
}

test("every screen state meets the Interface Standard", async ({ browser, baseURL }, info) => {
  test.setTimeout(1_200_000);
  const w = (await owner((c) => c.query<{ id: string; public_token: string }>(
    "SELECT id, public_token FROM works WHERE title = 'Monsoon Vessel No. 4'"))).rows[0];
  const m = (await owner((c) => c.query<{ id: string }>("SELECT id FROM makers WHERE handle = 'anika-rao'"))).rows[0];
  const fill = (p: string) => p.replace("{token}", w.public_token).replace("{workId}", w.id).replace("{makerId}", m.id);
  const ctxs: Record<string, BrowserContext> = {};
  const results: { id: string; path: string; archetype: string; findings: Finding[] }[] = [];
  const shots = join(ROOT, "test-results/interface-standard", info.project.name);
  mkdirSync(shots, { recursive: true });
  const axeTags = (STANDARD.rules.find((r) => r.check.kind === "axe")?.check.tags ?? []) as string[];
  await forgetPerson(JOINER.email);
  try {
    for (const s of PROFILE.states) {
      const findings: Finding[] = [];
      let page: Page | undefined; let restore: (() => Promise<void>) | undefined;
      try {
        if (!ctxs[s.who]) {
          if (s.who === "joiner" || s.who === "joiner-named") {
            await forgetPerson(JOINER.email);
            ctxs[s.who] = await joinerContext(browser, info.project.use, baseURL!, s.who === "joiner-named");
          } else {
            ctxs[s.who] = await browser.newContext({ ...info.project.use, baseURL });
            if (s.who !== "visitor") {
              const p = await ctxs[s.who].newPage();
              const who = s.who === "maker" ? MAKER_A : OPERATOR;
              await signIn(p, who.email, who.password); await p.close();
            }
          }
        }
        if (s.setup === "no-works-on-view") {
          const ids = (await sql<{ id: string }>("SELECT id FROM works WHERE taken_down = false")).map((r) => r.id);
          if (ids.length) await sql(`UPDATE works SET taken_down = true WHERE id IN (${ids.map((_, i) => `$${i + 1}`).join(",")})`, ids);
          restore = async () => { if (ids.length) await sql(`UPDATE works SET taken_down = false WHERE id IN (${ids.map((_, i) => `$${i + 1}`).join(",")})`, ids); };
        }
        page = await ctxs[s.who].newPage();
        const path = fill(s.path);
        const res = await page.goto(path, { waitUntil: "networkidle" });
        if (!res || res.status() >= 400) findings.push({ rule: "STATE", says: "every state opens", measured: `HTTP ${res?.status()}`, where: path });
        const landed = new URL(page.url()).pathname, wanted = new URL(path, "http://x").pathname;
        if (landed !== wanted) findings.push({ rule: "STATE", says: "the state measured is the state asked for", measured: `asked ${wanted}, landed on ${landed}`, where: "" });
        if (s.setup === "open-folds") await page.evaluate(() => document.querySelectorAll("details").forEach((d) => (d.open = true)));
        if (s.setup === "submit-empty") { await page.locator(PROFILE.primary_selector).first().click(); await page.waitForTimeout(600); }
        await page.mouse.move(0, 0);
        findings.push(...await page.evaluate(measure, { standard: STANDARD, archetype: s.archetype, profile: PROFILE }));
        if (axeTags.length) {
          await page.addScriptTag({ content: AXE });
          const v = await page.evaluate(async (tags) => (await (window as any).axe.run(document, { runOnly: tags }))
            .violations.map((x: any) => `${x.id} ×${x.nodes.length}: ${x.nodes[0]?.target?.join(" ")}`), axeTags);
          const rule = STANDARD.rules.find((r) => r.check.kind === "axe")!;
          for (const x of v) findings.push({ rule: rule.id, says: rule.says, measured: x, where: "" });
        }
        await page.screenshot({ path: join(shots, `${s.id}.png`) });
      } catch (e) {
        findings.push({ rule: "STATE", says: "every state opens", measured: String(e).slice(0, 200), where: s.path });
      } finally {
        await page?.close();
        if (restore) await restore();
      }
      results.push({ id: s.id, path: s.path, archetype: s.archetype, findings });
    }
  } finally {
    for (const c of Object.values(ctxs)) await c.close();
    await forgetPerson(JOINER.email);
    const bad = results.filter((r) => r.findings.length);
    const pass = results.length === PROFILE.states.length && bad.length === 0;
    mkdirSync(join(ROOT, ".doctrine/runtime"), { recursive: true });
    writeFileSync(join(ROOT, `.doctrine/runtime/interface-${info.project.name}.json`), JSON.stringify({
      project: info.project.name, result: pass ? "PASS" : "FAIL", fingerprint: codeFingerprint(),
      standard: STANDARD.version, pages: PROFILE.states.length, swept: results.length,
      rules: STANDARD.rules.map((r) => r.id), at: new Date().toISOString(),
      findings: bad.map((r) => ({ route: r.id, path: r.path, archetype: r.archetype, findings: r.findings })),
    }, null, 2));
  }
  const report = results.flatMap((r) => r.findings.map((f) => `${r.id} (${r.archetype}) — ${f.rule}: ${f.measured}${f.where ? ` @ ${f.where}` : ""}`));
  expect(report, `${report.length} finding(s) across ${PROFILE.states.length} states; receipt in .doctrine/runtime/`).toEqual([]);
});
