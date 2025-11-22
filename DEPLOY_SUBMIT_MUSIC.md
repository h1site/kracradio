# Déploiement de la fonction Submit Music

## Étape 1: Ajouter le token Dropbox dans Supabase

### Option A: Via l'interface Supabase Dashboard (Recommandé)

1. Allez sur: https://supabase.com/dashboard/project/gpcedzaflhiucwyjgdai/settings/functions

2. Cliquez sur "Edge Functions" dans le menu

3. Cliquez sur "Secrets" ou "Environment Variables"

4. Ajoutez un nouveau secret:
   - **Name**: `DROPBOX_ACCESS_TOKEN`
   - **Value**: `sl.u.AGLw2kS-YzFQhUsnJux-K7vK0yMMjKFq65QD-_5lMgTM4pJTnKlVJEYLwdExDG-n9VBLO_lkWIGTaYX4UbkqjOVCU4HJyLhXCioYmhCKUsqN0M3-urFjLTD5SHMBKtjHt4loKrFYTnlIDnHvaTPYpujtMN93ZCAJ3KiKniKY8QA5XKnlTQWMWhLltZSrky3zGiLkh8IAIcx_vqj5SypecoEpYl_a-2J7T_npJY55dMeOOZ7JXV8PASOIg7praNgdg7vJSG2xoHmIJPUNQzsQnijKMQJYiW2-zZ17BD5339B8dEaNpTcEDIYBWu80M9brVX5BfzWrPBwM0qRsPqw1Y82cXBD1jT-95CxAPbCR-FHX7xc8tRqHKSc6f5E7DIJZ3Or4MXIMG-9ryD7p54_EZFX6HO_zGm0QZoheRwIlqLPxkFhFrKr8B-OMxM76bLr4MjDVoZozHqYPooyZoNga__Eyay04B4h5K67WSVVZdPSvS6ncv-RiQYmZPqEVk5YZPfoED5R5a1cXYpblRkIgXXxg3vyIqXjU7R7RQLZlqBNwGECLDL2Wyt0eJDool1L5Z6rK-Jmr58t5WS2Px2xpDDIzgUrogoXaKpfcJtkMwr7RkhNABjmm2Hd5ybE8mTQzsL41lylNzocdB8QcXDAy0uexAJ7ULpt66_Q9pCvkhww40fs5-eUyRblQGC9Ce_aFNmI5RKf5eItNN3irWwQE3S2ExDilULagYFgJQY5o4Ft84yzVBHgz85Bxq1ngBeiq853JMIX-CtSW0YYv9rQSi_Vru7EiRGw9jhjUcMkTdlM_OS3aLkYNKyrLY3pf-SAwpKEFK8q-_gr4uqMvmtTSnZOfu7Qnf4jiW5IU4xUmLkT2y_XnUDuYgxcYgXwCQYoZ4LRey2NFN1od6Lced6IMmTbdTRNSU4FgUvC5t2KFbd4KvjWmCH7Zv2iCYa4H7i63vNqVjhGq1fidCTO2H00bJLmTFZVMP06Vkt7fvzivIRKHZe7WOXJ-Zzfv_YbPAobaMzRv1pwZyvNuabX2ThNVkl0JJ-WJxkoC2WZUhIHKFIUbwRM0xY0jQnJDBQzqkUx2cx8QTKfFTqqdMLJHqr_LptFDn15JmV2rD-OBTObh6sXEO9dxMfVNOXnxBDL7Ebh3m8kKyYzGqje1lGlgMiefU1oJkqkpc4uvSeisHJQfM3M47LbAUNbKyDqRxRY6aXII34wyhAcdHpImQjPiZt7qvDikhgWCtS0CpwXTJkPl6nKycwxJ0sN3r00-XU08gQ6T8Ko9wwRQj_mP2eyqTjqnrhQVuMh0kbzvqqcOdF73pCdTXw8eVKcBiTVeqMGthgJhHsLWfnkau-pQebKJqLwOOdQbe2PTLIPtmv3Ea9cMBsSqwuK6mD8bWns9D0FdwWWdm6TPIcsDeP1VBeiU_jHYf4xj_w7P11lGbxIYDWsZk2vZxw`

5. Cliquez "Save"

### Option B: Via Supabase CLI

```bash
# Se connecter à Supabase
npx supabase login

# Lier le projet
npx supabase link --project-ref gpcedzaflhiucwyjgdai

# Ajouter le secret
npx supabase secrets set DROPBOX_ACCESS_TOKEN="sl.u.AGLw2kS-YzFQhUsnJux-K7vK0yMMjKFq65QD-_5lMgTM4pJTnKlVJEYLwdExDG-n9VBLO_lkWIGTaYX4UbkqjOVCU4HJyLhXCioYmhCKUsqN0M3-urFjLTD5SHMBKtjHt4loKrFYTnlIDnHvaTPYpujtMN93ZCAJ3KiKniKY8QA5XKnlTQWMWhLltZSrky3zGiLkh8IAIcx_vqj5SypecoEpYl_a-2J7T_npJY55dMeOOZ7JXV8PASOIg7praNgdg7vJSG2xoHmIJPUNQzsQnijKMQJYiW2-zZ17BD5339B8dEaNpTcEDIYBWu80M9brVX5BfzWrPBwM0qRsPqw1Y82cXBD1jT-95CxAPbCR-FHX7xc8tRqHKSc6f5E7DIJZ3Or4MXIMG-9ryD7p54_EZFX6HO_zGm0QZoheRwIlqLPxkFhFrKr8B-OMxM76bLr4MjDVoZozHqYPooyZoNga__Eyay04B4h5K67WSVVZdPSvS6ncv-RiQYmZPqEVk5YZPfoED5R5a1cXYpblRkIgXXxg3vyIqXjU7R7RQLZlqBNwGECLDL2Wyt0eJDool1L5Z6rK-Jmr58t5WS2Px2xpDDIzgUrogoXaKpfcJtkMwr7RkhNABjmm2Hd5ybE8mTQzsL41lylNzocdB8QcXDAy0uexAJ7ULpt66_Q9pCvkhww40fs5-eUyRblQGC9Ce_aFNmI5RKf5eItNN3irWwQE3S2ExDilULagYFgJQY5o4Ft84yzVBHgz85Bxq1ngBeiq853JMIX-CtSW0YYv9rQSi_Vru7EiRGw9jhjUcMkTdlM_OS3aLkYNKyrLY3pf-SAwpKEFK8q-_gr4uqMvmtTSnZOfu7Qnf4jiW5IU4xUmLkT2y_XnUDuYgxcYgXwCQYoZ4LRey2NFN1od6Lced6IMmTbdTRNSU4FgUvC5t2KFbd4KvjWmCH7Zv2iCYa4H7i63vNqVjhGq1fidCTO2H00bJLmTFZVMP06Vkt7fvzivIRKHZe7WOXJ-Zzfv_YbPAobaMzRv1pwZyvNuabX2ThNVkl0JJ-WJxkoC2WZUhIHKFIUbwRM0xY0jQnJDBQzqkUx2cx8QTKfFTqqdMLJHqr_LptFDn15JmV2rD-OBTObh6sXEO9dxMfVNOXnxBDL7Ebh3m8kKyYzGqje1lGlgMiefU1oJkqkpc4uvSeisHJQfM3M47LbAUNbKyDqRxRY6aXII34wyhAcdHpImQjPiZt7qvDikhgWCtS0CpwXTJkPl6nKycwxJ0sN3r00-XU08gQ6T8Ko9wwRQj_mP2eyqTjqnrhQVuMh0kbzvqqcOdF73pCdTXw8eVKcBiTVeqMGthgJhHsLWfnkau-pQebKJqLwOOdQbe2PTLIPtmv3Ea9cMBsSqwuK6mD8bWns9D0FdwWWdm6TPIcsDeP1VBeiU_jHYf4xj_w7P11lGbxIYDWsZk2vZxw"
```

## Étape 2: Déployer la fonction

### Via Supabase Dashboard (Plus simple)

1. Allez sur: https://supabase.com/dashboard/project/gpcedzaflhiucwyjgdai/functions

2. Cliquez sur "Deploy a new function"

3. Sélectionnez:
   - **Function name**: `submit-music`
   - **Upload method**: "Upload code"

4. Compressez le dossier de la fonction:
   ```bash
   cd supabase/functions/submit-music
   zip -r submit-music.zip index.ts
   ```

5. Uploadez `submit-music.zip`

6. Cliquez "Deploy"

### Via Supabase CLI

```bash
# Se connecter d'abord
npx supabase login

# Lier le projet
npx supabase link --project-ref gpcedzaflhiucwyjgdai

# Déployer la fonction
npx supabase functions deploy submit-music --no-verify-jwt
```

## Étape 3: Créer le dossier dans Dropbox

1. Allez dans votre Dropbox
2. Créez un dossier nommé: **`reception`**
3. Ce dossier recevra tous les uploads organisés par artiste/genre

## Étape 4: Tester

1. Allez sur: https://kracradio.com/submit-music
2. Connectez-vous avec votre compte
3. Remplissez:
   - Nom d'artiste: `Test Artist`
   - Genre: `Rock`
   - Uploadez 1-2 fichiers MP3
4. Cliquez "Soumettre la musique"
5. Vérifiez dans Dropbox → `reception/Test Artist - Rock/`

## Troubleshooting

### La fonction ne se déploie pas
- Vérifiez que vous êtes connecté: `npx supabase login`
- Vérifiez le projet lié: `npx supabase projects list`

### Erreur "Dropbox not configured"
- Assurez-vous que `DROPBOX_ACCESS_TOKEN` est bien ajouté dans les secrets
- Redéployez la fonction après avoir ajouté le secret

### Erreur 401 Dropbox
- Le token a peut-être expiré
- Regénérez un nouveau token dans votre app Dropbox

### Upload échoue silencieusement
- Vérifiez les logs: https://supabase.com/dashboard/project/gpcedzaflhiucwyjgdai/logs/edge-functions
- Créez manuellement le dossier `reception` dans Dropbox

## Structure finale dans Dropbox

```
Dropbox/
└── reception/
    ├── Artist Name - Rock/
    │   ├── song1.mp3
    │   └── song2.mp3
    ├── Another Artist - Jazz/
    │   └── track.mp3
    └── ... (autres artistes)
```

## Sécurité

⚠️ **Important**: Ne commitez JAMAIS le token Dropbox dans Git!
- Le token est stocké uniquement dans Supabase Secrets
- Le fichier `.env` ne doit jamais contenir le token
- Le token est accessible uniquement par la Edge Function
