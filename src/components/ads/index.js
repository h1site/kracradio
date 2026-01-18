// src/components/ads/index.js
// Composants publicitaires AdSense pour KracRadio
// Client ID: ca-pub-8781698761921917

import GoogleAd from './GoogleAd';

// Slots AdSense - Créer ces ad units dans AdSense dashboard et remplacer par les vrais IDs
const SLOTS = {
  LEADERBOARD: '3411355648',      // 728x90 - Header, sous navigation
  RECTANGLE: '5041624401',         // 300x250 - Sidebar, in-content
  IN_ARTICLE: '3411355648',        // In-article fluid - Dans les articles
  IN_FEED: '5041624401',           // In-feed native - Entre les éléments de liste
  SKYSCRAPER: '5041624401',        // 300x600 - Sidebar sticky
  LARGE_RECTANGLE: '5041624401',   // 336x280 - Fin d'article
};

// ============================================
// Display Ad - Responsive (format auto)
// Usage: Partout où une pub responsive est nécessaire
// ============================================
export function ResponsiveAd({ className = '' }) {
  return (
    <div className={`ad-container ${className}`}>
      <GoogleAd
        slot={SLOTS.LEADERBOARD}
        format="auto"
        responsive={true}
        style={{ minHeight: '90px' }}
      />
    </div>
  );
}

// ============================================
// Leaderboard - 728x90
// Usage: Header, sous navigation, entre sections
// ============================================
export function LeaderboardAd({ className = '' }) {
  return (
    <div className={`ad-container ad-leaderboard ${className}`}>
      <GoogleAd
        slot={SLOTS.LEADERBOARD}
        format="auto"
        responsive={true}
        style={{ minHeight: '90px' }}
      />
    </div>
  );
}

// ============================================
// Rectangle Sidebar - 300x250
// Usage: Sidebar, in-content
// ============================================
export function SidebarAd({ className = '' }) {
  return (
    <div className={`ad-container ad-sidebar ${className}`}>
      <GoogleAd
        slot={SLOTS.RECTANGLE}
        format="rectangle"
        style={{ width: '300px', height: '250px' }}
        responsive={false}
      />
    </div>
  );
}

// ============================================
// Skyscraper - 300x600
// Usage: Sidebar sticky (desktop)
// ============================================
export function SkyscraperAd({ className = '' }) {
  return (
    <div className={`ad-container ad-skyscraper ${className}`}>
      <GoogleAd
        slot={SLOTS.SKYSCRAPER}
        format="vertical"
        style={{ width: '300px', height: '600px' }}
        responsive={false}
      />
    </div>
  );
}

// ============================================
// In-Article Ad - Fluid
// Usage: Dans le contenu des articles (après intro, milieu)
// Format: fluid avec layout="in-article"
// ============================================
export function InArticleAd({ className = '' }) {
  return (
    <div className={`ad-container ad-in-article ${className}`} style={{ textAlign: 'center' }}>
      <GoogleAd
        slot={SLOTS.IN_ARTICLE}
        format="fluid"
        layout="in-article"
        style={{ minHeight: '250px' }}
      />
    </div>
  );
}

// ============================================
// In-Feed Ad - Native
// Usage: Entre les éléments de liste (articles, podcasts, vidéos)
// Format: fluid avec layout="in-feed" et layoutKey
// ============================================
export function InFeedAd({ className = '' }) {
  return (
    <div className={`ad-container ad-in-feed ${className}`}>
      <GoogleAd
        slot={SLOTS.IN_FEED}
        format="fluid"
        layout="in-feed"
        layoutKey="-fb+5w+4e-db+86"
        style={{ minHeight: '120px' }}
      />
    </div>
  );
}

// ============================================
// Grand Rectangle - 336x280
// Usage: Fin d'article
// ============================================
export function LargeRectangleAd({ className = '' }) {
  return (
    <div className={`ad-container ad-large-rectangle ${className}`}>
      <GoogleAd
        slot={SLOTS.LARGE_RECTANGLE}
        format="rectangle"
        style={{ width: '336px', height: '280px' }}
        responsive={false}
      />
    </div>
  );
}

// Export par défaut du composant de base
export { default as GoogleAd } from './GoogleAd';
