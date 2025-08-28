'use client';

import React from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Radio, Music, Clock, Users, Headphones, Play, Star, Calendar, Mic, Volume2 } from 'lucide-react';
import { useAudio } from '@/contexts/AudioContext';
import { useChannels } from '@/lib/useChannels';

export default function Home() {
  // Hook audio global pour la continuité - FIX: utiliser les bonnes propriétés
  const { 
    isPlaying, 
    isLoading, 
    currentChannel,
    togglePlay,
    setChannel
  } = useAudio();
  
  // Hook pour récupérer les chaînes - CORRIGÉ: utiliser 'json' au lieu de 'db'
  const { channels, loading: channelsLoading } = useChannels({
    source: 'json'
  });

  // Filtrer les chaînes actives côté client
  const activeChannels = channels.filter(channel => channel.isActive);

  const handlePlayClick = async () => {
    if (!currentChannel && activeChannels.length > 0) {
      // Si aucune chaîne sélectionnée, prendre KracRadio par défaut
      const defaultChannel = activeChannels.find(ch => ch.slug === 'kracradio') || activeChannels[0];
      // FIX: convertir ChannelConfig vers SimpleChannel format attendu par setChannel
      const simpleChannel = {
        id: defaultChannel.id,
        name: defaultChannel.name,
        description: defaultChannel.description,
        streamUrl: defaultChannel.streamUrl,
        apiEndpoint: defaultChannel.apiEndpoint
      };
      setChannel(simpleChannel);
    } else if (currentChannel) {
      await togglePlay();
    }
  };

  // Mock nowPlaying data since it's not in AudioContext
  const nowPlaying = {
    artist: "En cours...",
    title: "Radio en direct"
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-red-500 to-pink-600 text-white py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Bienvenue sur KracRadio
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-red-100">
              Votre station radio 24/7 - 7 chaînes musicales en direct
            </p>
            
            {/* Status actuel de la radio */}
            {currentChannel && (
              <div className="bg-white bg-opacity-20 rounded-lg p-4 mb-6 max-w-md mx-auto">
                <div className="flex items-center justify-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${isPlaying ? 'bg-green-400 animate-pulse' : 'bg-gray-300'}`} />
                  <div className="text-white">
                    <div className="font-semibold">
                      {isPlaying ? 'En cours' : 'En pause'} • {currentChannel.name}
                    </div>
                    <div className="text-sm text-red-100">
                      {nowPlaying.artist} - {nowPlaying.title}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={handlePlayClick}
                disabled={isLoading || activeChannels.length === 0}
                className="bg-white text-red-500 px-8 py-4 rounded-full font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center space-x-2 shadow-lg disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                    <span>Chargement...</span>
                  </>
                ) : isPlaying ? (
                  <>
                    <div className="w-5 h-5 flex items-center justify-center">
                      <div className="w-2 h-4 bg-red-500 mr-1"></div>
                      <div className="w-2 h-4 bg-red-500"></div>
                    </div>
                    <span>En pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" fill="currentColor" />
                    <span>Écouter {currentChannel ? currentChannel.name : 'maintenant'}</span>
                  </>
                )}
              </button>
              <Link 
                href="/schedule"
                className="border-2 border-white text-white px-8 py-4 rounded-full font-semibold hover:bg-white hover:text-red-500 transition-colors flex items-center justify-center space-x-2"
              >
                <Calendar className="w-5 h-5" />
                <span>Voir l'horaire</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Radio className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-2">24/7</h3>
                <p className="text-gray-600">En direct</p>
              </div>
              <div className="text-center">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Music className="w-8 h-8 text-blue-500" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-2">7</h3>
                <p className="text-gray-600">Chaînes musicales</p>
              </div>
              <div className="text-center">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-2">24h</h3>
                <p className="text-gray-600">Streaming continu</p>
              </div>
              <div className="text-center">
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Volume2 className="w-8 h-8 text-purple-500" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-2">HD</h3>
                <p className="text-gray-600">Qualité audio</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Pourquoi choisir KracRadio ?
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Découvrez une expérience radio unique avec nos 7 chaînes spécialisées et notre streaming continu
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                <div className="bg-red-100 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                  <Headphones className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Streaming Continu</h3>
                <p className="text-gray-600">
                  Navigation sans interruption - la musique continue même quand vous changez de page sur le site.
                </p>
              </div>

              <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                  <Clock className="w-6 h-6 text-blue-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">7 Chaînes Spécialisées</h3>
                <p className="text-gray-600">
                  Rock, Metal, Electro, Jazz, Francophone, EBM Industrial - trouvez votre style musical préféré.
                </p>
              </div>

              <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                  <Star className="w-6 h-6 text-green-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Interface Moderne</h3>
                <p className="text-gray-600">
                  Design responsive et intuitif avec contrôles audio avancés et sauvegarde des préférences.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Current Channels Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Nos Chaînes Musicales
              </h2>
              <p className="text-xl text-gray-600">
                Découvrez nos 7 chaînes spécialisées disponibles 24h/24
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-red-500 to-pink-600 text-white p-6 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold">KracRadio</h3>
                  <div className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm">
                    Principal
                  </div>
                </div>
                <p className="text-red-100 mb-4">
                  Notre chaîne principale avec un mix éclectique de tous les styles musicaux.
                </p>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm">En direct</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white p-6 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold">EBM Industrial</h3>
                  <div className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm">
                    Goth
                  </div>
                </div>
                <p className="text-purple-100 mb-4">
                  Musique industrielle, EBM et darkwave pour les amateurs de sons sombres.
                </p>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm">En direct</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white p-6 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold">Francophone</h3>
                  <div className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm">
                    🇫🇷
                  </div>
                </div>
                <p className="text-blue-100 mb-4">
                  La belle francophonie mise à l'honneur avec les meilleurs artistes francophones.
                </p>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm">En direct</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-500 to-red-600 text-white p-6 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold">Métal</h3>
                  <div className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm">
                    🤘
                  </div>
                </div>
                <p className="text-orange-100 mb-4">
                  Du heavy au death metal - garoche ta tête sur les meilleurs riffs !
                </p>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm">En direct</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white p-6 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold">Electro</h3>
                  <div className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm">
                    🎛️
                  </div>
                </div>
                <p className="text-cyan-100 mb-4">
                  Techno, house et électro pour faire danser et vibrer vos soirées.
                </p>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm">En direct</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-500 to-orange-600 text-white p-6 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold">Jazz & Rock</h3>
                  <div className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm">
                    🎷🎸
                  </div>
                </div>
                <p className="text-amber-100 mb-4">
                  Jazz pour la détente et Rock qui gaz - deux ambiances complémentaires.
                </p>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm">En direct</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-r from-gray-900 to-gray-800 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold mb-6">
              Rejoignez la communauté KracRadio
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Écoutez vos chaînes préférées, découvrez de nouveaux genres et profitez d'une expérience radio moderne et sans interruption.
            </p>
            
            {/* Indication radio continue */}
            <div className="bg-white bg-opacity-10 rounded-lg p-4 mb-8 max-w-md mx-auto">
              <div className="flex items-center justify-center space-x-2 text-sm">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>🎵 La radio continue pendant que vous naviguez !</span>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/contact"
                className="bg-red-500 hover:bg-red-600 text-white px-8 py-4 rounded-full font-semibold transition-colors"
              >
                Nous contacter
              </Link>
              <Link 
                href="/about"
                className="border-2 border-gray-300 text-gray-300 hover:bg-white hover:text-gray-900 px-8 py-4 rounded-full font-semibold transition-colors"
              >
                En savoir plus
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer Component */}
      <Footer />
    </div>
  );
}