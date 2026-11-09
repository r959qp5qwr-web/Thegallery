import { createRequire } from "node:module"; const { chromium } = createRequire(import.meta.url)("playwright");
import http from "node:http"; import fs from "node:fs"; import path from "node:path";
const root = process.argv[2], out = process.argv[3]; fs.mkdirSync(out, { recursive: true });
const types = { ".css": "text/css", ".html": "text/html", ".jpg": "image/jpeg", ".woff2": "font/woff2" };
const srv = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split("?")[0]));
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { "content-type": types[path.extname(f)] ?? "application/octet-stream" }); r.end(d); }); }).listen(4556);
const b = await chromium.launch();
const pages = (process.argv[4] ?? "entrance-empty,menu,entrance,work,maker,for-makers").split(",");
for (const [w, h] of [[390, 844], [1440, 900]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  for (const n of pages) {
    if (n === "menu" && w > 900) continue;
    await p.goto(`http://127.0.0.1:4556/${n}.html`); await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: `${out}/${n}-${w}-fold.png` });
    if (n !== "menu") await p.screenshot({ path: `${out}/${n}-${w}-full.png`, fullPage: true });
  }
  await ctx.close();
}
await b.close(); srv.close(); console.log("shot");
