import { createRequire } from "node:module"; const { chromium } = createRequire(import.meta.url)("playwright");
import http from "node:http"; import fs from "node:fs"; import path from "node:path";
const root = process.argv[2], out = process.argv[3];
const srv = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split("?")[0]));
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); return r.end(); }
    r.writeHead(200, { "content-type": f.endsWith(".js") ? "text/javascript" : "text/html" }); r.end(d); }); }).listen(4555);
const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const p = await b.newPage(); p.on("console", m => console.log("console:", m.text())); p.on("pageerror", e => console.log("err:", e.message));
await p.goto("http://127.0.0.1:4555/objects.html"); await p.waitForFunction(() => window.ready, null, { timeout: 30000 });
for (const n of ["textile"]) {
  const d = await p.evaluate((n) => window.render(n), n);
  fs.writeFileSync(path.join(out, n + ".jpg"), Buffer.from(d.split(",")[1], "base64")); console.log("ok", n);
}
await b.close(); srv.close();
