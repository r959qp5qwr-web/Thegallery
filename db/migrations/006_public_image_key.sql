CREATE SCHEMA IF NOT EXISTS "@schema@";
SET search_path = "@schema@";

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
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = "@schema@" AS $$
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
