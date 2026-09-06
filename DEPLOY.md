# Deploying The Gallery to Cloudflare

The build target is a Cloudflare Worker: `@opennextjs/cloudflare` compiles the Next
application into `.open-next/`, and `worker-entry.ts` wraps the generated worker so the image
codecs are compiled while modules are evaluated (a Worker isolate refuses WebAssembly
compilation inside a request — see the comment in that file).

Three things live outside this repository and only the governor can create them: the
Hyperdrive configuration, the storage bucket and its key, and the DNS record. Nothing here
carries a credential, and no session may claim any of this is done until it has seen it.

---

## 1. The database connection: Hyperdrive

A Worker is a V8 isolate, not a process. It cannot hold a connection pool between requests,
and opening a fresh Postgres connection from the edge on every request would be both slow and
a good way to exhaust a database's connection limit. Hyperdrive is Cloudflare's answer: it
holds the pool on their side, next to the database, and hands the Worker a local connection
string. The Worker opens one client per request and closes it; Hyperdrive keeps the expensive
part warm.

### What to point it at

Supabase offers three: the direct database host, the session pooler (port 5432) and the
transaction pooler (port 6543). Use the **session pooler**.

- The direct host (`db.<ref>.supabase.co`) resolves to IPv6 only. Plenty of networks have no
  route to it — this repository was built in one of them — and it is the usual cause of a
  connection that times out with no error worth reading.
- The transaction pooler hands out a server connection per transaction, so session-level state
  does not survive between them. Hyperdrive is already the pool here; putting a second pooler
  in transaction mode behind it buys nothing and constrains what a session may do. This
  product sets its identity with `SET LOCAL ROLE` and `set_config(..., true)` inside each
  transaction — which transaction pooling does not by itself break — but there is no reason to
  take the constraint.

Copy the exact string from the Supabase dashboard rather than typing it: **Project settings →
Database → Connection string → Session pooler**. The host and region differ per project. It
has this shape:

```
postgres://postgres.<project-ref>:<password>@aws-N-<region>.pooler.supabase.com:5432/postgres
```

Replace the user and password with the application's own role, `gallery_app`, and the password
you set when you applied migration 004. On the pooler the username carries the project
reference:

```
postgres://gallery_app.<project-ref>:<GALLERY_APP_PASSWORD>@aws-N-<region>.pooler.supabase.com:5432/postgres
```

`gallery_app` is a NOINHERIT, non-superuser role that may only `SET ROLE` to `gallery_anon`,
`gallery_auth` and `gallery_authstore`. It is not the owner and cannot bypass row-level
security. Do not put the owner connection string in Hyperdrive.

### Create the configuration

```bash
npx wrangler hyperdrive create thegallery-db \
  --connection-string='postgres://gallery_app.<project-ref>:<password>@aws-N-<region>.pooler.supabase.com:5432/postgres'
```

It prints an `id`. Put that id in `wrangler.jsonc`, replacing `REPLACE_WITH_HYPERDRIVE_ID`:

```jsonc
"hyperdrive": [
  { "binding": "HYPERDRIVE", "id": "<the id it printed>",
    "localConnectionString": "postgres://gallery_app:gallery_local_dev@127.0.0.1:5432/gallery" }
]
```

The id is not a secret — it names a configuration, and the connection string it holds stays on
Cloudflare's side. `localConnectionString` is what `wrangler dev` uses instead, so the journeys
run against a local cluster and never touch the hosted database.

### What the application does with it

`src/lib/db.ts` asks for the `HYPERDRIVE` binding first and falls back to `DATABASE_URL_APP`
when there is none, which is how the same code runs under Node in development. On Workers it
opens a `Client` per request and ends it; under Node it keeps a pool. Either way every request
runs `BEGIN`, `SET LOCAL ROLE`, `SET LOCAL search_path` and `set_config('thegallery.account_id', …, true)`,
so the transaction, not the connection, carries the identity. That is why a shared pool is safe.

---

## 2. The schema

Apply the migrations through the Supabase SQL editor:

- a database with nothing yet: `db/supabase-schema.sql` (001–006), after replacing the
  placeholder password with one you generate;
- a database already carrying 001–004: `db/supabase-delta.sql` (005–006).

Then run `db/supabase-verify.sql` and read every row. All 13 must say PASS. The editor
swallows `NOTICE`, so the `VERIFY` blocks inside the migrations can pass or fail unseen — that
query is what makes them visible.

Regenerate either file with `npm run db:sqlfile` (whole schema) or
`node --experimental-strip-types db/sqlfile.ts 005` (from 005 on).

---

## 3. Storage

Uploaded originals and derived variants go to a **private** Supabase Storage bucket. Private is
not a preference: image bytes are served through `/img/[id]/[variant]`, which re-checks public
visibility on every request, so a draft or a suspended maker's work is not reachable by URL. A
public bucket would route around that check.

1. Storage → New bucket → name it `gallery-images`, and leave "Public bucket" **off**.
2. Get the `service_role` key from Project settings → API. It bypasses row-level security, so
   it belongs only in a Worker secret — never in this repository, never in a client bundle,
   and there is no need to paste it into a chat window.

```bash
npx wrangler secret put SUPABASE_URL             # https://<project-ref>.supabase.co
npx wrangler secret put SUPABASE_STORAGE_KEY     # the service_role key
```

`SUPABASE_STORAGE_BUCKET` is an ordinary var in `wrangler.jsonc` and needs no secrecy.

---

## 4. Mail

`GALLERY_MAIL=resend` is implemented and has never sent a message. Confirmation and recovery
are single-use links, so until a sender is wired the maker door cannot be walked by a real
person on a real phone.

```bash
npx wrangler secret put RESEND_API_KEY
```

and set `GALLERY_MAIL=resend` and `GALLERY_MAIL_FROM` as vars. The sending domain needs SPF and
DKIM records before anything it sends will be delivered rather than binned.

---

## 5. Deploy and the domain

```bash
npx opennextjs-cloudflare build
npx wrangler deploy
```

Then attach `atthegallery.in` as a custom domain on the Worker (Workers & Pages → the worker →
Settings → Domains & Routes → Add custom domain). Cloudflare creates the DNS record itself once
the zone's nameservers are its own. Set `GALLERY_BASE_URL=https://atthegallery.in` as a var, or
confirmation links will point at the workers.dev address.

---

## 6. Running it locally against the Worker runtime

This is the closest thing to the deployed build that does not need any of the above:

```bash
cp .dev.vars.example .dev.vars          # local values only; nothing here is a credential
node tools/local-object-store.mjs &     # a stand-in for the bucket, on 127.0.0.1:54321
npm run db:reset && npm run db:seed
npx opennextjs-cloudflare build
npx wrangler dev --port 3200 --local
GALLERY_BASE_URL=http://127.0.0.1:3200 npx playwright test
```

What that proves: the Worker boots, Hyperdrive's local binding serves Postgres, the codecs
compile at startup and resize in the isolate, and 31 journeys pass at each width. What it does
not prove: anything about Supabase, about the hosted database, about the bucket, or about mail.
Those stay unproven until they are done for real, and this file is not evidence that they were.
