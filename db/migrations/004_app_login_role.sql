-- The application connects as gallery_app: a LOGIN role with no privileges of its own that
-- may only SET ROLE to gallery_anon or gallery_auth. This is the PostgREST/Supabase
-- "authenticator" shape, and it matters for the proof: because the connection is not a
-- superuser, row-level security actually applies to every request. A pool that connected as
-- the owner would silently bypass every policy in migration 002 and the isolation tests
-- would prove nothing.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'gallery_app') THEN
    CREATE ROLE gallery_app LOGIN PASSWORD 'gallery_local_dev' NOINHERIT;
  END IF;
END $$;
GRANT gallery_anon, gallery_auth TO gallery_app;
GRANT CONNECT ON DATABASE gallery TO gallery_app;
GRANT USAGE ON SCHEMA public, app TO gallery_app;

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
