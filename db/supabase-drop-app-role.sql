-- The Gallery — remove the last role of the pre-GAL-SUPA-1 design.
--
-- Run this only if db/supabase-reset.sql reported gallery_app as REFUSED. Three of the four
-- roles drop on their own; gallery_app does not, because it was granted CONNECT on the
-- database, and a database-level privilege survives the schema being dropped.
--
-- REASSIGN OWNED BY and DROP OWNED BY are the usual tools and neither works here: both need
-- membership in the role, and Supabase's `postgres` holds ADMIN OPTION on roles it created
-- without SET or INHERIT, which is admin rights over the role rather than membership of it.
-- An explicit REVOKE does work, because `postgres` granted the privilege in the first place.
--
-- This matters more than tidiness: gallery_app is a LOGIN role with a password, so until it
-- is gone it is a live credential able to connect to the database this project shares with
-- another product.

CREATE TEMP TABLE drop_log (step text, detail text);

-- What actually depends on the role, before anything is changed. If the revokes below do not
-- clear it, this is the row that says what else is holding on.
INSERT INTO drop_log
SELECT 'before: dependency', coalesce(string_agg(DISTINCT
         CASE s.deptype::text WHEN 'a' THEN 'privileges' WHEN 'o' THEN 'owns objects'
                        WHEN 'r' THEN 'reassigned' ELSE s.deptype::text END
         || ' in ' || coalesce(d.datname::text, 'this database'), ', '), 'nothing depends on it')
  FROM pg_shdepend s
  JOIN pg_roles r ON r.oid = s.refobjid
  LEFT JOIN pg_database d ON d.oid = s.dbid
 WHERE r.rolname = 'gallery_app';

DO $$
DECLARE msg text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'gallery_app') THEN
    INSERT INTO drop_log VALUES ('result', 'absent — nothing to do');
    RETURN;
  END IF;

  -- Every privilege the old migration 004 granted, revoked where it was granted.
  BEGIN
    EXECUTE format('REVOKE ALL ON DATABASE %I FROM gallery_app', current_database());
    INSERT INTO drop_log VALUES ('revoked', 'all privileges on ' || current_database());
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS msg = MESSAGE_TEXT;
    INSERT INTO drop_log VALUES ('revoke database REFUSED', msg);
  END;

  BEGIN
    EXECUTE 'REVOKE ALL ON SCHEMA public FROM gallery_app';
    INSERT INTO drop_log VALUES ('revoked', 'all privileges on schema public');
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS msg = MESSAGE_TEXT;
    INSERT INTO drop_log VALUES ('revoke public REFUSED', msg);
  END;

  BEGIN
    EXECUTE 'DROP ROLE gallery_app';
    INSERT INTO drop_log VALUES ('result', 'gallery_app dropped');
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS msg = MESSAGE_TEXT;
    INSERT INTO drop_log VALUES ('result', 'STILL REFUSED: ' || msg);
  END;
END $$;

-- One result set: the SQL editor shows only the last one.
SELECT step AS result, detail FROM drop_log
UNION ALL
SELECT CASE WHEN count(*) = 0 THEN 'PASS' ELSE 'FAIL' END,
       CASE WHEN count(*) = 0
            THEN 'no role of the previous design remains'
            ELSE 'still present: ' || string_agg(rolname, ', ') END
  FROM pg_roles
 WHERE rolname IN ('gallery_app','gallery_anon','gallery_auth','gallery_authstore');
