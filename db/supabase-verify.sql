-- The Gallery — verify an applied schema, from the SQL editor.
--
-- Returns one row per check. Every row must read PASS.
--
-- This exists because the SQL editor swallows NOTICE, so the VERIFY blocks inside the
-- migrations can pass or fail unseen. These checks re-establish the same properties as
-- queries, which the editor does show, and add the ones that matter for a schema exposed
-- through PostgREST inside a project shared with another product.
WITH ours(t) AS (VALUES
  ('makers'),('galleries'),('works'),('work_images'),('contact_routes'),('operator_actions'),
  ('write_intents'),('operational_failures'),('material_categories'),('operators'),
  ('account_closures')),
checks AS (
  SELECT 'C1 nothing of ours landed in public' AS what,
         coalesce(string_agg(table_name, ', '), 'clean') AS detail,
         count(*) = 0 AS pass
    FROM information_schema.tables
   WHERE table_schema = 'public' AND table_name IN (SELECT t FROM ours)
  UNION ALL
  SELECT 'C2 our tables are in gallery',
         count(*) || ' of 11 present', count(*) = 11
    FROM information_schema.tables
   WHERE table_schema = 'gallery' AND table_name IN (SELECT t FROM ours)
  UNION ALL
  -- material_categories is deliberately readable: it is the browse vocabulary and carries no
  -- private data. Every other base table must be unreachable to anon by grant, not by policy.
  SELECT 'C3 anon holds no grant on any private table',
         coalesce(string_agg(DISTINCT table_name, ', '), 'clean'), count(*) = 0
    FROM information_schema.role_table_grants
   WHERE grantee = 'anon' AND table_schema = 'gallery'
     AND table_name IN (SELECT t FROM ours) AND table_name <> 'material_categories'
  UNION ALL
  SELECT 'C4 no public view exposes identity columns',
         coalesce(string_agg(table_name || '.' || column_name, ', '), 'clean'), count(*) = 0
    FROM information_schema.columns
   WHERE table_schema = 'gallery' AND table_name LIKE 'public\_%'
     AND (column_name ILIKE '%email%' OR column_name ILIKE '%user_id%' OR column_name ILIKE '%password%')
  UNION ALL
  -- In an exposed schema a table without RLS is reachable by anyone holding the publishable
  -- key. This check names no table on purpose: it must catch one nobody remembered to list.
  SELECT 'C5 row-level security is on for every table in gallery',
         coalesce(string_agg(c.relname, ', '), 'all on'), count(*) = 0
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = 'gallery' AND c.relkind = 'r' AND NOT c.relrowsecurity
  UNION ALL
  SELECT 'C6 operator record is append-only',
         coalesce(string_agg(grantee || ':' || privilege_type, ', '), 'no update/delete granted'),
         count(*) = 0
    FROM information_schema.role_table_grants
   WHERE table_schema = 'gallery' AND table_name = 'operator_actions'
     AND privilege_type IN ('UPDATE','DELETE') AND grantee IN ('anon','authenticated')
  UNION ALL
  SELECT 'C7 no transaction table, no engagement column',
         coalesce(string_agg(name, ', '), 'clean'), count(*) = 0
    FROM (
      SELECT table_name AS name FROM information_schema.tables
       WHERE table_schema = 'gallery'
         AND table_name ~ '(cart|checkout|order|payment|wallet|escrow|refund|shipping|dispute)'
      UNION ALL
      SELECT table_name || '.' || column_name FROM information_schema.columns
       WHERE table_schema = 'gallery'
         AND column_name ~ '(like_count|likes|follower|following|reaction|comment_count|view_count|popularity)'
    ) x
  UNION ALL
  -- PostgREST turns every executable function in an exposed schema into a callable endpoint,
  -- and a new function's default EXECUTE is PUBLIC. Only one is meant to be open to anon.
  SELECT 'C8 anon can execute only the public image key function',
         coalesce(string_agg(p.proname, ', '), 'only storage_key_for_public_image'), count(*) = 0
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'gallery' AND has_function_privilege('anon', p.oid, 'EXECUTE')
     AND p.proname <> 'storage_key_for_public_image'
  UNION ALL
  SELECT 'C9 the operator table is reachable by nobody',
         coalesce(string_agg(grantee, ', '), 'no grant to anon or authenticated'), count(*) = 0
    FROM information_schema.role_table_grants
   WHERE table_schema = 'gallery' AND table_name = 'operators'
     AND grantee IN ('anon','authenticated')
  UNION ALL
  SELECT 'C10 the vocabulary seeded', count(*) || ' materials', count(*) = 5
    FROM gallery.material_categories WHERE active
  UNION ALL
  -- The previous design's roles must be gone, or the project still carries a login role with
  -- rights over this schema that nothing uses.
  SELECT 'C11 the pre-GAL-SUPA-1 roles are gone',
         coalesce(string_agg(rolname, ', '), 'clean'), count(*) = 0
    FROM pg_roles WHERE rolname IN ('gallery_app','gallery_anon','gallery_auth','gallery_authstore')
  UNION ALL
  -- Every write policy must go through writing_maker_id(), which returns NULL for a suspended
  -- maker. GAL-A1: a suspended maker exercises no maker privilege.
  SELECT 'C12 write policies refuse a suspended maker',
         coalesce(string_agg(polname, ', '), 'all write policies check maker status'), count(*) = 0
    FROM pg_policy
   WHERE polrelid IN ('gallery.works'::regclass, 'gallery.work_images'::regclass,
                      'gallery.contact_routes'::regclass, 'gallery.galleries'::regclass)
     AND polcmd <> 'r'
     AND pg_get_expr(polwithcheck, polrelid) NOT LIKE '%writing_maker_id%'
)
SELECT CASE WHEN pass THEN 'PASS' ELSE 'FAIL' END AS result, what, detail
  FROM checks ORDER BY what;
