-- SCHEMA ISOLATION (2026-09-06). Every object this product owns lives in ONE schema, and
-- nothing is created in `public`. That is what makes it safe to host The Gallery inside a
-- Supabase project that already carries another product: a name clash is impossible, the whole
-- product dumps and restores as one schema, and a migration run against the wrong database
-- cannot touch tables it does not own.
--
-- @schema@ is substituted by the migration runner (db/cli.ts, GALLERY_SCHEMA, default
-- `gallery`). A plain token rather than a psql variable, so the same file runs through psql
-- and through the Node runner without one of them choking on meta-commands.
--
-- search_path is set once here, so every unqualified CREATE below lands in that schema.
CREATE SCHEMA IF NOT EXISTS "@schema@";
SET search_path = "@schema@";

-- The application connects as gallery_app: a LOGIN role with no privileges of its own that
-- may only SET ROLE to gallery_anon or gallery_auth. This is the PostgREST/Supabase
-- "authenticator" shape, and it matters for the proof: because the connection is not a
-- superuser, row-level security actually applies to every request. A pool that connected as
-- the owner would silently bypass every policy in migration 002 and the isolation tests
-- would prove nothing.
-- The password comes from GALLERY_APP_PASSWORD through the migration runner, and the grant
-- names current_database() rather than a hard-coded name. Both were local-only assumptions:
-- the first would have put a known development password on a real project, and the second
-- named a database that does not exist on a hosted one, where the database is `postgres`.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'gallery_app') THEN
    EXECUTE format('CREATE ROLE gallery_app LOGIN PASSWORD %L NOINHERIT', '@app_password@');
  ELSE
    EXECUTE format('ALTER ROLE gallery_app PASSWORD %L', '@app_password@');
  END IF;
END $$;
GRANT gallery_anon, gallery_auth TO gallery_app;
DO $$ BEGIN
  EXECUTE format('GRANT CONNECT ON DATABASE %I TO gallery_app', current_database());
END $$;
GRANT USAGE ON SCHEMA "@schema@" TO gallery_app;

DO $verify$
DECLARE bad text;
BEGIN
  SELECT string_agg(rolname, ', ') INTO bad FROM pg_roles
   WHERE rolname IN ('gallery_app','gallery_anon','gallery_auth')
     AND (rolsuper OR rolbypassrls);
  IF bad IS NOT NULL THEN
    RAISE EXCEPTION 'VERIFY V8 failed: application roles bypass row-level security: %', bad;
  END IF;
  IF (SELECT rolinherit FROM pg_roles WHERE rolname = 'gallery_app') THEN
    RAISE EXCEPTION 'VERIFY V8 failed: gallery_app inherits its member roles automatically; it must SET ROLE explicitly';
  END IF;
  RAISE NOTICE 'VERIFY V8 passed';
END $verify$;
