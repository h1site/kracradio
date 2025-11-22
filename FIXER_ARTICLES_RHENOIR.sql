-- ============================================================
-- FIXER TOUS LES ARTICLES - ASSIGNER À RHENOIR
-- ============================================================
-- Ce script va assigner TOUS les articles publiés à rhenoir
-- Exécutez ce script APRÈS avoir vérifié avec DIAGNOSTIC_ARTICLES.sql
-- ============================================================

-- Mise à jour de TOUS les articles publiés (même ceux qui ont déjà un auteur)
UPDATE articles
SET user_id = (
  SELECT id
  FROM profiles
  WHERE username ILIKE '%rhenoir%' OR email ILIKE '%rhenoir%'
  LIMIT 1
)
WHERE status = 'published';

-- Vérification après la mise à jour
SELECT
  '=== VÉRIFICATION FINALE ===' as section,
  a.id,
  a.title,
  a.slug,
  a.status,
  p.username as auteur,
  p.avatar_url as avatar
FROM articles a
LEFT JOIN profiles p ON a.user_id = p.id
WHERE a.status = 'published'
ORDER BY a.created_at DESC;
