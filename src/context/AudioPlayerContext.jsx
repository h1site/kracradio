import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { channels } from '../data/channels';

const AudioCtx = createContext();

const DEFAULT_CHANNEL_KEY = 'kracradio'; // mets la clé que tu veux par défaut

export function AudioProvider({ children }) {
  const audioRef = useRef(new Audio());
  const [current, setCurrent] = useState(() => {
    const def = channels.find(c => c.key === DEFAULT_CHANNEL_KEY) || channels[0] || null;
    return def || null;
  });
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.9);

  // appliquer volume
  useEffect(() => {
    audioRef.current.volume = volume;
  }, [volume]);

  // précharger la source (sans autoplay)
  useEffect(() => {
    if (current?.streamUrl) {
      audioRef.current.src = current.streamUrl;
    }
  }, [current]);

  const playStream = useCallback((channel) => {
    if (!channel) return;
    const audio = audioRef.current;
    if (current?.streamUrl !== channel.streamUrl) {
      audio.src = channel.streamUrl;
    }
    setCurrent(channel);
    audio.play()
      .then(() => setPlaying(true))
      .catch(() => setPlaying(false));
  }, [current]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (audio.paused) {
      audio.play().then(() => setPlaying(true)).catch(() => {});
    } else {
      audio.pause();
      setPlaying(false);
    }
  }, []);

  const value = useMemo(() => ({
    audioRef,
    current,
    playing,
    volume,
    setVolume,
    playStream,
    togglePlay,
  }), [current, playing, volume, playStream, togglePlay]);

  return <AudioCtx.Provider value={value}>{children}</AudioCtx.Provider>;
}

export function useAudio() {
  return useContext(AudioCtx);
}
