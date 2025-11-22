-- ============================================================
-- FIX FORCE - SOLUTION GARANTIE
-- ============================================================
-- Ce script va forcer l'assignation peu importe l'état actuel
-- ============================================================

-- D'abord, regardons TOUT
SELECT '=== TOUS LES PROFILES ===' as info;
SELECT id, username, email FROM profiles ORDER BY created_at DESC;

SELECT '=== TOUS LES ARTICLES ===' as info;
SELECT id, title, status, user_id FROM articles ORDER BY created_at DESC;

-- Maintenant, UPDATE FORCÉ avec l'ID exact de rhenoir
-- Remplacez 'VOTRE_ID_RHENOIR' par l'ID que vous voyez dans la première requête

-- Version 1: Si username = 'rhenoir' (sans @)
UPDATE articles
SET user_id = (SELECT id FROM profiles WHERE username = 'rhenoir')
WHERE status = 'published' OR status = 'draft';

-- Version 2: Si username = '@rhenoir' (avec @)
-- UPDATE articles
-- SET user_id = (SELECT id FROM profiles WHERE username = '@rhenoir')
-- WHERE status = 'published' OR status = 'draft';

-- Vérification finale
SELECT '=== RÉSULTAT FINAL ===' as info;
SELECT
  a.id,
  a.title,
  a.status,
  a.user_id,
  p.username,
  p.email,
  p.avatar_url
FROM articles a
LEFT JOIN profiles p ON a.user_id = p.id
ORDER BY a.created_at DESC;

-- Test de correspondance
SELECT '=== TEST CORRESPONDANCE ===' as info;
SELECT
  (SELECT COUNT(*) FROM articles WHERE user_id = (SELECT id FROM profiles WHERE username = 'rhenoir')) as articles_avec_rhenoir,
  (SELECT COUNT(*) FROM articles WHERE user_id IS NULL) as articles_sans_auteur,
  (SELECT COUNT(*) FROM articles) as total_articles;
