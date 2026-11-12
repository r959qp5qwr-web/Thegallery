// Contact sheets of every screen state journey 15 rendered, for the review pack.
//   node tools/review-pack-screens.mjs <shots-dir with phone/ and desktop/> <out-dir>
// Captions come from ux/INTERFACE_PROFILE.json so each picture names its state and route.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

const [shotsDir, outDir] = process.argv.slice(2).map((p) => resolve(p));
const profile = JSON.parse(readFileSync("ux/INTERFACE_PROFILE.json", "utf8"));
const byId = Object.fromEntries(profile.states.map((s) => [s.id, s]));
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

const browser = await chromium.launch();
const report = [];
for (const vp of ["phone", "desktop"]) {
  const dir = join(shotsDir, vp);
  if (!existsSync(dir)) throw new Error(`no screenshots in ${dir}`);
  const order = profile.states.map((s) => s.id);
  const files = readdirSync(dir).filter((f) => f.endsWith(".png"))
    .sort((a, b) => (order.indexOf(a.slice(0, -4)) + 1 || 999) - (order.indexOf(b.slice(0, -4)) + 1 || 999));
  const missing = order.filter((id) => !files.includes(`${id}.png`));
  const cols = vp === "phone" ? 3 : 1;
  const figs = files.map((f) => {
    const s = byId[f.slice(0, -4)] ?? {};
    return `<figure><img src="${pathToFileURL(join(dir, f))}"><figcaption><b>${esc(f.slice(0, -4))}</b> · ${esc(s.path)} · ${esc(s.who)} · ${esc(s.archetype)}${s.setup ? " · setup: " + esc(s.setup) : ""}</figcaption></figure>`;
  }).join("");
  const html = `<!doctype html><meta charset="utf-8"><style>
    body{font:11px/1.4 system-ui,sans-serif;margin:16px;color:#222}
    h1{font-size:16px;margin:0 0 4px} p{margin:0 0 12px}
    .g{display:grid;grid-template-columns:repeat(${cols},1fr);gap:14px}
    figure{margin:0;break-inside:avoid;page-break-inside:avoid}
    img{width:100%;border:1px solid #ccc;display:block} figcaption{margin-top:4px}
  </style><h1>The Gallery — every screen state, ${vp}</h1>
  <p>Rendered by journey 15 from the test project with synthetic makers. ${files.length} states.${missing.length ? " Not rendered: " + esc(missing.join(", ")) + "." : ""}</p>
  <div class="g">${figs}</div>`;
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "load" });
  await page.pdf({ path: join(outDir, `03-SCREENS-${vp}.pdf`), format: "A4", printBackground: true,
    margin: { top: "10mm", bottom: "10mm", left: "8mm", right: "8mm" } });
  await page.close();
  report.push(`${vp} ${files.length} states${missing.length ? `, missing ${missing.length}` : ""}`);
}
await browser.close();
console.log(report.join("; "));
