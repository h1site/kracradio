#!/bin/bash
# Script pour exécuter la migration complète

echo "🚀 Exécution de la migration Kracradio Community..."
echo ""

# Vérifie que DATABASE_URL est défini
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Erreur: DATABASE_URL n'est pas défini"
    echo ""
    echo "Pour obtenir ton DATABASE_URL:"
    echo "1. Va sur Supabase Dashboard > Settings > Database"
    echo "2. Copie 'Connection string' (URI format)"
    echo "3. Export: export DATABASE_URL='postgres://...'"
    echo ""
    exit 1
fi

echo "📊 Exécution de COMPLETE_MIGRATION.sql..."
psql "$DATABASE_URL" -f supabase/COMPLETE_MIGRATION.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration réussie!"
    echo ""
    echo "📋 Vérifie dans Supabase Dashboard > Database > Tables"
    echo ""
else
    echo ""
    echo "❌ Erreur lors de la migration"
    exit 1
fi
