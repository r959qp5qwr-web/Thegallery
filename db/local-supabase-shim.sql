-- A local stand-in for the parts of Supabase this schema leans on.
--
-- NEVER run this against a Supabase project. It creates, locally, the three things a Supabase
-- database already has — the `auth` schema with `auth.users` and `auth.uid()`, and the `anon`
-- and `authenticated` roles PostgREST switches into — so the migrations and the policy probes
-- can run here. The Docker daemon is unusable in this environment, so there is no local
-- Supabase to run instead; this is what makes a local policy proof possible at all.
--
-- What it does NOT stand in for: GoTrue. No password is checked here and no token is minted.
-- A local run proves what the POLICIES do given an identity, not that the door issues one.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
              WHERE n.nspname = 'auth' AND p.proname = 'uid') THEN
    RAISE EXCEPTION 'auth.uid() already exists — this looks like a real Supabase database, and this shim must not run here';
  END IF;
END $$;

CREATE SCHEMA IF NOT EXISTS auth;

CREATE TABLE IF NOT EXISTS auth.users (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email              text UNIQUE,
  email_confirmed_at timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now()
);

-- The same shape Supabase ships: read `sub` out of the claims PostgREST puts on the
-- transaction. `SET LOCAL request.jwt.claims` is exactly what PostgREST does per request.
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT NULLIF(
    COALESCE(
      NULLIF(current_setting('request.jwt.claim.sub', true), ''),
      (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
    ), '')::uuid
$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN;
  END IF;
  -- PostgREST connects as one login role and SET ROLEs per request. NOINHERIT so the
  -- connection holds no privilege of its own, which is how the hosted one behaves.
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticator') THEN
    CREATE ROLE authenticator LOGIN NOINHERIT PASSWORD 'local_dev_only';
  END IF;
END $$;
GRANT anon, authenticated TO authenticator;
GRANT USAGE ON SCHEMA auth TO anon, authenticated;
