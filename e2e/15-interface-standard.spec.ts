import { test, expect, type Browser, type BrowserContext, type Page } from "@playwright/test";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { owner, signIn, sql, linkFromOutbox, forgetPerson, MAKER_A, OPERATOR } from "./helpers";
import { codeFingerprint } from "./support/fingerprint";
import { measure, type Standard, type Profile, type Finding } from "../kit/interface-standard/engine/measure";

// The Interface Standard (governor, 2026-11-10: "a mechanism level solution, that's replicable,
// rigid, and learns from itself"). Every screen STATE in ux/INTERFACE_PROFILE.json is opened as
// its viewer and measured by the engine against kit/interface-standard/STANDARD.json, plus axe at
// WCAG 2.2 AA. Numbers, not taste. Fail-closed: a page with no state, an unknown archetype, viewer
// or setup, a setup that did not take, a state that lands anywhere but the address asked for, a
// loosening override — each is a finding in the receipt, which scripts/app-sweep-gate.py requires.

const ROOT = process.cwd();
type State = { id: string; page: string; who: string; path: string; archetype: string; setup?: string; status?: number };
const PROFILE = JSON.parse(readFileSync(join(ROOT, "ux/INTERFACE_PROFILE.json"), "utf8")) as Profile & { standard: string; states: State[];
  overrides: Record<string, unknown>; unmeasured?: { file: string; why: string }[] };
const STANDARD = JSON.parse(readFileSync(join(ROOT, PROFILE.standard), "utf8")) as Standard & { override_direction: Record<string, "floor" | "ceiling"> };
const AXE = readFileSync(join(ROOT, "node_modules/axe-core/axe.min.js"), "utf8");
const JOINER = { email: "standard.joiner@makers.example", password: "standard-joiner-pass-1" };
const VIEWERS = ["visitor", "maker", "operator", "joiner", "joiner-named"];
// Each setup and what must be true once it has run; a setup that did not take is a finding.
const SETUPS: Record<string, (p: Page) => Promise<string | null>> = {
  "no-works-on-view": async (p) => (await p.locator("a[href^='/work/']").count()) ? "works still on view" : null,
  "open-folds": async (p) => (await p.locator("details:not([open])").count()) || !(await p.locator("details[open]").count()) ? "folds not open" : null,
  // Checked against the count before the submit (recorded in ERRORS_BEFORE), inside main only.
  "submit-empty": async (p) => (await p.locator("main [aria-invalid=true], main .err").count()) > ERRORS_BEFORE ? null : "no error shown after an empty submit",
};
const PENDING = join(ROOT, ".doctrine/runtime/interface-pending-restore.json");
let ERRORS_BEFORE = 0;

/** A profile may raise a floor or lower a ceiling, for the numeric keys the standard lists. */
function applyOverrides(): string[] {
  const errs: string[] = [];
  for (const [id, o] of Object.entries(PROFILE.overrides ?? {})) {
    const r = STANDARD.rules.find((x) => x.id === id);
    if (!r) { errs.push(`override of unknown rule ${id}`); continue; }
    if (!o || typeof o !== "object" || Array.isArray(o)) { errs.push(`override of ${id} is not an object of numbers`); continue; }
    for (const [k, v] of Object.entries(o as Record<string, unknown>)) {
      const dir = STANDARD.override_direction?.[k]; const was = r.check[k];
      if (!dir || typeof v !== "number" || typeof was !== "number") { errs.push(`override ${id}.${k} is not a numeric floor or ceiling`); continue; }
      if (dir === "floor" ? v < was : v > was) { errs.push(`override would loosen ${id}.${k} (${was} → ${v})`); continue; }
      r.check[k] = v;
    }
  }
  return errs;
}

/** Every screen file the app has: pages, and the not-found, error and loading screens. */
function screensOnDisk(): { pages: string[]; special: string[] } {
  const special: string[] = [];
  const walk = (dir: string) => { for (const n of readdirSync(dir)) { const p = join(dir, n);
    if (statSync(p).isDirectory()) walk(p);
    else if (/^(not-found|error|global-error|loading)\.tsx$/.test(n)) special.push(relative(ROOT, p)); } };
  walk(join(ROOT, "src/app"));
  return { pages: pagesOnDisk(), special };
}
/** The address pattern a page answers to: "/work/[token]" -> ^/work/[^/]+$ */
const pagePattern = (page: string) => new RegExp("^" + page.replace(/\[[^\]]+\]/g, "[^/]+").replace(/\//g, "\\/") + "$");

function pagesOnDisk(): string[] {
  const out: string[] = [];
  const walk = (dir: string) => { for (const n of readdirSync(dir)) { const p = join(dir, n);
    if (statSync(p).isDirectory()) walk(p); else if (n === "page.tsx") out.push(relative(join(ROOT, "src/app"), dir)); } };
  walk(join(ROOT, "src/app"));
  return out.map((d) => "/" + d.split("/").filter((s) => s && !/^\(.*\)$/.test(s)).join("/")).sort();
}

/** Works hidden for the empty-home state are put back even if an earlier run was killed mid-state. */
async function restorePending() {
  if (!existsSync(PENDING)) return;
  const ids = JSON.parse(readFileSync(PENDING, "utf8")) as string[];
  for (const id of ids) await sql("UPDATE works SET taken_down = false WHERE id = $1", [id]);
  rmSync(PENDING);
}

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
  const receipt = join(ROOT, `.doctrine/runtime/interface-${info.project.name}.json`);
  mkdirSync(join(ROOT, ".doctrine/runtime"), { recursive: true });
  rmSync(receipt, { force: true });                       // no earlier PASS survives this run
  const build = readFileSync(join(ROOT, ".next/BUILD_ID"), "utf8").trim();
  const served = await (await fetch(new URL("/about", baseURL))).text();
  const results: { id: string; path: string; archetype: string; findings: Finding[] }[] = [];
  const meta = (id: string, measured: string) => results.push({ id, path: "", archetype: "-", findings: [{ rule: "PROFILE", says: "the profile covers the app and is well formed", measured, where: "" }] });
  if (!served.includes(build)) meta("server", `the server at ${baseURL} is not serving build ${build}`);
  const stamp = existsSync(join(ROOT, ".next/SOURCE_FINGERPRINT")) ? readFileSync(join(ROOT, ".next/SOURCE_FINGERPRINT"), "utf8").trim() : "";
  if (stamp !== codeFingerprint()) meta("build", "the build is not of this code (rebuild with npm run build)");
  for (const e of applyOverrides()) meta("overrides", e);
  const listed = new Set(PROFILE.states.map((s) => s.page));
  const disk = screensOnDisk();
  for (const p of disk.pages.filter((p) => !listed.has(p))) meta(p, "a page with no state in ux/INTERFACE_PROFILE.json");
  for (const p of [...listed].filter((p) => p !== "(not-found)" && !disk.pages.includes(p))) meta(p, "a state for a page that no longer exists");
  // A not-found, error or loading screen is measured as a state, or declared unmeasured with a reason.
  const declared = new Set([...(PROFILE.unmeasured ?? []).map((u) => u.file), ...PROFILE.states.filter((s) => s.page === "(not-found)").map(() => "src/app/not-found.tsx")]);
  for (const f of disk.special.filter((f) => !declared.has(f))) meta(f, "a screen file neither measured nor declared unmeasured");
  const ids = PROFILE.states.map((s) => s.id);
  for (const d of ids.filter((x, i) => ids.indexOf(x) !== i)) meta(d, "a duplicate state id");
  for (const s of PROFILE.states) {
    if (!STANDARD.archetypes[s.archetype]) meta(s.id, `unknown archetype ${s.archetype}`);
    if (!VIEWERS.includes(s.who)) meta(s.id, `unknown viewer ${s.who}`);
    if (s.setup && !SETUPS[s.setup]) meta(s.id, `unknown setup ${s.setup}`);
  }

  await restorePending();
  const w = (await owner((c) => c.query<{ id: string; public_token: string }>(
    "SELECT id, public_token FROM works WHERE title = 'Monsoon Vessel No. 4'"))).rows[0];
  const m = (await owner((c) => c.query<{ id: string }>("SELECT id FROM makers WHERE handle = 'anika-rao'"))).rows[0];
  const ended = (await owner((c) => c.query<{ public_token: string }>(
    "SELECT public_token FROM works WHERE title = 'Unfinished Warp'"))).rows[0];
  const fill = (p: string) => p.replace("{token}", w.public_token).replace("{workId}", w.id).replace("{makerId}", m.id)
    .replace("{retiredToken}", ended.public_token);
  const ctxs: Record<string, BrowserContext> = {};
  const shots = join(ROOT, "test-results/interface-standard", info.project.name);
  mkdirSync(shots, { recursive: true });
  const axeTags = (STANDARD.rules.find((r) => r.check.kind === "axe")?.check.tags ?? []) as string[];
  const write = () => {
    const bad = results.filter((r) => r.findings.length);
    const measured = results.filter((r) => r.archetype !== "-").length;
    const pass = measured === PROFILE.states.length && bad.length === 0;
    writeFileSync(receipt, JSON.stringify({
      project: info.project.name, result: pass ? "PASS" : "FAIL", fingerprint: codeFingerprint(), build, base_url: baseURL,
      standard: STANDARD.version, pages: PROFILE.states.length, swept: measured,
      rules: STANDARD.rules.map((r) => r.id), at: new Date().toISOString(),
      findings: bad.map((r) => ({ route: r.id, path: r.path, archetype: r.archetype, findings: r.findings })),
    }, null, 2));
  };
  await forgetPerson(JOINER.email);
  try {
    for (const s of PROFILE.states.filter((s) => STANDARD.archetypes[s.archetype] && VIEWERS.includes(s.who) && (!s.setup || SETUPS[s.setup]))) {
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
              await signIn(p, ...(s.who === "maker" ? [MAKER_A.email, MAKER_A.password] : [OPERATOR.email, OPERATOR.password]) as [string, string]);
              await p.close();
            }
          }
        }
        if (s.setup === "no-works-on-view") {
          const ids = (await sql<{ id: string }>("SELECT id FROM works WHERE taken_down = false")).map((r) => r.id);
          writeFileSync(PENDING, JSON.stringify(ids));          // written before the change, so a killed run is undone next time
          for (const id of ids) await sql("UPDATE works SET taken_down = true WHERE id = $1", [id]);
          restore = restorePending;
        }
        page = await ctxs[s.who].newPage();
        const path = fill(s.path);
        const res = await page.goto(path, { waitUntil: "networkidle" });
        const expected = s.status ?? 200;
        if (!res || (expected === 200 ? res.status() >= 400 : res.status() !== expected)) findings.push({ rule: "STATE", says: "every state opens as declared", measured: `HTTP ${res?.status()} (expected ${expected})`, where: path });
        const got = new URL(page.url()), want = new URL(path, "http://x");
        if (s.page !== "(not-found)" && !pagePattern(s.page).test(want.pathname)) findings.push({ rule: "STATE", says: "a state measures the page it names", measured: `${want.pathname} is not ${s.page}`, where: "" });
        if (got.pathname + got.search !== want.pathname + want.search) findings.push({ rule: "STATE", says: "the state measured is the state asked for", measured: `asked ${want.pathname + want.search}, landed on ${got.pathname + got.search}`, where: "" });
        if (s.setup === "open-folds") await page.evaluate(() => document.querySelectorAll("details").forEach((d) => (d.open = true)));
        if (s.setup === "submit-empty") {
          ERRORS_BEFORE = await page.locator("main [aria-invalid=true], main .err").count();
          // The browser's own validation would stop the submit before the product could answer.
          await page.evaluate(() => document.querySelectorAll("main form").forEach((f) => ((f as HTMLFormElement).noValidate = true)));
          await page.locator(PROFILE.primary_selector).first().click(); await page.waitForTimeout(800);
          const after = new URL(page.url());
          if (after.pathname + after.search !== want.pathname + want.search) findings.push({ rule: "STATE", says: "an empty submit stays on its step", measured: `moved to ${after.pathname + after.search}`, where: "" });
        }
        if (s.setup) { const miss = await SETUPS[s.setup](page); if (miss) findings.push({ rule: "STATE", says: "the setup took", measured: `${s.setup}: ${miss}`, where: "" }); }
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
        if (restore) await restore();                         // before anything else that could throw
        await page?.close().catch(() => {});
      }
      results.push({ id: s.id, path: s.path, archetype: s.archetype, findings });
    }
  } finally {
    write();                                                  // the receipt first; cleanup after
    await restorePending();
    for (const c of Object.values(ctxs)) await c.close().catch(() => {});
    await forgetPerson(JOINER.email);
  }
  const report = results.flatMap((r) => r.findings.map((f) => `${r.id} (${r.archetype}) — ${f.rule}: ${f.measured}${f.where ? ` @ ${f.where}` : ""}`));
  expect(report, `${report.length} finding(s) across ${PROFILE.states.length} states; receipt in .doctrine/runtime/`).toEqual([]);
});
