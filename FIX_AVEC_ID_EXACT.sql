-- ============================================================
-- FIX AVEC ID EXACT DE RHENOIR
-- ============================================================
-- ID de rhenoir: 6559fec1-29fc-4102-9de1-5ad3dae323a2
-- ============================================================

-- Vérifier l'utilisateur rhenoir
SELECT '=== RHENOIR ===' as section;
SELECT id, username, email, avatar_url
FROM profiles
WHERE id = '6559fec1-29fc-4102-9de1-5ad3dae323a2';

-- Voir l'état actuel des articles
SELECT '=== ARTICLES AVANT ===' as section;
SELECT
  a.id,
  a.title,
  a.status,
  a.user_id,
  p.username as auteur_actuel
FROM articles a
LEFT JOIN profiles p ON a.user_id = p.id
ORDER BY a.created_at DESC;

-- FORCER l'assignation avec l'ID exact
SELECT '=== UPDATE ===' as section;
UPDATE articles
SET user_id = '6559fec1-29fc-4102-9de1-5ad3dae323a2'
WHERE status = 'published';

-- Vérifier le résultat
SELECT '=== ARTICLES APRÈS ===' as section;
SELECT
  a.id,
  a.title,
  a.status,
  a.user_id,
  p.username as auteur_final,
  p.avatar_url
FROM articles a
LEFT JOIN profiles p ON a.user_id = p.id
WHERE status = 'published'
ORDER BY a.created_at DESC;

-- Compter combien d'articles sont assignés à rhenoir
SELECT '=== COMPTAGE ===' as section;
SELECT
  COUNT(*) as total_articles_rhenoir
FROM articles
WHERE user_id = '6559fec1-29fc-4102-9de1-5ad3dae323a2'
AND status = 'published';
