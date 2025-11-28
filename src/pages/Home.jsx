// src/pages/Home.jsx
import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Seo from '../seo/Seo';
import { organizationSchema, websiteSchema, radioStationSchema } from '../seo/schemas';
import { useI18n } from '../i18n';
import { useTheme } from '../context/ThemeContext';
import { channels } from '../data/channels';
import ChannelCarousel from '../components/ChannelCarousel';
import ArticleCarousel from '../components/ArticleCarousel';
import PodcastCarousel from '../components/PodcastCarousel';
import GoogleAd from '../components/ads/GoogleAd';
import daily from '../data/daily-schedule.json';
import { useAudio } from '../context/AudioPlayerContext';
import { supabase } from '../lib/supabase';

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
      const { data } = await supabase
        .from('articles')
        .select('id, slug, title, excerpt, content, cover_url, featured_image, user_id, created_at')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(4);

      if (data && data.length > 0) {
        // Charger les auteurs avec leur avatar
        const userIds = [...new Set(data.map(a => a.user_id).filter(Boolean))];
        console.log('🔍 Articles user_ids:', userIds);

        if (userIds.length === 0) {
          console.warn('⚠️ AUCUN user_id trouvé dans les articles! Les articles n\'ont pas d\'auteur assigné.');
          setLatestBlogs(data.map(article => ({
            ...article,
            author_name: null,
            author_avatar: null,
            author_id: null
          })));
          return;
        }

        const { data: authors, error: authorsError } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .in('id', userIds);

        if (authorsError) {
          console.error('❌ Erreur chargement auteurs:', authorsError);
        }

        console.log('👥 Auteurs chargés:', authors);

        const authorMap = {};
        if (authors) {
          authors.forEach(author => {
            authorMap[author.id] = author;
            console.log(`   - ${author.username} (${author.id}): avatar=${author.avatar_url || 'none'}`);
          });
        }

        // Ajouter les auteurs aux articles
        const articlesWithAuthors = data.map(article => {
          const author = authorMap[article.user_id];
          const result = {
            ...article,
            author_name: author?.username || null,
            author_avatar: author?.avatar_url || null,
            author_id: article.user_id
          };
          console.log(`📄 Article "${article.title}": author=${result.author_name}, avatar=${result.author_avatar}`);
          return result;
        });

        setLatestBlogs(articlesWithAuthors);
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
      const { data: postsData } = await supabase
        .from('posts')
        .select('*')
        .is('deleted_at', null)
        .is('reply_to_id', null)
        .order('created_at', { ascending: false })
        .limit(5);

      if (postsData && postsData.length > 0) {
        const userIds = [...new Set(postsData.map(p => p.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, artist_slug, avatar_url')
          .in('id', userIds);

        const profilesMap = {};
        if (profiles) {
          profiles.forEach(p => { profilesMap[p.id] = p; });
        }

        const postsWithAuthors = postsData.map(post => ({
          ...post,
          author: profilesMap[post.user_id] || null
        }));

        setLatestPosts(postsWithAuthors);
      }
    };

    loadLatestPosts();
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
  }, [segments]);

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
              <div className="text-sm uppercase tracking-widest font-semibold text-red-400 mb-2">
                {t?.site?.nowPlaying || 'En lecture'}
              </div>
              <h1 className="text-5xl md:text-7xl font-black leading-tight drop-shadow-lg mb-4">
                {currentSeg?.title || 'Musique en continu'}
              </h1>
              <div className="text-white/90 text-lg font-medium mb-8">
                {currentSeg ? fmtRange(currentSeg.start, currentSeg.end, lang) : '—'}
              </div>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <button
                  type="button"
                  aria-label={t.home?.listenCta || 'Écouter'}
                  aria-pressed={isKracPlaying}
                  className="group transition duration-200 focus:outline-none flex items-center justify-center gap-4 px-8 py-4 bg-red-600 text-white rounded-full font-bold text-lg hover:bg-red-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                  onClick={() =>
                    (current?.key === KRAC_KEY ? togglePlay() : playChannel(KRAC_KEY))
                  }
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
                </button>
                
                {nextSeg && (
                  <div className="border-l-2 border-white/20 pl-6">
                    <div className="text-[11px] uppercase tracking-widest font-semibold text-white/80 mb-1">
                      {t?.schedule?.upNext || 'À suivre'}
                    </div>
                    <div className="text-white text-lg font-bold leading-tight">
                      {nextSeg.title}
                    </div>
                    <div className="text-white/70 text-sm font-medium mb-2">
                      {fmtRange(nextSeg.start, nextSeg.end, lang)}
                    </div>
                    <Link to="/schedule" className="text-white font-semibold text-sm inline-flex items-center gap-2 hover:text-red-400 transition-colors">
                      {t.home?.viewScheduleCta || 'Voir l\'horaire'}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Carrousel des chaînes */}
      <section className="w-full relative z-10 overflow-visible py-16 bg-gray-100 dark:bg-gray-800">
        <div className="max-w-4xl mx-auto text-center mb-12 px-5 md:px-0">
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">
            {t.home?.channelsHeading || 'Nos Chaînes Musicales'}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Explorez notre sélection de chaînes thématiques pour tous les goûts.
          </p>
        </div>
        <div className="overflow-visible">
          <ChannelCarousel channels={channels} />
        </div>
      </section>

      {/* Section Soumettre Musique à la Radio */}
      <section className="py-16 bg-gradient-to-br from-red-900 via-red-800 to-orange-900 text-white">
        <div className="max-w-4xl mx-auto text-center px-5">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
            {t.home?.submitMusicTitle || 'Soumettez votre musique'}
          </h2>
          <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
            {t.home?.submitMusicDesc || 'Vous êtes artiste? Partagez votre talent avec notre communauté. Envoyez vos créations et faites découvrir votre musique à des milliers d\'auditeurs!'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/submit-music"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-red-900 rounded-full font-bold text-lg hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              🎵 {t.home?.submitMusicCta || 'Soumettre ma musique'}
            </Link>
            <Link
              to="/artists"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-white/50 text-white rounded-full font-bold text-lg hover:bg-white/10 transition-colors"
            >
              {t.home?.discoverArtists || 'Découvrir les artistes'}
            </Link>
          </div>
        </div>
      </section>


      {/* Section Articles */}
      <section className="w-full py-16 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white">
              {lang === 'en' ? 'Latest Articles' : lang === 'es' ? 'Últimos Artículos' : 'Derniers Articles'}
            </h2>
            <Link to="/articles" className="text-red-500 font-semibold hover:underline">
              {t.home?.viewAll || 'Voir tout'} →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {latestBlogs.slice(0, 4).map((article, idx) => (
              <Link key={article.id} to={`/article/${article.slug}`} className={`group block ${idx === 0 ? 'md:col-span-2 md:row-span-2' : ''}`}>
                <div className={`relative rounded-2xl overflow-hidden shadow-lg h-full ${idx === 0 ? 'min-h-[400px]' : 'min-h-[200px]'}`}>
                  <img
                    src={article.featured_image || article.cover_url}
                    alt={article.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 absolute inset-0"
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
            ))}
          </div>
        </div>
      </section>

      {/* Section Podcasts */}
      <section className="w-full py-16 px-4 md:px-8 bg-gray-100 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white">
              {lang === 'en' ? 'Featured Podcasts' : lang === 'es' ? 'Podcasts Destacados' : 'Podcasts en Vedette'}
            </h2>
            <Link to="/podcasts" className="text-red-500 font-semibold hover:underline">
              {t.home?.viewAll || 'Voir tout'} →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {latestPodcasts.slice(0, 3).map((podcast) => (
              <Link key={podcast.id} to={`/podcast/${podcast.id}`} className="group block bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                <div className="aspect-square overflow-hidden">
                  <img
                    src={podcast.image_url}
                    alt={podcast.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-red-500 transition-colors line-clamp-2">
                    {podcast.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                    {podcast.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Section Feed */}
      <section className="w-full py-16 px-4 md:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white">
              {t.feed?.title || 'Feed'}
            </h2>
            <Link to="/feed" className="text-red-500 font-semibold hover:underline">
              {t.home?.viewAll || 'Voir tout'} →
            </Link>
          </div>

          <div className="space-y-4">
            {latestPosts.slice(0, 5).map((post) => {
              const author = post.author;
              const profileLink = author?.artist_slug ? `/profile/${author.artist_slug}` : `/profile/${post.user_id}`;
              const getRelativeTime = (dateString) => {
                const diff = Date.now() - new Date(dateString).getTime();
                const minutes = Math.floor(diff / 60000);
                const hours = Math.floor(diff / 3600000);
                const days = Math.floor(diff / 86400000);
                if (minutes < 60) return `${minutes}m`;
                if (hours < 24) return `${hours}h`;
                return `${days}d`;
              };

              return (
                <div key={post.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <Link to={profileLink} className="shrink-0">
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
                        <Link to={profileLink} className="font-semibold text-gray-900 dark:text-white hover:underline">
                          {author?.username || 'User'}
                        </Link>
                        <span className="text-gray-400">·</span>
                        <span className="text-sm text-gray-400">{getRelativeTime(post.created_at)}</span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 line-clamp-3">
                        {post.content}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            {latestPosts.length === 0 && (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                {t.feed?.noPosts || 'Aucun post'}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Section Vidéos */}
      <section className="py-20 bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.4"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
        </div>

        <div className="max-w-4xl mx-auto px-5 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-10">
            {/* Left: Icon/Visual */}
            <div className="flex-shrink-0">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20 shadow-2xl">
                <svg className="w-16 h-16 md:w-20 md:h-20 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                </svg>
              </div>
            </div>

            {/* Right: Content */}
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
                {lang === 'en' ? 'Music Videos' : lang === 'es' ? 'Videos Musicales' : 'Clips Musicaux'}
              </h2>
              <p className="text-lg text-white/80 mb-8 max-w-xl">
                {lang === 'en'
                  ? 'Watch the best music videos from artists featured on KracRadio. Like and build your playlist! Play them fullscreen non-stop — at a party, in your bedroom, at the office, in a bar, you name it!'
                  : lang === 'es'
                  ? 'Mira los mejores videos musicales de los artistas destacados en KracRadio. ¡Dale like y crea tu playlist! Ponlos en pantalla completa sin parar — en una fiesta, en tu cuarto, en la oficina, en un bar, ¡donde quieras!'
                  : 'Regardez les meilleurs clips musicaux des artistes diffusés sur KracRadio. Likez et construisez votre playlist! Écoutez-les en mode plein écran en continu — dans un party, dans ta chambre à coucher, au bureau, dans un bar, name it!'}
              </p>
              <Link
                to="/videos"
                className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-purple-900 rounded-full font-bold text-lg hover:bg-gray-100 transition-all shadow-xl hover:shadow-2xl transform hover:scale-105"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                {lang === 'en' ? 'Watch Videos' : lang === 'es' ? 'Ver Videos' : 'Voir les clips'}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Publicité Google Ads */}
      <div className="py-10">
        <div className="px-5">
          <GoogleAd slot="3411355648" className="mx-auto max-w-5xl" />
        </div>
      </div>

      {/* Sponsors Section */}
      <section className="py-16 bg-gray-900">
        <div className="max-w-4xl mx-auto px-5">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-2">
              {lang === 'en' ? 'Our Sponsors' : lang === 'es' ? 'Nuestros Patrocinadores' : 'Nos Commanditaires'}
            </h2>
          </div>

          {/* H1Site Sponsor */}
          <div className="bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-700 mb-8">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <a href="https://h1site.com" target="_blank" rel="noopener noreferrer" className="flex-shrink-0 hover:opacity-80 transition-opacity">
                <img
                  src="/images/sponsors/h1site_logo_svg.svg"
                  alt="H1Site"
                  className="h-16 md:h-20 w-auto"
                />
              </a>
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
          </div>

          {/* Become a Sponsor CTA */}
          <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-8 text-center text-white">
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
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-8 py-3 bg-white text-red-600 rounded-full font-bold hover:bg-gray-100 transition-colors"
            >
              {lang === 'en' ? 'Contact Us' : lang === 'es' ? 'Contáctanos' : 'Contactez-nous'}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Espacement en bas - 30px sur mobile au lieu de la cale pour le player */}
      <div className="pb-[30px] sm:pb-0" />
    </div>
  );
}
