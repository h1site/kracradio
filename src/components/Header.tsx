'use client';

import React, { useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Menu, X, Radio, Zap, Music, Headphones, Disc, Home } from 'lucide-react';
import { useChannels } from '@/lib/useChannels';
import ChannelSelector from '@/components/ChannelSelector';
import NowPlayingAzuraCast from '@/components/NowPlayingAzuraCast';
import AudioPlayer from '@/components/AudioPlayer';
import { useRouter } from 'next/navigation';

// Types simplifiés pour la compatibilité
interface SimpleChannel {
  id: string;
  name: string;
  description: string; // Required - pas optionnel pour éviter les conflits de types
  streamUrl: string;
  apiEndpoint: string;
  icon: React.ReactNode;
}

interface ChannelConfig {
  id: string;
  name: string;
  streamUrl: string;
  slug: string;
  icon: string;
  isActive: boolean;
  order: number;
}

interface HeaderProps {
  setCurrentChannel?: (channel: ChannelConfig | null) => void;
  currentChannel?: ChannelConfig | null;
}

// Fonction pour mapper les icônes
const getChannelIcon = (iconName: string) => {
  const icons = {
    radio: <Radio className="w-4 h-4" />,
    disc: <Disc className="w-4 h-4" />,
    music: <Music className="w-4 h-4" />,
    zap: <Zap className="w-4 h-4" />,
    headphones: <Headphones className="w-4 h-4" />
  };
  return icons[iconName as keyof typeof icons] || <Radio className="w-4 h-4" />;
};

// Fonction pour extraire le numéro de station de l'URL AzuraCast
const getStationNumberFromUrl = (apiEndpoint: string): string => {
  // Extraire le numéro de station de URLs comme:
  // https://stream.kracradio.com/api/nowplaying/5
  const match = apiEndpoint.match(/\/nowplaying\/(\d+)$/);
  return match ? match[1] : '5'; // Par défaut station 5
};

// Fonction pour convertir l'URL AzuraCast en URL proxy locale
const getProxyApiUrl = (apiEndpoint: string): string => {
  const stationNumber = getStationNumberFromUrl(apiEndpoint);
  return `/api/nowplaying?station=${stationNumber}`;
};

const Header: React.FC<HeaderProps> = ({ setCurrentChannel, currentChannel }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [localCurrentChannel, setLocalCurrentChannel] = useState<SimpleChannel | null>(null);
  const router = useRouter();
  
  // Charger les canaux depuis le JSON
  const { channels, loading, error } = useChannels({
    source: 'json',
    configPath: '/config/channels.json'
  });

  // Initialiser le premier canal actif
  useEffect(() => {
    if (channels.length > 0 && !localCurrentChannel) {
      const firstActiveChannel = channels.find(ch => ch.isActive) || channels[0];
      const simpleChannel: SimpleChannel = {
        id: firstActiveChannel.id,
        name: firstActiveChannel.name,
        description: firstActiveChannel.description || '', // Assurer que description n'est jamais undefined
        streamUrl: firstActiveChannel.streamUrl,
        apiEndpoint: firstActiveChannel.apiEndpoint,
        icon: getChannelIcon(firstActiveChannel.icon)
      };
      setLocalCurrentChannel(simpleChannel);
      
      // Mettre à jour le parent si nécessaire
      if (setCurrentChannel) {
        const channelConfig: ChannelConfig = {
          id: firstActiveChannel.id,
          name: firstActiveChannel.name,
          streamUrl: firstActiveChannel.streamUrl,
          slug: firstActiveChannel.slug,
          icon: firstActiveChannel.icon,
          isActive: firstActiveChannel.isActive,
          order: firstActiveChannel.order
        };
        setCurrentChannel(channelConfig);
      }
    }
  }, [channels, localCurrentChannel, setCurrentChannel]);

  // Transformer les channels pour ChannelSelector
  const radioChannels = channels.map(channel => ({
    id: channel.id,
    name: channel.name,
    description: channel.description || '', // Assurer que description n'est jamais undefined
    streamUrl: channel.streamUrl,
    apiEndpoint: channel.apiEndpoint,
    icon: getChannelIcon(channel.icon),
    isActive: channel.isActive,
    order: channel.order
  }));

  // Gestion du changement de canal - Compatible avec RadioChannel
  const handleChannelChange = (channel: any) => {
    const simpleChannel: SimpleChannel = {
      id: channel.id,
      name: channel.name,
      description: channel.description || '', // Assurer que description n'est jamais undefined
      streamUrl: channel.streamUrl,
      apiEndpoint: channel.apiEndpoint,
      icon: channel.icon
    };
    
    setLocalCurrentChannel(simpleChannel);
    
    // Mettre à jour le parent si nécessaire
    if (setCurrentChannel) {
      const channelConfig: ChannelConfig = {
        id: channel.id,
        name: channel.name,
        streamUrl: channel.streamUrl,
        slug: channel.name.toLowerCase().replace(/\s+/g, '-'),
        icon: 'radio',
        isActive: true,
        order: 0
      };
      setCurrentChannel(channelConfig);
    }

    // Le AudioPlayer avec autoPlay={true} va automatiquement démarrer la lecture
    // quand localCurrentChannel change grâce à son useEffect
  };

  // Navigation functions
  const navigateToHome = () => {
    setIsMenuOpen(false); // Fermer le menu mobile si ouvert
    router.push('/');
  };

  const navigateToSchedule = () => {
    setIsMenuOpen(false);
    router.push('/horaire');
  };

  if (loading) {
    return (
      <header className="bg-white text-black shadow-2xl border-b border-gray-200">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
            <span className="ml-2">Chargement des canaux...</span>
          </div>
        </div>
      </header>
    );
  }

  if (error) {
    return (
      <header className="bg-white text-black shadow-2xl border-b border-gray-200">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-center text-red-500">
            <span>Erreur : {error}</span>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white text-black shadow-2xl border-b border-gray-200">
      {/* Bande supérieure avec logo et contrôles */}
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          
          {/* Logo + Sélecteur de canal - Côte à côte */}
          <div className="flex items-center space-x-4">
            <button onClick={navigateToHome} className="hover:opacity-80 transition-opacity">
              <img 
                src="/krac-logo_rgb_vector.png" 
                alt="KracRadio" 
                className="h-12 w-auto object-contain cursor-pointer"
              />
            </button>
            
            {/* Sélecteur de canal proche du logo */}
            <div className="hidden lg:block">
              {localCurrentChannel && (
                <ChannelSelector
                  channels={radioChannels}
                  currentChannel={localCurrentChannel}
                  onChannelChange={handleChannelChange}
                  variant="dropdown"
                  className="min-w-48"
                />
              )}
            </div>
          </div>

          {/* Navigation centrale */}
          <nav className="hidden lg:flex items-center space-x-6">
            <button 
              onClick={navigateToHome}
              className="text-sm font-medium hover:text-red-500 transition-colors flex items-center space-x-1"
            >
              <Home className="w-4 h-4" />
              <span>Accueil</span>
            </button>
            <button 
              onClick={navigateToSchedule}
              className="text-sm font-medium hover:text-red-500 transition-colors"
            >
              Horaire
            </button>
            <a href="#" className="text-sm font-medium hover:text-red-500 transition-colors">Artistes</a>
            <a href="#" className="text-sm font-medium hover:text-red-500 transition-colors">Podcasts</a>
            <a href="#" className="text-sm font-medium hover:text-red-500 transition-colors">Playlists</a>
            <a href="#" className="text-sm font-medium hover:text-red-500 transition-colors">Contact</a>
          </nav>

          {/* Contrôles audio et menu mobile */}
          <div className="flex items-center space-x-4">
            {/* Lecteur audio avec autoplay */}
            {localCurrentChannel && (
              <AudioPlayer 
                currentChannel={localCurrentChannel}
                onChannelChange={handleChannelChange}
                autoPlay={true}
                className="flex items-center space-x-3"
              />
            )}

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

      {/* Barre "Now Playing" avec API proxy (CORRECTION CORS) */}
      {localCurrentChannel && (
        <div className="bg-gray-50 border-t border-gray-200">
          <div className="container mx-auto px-4">
            <NowPlayingAzuraCast
              apiUrl={getProxyApiUrl(localCurrentChannel.apiEndpoint)}
              variant="header"
              showActions={true}
              showListeners={false}
              showProgress={false}
              className="py-3"
            />
          </div>
        </div>
      )}

      {/* Menu mobile avec sélecteur de canal */}
      {isMenuOpen && (
        <div className="lg:hidden bg-gray-50 border-t border-gray-200">
          <div className="container mx-auto px-4 py-4 space-y-4">
            
            {/* Sélecteur de canal mobile */}
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Choisir un canal</h3>
              {localCurrentChannel && (
                <ChannelSelector
                  channels={radioChannels}
                  currentChannel={localCurrentChannel}
                  onChannelChange={handleChannelChange}
                  variant="slider"
                  className="mb-4"
                />
              )}
            </div>

            {/* Navigation mobile */}
            <nav className="space-y-2">
              <button 
                onClick={navigateToHome}
                className="flex items-center space-x-2 py-2 hover:text-red-500 transition-colors font-medium w-full text-left"
              >
                <Home className="w-4 h-4" />
                <span>Accueil</span>
              </button>
              <button 
                onClick={navigateToSchedule}
                className="block py-2 hover:text-red-500 transition-colors font-medium w-full text-left"
              >
                Horaire
              </button>
              <a href="#" className="block py-2 hover:text-red-500 transition-colors font-medium">Artistes</a>
              <a href="#" className="block py-2 hover:text-red-500 transition-colors font-medium">Podcasts</a>
              <a href="#" className="block py-2 hover:text-red-500 transition-colors font-medium">Playlists</a>
              <a href="#" className="block py-2 hover:text-red-500 transition-colors font-medium">Contact</a>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;