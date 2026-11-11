import { test, expect, type Page, type BrowserContext } from "@playwright/test";
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { owner, signIn, MAKER_A, OPERATOR } from "./helpers";

// The whole-app sweep (governor, 2026-11-10: "a hook that scans through the full app … so that
// I don't have to bring you back these issues one off").
//
// Every page the app has is found from src/app/**/page.tsx, so a page cannot be left out: a page
// with no entry in VISIT below fails the sweep. Each is opened as the person who would see it
// (signed out, a maker, the operator) and every rule in ux/APP_RULES.json is applied to what
// renders. When every page passes, the sweep writes a receipt for the code it saw; the hook in
// scripts/app-sweep-gate.py refuses to open or merge a pull request without a passing receipt
// for both phone and desktop on exactly the current code.

const ROOT = process.cwd();
type Rule = { id: string; says: string; check: Record<string, unknown> & { kind: string } };
const RULES: Rule[] = JSON.parse(readFileSync(join(ROOT, "ux/APP_RULES.json"), "utf8")).rules;

// ---------------------------------------------------------------------------- the pages
function pagesOnDisk(): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) walk(p);
      else if (name === "page.tsx") out.push(relative(join(ROOT, "src/app"), dir));
    }
  };
  walk(join(ROOT, "src/app"));
  // Route groups such as (entrance) do not appear in the address.
  return out.map((d) => "/" + d.split("/").filter((s) => s && !/^\(.*\)$/.test(s)).join("/")).sort();
}

type Who = "visitor" | "maker" | "operator";
/** How each page is reached: who opens it, and the value for each dynamic segment. */
const VISIT: Record<string, { who: Who; path: (v: Values) => string; lands?: RegExp }> = {
  "/": { who: "visitor", path: () => "/" },
  "/about": { who: "visitor", path: () => "/about" },
  "/participation": { who: "visitor", path: () => "/participation" },
  "/privacy": { who: "visitor", path: () => "/privacy" },
  "/search": { who: "visitor", path: () => "/search?q=monsoon" },
  "/saved": { who: "visitor", path: () => "/saved" },
  "/workshops": { who: "visitor", path: () => "/workshops" },
  "/browse/[material]": { who: "visitor", path: () => "/browse/clay" },
  "/m/[handle]": { who: "visitor", path: () => "/m/anika-rao" },
  "/work/[token]": { who: "visitor", path: (v) => `/work/${v.token}` },
  "/makers": { who: "visitor", path: () => "/makers" },
  "/makers/create-account": { who: "visitor", path: () => "/makers/create-account" },
  "/makers/check-email": { who: "visitor", path: () => "/makers/check-email?e=someone%40makers.example" },
  "/makers/sign-in": { who: "visitor", path: () => "/makers/sign-in" },
  "/makers/reset": { who: "visitor", path: () => "/makers/reset" },
  "/makers/reset/[token]": { who: "visitor", path: () => "/makers/reset/not-a-real-token" },
  "/studio": { who: "maker", path: () => "/studio" },
  "/studio/settings": { who: "maker", path: () => "/studio/settings" },
  "/studio/profile": { who: "maker", path: () => "/studio/profile" },
  "/studio/contact-routes": { who: "maker", path: () => "/studio/contact-routes" },
  "/studio/account": { who: "maker", path: () => "/studio/account" },
  "/studio/whatsapp": { who: "maker", path: () => "/studio/whatsapp" },
  // A maker who already has a gallery is sent on to the Studio; the join screen itself is walked by journey 13.
  "/studio/join": { who: "maker", path: () => "/studio/join", lands: /^\/studio$/ },
  "/studio/works/new": { who: "maker", path: () => "/studio/works/new" },
  "/studio/works/[id]": { who: "maker", path: (v) => `/studio/works/${v.workId}` },
  "/operator": { who: "operator", path: () => "/operator" },
  "/operator/makers/[id]": { who: "operator", path: (v) => `/operator/makers/${v.makerId}` },
};
type Values = { token: string; workId: string; makerId: string };

// The code this sweep saw: one fingerprint shared with journey 15 and scripts/app-sweep-gate.py.
import { codeFingerprint } from "./support/fingerprint";

// ------------------------------------------------------------------------ the checks
type Finding = { rule: string; says: string; detail: string };

async function apply(page: Page, route: string): Promise<Finding[]> {
  return page.evaluate(({ rules, route }) => {
    const found: { rule: string; says: string; detail: string }[] = [];
    const seen = (el: Element) => {
      const e = el as HTMLElement;
      // Without checkVisibility the sweep cannot tell what is seen: it counts the element as seen,
      // so a rule never passes for lack of a browser feature.
      if (e.checkVisibility && !e.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) return false;
      const r = e.getBoundingClientRect();
      return r.width > 1 && r.height > 1;
    };
    // Folded text is read too: what a tap reveals is on the screen as much as what shows at rest.
    document.querySelectorAll("details").forEach((d) => { (d as HTMLDetailsElement).open = true; });
    // The words a person can see or hear: text in rendered, visible elements, line by line, and the
    // names given to controls and pictures.
    const lines: string[] = [];
    document.querySelectorAll("[aria-label], img[alt], [placeholder], [title]").forEach((el) => {
      for (const a of ["aria-label", "alt", "placeholder", "title"]) { const v = el.getAttribute(a); if (v?.trim()) lines.push(v.trim()); }
    });
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const t = walker.currentNode as Text; const parent = t.parentElement;
      if (!parent || /^(SCRIPT|STYLE|NOSCRIPT)$/.test(parent.tagName) || !t.textContent?.trim()) continue;
      if (seen(parent)) lines.push(t.textContent.replace(/\s+/g, " ").trim());
    }
    const text = lines.join("\n");
    const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
    const short = (s: string) => s.replace(/\s+/g, " ").trim().slice(0, 90);
    const where = (el: Element) => `<${el.tagName.toLowerCase()}${el.className ? ` class="${String((el as HTMLElement).className).slice(0, 40)}"` : ""}>`;

    for (const rule of rules) {
      const c = rule.check as Record<string, any>;
      const add = (detail: string) => found.push({ rule: rule.id, says: rule.says, detail });
      switch (c.kind) {
        case "text-absent": {
          const m = text.match(new RegExp(c.pattern, c.flags ?? ""));
          if (m) add(`"${short(m[0])}" in: ${short(lines.find((l) => new RegExp(c.pattern, (c.flags ?? "").replace("m", "")).test(l)) ?? m[0])}`);
          break;
        }
        case "mono-sentences": {
          for (const el of Array.from(document.body.querySelectorAll("*"))) {
            const own = Array.from(el.childNodes).filter((n) => n.nodeType === 3).map((n) => n.textContent ?? "").join(" ");
            // Words are runs of letters: a size line ("28 cm h · 19 cm w") or an address is not a sentence.
            const letters = (own.match(/[A-Za-z\u00C0-\u024F’']{2,}/g) ?? []).length;
            if (letters <= c.max_words || !seen(el)) continue;
            if (/mono/i.test(getComputedStyle(el).fontFamily)) add(`${where(el)} "${short(own)}"`);
          }
          break;
        }
        case "fake-controls": {
          for (const el of Array.from(document.querySelectorAll(".btn, .act"))) {
            if (!seen(el)) continue;
            if (!el.matches("a[href], button, summary, label[for], input")) add(`${where(el)} drawn as a button: "${short(el.textContent ?? "")}"`);
          }
          for (const use of Array.from(document.querySelectorAll('use[href="#i-chevron"]'))) {
            const svg = use.closest("svg");
            if (svg && seen(svg) && !svg.closest("a[href], button, summary, label")) add(`a chevron outside any link or button, beside "${short(svg.parentElement?.textContent ?? "")}"`);
          }
          break;
        }
        case "footer-links": {
          for (const a of Array.from(document.querySelectorAll("footer a[href]"))) {
            const p = new URL((a as HTMLAnchorElement).href).pathname;
            if (!c.allowed.includes(p)) add(`footer links to ${p}`);
          }
          break;
        }
        case "footer-tail": {
          const f = document.querySelector("footer.footer");
          // Screens that dock their own action keep room for it under the colophon; that room is by design.
          if (f && !document.querySelector(".workbar")) {
            const pad = parseFloat(getComputedStyle(f).paddingBottom);
            if (pad > c.max_px) add(`${Math.round(pad)} px of empty paper under the colophon (at most ${c.max_px})`);
          }
          break;
        }
        case "h1-count": {
          const n = document.querySelectorAll("h1").length;
          if (n !== c.exactly) add(`${n} h1 on the screen`);
          break;
        }
        case "solid-actions": {
          const n = Array.from(document.querySelectorAll(".btn.solid, .act.solid")).filter(seen).length;
          if (n > c.max) add(`${n} solid ink actions visible`);
          break;
        }
        case "no-overflow-x": {
          const d = document.documentElement;
          if (d.scrollWidth > d.clientWidth) add(`scrollWidth ${d.scrollWidth} > ${d.clientWidth}`);
          break;
        }
        case "has-back": {
          if (!(c.routes as string[]).some((r) => new RegExp(r).test(route))) break;
          // A visible control: Back (or the editor's Cancel). From 900 px the header's four places
          // are the way back on public screens, where Back steps aside.
          const back = Array.from(document.querySelectorAll('a[href][aria-label="Back"], button[aria-label="Back"], header a[href]'))
            .some((el) => seen(el) && (el.getAttribute("aria-label") === "Back" || /^\s*cancel\s*$/i.test(el.textContent ?? "")));
          const wideNav = window.innerWidth >= 900 && Array.from(document.querySelectorAll("header nav a[href]")).some(seen);
          if (!back && !wideNav) add("no visible Back on a screen reached from inside another");
          break;
        }
        case "has-links": {
          if (!(c.routes as string[]).some((r) => new RegExp(r).test(route))) break;
          for (const h of c.hrefs as string[]) {
            const there = Array.from(document.querySelectorAll(`main a[href^="${h}"]`)).some(seen);
            if (!there) add(`no visible link to ${h} on a screen that waits for an email`);
          }
          break;
        }
        case "paragraph-words": {
          for (const p of Array.from(document.querySelectorAll("p"))) {
            if (seen(p) && words(p.textContent ?? "") > c.max_words) add(`a paragraph of ${words(p.textContent ?? "")} words: "${short(p.textContent ?? "")}…"`);
          }
          break;
        }
        default: add(`unknown check kind ${c.kind}: the sweep cannot apply this rule`);
      }
    }
    return found;
  }, { rules: RULES, route });
}

// ------------------------------------------------------------------------ the sweep
test("every page the app has is in the sweep", async () => {
  const missing = pagesOnDisk().filter((p) => !VISIT[p]);
  expect(missing, "pages with no way into the sweep: add each to VISIT in e2e/14-whole-app.spec.ts").toEqual([]);
});

// One pass over the whole app: every page is visited and every finding is listed before the test
// fails, so one bad page never hides another.
test("the whole app keeps the governor's rules", async ({ browser, baseURL }, info) => {
  test.setTimeout(900_000);
  const w = (await owner((c) => c.query<{ id: string; public_token: string }>(
    "SELECT id, public_token FROM works WHERE title = 'Monsoon Vessel No. 4'"))).rows[0];
  const m = (await owner((c) => c.query<{ id: string }>("SELECT id FROM makers WHERE handle = 'anika-rao'"))).rows[0];
  const values: Values = { token: w.public_token, workId: w.id, makerId: m.id };
  const contexts: Partial<Record<Who, BrowserContext>> = {};
  const all = pagesOnDisk();
  const results: { route: string; path: string; findings: Finding[] }[] = [];
  const shots = join(ROOT, "test-results/app-sweep", info.project.name);
  mkdirSync(shots, { recursive: true });
  try {
    for (const route of all) {
      const visit = VISIT[route];
      if (!visit) { results.push({ route, path: "", findings: [{ rule: "SWEEP", says: "every page is swept", detail: "no entry in VISIT" }] }); continue; }
      let ctx = contexts[visit.who];
      if (!ctx) {
        ctx = await browser.newContext({ ...info.project.use, baseURL });
        contexts[visit.who] = ctx;
        if (visit.who !== "visitor") {
          const p = await ctx.newPage();
          const who = visit.who === "maker" ? MAKER_A : OPERATOR;
          await signIn(p, who.email, who.password);
          await p.close();
        }
      }
      const page = await ctx.newPage();
      const path = visit.path(values);
      try {
        const res = await page.goto(path, { waitUntil: "networkidle" });
        const findings: Finding[] = [];
        if (!res || res.status() >= 400) findings.push({ rule: "SWEEP", says: "every page answers", detail: `HTTP ${res?.status()}` });
        // The page swept must be the page asked for: a sign-in that failed would otherwise sweep the
        // sign-in screen in place of every Studio page and still pass.
        const landed = new URL(page.url()).pathname;
        const wanted = new URL(path, "http://x").pathname;
        if (visit.lands ? !visit.lands.test(landed) : landed !== wanted) {
          findings.push({ rule: "SWEEP", says: "the page swept is the page asked for", detail: `asked ${wanted}, landed on ${landed}` });
        }
        await page.screenshot({ path: join(shots, (route === "/" ? "home" : route.slice(1).replace(/[\/\[\]]/g, "_")) + ".png"), fullPage: true });
        findings.push(...await apply(page, new URL(page.url()).pathname));
        results.push({ route, path, findings });
      } catch (e) {
        results.push({ route, path, findings: [{ rule: "SWEEP", says: "every page opens", detail: String(e).slice(0, 160) }] });
      } finally {
        await page.close();
      }
    }
  } finally {
    for (const c of Object.values(contexts)) await c?.close();
    const bad = results.filter((r) => r.findings.length);
    const pass = results.length === all.length && bad.length === 0;
    mkdirSync(join(ROOT, ".doctrine/runtime"), { recursive: true });
    writeFileSync(join(ROOT, `.doctrine/runtime/app-sweep-${info.project.name}.json`), JSON.stringify({
      project: info.project.name, result: pass ? "PASS" : "FAIL", fingerprint: codeFingerprint(),
      pages: all.length, swept: results.length, rules: RULES.map((r) => r.id), at: new Date().toISOString(),
      findings: bad.map((r) => ({ route: r.route, path: r.path, findings: r.findings })),
    }, null, 2));
  }
  const report = results.flatMap((r) => r.findings.map((f) => `${r.path || r.route} — ${f.rule}: ${f.detail}`));
  expect(report, `${report.length} finding(s) across ${all.length} pages; receipt in .doctrine/runtime/`).toEqual([]);
});
