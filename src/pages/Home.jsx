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

      {/* Section Soumettre Musique à la Radio */}
      <section className="py-16 bg-gray-900 text-white dark">
        <div className="max-w-4xl mx-auto text-center px-5">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
            {t.home?.submitMusicTitle || 'Soumettez votre musique'}
          </h2>
          <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
            {t.home?.submitMusicDesc || 'Vous êtes artiste? Partagez votre talent avec notre communauté. Envoyez vos créations et faites découvrir votre musique à des milliers d\'auditeurs!'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/submit-music"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-red-600 text-white rounded-full font-bold text-lg hover:bg-red-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              🎵 {t.home?.submitMusicCta || 'Soumettre ma musique'}
            </Link>
            <Link
              to="/artists"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-gray-600 text-white rounded-full font-bold text-lg hover:bg-gray-800 transition-colors"
            >
              {t.home?.discoverArtists || 'Découvrir les artistes'}
            </Link>
          </div>
        </div>
      </section>

      {/* Carrousel des chaînes */}
      <section className="w-full relative z-10 overflow-visible py-16 bg-gray-100 dark:bg-gray-900">
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


      {/* Section Articles & Podcasts - Magazine Style */}
      <section className="w-full relative z-10 overflow-visible py-16 px-[10px]">
        <div>
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">
              Dernières Nouvelles
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Les dernières nouvelles et podcasts de la scène musicale.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Featured Article */}
            {latestBlogs.length > 0 && (
              <div className="lg:col-span-2">
                <Link to={`/article/${latestBlogs[0].slug}`} className="group block">
                  <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                    <img
                      src={latestBlogs[0].featured_image || latestBlogs[0].cover_url}
                      alt={latestBlogs[0].title}
                      className="w-full h-96 object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                    <div className="absolute bottom-0 left-0 p-8">
                      {/* Author info */}
                      <div className="flex items-center gap-3 mb-4">
                        {latestBlogs[0].author_avatar && (
                          <img
                            src={latestBlogs[0].author_avatar}
                            alt={latestBlogs[0].author_name || 'Author'}
                            className="w-10 h-10 rounded-full object-cover border-2 border-white/20"
                          />
                        )}
                        <div className="text-sm">
                          <div className="font-semibold text-white">
                            {latestBlogs[0].author_name || 'Auteur'}
                          </div>
                        </div>
                      </div>

                      <h3 className="text-3xl font-black text-white leading-tight drop-shadow-lg">
                        {latestBlogs[0].title}
                      </h3>
                      <p className="text-gray-300 mt-2 line-clamp-2">
                        {latestBlogs[0].excerpt}
                      </p>
                    </div>
                  </div>
                </Link>
              </div>
            )}

            {/* Podcasts */}
            <div className="lg:col-span-1">
              <div className="bg-gray-100 dark:bg-gray-900 rounded-2xl p-6 h-full">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Podcasts en vedette</h3>
                <div className="space-y-4">
                  {latestPodcasts.slice(0, 3).map((podcast) => (
                    <Link key={podcast.id} to={`/podcast/${podcast.id}`} className="group flex items-center gap-4 p-3 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
                      <img
                        src={podcast.image_url}
                        alt={podcast.title}
                        className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                      />
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-red-500 line-clamp-2">
                          {podcast.title}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                          {podcast.description}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
                <Link to="/podcasts" className="mt-6 block text-center w-full px-4 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors">
                  Tous les podcasts
                </Link>
              </div>
            </div>
          </div>

          {/* Other articles */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
            {latestBlogs.slice(1, 4).map((article) => (
              <Link key={article.id} to={`/article/${article.slug}`} className="group block">
                <div className="relative rounded-xl overflow-hidden shadow-lg">
                  <img
                    src={article.featured_image || article.cover_url}
                    alt={article.title}
                    className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-0 left-0 p-4">
                    {/* Author info */}
                    {article.author_name && (
                      <div className="flex items-center gap-2 mb-3">
                        {article.author_avatar && (
                          <img
                            src={article.author_avatar}
                            alt={article.author_name}
                            className="w-8 h-8 rounded-full object-cover border-2 border-white/20"
                          />
                        )}
                        <div className="text-xs font-semibold text-white">
                          {article.author_name}
                        </div>
                      </div>
                    )}
                    <h4 className="font-bold text-white leading-tight drop-shadow-md">
                      {article.title}
                    </h4>
                  </div>
                </div>
              </Link>
            ))}
          </div>
           <div className="mt-12 text-center">
              <Link
              to="/articles"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gray-800 text-white rounded-full font-bold text-lg hover:bg-black transition-all"
              >
              {t.home?.viewAll || 'Voir tous les articles'}
              </Link>
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
