-- The Gallery — remove the previous schema before applying the Supabase-native one.
--
-- Run this ONCE, before db/supabase-schema.sql, on a project that carries the earlier
-- migrations (001-006 of the pre-GAL-SUPA-1 set). It exists because that set built its own
-- authentication store and its own database roles, and decision GAL-SUPA-1 replaced both with
-- Supabase Auth and PostgREST. A patch chain from one to the other would leave the old roles
-- on the project forever; this is the honest teardown.
--
-- WHAT IT TOUCHES: the `gallery` schema and four roles this product created. Nothing else.
-- `public` is not named anywhere below, so nothing belonging to another product in this
-- project is affected.
--
-- WHAT YOU LOSE: everything in the gallery schema. Run it only while that is still test data.

DROP SCHEMA IF EXISTS gallery CASCADE;

-- The roles the previous design created. Ownership and grants go with the schema above, so
-- these should drop cleanly; if one refuses, it still holds a grant somewhere and that is
-- worth reading rather than forcing.
DO $$
DECLARE r text;
BEGIN
  FOREACH r IN ARRAY ARRAY['gallery_authstore','gallery_auth','gallery_anon','gallery_app'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = r) THEN
      EXECUTE format('DROP OWNED BY %I', r);
      EXECUTE format('DROP ROLE %I', r);
      RAISE NOTICE 'dropped role %', r;
    END IF;
  END LOOP;
END $$;

-- Confirm, in a form the SQL editor will actually show you.
SELECT CASE WHEN count(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS result,
       'the previous schema and its roles are gone' AS what,
       coalesce(string_agg(name, ', '), 'clean') AS detail
FROM (
  SELECT nspname AS name FROM pg_namespace WHERE nspname = 'gallery'
  UNION ALL
  SELECT rolname FROM pg_roles
   WHERE rolname IN ('gallery_app','gallery_anon','gallery_auth','gallery_authstore')
) x;
