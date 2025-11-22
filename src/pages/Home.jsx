// src/pages/Home.jsx
import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Seo from '../seo/Seo';
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
    <div className="-mt-5">
      <Seo
        lang={lang}
        title={t.meta?.homeTitle}
        description={t.meta?.homeDesc}
        path="/"
        type="website"
        alternates
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
        <div className="relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 rounded-b-2xl overflow-hidden border border-neutral-800">
            {/* Bloc 1 — En lecture */}
            <div
              className="group relative h-64 lg:h-80"
              style={{
                backgroundImage: `url(${currentSeg?.image || kracImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              <div className="absolute inset-0 bg-black/30" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

              <div className="absolute left-5 right-5 top-4 flex items-center gap-2">
                <div className="text-white text-2xl font-extrabold leading-tight drop-shadow uppercase">
                  {t.home?.nowOnKrac || 'Présentement sur KracRadio'}
                </div>
              </div>

              <div className="absolute left-5 right-5 bottom-5">
                <div className="text-[11px] uppercase tracking-widest font-semibold text-white/80 mb-2">
                  {t?.site?.nowPlaying || 'En lecture'}
                </div>
                <div className="text-white text-2xl font-extrabold leading-tight drop-shadow">
                  {currentSeg?.title || '—'}
                </div>
                <div className="text-white/90 text-sm font-medium mt-1">
                  {currentSeg ? fmtRange(currentSeg.start, currentSeg.end, lang) : '—'}
                </div>
              </div>

              {/* BOUTON ÉCOUTER */}
              <div className="absolute right-5 bottom-5">
                <button
                  type="button"
                  aria-label={t.home?.listenCta || 'Écouter'}
                  aria-pressed={isKracPlaying}
                  className="transition duration-200 focus:outline-none"
                  onClick={() =>
                    (current?.key === KRAC_KEY ? togglePlay() : playChannel(KRAC_KEY))
                  }
                >
                  <span className="inline-flex items-center rounded-full border border-white/30 bg-black/70 backdrop-blur px-3 pr-4 py-2 text-white shadow-sm hover:bg-black/80 hover:border-white/50 focus:ring-2 focus:ring-white/40 focus:ring-offset-2 focus:ring-offset-black">
                    <span className="mr-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-red-600">
                      {isKracPlaying ? (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-white">
                          <rect x="6" y="5" width="4" height="14" rx="1" />
                          <rect x="14" y="5" width="4" height="14" rx="1" />
                        </svg>
                      ) : (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-white">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      )}
                    </span>
                    <span className="text-sm font-semibold">
                      {t.home?.listenCta || 'Écouter'}
                    </span>
                  </span>
                </button>
              </div>
            </div>

            {/* Bloc 2 — À suivre */}
            <div
              className="relative h-64 lg:h-80"
              style={{
                backgroundImage: `url(${nextSeg?.image || kracImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              <div className="absolute inset-0 bg-black/30" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              <div className="absolute left-5 right-5 bottom-5">
                <div className="text-[11px] uppercase tracking-widest font-semibold text-white/80 mb-2">
                  {t?.schedule?.upNext || 'À suivre'}
                </div>
                <div className="text-white text-2xl font-extrabold leading-tight drop-shadow">
                  {nextSeg?.title || '—'}
                </div>
                <div className="text-white/90 text-sm font-medium mt-1 mb-3">
                  {nextSeg ? fmtRange(nextSeg.start, nextSeg.end, lang) : '—'}
                </div>

                <div className="w-full flex justify-end">
                  <a
                    href="/schedule"
                    className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg font-semibold border border-red-700/60 bg-red-600 hover:bg-red-700 text-white text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500/70 focus:ring-offset-2 focus:ring-offset-black transition"
                  >
                    {t.home?.viewScheduleCta || 'Consulter notre horaire'}
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* pas d’espace sous le hero */}
        </div>
      </section>

      {/* Section Soumettre Musique à la Radio */}
      <section className="px-5 py-12">
        <div className="bg-gradient-to-br from-purple-600/10 via-purple-500/5 to-pink-500/10 dark:from-purple-600/20 dark:via-purple-500/10 dark:to-pink-500/20 rounded-2xl p-8 md:p-12 border border-purple-500/20">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mb-6 shadow-lg">
              <span className="text-4xl">🎵</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
              {t.home?.submitMusicTitle || 'Soumettez votre musique à la radio'}
            </h2>
            <p className="text-lg text-text-secondary mb-8 max-w-2xl mx-auto">
              {t.home?.submitMusicDesc || 'Vous êtes artiste? Partagez votre talent avec notre communauté. Envoyez vos créations et faites découvrir votre musique à des milliers d\'auditeurs!'}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/submit-music"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold text-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                🎵 {t.home?.submitMusicCta || 'Soumettre ma musique'}
              </Link>
              <Link
                to="/artists"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-purple-500/40 text-purple-600 dark:text-purple-400 rounded-xl font-bold text-lg hover:bg-purple-500/10 transition-colors"
              >
                {t.home?.discoverArtists || 'Découvrir les artistes'}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Carrousel */}
      <section className="w-full relative z-10 overflow-visible">
        <div className="px-5 md:px-5 px-0 pt-0">
          <h2 className="text-xl font-semibold text-black dark:text-white mb-3 pt-5 uppercase px-5 md:px-0">
            {t.home?.channelsHeading}
          </h2>
        </div>
        <div className="overflow-visible">
          <ChannelCarousel channels={channels} />
        </div>
      </section>

      {/* Section Articles & Podcasts - 2 Colonnes */}
      <section className="w-full relative z-10 overflow-visible pb-12 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 px-5">

          {/* Colonne 1: Derniers Articles (60% - 3/5) */}
          <div className="lg:col-span-3 bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-6 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg">
                  <IconImg name="paper" className="w-6 h-6 brightness-0 invert" />
                </div>
                <h2 className="text-2xl font-bold text-text-primary uppercase">{t.home?.latestArticles || 'Derniers articles'}</h2>
              </div>
            </div>

            {/* Grille 2x2 d'articles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
              {latestBlogs.slice(0, 4).map((article) => {
                const imageUrl = article.featured_image || article.cover_url;
                const authorName = article.author_name || 'Anonyme';
                const authorAvatar = article.author_avatar;
                const authorSlug = article.author_slug || article.author_name;
                const cleanAuthorName = authorName.replace(/[@_]/g, '');

                return (
                  <Link
                    key={article.id}
                    to={`/article/${article.slug}`}
                    className="group block bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all"
                  >
                    {imageUrl ? (
                      <div className="aspect-video w-full overflow-hidden bg-gray-100 dark:bg-gray-700">
                        <img
                          src={imageUrl}
                          alt={article.title}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div className="aspect-video w-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
                        <IconImg name="paper" className="w-12 h-12 opacity-30" />
                      </div>
                    )}
                    <div className="p-4">
                      {/* Auteur avec avatar */}
                      <div className="flex items-center gap-2 mb-2">
                        {authorAvatar ? (
                          <img
                            src={authorAvatar}
                            alt={authorName}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white text-xs font-bold">
                            {cleanAuthorName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <Link
                          to={`/profile/${authorSlug}`}
                          className="text-xs text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {authorName}
                        </Link>
                      </div>

                      <h3 className="text-base font-semibold text-black dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors line-clamp-2">
                        {article.title}
                      </h3>
                      {article.excerpt && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                          {article.excerpt}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Bouton Voir plus */}
            <Link
              to="/articles"
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl font-semibold hover:from-red-700 hover:to-orange-700 transition-all shadow-md hover:shadow-lg mt-6"
            >
              {t.home?.viewAll || 'Voir plus'}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* Colonne 2: Podcasts en vedette (40% - 2/5) */}
          <div className="lg:col-span-2 bg-gray-100 dark:bg-gray-800/50 rounded-2xl p-6 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
                  <IconImg name="mic" className="w-6 h-6 brightness-0 invert" />
                </div>
                <h2 className="text-2xl font-bold text-text-primary uppercase">{t.home?.featuredPodcasts || 'Podcasts en vedette'}</h2>
              </div>
            </div>

            {/* Liste verticale de podcasts */}
            <div className="space-y-4 flex-1">
              {latestPodcasts.slice(0, 3).map((podcast) => (
                <div
                  key={podcast.id}
                  className="group flex gap-4 bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all p-4"
                >
                  {podcast.image_url ? (
                    <img
                      src={podcast.image_url}
                      alt={podcast.title}
                      className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gradient-to-br from-green-200 to-emerald-300 dark:from-green-700 dark:to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <IconImg name="mic" className="w-8 h-8 opacity-50" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-black dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors line-clamp-2 mb-1">
                      {podcast.title}
                    </h3>
                    {podcast.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {podcast.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Bouton Voir plus */}
            <Link
              to="/podcasts"
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg mt-6"
            >
              {t.home?.viewAll || 'Voir plus'}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

        </div>
      </section>

      {/* Publicité Google Ads */}
      <div className="px-5 py-10">
        <GoogleAd slot="3411355648" className="mx-auto max-w-5xl" />
      </div>

      {/* Espacement en bas - 30px sur mobile au lieu de la cale pour le player */}
      <div className="pb-[30px] sm:pb-0" />
    </div>
  );
}
