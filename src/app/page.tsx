'use client';

import React, { useState } from 'react';
import Header from '@/components/Header';
import AudioPlayer from '@/components/AudioPlayer';
import NowPlayingAzuraCast from '@/components/NowPlayingAzuraCast';
import ChannelSelector from '@/components/ChannelSelector';
import { Radio, Music, Mic, Headphones, Zap, Disc } from 'lucide-react';

// Types
interface SimpleChannel {
  id: string;
  name: string;
  description: string;
  streamUrl: string;
  apiEndpoint: string;
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

// Configuration des chaînes AzuraCast
const AZURACAST_CHANNELS: SimpleChannel[] = [
  {
    id: 'main',
    name: 'KRAC Radio',
    description: 'Hits du moment et classiques',
    streamUrl: 'https://your-azuracast.com/radio/8000/stream', // Remplacez par votre URL
    apiEndpoint: 'https://your-azuracast.com/api/nowplaying/main'
  },
  {
    id: 'rock',
    name: 'KRAC Rock',
    description: 'Rock classique et moderne',
    streamUrl: 'https://your-azuracast.com/radio/8010/stream',
    apiEndpoint: 'https://your-azuracast.com/api/nowplaying/rock'
  },
  {
    id: 'jazz',
    name: 'KRAC Jazz',
    description: 'Jazz et blues',
    streamUrl: 'https://your-azuracast.com/radio/8020/stream',
    apiEndpoint: 'https://your-azuracast.com/api/nowplaying/jazz'
  },
  {
    id: 'electro',
    name: 'KRAC Electro',
    description: 'Musique électronique',
    streamUrl: 'https://your-azuracast.com/radio/8030/stream',
    apiEndpoint: 'https://your-azuracast.com/api/nowplaying/electro'
  }
];

// Conversion des chaînes pour le ChannelSelector
const channelsForSelector = AZURACAST_CHANNELS.map((channel, index) => ({
  ...channel,
  slug: channel.name.toLowerCase().replace(/\s+/g, '-'),
  icon: index === 0 ? <Radio className="w-4 h-4" /> : 
        index === 1 ? <Music className="w-4 h-4" /> :
        index === 2 ? <Disc className="w-4 h-4" /> :
        <Zap className="w-4 h-4" />,
  color: index === 0 ? 'red' : 
         index === 1 ? 'blue' : 
         index === 2 ? 'green' : 
         'purple',
  isActive: index === 0,
  order: index
}));

export default function Home() {
  // État pour la chaîne courante (format ChannelConfig pour Header)
  const [currentChannel, setCurrentChannel] = useState<ChannelConfig>({
    id: AZURACAST_CHANNELS[0].id,
    name: AZURACAST_CHANNELS[0].name,
    streamUrl: AZURACAST_CHANNELS[0].streamUrl,
    slug: AZURACAST_CHANNELS[0].name.toLowerCase().replace(/\s+/g, '-'),
    icon: 'Radio',
    isActive: true,
    order: 0
  });

  // Conversion vers SimpleChannel pour AudioPlayer
  const currentSimpleChannel: SimpleChannel = {
    id: currentChannel.id,
    name: currentChannel.name,
    description: AZURACAST_CHANNELS.find(ch => ch.id === currentChannel.id)?.description || '',
    streamUrl: currentChannel.streamUrl,
    apiEndpoint: AZURACAST_CHANNELS.find(ch => ch.id === currentChannel.id)?.apiEndpoint || ''
  };

  // Handler pour changement de chaîne depuis ChannelSelector
  const handleChannelChange = (channel: any) => {
    const channelConfig: ChannelConfig = {
      id: channel.id,
      name: channel.name,
      streamUrl: channel.streamUrl || AZURACAST_CHANNELS.find(ch => ch.id === channel.id)?.streamUrl || '',
      slug: channel.slug || channel.name.toLowerCase().replace(/\s+/g, '-'),
      icon: 'Radio',
      isActive: true,
      order: channel.order || 0
    };
    
    setCurrentChannel(channelConfig);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header avec contrôles */}
      <Header 
        currentChannel={currentChannel}
        setCurrentChannel={setCurrentChannel}
      />

      {/* Now Playing AzuraCast - Barre fixe sous le header */}
      <NowPlayingAzuraCast 
        apiUrl={currentSimpleChannel.apiEndpoint}
        className="sticky top-0 z-40"
        variant="header"
        showActions={true}
        showListeners={true}
        onTrackChange={(track) => {
          console.log('Nouveau titre:', track);
        }}
      />

      {/* Contenu principal */}
      <main className="container mx-auto px-4 py-8">
        {/* Sélecteur de chaînes */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Choisissez votre station</h2>
          
          {/* Version desktop - tabs */}
          <ChannelSelector 
            channels={channelsForSelector}
            currentChannel={channelsForSelector.find(ch => ch.id === currentChannel.id) || channelsForSelector[0]}
            onChannelChange={handleChannelChange}
            variant="tabs"
            className="mb-4"
          />

          {/* Version mobile - slider */}
          <ChannelSelector 
            channels={channelsForSelector}
            currentChannel={channelsForSelector.find(ch => ch.id === currentChannel.id) || channelsForSelector[0]}
            onChannelChange={handleChannelChange}
            variant="slider"
            className="lg:hidden"
          />
        </div>

        {/* Player audio principal */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold mb-2">En cours de lecture</h3>
              <p className="text-gray-600">{currentSimpleChannel.name}</p>
              <p className="text-sm text-gray-500">{currentSimpleChannel.description}</p>
            </div>
            
            <AudioPlayer 
              currentChannel={currentSimpleChannel}
              className="flex-shrink-0"
            />
          </div>
        </div>

        {/* Informations sur les chaînes */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {AZURACAST_CHANNELS.map((channel, index) => (
            <div key={channel.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-3">
                {index === 0 ? <Radio className="w-8 h-8 text-red-500" /> :
                 index === 1 ? <Music className="w-8 h-8 text-blue-500" /> :
                 index === 2 ? <Disc className="w-8 h-8 text-green-500" /> :
                 <Zap className="w-8 h-8 text-purple-500" />}
                <h3 className="ml-3 font-semibold">{channel.name}</h3>
              </div>
              <p className="text-gray-600 text-sm mb-4">{channel.description}</p>
              <button
                onClick={() => handleChannelChange({...channel, slug: channel.name.toLowerCase().replace(/\s+/g, '-'), order: index})}
                className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                  currentChannel.id === channel.id
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {currentChannel.id === channel.id ? 'En cours' : 'Écouter'}
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}