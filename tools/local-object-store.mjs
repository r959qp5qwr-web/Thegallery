// A local stand-in for the Supabase Storage HTTP API, for running the journeys against the
// Worker build without a bucket credential.
//
// It exists to exercise the Worker's own code path — bytes in and out over `fetch`, with no
// filesystem — not to prove anything about Supabase. A run against this server proves the
// Worker stores and serves images; it does NOT prove that a hosted bucket accepted them.
// The first real upload stays unproven until it happens against the project's own bucket.
import { createServer } from "node:http";

const objects = new Map();
const PORT = Number(process.env.OBJECT_STORE_PORT ?? 54321);

createServer((req, res) => {
  const m = /^\/storage\/v1\/object\/([^/]+)\/(.+)$/.exec(req.url ?? "");
  if (!m) { res.writeHead(404).end("no such route"); return; }
  const key = `${m[1]}/${m[2]}`;
  if (req.method === "POST" || req.method === "PUT") {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      objects.set(key, Buffer.concat(chunks));
      res.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify({ Key: key }));
    });
    return;
  }
  if (req.method === "GET") {
    const bytes = objects.get(key);
    if (!bytes) { res.writeHead(404).end("not found"); return; }
    res.writeHead(200, { "content-type": "image/jpeg", "content-length": String(bytes.length) }).end(bytes);
    return;
  }
  res.writeHead(405).end("method not allowed");
}).listen(PORT, "127.0.0.1", () => console.log(`local object store on http://127.0.0.1:${PORT}`));
