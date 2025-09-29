// src/context/AudioPlayerContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { channels } from '../data/channels';

const AudioCtx = createContext(null);

const DEFAULT_CHANNEL_KEY = 'kracradio'; // <- clé par défaut (assure-toi que ça match dans data/channels)

export function AudioPlayerProvider({ children }) {
  const audioRef = useRef(null);
  const [current, setCurrent] = useState(null);   // { key, name, streamUrl, apiUrl, image, ... }
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.75);

  // Crée l'élément <audio> une seule fois
  if (!audioRef.current) {
    const a = new Audio();
    a.preload = 'none';            // on n’auto-buf pas
    a.crossOrigin = 'anonymous';   // pratique pour certaines métadonnées/canvas
    audioRef.current = a;
  }

  // Volume réactif
  useEffect(() => {
    audioRef.current.volume = volume;
  }, [volume]);

  // Charger la station par défaut SANS jouer
  useEffect(() => {
    if (current) return; // déjà sélectionné
    const fallback = channels.find(c => c.key === DEFAULT_CHANNEL_KEY) || channels[0];
    if (!fallback) return;

    setCurrent(fallback);
    // Prépare la source mais ne joue pas
    if (audioRef.current.src !== fallback.streamUrl) {
      audioRef.current.src = fallback.streamUrl;
      audioRef.current.preload = 'none'; // on reste “armé” mais silencieux
    }
    setPlaying(false);
  }, [current]);

  // Gestion des events (optionnel mais utile pour garder l’état en phase)
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
        // autoplay bloqué ou erreur navigateur
        console.warn('Lecture bloquée:', e);
      }
    } else {
      a.pause();
      setPlaying(false);
    }
  };

  /**
   * Sélectionne une chaîne et, par défaut, lance la lecture.
   * Utilisation:
   *   playStream(channel)                   // joue auto
   *   playStream(channel, { autoplay:false }) // charge sans jouer
   */
  const playStream = async (channel, opts = {}) => {
    if (!channel) return;
    setCurrent(channel);
    const a = audioRef.current;
    if (a.src !== channel.streamUrl) {
      a.src = channel.streamUrl;
    }
    if (opts.autoplay === false) {
      // ne pas jouer : on met en pause si besoin
      a.pause();
      setPlaying(false);
      return;
    }
    try {
      await a.play();
      setPlaying(true);
    } catch (e) {
      console.warn('Lecture bloquée:', e);
      // reste en pause si le navigateur bloque
      setPlaying(false);
    }
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
      setCurrent, // au cas où tu veux forcer juste la sélection ailleurs
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
