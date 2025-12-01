'use client';
// src/context/AudioPlayerContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { channels } from '../data/channels';

const AudioCtx = createContext(null);

const DEFAULT_CHANNEL_KEY = 'kracradio'; // doit exister dans data/channels

export function AudioPlayerProvider({ children }) {
  const audioRef = useRef(null);
  const [current, setCurrent] = useState(null);   // { key, name, streamUrl, apiUrl, image, ... }
  const [currentType, setCurrentType] = useState('radio'); // 'radio' | 'podcast' | 'liked'
  const [podcastMeta, setPodcastMeta] = useState(null); // { episodeId, title, podcastTitle, podcastImage, image, duration }
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.75);

  // Playlist state for liked songs
  const [playlist, setPlaylist] = useState([]);
  const [playlistIndex, setPlaylistIndex] = useState(-1);

  // Crée l'élément <audio> une seule fois - côté client uniquement
  useEffect(() => {
    if (!audioRef.current && typeof window !== 'undefined') {
      const a = new Audio();
      a.preload = 'none';
      a.crossOrigin = 'anonymous'; // Permet CORS si le serveur l'autorise
      audioRef.current = a;
    }
  }, []);

  // Volume réactif
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Charger la station par défaut SANS jouer (seulement si pas de podcast/liked en cours)
  useEffect(() => {
    if (!audioRef.current) return; // Wait for audio element to be created
    if (current) return;
    if (currentType === 'podcast') return; // ← Ne pas charger la radio si podcast actif
    if (currentType === 'liked') return;   // ← Ne pas charger la radio si liked song actif

    const fallback = channels.find(c => c.key === DEFAULT_CHANNEL_KEY) || channels[0];
    if (!fallback) return;

    setCurrent(fallback);
    if (audioRef.current.src !== fallback.streamUrl) {
      audioRef.current.src = fallback.streamUrl;
      audioRef.current.preload = 'none';
    }
    setPlaying(false);
  }, [current, currentType]);

  // Synchroniser l'état avec les événements du tag audio
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return; // Wait for audio element to be created

    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => {
      setPlaying(false);
      // Auto-advance playlist if in liked songs mode
      if (currentType === 'liked' && playlist.length > 0 && playlistIndex < playlist.length - 1) {
        playNextTrack();
      }
    };
    a.addEventListener('play', onPlay);
    a.addEventListener('pause', onPause);
    a.addEventListener('ended', onEnded);
    return () => {
      a.removeEventListener('play', onPlay);
      a.removeEventListener('pause', onPause);
      a.removeEventListener('ended', onEnded);
    };
  }, [currentType, playlist, playlistIndex]);

  const togglePlay = async () => {
    // Autoriser toggle pour radio (current), podcast ou liked songs
    if (!current && currentType !== 'podcast' && currentType !== 'liked') return;
    if (!audioRef.current) return; // No audio element yet

    const a = audioRef.current;
    console.log('[AudioPlayer] togglePlay - paused:', a.paused, 'src:', a.src?.substring(0, 50), 'currentType:', currentType);

    if (a.paused) {
      try {
        await a.play();
        setPlaying(true);
        console.log('[AudioPlayer] togglePlay - resumed successfully');
      } catch (e) {
        console.warn('[AudioPlayer] Lecture bloquée:', e);
        // If play failed, the source might be invalid - don't change playing state
      }
    } else {
      a.pause();
      setPlaying(false);
      console.log('[AudioPlayer] togglePlay - paused');
    }
  };

  /**
   * Sélectionne un channel et joue (autoplay par défaut).
   * opts.autoplay === false pour charger sans jouer.
   */
  const playStream = async (channel, opts = {}) => {
    if (!channel) return;
    if (!audioRef.current) return; // No audio element yet

    // Arrêter un podcast en cours si on lance la radio
    if (currentType === 'podcast') {
      setPodcastMeta(null);
    }

    setCurrentType('radio');
    setCurrent(channel);
    const a = audioRef.current;
    if (a.src !== channel.streamUrl) {
      a.src = channel.streamUrl;
    }
    if (opts.autoplay === false) {
      a.pause();
      setPlaying(false);
      return;
    }
    try {
      await a.play();
      setPlaying(true);
    } catch (e) {
      console.warn('Lecture bloquée:', e);
      setPlaying(false);
    }
  };

  /**
   * Joue un épisode de podcast.
   * meta: { episodeId, title, audioUrl, image, podcastTitle, podcastImage, duration }
   */
  const playPodcast = async (meta, opts = {}) => {
    if (!meta || !meta.audioUrl) {
      console.warn('[AudioPlayer] playPodcast: missing meta or audioUrl');
      return;
    }
    if (!audioRef.current) return; // No audio element yet

    console.log('[AudioPlayer] Playing podcast:', meta.title, meta.audioUrl);

    // Arrêter la radio si en cours
    const a = audioRef.current;
    if (currentType === 'radio') {
      a.pause();
    }

    // ⚠️ IMPORTANT: Assigner l'URL AVANT de changer les states
    // pour éviter que des useEffect réassignent l'URL
    a.src = meta.audioUrl;
    a.load();
    console.log('[AudioPlayer] 1. Audio src assigned:', a.src);

    // Maintenant on peut mettre à jour les states
    setCurrentType('podcast');
    setPodcastMeta(meta);
    setCurrent(null);
    console.log('[AudioPlayer] 2. States updated (type=podcast)');

    if (opts.autoplay === false) {
      a.pause();
      setPlaying(false);
      return;
    }

    console.log('[AudioPlayer] 3. Audio src before delay:', a.src);

    // Attendre un micro-délai pour que la source soit bien assignée
    await new Promise(resolve => setTimeout(resolve, 100));

    // Essayer de jouer
    try {
      console.log('[AudioPlayer] 4. Attempting to play...');
      console.log('[AudioPlayer] 5. Audio src before play:', a.src);
      await a.play();
      setPlaying(true);
      console.log('[AudioPlayer] ✅ Playing successfully!');
      console.log('[AudioPlayer] Final currentSrc:', a.currentSrc);
    } catch (e) {
      // Si échec, attendre que l'audio soit prêt
      console.log('[AudioPlayer] Play failed, waiting for audio to be ready...', e.message);

      return new Promise((resolve, reject) => {
        const handleCanPlay = async () => {
          a.removeEventListener('canplaythrough', handleCanPlay);
          a.removeEventListener('error', handleError);

          try {
            console.log('[AudioPlayer] Audio ready after wait, playing...');
            await a.play();
            setPlaying(true);
            console.log('[AudioPlayer] Playing successfully (after wait)');
            resolve();
          } catch (err) {
            console.error('[AudioPlayer] Playback failed after wait:', err);
            setPlaying(false);
            reject(err);
          }
        };

        const handleError = (err) => {
          a.removeEventListener('canplaythrough', handleCanPlay);
          a.removeEventListener('error', handleError);
          console.error('[AudioPlayer] Load error:', err);
          setPlaying(false);
          reject(err);
        };

        a.addEventListener('canplaythrough', handleCanPlay, { once: true });
        a.addEventListener('error', handleError, { once: true });
      });
    }
  };

  /** 🔥 Pratique : jouer par key */
  const playChannel = async (key, opts = {}) => {
    const ch = channels.find(c => c.key === key);
    if (!ch) return;
    await playStream(ch, opts);
  };

  /**
   * Seek to a specific time in seconds (pour podcasts)
   */
  const seek = (timeInSeconds) => {
    if (!audioRef.current) return; // No audio element yet
    const a = audioRef.current;
    if (isNaN(timeInSeconds)) return;

    // Clamp entre 0 et duration
    const targetTime = Math.max(0, Math.min(timeInSeconds, a.duration || 0));
    a.currentTime = targetTime;
    console.log('[AudioPlayer] Seeked to:', targetTime);
  };

  /**
   * Play a single liked song
   * song: { id, title, artist, audioUrl, albumArt }
   */
  const playLikedSong = async (song, opts = {}) => {
    if (!song || !song.audioUrl) {
      console.warn('[AudioPlayer] playLikedSong: missing song or audioUrl');
      return;
    }
    if (!audioRef.current) return; // No audio element yet

    console.log('[AudioPlayer] Playing liked song:', song.title);

    const a = audioRef.current;
    a.pause();
    a.src = song.audioUrl;
    a.load();

    setCurrentType('liked');
    setPodcastMeta({
      title: song.title,
      podcastTitle: song.artist,
      image: song.albumArt,
      duration: null,
    });
    setCurrent(null);

    // Clear playlist if playing single song (unless we're in playlist mode)
    if (!opts.fromPlaylist) {
      setPlaylist([]);
      setPlaylistIndex(-1);
    }

    if (opts.autoplay === false) {
      a.pause();
      setPlaying(false);
      return;
    }

    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      await a.play();
      setPlaying(true);
    } catch (e) {
      console.warn('[AudioPlayer] Playback blocked:', e.message);
      setPlaying(false);
    }
  };

  /**
   * Play a playlist of liked songs
   * songs: Array of { id, title, artist, audioUrl, albumArt }
   */
  const playPlaylist = async (songs, startIndex = 0) => {
    if (!songs || songs.length === 0) {
      console.warn('[AudioPlayer] playPlaylist: empty playlist');
      return;
    }

    // Filter only playable songs (with audioUrl)
    const playableSongs = songs.filter(s => s.audioUrl);
    if (playableSongs.length === 0) {
      console.warn('[AudioPlayer] playPlaylist: no playable songs');
      return;
    }

    setPlaylist(playableSongs);
    setPlaylistIndex(startIndex);

    await playLikedSong(playableSongs[startIndex], { fromPlaylist: true });
  };

  /**
   * Play next track in playlist
   */
  const playNextTrack = async () => {
    if (playlist.length === 0 || playlistIndex >= playlist.length - 1) {
      console.log('[AudioPlayer] No next track');
      return;
    }

    const nextIndex = playlistIndex + 1;
    setPlaylistIndex(nextIndex);
    await playLikedSong(playlist[nextIndex], { fromPlaylist: true });
  };

  /**
   * Play previous track in playlist
   */
  const playPreviousTrack = async () => {
    if (playlist.length === 0 || playlistIndex <= 0) {
      console.log('[AudioPlayer] No previous track');
      return;
    }

    const prevIndex = playlistIndex - 1;
    setPlaylistIndex(prevIndex);
    await playLikedSong(playlist[prevIndex], { fromPlaylist: true });
  };

  /**
   * Check if there's a next track
   */
  const hasNextTrack = () => playlist.length > 0 && playlistIndex < playlist.length - 1;

  /**
   * Check if there's a previous track
   */
  const hasPreviousTrack = () => playlist.length > 0 && playlistIndex > 0;

  /**
   * Clear playlist mode
   */
  const clearPlaylist = () => {
    setPlaylist([]);
    setPlaylistIndex(-1);
  };

  const value = useMemo(
    () => ({
      audio: audioRef.current,
      current,
      currentType,
      podcastMeta,
      playing,
      volume,
      setVolume,
      togglePlay,
      playStream,
      playChannel,
      playPodcast,
      seek,
      setCurrent,
      // Playlist functions for liked songs
      playlist,
      playlistIndex,
      playLikedSong,
      playPlaylist,
      playNextTrack,
      playPreviousTrack,
      hasNextTrack,
      hasPreviousTrack,
      clearPlaylist,
    }),
    [current, currentType, podcastMeta, playing, volume, playlist, playlistIndex]
  );

  return <AudioCtx.Provider value={value}>{children}</AudioCtx.Provider>;
}

export function useAudio() {
  const ctx = useContext(AudioCtx);
  if (!ctx) throw new Error('useAudio must be used within <AudioPlayerProvider>');
  return ctx;
}
