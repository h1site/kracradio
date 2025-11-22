-- Script pour assigner tous les articles publiés à l'utilisateur rhenoir
-- Étape 1: Trouver l'ID de rhenoir (décommenter pour vérifier)
SELECT id, username, email FROM profiles WHERE username LIKE '%rhenoir%';

-- Étape 2: Mettre à jour TOUS les articles publiés pour les assigner à rhenoir
-- Remplacez 'RHENOIR_USER_ID' par l'ID réel trouvé à l'étape 1
-- Exemple: UPDATE articles SET user_id = '6559fec1-29fc-4102-9de1-5ad3dae323a2'

UPDATE articles
SET user_id = (
  SELECT id FROM profiles
  WHERE username = 'rhenoir' OR username = '@rhenoir'
  LIMIT 1
)
WHERE status = 'published' AND user_id IS NULL;

-- Étape 3: Vérifier que la mise à jour a fonctionné
SELECT
  a.id,
  a.title,
  a.slug,
  p.username,
  a.user_id
FROM articles a
LEFT JOIN profiles p ON a.user_id = p.id
WHERE a.status = 'published'
ORDER BY a.created_at DESC;
