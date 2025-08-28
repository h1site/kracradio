'use client';

import React, { createContext, useContext, useRef, useState, useEffect, ReactNode } from 'react';

// Types pour le contexte audio
export interface ChannelConfig {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  streamUrl: string;
  apiEndpoint: string | null;
  icon: string;
  isActive: boolean;
  order: number;
}

export interface NowPlayingInfo {
  title: string;
  artist: string;
  album?: string;
  artwork?: string;
}

interface AudioContextType {
  // État du lecteur
  isPlaying: boolean;
  isLoading: boolean;
  volume: number;
  isMuted: boolean;
  
  // Chaîne actuelle
  currentChannel: ChannelConfig | null;
  nowPlaying: NowPlayingInfo | null;
  
  // Actions
  play: () => Promise<void>;
  pause: () => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  changeChannel: (channel: ChannelConfig) => Promise<void>;
  
  // Référence audio pour contrôles avancés - Type corrigé
  audioRef: React.RefObject<HTMLAudioElement | null>;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const useAudio = (): AudioContextType => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};

interface AudioProviderProps {
  children: ReactNode;
}

export const AudioProvider: React.FC<AudioProviderProps> = ({ children }) => {
  // État du lecteur
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [volume, setVolumeState] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  
  // État de la chaîne et du contenu
  const [currentChannel, setCurrentChannel] = useState<ChannelConfig | null>(null);
  const [nowPlaying, setNowPlaying] = useState<NowPlayingInfo | null>(null);
  
  // Référence à l'élément audio - Type corrigé
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Référence pour l'intervalle de mise à jour Now Playing
  const nowPlayingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fonction pour récupérer les infos Now Playing
  const updateNowPlaying = async (channel: ChannelConfig) => {
    if (!channel.apiEndpoint) return;
    
    try {
      // Extraire le numéro de station depuis l'apiEndpoint
      const stationMatch = channel.apiEndpoint.match(/\/nowplaying\/(\d+)/);
      const station = stationMatch ? stationMatch[1] : '5';
      
      const response = await fetch(`/api/nowplaying?station=${station}`);
      const data = await response.json();
      
      if (data.success !== false && data.now_playing?.song) {
        setNowPlaying({
          title: data.now_playing.song.title || 'Titre inconnu',
          artist: data.now_playing.song.artist || 'Artiste inconnu',
          album: data.now_playing.song.album || '',
          artwork: data.now_playing.song.art || ''
        });
      }
    } catch (error) {
      console.warn('Failed to update now playing:', error);
    }
  };

  // Fonction pour démarrer la lecture
  const play = async (): Promise<void> => {
    if (!audioRef.current || !currentChannel) return;
    
    try {
      setIsLoading(true);
      await audioRef.current.play();
      setIsPlaying(true);
    } catch (error) {
      console.error('Failed to play audio:', error);
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour mettre en pause
  const pause = (): void => {
    if (!audioRef.current) return;
    
    audioRef.current.pause();
    setIsPlaying(false);
  };

  // Fonction pour changer le volume
  const setVolume = (newVolume: number): void => {
    const clampedVolume = Math.max(0, Math.min(100, newVolume));
    setVolumeState(clampedVolume);
    
    if (audioRef.current) {
      audioRef.current.volume = clampedVolume / 100;
    }
    
    // Si on remet du volume, désactiver mute
    if (clampedVolume > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  // Fonction pour toggle mute
  const toggleMute = (): void => {
    if (!audioRef.current) return;
    
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    audioRef.current.muted = newMuted;
  };

  // Fonction pour changer de chaîne
  const changeChannel = async (channel: ChannelConfig): Promise<void> => {
    const wasPlaying = isPlaying;
    
    // Arrêter la lecture actuelle
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
    
    // Arrêter l'intervalle de mise à jour précédent
    if (nowPlayingIntervalRef.current) {
      clearInterval(nowPlayingIntervalRef.current);
      nowPlayingIntervalRef.current = null;
    }
    
    // Changer la chaîne
    setCurrentChannel(channel);
    setNowPlaying(null);
    
    // Configurer le nouvel audio
    if (audioRef.current) {
      audioRef.current.src = channel.streamUrl;
      audioRef.current.load();
    }
    
    // Reprendre la lecture si elle était active
    if (wasPlaying) {
      await play();
    }
    
    // Démarrer la mise à jour des infos Now Playing
    await updateNowPlaying(channel);
    nowPlayingIntervalRef.current = setInterval(() => {
      updateNowPlaying(channel);
    }, 15000); // Toutes les 15 secondes
  };

  // Effet pour configurer l'audio au montage
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    // Configuration initiale
    audio.volume = volume / 100;
    audio.muted = isMuted;
    audio.preload = 'none';
    
    // Event listeners avec types corrects
    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);
    const handleError = (e: Event) => {
      console.error('Audio error:', e);
      setIsPlaying(false);
      setIsLoading(false);
    };
    
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    
    return () => {
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [volume, isMuted]);

  // Nettoyage à la fermeture
  useEffect(() => {
    return () => {
      if (nowPlayingIntervalRef.current) {
        clearInterval(nowPlayingIntervalRef.current);
      }
    };
  }, []);

  // Sauvegarder l'état dans localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('kracradio-volume', volume.toString());
      localStorage.setItem('kracradio-muted', isMuted.toString());
      if (currentChannel) {
        localStorage.setItem('kracradio-channel', JSON.stringify(currentChannel));
      }
    }
  }, [volume, isMuted, currentChannel]);

  // Restaurer l'état depuis localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedVolume = localStorage.getItem('kracradio-volume');
      const savedMuted = localStorage.getItem('kracradio-muted');
      const savedChannel = localStorage.getItem('kracradio-channel');
      
      if (savedVolume) {
        setVolumeState(parseInt(savedVolume));
      }
      
      if (savedMuted) {
        setIsMuted(savedMuted === 'true');
      }
      
      if (savedChannel) {
        try {
          const channel = JSON.parse(savedChannel);
          setCurrentChannel(channel);
        } catch (error) {
          console.warn('Failed to parse saved channel:', error);
        }
      }
    }
  }, []);

  const contextValue: AudioContextType = {
    isPlaying,
    isLoading,
    volume,
    isMuted,
    currentChannel,
    nowPlaying,
    play,
    pause,
    setVolume,
    toggleMute,
    changeChannel,
    audioRef // Type maintenant correct
  };

  return (
    <AudioContext.Provider value={contextValue}>
      {children}
      {/* Élément audio global caché */}
      <audio
        ref={audioRef}
        style={{ display: 'none' }}
        crossOrigin="anonymous"
      />
    </AudioContext.Provider>
  );
};