-- SCHEMA ISOLATION (2026-09-06). Every object this product owns lives in ONE schema, and
-- nothing is created in `public`. @schema@ is substituted by the migration runner.
CREATE SCHEMA IF NOT EXISTS "@schema@";
SET search_path = "@schema@";

-- A role for the authentication store, so the application never needs an owner connection.
--
-- Session lookup happens BEFORE an identity exists, so it cannot be scoped by row-level
-- security the way every other read is. Until now that meant connecting as the database owner,
-- which was tolerable on a server and is not on Cloudflare: an edge Worker would be carrying
-- owner credentials for a database shared with another product.
--
-- gallery_authstore can reach the four authentication tables and NOTHING else. It holds no
-- grant on makers, galleries, works, images, routes or the operator record, so a mistake in
-- the auth module cannot become a way to read a maker's drafts. It has no LOGIN of its own:
-- the application reaches it with SET LOCAL ROLE from the one connection it already has, which
-- is also why Cloudflare needs only a single Hyperdrive binding.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'gallery_authstore') THEN
    CREATE ROLE gallery_authstore NOLOGIN;
  END IF;
END $$;

GRANT USAGE ON SCHEMA "@schema@" TO gallery_authstore;
GRANT SELECT, INSERT, UPDATE ON auth_accounts TO gallery_authstore;
GRANT SELECT, INSERT, UPDATE, DELETE ON auth_tokens TO gallery_authstore;
GRANT SELECT, INSERT, UPDATE, DELETE ON auth_sessions TO gallery_authstore;
GRANT SELECT, INSERT ON dev_outbox TO gallery_authstore;
GRANT INSERT ON operational_failures TO gallery_authstore;
GRANT gallery_authstore TO gallery_app;

-- auth_accounts carries row-level security for gallery_auth, which reaches only its own row.
-- The auth store legitimately reads any account row while establishing who is calling, so it
-- gets its own policy rather than an exemption from the mechanism.
DROP POLICY IF EXISTS authstore_all ON auth_accounts;
CREATE POLICY authstore_all ON auth_accounts FOR ALL TO gallery_authstore
  USING (true) WITH CHECK (true);

DO $verify$
DECLARE leaked text;
BEGIN
  -- The whole point of the role: it must hold no grant on any product table.
  SELECT string_agg(DISTINCT table_name, ', ') INTO leaked
  FROM information_schema.role_table_grants
  WHERE grantee = 'gallery_authstore' AND table_schema = current_schema()
    AND table_name IN ('makers','galleries','works','work_images','contact_routes',
                       'operator_actions','write_intents','material_categories');
  IF leaked IS NOT NULL THEN
    RAISE EXCEPTION 'VERIFY V9 failed: the auth store can reach product tables: %', leaked;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'gallery_authstore'
              AND (rolsuper OR rolbypassrls OR rolcanlogin)) THEN
    RAISE EXCEPTION 'VERIFY V9 failed: gallery_authstore must not log in or bypass RLS';
  END IF;

  RAISE NOTICE 'VERIFY V9 passed';
END $verify$;
