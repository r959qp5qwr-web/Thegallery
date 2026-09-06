# Running The Gallery on Supabase — runbook

The Gallery is being hosted inside the existing Supabase project that already carries **Ustaad**.
This file is the exact procedure, and the reasons behind the parts that look fussy.

**This session could not run any of it.** The build environment egresses HTTPS through a proxy
only: the project's direct database host resolves IPv6-only and there is no IPv6 here, the
pooler's Postgres ports are blocked, and `api.supabase.com` is refused by egress policy. So
every command below is written to be run by you, and nothing in this repository claims a
Supabase deployment has happened.

---

## 0. The one rule that protects Ustaad

**Everything The Gallery owns lives in one schema, `gallery`. Nothing is created in `public`.**

That is enforced, not remembered:

- every migration begins `CREATE SCHEMA IF NOT EXISTS "@schema@"; SET search_path = "@schema@";`
- the migration runner refuses `GALLERY_SCHEMA=public` outright
- policy probe **P-21** fails if any of this product's tables appear in `public`
- policy probe **P-22** fails if they are not in the named schema — so P-21 cannot pass by the
  product having created nothing at all

If you ever want The Gallery on its own project, `pg_dump --schema=gallery` moves the whole
product and leaves Ustaad untouched.

---

## 1. What you need to supply

| Value | Where it comes from | Why |
|---|---|---|
| **Database password** | Supabase → Project Settings → Database → Reset database password | The migrations are DDL. No API key can run DDL — not the publishable key, not the service-role key |
| **Pooler host and region** | Supabase → Project Settings → Database → Connection string → Session pooler | The direct host is IPv6-only; the session pooler answers over IPv4 |
| **Hosting project** | Vercel or similar, connected to this repository | To serve the app at a real URL |
| **A DNS record for `atthegallery.in`** | Your registrar | So links in email and share previews are real |
| **A transactional sender** | Resend or Postmark, on `atthegallery.in`, with SPF and DKIM | The confirmation and recovery doors need real mail. This is the only piece with no local substitute |

The project's **publishable key is not used by this build** and does not need to be configured.
The Gallery talks to Postgres directly with its own roles and its own session auth; that is what
makes the twenty-two permission probes real, and no Supabase client library is imported anywhere.

---

## 2. Create the roles

Supabase's `postgres` role has `CREATEROLE`, so this works in the SQL editor:

```sql
-- The application connects as a role with NO privileges of its own.
create role gallery_anon nologin;
create role gallery_auth nologin;
create role gallery_app  login password '<a long random password>' noinherit;
grant gallery_anon, gallery_auth to gallery_app;
```

If the platform refuses to create a login role, connect the application as `postgres` instead.
The permission model still holds: `postgres` on Supabase is **not** a superuser, and every
request does `SET LOCAL ROLE` before it touches anything, so row-level security applies either
way. Verify it with `npm run test:policy` before trusting it.

---

## 3. Run the migrations

```bash
export GALLERY_SCHEMA=gallery
export DATABASE_URL_OWNER='postgres://postgres.<ref>:<password>@aws-N-<region>.pooler.supabase.com:5432/postgres'
npm run db:migrate      # NOT db:reset — that drops a database, and this one is not only yours
```

> **Never run `npm run db:reset` against Supabase.** It drops and recreates the whole database.
> It exists for the local cluster. `db:migrate` only ever creates inside the `gallery` schema.

Then, if you want the synthetic makers for a first walk:

```bash
npm run db:seed
```

The seed creates two synthetic makers and an operator and **no works**: the slice is proved by
walking the product.

---

## 4. Point the application at it

Use the **session-mode** pooler (port 5432), not transaction mode (6543).

The application sets `search_path` on a pooled connection outside a transaction, and transaction
pooling does not carry that between statements. Session mode does. If you must use transaction
mode, the fix is to move that `SET` inside each transaction in `src/lib/db.ts` — do not simply
switch the port and hope.

```
GALLERY_SCHEMA=gallery
DATABASE_URL_APP=postgres://gallery_app.<ref>:<password>@aws-N-<region>.pooler.supabase.com:5432/postgres
DATABASE_URL_OWNER=postgres://postgres.<ref>:<password>@aws-N-<region>.pooler.supabase.com:5432/postgres
GALLERY_BASE_URL=https://atthegallery.in
GALLERY_MAIL=resend
RESEND_API_KEY=<key>
GALLERY_MAIL_FROM=The Gallery <hello@atthegallery.in>
```

---

## 5. Images

`GALLERY_STORAGE_DIR` writes to local disk. On a serverless host that disk does not survive a
request, so before a real deployment either attach a persistent volume or swap the adapter to
Supabase Storage. The adapter is deliberately narrow — `ingestImage` and `readVariant` in
`src/lib/storage.ts` — and nothing above it knows where the bytes live.

Whatever it becomes, the visibility rule must stay: pixels are served through
`/img/[id]/[variant]`, which re-checks the public view, so a draft's images are not fetchable by
URL. A public Supabase Storage bucket would lose that. Use a private bucket and sign URLs from
that route, or keep the route reading bytes itself.

---

## 6. Prove it, rather than assume it

Against the deployed URL:

```bash
GALLERY_BASE_URL=https://atthegallery.in npx playwright test    # 31 journeys
npm run test:policy                                             # 22 probes, incl. P-21/P-22
```

The journeys read confirmation links from `dev_outbox`, which still records every message. Once
`GALLERY_MAIL=resend` is set, a real message is also sent — **that** is the email round trip, and
it has never been proved. Walk it on a phone: create an account, receive the mail, follow the
link, publish a work, and open the maker's WhatsApp route from the handoff sheet.

Until that walk happens, the honest status stays: *Stage 2 implementation complete; deployed
proof pending.*
