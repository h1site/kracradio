# Instructions pour activer la fonctionnalité de Likes

## Problème
La fonctionnalité de likes des chansons a été développée mais la table `song_likes` n'existe pas encore dans votre base de données Supabase.

## Solution

### Option 1: Via Supabase Dashboard (Recommandé)

1. Allez sur [https://supabase.com](https://supabase.com)
2. Connectez-vous à votre projet KracRadio
3. Dans le menu de gauche, cliquez sur **SQL Editor**
4. Cliquez sur **New Query**
5. Copiez-collez le contenu du fichier `supabase/migrations/20251112_create_song_likes.sql`
6. Cliquez sur **Run** pour exécuter la migration

### Option 2: Via CLI Supabase

Si vous avez la CLI Supabase installée et configurée:

```bash
# Connectez-vous à Supabase
supabase login

# Liez votre projet local au projet Supabase
supabase link --project-ref VOTRE_PROJECT_REF

# Appliquez la migration
supabase db push
```

## Vérification

Après avoir appliqué la migration, vérifiez que:

1. La table `song_likes` existe dans votre base de données
2. Les policies RLS sont actives
3. Les indexes sont créés

Vous pouvez vérifier en exécutant cette requête dans SQL Editor:

```sql
SELECT * FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'song_likes';
```

## Résultat attendu

Une fois la migration appliquée, les fonctionnalités suivantes seront actives:

- ❤️ Bouton "J'aime" sur le player bar (fonctionnel)
- 📝 Page `/liked-songs` - Historique des chansons aimées
- 📊 Page `/charts` - Charts des chansons les plus aimées par canal
- 👤 Lien dans `/profile` vers l'historique des likes

## En cas de problème

Si vous voyez le message:
> "La fonctionnalité de likes n'est pas encore activée"

Cela signifie que la migration n'a pas été appliquée correctement. Réessayez les étapes ci-dessus.
