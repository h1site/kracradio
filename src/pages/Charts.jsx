// src/pages/Charts.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useI18n } from '../i18n';
import { getChannelCharts } from '../lib/supabase';
import { channels } from '../data/channels';
import Seo from '../seo/Seo';
import { musicPlaylistSchema, breadcrumbSchema } from '../seo/schemas';
import { useUI } from '../context/UIContext';

const STRINGS = {
  fr: {
    metaTitle: 'Charts — KracRadio',
    metaDesc: 'Découvrez les chansons les plus aimées sur KracRadio',
    heroBadge: 'Palmarès',
    heroTitle: 'Charts',
    heroSubtitle: 'Les chansons les plus aimées par notre communauté',
    selectChannel: 'Sélectionnez une chaîne pour voir son palmarès',
    week: 'Semaine',
    month: 'Mois',
    year: 'Année',
    noData: 'Aucune chanson aimée pour cette période',
    loading: 'Chargement...',
    likes: 'likes',
    backToCharts: '← Retour aux charts',
  },
  en: {
    metaTitle: 'Charts — KracRadio',
    metaDesc: 'Discover the most liked songs on KracRadio',
    heroBadge: 'Charts',
    heroTitle: 'Charts',
    heroSubtitle: 'The most loved songs by our community',
    selectChannel: 'Select a channel to see its chart',
    week: 'Week',
    month: 'Month',
    year: 'Year',
    noData: 'No liked songs for this period',
    loading: 'Loading...',
    likes: 'likes',
    backToCharts: '← Back to charts',
  },
  es: {
    metaTitle: 'Charts — KracRadio',
    metaDesc: 'Descubre las canciones más gustadas en KracRadio',
    heroBadge: 'Ranking',
    heroTitle: 'Charts',
    heroSubtitle: 'Las canciones más amadas por nuestra comunidad',
    selectChannel: 'Selecciona un canal para ver su ranking',
    week: 'Semana',
    month: 'Mes',
    year: 'Año',
    noData: 'No hay canciones gustadas para este período',
    loading: 'Cargando...',
    likes: 'me gusta',
    backToCharts: '← Volver a charts',
  },
};

export default function Charts() {
  const { lang } = useI18n();
  const L = useMemo(() => STRINGS[lang] || STRINGS.fr, [lang]);
  const { channelKey } = useParams();
  const { isDesktop, sidebarOpen, sidebarWidth } = useUI();
  const [period, setPeriod] = useState('week');
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const currentChannel = channels.find(ch => ch.key === channelKey);

  useEffect(() => {
    if (!channelKey) {
      setLoading(false);
      return;
    }

    const loadCharts = async () => {
      try {
        setLoading(true);
        const data = await getChannelCharts(channelKey, period);
        setChartData(data);
        setError(null);
      } catch (err) {
        console.error('Error loading charts:', err);
        if (err.message?.includes('relation') || err.message?.includes('does not exist')) {
          setError('La fonctionnalité de charts n\'est pas encore activée.');
        } else {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    loadCharts();
  }, [channelKey, period]);

  // Channel selection page
  if (!channelKey) {
    return (
      <>
        <Seo
          lang={lang}
          title={L.metaTitle}
          description={L.metaDesc}
          path="/charts"
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
                src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&h=400&fit=crop&auto=format&q=80"
                alt="Charts"
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
              </div>
            </div>
          </header>

          <main className="px-[20px] py-12">
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">{L.selectChannel}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {channels.map((channel) => (
                <Link
                  key={channel.key}
                  to={`/charts/${channel.key}`}
                  className="group relative rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className="aspect-[4/3] relative">
                    <img
                      src={channel.image}
                      alt={channel.name}
                      className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <h2 className="font-bold text-xl text-white group-hover:text-red-400 transition-colors">
                        {channel.name}
                      </h2>
                      {channel.tagline && (
                        <p className="text-sm text-gray-300 mt-1">{channel.tagline}</p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </main>
        </div>
      </>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-red-600 border-r-transparent"></div>
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">{L.loading}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <p className="text-lg text-red-500">{error}</p>
          <Link to="/charts" className="mt-4 inline-block text-red-600 hover:underline">
            {L.backToCharts}
          </Link>
        </div>
      </div>
    );
  }

  // Chart detail page
  return (
    <>
      <Seo
        lang={lang}
        title={`${L.heroTitle} - ${currentChannel?.name} — KracRadio`}
        description={`${L.heroSubtitle} - ${currentChannel?.name}`}
        path={`/charts/${channelKey}`}
        jsonLd={[
          musicPlaylistSchema(
            `${L.heroTitle} - ${currentChannel?.name}`,
            `${L.heroSubtitle} - ${currentChannel?.name}`,
            chartData,
            channelKey
          ),
          breadcrumbSchema([
            { name: 'Accueil', url: '/' },
            { name: L.heroTitle, url: '/charts' },
            { name: currentChannel?.name }
          ])
        ]}
      />

      <div className="min-h-screen bg-white dark:bg-black">
        {/* Full-screen header with channel image */}
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
              src={currentChannel?.image || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&h=400&fit=crop&auto=format&q=80'}
              alt={currentChannel?.name}
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
              <Link
                to="/charts"
                className="inline-flex items-center text-white/80 hover:text-white transition-colors mb-4"
              >
                {L.backToCharts}
              </Link>
              <span className="ml-4 inline-flex items-center rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-red-300">
                {L.heroBadge}
              </span>
              <h1 className="mt-4 text-4xl md:text-6xl font-black uppercase text-white">
                {currentChannel?.name}
              </h1>
              <p className="mt-4 max-w-3xl text-lg text-gray-200">
                {L.heroSubtitle}
              </p>

              {/* Period Selector */}
              <div className="mt-6 flex gap-2">
                {['week', 'month', 'year'].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-5 py-2.5 rounded-full font-semibold transition-all ${
                      period === p
                        ? 'bg-red-600 text-white shadow-lg'
                        : 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm'
                    }`}
                  >
                    {L[p]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </header>

        <main className="px-[20px] py-12 max-w-4xl">
          {chartData.length === 0 ? (
            <div className="flex items-center justify-center min-h-[300px]">
              <div className="text-center">
                <div className="text-6xl mb-4">📊</div>
                <p className="text-xl text-gray-600 dark:text-gray-400">{L.noData}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {chartData.map((song, index) => (
                <div
                  key={`${song.title}-${song.artist}-${index}`}
                  className="group bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 flex items-center gap-4 hover:shadow-lg hover:border-red-500/30 transition-all"
                >
                  {/* Rank */}
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0 ${
                    index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-black shadow-lg shadow-yellow-500/30' :
                    index === 1 ? 'bg-gradient-to-br from-gray-200 to-gray-400 text-gray-800 shadow-lg shadow-gray-400/30' :
                    index === 2 ? 'bg-gradient-to-br from-amber-500 to-amber-700 text-white shadow-lg shadow-amber-500/30' :
                    'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                  </div>

                  {/* Album Art */}
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                    {song.albumArt ? (
                      <img
                        src={song.albumArt}
                        alt={song.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">
                        🎵
                      </div>
                    )}
                  </div>

                  {/* Song Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg truncate text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors" title={song.title}>
                      {song.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate" title={song.artist}>
                      {song.artist}
                    </p>
                  </div>

                  {/* Like Count */}
                  <div className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-950/30 rounded-full">
                    <svg
                      viewBox="0 0 24 24"
                      className="w-5 h-5 text-red-500"
                      fill="currentColor"
                    >
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                    <span className="font-bold text-red-600 dark:text-red-400">{song.likeCount}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
