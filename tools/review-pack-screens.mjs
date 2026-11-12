// Contact sheets of every screen state journey 15 rendered, for the review pack.
//   node tools/review-pack-screens.mjs <shots-dir with phone/ and desktop/> <out-dir>
// Captions come from ux/INTERFACE_PROFILE.json so each picture names its state and route.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { chromium } from "playwright";
import sharp from "sharp";

const [shotsDir, outDir] = process.argv.slice(2).map((p) => resolve(p));
const profile = JSON.parse(readFileSync("ux/INTERFACE_PROFILE.json", "utf8"));
const byId = Object.fromEntries(profile.states.map((s) => [s.id, s]));
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

const browser = await chromium.launch();
const report = [];
for (const vp of ["phone", "desktop"]) {
  const dir = join(shotsDir, vp);
  if (!existsSync(dir)) throw new Error(`no screenshots in ${dir}`);
  // A captions.json ([{file, caption}]) overrides the journey-15 naming, for screen sets
  // assembled from other sources (live captures, earlier receipts) with their own labels.
  const captionsFile = join(dir, "captions.json");
  const listed = existsSync(captionsFile) ? JSON.parse(readFileSync(captionsFile, "utf8")) : null;
  const order = profile.states.map((s) => s.id);
  const files = listed ? listed.map((x) => x.file) : readdirSync(dir).filter((f) => f.endsWith(".png"))
    .sort((a, b) => (order.indexOf(a.slice(0, -4)) + 1 || 999) - (order.indexOf(b.slice(0, -4)) + 1 || 999));
  const missing = listed ? [] : order.filter((id) => !files.includes(`${id}.png`));
  const cols = vp === "phone" ? 3 : 1;
  // Inline as data URIs: a page set with setContent is about:blank and may not load file:// URLs.
  // JPEG at 2x print width keeps text legible and the PDF small enough for chat uploads.
  const width = vp === "phone" ? 520 : 1600;
  const data = await Promise.all(files.map(async (f) =>
    (await sharp(readFileSync(join(dir, f))).resize({ width, withoutEnlargement: true }).flatten({ background: "#ffffff" }).jpeg({ quality: 78 }).toBuffer()).toString("base64")));
  const figs = files.map((f, i) => {
    const img = `<img src="data:image/jpeg;base64,${data[i]}">`;
    if (listed) return `<figure>${img}<figcaption>${esc(listed[i].caption)}</figcaption></figure>`;
    const s = byId[f.slice(0, -4)] ?? {};
    return `<figure>${img}<figcaption><b>${esc(f.slice(0, -4))}</b> · ${esc(s.path)} · ${esc(s.who)} · ${esc(s.archetype)}${s.setup ? " · setup: " + esc(s.setup) : ""}</figcaption></figure>`;
  }).join("");
  const html = `<!doctype html><meta charset="utf-8"><style>
    body{font:11px/1.4 system-ui,sans-serif;margin:16px;color:#222}
    h1{font-size:16px;margin:0 0 4px} p{margin:0 0 12px}
    .g{display:grid;grid-template-columns:repeat(${cols},1fr);gap:14px}
    figure{margin:0;break-inside:avoid;page-break-inside:avoid}
    img{width:100%;border:1px solid #ccc;display:block} figcaption{margin-top:4px}
  </style><h1>The Gallery — every screen state, ${vp}</h1>
  <p>${listed ? "Assembled set: each caption names its source and date. Synthetic makers only; no real person's art." : "Rendered by journey 15 from the test project with synthetic makers."} ${files.length} screens.${missing.length ? " Not rendered: " + esc(missing.join(", ")) + "." : ""}</p>
  <div class="g">${figs}</div>`;
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "load" });
  // Fail closed: a contact sheet of broken-image icons once passed as a 42-screen PDF.
  const broken = await page.$$eval("img", (is) => is.filter((i) => !i.complete || i.naturalWidth < 100).length);
  if (broken) throw new Error(`${broken} of ${files.length} ${vp} screenshots did not load`);
  await page.pdf({ path: join(outDir, `03-SCREENS-${vp}.pdf`), format: "A4", printBackground: true,
    margin: { top: "10mm", bottom: "10mm", left: "8mm", right: "8mm" } });
  await page.close();
  report.push(`${vp} ${files.length} states${missing.length ? `, missing ${missing.length}` : ""}`);
}
await browser.close();
console.log(report.join("; "));
