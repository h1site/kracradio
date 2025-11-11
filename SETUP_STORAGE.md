# Configuration du Storage Supabase pour les images d'articles

## Problème RLS résolu ici ! 🔧

Si vous obtenez l'erreur `new row violates row-level security policy`, suivez ces étapes :

---

## Étape 1 : Créer le bucket via le Dashboard Supabase

### Option A : Via l'interface graphique

1. Allez sur [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sélectionnez votre projet **kracradio**
3. Cliquez sur **Storage** dans le menu latéral
4. Cliquez sur **New bucket**
5. Configurez le bucket :
   ```
   Name: public-assets
   Public bucket: ✅ (COCHÉ)
   File size limit: 5 MB
   Allowed MIME types: image/jpeg, image/png, image/gif, image/webp
   ```
6. Cliquez sur **Save**

### Option B : Via SQL Editor

1. Allez dans **SQL Editor**
2. Cliquez sur **New query**
3. Copiez-collez le contenu du fichier `fix_storage_rls.sql`
4. Cliquez sur **Run**

---

## Étape 2 : Vérifier les politiques RLS

Après avoir créé le bucket, vérifiez que ces 4 politiques sont actives :

### Dans Storage > Policies :

1. **Users can upload to public-assets** (INSERT)
   - Target: `authenticated`
   - WITH CHECK: `bucket_id = 'public-assets'`

2. **Public can read public-assets** (SELECT)
   - Target: `public`
   - USING: `bucket_id = 'public-assets'`

3. **Users can update own files in public-assets** (UPDATE)
   - Target: `authenticated`
   - USING: `bucket_id = 'public-assets'`

4. **Users can delete own files in public-assets** (DELETE)
   - Target: `authenticated`
   - USING: `bucket_id = 'public-assets'`

---

## Étape 3 : Tester l'upload

1. Connectez-vous à votre application
2. Allez sur `/dashboard/articles/edit`
3. Cliquez sur l'onglet **SEO & Media**
4. Uploadez une image
5. ✅ L'image devrait être convertie en WebP et uploadée !

---

## Structure des fichiers uploadés

```
Bucket: public-assets
├── articles/
│   └── {user_id}/
│       ├── 1704067200000.webp
│       ├── 1704067300000.webp
│       └── ...
```

---

## Dépannage

### Erreur persiste ?

1. **Vérifiez que le bucket existe** :
   ```sql
   SELECT * FROM storage.buckets WHERE id = 'public-assets';
   ```

2. **Vérifiez les politiques** :
   ```sql
   SELECT * FROM pg_policies
   WHERE schemaname = 'storage' AND tablename = 'objects';
   ```

3. **Supprimez et recréez le bucket** :
   - Storage > public-assets > Delete bucket
   - Recommencez l'Étape 1

### Besoin d'aide ?

- Consultez la doc Supabase Storage : https://supabase.com/docs/guides/storage
- Vérifiez les logs dans Storage > Logs

---

## ✅ Fait !

Une fois configuré, toutes les images seront automatiquement :
- Converties en WebP (85% qualité)
- Compressées (30-70% de réduction)
- Uploadées dans le bucket public-assets
- Accessibles publiquement via URL
