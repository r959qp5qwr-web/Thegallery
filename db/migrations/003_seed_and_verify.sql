CREATE SCHEMA IF NOT EXISTS "@schema@";
SET search_path = "@schema@";

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
  WHERE grantee = 'anon'
    AND table_schema = current_schema()
    AND table_name IN ('makers','galleries','works','work_images','contact_routes',
                       'operator_actions','write_intents','operators','account_closures');
  IF leaked IS NOT NULL THEN
    RAISE EXCEPTION 'VERIFY V2 failed: anon holds grants on base tables: %', leaked;
  END IF;

  -- V3 no public view exposes an identity column
  SELECT string_agg(table_name || '.' || column_name, ', ') INTO leaked
  FROM information_schema.columns
  WHERE table_schema = current_schema() AND table_name LIKE 'public\_%'
    AND (column_name ILIKE '%email%' OR column_name ILIKE '%user_id%' OR column_name ILIKE '%password%');
  IF leaked IS NOT NULL THEN
    RAISE EXCEPTION 'VERIFY V3 failed: a public view exposes private identity columns: %', leaked;
  END IF;

  -- V4 every table in the schema has row-level security enabled. Not a named list: in an
  -- exposed schema a table without RLS is reachable by anyone with the publishable key, so
  -- the check must catch a table nobody remembered to add to a list.
  SELECT string_agg(relname, ', ') INTO leaked
  FROM pg_class c JOIN pg_namespace ns ON ns.oid = c.relnamespace
  WHERE ns.nspname = current_schema() AND c.relkind = 'r' AND c.relrowsecurity = false;
  IF leaked IS NOT NULL THEN
    RAISE EXCEPTION 'VERIFY V4 failed: row-level security is off for: %', leaked;
  END IF;

  -- V5 operator_actions carries no UPDATE or DELETE grant for any application role
  SELECT string_agg(grantee || ':' || privilege_type, ', ') INTO leaked
  FROM information_schema.role_table_grants
  WHERE table_schema = current_schema()
    AND table_name = 'operator_actions' AND privilege_type IN ('UPDATE','DELETE')
    AND grantee IN ('anon','authenticated');
  IF leaked IS NOT NULL THEN
    RAISE EXCEPTION 'VERIFY V5 failed: operator_actions is not append-only: %', leaked;
  END IF;

  -- V6 no commerce table reached the schema (GAL-04, refusals GAL-R*)
  SELECT string_agg(table_name, ', ') INTO leaked
  FROM information_schema.tables
  WHERE table_schema = current_schema()
    AND table_name ~ '(cart|checkout|order|payment|wallet|escrow|refund|shipping|dispute)';
  IF leaked IS NOT NULL THEN
    RAISE EXCEPTION 'VERIFY V6 failed: transaction tables present: %', leaked;
  END IF;

  -- V7 no engagement-count column reached the schema (GAL-OD-09)
  SELECT string_agg(table_name || '.' || column_name, ', ') INTO leaked
  FROM information_schema.columns
  WHERE table_schema = current_schema()
    AND column_name ~ '(like_count|likes|follower|following|reaction|comment_count|view_count|popularity|rank_score)';
  IF leaked IS NOT NULL THEN
    RAISE EXCEPTION 'VERIFY V7 failed: engagement columns present: %', leaked;
  END IF;

  -- V8 nobody may execute a function that was never granted deliberately. PostgREST turns
  -- every executable function in an exposed schema into a callable endpoint, so a default
  -- EXECUTE to PUBLIC is an open door rather than an untidiness.
  SELECT string_agg(p.proname, ', ') INTO leaked
  FROM pg_proc p JOIN pg_namespace ns ON ns.oid = p.pronamespace
  WHERE ns.nspname = current_schema()
    AND has_function_privilege('anon', p.oid, 'EXECUTE')
    AND p.proname NOT IN ('storage_key_for_public_image');
  IF leaked IS NOT NULL THEN
    RAISE EXCEPTION 'VERIFY V8 failed: anon can execute functions it was not granted: %', leaked;
  END IF;

  -- V9 the operator table is reachable by nobody through the API: RLS on, no policy, no grant.
  SELECT string_agg(x, ', ') INTO leaked FROM (
    SELECT 'policy ' || polname AS x FROM pg_policy
     WHERE polrelid = (current_schema() || '.operators')::regclass
    UNION ALL
    SELECT 'grant ' || grantee FROM information_schema.role_table_grants
     WHERE table_schema = current_schema() AND table_name = 'operators'
       AND grantee IN ('anon','authenticated')
  ) y;
  IF leaked IS NOT NULL THEN
    RAISE EXCEPTION 'VERIFY V9 failed: operators is reachable: %', leaked;
  END IF;

  -- V10 a suspended maker cannot write. Established from the policy text rather than by
  -- running as a suspended maker, which the probe suite does over HTTP: every write policy
  -- must go through writing_maker_id(), which returns NULL unless the maker is active.
  SELECT string_agg(polname, ', ') INTO leaked
  FROM pg_policy
  WHERE polrelid IN ((current_schema() || '.works')::regclass,
                     (current_schema() || '.work_images')::regclass,
                     (current_schema() || '.contact_routes')::regclass,
                     (current_schema() || '.galleries')::regclass)
    AND polcmd <> 'r'
    AND pg_get_expr(polwithcheck, polrelid) NOT LIKE '%writing_maker_id%';
  IF leaked IS NOT NULL THEN
    RAISE EXCEPTION 'VERIFY V10 failed: write policies that do not check maker status: %', leaked;
  END IF;

  RAISE NOTICE 'VERIFY V1-V10 passed';
END $verify$;
