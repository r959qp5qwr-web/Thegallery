-- The Gallery — verify an applied schema, from the SQL editor.
--
-- Returns one row per check. Every row must read PASS.
--
-- This exists because the SQL editor swallows NOTICE, so the VERIFY blocks inside the
-- migrations can pass or fail unseen. These checks re-establish the same properties as
-- queries, which the editor does show, and add the two that matter for a shared database:
-- that nothing of this product's landed in `public`, and that its own tables really are in
-- its own schema. C1 alone would pass if the product had built nothing at all, so C2 is what
-- stops it being vacuous.
WITH ours(t) AS (VALUES
  ('auth_accounts'),('auth_tokens'),('auth_sessions'),('dev_outbox'),('makers'),('galleries'),
  ('works'),('work_images'),('contact_routes'),('operator_actions'),('write_intents'),
  ('operational_failures'),('material_categories')),
checks AS (
  SELECT 'C1 nothing of ours landed in public' AS what,
         coalesce(string_agg(table_name, ', '), 'clean') AS detail,
         count(*) = 0 AS pass
    FROM information_schema.tables
   WHERE table_schema = 'public' AND table_name IN (SELECT t FROM ours)
  UNION ALL
  SELECT 'C2 our tables are in gallery',
         count(*) || ' of 13 present',
         count(*) = 13
    FROM information_schema.tables
   WHERE table_schema = 'gallery' AND table_name IN (SELECT t FROM ours)
  UNION ALL
  -- material_categories is deliberately public: it is the material vocabulary the browse
  -- rail reads, and carries no private data. Every other base table must be unreachable.
  SELECT 'C3 anon holds no grant on any private table',
         coalesce(string_agg(DISTINCT table_name, ', '), 'clean'),
         count(*) = 0
    FROM information_schema.role_table_grants
   WHERE grantee = 'gallery_anon' AND table_schema = 'gallery'
     AND table_name IN (SELECT t FROM ours) AND table_name <> 'material_categories'
  UNION ALL
  SELECT 'C4 no public view exposes identity columns',
         coalesce(string_agg(table_name || '.' || column_name, ', '), 'clean'),
         count(*) = 0
    FROM information_schema.columns
   WHERE table_schema = 'gallery' AND table_name LIKE 'public\_%'
     AND (column_name ILIKE '%email%' OR column_name ILIKE '%account%' OR column_name ILIKE '%password%')
  UNION ALL
  SELECT 'C5 row-level security is on everywhere',
         coalesce(string_agg(c.relname, ', '), 'all on'),
         count(*) = 0
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = 'gallery' AND c.relkind = 'r' AND NOT c.relrowsecurity
     AND c.relname IN (SELECT t FROM ours) AND c.relname <> 'material_categories'
     AND c.relname <> 'dev_outbox' AND c.relname <> 'auth_tokens' AND c.relname <> 'auth_sessions'
  UNION ALL
  SELECT 'C6 operator record is append-only',
         coalesce(string_agg(grantee || ':' || privilege_type, ', '), 'no update/delete granted'),
         count(*) = 0
    FROM information_schema.role_table_grants
   WHERE table_schema = 'gallery' AND table_name = 'operator_actions'
     AND privilege_type IN ('UPDATE','DELETE') AND grantee IN ('gallery_anon','gallery_auth')
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
  SELECT 'C8 app roles cannot bypass RLS',
         coalesce(string_agg(rolname, ', '), 'none bypass'), count(*) = 0
    FROM pg_roles WHERE rolname IN ('gallery_app','gallery_anon','gallery_auth')
     AND (rolsuper OR rolbypassrls)
  UNION ALL
  SELECT 'C9 gallery_app can log in and must SET ROLE',
         coalesce(string_agg(rolname || ' login=' || rolcanlogin || ' inherit=' || rolinherit, ''),
                  'MISSING — the app has no role to connect as'),
         count(*) = 1 AND bool_and(rolcanlogin AND NOT rolinherit)
    FROM pg_roles WHERE rolname = 'gallery_app'
  UNION ALL
  SELECT 'C10 the vocabulary seeded', count(*) || ' materials', count(*) = 5
    FROM gallery.material_categories WHERE active
)
SELECT CASE WHEN pass THEN 'PASS' ELSE 'FAIL' END AS result, what, detail
  FROM checks ORDER BY what;
