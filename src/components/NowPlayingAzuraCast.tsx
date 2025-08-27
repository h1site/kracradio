"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Heart } from 'lucide-react';
import ShareButton from './ShareButton';

// Types basés sur la réponse AzuraCast réelle
interface AzuraCastResponse {
  station: {
    id: number;
    name: string;
    shortcode: string;
    description: string;
    frontend: string;
    backend: string;
    listen_url: string;
    url: string;
    public_player_url: string;
    playlist_pls_url: string;
    playlist_m3u_url: string;
    is_public: boolean;
    mounts: Array<{
      path: string;
      is_default: boolean;
      id: number;
      name: string;
      url: string;
      bitrate: number;
      format: string;
    }>;
    remotes: any[];
  };
  listeners: {
    total: number;
    unique: number;
    current: number;
  };
  live: {
    is_live: boolean;
    streamer_name: string;
    broadcast_start: number | null;
    art?: string;
  };
  now_playing: {
    sh_id: number;
    played_at: number;
    duration: number;
    playlist: string;
    streamer: string;
    is_request: boolean;
    song: {
      id: string;
      text: string;
      artist: string;
      title: string;
      album: string;
      genre: string;
      lyrics: string;
      art?: string;
    };
    elapsed: number;
    remaining: number;
  };
  playing_next: {
    sh_id: number;
    played_at: number;
    duration: number;
    playlist: string;
    is_request: boolean;
    song: {
      id: string;
      text: string;
      artist: string;
      title: string;
      album: string;
      genre: string;
      art?: string;
    };
  };
  song_history: Array<{
    sh_id: number;
    played_at: number;
    duration: number;
    playlist: string;
    streamer: string;
    is_request: boolean;
    song: {
      id: string;
      text: string;
      artist: string;
      title: string;
      album: string;
      genre: string;
      art?: string;
    };
  }>;
  cache: string;
}

// Types simplifiés pour notre UI
interface NowPlayingTrack {
  artist: string;
  title: string;
  album: string;
  artwork: string;
  isLive: boolean;
  streamerName: string;
  listeners: number;
  elapsed?: number;
  duration?: number;
  playedAt?: number;
  genre?: string;
}

interface NowPlayingAzuraCastProps {
  apiUrl: string; // URL complète de l'API AzuraCast
  stationShortcode?: string; // Shortcode de la station (optionnel si dans l'URL)
  className?: string;
  showActions?: boolean;
  showListeners?: boolean;
  showProgress?: boolean;
  variant?: 'header' | 'sidebar' | 'mini' | 'full';
  onFavorite?: (track: NowPlayingTrack) => void;
  onShare?: (shareData: any) => void;
  onTrackChange?: (track: NowPlayingTrack) => void; // Callback quand le titre change
}

const NowPlayingAzuraCast: React.FC<NowPlayingAzuraCastProps> = ({
  apiUrl,
  stationShortcode = '',
  className = "",
  showActions = true,
  showListeners = true,
  showProgress = false,
  variant = 'header',
  onFavorite,
  onShare,
  onTrackChange
}) => {
  const [track, setTrack] = useState<NowPlayingTrack>({
    artist: "Chargement...",
    title: "",
    album: "",
    artwork: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop",
    isLive: false,
    streamerName: "",
    listeners: 0
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 5;

  // Fonction de chargement avec gestion CORS améliorée
  const loadNowPlaying = async () => {
    try {
      // Tentative avec mode CORS explicite
      const response = await fetch(apiUrl, {
        method: 'GET',
        mode: 'cors', // Mode CORS explicite
        credentials: 'omit', // Pas de credentials pour éviter les problèmes CORS
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
          'Origin': window.location.origin // Origin explicite
        },
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const np: AzuraCastResponse = await response.json();
      
      // Conversion des données AzuraCast vers notre format
      const newTrack: NowPlayingTrack = {
        artist: np.now_playing?.song?.artist || np.station.name || "Radio",
        title: np.now_playing?.song?.title || "En direct",
        album: np.now_playing?.song?.album || "",
        artwork: np.now_playing?.song?.art || np.live?.art || "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop",
        isLive: np.live?.is_live || false,
        streamerName: np.live?.streamer_name || np.now_playing?.streamer || "",
        listeners: np.listeners?.total || np.listeners?.current || 0,
        elapsed: np.now_playing?.elapsed || 0,
        duration: np.now_playing?.duration || 0,
        playedAt: np.now_playing?.played_at || 0,
        genre: np.now_playing?.song?.genre || ""
      };

      // Vérifier si le titre a changé
      const hasChanged = track.title !== newTrack.title || track.artist !== newTrack.artist;

      setTrack(newTrack);
      setError(null);
      setIsLoading(false);
      setLastUpdate(new Date());
      retryCountRef.current = 0;

      // Callback si le titre a changé
      if (hasChanged && onTrackChange) {
        onTrackChange(newTrack);
      }

      console.log(`✅ Now Playing mis à jour:`, newTrack.artist, '-', newTrack.title);

      // Programmer le prochain refresh (15 secondes comme dans votre exemple)
      timeoutRef.current = setTimeout(() => {
        loadNowPlaying();
      }, 15000);

    } catch (err) {
      // Diagnostics détaillés pour débugger
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        const corsError = `❌ Erreur CORS: Le serveur ${new URL(apiUrl).hostname} ne permet pas les requêtes depuis ${window.location.hostname}`;
        console.error(corsError);
        console.log(`🔧 Solutions possibles:
        1. Configurer CORS sur AzuraCast
        2. Utiliser un proxy Next.js (/api/nowplaying)  
        3. Vérifier que l'URL est correcte: ${apiUrl}`);
        setError(`CORS: ${new URL(apiUrl).hostname} bloque les requêtes`);
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Erreur réseau';
        setError(errorMessage);
        console.error(`❌ Erreur Now Playing:`, errorMessage);
      }
      
      setIsLoading(false);
      retryCountRef.current++;

      console.error(`❌ Erreur Now Playing (tentative ${retryCountRef.current}):`, err);

      // Retry avec délai progressif (comme dans votre exemple jQuery fail)
      const retryDelay = retryCountRef.current >= maxRetries ? 60000 : 30000; // 30s puis 60s
      
      timeoutRef.current = setTimeout(() => {
        if (retryCountRef.current < maxRetries) {
          loadNowPlaying();
        } else {
          console.log(`🛑 Abandon après ${maxRetries} tentatives`);
        }
      }, retryDelay);
    }
  };

  // Démarrage automatique (équivalent de $(function() { loadNowPlaying(); }))
  useEffect(() => {
    loadNowPlaying();

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [apiUrl]); // Relancer si l'URL change

  // Fonction manuelle de refresh
  const forceRefresh = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    retryCountRef.current = 0;
    setIsLoading(true);
    loadNowPlaying();
  };

  const handleFavoriteClick = () => {
    onFavorite?.(track);
    console.log('Ajouté aux favoris:', track);
  };

  // Calculer le pourcentage de progression
  const progressPercentage = (track.duration && track.duration > 0 && track.elapsed)
    ? Math.min((track.elapsed / track.duration) * 100, 100)
    : 0;

  // Variantes de mise en page (comme dans le composant précédent)
  const variants = {
    header: {
      container: "flex items-center justify-between",
      trackInfo: "flex items-center space-x-4 flex-1 min-w-0",
      artwork: "w-12 h-12",
      actions: "hidden sm:flex items-center space-x-3"
    },
    sidebar: {
      container: "space-y-4",
      trackInfo: "space-y-3",
      artwork: "w-20 h-20 mx-auto",
      actions: "flex items-center justify-center space-x-3"
    },
    mini: {
      container: "flex items-center space-x-2",
      trackInfo: "flex items-center space-x-2 flex-1 min-w-0",
      artwork: "w-8 h-8",
      actions: "flex items-center space-x-1"
    },
    full: {
      container: "text-center space-y-6",
      trackInfo: "space-y-4",
      artwork: "w-32 h-32 mx-auto",
      actions: "flex items-center justify-center space-x-4"
    }
  };

  const currentVariant = variants[variant];

  return (
    <div className={`bg-gray-50 border-b border-gray-200 ${className}`}>
      <div className="container mx-auto px-4 py-2">
        {/* Indicateur d'erreur compact */}
        {error && (
          <div className="mb-1 p-1 bg-red-100 border border-red-300 rounded text-red-700 text-xs">
            ⚠️ {error} 
            <button 
              onClick={forceRefresh}
              className="ml-2 underline hover:no-underline"
            >
              Réessayer
            </button>
          </div>
        )}

        <div className="flex items-center justify-between">
          
          {/* Infos du titre en cours - VERSION COMPACTE POUR BARRE FIXE */}
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="relative">
              <img
                src={track.artwork}
                alt={`Pochette de ${track.title}`}
                className="w-8 h-8 rounded object-cover shadow-sm"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 
                    "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop";
                }}
              />
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              {/* Statut en direct - VERSION COMPACTE */}
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-red-400 uppercase tracking-wide">
                  {track.isLive ? `Live: ${track.streamerName}` : 'En Direct'}
                </span>
                {showListeners && track.listeners > 0 && (
                  <span className="text-xs text-gray-500">
                    • {track.listeners} auditeurs
                  </span>
                )}
              </div>
              
              {/* Titre et artiste - VERSION COMPACTE */}
              <div className="flex items-center space-x-2 text-sm">
                <h3 className="font-semibold text-black truncate max-w-[200px]">
                  {track.title || 'Titre inconnu'}
                </h3>
                <span className="text-gray-400">•</span>
                <p className="text-gray-600 truncate max-w-[150px]">
                  {track.artist || 'Artiste inconnu'}
                </p>
              </div>
            </div>
          </div>

          {/* Actions - VERSION COMPACTE */}
          {showActions && (
            <div className="hidden sm:flex items-center space-x-2">
              <button 
                onClick={handleFavoriteClick}
                className="p-1.5 hover:bg-gray-200 rounded-full transition-colors group"
                title="Ajouter aux favoris"
                aria-label="Ajouter aux favoris"
              >
                <Heart className="w-4 h-4 group-hover:text-red-500" />
              </button>
              
              <ShareButton 
                shareData={{
                  title: track.title,
                  artist: track.artist,
                  url: 'https://radiomontreal.com'
                }}
                size="sm"
                onShare={onShare}
              />
            </div>
          )}
        </div>
        
        {/* Barre de progression - VERSION COMPACTE (si activée) */}
        {showProgress && track.duration && track.duration > 0 && (
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-0.5">
              <div 
                className="bg-red-500 h-0.5 rounded-full transition-all duration-1000"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NowPlayingAzuraCast;