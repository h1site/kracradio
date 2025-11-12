// src/pages/Charts.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useI18n } from '../i18n';
import { getChannelCharts } from '../lib/supabase';
import { channels } from '../data/channels';

export default function Charts() {
  const { t } = useI18n();
  const { channelKey } = useParams();
  const [period, setPeriod] = useState('week');
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const site = t?.site ?? {};
  const pageTitle = 'Charts';
  const weekLabel = 'Semaine';
  const monthLabel = 'Mois';
  const yearLabel = 'Année';
  const noDataMessage = 'Aucune chanson aimée pour cette période';
  const selectChannelMessage = 'Sélectionnez un canal';

  // Find the current channel
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
        // Check if it's a table not found error
        if (err.message?.includes('relation') || err.message?.includes('does not exist')) {
          setError('La fonctionnalité de charts n\'est pas encore activée. Veuillez contacter l\'administrateur.');
        } else {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    loadCharts();
  }, [channelKey, period]);

  // If no channel is selected, show channel selector
  if (!channelKey) {
    return (
      <div className="container-max px-5 pb-16">
        <header className="pt-16 pb-12">
          <h1 className="text-4xl md:text-5xl font-black mb-4">{pageTitle}</h1>
          <p className="text-lg opacity-80">{selectChannelMessage}</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {channels.map((channel) => (
            <Link
              key={channel.key}
              to={`/charts/${channel.key}`}
              className="block bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden"
            >
              <div className="aspect-video relative">
                <img
                  src={channel.image}
                  alt={channel.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4">
                <h2 className="font-bold text-lg">{channel.name}</h2>
                <p className="text-sm opacity-70">{channel.tagline}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container-max px-5 py-16">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg opacity-70">Chargement...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-max px-5 py-16">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg text-red-500">Erreur: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-max px-5 pb-16">
      <header className="pt-16 pb-8">
        <div className="flex items-center gap-2 mb-4">
          <Link to="/charts" className="text-sm opacity-70 hover:opacity-100">
            {pageTitle}
          </Link>
          <span className="opacity-50">/</span>
          <span className="text-sm font-semibold">{currentChannel?.name}</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-black mb-4">
          {pageTitle} - {currentChannel?.name}
        </h1>

        {/* Period Selector */}
        <div className="flex gap-2">
          <button
            onClick={() => setPeriod('week')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              period === 'week'
                ? 'bg-red-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {weekLabel}
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              period === 'month'
                ? 'bg-red-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {monthLabel}
          </button>
          <button
            onClick={() => setPeriod('year')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              period === 'year'
                ? 'bg-red-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {yearLabel}
          </button>
        </div>
      </header>

      {chartData.length === 0 ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-center">
            <div className="text-6xl mb-4">📊</div>
            <p className="text-xl opacity-70">{noDataMessage}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {chartData.map((song, index) => (
            <div
              key={`${song.title}-${song.artist}-${index}`}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 flex items-center gap-4 hover:shadow-lg transition-shadow"
            >
              {/* Rank */}
              <div className="w-12 h-12 rounded-full bg-red-500 text-white flex items-center justify-center font-bold text-xl flex-shrink-0">
                {index + 1}
              </div>

              {/* Album Art */}
              <div className="w-16 h-16 rounded overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
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
                <h3 className="font-semibold text-lg truncate" title={song.title}>
                  {song.title}
                </h3>
                <p className="text-sm opacity-70 truncate" title={song.artist}>
                  {song.artist}
                </p>
              </div>

              {/* Like Count */}
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <svg
                  viewBox="0 0 24 24"
                  className="w-5 h-5 text-red-500"
                  fill="currentColor"
                >
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
                <span className="font-bold">{song.likeCount}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
