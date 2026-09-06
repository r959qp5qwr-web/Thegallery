-- SCHEMA ISOLATION. Every object this product owns lives in ONE schema, and nothing is
-- created in `public`. That is what makes it safe to host The Gallery inside a Supabase
-- project that already carries another product: a name clash is impossible, the whole product
-- dumps and restores as one schema, and a migration run against the wrong database cannot
-- touch tables it does not own.
--
-- @schema@ is substituted by the migration runner (db/cli.ts, GALLERY_SCHEMA, default
-- `gallery`). A plain token rather than a psql variable, so the same file runs through psql
-- and through the Node runner without one of them choking on meta-commands.
CREATE SCHEMA IF NOT EXISTS "@schema@";
SET search_path = "@schema@";

-- The Gallery — Stage 2 substrate, Supabase-native (decision GAL-SUPA-1).
--
-- Authority: product/DOMAIN_MODEL.md (entities, state machines, visibility rules, invariants)
-- and the governor-ratified decisions in doctrine/PRODUCT_STATE.json.
--
-- Identity comes from Supabase Auth. A request arrives at PostgREST carrying a JWT; PostgREST
-- sets the role to `anon` or `authenticated` and puts the claims where `auth.uid()` reads
-- them. This product mints no sessions, stores no password and issues no tokens: GoTrue owns
-- the door. What this schema owns is what happens after the door.
--
-- The permission model is enforced in TWO independent ways, because either alone is a single
-- point of failure:
--   1. GRANTS — `anon` has no grant on any base table at all. A direct anonymous read of
--               `works` fails with "permission denied", not with an empty result that a
--               policy bug could turn into rows.
--   2. RLS    — every base table has row-level security. `authenticated` reaches only its
--               own maker's rows.
--
-- This matters more here than in a single-product project. `auth.users` is per project and
-- this one is shared with another product, so a valid token is not evidence of anything: it
-- may belong to a stranger who has never seen The Gallery. Every policy below is written for
-- that reader (GAL-SUPA-1 accepted consequence 1).

-- ---------------------------------------------------------------- identity of a request
-- auth.uid() is Supabase's own reader of the JWT `sub` claim. It is referenced, never
-- redefined: the day its implementation changes, this product changes with it.

-- Operator authority is a row, not a claim. A JWT claim would have to be minted by something,
-- and that something would then be the real authority; a table is inspectable, revocable and
-- has no issuer.
CREATE TABLE IF NOT EXISTS operators (
  user_id    uuid PRIMARY KEY,
  note       text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- SECURITY DEFINER so a policy may call it without the caller needing to read `operators`,
-- and so it cannot recurse through the policies on the table it reads.
CREATE OR REPLACE FUNCTION is_operator() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = "@schema@" AS $$
  SELECT EXISTS (SELECT 1 FROM operators o WHERE o.user_id = auth.uid())
$$;

-- ---------------------------------------------------------------------------- makers
CREATE TABLE makers (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- One maker per Supabase user. ON DELETE CASCADE so deleting the auth user takes the
  -- product's record of them with it, rather than leaving an orphan nobody can reach.
  user_id              uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
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
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  maker_id   uuid NOT NULL REFERENCES makers(id) ON DELETE CASCADE,
  kind       text NOT NULL CHECK (kind IN ('whatsapp','email','phone','website','form')),
  value      text NOT NULL CHECK (btrim(value) <> ''),
  label      text,
  enabled    boolean NOT NULL DEFAULT true,
  validated  boolean NOT NULL DEFAULT false,
  position   int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX contact_routes_maker_idx ON contact_routes (maker_id);

-- Append-only. No UPDATE or DELETE grant is issued to any role, and the triggers below refuse
-- them even for the owner: a sanction never rewrites its own record.
--
-- actor_user_id carries no foreign key on purpose. A record of a sanction must outlive the
-- account that issued it; a cascade or a restrict would let deleting an operator either erase
-- the record or block the deletion.
CREATE TABLE operator_actions (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id        uuid NOT NULL,
  action               text NOT NULL CHECK (action IN
                         ('take_down','restore','suspend','reinstate','dismiss_report','close_report','vocabulary_change')),
  subject_type         text NOT NULL CHECK (subject_type IN ('work','maker','workshop','collection','report')),
  subject_id           uuid NOT NULL,
  reason               text NOT NULL CHECK (btrim(reason) <> ''),
  supersedes_action_id uuid REFERENCES operator_actions(id),
  created_at           timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX operator_actions_subject_idx ON operator_actions (subject_type, subject_id, created_at DESC);

CREATE OR REPLACE FUNCTION refuse_mutation() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'operator_actions is append-only (DOMAIN_MODEL §6)';
END $$;
CREATE TRIGGER operator_actions_no_update BEFORE UPDATE ON operator_actions
  FOR EACH ROW EXECUTE FUNCTION refuse_mutation();
CREATE TRIGGER operator_actions_no_delete BEFORE DELETE ON operator_actions
  FOR EACH ROW EXECUTE FUNCTION refuse_mutation();

-- Idempotency for consequential writes (publish, and any later one-shot act).
CREATE TABLE write_intents (
  key        text PRIMARY KEY,
  user_id    uuid NOT NULL,
  kind       text NOT NULL,
  subject_id uuid,
  result     jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Closure is the product's own record, kept separately from the auth user. Deleting a person
-- from GoTrue is an administrative act with its own key; closing an account is a thing the
-- maker themselves does, and it must be recorded even when no maker profile was ever made.
CREATE TABLE account_closures (
  user_id   uuid PRIMARY KEY,
  closed_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE operational_failures (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind        text NOT NULL CHECK (kind IN ('auth','publish','image','contact','email')),
  subject     text NOT NULL,
  detail      text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

-- ---------------------------------------------------- the maker behind the current request
-- SECURITY DEFINER so it can be used inside policies on `makers` itself without recursing
-- through those policies.
CREATE OR REPLACE FUNCTION maker_id() RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = "@schema@" AS $$
  SELECT m.id FROM makers m WHERE m.user_id = auth.uid()
$$;

-- The maker behind the current request ONLY while they may act.
--
-- GAL-A1: "a suspended maker cannot publish or exercise maker privileges." Enforcing that in
-- the application would satisfy the letter of it; enforcing it here means a suspended maker
-- writing directly to the API — which the exposed schema now makes possible — is refused by
-- the database rather than by a page they are not using. Reads still go through maker_id(),
-- because a suspended maker must be able to see their own Studio and read why.
CREATE OR REPLACE FUNCTION writing_maker_id() RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = "@schema@" AS $$
  SELECT m.id FROM makers m WHERE m.user_id = auth.uid() AND m.status = 'active'
$$;
