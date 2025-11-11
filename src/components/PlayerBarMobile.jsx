// src/components/PlayerBarMobile.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAudio } from '../context/AudioPlayerContext';
import { useI18n } from '../i18n';
import { getNowPlaying } from '../utils/azura';
import { mmss } from '../utils/time';

const RED = '#E50914';

export default function PlayerBarMobile() {
  const { current, playing, togglePlay } = useAudio();
  const { t } = useI18n();
  const player = t?.player ?? {};
  const site = t?.site ?? {};
  const playLabel = player.play ?? 'Lire';
  const pauseLabel = player.pause ?? site.pause ?? 'Pause';
  const liveLabel = player.live ?? 'LIVE';

  const [meta, setMeta] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(null);
  const tickRef = useRef(null);

  // 1) Poll AzuraCast toutes les 15s (titre / artiste / pochette + elapsed/duration si dispo)
  useEffect(() => {
    let poll;
    async function load() {
      if (!current?.apiUrl) {
        setMeta(null);
        setElapsed(0);
        setDuration(null);
        return;
      }
      try {
        const np = await getNowPlaying(current.apiUrl);
        setMeta(np || null);

        // Récupérer elapsed/duration depuis l’API brute si présents
        const res = await fetch(current.apiUrl, { cache: 'no-store' });
        const json = await res.json();
        const now = json.now_playing || json.nowPlaying || {};
        const e = typeof now.elapsed === 'number' ? now.elapsed
                : (typeof now.position === 'number' ? now.position : null);
        const d = typeof now.duration === 'number' ? now.duration : null;
        setElapsed(e ?? 0);
        setDuration(d && d > 0 ? d : null);
      } catch {
        // En cas d’erreur, on ne casse rien
      }
    }
    load();
    if (current?.apiUrl) poll = setInterval(load, 15000);
    return () => clearInterval(poll);
  }, [current?.apiUrl]);

  // 2) Tick local pour faire avancer elapsed quand on joue
  useEffect(() => {
    clearInterval(tickRef.current);
    if (!playing) return;
    tickRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(tickRef.current);
  }, [playing]);

  // 3) Progress %
  const progressPct = useMemo(() => {
    if (!duration || duration <= 0) return null; // live
    const p = Math.max(0, Math.min(1, elapsed / duration));
    return Math.round(p * 100);
  }, [elapsed, duration]);

  // 4) Données à afficher (avec fallback)
  const art =
    meta?.art ||
    current?.now?.art ||
    current?.art ||
    current?.image ||
    '/channels/default.webp';

  const title = meta?.title || current?.now?.title || current?.title || '—';
  const artist = meta?.artist || current?.now?.artist || current?.artist || current?.name || '—';

  return (
    // ⚠️ Ce composant est pensé pour être inclus dans un conteneur fixe (PlayerBar) — pas de position fixed ici.
    <div className="md:hidden h-16 px-3 flex items-center gap-3">
      {/* Jaquette */}
      <img
        src={art}
        alt=""
        loading="lazy"
        className="w-12 h-12 rounded border border-white/10 object-cover shrink-0"
      />

      {/* Play/Pause */}
      <button
        type="button"
        onClick={togglePlay}
        className="w-10 h-10 rounded-full inline-flex items-center justify-center shrink-0"
        style={{ backgroundColor: RED }}
        aria-label={playing ? pauseLabel : playLabel}
        title={playing ? pauseLabel : playLabel}
      >
        {playing ? (
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
            <path d="M8 5h3v14H8zM13 5h3v14h-3z"/>
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
          </svg>
        )}
      </button>

      {/* Infos */}
      <div className="min-w-0 flex-1">
        <div className="text-white text-sm font-semibold truncate" title={title}>
          {title}
        </div>
        <div className="text-white/70 text-xs truncate" title={artist}>
          {artist}
        </div>

        {/* Ligne temps / live (compacte) */}
        <div className="mt-0.5 flex items-center gap-2">
          {duration ? (
            <>
              <span className="text-[10px] text-white/60 tabular-nums">{mmss(elapsed)}</span>
              <div className="flex-1 h-1 bg-white/15 rounded overflow-hidden">
                <div
                  className="h-full bg-white/70"
                  style={{ width: `${progressPct || 0}%` }}
                />
              </div>
              <span className="text-[10px] text-white/60 tabular-nums">{mmss(duration)}</span>
            </>
          ) : (
            <span className="text-[10px] font-semibold text-red-400">{liveLabel}</span>
          )}
        </div>
      </div>
    </div>
  );
}
