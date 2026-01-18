'use client';
import RedirectTo from '../components/RedirectTo';
// src/pages/Channel.jsx
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { redirect } from 'next/navigation';
import { channels } from '../data/channels';
import { useAudio } from '../context/AudioPlayerContext';
import Seo from '../seo/Seo';
import { radioStationJsonLd } from '../seo/jsonld';
import { useI18n } from '../i18n';
import { getNowPlaying, getRecentTracks } from '../utils/azura';
import { LeaderboardAd } from '../components/ads';
import { useUI } from '../context/UIContext';

const RED = '#E50914';

// Hauteurs fixes supposées : header 64px (h-16) + player 64px (h-16).
// Si ton player a une autre hauteur, ajuste 128px ci-dessous.
const VIEW_HEIGHT_CLASS = 'h-[calc(100vh-128px)]';

export default function Channel() {
  const { key } = useParams();
  const channel = channels.find((c) => c.key === key);
  const { lang, t } = useI18n();
  const { current, playing, playStream, togglePlay } = useAudio();
  const { isDesktop, sidebarOpen, sidebarWidth } = useUI();

  const containerStyle = {
    marginLeft: isDesktop && sidebarOpen ? sidebarWidth : 0,
    transition: 'margin-left 300ms ease',
  };

  if (!channel) return <RedirectTo href="/" replace />;

  const [now, setNow] = useState(null);
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    let timer;
    async function load() {
      try {
        const meta = await getNowPlaying(channel.apiUrl);
        setNow(meta || null);
        const last = await getRecentTracks(channel.apiUrl, 10);
        setRecent(Array.isArray(last) ? last : []);
      } catch {}
    }
    load();
    timer = setInterval(load, 30000);
    return () => clearInterval(timer);
  }, [channel.apiUrl]);

  const isCurrent = current?.key === channel.key;
  const isPlayingThis = isCurrent && playing;

  const onTuneClick = () => {
    if (isCurrent) togglePlay();
    else playStream(channel);
  };

  const title = channel.name;
  const description = `Écoute ${channel.name} en direct sur KracRadio.`;

  return (
    <main>
      <Seo
        lang={lang}
        title={title}
        description={description}
        path={`/channel/${key}`}
        image={channel.image}
        type="music.radioStation"
        alternates
        jsonLd={radioStationJsonLd(channel, lang)}
      />

      {/* Hero Section */}
      <div className="relative w-full h-[60vh] bg-cover bg-center text-white mb-8" style={{ backgroundImage: `url(${channel.image})` }}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="relative z-10 flex flex-col justify-end h-full">
          <div className="max-w-4xl p-8">
            <h1 className="text-5xl md:text-7xl font-black leading-tight drop-shadow-lg mb-4 uppercase">
              {channel.name}
            </h1>
            <button
              type="button"
              onClick={onTuneClick}
              className="group transition duration-200 focus:outline-none flex items-center justify-center gap-4 px-8 py-4 bg-red-600 text-white rounded-full font-bold text-lg hover:bg-red-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              {isPlayingThis ? (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="5" width="4" height="14" rx="1" />
                    <rect x="14" y="5" width="4" height="14" rx="1" />
                  </svg>
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  <span>{t?.site?.tuneIn || 'Écouter'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="py-8 px-6">
        {/* Now Playing Section */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold uppercase mb-4 text-gray-900 dark:text-white">
            {t?.site?.nowPlaying || 'En lecture'}
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 flex items-center gap-6">
            <img
              src={now?.art || channel.image || '/channels/default.webp'}
              alt=""
              loading="lazy"
              className="w-24 h-24 rounded-lg object-cover"
            />
            <div className="min-w-0">
              <div className="font-bold text-xl text-gray-900 dark:text-white truncate">
                {now?.title || '—'}
              </div>
              <div className="text-gray-600 dark:text-gray-400 text-lg truncate">
                {now?.artist || '—'}
              </div>
            </div>
          </div>
        </section>

        {/* Recent Tracks Section */}
        <section>
          <h2 className="text-2xl font-bold uppercase mb-4 text-gray-900 dark:text-white">
            {t?.site?.lastTracks || '10 dernières chansons'}
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {recent.length === 0 && (
                <li className="py-3 text-gray-500 dark:text-gray-400">—</li>
              )}
              {recent.map((trk, idx) => (
                <li key={idx} className="py-3 flex items-center gap-4">
                  <img
                    src={trk?.art || channel.image || '/channels/default.webp'}
                    alt=""
                    loading="lazy"
                    className="w-12 h-12 rounded-md object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-base font-bold text-gray-900 dark:text-white truncate">
                      {trk?.title || '—'}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {trk?.artist || ''}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* AD - Leaderboard après les sections */}
        <div className="mt-8">
          <LeaderboardAd />
        </div>
      </div>
    </main>
  );
}
