-- The Gallery — remove the previous schema and its roles before applying the Supabase-native
-- one (decision GAL-SUPA-1).
--
-- Run this ONCE, before db/supabase-schema.sql, on a project that carries the earlier
-- migrations. That set built its own authentication store and its own database roles;
-- GAL-SUPA-1 replaced both with Supabase Auth and PostgREST. A patch chain from one to the
-- other would leave the old roles on the project forever, so this is the honest teardown.
--
-- WHAT IT TOUCHES: the `gallery` schema and four roles this product created. Nothing else.
-- `public` is not named anywhere below.
-- WHAT YOU LOSE: everything in the gallery schema. Run it only while that is still test data.
--
-- It reports as ROWS, not as notices. The SQL editor swallows NOTICE and WARNING, so a
-- teardown that reported that way could half-fail in silence.

DROP SCHEMA IF EXISTS gallery CASCADE;

CREATE TEMP TABLE teardown_log (role_name text, outcome text, detail text);

-- DROP ROLE is tried on its own first. It is the statement that actually matters, and it
-- needs less authority than DROP OWNED BY — which on Supabase, where the SQL editor is not a
-- superuser, is the statement most likely to be refused. Only if DROP ROLE complains that the
-- role still owns something is DROP OWNED BY tried, and its refusal is recorded rather than
-- allowed to abort the roles after it.
DO $$
DECLARE r text; msg text;
BEGIN
  FOREACH r IN ARRAY ARRAY['gallery_authstore','gallery_auth','gallery_anon','gallery_app'] LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = r) THEN
      INSERT INTO teardown_log VALUES (r, 'absent', 'was not present');
      CONTINUE;
    END IF;

    BEGIN
      EXECUTE format('DROP ROLE %I', r);
      INSERT INTO teardown_log VALUES (r, 'dropped', 'dropped directly');
      CONTINUE;
    EXCEPTION WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS msg = MESSAGE_TEXT;
    END;

    -- Still here: the direct drop was refused. Try to clear what it owns, then drop again.
    BEGIN
      EXECUTE format('REASSIGN OWNED BY %I TO CURRENT_USER', r);
      EXECUTE format('DROP OWNED BY %I', r);
      EXECUTE format('DROP ROLE %I', r);
      INSERT INTO teardown_log VALUES (r, 'dropped', 'dropped after reassigning what it owned');
    EXCEPTION WHEN OTHERS THEN
      GET STACKED DIAGNOSTICS msg = MESSAGE_TEXT;
      INSERT INTO teardown_log VALUES (r, 'REFUSED', msg);
    END;
  END LOOP;
END $$;

-- Per-role outcome, including the exact refusal where there was one.
SELECT outcome AS result, role_name AS what, detail FROM teardown_log ORDER BY role_name;

-- And the overall verdict.
SELECT CASE WHEN count(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS result,
       'the previous schema and its roles are gone' AS what,
       coalesce(string_agg(name, ', '), 'clean') AS detail
FROM (
  SELECT nspname AS name FROM pg_namespace WHERE nspname = 'gallery'
  UNION ALL
  SELECT rolname FROM pg_roles
   WHERE rolname IN ('gallery_app','gallery_anon','gallery_auth','gallery_authstore')
) x;
