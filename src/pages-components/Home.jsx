'use client';
// src/pages/Home.jsx
import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import Seo from '../seo/Seo';
import { organizationSchema, websiteSchema, radioStationSchema } from '../seo/schemas';
import { useI18n } from '../i18n';
import { useTheme } from '../context/ThemeContext';
import { channels } from '../data/channels';
import ChannelCarousel from '../components/ChannelCarousel';
import ArticleCarousel from '../components/ArticleCarousel';
import PodcastCarousel from '../components/PodcastCarousel';
import { LeaderboardAd, InFeedAd } from '../components/ads';
import daily from '../data/daily-schedule.json';
import { useAudio } from '../context/AudioPlayerContext';
import { supabase, SUPABASE_FUNCTIONS_URL } from '../lib/supabase';
import {
  FadeIn,
  StaggerContainer,
  StaggerItem,
  AnimatedCard,
  SlideIn,
  motion
} from '../components/animations';

const KRAC_KEY = 'kracradio';

// Composant pour les icônes - comme dans Sidebar.jsx
function IconImg({ name, alt = '', className = 'w-5 h-5' }) {
  const { isDark } = useTheme();
  const src = `/icons/${isDark ? 'dark' : 'light'}/${name}.svg`;
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={(e) => {
        e.currentTarget.onerror = null;
        e.currentTarget.src = '/icons/default.svg';
      }}
    />
  );
}

function toTodayDate(timeStr) {
  const [hhRaw, mmRaw] = (timeStr || '00:00').split(':');
  const hh = parseInt(hhRaw, 10);
  const mm = parseInt(mmRaw, 10) || 0;
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  if (Number.isFinite(hh) && hh >= 24) {
    d.setDate(d.getDate() + 1);
    d.setHours(0, mm, 0, 0);
  } else {
    d.setHours(Number.isFinite(hh) ? hh : 0, mm, 0, 0);
  }
  return d;
}

function fmtRange(start, end, lang) {
  const opt = { hour: '2-digit', minute: '2-digit' };
  return `${new Intl.DateTimeFormat(lang, opt).format(start)} — ${new Intl.DateTimeFormat(lang, opt).format(end)}`;
}

export default function Home() {
  const { t, lang } = useI18n();
  const { current, playing, playChannel, togglePlay } = useAudio();
  const [latestBlogs, setLatestBlogs] = useState([]);
  const [latestPodcasts, setLatestPodcasts] = useState([]);
  const [latestPosts, setLatestPosts] = useState([]);
  const [storeProducts, setStoreProducts] = useState([]);
  const [showApkBanner, setShowApkBanner] = useState(true);

  const krac = useMemo(() => channels.find((c) => c.key === KRAC_KEY), []);
  const kracImage = krac?.image || '/channels/kracradio.webp';

  // Vérifier si le banner a déjà été fermé
  useEffect(() => {
    const bannerDismissed = localStorage.getItem('apkBannerDismissed');
    if (bannerDismissed === 'true') {
      setShowApkBanner(false);
    }
  }, []);

  // Fermer le banner et sauvegarder dans localStorage
  const dismissBanner = () => {
    setShowApkBanner(false);
    localStorage.setItem('apkBannerDismissed', 'true');
  };

  // Charger les 4 derniers blogs
  useEffect(() => {
    const loadLatestBlogs = async () => {
      console.log('[Home] Loading latest articles...');
      try {
        const { data, error } = await supabase
          .from('articles')
          .select('*')
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .limit(4);

        console.log('[Home] Articles result:', { count: data?.length, error: error?.message });

        if (error) {
          console.error('[Home] Error loading articles:', error);
          return;
        }

        if (!data || data.length === 0) {
          console.log('[Home] No articles found');
          return;
        }

        // Préparer les articles avec des valeurs par défaut pour l'auteur
        const articlesWithDefaults = data.map(article => ({
          ...article,
          author_name: null,
          author_avatar: null,
          author_id: article.user_id
        }));

        // Essayer de charger les auteurs (peut échouer à cause de RLS)
        const userIds = [...new Set(data.map(a => a.user_id).filter(Boolean))];
        console.log('[Home] Fetching authors for user_ids:', userIds);

        if (userIds.length > 0) {
          const { data: authors, error: authorsError } = await supabase
            .from('profiles')
            .select('id, username, avatar_url')
            .in('id', userIds);

          if (authorsError) {
            console.warn('[Home] Could not load authors (RLS?):', authorsError.message);
          }

          if (authors && authors.length > 0) {
            console.log('[Home] Authors loaded:', authors.length);
            const authorMap = {};
            authors.forEach(author => {
              authorMap[author.id] = author;
            });

            // Mettre à jour les articles avec les auteurs
            articlesWithDefaults.forEach(article => {
              const author = authorMap[article.user_id];
              if (author) {
                article.author_name = author.username;
                article.author_avatar = author.avatar_url;
              }
            });
          } else {
            console.log('[Home] No authors returned (RLS blocking access?)');
          }
        }

        console.log('[Home] Setting', articlesWithDefaults.length, 'articles');
        setLatestBlogs(articlesWithDefaults);
      } catch (err) {
        console.error('[Home] Exception loading articles:', err);
      }
    };

    loadLatestBlogs();
  }, []);

  // Charger 3 podcasts aléatoires
  useEffect(() => {
    const loadRandomPodcasts = async () => {
      const { count } = await supabase
        .from('user_podcasts')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      if (count && count > 0) {
        // Générer 3 offsets aléatoires uniques
        const offsets = new Set();
        while (offsets.size < Math.min(3, count)) {
          offsets.add(Math.floor(Math.random() * count));
        }

        // Récupérer les podcasts
        const podcasts = [];
        for (const offset of offsets) {
          const { data } = await supabase
            .from('user_podcasts')
            .select('*')
            .eq('is_active', true)
            .range(offset, offset)
            .single();

          if (data) podcasts.push(data);
        }

        setLatestPodcasts(podcasts);
      }
    };

    loadRandomPodcasts();
  }, []);

  // Charger les 5 derniers posts du feed
  useEffect(() => {
    const loadLatestPosts = async () => {
      console.log('[Home] Loading latest posts...');
      try {
        const { data: postsData, error } = await supabase
          .from('posts')
          .select('*')
          .is('deleted_at', null)
          .is('reply_to_id', null)
          .order('created_at', { ascending: false })
          .limit(5);

        console.log('[Home] Posts result:', { count: postsData?.length, error: error?.message });

        if (error) {
          console.error('[Home] Error loading posts:', error);
          return;
        }

        if (!postsData || postsData.length === 0) {
          console.log('[Home] No posts found');
          return;
        }

        // Préparer les posts avec un auteur par défaut
        const postsWithDefaults = postsData.map(post => ({
          ...post,
          author: { username: 'Utilisateur', avatar_url: null, artist_slug: null }
        }));

        // Essayer de charger les profils (peut échouer à cause de RLS)
        const userIds = [...new Set(postsData.map(p => p.user_id).filter(Boolean))];
        console.log('[Home] Fetching profiles for user_ids:', userIds);

        if (userIds.length > 0) {
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, username, artist_slug, avatar_url')
            .in('id', userIds);

          if (profilesError) {
            console.warn('[Home] Could not load profiles (RLS?):', profilesError.message);
          }

          if (profiles && profiles.length > 0) {
            console.log('[Home] Profiles loaded:', profiles.length);
            const profilesMap = {};
            profiles.forEach(p => { profilesMap[p.id] = p; });

            // Mettre à jour les posts avec les profils
            postsWithDefaults.forEach(post => {
              if (profilesMap[post.user_id]) {
                post.author = profilesMap[post.user_id];
              }
            });
          } else {
            console.log('[Home] No profiles returned (RLS blocking access?)');
          }
        }

        console.log('[Home] Setting', postsWithDefaults.length, 'posts');
        setLatestPosts(postsWithDefaults);
      } catch (err) {
        console.error('[Home] Exception loading posts:', err);
      }
    };

    loadLatestPosts();
  }, []);

  // Charger 5 produits random de la boutique Shopify
  useEffect(() => {
    const loadStoreProducts = async () => {
      if (!SUPABASE_FUNCTIONS_URL) return;
      try {
        const response = await fetch(
          `${SUPABASE_FUNCTIONS_URL}/shopify-get-products?limit=5`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.products && data.products.length > 0) {
            setStoreProducts(data.products);
          }
        }
      } catch (error) {
        console.error('Error loading store products:', error);
      }
    };
    loadStoreProducts();
  }, []);

  // Track if component is mounted to avoid hydration mismatch
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const segments = useMemo(() => {
    const arr = (daily || [])
      .map((it, idx) => {
        const start = toTodayDate(it.start);
        const end = toTodayDate(it.end);
        return {
          id: `${start.toISOString()}-${idx}`,
          title: (it.title || '').trim(),
          start,
          end,
          image: it.image || kracImage
        };
      })
      .sort((a, b) => a.start - b.start);
    return arr;
  }, [kracImage]);

  const { currentSeg, nextSeg } = useMemo(() => {
    // Return null during SSR to avoid hydration mismatch
    if (!isMounted) {
      return { currentSeg: null, nextSeg: null };
    }
    const now = Date.now();
    let cur = null;
    let nxt = null;
    for (let i = 0; i < segments.length; i++) {
      const s = segments[i];
      if (now >= s.start.getTime() && now < s.end.getTime()) {
        cur = s;
        nxt = segments[(i + 1) % segments.length] || null;
        break;
      }
    }
    if (!cur && segments.length) {
      const after = segments.find((s) => s.start.getTime() > now);
      nxt = after || segments[0];
    }
    return { currentSeg: cur, nextSeg: nxt };
  }, [segments, isMounted]);

  const isKracPlaying = playing && current?.key === KRAC_KEY;

  return (
    <div className="">
      <Seo
        lang={lang}
        title={t.meta?.homeTitle}
        description={t.meta?.homeDesc}
        path="/"
        type="website"
        alternates
        jsonLd={[organizationSchema, websiteSchema, radioStationSchema]}
      />

      {/* MOBILE APK BANNER - Visible uniquement sur mobile */}
      {showApkBanner && (
        <div className="lg:hidden mb-4 mx-4 relative">
          <div className="block w-full rounded-lg border border-green-500/40 bg-gradient-to-r from-green-500/10 to-green-600/10 p-4 relative">
            {/* Bouton Fermer */}
            <button
              onClick={dismissBanner}
              className="absolute top-2 right-2 p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
              aria-label="Fermer"
            >
              <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Contenu du banner */}
            <a
              href="/kracradio.apk"
              download
              className="block hover:opacity-90 transition-opacity"
            >
              <div className="flex items-start gap-3 pr-6">
                <div className="flex-shrink-0 text-3xl">📱</div>
                <div className="flex-1 min-w-0">
                  <div className="text-green-600 dark:text-green-400 font-bold text-sm mb-1">
                    Télécharger l'application Android
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                    Obtenez la meilleure expérience d'écoute. <span className="font-semibold">Important:</span> Autorisez les sources inconnues dans vos paramètres Android.
                  </div>
                  <div className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
                    <span>Télécharger maintenant</span>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </a>
          </div>
        </div>
      )}

      {/* HERO */}
      <section className="w-full px-0 pb-0">
        <div
          className="relative w-full h-[80vh] bg-cover bg-center text-white"
          style={{ backgroundImage: `url(${currentSeg?.image || kracImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
          
          <div className="relative z-10 flex flex-col justify-end h-full p-8 md:p-12">
            <div className="max-w-4xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-sm uppercase tracking-widest font-semibold text-red-400 mb-2"
              >
                {t?.site?.nowPlaying || 'En lecture'}
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="text-5xl md:text-7xl font-black leading-tight drop-shadow-lg mb-4"
              >
                {currentSeg?.title || 'Musique en continu'}
              </motion.h1>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-white/90 text-lg font-medium mb-8"
              >
                {currentSeg ? fmtRange(currentSeg.start, currentSeg.end, lang) : '—'}
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col sm:flex-row items-start sm:items-center gap-6"
              >
                <motion.button
                  type="button"
                  aria-label={t.home?.listenCta || 'Écouter'}
                  aria-pressed={isKracPlaying}
                  className="group transition duration-200 focus:outline-none flex items-center justify-center gap-4 px-8 py-4 bg-red-600 text-white rounded-full font-bold text-lg hover:bg-red-700 shadow-lg hover:shadow-xl"
                  onClick={() =>
                    (current?.key === KRAC_KEY ? togglePlay() : playChannel(KRAC_KEY))
                  }
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isKracPlaying ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="6" y="5" width="4" height="14" rx="1" />
                      <rect x="14" y="5" width="4" height="14" rx="1" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                  <span>
                    {isKracPlaying ? 'En direct' : (t.home?.listenCta || 'Écouter')}
                  </span>
                </motion.button>

                {nextSeg && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    className="border-l-2 border-white/20 pl-6"
                  >
                    <div className="text-[11px] uppercase tracking-widest font-semibold text-white/80 mb-1">
                      {t?.schedule?.upNext || 'À suivre'}
                    </div>
                    <div className="text-white text-lg font-bold leading-tight">
                      {nextSeg.title}
                    </div>
                    <div className="text-white/70 text-sm font-medium mb-2">
                      {fmtRange(nextSeg.start, nextSeg.end, lang)}
                    </div>
                    <Link href="/schedule" className="text-white font-semibold text-sm inline-flex items-center gap-2 hover:text-red-400 transition-colors">
                      {t.home?.viewScheduleCta || 'Voir l\'horaire'}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                    </Link>
                  </motion.div>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* AD #1 - Leaderboard après Hero */}
      <div className="py-4" style={{ backgroundColor: '#1E1E1E' }}>
        <LeaderboardAd />
      </div>

      {/* Carrousel des chaînes - Background #1E1E1E */}
      <section className="w-full relative z-10 overflow-visible py-16" style={{ backgroundColor: '#1E1E1E' }}>
        <FadeIn direction="up" className="max-w-4xl mx-auto text-center mb-12 px-5 md:px-0">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
            {t.home?.channelsHeading || 'Nos Chaînes Musicales'}
          </h2>
          <p className="text-lg text-gray-400">
            Explorez notre sélection de chaînes thématiques pour tous les goûts.
          </p>
        </FadeIn>
        <FadeIn delay={0.2} className="overflow-visible">
          <ChannelCarousel channels={channels} />
        </FadeIn>
      </section>

      {/* Section Soumettre Musique à la Radio - Background avec image */}
      <section
        className="py-16 text-white relative"
        style={{
          backgroundImage: 'url(/images/concert-bg.jpg)',
          backgroundAttachment: 'fixed',
          backgroundPosition: 'center',
          backgroundSize: 'cover'
        }}
      >
        <div className="absolute inset-0" style={{ backgroundColor: 'rgba(147, 31, 25, 0.85)' }} />
        <div className="max-w-4xl mx-auto text-center px-5 relative z-10">
          <FadeIn direction="up">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              {t.home?.submitMusicTitle || 'Soumettez votre musique'}
            </h2>
          </FadeIn>
          <FadeIn direction="up" delay={0.1}>
            <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
              {t.home?.submitMusicDesc || 'Vous êtes artiste? Partagez votre talent avec notre communauté. Envoyez vos créations et faites découvrir votre musique à des milliers d\'auditeurs!'}
            </p>
          </FadeIn>
          <FadeIn direction="up" delay={0.2}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                <Link
                  href="/submit-music"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-[#931F19] rounded-full font-bold text-lg hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl"
                >
                  🎵 {t.home?.submitMusicCta || 'Soumettre ma musique'}
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                <Link
                  href="/artists"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-white/50 text-white rounded-full font-bold text-lg hover:bg-white/10 transition-colors"
                >
                  {t.home?.discoverArtists || 'Découvrir les artistes'}
                </Link>
              </motion.div>
            </div>
          </FadeIn>
        </div>
      </section>


      {/* Section Articles - Background #1E1E1E */}
      <section className="w-full py-16 px-4 md:px-8" style={{ backgroundColor: '#1E1E1E' }}>
        <div className="max-w-7xl mx-auto">
          <FadeIn direction="up">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl md:text-4xl font-black text-white">
                {lang === 'en' ? 'Latest Articles' : lang === 'es' ? 'Últimos Artículos' : 'Derniers Articles'}
              </h2>
              <Link href="/articles" className="text-red-400 font-semibold hover:underline">
                {t.home?.viewAll || 'Voir tout'} →
              </Link>
            </div>
          </FadeIn>

          {latestBlogs.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <div className="animate-spin w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p>Chargement des articles...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {latestBlogs.slice(0, 4).map((article, idx) => (
                <div key={article.id} className={idx === 0 ? 'md:col-span-2 md:row-span-2' : ''}>
                  <Link href={`/article/${article.slug}`} className="group block h-full">
                    <div className={`relative rounded-2xl overflow-hidden shadow-lg h-full ${idx === 0 ? 'min-h-[400px]' : 'min-h-[200px]'}`}>
                      <img
                        src={article.featured_image || article.cover_url || '/images/default-cover.jpg'}
                        alt={article.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 absolute inset-0"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
                        {article.author_name && (
                          <div className="flex items-center gap-2 mb-2">
                            {article.author_avatar && (
                              <img src={article.author_avatar} alt={article.author_name} className="w-6 h-6 rounded-full object-cover" />
                            )}
                            <span className="text-xs text-white/80">{article.author_name}</span>
                          </div>
                        )}
                        <h3 className={`font-bold text-white leading-tight ${idx === 0 ? 'text-2xl md:text-3xl' : 'text-base'}`}>
                          {article.title}
                        </h3>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Section Podcasts - Background avec image */}
      <section
        className="w-full py-16 px-4 md:px-8 relative"
        style={{
          backgroundImage: 'url(/images/concert-bg.jpg)',
          backgroundAttachment: 'fixed',
          backgroundPosition: 'center',
          backgroundSize: 'cover'
        }}
      >
        <div className="absolute inset-0" style={{ backgroundColor: 'rgba(147, 31, 25, 0.85)' }} />
        <div className="max-w-7xl mx-auto relative z-10">
          <FadeIn direction="up">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl md:text-4xl font-black text-white">
                {lang === 'en' ? 'Featured Podcasts' : lang === 'es' ? 'Podcasts Destacados' : 'Podcasts en Vedette'}
              </h2>
              <Link href="/podcasts" className="text-white/80 font-semibold hover:text-white hover:underline">
                {t.home?.viewAll || 'Voir tout'} →
              </Link>
            </div>
          </FadeIn>

          {latestPodcasts.length === 0 ? (
            <div className="text-center py-12 text-white/60">
              <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
              <p>Chargement des podcasts...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {latestPodcasts.slice(0, 3).map((podcast) => (
                <div key={podcast.id} className="h-full">
                  <Link href={`/podcast/${podcast.id}`} className="group flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-3 shadow-lg hover:shadow-xl hover:bg-white/15 transition-all border border-white/10 h-full">
                    <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden">
                      <img
                        src={podcast.image_url || '/images/default-cover.jpg'}
                        alt={podcast.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white group-hover:text-white/80 transition-colors line-clamp-2 text-sm">
                        {podcast.title}
                      </h3>
                      <p className="text-xs text-white/60 mt-1 line-clamp-2">
                        {podcast.description}
                      </p>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* AD #2 - In-feed après Podcasts */}
      <div className="py-4" style={{ backgroundColor: '#1E1E1E' }}>
        <div className="max-w-4xl mx-auto px-4">
          <InFeedAd />
        </div>
      </div>

      {/* Section Feed - Background #1E1E1E */}
      <section className="w-full py-16 px-4 md:px-8" style={{ backgroundColor: '#1E1E1E' }}>
        <div className="max-w-7xl mx-auto">
          <FadeIn direction="up">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl md:text-4xl font-black text-white">
                {t.feed?.title || 'Feed'}
              </h2>
              <Link href="/feed" className="text-red-400 font-semibold hover:underline">
                {t.home?.viewAll || 'Voir tout'} →
              </Link>
            </div>
          </FadeIn>

          <div className="space-y-4">
            {latestPosts.slice(0, 5).map((post) => {
              const author = post.author;
              const profileLink = author?.artist_slug ? `/profile/${author.artist_slug}` : post.user_id ? `/profile/${post.user_id}` : '#';
              const getRelativeTime = (dateString) => {
                // Return placeholder during SSR to avoid hydration mismatch
                if (!isMounted) return '...';
                const diff = Date.now() - new Date(dateString).getTime();
                const minutes = Math.floor(diff / 60000);
                const hours = Math.floor(diff / 3600000);
                const days = Math.floor(diff / 86400000);
                if (minutes < 60) return `${minutes}m`;
                if (hours < 24) return `${hours}h`;
                return `${days}d`;
              };

              return (
                <div
                  key={post.id}
                  className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <Link href={profileLink} className="shrink-0">
                      {author?.avatar_url ? (
                        <img src={author.avatar_url} alt={author.username} className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center text-white font-bold">
                          {author?.username?.[0]?.toUpperCase() || '?'}
                        </div>
                      )}
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Link href={profileLink} className="font-semibold text-white hover:underline">
                          {author?.username || 'User'}
                        </Link>
                        <span className="text-gray-500">·</span>
                        <span className="text-sm text-gray-500">{getRelativeTime(post.created_at)}</span>
                      </div>
                      <p className="text-gray-300 line-clamp-3">
                        {post.content}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            {latestPosts.length === 0 && (
              <p className="text-center text-gray-500 py-8">
                {t.feed?.noPosts || 'Aucun post'}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Section Vidéos - Background avec image */}
      <section
        className="py-20 relative overflow-hidden"
        style={{
          backgroundImage: 'url(/images/concert-bg.jpg)',
          backgroundAttachment: 'fixed',
          backgroundPosition: 'center',
          backgroundSize: 'cover'
        }}
      >
        <div className="absolute inset-0" style={{ backgroundColor: 'rgba(147, 31, 25, 0.85)' }} />
        <div className="max-w-4xl mx-auto px-5 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-10">
            {/* Left: Icon/Visual */}
            <SlideIn direction="left" className="flex-shrink-0">
              <motion.div
                className="w-32 h-32 md:w-40 md:h-40 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20 shadow-2xl"
                whileHover={{ scale: 1.05, rotate: 3 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <svg className="w-16 h-16 md:w-20 md:h-20 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                </svg>
              </motion.div>
            </SlideIn>

            {/* Right: Content */}
            <div className="flex-1 text-center md:text-left">
              <FadeIn direction="up">
                <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
                  {lang === 'en' ? 'Music Videos' : lang === 'es' ? 'Videos Musicales' : 'Clips Musicaux'}
                </h2>
              </FadeIn>
              <FadeIn direction="up" delay={0.1}>
                <p className="text-lg text-white/80 mb-8 max-w-xl">
                  {lang === 'en'
                    ? 'Watch the best music videos from artists featured on KracRadio. Like and build your playlist! Play them fullscreen non-stop — at a party, in your bedroom, at the office, in a bar, you name it!'
                    : lang === 'es'
                    ? 'Mira los mejores videos musicales de los artistas destacados en KracRadio. ¡Dale like y crea tu playlist! Ponlos en pantalla completa sin parar — en una fiesta, en tu cuarto, en la oficina, en un bar, ¡donde quieras!'
                    : 'Regardez les meilleurs clips musicaux des artistes diffusés sur KracRadio. Likez et construisez votre playlist! Écoutez-les en mode plein écran en continu — dans un party, dans ta chambre à coucher, au bureau, dans un bar, name it!'}
                </p>
              </FadeIn>
              <FadeIn direction="up" delay={0.2}>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    href="/videos"
                    className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-[#931F19] rounded-full font-bold text-lg hover:bg-gray-100 transition-all shadow-xl hover:shadow-2xl"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                    {lang === 'en' ? 'Watch Videos' : lang === 'es' ? 'Ver Videos' : 'Voir les clips'}
                  </Link>
                </motion.div>
              </FadeIn>
            </div>
          </div>
        </div>
      </section>

      {/* AD #3 - In-feed après Vidéos */}
      <div className="py-4" style={{ backgroundColor: '#1E1E1E' }}>
        <div className="max-w-4xl mx-auto px-4">
          <InFeedAd />
        </div>
      </div>

      {/* Section Boutique - Background #1E1E1E */}
      {storeProducts.length > 0 && (
        <section className="w-full py-16 px-4 md:px-8" style={{ backgroundColor: '#1E1E1E' }}>
          <div className="max-w-7xl mx-auto">
            <FadeIn direction="up">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-3xl md:text-4xl font-black text-white">
                  {lang === 'en' ? 'Store' : lang === 'es' ? 'Tienda' : 'Boutique'}
                </h2>
                <a
                  href="https://store.kracradio.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-red-400 font-semibold hover:underline"
                >
                  {lang === 'en' ? 'Visit Store' : lang === 'es' ? 'Visitar Tienda' : 'Visiter la boutique'} →
                </a>
              </div>
            </FadeIn>

            {/* Black Friday / Cyber Monday Banner */}
            <FadeIn direction="up" delay={0.1}>
              <motion.div
                className="mb-8 bg-gradient-to-r from-red-600 via-red-500 to-orange-500 rounded-xl p-4 md:p-6 text-center relative overflow-hidden"
                whileHover={{ scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)' }} />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="text-2xl">🔥</span>
                    <span className="text-lg md:text-xl font-black text-white uppercase tracking-wider">
                      Black Friday & Cyber Monday
                    </span>
                    <span className="text-2xl">🔥</span>
                  </div>
                  <p className="text-white text-2xl md:text-3xl font-black">
                    {lang === 'en' ? '15% OFF on everything!' : lang === 'es' ? '¡15% DE DESCUENTO en todo!' : '15% DE RABAIS sur tout!'}
                  </p>
                  <p className="text-white/80 text-sm mt-2">
                    {lang === 'en' ? 'Limited time offer' : lang === 'es' ? 'Oferta por tiempo limitado' : 'Offre à durée limitée'}
                  </p>
                </div>
              </motion.div>
            </FadeIn>

            <StaggerContainer staggerDelay={0.08} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {storeProducts.slice(0, 5).map((product, index) => {
                const currentPrice = parseFloat(product.price || 0);
                const comparePrice = product.compare_at_price ? parseFloat(product.compare_at_price) : null;
                const hasDiscount = comparePrice && comparePrice > currentPrice;

                return (
                  <StaggerItem key={product.id} direction="scale" className={index === 4 ? 'hidden sm:block' : ''}>
                    <motion.a
                      href={`https://store.kracradio.com/products/${product.handle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block bg-white/5 backdrop-blur-sm rounded-xl overflow-hidden border border-white/10 hover:bg-white/10 transition-all hover:border-white/20 h-full"
                      whileHover={{ y: -5 }}
                    >
                      <div className="aspect-square overflow-hidden relative">
                        <img
                          src={product.image_url || '/images/default-cover.jpg'}
                          alt={product.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                        {hasDiscount && (
                          <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                            -15%
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <h3 className="font-semibold text-white text-sm line-clamp-1 group-hover:text-red-400 transition-colors">
                          {product.title}
                        </h3>
                        <p className="text-xs text-gray-400 line-clamp-1 mt-1">
                          {product.vendor}
                        </p>
                        <div className="mt-2">
                          {hasDiscount ? (
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-red-400">
                                ${currentPrice.toFixed(2)}
                              </span>
                              <span className="text-xs text-gray-500 line-through">
                                ${comparePrice.toFixed(2)}
                              </span>
                            </div>
                          ) : (
                            <p className="text-sm font-bold text-red-400">
                              ${currentPrice.toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.a>
                  </StaggerItem>
                );
              })}
            </StaggerContainer>

            <FadeIn direction="up" delay={0.3}>
              <div className="text-center mt-8">
                <motion.a
                  href="https://store.kracradio.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-red-600 text-white rounded-full font-bold text-lg hover:bg-red-700 transition-all shadow-lg hover:shadow-xl"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {lang === 'en' ? 'Go to Store' : lang === 'es' ? 'Ir a la Tienda' : 'Aller à la boutique'}
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </motion.a>
              </div>
            </FadeIn>
          </div>
        </section>
      )}

      {/* Sponsors Section - Background #1E1E1E */}
      <section className="py-16" style={{ backgroundColor: '#1E1E1E' }}>
        <div className="max-w-4xl mx-auto px-5">
          <FadeIn direction="up">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-black text-white mb-2">
                {lang === 'en' ? 'Our Sponsors' : lang === 'es' ? 'Nuestros Patrocinadores' : 'Nos Commanditaires'}
              </h2>
            </div>
          </FadeIn>

          {/* H1Site Sponsor */}
          <FadeIn direction="up" delay={0.1}>
            <motion.div
              className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/10 mb-8"
              whileHover={{ scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <div className="flex flex-col md:flex-row items-center gap-8">
                <motion.a
                  href="https://h1site.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0"
                  whileHover={{ scale: 1.1 }}
                >
                  <img
                    src="/images/sponsors/h1site_logo_svg.svg"
                    alt="H1Site"
                    className="h-16 md:h-20 w-auto"
                  />
                </motion.a>
                <div className="text-center md:text-left">
                  <p className="text-gray-300 text-lg leading-relaxed">
                    {lang === 'en'
                      ? 'This platform is developed by H1Site. For all your website, web application, and SEO needs.'
                      : lang === 'es'
                      ? 'Esta plataforma está desarrollada por H1Site. Para todas sus necesidades de sitios web, aplicaciones web y SEO.'
                      : 'Cette plateforme est développée par H1Site. Pour tous vos besoins de site internet, application web et SEO.'}
                  </p>
                  <a
                    href="https://h1site.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-4 text-red-400 font-semibold hover:underline"
                  >
                    {lang === 'en' ? 'Visit H1Site' : lang === 'es' ? 'Visitar H1Site' : 'Visiter H1Site'}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            </motion.div>
          </FadeIn>

          {/* Become a Sponsor CTA */}
          <FadeIn direction="up" delay={0.2}>
            <div
              className="rounded-2xl p-8 text-center text-white relative overflow-hidden"
              style={{
                backgroundImage: 'url(/images/concert-bg.jpg)',
                backgroundAttachment: 'fixed',
                backgroundPosition: 'center',
                backgroundSize: 'cover'
              }}
            >
              <div className="absolute inset-0 rounded-2xl" style={{ backgroundColor: 'rgba(147, 31, 25, 0.9)' }} />
              <div className="relative z-10">
                <h3 className="text-2xl font-bold mb-3">
                  {lang === 'en'
                    ? 'Want to sponsor KracRadio?'
                    : lang === 'es'
                    ? '¿Quieres patrocinar KracRadio?'
                    : 'Vous voulez commanditer KracRadio?'}
                </h3>
                <p className="text-white/90 mb-6 max-w-xl mx-auto">
                  {lang === 'en'
                    ? 'Join our sponsors and reach thousands of music lovers. Contact us to learn more about sponsorship opportunities.'
                    : lang === 'es'
                    ? 'Únete a nuestros patrocinadores y llega a miles de amantes de la música. Contáctanos para conocer las oportunidades de patrocinio.'
                    : 'Rejoignez nos commanditaires et rejoignez des milliers d\'amateurs de musique. Contactez-nous pour en savoir plus sur les opportunités de commandite.'}
                </p>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-2 px-8 py-3 bg-white text-[#931F19] rounded-full font-bold hover:bg-gray-100 transition-colors"
                  >
                    {lang === 'en' ? 'Contact Us' : lang === 'es' ? 'Contáctanos' : 'Contactez-nous'}
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                </motion.div>
              </div>
            </div>
          </FadeIn>

        </div>
      </section>

      {/* Section Widget - Intégrez la radio sur votre site */}
      <section
        className="py-16 relative"
        style={{
          backgroundImage: 'url(/images/concert-bg.jpg)',
          backgroundAttachment: 'fixed',
          backgroundPosition: 'center',
          backgroundSize: 'cover'
        }}
      >
        <div className="absolute inset-0" style={{ backgroundColor: 'rgba(30, 30, 30, 0.95)' }} />
        <div className="max-w-4xl mx-auto px-5 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-10">
            {/* Left: Icon/Visual */}
            <SlideIn direction="left" className="flex-shrink-0">
              <motion.div
                className="w-32 h-32 md:w-40 md:h-40 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20 shadow-2xl"
                whileHover={{ scale: 1.05, rotate: -3 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <svg className="w-16 h-16 md:w-20 md:h-20 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </motion.div>
            </SlideIn>

            {/* Right: Content */}
            <div className="flex-1 text-center md:text-left">
              <FadeIn direction="up">
                <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
                  {lang === 'en' ? 'Radio on Your Website' : lang === 'es' ? 'Radio en tu Sitio Web' : 'La radio sur votre site web'}
                </h2>
              </FadeIn>
              <FadeIn direction="up" delay={0.1}>
                <p className="text-lg text-white/80 mb-8 max-w-xl">
                  {lang === 'en'
                    ? 'Integrate the KracRadio player on your website or web application with a single line of code. Display now playing information, album art, and let your visitors listen to our stations.'
                    : lang === 'es'
                    ? 'Integra el reproductor de KracRadio en tu sitio web o aplicación web con una sola línea de código. Muestra la información de lo que suena, la portada del álbum y deja que tus visitantes escuchen nuestras estaciones.'
                    : 'Intégrez le lecteur KracRadio sur votre site internet ou application web avec une seule ligne de code. Affichez les informations en cours de lecture, la pochette de l\'album et laissez vos visiteurs écouter nos chaînes.'}
                </p>
              </FadeIn>
              <FadeIn direction="up" delay={0.2}>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    href="/widget"
                    className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-red-600 text-white rounded-full font-bold text-lg hover:bg-red-700 transition-all shadow-xl hover:shadow-2xl"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                    {lang === 'en' ? 'Get the Widget' : lang === 'es' ? 'Obtener el Widget' : 'Obtenir le widget'}
                  </Link>
                </motion.div>
              </FadeIn>
            </div>
          </div>
        </div>
      </section>

      {/* Espacement en bas - 30px sur mobile au lieu de la cale pour le player */}
      <div className="pb-[30px] sm:pb-0" />
    </div>
  );
}
