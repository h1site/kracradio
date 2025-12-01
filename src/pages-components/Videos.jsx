'use client';
// src/pages/Videos.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useI18n } from '../i18n';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import Seo from '../seo/Seo';
import { breadcrumbSchema } from '../seo/schemas';
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
    loading: 'Chargement...',
    likes: 'likes',
    comments: 'commentaires',
    addComment: 'Ajouter un commentaire...',
    send: 'Envoyer',
    loginToComment: 'Connectez-vous pour commenter',
    delete: 'Supprimer',
    by: 'par',
    submittedBy: 'Soumis par',
  },
  en: {
    metaTitle: 'Videos — KracRadio',
    metaDesc: 'Discover music videos from KracRadio artists',
    heroBadge: 'Videos',
    heroTitle: 'Videos',
    heroSubtitle: 'Music videos from our community',
    noVideos: 'No videos yet',
    loading: 'Loading...',
    likes: 'likes',
    comments: 'comments',
    addComment: 'Add a comment...',
    send: 'Send',
    loginToComment: 'Login to comment',
    delete: 'Delete',
    by: 'by',
    submittedBy: 'Submitted by',
  },
  es: {
    metaTitle: 'Videos — KracRadio',
    metaDesc: 'Descubre los videos musicales de los artistas de KracRadio',
    heroBadge: 'Videos',
    heroTitle: 'Videos',
    heroSubtitle: 'Videos musicales de nuestra comunidad',
    noVideos: 'No hay videos todavía',
    loading: 'Cargando...',
    likes: 'me gusta',
    comments: 'comentarios',
    addComment: 'Añadir un comentario...',
    send: 'Enviar',
    loginToComment: 'Inicia sesión para comentar',
    delete: 'Eliminar',
    by: 'por',
    submittedBy: 'Enviado por',
  },
};

// Video Card Component
function VideoCard({ video, L }) {
  const [likeCount, setLikeCount] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [player, setPlayer] = useState(null);
  const playerRef = React.useRef(null);
  const hoverTimeoutRef = React.useRef(null);

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
    // Prevent navigation when hovering
    e.preventDefault();
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    // Delay before starting preview
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

  // Generate slug from title only (simpler and more reliable)
  const videoSlug = video.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return (
    <Link href={`/videos/${videoSlug}`} className="block group">
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-lg hover:shadow-xl transition-all group-hover:scale-[1.02]"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* YouTube Preview/Thumbnail */}
        <div className="relative aspect-video w-full bg-black overflow-hidden">
          {/* Thumbnail - hidden when hovering */}
          <img
            src={video.thumbnail_url || `https://img.youtube.com/vi/${video.youtube_id}/maxresdefault.jpg`}
            alt={video.title}
            className={`w-full h-full object-cover transition-all ${isHovering ? 'opacity-0' : 'opacity-100'}`}
            onError={(e) => {
              // Try hqdefault, then default thumbnail
              if (e.target.src.includes('maxresdefault')) {
                e.target.src = `https://img.youtube.com/vi/${video.youtube_id}/hqdefault.jpg`;
              } else if (!e.target.src.includes('video-thumbnail-default')) {
                e.target.src = '/images/video-thumbnail-default.svg';
              }
            }}
          />

          {/* YouTube Player - shown when hovering */}
          <div className={`absolute inset-0 ${isHovering ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div id={`player-${video.id}`} className="w-full h-full"></div>
          </div>

          {/* Play button overlay - hidden when hovering */}
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
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{video.artist_name}</p>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
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

export default function Videos() {
  const { lang } = useI18n();
  const { user } = useAuth();
  const { isDesktop, sidebarOpen, sidebarWidth } = useUI();
  const L = useMemo(() => STRINGS[lang] || STRINGS.fr, [lang]);

  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadVideos = useCallback(async () => {
    try {
      const data = await getApprovedVideos();
      setVideos(data);
    } catch (err) {
      console.error('Error loading videos:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

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

      <div className="min-h-screen bg-gray-50 dark:bg-black">
        {/* Hero Header */}
        <header className="relative overflow-hidden border-b border-gray-800">
          {/* Background image with gradient overlay */}
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1574267432644-f65b56c5e2ce?w=1920&h=400&fit=crop&auto=format&q=80"
              alt=""
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/90 to-black/70"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
          </div>

          <div className="relative px-6 py-12 max-w-[1800px] mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-red-500/20 border border-red-500/30 rounded-full text-red-400 text-xs font-bold uppercase tracking-widest">
                {L.heroBadge}
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-3">
              {L.heroTitle}
            </h1>
            <p className="text-lg text-gray-400 max-w-2xl">
              {L.heroSubtitle}
            </p>
          </div>
        </header>

        <main className="px-6 py-8 max-w-[1800px] mx-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : videos.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500 dark:text-gray-400">{L.noVideos}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {videos.map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  L={L}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
