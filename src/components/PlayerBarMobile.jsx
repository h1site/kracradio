'use client';
// src/components/PlayerBarMobile.jsx
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAudio } from '../context/AudioPlayerContext';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n';
import { getNowPlaying } from '../utils/azura';
import { mmss } from '../utils/time';
import { channels } from '../data/channels';

const RED = '#E50914';

// Composant texte défilant pour les textes trop longs
function MarqueeText({ text, className = '' }) {
  const containerRef = useRef(null);
  const textRef = useRef(null);
  const [shouldScroll, setShouldScroll] = useState(false);

  useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current && textRef.current) {
        const isOverflowing = textRef.current.scrollWidth > containerRef.current.clientWidth;
        setShouldScroll(isOverflowing);
      }
    };

    checkOverflow();
    // Re-check on resize
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [text]);

  return (
    <div ref={containerRef} className={`overflow-hidden whitespace-nowrap ${className}`}>
      {shouldScroll ? (
        <div className="inline-flex animate-marquee">
          <span ref={textRef} className="pr-8">{text}</span>
          <span className="pr-8">{text}</span>
        </div>
      ) : (
        <span ref={textRef} className="truncate block">{text}</span>
      )}
    </div>
  );
}

export default function PlayerBarMobile({ isLiked, onLikeClick, likeLabel }) {
  const { current, playing, togglePlay, podcastMeta, currentType, playChannel } = useAudio();
  const { user } = useAuth();
  const { t } = useI18n();
  const player = t?.player ?? {};
  const site = t?.site ?? {};
  const nav = t?.nav ?? {};
  const playLabel = player.play ?? 'Lire';
  const pauseLabel = player.pause ?? site.pause ?? 'Pause';
  const liveLabel = player.live ?? 'LIVE';

  const [meta, setMeta] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showChannelPicker, setShowChannelPicker] = useState(false);
  const [showChannelBanner, setShowChannelBanner] = useState(false);
  const [bannerChannel, setBannerChannel] = useState(null);
  const tickRef = useRef(null);
  const menuRef = useRef(null);
  const channelPickerRef = useRef(null);
  const bannerTimeoutRef = useRef(null);

  // Get current channel index
  const currentChannelIndex = useMemo(() => {
    if (!current?.key) return -1;
    return channels.findIndex(c => c.key === current.key);
  }, [current?.key]);

  // Show channel banner when channel changes
  const showBanner = useCallback((channel) => {
    // Clear any existing timeout
    if (bannerTimeoutRef.current) {
      clearTimeout(bannerTimeoutRef.current);
    }

    setBannerChannel(channel);
    setShowChannelBanner(true);

    // Hide banner after 2.5 seconds
    bannerTimeoutRef.current = setTimeout(() => {
      setShowChannelBanner(false);
    }, 2500);
  }, []);

  // Switch to next/previous channel
  const switchChannel = useCallback((direction) => {
    if (currentType !== 'radio' || currentChannelIndex === -1) return;

    let newIndex;
    if (direction === 'next') {
      newIndex = (currentChannelIndex + 1) % channels.length;
    } else {
      newIndex = currentChannelIndex - 1 < 0 ? channels.length - 1 : currentChannelIndex - 1;
    }

    const newChannel = channels[newIndex];
    if (newChannel) {
      playChannel(newChannel.key);
      showBanner(newChannel);
    }
  }, [currentType, currentChannelIndex, playChannel, showBanner]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (bannerTimeoutRef.current) {
        clearTimeout(bannerTimeoutRef.current);
      }
    };
  }, []);

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

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
      if (channelPickerRef.current && !channelPickerRef.current.contains(e.target)) {
        setShowChannelPicker(false);
      }
    };
    if (showMenu || showChannelPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showMenu, showChannelPicker]);

  // 4) Données à afficher (avec fallback)
  // Pour les liked songs (currentType === 'liked'), utiliser podcastMeta
  // Pour les radios live, utiliser meta (AzuraCast) ou current
  const isLikedSong = currentType === 'liked' || currentType === 'podcast';

  const art = isLikedSong
    ? (podcastMeta?.image || '/channels/default.webp')
    : (meta?.art || current?.now?.art || current?.art || current?.image || '/channels/default.webp');

  const songTitle = isLikedSong
    ? (podcastMeta?.title || '—')
    : (meta?.title || current?.now?.title || current?.title || '—');

  const artist = isLikedSong
    ? (podcastMeta?.podcastTitle || '—')
    : (meta?.artist || current?.now?.artist || current?.artist || current?.name || '—');

  // Check if we're in radio mode (can switch channels)
  const isRadioMode = currentType === 'radio' && currentChannelIndex !== -1;

  // Nom de la chaîne courante
  const channelName = current?.name || '';

  // Format mobile: "Titre - Chaîne: Nom" pour les radios, sinon juste le titre
  const displayTitle = isRadioMode && channelName ? `${songTitle} - Chaîne: ${channelName}` : songTitle;

  return (
    // ⚠️ Ce composant est pensé pour être inclus dans un conteneur fixe (PlayerBar) — pas de position fixed ici.
    <div className="md:hidden h-16 px-3 flex items-center gap-2 relative">
      {/* Channel Banner - appears when switching channels */}
      {showChannelBanner && bannerChannel && (
        <div
          className={`absolute left-0 right-0 bottom-full mb-1 mx-3 bg-black/95 backdrop-blur-sm rounded-lg border border-white/20 shadow-2xl overflow-hidden z-50 transition-all duration-300 ${
            showChannelBanner ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}
        >
          <div className="flex items-center gap-3 p-3">
            <img
              src={bannerChannel.image || '/channels/default.webp'}
              alt={bannerChannel.name}
              className="w-14 h-14 rounded-lg object-cover border border-white/10"
            />
            <div className="flex-1 min-w-0">
              <div className="text-xs text-white/60 uppercase tracking-wider font-medium mb-1">
                Chaîne
              </div>
              <div className="text-white font-bold text-lg truncate">
                {bannerChannel.name}
              </div>
            </div>
            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
          </div>
        </div>
      )}

      {/* Channel switcher area */}
      <div className="relative flex items-center gap-1 shrink-0" ref={channelPickerRef}>
        {/* Prev Channel Button - only in radio mode */}
        {isRadioMode && (
          <button
            type="button"
            onClick={() => switchChannel('prev')}
            className="w-6 h-6 flex items-center justify-center text-white/50 hover:text-white transition-colors"
            aria-label="Chaîne précédente"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
            </svg>
          </button>
        )}

        {/* Jaquette ou bouton Radio selon le mode */}
        {isLikedSong ? (
          // En mode liked song/podcast: bouton pour lancer une chaîne radio
          <button
            type="button"
            onClick={() => setShowChannelPicker(!showChannelPicker)}
            className="w-12 h-12 rounded border-2 border-dashed border-red-500/50 bg-red-500/10 flex items-center justify-center shrink-0 cursor-pointer hover:border-red-500 hover:bg-red-500/20 transition-all group"
            aria-label="Écouter la radio"
          >
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-red-500 group-hover:scale-110 transition-transform" fill="currentColor">
              <path d="M3.24 6.15C2.51 6.43 2 7.17 2 8v12c0 1.1.89 2 2 2h16c1.11 0 2-.9 2-2V8c0-1.11-.89-2-2-2H8.3l8.26-3.34L15.88 1 3.24 6.15zM7 20c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm13-8h-2v-2h-2v2H4V8h16v4z"/>
            </svg>
          </button>
        ) : (
          // En mode radio: jaquette clickable pour ouvrir le picker
          <button
            type="button"
            onClick={() => setShowChannelPicker(!showChannelPicker)}
            className="w-12 h-12 rounded border border-white/10 overflow-hidden shrink-0 cursor-pointer hover:border-white/30 transition-colors"
          >
            <img
              src={art}
              alt=""
              loading="lazy"
              className="w-full h-full object-cover"
            />
          </button>
        )}

        {/* Next Channel Button - only in radio mode */}
        {isRadioMode && (
          <button
            type="button"
            onClick={() => switchChannel('next')}
            className="w-6 h-6 flex items-center justify-center text-white/50 hover:text-white transition-colors"
            aria-label="Chaîne suivante"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
              <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
            </svg>
          </button>
        )}

        {/* Channel Picker Popup - available in all modes now */}
        {showChannelPicker && (
          <div className="absolute bottom-full left-0 mb-2 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-2xl overflow-hidden w-[280px] max-h-[300px] overflow-y-auto z-50">
            <div className="px-3 py-2 border-b border-white/10 sticky top-0 bg-[#1a1a1a]">
              <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                {nav.channels || 'Chaînes'}
              </span>
            </div>
            {channels.map((channel, idx) => (
              <button
                key={channel.key}
                onClick={() => {
                  playChannel(channel.key);
                  setShowChannelPicker(false);
                }}
                className={`w-full px-3 py-2 text-left hover:bg-white/5 transition-colors flex items-center gap-3 ${
                  idx === currentChannelIndex ? 'bg-white/10' : ''
                }`}
              >
                <img
                  src={channel.image || '/channels/default.webp'}
                  alt={channel.name}
                  className="w-10 h-10 rounded object-cover"
                />
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium truncate ${idx === currentChannelIndex ? 'text-red-400' : 'text-white'}`}>
                    {channel.name}
                  </div>
                  {channel.description && (
                    <div className="text-xs text-white/50 truncate">{channel.description}</div>
                  )}
                </div>
                {idx === currentChannelIndex && (
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

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
        <MarqueeText text={displayTitle} className="text-white text-sm font-semibold" />
        <div className="text-white/70 text-xs truncate">{artist}</div>

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

      {/* Like Button */}
      {onLikeClick && (
        <button
          type="button"
          onClick={onLikeClick}
          className="w-8 h-8 flex items-center justify-center shrink-0"
          title={likeLabel}
          aria-label={likeLabel}
        >
          <svg
            viewBox="0 0 24 24"
            className={`w-5 h-5 transition-all ${isLiked ? 'text-red-500' : 'text-white/60'}`}
            fill={isLiked ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth={isLiked ? 0 : 2}
          >
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </button>
      )}

      {/* Menu Button */}
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setShowMenu(!showMenu)}
          className="w-8 h-8 flex items-center justify-center shrink-0"
          aria-label="Menu"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-white/60" fill="currentColor">
            <circle cx="12" cy="5" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="12" cy="19" r="2" />
          </svg>
        </button>

        {/* Popup Menu */}
        {showMenu && (
          <div className="absolute bottom-full right-0 mb-2 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-2xl overflow-hidden min-w-[180px] z-50">
            {/* Login/Profile */}
            {user ? (
              <Link
                href="/profile"
                onClick={() => setShowMenu(false)}
                className="w-full px-4 py-3 text-left text-sm hover:bg-white/5 transition-colors flex items-center gap-3 text-white"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-white/60" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
                <span>{nav.profile || 'Profil'}</span>
              </Link>
            ) : (
              <Link
                href="/login"
                onClick={() => setShowMenu(false)}
                className="w-full px-4 py-3 text-left text-sm hover:bg-white/5 transition-colors flex items-center gap-3 text-white"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-white/60" fill="currentColor">
                  <path d="M11 7L9.6 8.4l2.6 2.6H2v2h10.2l-2.6 2.6L11 17l5-5-5-5zm9 12h-8v2h8c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-8v2h8v14z" />
                </svg>
                <span>{nav.login || 'Connexion'}</span>
              </Link>
            )}

            {/* Liked Songs */}
            <Link
              href="/liked-songs"
              onClick={() => setShowMenu(false)}
              className="w-full px-4 py-3 text-left text-sm hover:bg-white/5 transition-colors flex items-center gap-3 text-white"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-red-500" fill="currentColor">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              <span>{t.likedSongs?.title || 'Chansons aimées'}</span>
            </Link>

            {/* Settings */}
            <Link
              href="/settings"
              onClick={() => setShowMenu(false)}
              className="w-full px-4 py-3 text-left text-sm hover:bg-white/5 transition-colors flex items-center gap-3 text-white"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-white/60" fill="currentColor">
                <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
              </svg>
              <span>{site.settings || 'Paramètres'}</span>
            </Link>

            {/* Divider */}
            <div className="h-px bg-white/10 my-1" />

            {/* Share */}
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: 'KracRadio',
                    text: `${songTitle} - ${artist}`,
                    url: window.location.origin,
                  });
                }
                setShowMenu(false);
              }}
              className="w-full px-4 py-3 text-left text-sm hover:bg-white/5 transition-colors flex items-center gap-3 text-white"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-white/60" fill="currentColor">
                <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z" />
              </svg>
              <span>{site.share || 'Partager'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
