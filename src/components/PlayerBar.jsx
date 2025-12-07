'use client';
// src/components/PlayerBar.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAudio } from '../context/AudioPlayerContext';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../hooks/useCommunity';
import { useI18n } from '../i18n';
import { useTheme } from '../context/ThemeContext';
import { getNowPlaying } from '../utils/azura';
import { mmss } from '../utils/time';
import { addSongLike, removeSongLike, isSongLiked } from '../lib/supabase';
import PlayerBarMobile from './PlayerBarMobile';
import { channels } from '../data/channels';
import NewFeatureTooltip from './NewFeatureTooltip';
import { useNotification } from '../context/NotificationContext';
import { useLikedSongs } from '../context/LikedSongsContext';
import NowPlayingPopup from './NowPlayingPopup';

export default function PlayerBar() {
  const {
    current, currentType, podcastMeta, playing, togglePlay, setVolume, volume, audio, seek, playChannel,
    playlist, playlistIndex, playNextTrack, playPreviousTrack, hasNextTrack, hasPreviousTrack
  } = useAudio();
  const { user } = useAuth();
  const { profile } = useProfile(user?.id);
  const { isDark } = useTheme();
  const router = useRouter();
  const { showNotification } = useNotification();
  const { addSongToList, removeSongFromList } = useLikedSongs();
  const { lang } = useI18n();
  const [meta, setMeta] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const tickRef = useRef(null);
  const ipodButtonRef = useRef(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const shareMenuRef = useRef(null);
  const shareMenuTimerRef = useRef(null);
  const [showChannelMenu, setShowChannelMenu] = useState(false);
  const [showNowPlayingPopup, setShowNowPlayingPopup] = useState(false);
  const lastSongRef = useRef(null);
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
  const previousLabel = player.previous ?? 'Previous';
  const nextLabel = player.next ?? 'Next';
  const nowPlayingLabel = player.nowPlaying ?? 'Now playing';
  const likedSongsLabel = t?.likedSongs?.title ?? 'Liked Songs';

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
    let isFirstLoad = true;
    async function load() {
      if (!current?.apiUrl) return;
      try {
        const np = await getNowPlaying(current.apiUrl);

        // Check if song changed and show popup
        const currentSongId = np?.title + np?.artist;
        const songChanged = currentSongId && lastSongRef.current && currentSongId !== lastSongRef.current;
        const isNewChannel = isFirstLoad && currentSongId;

        if ((songChanged || isNewChannel) && playing) {
          setShowNowPlayingPopup(true);
        }
        lastSongRef.current = currentSongId;
        isFirstLoad = false;

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
  }, [current, currentType, playing]);

  // Pour les podcasts, utiliser les métadonnées fournies
  useEffect(() => {
    if (currentType === 'podcast' && podcastMeta) {
      setElapsed(0);
      setDuration(podcastMeta.duration || null);
    }
  }, [currentType, podcastMeta]);

  // Synchroniser elapsed avec audio.currentTime pour les podcasts et liked songs
  useEffect(() => {
    if ((currentType !== 'podcast' && currentType !== 'liked') || !audio) return;

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
    if (!playing || currentType === 'podcast' || currentType === 'liked') return; // Ne pas utiliser tick pour podcast/liked
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
    // Seulement pour les podcasts/liked avec durée connue
    if ((currentType !== 'podcast' && currentType !== 'liked') || !duration || !seek) return;

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
      router.push('/login');
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

        // Remove from local state
        removeSongFromList({ title, artist, channelKey: current.key });
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

        // Add to local state
        addSongToList({
          title,
          artist,
          channelKey: current.key,
          channelName: current.name,
          albumArt: art
        });

        // Show notification
        const messages = {
          fr: 'Chanson ajoutée',
          en: 'Song added',
          es: 'Canción añadida'
        };
        showNotification(messages[lang] || messages.fr, 'song');
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  // Channel menu functions
  const handleChannelSelect = (channelKey) => {
    playChannel(channelKey);
    setShowChannelMenu(false);
  };

  const toggleChannelMenu = () => {
    setShowChannelMenu(!showChannelMenu);
  };

  // Close channel menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showChannelMenu && !event.target.closest('.channel-menu-container')) {
        setShowChannelMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showChannelMenu]);

  // Share functions
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareTitle = isPodcast
    ? `${podcastMeta?.title || ''} - ${podcastMeta?.podcastTitle || ''}`
    : `${meta?.title || ''} - ${meta?.artist || ''} sur ${current?.name || 'KracRadio'}`;

  const handleShareMenuEnter = () => {
    if (shareMenuTimerRef.current) {
      clearTimeout(shareMenuTimerRef.current);
      shareMenuTimerRef.current = null;
    }
    setShowShareMenu(true);
  };

  const handleShareMenuLeave = () => {
    shareMenuTimerRef.current = setTimeout(() => {
      setShowShareMenu(false);
    }, 200);
  };

  const handleShare = (platform) => {
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedTitle = encodeURIComponent(shareTitle);

    let shareLink = '';

    switch(platform) {
      case 'facebook':
        shareLink = `https://www.facebook.com/sharer.php?u=${encodedUrl}`;
        break;
      case 'twitter':
        shareLink = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
        break;
      case 'linkedin':
        shareLink = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        break;
      case 'whatsapp':
        shareLink = `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`;
        break;
      case 'email':
        shareLink = `mailto:?subject=${encodedTitle}&body=${encodedUrl}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(shareUrl);
        setShowShareMenu(false);
        return;
      default:
        return;
    }

    if (shareLink) {
      window.open(shareLink, '_blank', 'width=600,height=400');
      setShowShareMenu(false);
    }
  };

  // Prépare les infos affichées
  const mobileArt = isPodcast
    ? (podcastMeta?.image || podcastMeta?.podcastImage || '/channels/default.webp')
    : currentType === 'liked'
      ? (podcastMeta?.image || '/channels/default.webp')
      : (meta?.art || current?.image || '/channels/default.webp');
  const mobileTitle = isPodcast
    ? (podcastMeta?.title || '—')
    : currentType === 'liked'
      ? (podcastMeta?.title || '—')
      : (meta?.title || '—');
  const mobileArtist = isPodcast
    ? (podcastMeta?.podcastTitle || '—')
    : currentType === 'liked'
      ? (podcastMeta?.podcastTitle || '—')
      : (meta?.artist || current?.name || '—');

  // Check if we're in liked songs mode
  const isLikedSongs = currentType === 'liked';

  // État neutre si aucune chaîne ni podcast ni liked songs
  if (!current && !isPodcast && !isLikedSongs) {
    return (
      <div className="fixed inset-x-0 bottom-0 z-50 bg-gradient-to-t from-black via-[#0a0a0a] to-[#111111] backdrop-blur-xl border-t border-white/5 text-white shadow-2xl">
        {/* MOBILE */}
        <div className="md:hidden">
          <PlayerBarMobile art="/channels/default.webp" title="—" artist="—" isLiked={isLiked} onLikeClick={handleLikeClick} likeLabel={likeLabel} />
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
            <Link href="/settings" className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10 transition-all duration-200" title={settingsLabel} aria-label={settingsLabel}>
              <img src="/icons/dark/settings.svg" alt="Settings" className="w-5 h-5" />
            </Link>
            <div className="relative" ref={shareMenuRef}>
              <button
                className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10 transition-all duration-200"
                title={shareLabel}
                aria-label={shareLabel}
                onMouseEnter={handleShareMenuEnter}
                onMouseLeave={handleShareMenuLeave}
              >
                <img src="/icons/dark/share.svg" alt="Share" className="w-5 h-5" />
              </button>
              {showShareMenu && (
                <div
                  className="absolute bottom-full right-0 mb-2 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-2xl overflow-hidden min-w-[180px]"
                  onMouseEnter={handleShareMenuEnter}
                  onMouseLeave={handleShareMenuLeave}
                >
                  <button
                    onClick={() => handleShare('facebook')}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-white/5 transition-colors flex items-center gap-3"
                  >
                    <img src="/icons/dark/facebook.svg" alt="Facebook" className="w-4 h-4" />
                    <span>Facebook</span>
                  </button>
                  <button
                    onClick={() => handleShare('twitter')}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-white/5 transition-colors flex items-center gap-3"
                  >
                    <img src="/icons/dark/x.svg" alt="X" className="w-4 h-4" />
                    <span>Twitter / X</span>
                  </button>
                  <button
                    onClick={() => handleShare('linkedin')}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-white/5 transition-colors flex items-center gap-3"
                  >
                    <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                    </svg>
                    <span>LinkedIn</span>
                  </button>
                  <button
                    onClick={() => handleShare('whatsapp')}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-white/5 transition-colors flex items-center gap-3"
                  >
                    <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                    <span>WhatsApp</span>
                  </button>
                  <button
                    onClick={() => handleShare('email')}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-white/5 transition-colors flex items-center gap-3"
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span>Email</span>
                  </button>
                  <div className="h-px bg-white/10"></div>
                  <button
                    onClick={() => handleShare('copy')}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-white/5 transition-colors flex items-center gap-3"
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>Copier le lien</span>
                  </button>
                </div>
              )}
            </div>
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
        <PlayerBarMobile art={mobileArt} title={mobileTitle} artist={mobileArtist} isLiked={isLiked} onLikeClick={handleLikeClick} likeLabel={likeLabel} />
      </div>

      {/* DESKTOP (modernisé) */}
      <div className="hidden md:flex relative w-full h-20 items-center px-4 gap-4">
        {/* Bloc 1 — Image de la chaîne OU image principale podcast OU liked songs icon */}
        <div className="relative channel-menu-container">
          <button
            onClick={(!isPodcast && !isLikedSongs) ? toggleChannelMenu : undefined}
            className={`h-14 aspect-square overflow-hidden rounded-lg border border-white/10 shadow-lg flex-shrink-0 ${(!isPodcast && !isLikedSongs) ? 'hover:border-red-500/50 cursor-pointer' : 'cursor-default'} transition-all`}
            title={(!isPodcast && !isLikedSongs) ? "Changer de chaîne" : undefined}
          >
            {isLikedSongs ? (
              <div className="w-full h-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-7 h-7 text-white" fill="currentColor">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </div>
            ) : isPodcast ? (
              podcastMeta?.podcastImage ? (
                <img src={podcastMeta.podcastImage} alt={podcastMeta.podcastTitle} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-red-500/20 to-purple-500/20" />
              )
            ) : (
              <img src={current?.image} alt={current?.name} className="w-full h-full object-cover" />
            )}
          </button>

          {/* Menu de sélection de chaîne - seulement pour la radio */}
          {showChannelMenu && !isPodcast && !isLikedSongs && (
            <div className="absolute bottom-full left-0 mb-2 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-2xl overflow-hidden min-w-[240px] max-h-[400px] overflow-y-auto">
              {channels.map((channel) => (
                <button
                  key={channel.key}
                  onClick={() => handleChannelSelect(channel.key)}
                  className={`w-full px-4 py-3 text-left hover:bg-white/5 transition-colors flex items-center gap-3 ${
                    current?.key === channel.key ? 'bg-red-500/10 border-l-2 border-red-500' : ''
                  }`}
                >
                  <img
                    src={channel.image}
                    alt={channel.name}
                    className="w-10 h-10 rounded-md object-cover border border-white/10"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{channel.name}</div>
                    <div className="text-xs opacity-50 truncate">{channel.tagline || 'Radio en direct'}</div>
                  </div>
                  {current?.key === channel.key && (
                    <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Bloc 2 — Label + nom du channel OU nom du podcast OU Liked Songs */}
        <button
          onClick={(!isPodcast && !isLikedSongs) ? toggleChannelMenu : undefined}
          className={`channel-menu-container flex flex-col justify-center min-w-[140px] px-2 text-left ${(!isPodcast && !isLikedSongs) ? 'hover:opacity-80 cursor-pointer' : 'cursor-default'} transition-opacity`}
          title={(!isPodcast && !isLikedSongs) ? "Changer de chaîne" : undefined}
        >
          <div className="text-[10px] uppercase font-semibold tracking-wider opacity-50 leading-none mb-1">
            {isLikedSongs ? likedSongsLabel : isPodcast ? podcastLabel : channelLabel}
          </div>
          <div className="font-bold text-sm leading-tight truncate flex items-center gap-1">
            {isLikedSongs ? (
              playlist.length > 0 ? `${playlistIndex + 1} / ${playlist.length}` : nowPlayingLabel
            ) : isPodcast ? (podcastMeta?.podcastTitle || '—') : (current?.name || '—')}
            {(!isPodcast && !isLikedSongs) && (
              <svg className="w-3 h-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </div>
        </button>

        {/* Séparateur vertical */}
        <div className="h-10 w-px bg-white/10"></div>

        {/* Bloc 4 — Cover du morceau OU image épisode OU album art */}
        <div className="h-14 aspect-square overflow-hidden rounded-lg border border-white/10 shadow-lg flex-shrink-0">
          {isLikedSongs ? (
            podcastMeta?.image ? (
              <img src={podcastMeta.image} alt="album art" className="w-full h-full object-cover" />
            ) : <div className="w-full h-full bg-white/5 flex items-center justify-center text-2xl">🎵</div>
          ) : isPodcast ? (
            podcastMeta?.image ? (
              <img src={podcastMeta.image} alt="episode" className="w-full h-full object-cover" />
            ) : <div className="w-full h-full bg-white/5" />
          ) : (
            meta?.art ? <img src={meta.art} alt="art" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-white/5" />
          )}
        </div>

        {/* Bloc 5 — Play/Pause + Titre - Artiste OU Titre épisode + iPod Button */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {/* Previous Track Button (only for liked songs playlist) */}
          {currentType === 'liked' && playlist.length > 0 && (
            <button
              onClick={playPreviousTrack}
              disabled={!hasPreviousTrack()}
              className="inline-flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/10 transition-all duration-200 flex-shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label={previousLabel}
              title={previousLabel}
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-white">
                <path fill="currentColor" d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
              </svg>
            </button>
          )}

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

          {/* Next Track Button (only for liked songs playlist) */}
          {currentType === 'liked' && playlist.length > 0 && (
            <button
              onClick={playNextTrack}
              disabled={!hasNextTrack()}
              className="inline-flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/10 transition-all duration-200 flex-shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label={nextLabel}
              title={nextLabel}
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-white">
                <path fill="currentColor" d="M6 18l8.5-6L6 6v12zm2-8.14L11.03 12 8 14.14V9.86zM16 6h2v12h-2z"/>
              </svg>
            </button>
          )}

          <div className="font-semibold text-sm truncate">
            {currentType === 'liked' ? (
              <>
                {podcastMeta?.title || '—'} <span className="opacity-50 font-normal">•</span> <span className="opacity-70">{podcastMeta?.podcastTitle || '—'}</span>
                {playlist.length > 0 && (
                  <span className="ml-2 text-xs opacity-50 font-normal">
                    ({playlistIndex + 1}/{playlist.length})
                  </span>
                )}
              </>
            ) : isPodcast ? (
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
              className={`h-1.5 bg-white/10 rounded-full overflow-hidden ${(isPodcast || currentType === 'liked') && duration ? 'cursor-pointer hover:h-2 transition-all' : ''}`}
              onClick={handleProgressClick}
              role={(isPodcast || currentType === 'liked') && duration ? 'slider' : undefined}
              aria-label={(isPodcast || currentType === 'liked') && duration ? progressLabel : undefined}
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
            <Link href="/settings" className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10 transition-all duration-200" title={settingsLabel} aria-label={settingsLabel}>
              <img src="/icons/dark/settings.svg" alt="Settings" className="w-5 h-5" />
            </Link>
            <div className="relative">
              <button
                className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10 transition-all duration-200"
                title={shareLabel}
                aria-label={shareLabel}
                onMouseEnter={handleShareMenuEnter}
                onMouseLeave={handleShareMenuLeave}
              >
                <img src="/icons/dark/share.svg" alt="Share" className="w-5 h-5" />
              </button>
              {showShareMenu && (
                <div
                  className="absolute bottom-full right-0 mb-2 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-2xl overflow-hidden min-w-[180px]"
                  onMouseEnter={handleShareMenuEnter}
                  onMouseLeave={handleShareMenuLeave}
                >
                  <button
                    onClick={() => handleShare('facebook')}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-white/5 transition-colors flex items-center gap-3"
                  >
                    <img src="/icons/dark/facebook.svg" alt="Facebook" className="w-4 h-4" />
                    <span>Facebook</span>
                  </button>
                  <button
                    onClick={() => handleShare('twitter')}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-white/5 transition-colors flex items-center gap-3"
                  >
                    <img src="/icons/dark/x.svg" alt="X" className="w-4 h-4" />
                    <span>Twitter / X</span>
                  </button>
                  <button
                    onClick={() => handleShare('linkedin')}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-white/5 transition-colors flex items-center gap-3"
                  >
                    <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                    </svg>
                    <span>LinkedIn</span>
                  </button>
                  <button
                    onClick={() => handleShare('whatsapp')}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-white/5 transition-colors flex items-center gap-3"
                  >
                    <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                    <span>WhatsApp</span>
                  </button>
                  <button
                    onClick={() => handleShare('email')}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-white/5 transition-colors flex items-center gap-3"
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span>Email</span>
                  </button>
                  <div className="h-px bg-white/10"></div>
                  <button
                    onClick={() => handleShare('copy')}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-white/5 transition-colors flex items-center gap-3"
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>Copier le lien</span>
                  </button>
                </div>
              )}
            </div>
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

      {/* Now Playing Popup */}
      <NowPlayingPopup
        isVisible={showNowPlayingPopup}
        onClose={() => setShowNowPlayingPopup(false)}
        channelName={current?.name}
        title={meta?.title}
        artist={meta?.artist}
        coverArt={meta?.art}
      />
    </div>
  );
}
