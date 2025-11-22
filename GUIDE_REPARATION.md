# Guide de Réparation - Avatars d'Auteurs Manquants

## Problème
Les avatars et liens d'auteurs ne s'affichent pas dans le carrousel d'articles sur la page d'accueil.

## Cause
Les articles dans la base de données n'ont pas de `user_id` assigné (la valeur est `NULL`).

## Solution en 3 Étapes

### Étape 1: Diagnostic (Optionnel)
Ouvrez votre console navigateur (F12) et allez sur http://localhost:3000

Vous devriez voir un de ces messages:
- ⚠️ **"AUCUN user_id trouvé dans les articles!"** → Les articles n'ont pas d'auteur assigné (c'est le problème)
- 🔍 **Articles user_ids: [...]** → Les articles ont des auteurs, mais peut-être pas le bon

### Étape 2: Vérifier la Base de Données
1. Allez sur https://app.supabase.com
2. Sélectionnez votre projet **KracRadio**
3. Allez dans **SQL Editor** (menu de gauche)
4. Copiez et collez le contenu de `DIAGNOSTIC_ARTICLES.sql`
5. Cliquez sur **Run**

**Résultats attendus:**
- Section 1: Vous devriez voir votre utilisateur **rhenoir** avec son ID
- Section 2: Vos articles devraient avoir `user_id = NULL` ou un autre user_id
- Section 4: Devrait montrer "Sans auteur (NULL)" pour vos articles publiés

### Étape 3: Réparer la Base de Données
1. Dans le même **SQL Editor**
2. Effacez le contenu précédent
3. Copiez et collez le contenu de `FIXER_ARTICLES_RHENOIR.sql`
4. Cliquez sur **Run**

**Ce script va:**
- Assigner TOUS les articles publiés à l'utilisateur **rhenoir**
- Afficher les résultats pour vérification

### Étape 4: Vérifier le Résultat
1. Retournez sur http://localhost:3000
2. Rafraîchissez la page (F5 ou Cmd+R)
3. Ouvrez la console (F12)

**Vous devriez voir:**
```
🔍 Articles user_ids: ["ID-DE-RHENOIR"]
👥 Auteurs chargés: [{id: "...", username: "rhenoir", avatar_url: "..."}]
   - rhenoir (ID-DE-RHENOIR): avatar=URL-ou-none
📄 Article "Titre": author=rhenoir, avatar=URL-ou-null
```

**Sur la page d'accueil:**
- Les avatars circulaires devraient apparaître (ou un cercle dégradé avec "R")
- Le texte "Par rhenoir" devrait apparaître
- Le lien vers `/profile/rhenoir` devrait fonctionner

## Fichiers Créés

### Scripts SQL
- **DIAGNOSTIC_ARTICLES.sql** - Pour voir l'état actuel de la base de données
- **FIXER_ARTICLES_RHENOIR.sql** - Pour assigner les articles à rhenoir
- **FIX_ALL_ARTICLES.sql** - Script complet avec diagnostic + réparation + vérification
- **FIX_ARTICLES_AUTHOR.sql** - Version antérieure (même fonction)
- **UPDATE_ARTICLES_AUTHOR.sql** - Version antérieure (même fonction)

### Code Modifié
- **src/pages/Home.jsx** - Ajout de logs détaillés pour le diagnostic
- **src/lib/articles.js** - Ajout de `avatar_url` dans la requête des auteurs
- **src/components/ArticleCarousel.jsx** - Affichage avatar + lien auteur (déjà fait)

## Notes Importantes

1. **Tous les scripts SQL peuvent être exécutés sans danger** - Ils ne suppriment rien, ils assignent juste les articles à rhenoir
2. **Les logs console sont temporaires** - Pour le diagnostic seulement, on peut les retirer après
3. **Si vous ne voyez toujours pas les avatars** après l'Étape 4:
   - Vérifiez que l'utilisateur rhenoir existe dans la table `profiles`
   - Vérifiez que les articles ont bien `status = 'published'`
   - Vérifiez les logs console pour plus de détails

## Commandes SQL Rapides

### Voir tous les utilisateurs
```sql
SELECT id, username, email, avatar_url FROM profiles;
```

### Voir tous les articles et leurs auteurs
```sql
SELECT a.id, a.title, a.user_id, p.username
FROM articles a
LEFT JOIN profiles p ON a.user_id = p.id
WHERE a.status = 'published';
```

### Assigner un article spécifique à rhenoir
```sql
UPDATE articles
SET user_id = (SELECT id FROM profiles WHERE username ILIKE '%rhenoir%' LIMIT 1)
WHERE id = 'ID-DE-L-ARTICLE';
```
