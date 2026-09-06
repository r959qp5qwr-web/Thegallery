-- The Gallery — Stage 2 substrate.
--
-- Authority: product/DOMAIN_MODEL.md (entities, state machines, visibility rules, invariants)
-- and the governor-ratified decisions in doctrine/PRODUCT_STATE.json.
--
-- The permission model is enforced in TWO independent ways, because either alone is a
-- single point of failure:
--   1. GRANTS      — the anonymous role has no grant on any base table at all. A direct
--                    anonymous read of `works` fails with "permission denied", not with an
--                    empty result that a policy bug could turn into rows.
--   2. RLS         — every base table has row-level security with explicit policies. The
--                    authenticated role reaches only its own maker's rows.
-- Public reads go through views that carry the visibility predicate from DOMAIN_MODEL §3
-- (work published AND gallery published AND maker active) and omit every private column.
--
-- Request-scoped identity mirrors the PostgREST/Supabase model: each request runs in a
-- transaction that does SET LOCAL ROLE and SET LOCAL app.account_id, so the database, not
-- the application, decides what the request may see.

-- ---------------------------------------------------------------------------- roles
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'gallery_anon') THEN
    CREATE ROLE gallery_anon NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'gallery_auth') THEN
    CREATE ROLE gallery_auth NOLOGIN;
  END IF;
END $$;

CREATE SCHEMA IF NOT EXISTS app;
GRANT USAGE ON SCHEMA public TO gallery_anon, gallery_auth;
GRANT USAGE ON SCHEMA app TO gallery_anon, gallery_auth;

-- ---------------------------------------------------------------- identity of a request
CREATE OR REPLACE FUNCTION app.account_id() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('app.account_id', true), '')::uuid
$$;

-- ---------------------------------------------------------------------------- accounts
CREATE TABLE auth_accounts (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email              text NOT NULL,
  email_normalised   text GENERATED ALWAYS AS (lower(btrim(email))) STORED,
  password_hash      text NOT NULL,
  access_state       text NOT NULL DEFAULT 'awaiting_email_confirmation'
                     CHECK (access_state IN ('awaiting_email_confirmation','active','suspended','closed')),
  email_confirmed_at timestamptz,
  is_operator        boolean NOT NULL DEFAULT false,
  created_at         timestamptz NOT NULL DEFAULT now(),
  closed_at          timestamptz
);
CREATE UNIQUE INDEX auth_accounts_email_key ON auth_accounts (email_normalised);

CREATE TABLE auth_tokens (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id   uuid NOT NULL REFERENCES auth_accounts(id) ON DELETE CASCADE,
  purpose      text NOT NULL CHECK (purpose IN ('confirm_email','reset_password')),
  token_hash   text NOT NULL UNIQUE,
  expires_at   timestamptz NOT NULL,
  consumed_at  timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX auth_tokens_account_idx ON auth_tokens (account_id, purpose);

CREATE TABLE auth_sessions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id   uuid NOT NULL REFERENCES auth_accounts(id) ON DELETE CASCADE,
  token_hash   text NOT NULL UNIQUE,
  expires_at   timestamptz NOT NULL,
  revoked_at   timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- Local development mail. NOT a real send: the outbox is inspected, never delivered.
-- Nothing in the product may read this table to claim an email round trip happened.
CREATE TABLE dev_outbox (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email   text NOT NULL,
  subject    text NOT NULL,
  body       text NOT NULL,
  link       text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------- makers
CREATE TABLE makers (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id           uuid NOT NULL UNIQUE REFERENCES auth_accounts(id) ON DELETE CASCADE,
  handle               text NOT NULL UNIQUE CHECK (handle ~ '^[a-z0-9]([a-z0-9-]{1,28}[a-z0-9])$'),
  display_name         text NOT NULL CHECK (btrim(display_name) <> ''),
  kind                 text NOT NULL CHECK (kind IN ('individual','studio','collective')),
  city                 text NOT NULL CHECK (btrim(city) <> ''),
  region               text,
  country              text NOT NULL DEFAULT 'India',
  exact_address        text,
  exact_address_public boolean NOT NULL DEFAULT false,
  practice_note        text,
  commissions_open     boolean NOT NULL DEFAULT false,
  commissions_note     text,
  status               text NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','closed')),
  status_reason        text,
  handle_locked        boolean NOT NULL DEFAULT false,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE galleries (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  maker_id     uuid NOT NULL UNIQUE REFERENCES makers(id) ON DELETE CASCADE,
  lifecycle    text NOT NULL DEFAULT 'draft' CHECK (lifecycle IN ('draft','published','hidden','closed')),
  intro        text,
  published_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE material_categories (
  key      text PRIMARY KEY,
  label    text NOT NULL,
  position int  NOT NULL,
  active   boolean NOT NULL DEFAULT true
);

CREATE TABLE works (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_token        text NOT NULL UNIQUE,
  gallery_id          uuid NOT NULL REFERENCES galleries(id) ON DELETE CASCADE,
  title               text NOT NULL CHECK (btrim(title) <> ''),
  material            text NOT NULL REFERENCES material_categories(key),
  medium              text,
  process             text,
  height_mm           int, width_mm int, depth_mm int,
  year                int,
  price_mode          text NOT NULL CHECK (price_mode IN ('exact','enquire','made_to_order')),
  price_amount        numeric(12,2),
  price_currency      text NOT NULL DEFAULT 'INR',
  status              text NOT NULL DEFAULT 'available'
                      CHECK (status IN ('available','made_to_order','enquire','sold','on_view')),
  status_confirmed_at timestamptz NOT NULL DEFAULT now(),
  lifecycle           text NOT NULL DEFAULT 'draft' CHECK (lifecycle IN ('draft','published','retired')),
  taken_down          boolean NOT NULL DEFAULT false,
  taken_down_reason   text,
  published_at        timestamptz,
  retired_at          timestamptz,
  position            int NOT NULL DEFAULT 0,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  -- DOMAIN_MODEL §4: price_amount required iff price_mode = 'exact'
  CONSTRAINT works_price_shape CHECK (
    (price_mode = 'exact' AND price_amount IS NOT NULL AND price_amount >= 0)
    OR (price_mode <> 'exact' AND price_amount IS NULL))
);
CREATE INDEX works_gallery_idx ON works (gallery_id);
CREATE INDEX works_material_idx ON works (material);

CREATE TABLE work_images (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_id     uuid NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  position    int NOT NULL,
  storage_key text NOT NULL,
  width       int NOT NULL,
  height      int NOT NULL,
  alt_text    text,
  state       text NOT NULL DEFAULT 'uploading' CHECK (state IN ('uploading','ready','failed')),
  variants    jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX work_images_position_key ON work_images (work_id, position);

CREATE TABLE contact_routes (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  maker_id  uuid NOT NULL REFERENCES makers(id) ON DELETE CASCADE,
  kind      text NOT NULL CHECK (kind IN ('whatsapp','email','phone','website','form')),
  value     text NOT NULL CHECK (btrim(value) <> ''),
  label     text,
  enabled   boolean NOT NULL DEFAULT true,
  validated boolean NOT NULL DEFAULT false,
  position  int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX contact_routes_maker_idx ON contact_routes (maker_id);

-- Append-only. No UPDATE or DELETE grant is issued to any role, and the triggers below
-- refuse them even for the owner: a sanction never rewrites its own record.
CREATE TABLE operator_actions (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_account_id    uuid NOT NULL REFERENCES auth_accounts(id),
  action              text NOT NULL CHECK (action IN
                        ('take_down','restore','suspend','reinstate','dismiss_report','close_report','vocabulary_change')),
  subject_type        text NOT NULL CHECK (subject_type IN ('work','maker','workshop','collection','report')),
  subject_id          uuid NOT NULL,
  reason              text NOT NULL CHECK (btrim(reason) <> ''),
  supersedes_action_id uuid REFERENCES operator_actions(id),
  created_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX operator_actions_subject_idx ON operator_actions (subject_type, subject_id, created_at DESC);

CREATE OR REPLACE FUNCTION app.refuse_mutation() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'operator_actions is append-only (DOMAIN_MODEL §6)';
END $$;
CREATE TRIGGER operator_actions_no_update BEFORE UPDATE ON operator_actions
  FOR EACH ROW EXECUTE FUNCTION app.refuse_mutation();
CREATE TRIGGER operator_actions_no_delete BEFORE DELETE ON operator_actions
  FOR EACH ROW EXECUTE FUNCTION app.refuse_mutation();

-- Idempotency for consequential writes (publish, and any later one-shot act).
CREATE TABLE write_intents (
  key         text PRIMARY KEY,
  account_id  uuid NOT NULL REFERENCES auth_accounts(id) ON DELETE CASCADE,
  kind        text NOT NULL,
  subject_id  uuid,
  result      jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE operational_failures (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind       text NOT NULL CHECK (kind IN ('auth','publish','image','contact','email')),
  subject    text NOT NULL,
  detail     text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

-- ------------------------------------------- request identity that reads the tables above
CREATE OR REPLACE FUNCTION app.is_operator() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, app AS $$
  SELECT COALESCE((SELECT a.is_operator FROM auth_accounts a WHERE a.id = app.account_id()), false)
$$;

-- The maker of the current request, or NULL. SECURITY DEFINER so it can be used inside
-- policies on `makers` itself without recursing through those policies.
CREATE OR REPLACE FUNCTION app.maker_id() RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, app AS $$
  SELECT m.id FROM makers m WHERE m.account_id = app.account_id()
$$;
