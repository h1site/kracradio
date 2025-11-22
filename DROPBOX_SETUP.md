# Configuration Dropbox pour Submit Music

## 1. Créer une App Dropbox

1. Allez sur https://www.dropbox.com/developers/apps
2. Cliquez sur "Create app"
3. Choisissez:
   - **Scoped access**
   - **Full Dropbox** (accès à tout le Dropbox)
   - Nom de l'app: `KracRadio Music Submissions`
4. Cliquez "Create app"

## 2. Configurer les Permissions

Dans l'onglet "Permissions", activez:
- ✅ `files.metadata.write`
- ✅ `files.metadata.read`
- ✅ `files.content.write`
- ✅ `files.content.read`

Cliquez "Submit" pour sauvegarder.

## 3. Générer un Access Token

1. Dans l'onglet "Settings"
2. Scrollez jusqu'à "Generated access token"
3. Cliquez "Generate" pour créer un token
4. **COPIEZ LE TOKEN** (vous ne pourrez plus le voir après)

## 4. Ajouter le Token à Supabase

1. Allez dans votre projet Supabase: https://supabase.com/dashboard/project/gpcedzaflhiucwyjgdai/settings/functions
2. Cliquez sur "Edge Functions" dans la barre latérale
3. Cliquez sur "Function Secrets"
4. Ajoutez un nouveau secret:
   - **Name**: `DROPBOX_ACCESS_TOKEN`
   - **Value**: [Collez votre token Dropbox]
5. Cliquez "Save"

## 5. Déployer la fonction Edge

```bash
# Depuis le terminal
npx supabase functions deploy submit-music
```

## 6. Structure Dropbox

Les fichiers seront organisés comme suit:

```
Dropbox/
└── reception/
    ├── ArtistName1 - Rock/
    │   ├── song1.mp3
    │   ├── song2.mp3
    │   └── song3.mp3
    ├── ArtistName2 - Jazz/
    │   ├── track1.mp3
    │   └── track2.mp3
    └── ArtistName3 - Metal/
        └── demo.mp3
```

## 7. Table de suivi (Optionnel)

Pour suivre les soumissions dans Supabase, créez cette table:

```sql
CREATE TABLE music_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  artist_name TEXT NOT NULL,
  genre TEXT NOT NULL,
  files JSONB NOT NULL,
  dropbox_folder TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT
);

-- Index pour recherche rapide
CREATE INDEX idx_music_submissions_user_id ON music_submissions(user_id);
CREATE INDEX idx_music_submissions_status ON music_submissions(status);
CREATE INDEX idx_music_submissions_submitted_at ON music_submissions(submitted_at DESC);

-- RLS
ALTER TABLE music_submissions ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir leurs propres soumissions
CREATE POLICY "Users can view their own submissions"
ON music_submissions FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Les admins peuvent tout voir
CREATE POLICY "Admins can view all submissions"
ON music_submissions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
```

## 8. Test

1. Allez sur https://kracradio.com/submit-music
2. Connectez-vous
3. Remplissez le formulaire:
   - Nom d'artiste: Test Artist
   - Genre: Rock
   - Uploadez 1-2 fichiers MP3
4. Cliquez "Soumettre"
5. Vérifiez dans votre Dropbox → dossier `reception/Test Artist - Rock/`

## Troubleshooting

### Erreur "Dropbox not configured"
- Vérifiez que `DROPBOX_ACCESS_TOKEN` est bien configuré dans Supabase Edge Functions

### Erreur 401 Unauthorized
- Le token Dropbox a expiré ou est invalide
- Régénérez un nouveau token dans la console Dropbox

### Erreur de permission
- Vérifiez que les permissions `files.content.write` sont activées dans l'app Dropbox

### Upload échoue
- Vérifiez que le dossier `reception` existe dans votre Dropbox (créez-le manuellement si besoin)
- Vérifiez les logs de la fonction: `npx supabase functions logs submit-music`
