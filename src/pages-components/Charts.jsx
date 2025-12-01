'use client';
// src/pages/Charts.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useI18n } from '../i18n';
import { getChannelCharts, getGlobalCharts, getVideoCharts } from '../lib/supabase';
import { channels } from '../data/channels';
import Seo from '../seo/Seo';
import { breadcrumbSchema } from '../seo/schemas';
import { useUI } from '../context/UIContext';

const STRINGS = {
  fr: {
    metaTitle: 'Charts — KracRadio',
    metaDesc: 'Découvrez les chansons les plus aimées sur KracRadio',
    heroBadge: 'Palmarès',
    heroTitle: 'Charts',
    heroSubtitle: 'Les chansons les plus aimées par notre communauté',
    week: 'Semaine',
    month: 'Mois',
    year: 'Année',
    noData: 'Aucune chanson aimée pour cette période',
    loading: 'Chargement...',
    likes: 'likes',
    globalTitle: 'KracRadio',
    globalSubtitle: 'Cumul de toutes les chaînes',
    videoCharts: 'Vidéos',
    videoChartsSubtitle: 'Les vidéos les plus aimées',
    views: 'vues',
  },
  en: {
    metaTitle: 'Charts — KracRadio',
    metaDesc: 'Discover the most liked songs on KracRadio',
    heroBadge: 'Charts',
    heroTitle: 'Charts',
    heroSubtitle: 'The most loved songs by our community',
    week: 'Week',
    month: 'Month',
    year: 'Year',
    noData: 'No liked songs for this period',
    loading: 'Loading...',
    likes: 'likes',
    globalTitle: 'KracRadio',
    globalSubtitle: 'All channels combined',
    videoCharts: 'Videos',
    videoChartsSubtitle: 'Most liked videos',
    views: 'views',
  },
  es: {
    metaTitle: 'Charts — KracRadio',
    metaDesc: 'Descubre las canciones más gustadas en KracRadio',
    heroBadge: 'Ranking',
    heroTitle: 'Charts',
    heroSubtitle: 'Las canciones más amadas por nuestra comunidad',
    week: 'Semana',
    month: 'Mes',
    year: 'Año',
    noData: 'No hay canciones gustadas para este período',
    loading: 'Cargando...',
    likes: 'me gusta',
    globalTitle: 'KracRadio',
    globalSubtitle: 'Todas las cadenas combinadas',
    videoCharts: 'Videos',
    videoChartsSubtitle: 'Videos más gustados',
    views: 'vistas',
  },
};

// Period selector component
function PeriodSelector({ period, setPeriod, L }) {
  return (
    <div className="flex gap-2">
      {['week', 'month', 'year'].map((p) => (
        <button
          key={p}
          onClick={() => setPeriod(p)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
            period === p
              ? 'bg-red-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          {L[p]}
        </button>
      ))}
    </div>
  );
}

// Song item component
function SongItem({ song, index }) {
  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      {/* Rank */}
      <div className="w-6 flex-shrink-0 text-center font-bold text-sm text-gray-900 dark:text-white">
        {index + 1}
      </div>

      {/* Album Art */}
      <div className="w-10 h-10 rounded overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
        {song.albumArt ? (
          <img
            src={song.albumArt}
            alt={song.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-lg">
            🎵
          </div>
        )}
      </div>

      {/* Song Info */}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm truncate text-gray-900 dark:text-white" title={song.title}>
          {song.title}
        </h4>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate" title={song.artist}>
          {song.artist}
        </p>
      </div>

      {/* Like Count */}
      <div className="flex items-center gap-1 text-red-500">
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
        <span className="text-xs font-semibold">{song.likeCount}</span>
      </div>
    </div>
  );
}

// Video item component
function VideoItem({ video, index }) {
  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      {/* Rank */}
      <div className="w-6 flex-shrink-0 text-center font-bold text-sm text-gray-900 dark:text-white">
        {index + 1}
      </div>

      {/* Thumbnail */}
      <div className="w-16 h-10 rounded overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
        {video.thumbnail_url ? (
          <img
            src={video.thumbnail_url}
            alt={video.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-lg">
            🎬
          </div>
        )}
      </div>

      {/* Video Info */}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm truncate text-gray-900 dark:text-white" title={video.title}>
          {video.title}
        </h4>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate" title={video.artist_name}>
          {video.artist_name || 'KracRadio'}
        </p>
      </div>

      {/* Like Count */}
      <div className="flex items-center gap-1 text-red-500">
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
        <span className="text-xs font-semibold">{video.likeCount}</span>
      </div>
    </div>
  );
}

// Video charts section component
function VideoChartSection({ L }) {
  const [period, setPeriod] = useState('week');
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadCharts = async () => {
      try {
        setLoading(true);
        const data = await getVideoCharts(period);
        setChartData(data);
        setError(null);
      } catch (err) {
        console.error('Error loading video charts:', err);
        if (err.message?.includes('relation') || err.message?.includes('does not exist')) {
          setError('Video charts not available');
        } else {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    loadCharts();
  }, [period]);

  return (
    <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="relative h-32 overflow-hidden bg-gradient-to-r from-purple-600 to-pink-600">
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2">
                <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="currentColor">
                  <polygon points="23 7 16 12 23 17 23 7"></polygon>
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="2"></rect>
                </svg>
                <h2 className="font-bold text-xl text-white">{L.videoCharts}</h2>
              </div>
              <p className="text-xs text-gray-200">{L.videoChartsSubtitle}</p>
            </div>
            <PeriodSelector period={period} setPeriod={setPeriod} L={L} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-purple-600 border-r-transparent"></div>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500 text-sm">{error}</div>
        ) : chartData.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
            {L.noData}
          </div>
        ) : (
          <div className="space-y-1">
            {chartData.slice(0, 10).map((video, index) => (
              <VideoItem key={video.id || index} video={video} index={index} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// Chart section component for each channel
function ChartSection({ channelKey, channelName, channelImage, isGlobal, L }) {
  const [period, setPeriod] = useState('week');
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadCharts = async () => {
      try {
        setLoading(true);
        const data = isGlobal
          ? await getGlobalCharts(period)
          : await getChannelCharts(channelKey, period);
        setChartData(data);
        setError(null);
      } catch (err) {
        console.error(`Error loading charts for ${channelKey}:`, err);
        if (err.message?.includes('relation') || err.message?.includes('does not exist')) {
          setError('Charts not available');
        } else {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    loadCharts();
  }, [channelKey, period, isGlobal]);

  return (
    <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      {/* Header with channel image */}
      <div className="relative h-32 overflow-hidden">
        <img
          src={channelImage}
          alt={channelName}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="font-bold text-xl text-white">{channelName}</h2>
              {isGlobal && (
                <p className="text-xs text-gray-300">{L.globalSubtitle}</p>
              )}
            </div>
            <PeriodSelector period={period} setPeriod={setPeriod} L={L} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-red-600 border-r-transparent"></div>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500 text-sm">{error}</div>
        ) : chartData.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
            {L.noData}
          </div>
        ) : (
          <div className="space-y-1">
            {chartData.slice(0, 10).map((song, index) => (
              <SongItem key={`${song.title}-${song.artist}-${index}`} song={song} index={index} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default function Charts() {
  const { lang } = useI18n();
  const L = useMemo(() => STRINGS[lang] || STRINGS.fr, [lang]);
  const { isDesktop, sidebarOpen, sidebarWidth } = useUI();

  // Filter out kracradio from channels list (it's shown as global)
  const otherChannels = channels.filter(ch => ch.key !== 'kracradio');

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

      <div className="min-h-screen bg-gray-50 dark:bg-black">
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
          {/* KracRadio Global - Full width */}
          <div className="mb-8">
            <ChartSection
              channelKey="kracradio"
              channelName={L.globalTitle}
              channelImage="/channels/kracradio.webp"
              isGlobal={true}
              L={L}
            />
          </div>

          {/* Other channels - Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {otherChannels.map((channel) => (
              <ChartSection
                key={channel.key}
                channelKey={channel.key}
                channelName={channel.name}
                channelImage={channel.image}
                isGlobal={false}
                L={L}
              />
            ))}
          </div>

          {/* Video Charts - Full width */}
          <div className="mt-8">
            <VideoChartSection L={L} />
          </div>
        </main>
      </div>
    </>
  );
}
