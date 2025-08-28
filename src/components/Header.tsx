"use client";
import React, { useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Menu, X } from 'lucide-react';
import { useAudio } from '@/contexts/AudioContext';
import { useChannels } from '@/lib/useChannels';

// Types
interface SimpleChannel {
  id: string;
  name: string;
  description: string;
  streamUrl: string;
  apiEndpoint: string;
}

interface NowPlayingTrack {
  artist: string;
  title: string;
  album: string;
  artwork: string;
  isLive: boolean;
  streamerName: string;
  listeners: number;
}

const Header: React.FC = () => {
  const { channels, loading: channelsLoading, defaultChannel } = useChannels();
  const { 
    isPlaying, 
    isLoading, 
    isMuted, 
    volume, 
    currentChannel,
    error,
    setChannel,
    togglePlay, 
    toggleMute, 
    setVolume,
    clearError
  } = useAudio();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [nowPlaying, setNowPlaying] = useState<NowPlayingTrack>({
    artist: "KracRadio",
    title: "Chargement...",
    album: "",
    artwork: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop",
    isLive: false,
    streamerName: "",
    listeners: 0
  });

  // Initialize with default channel
  useEffect(() => {
    if (defaultChannel && !currentChannel) {
      const simpleChannel: SimpleChannel = {
        id: defaultChannel.id,
        name: defaultChannel.name,
        description: defaultChannel.description,
        streamUrl: defaultChannel.streamUrl,
        apiEndpoint: defaultChannel.apiEndpoint
      };
      setChannel(simpleChannel);
    }
  }, [defaultChannel, currentChannel, setChannel]);

  // Mock data rotation
  useEffect(() => {
    const tracks = [
      { artist: "Artist 1", title: "Titre en Direct" },
      { artist: "Artist 2", title: "Musique Live" },
      { artist: "KracRadio", title: "Émission Spéciale" }
    ];

    const interval = setInterval(() => {
      const randomTrack = tracks[Math.floor(Math.random() * tracks.length)];
      setNowPlaying({
        ...randomTrack,
        album: "",
        artwork: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop",
        isLive: false,
        streamerName: "",
        listeners: Math.floor(Math.random() * 100) + 50
      });
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const handleChannelChange = (channel: SimpleChannel) => {
    setChannel(channel);
    setIsMenuOpen(false);
    if (error) clearError();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);
  };

  return (
    <>
      <header className="bg-white text-black shadow-2xl border-b border-gray-200">
        {/* Bande supérieure avec logo et contrôles */}
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            
            {/* Logo + Nom de la radio */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <img 
                  src="https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=200&h=60&fit=crop&crop=center" 
                  alt="KracRadio Logo" 
                  className="h-12 w-auto object-contain"
                />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-2xl font-bold text-black">
                  KRACRADIO
                </h1>
                <p className="text-sm text-gray-600">En direct • 24/7</p>
              </div>
            </div>

            {/* Navigation desktop */}
            <nav className="hidden lg:flex space-x-8">
              <a href="#" className="hover:text-pink-400 transition-colors font-medium">Chaînes</a>
              <a href="#" className="hover:text-pink-400 transition-colors font-medium">Horaire</a>
              <a href="#" className="hover:text-pink-400 transition-colors font-medium">Artistes</a>
              <a href="#" className="hover:text-pink-400 transition-colors font-medium">Podcasts</a>
              <a href="#" className="hover:text-pink-400 transition-colors font-medium">Playlists</a>
              <a href="#" className="hover:text-pink-400 transition-colors font-medium">Boutique</a>
              <a href="#" className="hover:text-pink-400 transition-colors font-medium">Contact</a>
            </nav>

            {/* Contrôles audio + menu mobile */}
            <div className="flex items-center space-x-4">
              
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
                disabled={isLoading || !currentChannel}
                className="bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white p-3 rounded-full shadow-lg transition-all transform hover:scale-105 disabled:hover:scale-100"
                title={isPlaying ? "Pause" : `Lecture ${currentChannel?.name || 'Sélectionnez une chaîne'}`}
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : isPlaying ? (
                  <Pause className="w-6 h-6" fill="white" />
                ) : (
                  <Play className="w-6 h-6" fill="white" />
                )}
              </button>

              {/* Menu hamburger mobile */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-full transition-colors text-black"
              >
                {isMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Barre d'informations avec Now Playing et sélecteur de chaînes */}
        <div className="bg-gray-50 border-t border-gray-200">
          <div className="container mx-auto px-4 py-2">
            <div className="flex items-center justify-between">
              
              {/* Info Now Playing */}
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <img 
                  src={nowPlaying.artwork} 
                  alt="Now Playing" 
                  className="w-10 h-10 rounded-lg object-cover shadow-sm"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2">
                    <p className="font-medium text-gray-900 truncate">
                      {nowPlaying.title}
                    </p>
                    {nowPlaying.isLive && (
                      <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                        LIVE
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 truncate">
                    {nowPlaying.artist}
                    {currentChannel && ` • ${currentChannel.name}`}
                    {nowPlaying.listeners > 0 && ` • ${nowPlaying.listeners} auditeurs`}
                  </p>
                </div>
              </div>

              {/* Sélecteur de chaînes (desktop) */}
              <div className="hidden md:flex items-center space-x-2">
                {!channelsLoading && channels.map((channel) => {
                  const simpleChannel: SimpleChannel = {
                    id: channel.id,
                    name: channel.name,
                    description: channel.description,
                    streamUrl: channel.streamUrl,
                    apiEndpoint: channel.apiEndpoint
                  };
                  
                  return (
                    <button
                      key={channel.id}
                      onClick={() => handleChannelChange(simpleChannel)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        currentChannel?.id === channel.id
                          ? 'bg-red-500 text-white' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      title={channel.description}
                    >
                      {channel.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm">{error}</p>
              <button 
                onClick={clearError}
                className="text-red-500 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Menu mobile overlay */}
      {isMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50">
          <div className="fixed top-0 right-0 h-full w-80 bg-white shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Menu</h2>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-4">
              {/* Navigation mobile */}
              <nav className="space-y-4 mb-6">
                <a href="#" className="block py-2 text-gray-700 hover:text-pink-400 transition-colors">Chaînes</a>
                <a href="#" className="block py-2 text-gray-700 hover:text-pink-400 transition-colors">Horaire</a>
                <a href="#" className="block py-2 text-gray-700 hover:text-pink-400 transition-colors">Artistes</a>
                <a href="#" className="block py-2 text-gray-700 hover:text-pink-400 transition-colors">Podcasts</a>
                <a href="#" className="block py-2 text-gray-700 hover:text-pink-400 transition-colors">Playlists</a>
                <a href="#" className="block py-2 text-gray-700 hover:text-pink-400 transition-colors">Boutique</a>
                <a href="#" className="block py-2 text-gray-700 hover:text-pink-400 transition-colors">Contact</a>
              </nav>

              {/* Sélecteur de chaînes mobile */}
              <div className="space-y-2">
                <h3 className="font-medium text-gray-900 mb-3">Chaînes</h3>
                {!channelsLoading && channels.map((channel) => {
                  const simpleChannel: SimpleChannel = {
                    id: channel.id,
                    name: channel.name,
                    description: channel.description,
                    streamUrl: channel.streamUrl,
                    apiEndpoint: channel.apiEndpoint
                  };
                  
                  return (
                    <button
                      key={channel.id}
                      onClick={() => handleChannelChange(simpleChannel)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        currentChannel?.id === channel.id
                          ? 'bg-red-500 text-white' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <div className="font-medium">{channel.name}</div>
                      <div className="text-xs opacity-80">{channel.description}</div>
                    </button>
                  );
                })}
              </div>

              {/* Contrôles volume mobile */}
              <div className="mt-6 pt-4 border-t">
                <h3 className="font-medium text-gray-900 mb-3">Volume</h3>
                <div className="flex items-center space-x-3">
                  <button onClick={toggleMute} className="p-2 hover:bg-gray-100 rounded-full">
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
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none slider"
                  />
                  <span className="text-sm text-gray-600 w-8">{isMuted ? 0 : volume}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
    </>
  );
};

export default Header;