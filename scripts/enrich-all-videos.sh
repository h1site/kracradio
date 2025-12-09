#!/bin/bash
# Script pour enrichir toutes les vidéos par lots de 100
# Usage: ./scripts/enrich-all-videos.sh

export SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdwY2VkemFmbGhpdWN3eWpnZGFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNzgzMzAsImV4cCI6MjA3NDc1NDMzMH0.sMkG7VMYRFWF1dKY_XPyQ-6iAJ1BYHKcye1R-CNO3ho"

TOTAL_VIDEOS=1139
BATCH_SIZE=100
OFFSET=0

echo "🎬 Enrichissement de toutes les vidéos ($TOTAL_VIDEOS)"
echo "   Taille des lots: $BATCH_SIZE"
echo ""

while [ $OFFSET -lt $TOTAL_VIDEOS ]; do
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📦 Lot $(($OFFSET / $BATCH_SIZE + 1)) - Offset: $OFFSET"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    node scripts/enrich-videos.mjs --limit=$BATCH_SIZE --offset=$OFFSET

    OFFSET=$(($OFFSET + $BATCH_SIZE))

    if [ $OFFSET -lt $TOTAL_VIDEOS ]; then
        echo ""
        echo "⏳ Pause de 5 secondes avant le prochain lot..."
        sleep 5
    fi
done

echo ""
echo "🎉 Terminé! Toutes les vidéos ont été traitées."
