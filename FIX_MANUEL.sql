-- ============================================================
-- FIX MANUEL - ÉTAPE PAR ÉTAPE
-- ============================================================
-- Exécutez UNE LIGNE À LA FOIS et notez les résultats
-- ============================================================

-- ÉTAPE 1: Quel est votre username exact?
SELECT id, username, email FROM profiles ORDER BY created_at DESC;
-- Notez l'ID et le username exact de rhenoir

-- ÉTAPE 2: Quels sont vos articles?
SELECT id, title, slug, status, user_id FROM articles ORDER BY created_at DESC;
-- Notez les IDs des articles

-- ÉTAPE 3: Est-ce que l'utilisateur rhenoir existe?
SELECT COUNT(*) as rhenoir_existe FROM profiles WHERE username = 'rhenoir';
-- Devrait retourner 1

-- ÉTAPE 4: Essayer avec LIKE
SELECT id FROM profiles WHERE username LIKE '%rhenoir%';
-- Devrait retourner l'ID de rhenoir

-- ÉTAPE 5: UPDATE article par article (remplacez les IDs)
-- Remplacez 'ARTICLE_ID_1' par l'ID du premier article
-- Remplacez 'RHENOIR_ID' par l'ID de rhenoir trouvé à l'étape 1
-- UPDATE articles SET user_id = 'RHENOIR_ID' WHERE id = 'ARTICLE_ID_1';

-- ÉTAPE 6: Vérifier RLS policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'articles';

-- ÉTAPE 7: Si RLS bloque, désactiver temporairement (ADMIN seulement)
-- ALTER TABLE articles DISABLE ROW LEVEL SECURITY;
-- UPDATE articles SET user_id = (SELECT id FROM profiles WHERE username = 'rhenoir') WHERE status = 'published';
-- ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- ÉTAPE 8: Vérifier le résultat
SELECT
  a.id,
  a.title,
  a.user_id,
  p.username
FROM articles a
LEFT JOIN profiles p ON a.user_id = p.id
WHERE a.status = 'published';
