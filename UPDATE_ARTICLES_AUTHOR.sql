-- Script pour réassigner les articles à l'utilisateur @rhenoir
-- Ce script va mettre à jour tous les articles pour qu'ils appartiennent à l'utilisateur rhenoir

-- Étape 1: Trouver l'ID de l'utilisateur rhenoir
-- (Cette requête est juste pour vérification, commentée car elle ne modifie rien)
-- SELECT id, username, email FROM profiles WHERE username = 'rhenoir' OR username = '@rhenoir';

-- Étape 2: Mettre à jour tous les articles pour les assigner à rhenoir
-- IMPORTANT: Remplacez 'USER_ID_DE_RHENOIR' par l'ID réel trouvé à l'étape 1
UPDATE articles
SET user_id = (
  SELECT id FROM profiles
  WHERE username = 'rhenoir' OR username = '@rhenoir'
  LIMIT 1
)
WHERE status = 'published';

-- Pour vérifier que la mise à jour a fonctionné:
-- SELECT a.id, a.title, a.slug, p.username
-- FROM articles a
-- LEFT JOIN profiles p ON a.user_id = p.id
-- WHERE a.status = 'published';
