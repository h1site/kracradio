# Configuration du Cron pour Import de Podcasts

## Option 1: Utiliser Supabase Edge Functions avec pg_cron

### 1. Activer pg_cron dans Supabase

Dans le SQL Editor de Supabase Dashboard:

```sql
-- Activer l'extension pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Donner les permissions nécessaires
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;
```

### 2. Créer la fonction SQL qui appelle l'Edge Function

```sql
-- Créer une fonction qui appelle l'Edge Function
CREATE OR REPLACE FUNCTION trigger_podcast_import()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  service_role_key TEXT;
  function_url TEXT;
BEGIN
  -- Remplacer par votre SUPABASE_SERVICE_ROLE_KEY et l'URL de votre Edge Function
  service_role_key := 'votre-service-role-key';
  function_url := 'https://votre-projet.supabase.co/functions/v1/import-podcasts';

  PERFORM net.http_post(
    url := function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_role_key
    ),
    body := '{}'::jsonb
  );
END;
$$;
```

### 3. Programmer le cron (midi et minuit)

```sql
-- Cron à midi (12:00) tous les jours
SELECT cron.schedule(
  'import-podcasts-noon',
  '0 12 * * *',
  'SELECT trigger_podcast_import();'
);

-- Cron à minuit (00:00) tous les jours
SELECT cron.schedule(
  'import-podcasts-midnight',
  '0 0 * * *',
  'SELECT trigger_podcast_import();'
);
```

### 4. Vérifier les crons programmés

```sql
SELECT * FROM cron.job;
```

### 5. Supprimer un cron (si nécessaire)

```sql
SELECT cron.unschedule('import-podcasts-noon');
SELECT cron.unschedule('import-podcasts-midnight');
```

## Option 2: Utiliser un Service Externe (GitHub Actions)

Créer `.github/workflows/import-podcasts.yml`:

```yaml
name: Import Podcasts

on:
  schedule:
    # Midi (12:00 UTC) tous les jours
    - cron: '0 12 * * *'
    # Minuit (00:00 UTC) tous les jours
    - cron: '0 0 * * *'
  workflow_dispatch: # Permet de lancer manuellement

jobs:
  import:
    runs-on: ubuntu-latest
    steps:
      - name: Call Supabase Edge Function
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" \
            -H "Content-Type: application/json" \
            https://votre-projet.supabase.co/functions/v1/import-podcasts
```

## Option 3: Utiliser un Service de Cron Externe

### Cron-job.org

1. Créer un compte sur https://cron-job.org
2. Créer un nouveau cronjob:
   - URL: `https://votre-projet.supabase.co/functions/v1/import-podcasts`
   - Schedule: `0 0,12 * * *` (minuit et midi)
   - HTTP Method: POST
   - HTTP Headers:
     - `Authorization: Bearer YOUR_SERVICE_ROLE_KEY`
     - `Content-Type: application/json`

### EasyCron

1. Créer un compte sur https://www.easycron.com
2. Créer deux crons:
   - URL: `https://votre-projet.supabase.co/functions/v1/import-podcasts`
   - Cron Expression 1: `0 0 * * *` (minuit)
   - Cron Expression 2: `0 12 * * *` (midi)

## Déploiement de l'Edge Function

```bash
# Installer Supabase CLI
npm install -g supabase

# Se connecter à Supabase
supabase login

# Lier le projet
supabase link --project-ref votre-projet-ref

# Déployer la fonction
supabase functions deploy import-podcasts

# Définir les secrets (si nécessaire)
supabase secrets set SUPABASE_URL=https://votre-projet.supabase.co
supabase secrets set SUPABASE_ANON_KEY=votre-anon-key
```

## Test Manuel

```bash
# Tester localement
supabase functions serve import-podcasts

# Tester en production
curl -X POST \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  https://votre-projet.supabase.co/functions/v1/import-podcasts
```

## Monitoring

Créer une table pour suivre les imports:

```sql
CREATE TABLE podcast_import_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  total_podcasts INTEGER,
  total_episodes_imported INTEGER,
  errors JSONB,
  status VARCHAR(50) -- 'running', 'completed', 'failed'
);
```

## Notes Importantes

- **Timezone**: Les crons utilisent généralement UTC. Ajustez selon votre fuseau horaire.
- **Service Role Key**: Ne jamais exposer la clé service role dans le code frontend.
- **Rate Limiting**: Ajouter des délais entre les requêtes RSS pour éviter d'être bloqué.
- **Error Handling**: Logger les erreurs pour débogage.
