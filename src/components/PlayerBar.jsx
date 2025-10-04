// src/components/PlayerBar.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAudio } from '../context/AudioPlayerContext';
import { getNowPlaying } from '../utils/azura';
import { mmss } from '../utils/time';
import PlayerBarMobile from './PlayerBarMobile';

export default function PlayerBar() {
  const { current, currentType, podcastMeta, playing, togglePlay, setVolume, volume, audio, seek } = useAudio();
  const [meta, setMeta] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(null);
  const tickRef = useRef(null);

  // Poll AzuraCast toutes les 15s (seulement pour radio)
  useEffect(() => {
    if (currentType !== 'radio') {
      setMeta(null);
      return;
    }

    let poll;
    async function load() {
      if (!current?.apiUrl) return;
      try {
        const np = await getNowPlaying(current.apiUrl);
        setMeta(np);

        // Essayer d'obtenir elapsed/duration si dispo
        const res = await fetch(current.apiUrl, { cache: 'no-store' });
        const json = await res.json();
        const now = json.now_playing || json.nowPlaying || {};
        const e = typeof now.elapsed === 'number' ? now.elapsed
                : (typeof now.position === 'number' ? now.position : null);
        const d = typeof now.duration === 'number' ? now.duration : null;
        setElapsed(e ?? 0);
        setDuration(d && d > 0 ? d : null);
      } catch {}
    }
    load();
    if (current?.apiUrl) poll = setInterval(load, 15000);
    return () => clearInterval(poll);
  }, [current, currentType]);

  // Pour les podcasts, utiliser les métadonnées fournies
  useEffect(() => {
    if (currentType === 'podcast' && podcastMeta) {
      setElapsed(0);
      setDuration(podcastMeta.duration || null);
    }
  }, [currentType, podcastMeta]);

  // Synchroniser elapsed avec audio.currentTime pour les podcasts
  useEffect(() => {
    if (currentType !== 'podcast' || !audio) return;

    const updateTime = () => {
      setElapsed(audio.currentTime || 0);
      setDuration(audio.duration || null);
    };

    // Mettre à jour immédiatement
    updateTime();

    // Écouter les événements timeupdate et loadedmetadata
    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateTime);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateTime);
    };
  }, [currentType, audio, podcastMeta]);

  // Tick local pour animer la progression (radio seulement)
  useEffect(() => {
    clearInterval(tickRef.current);
    if (!playing || currentType === 'podcast') return; // Ne pas utiliser tick pour podcast
    tickRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(tickRef.current);
  }, [playing, currentType]);

  const progressPct = useMemo(() => {
    if (!duration || duration <= 0) return null; // live
    const p = Math.max(0, Math.min(1, elapsed / duration));
    return Math.round(p * 100);
  }, [elapsed, duration]);

  // Fonction pour gérer le clic sur la barre de progression
  const handleProgressClick = (e) => {
    // Seulement pour les podcasts avec durée connue
    if (currentType !== 'podcast' || !duration || !seek) return;

    const bar = e.currentTarget;
    const rect = bar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickRatio = clickX / rect.width;
    const targetTime = clickRatio * duration;

    seek(targetTime);
  };

  // Prépare les infos selon le type (radio ou podcast)
  const isPodcast = currentType === 'podcast';
  const mobileArt = isPodcast
    ? (podcastMeta?.image || podcastMeta?.podcastImage || '/channels/default.webp')
    : (meta?.art || current?.image || '/channels/default.webp');
  const mobileTitle = isPodcast
    ? (podcastMeta?.title || '—')
    : (meta?.title || '—');
  const mobileArtist = isPodcast
    ? (podcastMeta?.podcastTitle || '—')
    : (meta?.artist || current?.name || '—');

  // État neutre si aucune chaîne ni podcast
  if (!current && !isPodcast) {
    return (
      <div className="fixed inset-x-0 bottom-0 z-50 bg-[#1e1e1e] text-white">
        {/* MOBILE */}
        <div className="md:hidden">
          <PlayerBarMobile art="/channels/default.webp" title="—" artist="—" />
        </div>

        {/* DESKTOP (inchangé, masqué sur mobile) */}
        <div className="hidden md:flex w-full h-16 items-center">
          <div className="h-full aspect-square bg-black/30" />
          <div className="flex-1 font-semibold truncate px-3">
            Sélectionne une chaîne — <span className="opacity-70">Clique Écouter</span>
          </div>
          <div className="flex items-center gap-3 min-w-[220px] justify-end pr-2">
            <button className="icon-btn" title="J’aime (à venir)" aria-label="J’aime (à venir)">
              <svg viewBox="0 0 24 24" className="w-5 h-5"><path fill="currentColor" d="M12.1 21.35l-1.1-1.01C5.14 15.28 2 12.36 2 8.99 2 6.42 4.42 4 6.99 4c1.74 0 3.41.81 4.51 2.09C12.59 4.81 14.26 4 16 4 18.58 4 21 6.42 21 8.99c0 3.37-3.14 6.29-8.99 11.35l-1.91 1.01z"/></svg>
            </button>
            <button className="icon-btn" title="Paramètres" aria-label="Paramètres">
              <svg viewBox="0 0 24 24" className="w-5 h-5"><path fill="currentColor" d="M12 8a4 4 0 1 1 0 8a4 4 0 0 1 0-8m8.94 4a7 7 0 0 0-.14-1.5l2.11-1.65l-2-3.46l-2.49 1a7.1 7.1 0 0 0-2.61-1.51l-.39-2.65h-4l-.39 2.65c-.95.27-1.83.74-2.61-1.51l-2.49-1l-2 3.46L3.2 10.5A7 7 0 0 0 3.06 12c0 .51.05 1.01.14 1.5L1.09 15.15l2 3.46l2.49-1c.78.77 1.66 1.24 2.61 1.51l.39 2.65h4l.39-2.65c.95-.27 1.83-.74 2.61-1.51l2.49 1l2-3.46l-2.11-1.65c.09-.49.14-.99.14-1.5Z"/></svg>
            </button>
            <button className="icon-btn" title="Partager" aria-label="Partager">
              <svg viewBox="0 0 24 24" className="w-5 h-5"><path fill="currentColor" d="M18 16.08a3 3 0 0 0-2.83 2H9.91A3 3 0 1 0 7 20a3 3 0 0 0 2.91-2h5.26A3 3 0 1 0 18 16.08ZM18 14a3 3 0 1 0-2.83-4H9.91A3 3 0 1 0 7 12a3 3 0 0 0 2.91-2h5.26A3 3 0 0 0 18 14Z"/></svg>
            </button>
            <svg viewBox="0 0 24 24" className="w-5 h-5 opacity-90">
              <path fill="currentColor" d="M3 10v4h4l5 5V5L7 10H3z"/>
            </svg>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="range range-sm w-28"
              aria-label="Volume"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 bg-[#1e1e1e] text-white">
      {/* MOBILE */}
      <div className="md:hidden">
        <PlayerBarMobile art={mobileArt} title={mobileTitle} artist={mobileArtist} />
      </div>

      {/* DESKTOP (ton layout original) */}
      <div className="hidden md:flex relative w-full h-16 items-stretch">
        {/* Bloc 1 — Image de la chaîne OU image principale podcast */}
        <div className="h-full aspect-square overflow-hidden">
          {isPodcast ? (
            podcastMeta?.podcastImage ? (
              <img src={podcastMeta.podcastImage} alt={podcastMeta.podcastTitle} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-black/30" />
            )
          ) : (
            <img src={current?.image} alt={current?.name} className="w-full h-full object-cover" />
          )}
        </div>

        {/* Bloc 2 — Label + nom du channel OU nom du podcast */}
        <div className="flex flex-col justify-center min-w-[140px] px-2">
          <div className="text-[10px] uppercase opacity-70 leading-none">
            {isPodcast ? 'Podcast' : 'Channel'}
          </div>
          <div className="font-bold text-base leading-tight truncate">
            {isPodcast ? (podcastMeta?.podcastTitle || '—') : (current?.name || '—')}
          </div>
        </div>

        {/* Bloc 4 — Cover du morceau OU image épisode */}
        <div className="h-full aspect-square overflow-hidden bg-black/30">
          {isPodcast ? (
            podcastMeta?.image ? (
              <img src={podcastMeta.image} alt="episode" className="w-full h-full object-cover" />
            ) : null
          ) : (
            meta?.art ? <img src={meta.art} alt="art" className="w-full h-full object-cover" /> : null
          )}
        </div>

        {/* Bloc 5 — Play/Pause + Titre - Artiste OU Titre épisode */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button
            onClick={togglePlay}
            className="ml-2 inline-flex items-center justify-center w-10 h-10 rounded-full bg-white text-[#1e1e1e] hover:opacity-90 transition"
            aria-label={playing ? 'Pause' : 'Play'}
            title={playing ? 'Pause' : 'Play'}
          >
            {playing ? (
              <svg viewBox="0 0 24 24" className="w-5 h-5"><path fill="currentColor" d="M8 5h3v14H8V5zm5 0h3v14h-3V5z"/></svg>
            ) : (
              <svg viewBox="0 0 24 24" className="w-5 h-5"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>
            )}
          </button>
          <div className="font-bold truncate">
            {isPodcast ? (
              podcastMeta?.title || '—'
            ) : (
              <>
                {meta?.title || '—'} <span className="opacity-70">-</span> {meta?.artist || '—'}
              </>
            )}
          </div>
        </div>

        {/* Bloc 6 — Progress + Temps + Like / Settings / Share / Volume */}
        <div className="flex items-center gap-3 min-w-[360px] justify-end pr-2">
          <div className="text-xs tabular-nums opacity-80 w-12 text-right">{mmss(elapsed)}</div>
          <div className="w-56">
            <div
              className={`h-2 bg-black/30 rounded overflow-hidden ${isPodcast && duration ? 'cursor-pointer hover:h-3 transition-all' : ''}`}
              onClick={handleProgressClick}
              role={isPodcast && duration ? 'slider' : undefined}
              aria-label={isPodcast && duration ? 'Progress bar - click to seek' : undefined}
            >
              {progressPct !== null ? (
                <div className="h-full bg-white" style={{ width: `${progressPct}%` }} />
              ) : (
                <div className="h-full bg-white/80 animate-pulse w-1/3" />
              )}
            </div>
          </div>
          <div className="text-xs tabular-nums opacity-80 w-12">{duration ? mmss(duration) : '--:--'}</div>
          <button className="icon-btn" title="J’aime (à venir)" aria-label="J’aime (à venir)">
            <svg viewBox="0 0 24 24" className="w-5 h-5"><path fill="currentColor" d="M12.1 21.35l-1.1-1.01C5.14 15.28 2 12.36 2 8.99 2 6.42 4.42 4 6.99 4c1.74 0 3.41.81 4.51 2.09C12.59 4.81 14.26 4 16 4 18.58 4 21 6.42 21 8.99c0 3.37-3.14 6.29-8.99 11.35l-1.91 1.01z"/></svg>
          </button>
          <button className="icon-btn" title="Paramètres" aria-label="Paramètres">
            <svg viewBox="0 0 24 24" className="w-5 h-5"><path fill="currentColor" d="M12 8a4 4 0 1 1 0 8a4 4 0 0 1 0-8m8.94 4a7 7 0 0 0-.14-1.5l2.11-1.65l-2-3.46l-2.49 1a7.1 7.1 0 0 0-2.61-1.51l-.39-2.65h-4l-.39 2.65c-.95.27-1.83.74-2.61-1.51l-2.49-1l-2 3.46L3.2 10.5A7 7 0 0 0 3.06 12c0 .51.05 1.01.14 1.5L1.09 15.15l2 3.46l2.49-1c.78.77 1.66 1.24 2.61 1.51l.39 2.65h4l.39-2.65c.95-.27 1.83-.74 2.61-1.51l2.49 1l2-3.46l-2.11-1.65c.09-.49.14-.99.14-1.5Z"/></svg>
          </button>
          <button className="icon-btn" title="Partager" aria-label="Partager">
            <svg viewBox="0 0 24 24" className="w-5 h-5"><path fill="currentColor" d="M18 16.08a3 3 0 0 0-2.83 2H9.91A3 3 0 1 0 7 20a3 3 0 0 0 2.91-2h5.26A3 3 0 1 0 18 16.08ZM18 14a3 3 0 1 0-2.83-4H9.91A3 3 0 1 0 7 12a3 3 0 0 0 2.91-2h5.26A3 3 0 0 0 18 14Z"/></svg>
          </button>
          <svg viewBox="0 0 24 24" className="w-5 h-5 opacity-90">
            <path fill="currentColor" d="M3 10v4h4l5 5V5L7 10H3z"/>
          </svg>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="range range-sm w-28"
            aria-label="Volume"
          />
        </div>
      </div>
    </div>
  );
}
