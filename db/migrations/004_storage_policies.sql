CREATE SCHEMA IF NOT EXISTS "@schema@";
SET search_path = "@schema@";

-- Who may read and write the image bytes.
--
-- The bucket is PRIVATE. If it were public, an object URL would keep working after the work
-- behind it was retired, taken down or its maker suspended — and `/img`, which re-checks
-- visibility on every request, would simply be routed around. An unguessable path is
-- obscurity, not a permission control.
--
-- These predicates are the second wall. /img decides which key to look up; these decide
-- whether the bytes come back. Either one alone would be a single point of failure, and they
-- fail independently: a mistake in the route still meets a refusal from the store.
--
-- The object path is `<storage_key>/<variant>.jpg`, so the first segment is the key.

CREATE OR REPLACE FUNCTION storage_object_is_public(p_name text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = "@schema@" AS $$
  SELECT EXISTS (
    SELECT 1 FROM work_images i
      JOIN public_work_images p ON p.id = i.id
     WHERE i.storage_key = split_part(p_name, '/', 1))
$$;

CREATE OR REPLACE FUNCTION storage_object_is_mine(p_name text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = "@schema@" AS $$
  SELECT EXISTS (
    SELECT 1 FROM work_images i
      JOIN works w     ON w.id = i.work_id
      JOIN galleries g ON g.id = w.gallery_id
      JOIN makers m    ON m.id = g.maker_id
     WHERE i.storage_key = split_part(p_name, '/', 1)
       AND m.user_id = auth.uid()
       AND m.status = 'active')
$$;

GRANT EXECUTE ON FUNCTION storage_object_is_public(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION storage_object_is_mine(text)  TO authenticated;

-- Storage policies live on storage.objects, which this product does not own; they are created
-- here rather than in the dashboard so that they are versioned with the predicates they call.
DROP POLICY IF EXISTS gallery_images_public_read ON storage.objects;
CREATE POLICY gallery_images_public_read ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'gallery-images' AND storage_object_is_public(name));

DROP POLICY IF EXISTS gallery_images_own_read ON storage.objects;
CREATE POLICY gallery_images_own_read ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'gallery-images' AND storage_object_is_mine(name));

-- A maker writes only under a key that already belongs to one of their own images. That is why
-- the application writes the storage key to work_images BEFORE uploading a byte: an upload
-- under a key nobody has claimed is refused, so a signed-in stranger cannot fill the bucket.
DROP POLICY IF EXISTS gallery_images_own_write ON storage.objects;
CREATE POLICY gallery_images_own_write ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'gallery-images' AND storage_object_is_mine(name));

DROP POLICY IF EXISTS gallery_images_own_update ON storage.objects;
CREATE POLICY gallery_images_own_update ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'gallery-images' AND storage_object_is_mine(name))
  WITH CHECK (bucket_id = 'gallery-images' AND storage_object_is_mine(name));

DROP POLICY IF EXISTS gallery_images_own_delete ON storage.objects;
CREATE POLICY gallery_images_own_delete ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'gallery-images' AND storage_object_is_mine(name));

DO $verify$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM pg_policy
   WHERE polrelid = 'storage.objects'::regclass AND polname LIKE 'gallery_images_%';
  IF n <> 5 THEN RAISE EXCEPTION 'VERIFY V11 failed: % storage policies, expected 5', n; END IF;
  RAISE NOTICE 'VERIFY V11 passed';
END $verify$;
