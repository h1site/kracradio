#!/bin/bash

# Script de déploiement de la fonction submit-music
# Usage: ./deploy-submit-music.sh

echo "🚀 Déploiement de la fonction submit-music..."

# Vérifier si Supabase CLI est installé
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI n'est pas installé"
    echo "Installation: npm install -g supabase"
    exit 1
fi

# Login (si nécessaire)
echo "📝 Connexion à Supabase..."
npx supabase login

# Lier le projet
echo "🔗 Liaison au projet..."
npx supabase link --project-ref gpcedzaflhiucwyjgdai

# Ajouter le secret Dropbox
echo "🔐 Configuration du secret Dropbox..."
read -p "Voulez-vous ajouter/mettre à jour le token Dropbox? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Entrez le token Dropbox:"
    read -s DROPBOX_TOKEN
    npx supabase secrets set DROPBOX_ACCESS_TOKEN="$DROPBOX_TOKEN"
fi

# Déployer la fonction
echo "📦 Déploiement de la fonction..."
npx supabase functions deploy submit-music --no-verify-jwt

echo "✅ Déploiement terminé!"
echo "🌐 URL de la fonction: https://gpcedzaflhiucwyjgdai.supabase.co/functions/v1/submit-music"
