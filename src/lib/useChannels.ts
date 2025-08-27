"use client";
import { useState, useEffect } from 'react';

// Types simplifiés pour la configuration des chaînes
export interface ChannelConfig {
  id: string;
  name: string;
  slug: string;
  description: string;
  streamUrl: string;
  apiEndpoint: string;
  icon: string;
  isActive: boolean;
  order: number;
}

interface UseChannelsOptions {
  source?: 'json' | 'api' | 'db';
  configPath?: string;
  apiUrl?: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // en ms
}

export function useChannels(options: UseChannelsOptions = {}) {
  const {
    source = 'json',
    configPath = '/config/channels.json',
    apiUrl = '/api/channels',
    autoRefresh = false,
    refreshInterval = 300000 // 5 minutes
  } = options;

  const [channels, setChannels] = useState<ChannelConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Configuration par défaut en cas d'erreur
  const getFallbackChannels = (): ChannelConfig[] => {
    return [
      {
        id: 'kracradio',
        name: 'KracRadio',
        slug: 'kracradio',
        description: 'Channel Primaire',
        streamUrl: 'https://stream.kracradio.com/listen/new_krav_eho/radio.mp3',
        apiEndpoint: 'https://stream.kracradio.com/api/nowplaying/5',
        icon: 'radio',
        isActive: true,
        order: 1
      },
      {
        id: 'ebm-industrial',
        name: 'EBM Industrial',
        slug: 'ebm-industrial',
        description: 'Musique Goth',
        streamUrl: 'https://stream.kracradio.com:8000/radio.mp3',
        apiEndpoint: 'https://stream.kracradio.com/api/nowplaying/1',
        icon: 'disc',
        isActive: true,
        order: 2
      }
    ];
  };

  // Charger depuis JSON avec meilleur error handling
  const loadFromJSON = async (path: string): Promise<ChannelConfig[]> => {
    try {
      const response = await fetch(path, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        console.warn(`⚠️ Fichier ${path} non trouvé (${response.status}), utilisation du fallback`);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`✅ Fichier JSON chargé depuis ${path}`);
      return data.channels || data;
    } catch (error) {
      console.warn(`⚠️ Erreur chargement JSON ${path}:`, error);
      throw error;
    }
  };

  // Charger depuis API
  const loadFromAPI = async (url: string): Promise<ChannelConfig[]> => {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.channels || data;
  };

  // Charger depuis base de données (via API Next.js)
  const loadFromDatabase = async (): Promise<ChannelConfig[]> => {
    const response = await fetch('/api/admin/channels', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const { channels } = await response.json();
    return channels;
  };

  const loadChannels = async () => {
    try {
      setLoading(true);
      setError(null);

      let loadedChannels: ChannelConfig[];

      switch (source) {
        case 'json':
          loadedChannels = await loadFromJSON(configPath);
          break;
        case 'api':
          loadedChannels = await loadFromAPI(apiUrl);
          break;
        case 'db':
          loadedChannels = await loadFromDatabase();
          break;
        default:
          loadedChannels = await loadFromJSON(configPath);
      }

      // Filtrer et trier
      const activeChannels = loadedChannels
        .filter((channel: ChannelConfig) => channel.isActive)
        .sort((a: ChannelConfig, b: ChannelConfig) => a.order - b.order);

      setChannels(activeChannels);
      setLastUpdated(new Date());
      console.log(`✅ ${activeChannels.length} chaînes chargées depuis ${source}`);
      
    } catch (err) {
      console.error(`❌ Erreur chargement config ${source}:`, err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      
      // Utiliser la config par défaut en cas d'erreur
      setChannels(getFallbackChannels());
    } finally {
      setLoading(false);
    }
  };

  // Chargement initial
  useEffect(() => {
    loadChannels();
  }, [source, configPath, apiUrl]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(loadChannels, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  // Calculer la chaîne par défaut (première active par ordre)
  const defaultChannel = channels.find(c => c.isActive) || channels[0];

  return {
    channels,
    loading,
    error,
    lastUpdated,
    reload: loadChannels,
    defaultChannel
  };
}