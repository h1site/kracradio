// src/pages/Channel.jsx
import React, { useEffect, useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { channels } from '../data/channels';
import { useAudio } from '../context/AudioPlayerContext';
import Seo from '../seo/Seo';
import { radioStationJsonLd } from '../seo/jsonld';
import { useI18n } from '../i18n';
import { getNowPlaying, getRecentTracks } from '../utils/azura';

const RED = '#E50914';

// Hauteurs fixes supposées : header 64px (h-16) + player 64px (h-16).
// Si ton player a une autre hauteur, ajuste 128px ci-dessous.
const VIEW_HEIGHT_CLASS = 'h-[calc(100vh-128px)]';

export default function Channel() {
  const { key } = useParams();
  const channel = channels.find((c) => c.key === key);
  const { lang, t } = useI18n();
  const { current, playing, playStream, togglePlay } = useAudio();

  if (!channel) return <Navigate to="/" replace />;

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
    <main
      className={`
        container-max ${VIEW_HEIGHT_CLASS} overflow-hidden
        bg-white text-black dark:bg-[#1e1e1e] dark:text-white
        pt-4 pb-3 px-5
      `}
    >
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 h-full">
        {/* Colonne gauche : visuel plein cadre + bouton Tune In TOUJOURS visible */}
        <div className="lg:col-span-1 grid grid-rows-[1fr_auto] gap-3 h-full min-h-0">
          <div className="relative rounded-2xl overflow-hidden border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#151515]">
            <img
              src={channel.image || '/channels/default.webp'}
              alt={channel.name}
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />
          </div>

          <button
            type="button"
            onClick={onTuneClick}
            className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-xl font-semibold text-white hover:opacity-95 transition"
            style={{ backgroundColor: RED }}
          >
            {isPlayingThis ? (
              <>
                <svg viewBox="0 0 24 24" className="w-5 h-5"><path fill="currentColor" d="M8 5h3v14H8V5zm5 0h3v14h-3V5z"/></svg>
                Pause
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" className="w-5 h-5"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>
                {t?.site?.tuneIn || 'Écouter'}
              </>
            )}
          </button>
        </div>

        {/* Colonne droite : titre + retour, Now Playing (gras), Historique (UPPERCASE) */}
        <div className="lg:col-span-2 flex flex-col h-full min-h-0 overflow-hidden">
          {/* Titre station + bouton retour */}
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-2xl font-bold leading-tight uppercase">
              {channel.name}
            </h1>

            <Link
              to="/"
              className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-black/20 text-black hover:bg-black/5
                         dark:border-white/20 dark:text-white dark:hover:bg-white/10 transition"
              aria-label="Retour à l'accueil"
              title="Retour à l'accueil"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
                <path fill="currentColor" d="M20 11H7.83l5.59-5.59L12 4l-8 8l8 8l1.41-1.41L7.83 13H20v-2z"/>
              </svg>
            </Link>
          </div>

          {/* Zone info: Now Playing + Last Tracks — occupe la hauteur restante */}
          <div className="mt-3 flex-1 grid grid-rows-[auto,1fr] gap-4 min-h-0">
            {/* EN LECTURE — image à gauche, textes à droite */}
            <section className="rounded-2xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#151515] p-3">
              <div
                className="text-[11px] uppercase tracking-wide mb-2 font-bold"
                style={{ color: RED }}
              >
                {t?.site?.nowPlaying || 'En lecture'}
              </div>

              <div className="flex items-center gap-3">
                {/* pochette */}
                <img
                  src={now?.art || channel.image || '/channels/default.webp'}
                  alt=""
                  loading="lazy"
                  className="w-16 h-16 rounded object-cover border border-neutral-200 dark:border-white/10"
                />

                {/* titre + artiste */}
                <div className="min-w-0">
                  <div className="font-semibold text-sm truncate">
                    {now?.title || '—'}
                  </div>
                  <div className="text-xs text-neutral-700 dark:text-white truncate">
                    {now?.artist || '—'}
                  </div>
                </div>
              </div>
            </section>

            {/* HISTORIQUE — uppercased title, scroll interne garanti */}
            <section className="rounded-2xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#151515] p-3 flex flex-col min-h-0">
              <h2 className="text-sm font-semibold mb-2 uppercase text-black dark:text-white">
                {t?.site?.lastTracks || '10 dernières chansons'}
              </h2>

              <ul className="flex-1 overflow-auto divide-y divide-neutral-200 dark:divide-white/10 pr-1">
                {recent.length === 0 && (
                  <li className="py-2 text-sm text-black dark:text-white">—</li>
                )}

                {recent.map((trk, idx) => (
                  <li key={idx} className="py-2 flex items-center gap-3">
                    <img
                      src={trk?.art || channel.image || '/channels/default.webp'}
                      alt=""
                      loading="lazy"
                      className="w-9 h-9 rounded object-cover border border-neutral-200 dark:border-white/10"
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate text-black dark:text-white">
                        {trk?.title || '—'}
                      </div>
                      <div className="text-xs truncate text-neutral-700 dark:text-white">
                        {trk?.artist || ''}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
