-- Script pour créer et configurer le bucket public-assets avec les bonnes politiques RLS
-- À exécuter dans le SQL Editor de Supabase Dashboard

-- 1. Créer le bucket s'il n'existe pas
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'public-assets',
  'public-assets',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

-- 2. Supprimer toutes les anciennes politiques
DROP POLICY IF EXISTS "Allow authenticated users to upload" ON storage.objects;
DROP POLICY IF EXISTS "Allow public to read" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own files" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to public-assets" ON storage.objects;

-- 3. Créer les nouvelles politiques
-- INSERT: Permettre aux utilisateurs authentifiés d'uploader
CREATE POLICY "Users can upload to public-assets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'public-assets');

-- SELECT: Lecture publique
CREATE POLICY "Public can read public-assets"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'public-assets');

-- UPDATE: Les utilisateurs peuvent mettre à jour leurs fichiers
CREATE POLICY "Users can update own files in public-assets"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'public-assets')
WITH CHECK (bucket_id = 'public-assets');

-- DELETE: Les utilisateurs peuvent supprimer leurs fichiers
CREATE POLICY "Users can delete own files in public-assets"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'public-assets');

-- 4. Vérifier que les politiques sont créées
SELECT
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY policyname;
