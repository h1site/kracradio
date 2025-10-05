#!/bin/bash

# Script pour appliquer les migrations communautaires à Supabase
# Usage: ./scripts/apply-migrations.sh

set -e

echo "🚀 Application des migrations communautaires Kracradio..."
echo ""

# Vérifier que supabase CLI est installé
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI n'est pas installé."
    echo "Installation: npm install -g supabase"
    exit 1
fi

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo "❌ Erreur: ce script doit être exécuté depuis la racine du projet"
    exit 1
fi

# Créer le dossier migrations s'il n'existe pas
mkdir -p supabase/migrations

echo "📋 Migrations à appliquer:"
echo "  1. 001_community_profiles.sql - Profils, music links, follows"
echo "  2. 002_posts_and_feed.sql - Posts, réactions, commentaires"
echo "  3. 003_notifications_moderation.sql - Notifications, blocage, reports"
echo ""

read -p "Voulez-vous continuer? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Annulé"
    exit 1
fi

echo ""
echo "🔗 Connexion à Supabase..."

# Option 1: Appliquer via psql directement
if [ -n "$DATABASE_URL" ]; then
    echo "📊 Application via DATABASE_URL..."

    for file in supabase/migrations/*.sql; do
        if [ -f "$file" ]; then
            echo "  ▶ $(basename $file)..."
            psql "$DATABASE_URL" -f "$file"
        fi
    done

# Option 2: Via Supabase CLI
else
    echo "📊 Application via Supabase CLI..."
    echo "⚠️  Assurez-vous d'être connecté avec: supabase link --project-ref XXX"
    echo ""

    for file in supabase/migrations/*.sql; do
        if [ -f "$file" ]; then
            echo "  ▶ $(basename $file)..."
            supabase db push --db-url "$SUPABASE_DB_URL" < "$file"
        fi
    done
fi

echo ""
echo "✅ Migrations appliquées avec succès!"
echo ""
echo "📝 Prochaines étapes:"
echo "  1. Vérifier les tables dans le dashboard Supabase"
echo "  2. Tester les RLS policies"
echo "  3. Créer des données de test"
echo ""
echo "💡 Pour créer des données de test:"
echo "   npm run seed:community"
echo ""
