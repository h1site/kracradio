-- ============================================================
-- DEBUG ET FIX SIMPLE - TOUT EN UN
-- ============================================================
-- Ce script va:
-- 1. Montrer l'ID de rhenoir
-- 2. Montrer les articles actuels
-- 3. Forcer l'assignation
-- 4. Vérifier le résultat
-- ============================================================

-- ÉTAPE 1: Trouver rhenoir
SELECT '=== 1. RHENOIR USER ===' as info;
SELECT id, username, email, avatar_url FROM profiles WHERE username = 'rhenoir';

-- ÉTAPE 2: État actuel des articles
SELECT '=== 2. ARTICLES AVANT UPDATE ===' as info;
SELECT
  a.id,
  a.title,
  a.status,
  a.user_id as user_id_actuel,
  p.username as auteur_actuel
FROM articles a
LEFT JOIN profiles p ON a.user_id = p.id
ORDER BY a.created_at DESC;

-- ÉTAPE 3: FORCER l'update - Version 1 (avec username exact)
SELECT '=== 3. UPDATE AVEC USERNAME rhenoir ===' as info;
UPDATE articles
SET user_id = (SELECT id FROM profiles WHERE username = 'rhenoir' LIMIT 1)
WHERE status = 'published';

-- ÉTAPE 4: Vérifier le résultat
SELECT '=== 4. ARTICLES APRÈS UPDATE ===' as info;
SELECT
  a.id,
  a.title,
  a.status,
  a.user_id as user_id_final,
  p.username as auteur_final,
  p.avatar_url
FROM articles a
LEFT JOIN profiles p ON a.user_id = p.id
WHERE a.status = 'published'
ORDER BY a.created_at DESC;

-- ÉTAPE 5: Vérifier que l'ID correspond
SELECT '=== 5. VERIFICATION CORRESPONDANCE ===' as info;
SELECT
  'rhenoir ID' as type,
  id as valeur
FROM profiles WHERE username = 'rhenoir'
UNION ALL
SELECT
  'article 1 user_id' as type,
  user_id as valeur
FROM articles WHERE status = 'published' LIMIT 1;
