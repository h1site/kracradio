"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

// Types simplifiés
interface SimpleChannel {
  id: string;
  name: string;
  description: string;
  streamUrl: string;
  apiEndpoint: string;
}

interface AudioPlayerProps {
  currentChannel: SimpleChannel;
  onChannelChange?: (channel: SimpleChannel) => void;
  className?: string;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ 
  currentChannel,
  onChannelChange,
  className = "" 
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(70);
  const [isLoading, setIsLoading] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialiser l'audio
  useEffect(() => {
    if (!currentChannel) return;

    // Créer l'élément audio
    audioRef.current = new Audio(currentChannel.streamUrl);
    audioRef.current.volume = volume / 100;
    audioRef.current.preload = "none";

    // Event listeners
    const handleCanPlay = () => setIsLoading(false);
    const handleWaiting = () => setIsLoading(true);
    const handleError = () => {
      setIsLoading(false);
      setIsPlaying(false);
      console.error('Erreur de lecture audio');
    };

    audioRef.current.addEventListener('canplay', handleCanPlay);
    audioRef.current.addEventListener('waiting', handleWaiting);
    audioRef.current.addEventListener('error', handleError);

    // Cleanup
    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('canplay', handleCanPlay);
        audioRef.current.removeEventListener('waiting', handleWaiting);
        audioRef.current.removeEventListener('error', handleError);
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [currentChannel?.id]); // Re-run quand la chaîne change

  // Gestion du volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted]);

  const togglePlay = async () => {
    if (!audioRef.current) return;

    try {
      setIsLoading(true);
      
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        // Recharger le stream pour avoir le contenu le plus récent
        audioRef.current.load();
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Erreur lors de la lecture:', error);
      alert(`Impossible de lancer ${currentChannel.name}. Vérifiez votre connexion.`);
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);
    if (newVolume === 0) {
      setIsMuted(true);
    } else {
      setIsMuted(false);
    }
  };

  if (!currentChannel) return null;

  return (
    <div className={`flex items-center space-x-4 ${className}`}>
      {/* Contrôles de volume (desktop) */}
      <div className="hidden md:flex items-center space-x-3">
        <button 
          onClick={toggleMute}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors text-black"
          title={isMuted ? "Réactiver le son" : "Couper le son"}
        >
          {isMuted || volume === 0 ? (
            <VolumeX className="w-5 h-5" />
          ) : (
            <Volume2 className="w-5 h-5" />
          )}
        </button>
        <input
          type="range"
          min="0"
          max="100"
          value={isMuted ? 0 : volume}
          onChange={handleVolumeChange}
          className="w-20 h-2 bg-gray-200 rounded-lg appearance-none slider"
          title={`Volume: ${isMuted ? 0 : volume}%`}
        />
        <span className="text-sm text-gray-600 w-8">{isMuted ? 0 : volume}</span>
      </div>

      {/* Bouton Play/Pause principal */}
      <button
        onClick={togglePlay}
        disabled={isLoading}
        className="bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white p-3 rounded-full shadow-lg transition-all transform hover:scale-105 disabled:hover:scale-100"
        title={isPlaying ? "Pause" : `Lecture ${currentChannel.name}`}
      >
        {isLoading ? (
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        ) : isPlaying ? (
          <Pause className="w-6 h-6" fill="white" />
        ) : (
          <Play className="w-6 h-6" fill="white" />
        )}
      </button>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #ef4444;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        
        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #ef4444;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
  );
};

export default AudioPlayer;