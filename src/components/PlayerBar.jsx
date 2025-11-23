// src/components/PlayerBar.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAudio } from '../context/AudioPlayerContext';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../hooks/useCommunity';
import { useI18n } from '../i18n';
import { getNowPlaying } from '../utils/azura';
import { mmss } from '../utils/time';
import { addSongLike, removeSongLike, isSongLiked } from '../lib/supabase';
import PlayerBarMobile from './PlayerBarMobile';
import { channels } from '../data/channels';
import NewFeatureTooltip from './NewFeatureTooltip';

export default function PlayerBar() {
  const { current, currentType, podcastMeta, playing, togglePlay, setVolume, volume, audio, seek } = useAudio();
  const { user } = useAuth();
  const { profile } = useProfile(user?.id);
  const navigate = useNavigate();
  const [meta, setMeta] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const tickRef = useRef(null);
  const ipodButtonRef = useRef(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const { t } = useI18n();
  const player = t?.player ?? {};
  const site = t?.site ?? {};
  const selectPrompt = player.selectPrompt ?? 'Sélectionne une chaîne — Clique Écouter';
  const [selectMain, selectSecondary] = selectPrompt.split(' — ');
  const likeLabel = player.likeComingSoon ?? site.like ?? 'J\'aime (à venir)';
  const settingsLabel = player.settings ?? site.settings ?? 'Paramètres';
  const shareLabel = player.share ?? site.share ?? 'Partager';
  const openExternalLabel = player.openExternal ?? 'Lecteur externe';
  const profileLink = profile?.artist_slug ? `/profile/${profile.artist_slug}` : '/profile';
  const volumeLabel = player.volume ?? 'Volume';
  const podcastLabel = player.podcastLabel ?? 'Podcast';
  const channelLabel = site.channelLabel ?? 'Channel';
  const playLabel = player.play ?? 'Lire';
  const pauseLabel = player.pause ?? site.pause ?? 'Pause';
  const progressLabel = player.progressAria ?? 'Barre de progression - cliquer pour naviguer';
  const liveLabel = player.live ?? 'LIVE';

  // Check if this is first time seeing the iPod button
  useEffect(() => {
    const hasSeenIpodFeature = localStorage.getItem('kracradio_ipod_feature_seen');
    if (!hasSeenIpodFeature) {
      // Show tooltip after a short delay
      const timer = setTimeout(() => {
        setShowTooltip(true);
        localStorage.setItem('kracradio_ipod_feature_seen', 'true');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Open standalone player window
  const openStandalonePlayer = () => {
    const data = {
      channels,
      current,
      currentType,
      volume,
      playing,
      streamUrl: currentType === 'radio' ? current?.streamUrl : podcastMeta?.audioUrl,
      title: currentType === 'radio' ? current?.name : podcastMeta?.title,
      subtitle: currentType === 'radio' ? current?.tagline : podcastMeta?.podcastTitle,
      image: currentType === 'radio' ? current?.image : (podcastMeta?.image || podcastMeta?.podcastImage),
      name: current?.name,
      tagline: current?.tagline,
      key: current?.key
    };

    // Store data in both window and localStorage for player to access
    window.standalonePlayerData = data;
    localStorage.setItem('kracradio_player_data', JSON.stringify(data));

    // Open popup window with minimal chrome
    const width = 400;
    const height = 700;
    const left = Math.floor((window.screen.width - width) / 2);
    const top = Math.floor((window.screen.height - height) / 2);

    window.open(
      '/standalone-player.html',
      'KracRadioPlayer',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=no,toolbar=no,menubar=no,location=yes,directories=no,status=no,chrome=no`
    );
  };

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

  // Check if current song is liked when song changes
  useEffect(() => {
    if (!user) {
      setIsLiked(false);
      return;
    }

    const checkLiked = async () => {
      try {
        const title = isPodcast ? podcastMeta?.title : meta?.title;
        const artist = isPodcast ? podcastMeta?.podcastTitle : meta?.artist;

        if (!title || !artist || !current?.key) {
          setIsLiked(false);
          return;
        }

        const liked = await isSongLiked({
          channelKey: current.key,
          title,
          artist
        });
        setIsLiked(liked);
      } catch (error) {
        console.error('Error checking if song is liked:', error);
        setIsLiked(false);
      }
    };

    checkLiked();
  }, [user, meta?.title, meta?.artist, podcastMeta?.title, podcastMeta?.podcastTitle, current?.key, isPodcast]);

  // Handler pour le bouton like
  const handleLikeClick = async () => {
    // Redirect to login if not authenticated
    if (!user) {
      navigate('/login');
      return;
    }

    const title = isPodcast ? podcastMeta?.title : meta?.title;
    const artist = isPodcast ? podcastMeta?.podcastTitle : meta?.artist;
    const art = isPodcast
      ? (podcastMeta?.image || podcastMeta?.podcastImage)
      : meta?.art;

    if (!title || !artist || !current?.key) {
      console.warn('Cannot like: missing song information');
      return;
    }

    try {
      if (isLiked) {
        // Unlike
        await removeSongLike({
          channelKey: current.key,
          title,
          artist
        });
        setIsLiked(false);
      } else {
        // Like
        await addSongLike({
          channelKey: current.key,
          channelName: current.name,
          title,
          artist,
          albumArt: art
        });
        setIsLiked(true);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  // Prépare les infos affichées
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
      <div className="fixed inset-x-0 bottom-0 z-50 bg-gradient-to-t from-black via-[#0a0a0a] to-[#111111] backdrop-blur-xl border-t border-white/5 text-white shadow-2xl">
        {/* MOBILE */}
        <div className="md:hidden">
          <PlayerBarMobile art="/channels/default.webp" title="—" artist="—" />
        </div>

        {/* DESKTOP (inchangé, masqué sur mobile) */}
        <div className="hidden md:flex w-full h-20 items-center px-4">
          <div className="h-14 aspect-square bg-white/5 rounded-lg border border-white/10" />
          <div className="flex-1 font-semibold truncate px-6">
            {selectSecondary ? (
              <>
                <span className="text-base">{selectMain}</span>
                <span className="opacity-50 text-sm"> — {selectSecondary}</span>
              </>
            ) : (
              <span className="text-base">{selectPrompt}</span>
            )}
          </div>
          <div className="flex items-center gap-4 min-w-[280px] justify-end">
            <button
              className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10 transition-all duration-200"
              title={likeLabel}
              aria-label={likeLabel}
              onClick={handleLikeClick}
              style={{ opacity: isLiked ? 1 : 0.6, filter: isLiked ? 'brightness(1.3)' : 'none' }}
            >
              <img src="/icons/dark/hearth.svg" alt="Like" className="w-6 h-6" />
            </button>
            <Link to={profileLink} className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10 transition-all duration-200" title={settingsLabel} aria-label={settingsLabel}>
              <img src="/icons/dark/settings.svg" alt="Settings" className="w-5 h-5" />
            </Link>
            <button className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10 transition-all duration-200" title={shareLabel} aria-label={shareLabel}>
              <svg viewBox="0 0 24 24" className="w-5 h-5"><path fill="currentColor" d="M18 16.08a3 3 0 0 0-2.83 2H9.91A3 3 0 1 0 7 20a3 3 0 0 0 2.91-2h5.26A3 3 0 1 0 18 16.08ZM18 14a3 3 0 1 0-2.83-4H9.91A3 3 0 1 0 7 12a3 3 0 0 0 2.91-2h5.26A3 3 0 0 0 18 14Z"/></svg>
            </button>
            <div className="flex items-center gap-3 ml-2">
              <svg viewBox="0 0 24 24" className="w-5 h-5 opacity-70">
                <path fill="currentColor" d="M3 10v4h4l5 5V5L7 10H3z"/>
              </svg>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-24 h-1 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer hover:[&::-webkit-slider-thumb]:bg-red-500 transition-all"
                aria-label={volumeLabel}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 bg-gradient-to-t from-black via-[#0a0a0a] to-[#111111] backdrop-blur-xl border-t border-white/5 text-white shadow-2xl">
      {/* MOBILE */}
      <div className="md:hidden">
        <PlayerBarMobile art={mobileArt} title={mobileTitle} artist={mobileArtist} />
      </div>

      {/* DESKTOP (modernisé) */}
      <div className="hidden md:flex relative w-full h-20 items-center px-4 gap-4">
        {/* Bloc 1 — Image de la chaîne OU image principale podcast */}
        <div className="h-14 aspect-square overflow-hidden rounded-lg border border-white/10 shadow-lg flex-shrink-0">
          {isPodcast ? (
            podcastMeta?.podcastImage ? (
              <img src={podcastMeta.podcastImage} alt={podcastMeta.podcastTitle} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-red-500/20 to-purple-500/20" />
            )
          ) : (
            <img src={current?.image} alt={current?.name} className="w-full h-full object-cover" />
          )}
        </div>

        {/* Bloc 2 — Label + nom du channel OU nom du podcast */}
        <div className="flex flex-col justify-center min-w-[140px] px-2">
          <div className="text-[10px] uppercase font-semibold tracking-wider opacity-50 leading-none mb-1">
            {isPodcast ? podcastLabel : channelLabel}
          </div>
          <div className="font-bold text-sm leading-tight truncate">
            {isPodcast ? (podcastMeta?.podcastTitle || '—') : (current?.name || '—')}
          </div>
        </div>

        {/* Séparateur vertical */}
        <div className="h-10 w-px bg-white/10"></div>

        {/* Bloc 4 — Cover du morceau OU image épisode */}
        <div className="h-14 aspect-square overflow-hidden rounded-lg border border-white/10 shadow-lg flex-shrink-0">
          {isPodcast ? (
            podcastMeta?.image ? (
              <img src={podcastMeta.image} alt="episode" className="w-full h-full object-cover" />
            ) : <div className="w-full h-full bg-white/5" />
          ) : (
            meta?.art ? <img src={meta.art} alt="art" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-white/5" />
          )}
        </div>

        {/* Bloc 5 — Play/Pause + Titre - Artiste OU Titre épisode + iPod Button */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <button
            onClick={togglePlay}
            className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-xl transition-all duration-200 flex-shrink-0 transform hover:scale-105"
            aria-label={playing ? pauseLabel : playLabel}
            title={playing ? pauseLabel : playLabel}
          >
            {playing ? (
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-white"><path fill="currentColor" d="M8 5h3v14H8V5zm5 0h3v14h-3V5z"/></svg>
            ) : (
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-white ml-0.5"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>
            )}
          </button>
          <div className="font-semibold text-sm truncate">
            {isPodcast ? (
              podcastMeta?.title || '—'
            ) : (
              <>
                {meta?.title || '—'} <span className="opacity-50 font-normal">•</span> <span className="opacity-70">{meta?.artist || '—'}</span>
              </>
            )}
          </div>

          {/* iPod Player Button */}
          <button
            ref={ipodButtonRef}
            onClick={openStandalonePlayer}
            disabled={!current && currentType !== 'podcast'}
            className="inline-flex items-center justify-center w-10 h-10 rounded-lg hover:bg-white/10 transition-all duration-200 flex-shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label={player.openStandalone ?? 'Lecteur iPod'}
            title={player.openStandalone ?? 'Lecteur iPod'}
          >
            <img
              src="/icons/dark/ipod.svg"
              alt="iPod"
              className="w-6 h-6"
            />
          </button>
        </div>

        {/* New Feature Tooltip */}
        {showTooltip && (
          <NewFeatureTooltip
            targetRef={ipodButtonRef}
            onClose={() => setShowTooltip(false)}
          />
        )}

        {/* Séparateur vertical */}
        <div className="h-10 w-px bg-white/10"></div>

        {/* Bloc 6 — Progress + Temps + Like / Settings / Share / Volume */}
        <div className="flex items-center gap-4 min-w-[420px]">
          <div className="text-xs tabular-nums opacity-60 w-10 text-right font-medium">{mmss(elapsed)}</div>
          <div className="w-48">
            <div
              className={`h-1.5 bg-white/10 rounded-full overflow-hidden ${isPodcast && duration ? 'cursor-pointer hover:h-2 transition-all' : ''}`}
              onClick={handleProgressClick}
              role={isPodcast && duration ? 'slider' : undefined}
              aria-label={isPodcast && duration ? progressLabel : undefined}
            >
              {progressPct !== null ? (
                <div className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full shadow-sm" style={{ width: `${progressPct}%` }} />
              ) : (
                <div className="h-full bg-gradient-to-r from-red-500/60 to-red-600/60 animate-pulse w-1/3 rounded-full" />
              )}
            </div>
          </div>
          <div className="text-xs tabular-nums opacity-60 w-10 font-medium">{duration ? mmss(duration) : '--:--'}</div>

          {/* Actions */}
          <div className="flex items-center gap-2 ml-2">
            <button
              className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10 transition-all duration-200"
              title={likeLabel}
              aria-label={likeLabel}
              onClick={handleLikeClick}
              style={{ opacity: isLiked ? 1 : 0.6, filter: isLiked ? 'brightness(1.3)' : 'none' }}
            >
              <img src="/icons/dark/hearth.svg" alt="Like" className="w-6 h-6" />
            </button>
            <Link to={profileLink} className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10 transition-all duration-200" title={settingsLabel} aria-label={settingsLabel}>
              <img src="/icons/dark/settings.svg" alt="Settings" className="w-5 h-5" />
            </Link>
            <button className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10 transition-all duration-200" title={shareLabel} aria-label={shareLabel}>
              <svg viewBox="0 0 24 24" className="w-5 h-5"><path fill="currentColor" d="M18 16.08a3 3 0 0 0-2.83 2H9.91A3 3 0 1 0 7 20a3 3 0 0 0 2.91-2h5.26A3 3 0 1 0 18 16.08ZM18 14a3 3 0 1 0-2.83-4H9.91A3 3 0 1 0 7 12a3 3 0 0 0 2.91-2h5.26A3 3 0 0 0 18 14Z"/></svg>
            </button>
          </div>

          {/* Volume */}
          <div className="flex items-center gap-3 ml-2">
            <svg viewBox="0 0 24 24" className="w-5 h-5 opacity-70">
              <path fill="currentColor" d="M3 10v4h4l5 5V5L7 10H3z"/>
            </svg>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-24 h-1 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer hover:[&::-webkit-slider-thumb]:bg-red-500 [&::-webkit-slider-thumb]:transition-all"
              aria-label={volumeLabel}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
