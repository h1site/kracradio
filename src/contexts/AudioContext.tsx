"use client";
import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';

// Types existants de votre code
interface SimpleChannel {
  id: string;
  name: string;
  description: string;
  streamUrl: string;
  apiEndpoint: string;
}

interface AudioState {
  isPlaying: boolean;
  isLoading: boolean;
  isMuted: boolean;
  volume: number;
  currentChannel: SimpleChannel | null;
  error: string | null;
}

interface AudioContextType extends AudioState {
  setChannel: (channel: SimpleChannel) => void;
  togglePlay: () => Promise<void>;
  toggleMute: () => void;
  setVolume: (volume: number) => void;
  clearError: () => void;
}

// Create context
const AudioContext = createContext<AudioContextType | null>(null);

// AudioProvider component
export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AudioState>({
    isPlaying: false,
    isLoading: false,
    isMuted: false,
    volume: 70,
    currentChannel: null,
    error: null
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio when channel changes
  useEffect(() => {
    if (!state.currentChannel) return;

    // Clean up previous audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    // Create new audio element
    audioRef.current = new Audio(state.currentChannel.streamUrl);
    audioRef.current.volume = state.isMuted ? 0 : state.volume / 100;
    audioRef.current.preload = "none";

    // Event listeners
    const handleCanPlay = () => {
      setState(prev => ({ ...prev, isLoading: false }));
    };

    const handleWaiting = () => {
      setState(prev => ({ ...prev, isLoading: true }));
    };

    const handleError = () => {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        isPlaying: false,
        error: `Impossible de charger ${state.currentChannel?.name}` 
      }));
    };

    audioRef.current.addEventListener('canplay', handleCanPlay);
    audioRef.current.addEventListener('waiting', handleWaiting);
    audioRef.current.addEventListener('error', handleError);

    // Cleanup function
    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('canplay', handleCanPlay);
        audioRef.current.removeEventListener('waiting', handleWaiting);
        audioRef.current.removeEventListener('error', handleError);
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [state.currentChannel?.id]);

  // Update audio volume when volume or mute state changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = state.isMuted ? 0 : state.volume / 100;
    }
  }, [state.volume, state.isMuted]);

  // Functions
  const setChannel = useCallback((channel: SimpleChannel) => {
    setState(prev => ({
      ...prev,
      currentChannel: channel,
      error: null,
      isPlaying: false
    }));
  }, []);

  const togglePlay = useCallback(async () => {
    if (!audioRef.current || !state.currentChannel) return;

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      if (state.isPlaying) {
        audioRef.current.pause();
        setState(prev => ({ ...prev, isPlaying: false }));
      } else {
        // Reload stream for fresh content
        audioRef.current.load();
        await audioRef.current.play();
        setState(prev => ({ ...prev, isPlaying: true }));
      }
    } catch (error) {
      console.error('Erreur lors de la lecture:', error);
      setState(prev => ({ 
        ...prev, 
        isPlaying: false,
        error: `Impossible de lancer ${state.currentChannel?.name}. Vérifiez votre connexion.`
      }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [state.isPlaying, state.currentChannel]);

  const toggleMute = useCallback(() => {
    setState(prev => ({ ...prev, isMuted: !prev.isMuted }));
  }, []);

  const setVolume = useCallback((volume: number) => {
    setState(prev => ({ 
      ...prev, 
      volume,
      isMuted: volume === 0 
    }));
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const contextValue: AudioContextType = {
    ...state,
    setChannel,
    togglePlay,
    toggleMute,
    setVolume,
    clearError
  };

  return (
    <AudioContext.Provider value={contextValue}>
      {children}
    </AudioContext.Provider>
  );
};

// Custom hook to use the audio context
export const useAudio = (): AudioContextType => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};

export default AudioContext;