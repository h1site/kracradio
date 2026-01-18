'use client';
// src/pages/Videos.jsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useI18n } from '../i18n';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import Seo from '../seo/Seo';
import { breadcrumbSchema } from '../seo/schemas';
import { InFeedAd } from '../components/ads';
import {
  getApprovedVideos,
  getVideoLikeCount
} from '../lib/supabase';

const STRINGS = {
  fr: {
    metaTitle: 'Vidéos — KracRadio',
    metaDesc: 'Découvrez les clips musicaux et vidéos des artistes KracRadio',
    heroBadge: 'Vidéos',
    heroTitle: 'Vidéos',
    heroSubtitle: 'Les clips musicaux de notre communauté',
    noVideos: 'Aucune vidéo pour le moment',
    noResults: 'Aucun résultat pour',
    loading: 'Chargement...',
    likes: 'likes',
    comments: 'commentaires',
    addComment: 'Ajouter un commentaire...',
    send: 'Envoyer',
    loginToComment: 'Connectez-vous pour commenter',
    delete: 'Supprimer',
    by: 'par',
    submittedBy: 'Soumis par',
    loadMore: 'Charger plus',
    searchPlaceholder: 'Rechercher une vidéo...',
    clearSearch: 'Effacer',
  },
  en: {
    metaTitle: 'Videos — KracRadio',
    metaDesc: 'Discover music videos from KracRadio artists',
    heroBadge: 'Videos',
    heroTitle: 'Videos',
    heroSubtitle: 'Music videos from our community',
    noVideos: 'No videos yet',
    noResults: 'No results for',
    loading: 'Loading...',
    likes: 'likes',
    comments: 'comments',
    addComment: 'Add a comment...',
    send: 'Send',
    loginToComment: 'Login to comment',
    delete: 'Delete',
    by: 'by',
    submittedBy: 'Submitted by',
    loadMore: 'Load more',
    searchPlaceholder: 'Search videos...',
    clearSearch: 'Clear',
  },
  es: {
    metaTitle: 'Videos — KracRadio',
    metaDesc: 'Descubre los videos musicales de los artistas de KracRadio',
    heroBadge: 'Videos',
    heroTitle: 'Videos',
    heroSubtitle: 'Videos musicales de nuestra comunidad',
    noVideos: 'No hay videos todavía',
    noResults: 'Sin resultados para',
    loading: 'Cargando...',
    likes: 'me gusta',
    comments: 'comentarios',
    addComment: 'Añadir un comentario...',
    send: 'Enviar',
    loginToComment: 'Inicia sesión para comentar',
    delete: 'Eliminar',
    by: 'por',
    submittedBy: 'Enviado por',
    loadMore: 'Cargar más',
    searchPlaceholder: 'Buscar videos...',
    clearSearch: 'Borrar',
  },
};

// Video Card Component - sans animations framer-motion
function VideoCard({ video, L }) {
  const [likeCount, setLikeCount] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [player, setPlayer] = useState(null);
  const hoverTimeoutRef = useRef(null);

  useEffect(() => {
    const loadData = async () => {
      const count = await getVideoLikeCount(video.id);
      setLikeCount(count);
    };
    loadData();
  }, [video.id]);

  // Initialize YouTube player on hover
  useEffect(() => {
    if (isHovering && !player && window.YT && window.YT.Player) {
      const newPlayer = new window.YT.Player(`player-${video.id}`, {
        videoId: video.youtube_id,
        playerVars: {
          autoplay: 1,
          controls: 0,
          mute: 1,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          fs: 0,
          playsinline: 1,
        },
        events: {
          onReady: (event) => {
            setPlayer(event.target);
            event.target.playVideo();
          }
        }
      });
    }
  }, [isHovering, player, video.id, video.youtube_id]);

  const handleMouseEnter = (e) => {
    e.preventDefault();
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovering(true);
    }, 500);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setIsHovering(false);
    if (player && typeof player.pauseVideo === 'function') {
      player.pauseVideo();
    }
  };

  const videoSlug = video.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return (
    <Link href={`/videos/${videoSlug}`} className="block group">
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-lg hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-200"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* YouTube Preview/Thumbnail */}
        <div className="relative aspect-video w-full bg-black overflow-hidden">
          <img
            src={video.thumbnail_url || `https://img.youtube.com/vi/${video.youtube_id}/hqdefault.jpg`}
            alt={video.title}
            loading="lazy"
            className={`w-full h-full object-cover transition-opacity duration-200 ${isHovering ? 'opacity-0' : 'opacity-100'}`}
            onError={(e) => {
              if (!e.target.src.includes('video-thumbnail-default')) {
                e.target.src = '/images/video-thumbnail-default.svg';
              }
            }}
          />

          {/* YouTube Player - shown when hovering */}
          <div className={`absolute inset-0 ${isHovering ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div id={`player-${video.id}`} className="w-full h-full"></div>
          </div>

          {/* Play button overlay */}
          <div className={`absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-all ${isHovering ? 'opacity-0' : 'opacity-100'}`}>
            <div className="w-20 h-20 flex items-center justify-center rounded-full bg-red-600 group-hover:bg-red-700 group-hover:scale-110 transition-all shadow-2xl">
              <svg className="w-8 h-8 ml-1 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
          </div>

          {/* KracRadio logo badge for admin-posted videos */}
          {video.submitter?.role === 'admin' && (
            <div className="absolute top-3 left-3 z-10">
              <img
                src="/images/logos/krac_short_white_white.png"
                alt="KracRadio"
                className="h-6 w-auto drop-shadow-lg"
              />
            </div>
          )}
        </div>

        {/* Video Info */}
        <div className="p-5">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 line-clamp-2">{video.title}</h3>
          {video.artist_name && (
            <p className="text-sm text-gray-600 dark:text-gray-400">{video.artist_name}</p>
          )}
          {video.description && (
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2 line-clamp-2">{video.description}</p>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mt-3">
            <div className="flex items-center gap-1">
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              <span>{likeCount}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// Nombre de vidéos à charger initialement et par batch
const INITIAL_LOAD = 6;
const LOAD_MORE = 6;

export default function Videos() {
  const { lang } = useI18n();
  const { user } = useAuth();
  const { isDesktop, sidebarOpen, sidebarWidth } = useUI();
  const L = useMemo(() => STRINGS[lang] || STRINGS.fr, [lang]);

  const [allVideos, setAllVideos] = useState([]);
  const [visibleCount, setVisibleCount] = useState(INITIAL_LOAD);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const loaderRef = useRef(null);
  const searchInputRef = useRef(null);

  const loadVideos = useCallback(async () => {
    try {
      console.log('[Videos] Loading approved videos...');
      const data = await getApprovedVideos();
      console.log('[Videos] Loaded videos:', data?.length || 0, 'videos');
      setAllVideos(data || []);
    } catch (err) {
      console.error('[Videos] Error loading videos:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  // Infinite scroll avec IntersectionObserver
  useEffect(() => {
    if (loading || visibleCount >= allVideos.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + LOAD_MORE, allVideos.length));
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [loading, visibleCount, allVideos.length]);

  // Filter videos based on search query
  const filteredVideos = useMemo(() => {
    if (!searchQuery.trim()) return allVideos;
    const query = searchQuery.toLowerCase().trim();
    return allVideos.filter(video =>
      video.title?.toLowerCase().includes(query) ||
      video.artist_name?.toLowerCase().includes(query) ||
      video.description?.toLowerCase().includes(query)
    );
  }, [allVideos, searchQuery]);

  const visibleVideos = filteredVideos.slice(0, visibleCount);
  const hasMore = visibleCount < filteredVideos.length;

  // Reset visible count when search changes
  useEffect(() => {
    setVisibleCount(INITIAL_LOAD);
  }, [searchQuery]);

  return (
    <>
      <Seo
        lang={lang}
        title={L.metaTitle}
        description={L.metaDesc}
        path="/videos"
        jsonLd={[
          breadcrumbSchema([
            { name: 'Accueil', url: '/' },
            { name: L.heroTitle }
          ])
        ]}
      />

      <div className="min-h-screen bg-white dark:bg-black">
        {/* Full-screen header */}
        <header
          className="relative w-full overflow-hidden"
          style={{
            marginLeft: isDesktop && sidebarOpen ? -sidebarWidth : 0,
            width: isDesktop && sidebarOpen ? `calc(100% + ${sidebarWidth}px)` : '100%',
            transition: 'margin-left 300ms ease, width 300ms ease'
          }}
        >
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1574267432644-f65b56c5e2ce?w=1200&h=400&fit=crop&auto=format&q=80"
              alt="Videos"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent"></div>
          </div>
          <div
            className="relative py-16 md:py-24"
            style={{
              marginLeft: isDesktop && sidebarOpen ? sidebarWidth : 0,
              transition: 'margin-left 300ms ease'
            }}
          >
            <div className="max-w-4xl pl-[60px] md:pl-[100px] pr-8">
              <span className="inline-flex items-center rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-red-300">
                {L.heroBadge}
              </span>
              <h1 className="mt-4 text-4xl md:text-6xl font-black uppercase text-white">
                {L.heroTitle}
              </h1>
              <p className="mt-4 max-w-3xl text-lg text-gray-200">
                {L.heroSubtitle}
              </p>

              {/* Search Bar */}
              <div className="mt-6 max-w-xl">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={L.searchPlaceholder}
                    className="w-full pl-12 pr-12 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        searchInputRef.current?.focus();
                      }}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-white transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
                {searchQuery && (
                  <p className="mt-2 text-sm text-gray-300">
                    {filteredVideos.length} {filteredVideos.length === 1 ? 'video' : 'videos'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="px-[5px] py-12">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : allVideos.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500 dark:text-gray-400">{L.noVideos}</p>
            </div>
          ) : filteredVideos.length === 0 ? (
            <div className="text-center py-20">
              <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="text-gray-500 dark:text-gray-400">{L.noResults} &quot;{searchQuery}&quot;</p>
              <button
                onClick={() => setSearchQuery('')}
                className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                {L.clearSearch}
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {visibleVideos.map((video, index) => (
                  <React.Fragment key={video.id}>
                    <VideoCard video={video} L={L} />
                    {/* Insert ad after every 6 videos */}
                    {(index + 1) % 6 === 0 && index < visibleVideos.length - 1 && (
                      <div className="col-span-1 md:col-span-2 xl:col-span-3">
                        <InFeedAd />
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* Loader pour infinite scroll */}
              {hasMore && (
                <div ref={loaderRef} className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </>
  );
}
