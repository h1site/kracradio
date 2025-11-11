#!/bin/bash

# Script de vérification - Artist Slug Feature
# Usage: bash verify_artist_slug.sh

echo "🔍 Vérification du Artist Slug Feature..."
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Compteur
OK=0
FAIL=0

# Fonction de vérification
check_file() {
  if [ -f "$1" ]; then
    echo -e "${GREEN}✓${NC} $1"
    ((OK++))
  else
    echo -e "${RED}✗${NC} $1 (MANQUANT)"
    ((FAIL++))
  fi
}

check_grep() {
  if grep -q "$2" "$1" 2>/dev/null; then
    echo -e "${GREEN}✓${NC} $1 contient: $2"
    ((OK++))
  else
    echo -e "${RED}✗${NC} $1 ne contient pas: $2"
    ((FAIL++))
  fi
}

# 1. Fichiers de base
echo "📁 Fichiers de base:"
check_file "supabase/add_artist_slug.sql"
check_file "ARTIST_SLUG_SETUP.md"
check_file "TEST_ARTIST_SLUG.md"
check_file "CHANGELOG_ARTIST_SLUG.md"
check_file "QUICK_START_SLUG.md"
echo ""

# 2. Fichiers React modifiés
echo "⚛️  Fichiers React:"
check_file "src/hooks/useCommunity.js"
check_file "src/components/community/CommunitySettings.jsx"
check_file "src/pages/PublicProfile.jsx"
check_file "src/pages/Profile.jsx"
echo ""

# 3. Contenu du hook
echo "🪝 Hook useCommunity.js:"
check_grep "src/hooks/useCommunity.js" "useResolveUsername"
check_grep "src/hooks/useCommunity.js" "get_user_id_from_slug"
echo ""

# 4. Contenu CommunitySettings
echo "⚙️  CommunitySettings.jsx:"
check_grep "src/components/community/CommunitySettings.jsx" "artist_slug"
check_grep "src/components/community/CommunitySettings.jsx" "generateSlug"
check_grep "src/components/community/CommunitySettings.jsx" "slugPreview"
echo ""

# 5. Contenu PublicProfile
echo "👤 PublicProfile.jsx:"
check_grep "src/pages/PublicProfile.jsx" "useResolveUsername"
check_grep "src/pages/PublicProfile.jsx" "resolvingUser"
echo ""

# 6. Contenu Profile
echo "📋 Profile.jsx:"
check_grep "src/pages/Profile.jsx" "Ma Communauté"
check_grep "src/pages/Profile.jsx" "/community"
echo ""

# 7. Migration SQL
echo "💾 Migration SQL (add_artist_slug.sql):"
check_grep "supabase/add_artist_slug.sql" "artist_slug"
check_grep "supabase/add_artist_slug.sql" "generate_artist_slug"
check_grep "supabase/add_artist_slug.sql" "is_slug_available"
check_grep "supabase/add_artist_slug.sql" "get_user_id_from_slug"
echo ""

# Résumé
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "Résumé: ${GREEN}${OK} OK${NC} | ${RED}${FAIL} FAIL${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $FAIL -eq 0 ]; then
  echo -e "${GREEN}🎉 Tout est en place!${NC}"
  echo ""
  echo "Next steps:"
  echo "1. Execute SQL migration in Supabase Dashboard"
  echo "2. Test in app: http://localhost:3000/community"
  echo "3. Share your profile: kracradio.com/profile/your_slug"
  echo ""
  echo "📖 Guides:"
  echo "   - Quick start: QUICK_START_SLUG.md"
  echo "   - Full setup: ARTIST_SLUG_SETUP.md"
  echo "   - Testing: TEST_ARTIST_SLUG.md"
else
  echo -e "${RED}⚠️  Certains fichiers sont manquants ou incomplets${NC}"
  echo "Vérifie les erreurs ci-dessus"
fi
