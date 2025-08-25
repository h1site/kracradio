import React, { useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Menu, X, Heart, Share2 } from 'lucide-react';

const RadioHeader = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(70);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [nowPlaying, setNowPlaying] = useState({
    artist: "Daft Punk",
    title: "Get Lucky",
    album: "Random Access Memories",
    artwork: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop"
  });

  // Simulation du "Now Playing" qui se met à jour
  useEffect(() => {
    const tracks = [
      { artist: "Daft Punk", title: "Get Lucky", album: "Random Access Memories" },
      { artist: "The Weeknd", title: "Blinding Lights", album: "After Hours" },
      { artist: "Billie Eilish", title: "bad guy", album: "When We All Fall Asleep" },
    ];
    
    const interval = setInterval(() => {
      const randomTrack = tracks[Math.floor(Math.random() * tracks.length)];
      setNowPlaying({
        ...randomTrack,
        artwork: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop"
      });
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);
    if (newVolume === 0) {
      setIsMuted(true);
    } else {
      setIsMuted(false);
    }
  };

  return (
    <header className="bg-white text-black shadow-2xl border-b border-gray-200">
      {/* Bande supérieure avec logo et contrôles */}
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          
          {/* Logo + Nom de la radio */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <img 
                src="https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=200&h=60&fit=crop&crop=center" 
                alt="KRAC RADIO Logo" 
                className="h-12 w-auto object-contain"
              />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-2xl font-bold text-black">
                KRAC RADIO
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
              />
              <span className="text-sm text-gray-600 w-8">{isMuted ? 0 : volume}</span>
            </div>

            {/* Bouton Play/Pause principal */}
            <button
              onClick={togglePlay}
              className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-full shadow-lg transition-all transform hover:scale-105"
            >
              {isPlaying ? (
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
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Barre "Now Playing" */}
      <div className="bg-gray-50 border-t border-gray-200">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            
            {/* Infos du titre en cours */}
            <div className="flex items-center space-x-4 flex-1 min-w-0">
              <img
                src={nowPlaying.artwork}
                alt="Pochette"
                className="w-12 h-12 rounded-lg object-cover shadow-lg"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium text-red-400 uppercase tracking-wide">En Direct</span>
                </div>
                <p className="font-semibold text-black truncate">{nowPlaying.title}</p>
                <p className="text-sm text-gray-600 truncate">{nowPlaying.artist}</p>
              </div>
            </div>

            {/* Actions du titre */}
            <div className="hidden sm:flex items-center space-x-3">
              <button className="p-2 hover:bg-gray-200 rounded-full transition-colors group">
                <Heart className="w-5 h-5 group-hover:text-red-500" />
              </button>
              <button className="p-2 hover:bg-gray-200 rounded-full transition-colors group">
                <Share2 className="w-5 h-5 group-hover:text-blue-500" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Menu mobile */}
      {isMenuOpen && (
        <div className="lg:hidden bg-gray-50 border-t border-gray-200">
          <nav className="container mx-auto px-4 py-4 space-y-4">
            <a href="#" className="block py-2 hover:text-red-500 transition-colors font-medium">Chaînes</a>
            <a href="#" className="block py-2 hover:text-red-500 transition-colors font-medium">Horaire</a>
            <a href="#" className="block py-2 hover:text-red-500 transition-colors font-medium">Artistes</a>
            <a href="#" className="block py-2 hover:text-red-500 transition-colors font-medium">Podcasts</a>
            <a href="#" className="block py-2 hover:text-red-500 transition-colors font-medium">Playlists</a>
            <a href="#" className="block py-2 hover:text-red-500 transition-colors font-medium">Boutique</a>
            <a href="#" className="block py-2 hover:text-red-500 transition-colors font-medium">Contact</a>
            
            {/* Contrôles volume mobile */}
            <div className="flex items-center space-x-3 pt-4 border-t border-gray-200">
              <button onClick={toggleMute}>
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-5 h-5 text-black" />
                ) : (
                  <Volume2 className="w-5 h-5 text-black" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none"
              />
              <span className="text-sm text-gray-600 w-8">{isMuted ? 0 : volume}</span>
            </div>
          </nav>
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
    </header>
  );
};

export default RadioHeader;