-- Seeded vocabulary (DOMAIN_MODEL §1: clay, textile, wood, metal, paper) and executing
-- VERIFY blocks. A migration that cannot prove its own effect is a hope, not a migration.

INSERT INTO material_categories (key, label, position, active) VALUES
  ('clay',    'Clay',    1, true),
  ('textile', 'Textile', 2, true),
  ('wood',    'Wood',    3, true),
  ('metal',   'Metal',   4, true),
  ('paper',   'Paper',   5, true)
ON CONFLICT (key) DO NOTHING;

DO $verify$
DECLARE n int; leaked text;
BEGIN
  -- V1 the vocabulary is seeded
  SELECT count(*) INTO n FROM material_categories WHERE active;
  IF n <> 5 THEN RAISE EXCEPTION 'VERIFY V1 failed: % active material categories, expected 5', n; END IF;

  -- V2 the anonymous role holds no grant on any base table
  SELECT string_agg(table_name, ', ') INTO leaked
  FROM information_schema.role_table_grants
  WHERE grantee = 'gallery_anon'
    AND table_schema = 'public'
    AND table_name IN ('auth_accounts','auth_tokens','auth_sessions','makers','galleries','works',
                       'work_images','contact_routes','operator_actions','write_intents','dev_outbox');
  IF leaked IS NOT NULL THEN
    RAISE EXCEPTION 'VERIFY V2 failed: gallery_anon holds grants on base tables: %', leaked;
  END IF;

  -- V3 no public view exposes an account email column
  SELECT string_agg(table_name || '.' || column_name, ', ') INTO leaked
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name LIKE 'public\_%'
    AND (column_name ILIKE '%email%' OR column_name ILIKE '%account%' OR column_name ILIKE '%password%');
  IF leaked IS NOT NULL THEN
    RAISE EXCEPTION 'VERIFY V3 failed: a public view exposes private identity columns: %', leaked;
  END IF;

  -- V4 every governed table has row-level security enabled
  SELECT string_agg(relname, ', ') INTO leaked
  FROM pg_class c JOIN pg_namespace ns ON ns.oid = c.relnamespace
  WHERE ns.nspname = 'public' AND c.relkind = 'r' AND c.relrowsecurity = false
    AND c.relname IN ('auth_accounts','makers','galleries','works','work_images','contact_routes',
                      'operator_actions','write_intents');
  IF leaked IS NOT NULL THEN
    RAISE EXCEPTION 'VERIFY V4 failed: row-level security is off for: %', leaked;
  END IF;

  -- V5 operator_actions carries no UPDATE or DELETE grant for any application role
  SELECT string_agg(grantee || ':' || privilege_type, ', ') INTO leaked
  FROM information_schema.role_table_grants
  WHERE table_name = 'operator_actions' AND privilege_type IN ('UPDATE','DELETE')
    AND grantee IN ('gallery_anon','gallery_auth');
  IF leaked IS NOT NULL THEN
    RAISE EXCEPTION 'VERIFY V5 failed: operator_actions is not append-only: %', leaked;
  END IF;

  -- V6 no commerce table reached the schema (GAL-04, refusals GAL-R*)
  SELECT string_agg(table_name, ', ') INTO leaked
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name ~ '(cart|checkout|order|payment|wallet|escrow|refund|shipping|dispute)';
  IF leaked IS NOT NULL THEN
    RAISE EXCEPTION 'VERIFY V6 failed: transaction tables present: %', leaked;
  END IF;

  -- V7 no engagement-count column reached the schema (GAL-OD-09)
  SELECT string_agg(table_name || '.' || column_name, ', ') INTO leaked
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND column_name ~ '(like_count|likes|follower|following|reaction|comment_count|view_count|popularity|rank_score)';
  IF leaked IS NOT NULL THEN
    RAISE EXCEPTION 'VERIFY V7 failed: engagement columns present: %', leaked;
  END IF;

  RAISE NOTICE 'VERIFY V1-V7 passed';
END $verify$;
