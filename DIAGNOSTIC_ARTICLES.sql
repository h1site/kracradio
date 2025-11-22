-- ============================================================
-- DIAGNOSTIC DES ARTICLES
-- ============================================================
-- Exécutez ce script d'abord pour voir l'état actuel
-- ============================================================

-- 1. Vérifier l'utilisateur rhenoir
SELECT
  '=== UTILISATEUR RHENOIR ===' as section,
  id,
  username,
  email,
  role,
  avatar_url
FROM profiles
WHERE username ILIKE '%rhenoir%' OR email ILIKE '%rhenoir%';

-- 2. Voir tous les articles et leurs auteurs actuels
SELECT
  '=== TOUS LES ARTICLES ===' as section,
  a.id,
  a.title,
  a.slug,
  a.status,
  a.user_id,
  p.username as auteur_actuel,
  p.avatar_url as avatar_actuel
FROM articles a
LEFT JOIN profiles p ON a.user_id = p.id
ORDER BY a.created_at DESC;

-- 3. Compter les articles par statut
SELECT
  '=== ARTICLES PAR STATUT ===' as section,
  status,
  COUNT(*) as nombre
FROM articles
GROUP BY status;

-- 4. Compter les articles avec/sans auteur
SELECT
  '=== ARTICLES AVEC/SANS AUTEUR ===' as section,
  CASE
    WHEN user_id IS NULL THEN 'Sans auteur (NULL)'
    ELSE 'Avec auteur'
  END as etat,
  COUNT(*) as nombre
FROM articles
WHERE status = 'published'
GROUP BY user_id IS NULL;
