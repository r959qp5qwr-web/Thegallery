-- The Gallery — migrations from 005 on, for a database that already carries the earlier
-- ones. GENERATED from db/migrations/*.sql by `npm run db:sqlfile 005`; do not edit.
--
-- Each migration is idempotent where it can be and states plainly where it is not. Everything
-- below touches the `gallery` schema only.

-- ============================================================ 005_auth_store_role.sql
-- SCHEMA ISOLATION (2026-09-06). Every object this product owns lives in ONE schema, and
-- nothing is created in `public`. gallery is substituted by the migration runner.
CREATE SCHEMA IF NOT EXISTS "gallery";
SET search_path = "gallery";

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

GRANT USAGE ON SCHEMA "gallery" TO gallery_authstore;
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

-- ============================================================ 006_public_image_key.sql
CREATE SCHEMA IF NOT EXISTS "gallery";
SET search_path = "gallery";

-- Resolving a published image's stored bytes, without a privileged connection.
--
-- /img/[id]/[variant] needs `storage_key`, which the public view deliberately does not carry:
-- it is internal structure, not something a visitor should be handed. Until now the route
-- read it through the authentication connection, which the new gallery_authstore role refused
-- — correctly. That refusal exposed the real problem: an image route was reaching for a
-- privileged connection to read a product table.
--
-- This function returns the key ONLY for an image that is already publicly visible, reusing
-- public_work_images rather than restating the predicate. A maker's own draft images are not
-- reachable through it; that path goes through the maker's own role, where row-level security
-- scopes it to their work.
CREATE OR REPLACE FUNCTION storage_key_for_public_image(p_image_id uuid)
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = "gallery" AS $$
  SELECT i.storage_key
    FROM work_images i
    JOIN public_work_images p ON p.id = i.id
   WHERE i.id = p_image_id
$$;
GRANT EXECUTE ON FUNCTION storage_key_for_public_image(uuid) TO gallery_anon, gallery_auth;

DO $verify$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.role_table_grants
     WHERE grantee IN ('gallery_anon','gallery_auth') AND table_schema = current_schema()
       AND table_name = 'work_images' AND grantee = 'gallery_anon'
  ) THEN
    RAISE EXCEPTION 'VERIFY V10 failed: the anonymous role gained a direct grant on work_images';
  END IF;
  RAISE NOTICE 'VERIFY V10 passed';
END $verify$;
