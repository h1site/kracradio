// src/context/AudioPlayerContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { channels } from '../data/channels';

const AudioCtx = createContext(null);

const DEFAULT_CHANNEL_KEY = 'kracradio'; // doit exister dans data/channels

export function AudioPlayerProvider({ children }) {
  const audioRef = useRef(null);
  const [current, setCurrent] = useState(null);   // { key, name, streamUrl, apiUrl, image, ... }
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.75);

  // Crée l'élément <audio> une seule fois
  if (!audioRef.current) {
    const a = new Audio();
    a.preload = 'none';
    a.crossOrigin = 'anonymous';
    audioRef.current = a;
  }

  // Volume réactif
  useEffect(() => {
    audioRef.current.volume = volume;
  }, [volume]);

  // Charger la station par défaut SANS jouer
  useEffect(() => {
    if (current) return;
    const fallback = channels.find(c => c.key === DEFAULT_CHANNEL_KEY) || channels[0];
    if (!fallback) return;

    setCurrent(fallback);
    if (audioRef.current.src !== fallback.streamUrl) {
      audioRef.current.src = fallback.streamUrl;
      audioRef.current.preload = 'none';
    }
    setPlaying(false);
  }, [current]);

  // Synchroniser l'état avec les événements du tag audio
  useEffect(() => {
    const a = audioRef.current;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => setPlaying(false);
    a.addEventListener('play', onPlay);
    a.addEventListener('pause', onPause);
    a.addEventListener('ended', onEnded);
    return () => {
      a.removeEventListener('play', onPlay);
      a.removeEventListener('pause', onPause);
      a.removeEventListener('ended', onEnded);
    };
  }, []);

  const togglePlay = async () => {
    if (!current) return;
    const a = audioRef.current;
    if (a.paused) {
      try {
        await a.play();
        setPlaying(true);
      } catch (e) {
        console.warn('Lecture bloquée:', e);
      }
    } else {
      a.pause();
      setPlaying(false);
    }
  };

  /**
   * Sélectionne un channel et joue (autoplay par défaut).
   * opts.autoplay === false pour charger sans jouer.
   */
  const playStream = async (channel, opts = {}) => {
    if (!channel) return;
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

  /** 🔥 Pratique : jouer par key */
  const playChannel = async (key, opts = {}) => {
    const ch = channels.find(c => c.key === key);
    if (!ch) return;
    await playStream(ch, opts);
  };

  const value = useMemo(
    () => ({
      audio: audioRef.current,
      current,
      playing,
      volume,
      setVolume,
      togglePlay,
      playStream,
      playChannel,   // ← exposé ici
      setCurrent
    }),
    [current, playing, volume]
  );

  return <AudioCtx.Provider value={value}>{children}</AudioCtx.Provider>;
}

export function useAudio() {
  const ctx = useContext(AudioCtx);
  if (!ctx) throw new Error('useAudio must be used within <AudioPlayerProvider>');
  return ctx;
}
