'use client';
// src/components/ChannelCard.jsx
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAudio } from '../context/AudioPlayerContext';
import { getNowPlaying } from '../utils/azura';
import { useI18n } from '../i18n';
import AutoMarquee from './AutoMarquee';

const RED = '#E50914';

// 50% bas totalement noir, puis dégradé plus riche jusqu'en haut
const HOVER_GRADIENT =
  'linear-gradient(to top,' +
  'rgba(0,0,0,1.00) 0%,' +
  'rgba(0,0,0,1.00) 50%,' +
  'rgba(0,0,0,0.88) 58%,' +
  'rgba(0,0,0,0.72) 66%,' +
  'rgba(0,0,0,0.56) 74%,' +
  'rgba(0,0,0,0.38) 82%,' +
  'rgba(0,0,0,0.22) 90%,' +
  'rgba(0,0,0,0.08) 96%,' +
  'rgba(0,0,0,0.00) 100%' +
  ')';

export default function ChannelCard({ channel }) {
  const { current, playing, playStream, togglePlay } = useAudio();
  const { t } = useI18n();

  // ✅ Gardes de sécurité pour éviter toute lecture de props undefined
  const hasChannel = !!(channel && (channel.key || channel.streamUrl || channel.apiUrl));
  const key = channel?.key ?? '';
  const name = channel?.name ?? '—';
  const image = channel?.image ?? '/channels/default.webp';
  const apiUrl = channel?.apiUrl ?? null;

  const isCurrent = current?.key === key;
  const isPlayingThis = isCurrent && playing;

  const [meta, setMeta] = useState(null);

  useEffect(() => {
    let timer;
    async function load() {
      if (!apiUrl) {
        setMeta(null);
        return;
      }
      try {
        const np = await getNowPlaying(apiUrl);
        setMeta(np || null);
      } catch {
        // silencieux
      }
    }
    load();
    if (apiUrl) timer = setInterval(load, 30000);
    return () => clearInterval(timer);
  }, [apiUrl]);

  const onTuneClick = () => {
    if (!hasChannel) return;          // rien à faire si data incomplète
    if (isCurrent) togglePlay();
    else playStream(channel);         // garde le même look & logique
  };

  const CHANNEL_BADGE = (t?.site?.channelLabel || 'Channel').toUpperCase();

  return (
    <div
      className="group relative rounded-2xl overflow-hidden border border-neutral-800/60 bg-black shadow-xl"
      style={{ color: '#fff' }}
    >
      {/* Image (visible au repos) */}
      <div className="aspect-[4/5] overflow-hidden">
        <img
          src={image}
          alt={name}
          loading="lazy"
          draggable={false}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />
      </div>

      {/* Dégradé plein écran — n'intercepte jamais les clics */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
        style={{ backgroundImage: HOVER_GRADIENT }}
      />

      {/* OVERLAY CONTENU — maintenant : invisible → visible (au lieu de pointer-events) */}
      <div
        className="
          absolute inset-0 flex flex-col justify-between
          invisible opacity-0 group-hover:visible group-hover:opacity-100
          transition-opacity duration-200
        "
      >
        {/* TOP: badge */}
        <div className="p-3">
          <span
            className="inline-block px-2 py-1 text-[10px] font-semibold rounded"
            style={{ backgroundColor: RED, color: '#fff' }}
          >
            {CHANNEL_BADGE}
          </span>
        </div>

        {/* BOTTOM: titre + now playing + actions + more info */}
        <div className="relative p-4">
          {/* Titre */}
          <h3 className="text-2xl font-bold text-white drop-shadow-sm">
            {name}
          </h3>

          {/* Now Playing (défilement auto si trop long) */}
          <div className="mt-2">
            <div className="text-[11px] uppercase tracking-wide leading-none" style={{ color: RED }}>
              {t?.site?.nowPlaying || 'Now Playing'}
            </div>
            <AutoMarquee className="mt-1 text-sm text-white/90">
              {meta?.title && meta?.artist ? `${meta.title} — ${meta.artist}` : '…'}
            </AutoMarquee>
          </div>

          {/* Actions */}
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={onTuneClick}
              className="inline-flex items-center gap-2 pl-2 pr-3 h-10 rounded-full text-white font-medium border border-white/20 hover:bg-white/10"
              aria-label={isPlayingThis ? 'Pause' : (t?.site?.tuneIn || 'Tune In')}
              title={isPlayingThis ? 'Pause' : (t?.site?.tuneIn || 'Tune In')}
            >
              <span
                className="inline-flex items-center justify-center w-8 h-8 rounded-full"
                style={{ backgroundColor: RED }}
              >
                {isPlayingThis ? (
                  <svg viewBox="0 0 24 24" className="w-5 h-5"><path fill="currentColor" d="M8 5h3v14H8V5zm5 0h3v14h-3V5z"/></svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="w-5 h-5"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>
                )}
              </span>
              <span>{isPlayingThis ? 'Pause' : (t?.site?.tuneIn || 'Tune In')}</span>
            </button>

            <button
              type="button"
              className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-white/25 hover:bg-white/10"
              title="J’aime (à venir)"
              aria-label="J’aime (à venir)"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5">
                <path
                  fill="currentColor"
                  d="M12.1 21.35l-1.1-1.01C5.14 15.28 2 12.36 2 8.99 2 6.42 4.42 4 6.99 4c1.74 0 3.41.81 4.51 2.09C12.59 4.81 14.26 4 16 4 18.58 4 21 6.42 21 8.99c0 3.37-3.14 6.29-8.99 11.35l-1.91 1.01z"
                />
              </svg>
            </button>
          </div>

          {/* More info ▾ */}
          <div className="mt-4 border-t border-white/10 pt-2">
            <Link
              href={key ? `/channel/${key}` : '#'}
              className="inline-flex items-center gap-1 text-white/90 hover:text-white text-sm"
              // si la clé est vide, on ne rend pas le lien cliquable
              onClick={(e) => { if (!key) e.preventDefault(); }}
            >
              <span>{t?.site?.moreInfo || 'More info'}</span>
              <svg viewBox="0 0 24 24" className="w-4 h-4"><path fill="currentColor" d="M7 10l5 5l5-5H7z"/></svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
