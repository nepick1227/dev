-- ============================================================
-- Storage buckets and access policies for user-uploaded images
-- ============================================================

INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES
  (
    'record-images',
    'record-images',
    false,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
  ),
  (
    'profile-images',
    'profile-images',
    false,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
  )
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "record_images_public_select" ON storage.objects;
DROP POLICY IF EXISTS "record_images_select_own_folder" ON storage.objects;
DROP POLICY IF EXISTS "record_images_insert_own_folder" ON storage.objects;
DROP POLICY IF EXISTS "record_images_delete_own_folder" ON storage.objects;
DROP POLICY IF EXISTS "profile_images_public_select" ON storage.objects;
DROP POLICY IF EXISTS "profile_images_select_own_avatar" ON storage.objects;
DROP POLICY IF EXISTS "profile_images_insert_own_avatar" ON storage.objects;
DROP POLICY IF EXISTS "profile_images_update_own_avatar" ON storage.objects;
DROP POLICY IF EXISTS "profile_images_delete_own_avatar" ON storage.objects;

CREATE POLICY "record_images_select_own_folder"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'record-images'
    AND (storage.foldername(name))[1] = (select auth.uid())::text
  );

CREATE POLICY "record_images_insert_own_folder"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'record-images'
    AND (storage.foldername(name))[1] = (select auth.uid())::text
  );

CREATE POLICY "record_images_delete_own_folder"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'record-images'
    AND (storage.foldername(name))[1] = (select auth.uid())::text
  );

CREATE POLICY "profile_images_select_own_avatar"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'profile-images'
    AND (storage.foldername(name))[1] = 'avatars'
    AND storage.filename(name) LIKE (select auth.uid())::text || '.%'
  );

CREATE POLICY "profile_images_insert_own_avatar"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'profile-images'
    AND (storage.foldername(name))[1] = 'avatars'
    AND storage.filename(name) LIKE (select auth.uid())::text || '.%'
  );

CREATE POLICY "profile_images_update_own_avatar"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'profile-images'
    AND (storage.foldername(name))[1] = 'avatars'
    AND storage.filename(name) LIKE (select auth.uid())::text || '.%'
  )
  WITH CHECK (
    bucket_id = 'profile-images'
    AND (storage.foldername(name))[1] = 'avatars'
    AND storage.filename(name) LIKE (select auth.uid())::text || '.%'
  );

CREATE POLICY "profile_images_delete_own_avatar"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'profile-images'
    AND (storage.foldername(name))[1] = 'avatars'
    AND storage.filename(name) LIKE (select auth.uid())::text || '.%'
  );
