# The slice on Cloudflare's runtime — what was seen, 2026-09-06

Session `9e4e9e82-091a-58bd-96d4-39aae1304020`, branch
`claude/gallery-hook-liveness-verify-bzn5c6`, commits `09f27b8` and `53d5d38`.

This receipt covers one thing: the Stage 2 vertical slice built as a Cloudflare Worker and
walked under `workerd`. It is **not** deployed proof. Nothing was deployed, no hosted database
was reached, and no bucket was written to.

---

## SEEN

| What | Instrument | Result |
|---|---|---|
| The Worker builds | `opennextjs-cloudflare build` (`@opennextjs/cloudflare` 1.20.6) | 7.2 MB, 1.57 MB gzipped, under the 3 MB limit |
| The Worker boots and serves | `wrangler dev --local` (workerd), port 3200 | entrance, browse, work, studio, operator surfaces |
| Postgres from the isolate | Hyperdrive binding, `localConnectionString` → local cluster | every governed read and write in the suite |
| 31 browser journeys, phone width | Playwright, Pixel 7, against the Worker | 31 passed |
| 31 browser journeys, desktop width | Playwright, 1280×900, against the Worker | 31 passed |
| Image ingest inside the isolate | the journeys' own uploads | three differently shaped images, each keeping its proportion |
| Image bytes over HTTP, not a filesystem | `tools/local-object-store.mjs` | `original.jpg` 32,474 B, `w320.jpg` 4,309 B, `w640.jpg` 9,358 B; `w1280.jpg` 404, because the source was narrower and nothing is enlarged |
| 22 permission probes | `tests/policy/run.ts`, local cluster | 22 passed |
| 13 schema checks | `db/supabase-verify.sql`, local cluster | 13 PASS, including the two added for the new role and function |
| Doctrine gates | `scripts/doctrine-gate.py` | 5 of 5 |
| Negative drill | `scripts/doctrine-drill.py` | 89 PASS, 0 DECORATIVE, 0 STALE, 0 RED |

### The measurement that decided the design

Image uploads failed on the Worker with `CompileError: WebAssembly.compile(): Wasm code
generation disallowed by embedder`. Rather than guess at the rule, a four-line Worker was run
under the same `workerd` to establish it:

```json
{ "startup":     "OK (sync, top level)",
  "inHandler":   "FAILED: CompileError: Wasm code generation disallowed by embedder",
  "fromStartup": "OK: 42" }
```

Compilation is permitted while modules are evaluated and refused inside a request handler; a
module compiled at startup instantiates in a handler without complaint. OpenNext loads the
Next server bundle with a dynamic `import()` from inside `fetch`, so every module in it is
evaluated in a request — which is why compiling the codecs lazily could never work here and
works everywhere else.

`worker-entry.ts` therefore imports the three `.wasm` files directly, so wrangler compiles them
at deploy time, and leaves the compiled modules for the request path to instantiate. Node keeps
compiling from the base64 the same generator writes. Same bytes, same codecs, one generator.

---

## NOT SEEN

- Any deployed build. `wrangler deploy` has not been run and no Worker exists on Cloudflare.
- Any connection to the hosted Supabase database. Its direct host is IPv6-only and this
  environment has none; the pooler's Postgres port is not reachable through the egress proxy.
  The schema there remains verified structurally by the governor's own SQL editor run, and by
  nothing else.
- Hyperdrive itself. The binding was exercised only through `localConnectionString`, which
  points at a local cluster. No Hyperdrive configuration exists; `wrangler.jsonc` still carries
  the placeholder id.
- Supabase Storage. The bucket that answered was `tools/local-object-store.mjs` on
  `127.0.0.1`, a local stand-in that speaks the same two endpoints. It proves the Worker's
  storage path — bytes in and out over `fetch`, with no filesystem — and proves nothing
  whatever about Supabase. No bucket exists and no key for one has ever been held here.
- A real email round trip. `GALLERY_MAIL=outbox` wrote to `dev_outbox` and sent nothing.
- Migrations 005 and 006 on the hosted database. They exist and pass locally; the governor has
  applied 001–004 there. `db/supabase-delta.sql` renders the two that remain.
- The domain, DNS, CI and branch protection — unchanged, all still unarmed.

## UNKNOWN

- Whether the session pooler string, once put into a Hyperdrive configuration, reaches the
  database as `gallery_app`. It cannot be tried from here.
- Worker CPU time for an image upload against a real bucket. Locally the encode of three
  variants is well inside the isolate's budget, but the network hop to a hosted bucket is not
  in that measurement.
