'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import './KracRadio.css';

// KracRadio channels configuration
export const KRACRADIO_CHANNELS = [
  {
    key: 'kracradio',
    name: 'KracRadio',
    description: 'Mix eclectique',
    streamUrl: 'https://stream.kracradio.com/listen/kracradio/radio.mp3',
    apiUrl: 'https://stream.kracradio.com/api/nowplaying/1',
    color: '#f472b6'
  },
  {
    key: 'ebm_industrial',
    name: 'EBM / Industrial',
    description: 'Dark electro & industrial',
    streamUrl: 'https://stream.kracradio.com/listen/ebm_industrial/radio.mp3',
    apiUrl: 'https://stream.kracradio.com/api/nowplaying/4',
    color: '#ef4444'
  },
  {
    key: 'electro',
    name: 'Electro',
    description: 'Electronic music',
    streamUrl: 'https://stream.kracradio.com/listen/electro/radio.mp3',
    apiUrl: 'https://stream.kracradio.com/api/nowplaying/7',
    color: '#22d3ee'
  },
  {
    key: 'francophonie',
    name: 'Francophonie',
    description: 'Musique francophone',
    streamUrl: 'https://stream.kracradio.com/listen/franco/radio.mp3',
    apiUrl: 'https://stream.kracradio.com/api/nowplaying/6',
    color: '#3b82f6'
  },
  {
    key: 'jazz',
    name: 'Jazz',
    description: 'Jazz & smooth',
    streamUrl: 'https://stream.kracradio.com/listen/jazz/radio.mp3',
    apiUrl: 'https://stream.kracradio.com/api/nowplaying/2',
    color: '#fbbf24'
  },
  {
    key: 'metal',
    name: 'Metal',
    description: 'Heavy metal & rock',
    streamUrl: 'https://stream.kracradio.com/listen/metal/radio.mp3',
    apiUrl: 'https://stream.kracradio.com/api/nowplaying/5',
    color: '#64748b'
  },
  {
    key: 'rock',
    name: 'Rock',
    description: 'Classic & modern rock',
    streamUrl: 'https://stream.kracradio.com/listen/rock/radio.mp3',
    apiUrl: 'https://stream.kracradio.com/api/nowplaying/8',
    color: '#a855f7'
  }
];

// Audio Manager class for music streaming
class KracRadioManager {
  constructor() {
    this.audioElement = null;
    this.currentChannel = null;
    this.nowPlayingCallback = null;
    this.nowPlayingInterval = null;
    this.lastSongId = null;
    this.musicPlaying = false;
    this.volume = 0.25;
  }

  init() {
    if (this.audioElement) return;
    this.audioElement = new Audio();
    this.audioElement.crossOrigin = 'anonymous';
    this.audioElement.volume = this.volume;
  }

  setNowPlayingCallback(callback) {
    this.nowPlayingCallback = callback;
  }

  async fetchNowPlaying() {
    if (!this.currentChannel?.apiUrl) return null;

    try {
      const response = await fetch(this.currentChannel.apiUrl);
      const data = await response.json();

      if (data?.now_playing?.song) {
        const song = data.now_playing.song;
        const nowPlaying = {
          title: song.title || 'Unknown',
          artist: song.artist || 'Unknown Artist',
          album: song.album || '',
          art: song.art || null,
          channelName: this.currentChannel.name,
          channelColor: this.currentChannel.color
        };

        const songId = `${song.artist}-${song.title}`;
        if (songId !== this.lastSongId) {
          this.lastSongId = songId;
          if (this.nowPlayingCallback) {
            this.nowPlayingCallback(nowPlaying, true);
          }
        }

        return nowPlaying;
      }
    } catch (e) {
      console.warn('Could not fetch now playing:', e);
    }
    return null;
  }

  startNowPlayingPolling() {
    if (this.nowPlayingInterval) return;
    this.fetchNowPlaying();
    this.nowPlayingInterval = setInterval(() => {
      if (this.musicPlaying) {
        this.fetchNowPlaying();
      }
    }, 15000);
  }

  stopNowPlayingPolling() {
    if (this.nowPlayingInterval) {
      clearInterval(this.nowPlayingInterval);
      this.nowPlayingInterval = null;
    }
  }

  startMusic(channelKey = 'ebm_industrial') {
    if (!this.audioElement) this.init();

    const channel = KRACRADIO_CHANNELS.find(c => c.key === channelKey) || KRACRADIO_CHANNELS[1];
    this.currentChannel = channel;
    this.lastSongId = null;

    try {
      if (this.musicPlaying) {
        this.audioElement.pause();
      }

      this.audioElement.src = channel.streamUrl;
      this.audioElement.volume = this.volume;
      this.audioElement.play()
        .then(() => {
          this.musicPlaying = true;
          this.startNowPlayingPolling();
        })
        .catch(err => {
          console.warn('Could not start music stream:', err);
          this.musicPlaying = false;
        });
    } catch (e) {
      console.warn('Error starting music:', e);
    }
  }

  changeChannel(channelKey) {
    if (this.musicPlaying) {
      this.stopNowPlayingPolling();
      this.startMusic(channelKey);
    } else {
      const channel = KRACRADIO_CHANNELS.find(c => c.key === channelKey) || KRACRADIO_CHANNELS[1];
      this.currentChannel = channel;
    }
  }

  stopMusic() {
    this.musicPlaying = false;
    this.stopNowPlayingPolling();
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.src = '';
    }
  }

  toggleMusic(channelKey) {
    if (this.musicPlaying) {
      this.stopMusic();
      return false;
    } else {
      this.startMusic(channelKey || this.currentChannel?.key || 'ebm_industrial');
      return true;
    }
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.audioElement) {
      this.audioElement.volume = this.volume;
    }
  }

  isPlaying() {
    return this.musicPlaying;
  }

  getCurrentChannel() {
    return this.currentChannel;
  }

  destroy() {
    this.stopMusic();
    this.audioElement = null;
  }
}

// Singleton instance
let radioManagerInstance = null;
export const getRadioManager = () => {
  if (!radioManagerInstance) {
    radioManagerInstance = new KracRadioManager();
  }
  return radioManagerInstance;
};

// Radio icon component
function RadioIcon({ weight = 'regular', className = '' }) {
  return (
    <svg className={className} width="1em" height="1em" viewBox="0 0 256 256" fill="currentColor">
      {weight === 'bold' ? (
        <path d="M104,168a12,12,0,1,1-12-12A12,12,0,0,1,104,168Zm60-12a12,12,0,1,0,12,12A12,12,0,0,0,164,156Zm68-60v88a20,20,0,0,1-20,20H44a20,20,0,0,1-20-20V96A20,20,0,0,1,44,76H186.34L79.51,29.17a12,12,0,1,1,8.98-22.34l128,56A12,12,0,0,1,212,96Zm-24,4H48v80H188Z"/>
      ) : weight === 'fill' ? (
        <path d="M216,72H86.58L194.3,22.3a8,8,0,0,0-4.6-15.2l-152,56A8,8,0,0,0,32,72V184a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V88A16,16,0,0,0,216,72ZM80,168a12,12,0,1,1,12-12A12,12,0,0,1,80,168Zm96,0a12,12,0,1,1,12-12A12,12,0,0,1,176,168Z"/>
      ) : (
        <path d="M216,72H70.08L192.31,22.77a8,8,0,1,0-6.16-14.77l-152,56A8,8,0,0,0,32,72V184a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V88A16,16,0,0,0,216,72Zm0,112H48V88H216Zm-136-28a12,12,0,1,1-12-12A12,12,0,0,1,80,156Zm96,0a12,12,0,1,1-12-12A12,12,0,0,1,176,156Z"/>
      )}
    </svg>
  );
}

// X icon component
function XIcon({ weight = 'bold', className = '' }) {
  return (
    <svg className={className} width="1em" height="1em" viewBox="0 0 256 256" fill="currentColor">
      <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"/>
    </svg>
  );
}

// Speaker High icon component
function SpeakerHighIcon({ weight = 'fill', className = '' }) {
  return (
    <svg className={className} width="1em" height="1em" viewBox="0 0 256 256" fill="currentColor">
      {weight === 'fill' ? (
        <path d="M160,32V224a8,8,0,0,1-12.91,6.31L77.25,176H32a16,16,0,0,1-16-16V96A16,16,0,0,1,32,80H77.25l69.84-54.31A8,8,0,0,1,160,32Zm32,64a8,8,0,0,0-8,8v48a8,8,0,0,0,16,0V104A8,8,0,0,0,192,96Zm32-16a8,8,0,0,0-8,8v80a8,8,0,0,0,16,0V88A8,8,0,0,0,224,80Z"/>
      ) : (
        <path d="M155.51,24.81a8,8,0,0,0-8.42.88L77.25,80H32A16,16,0,0,0,16,96v64a16,16,0,0,0,16,16H77.25l69.84,54.31A8,8,0,0,0,160,224V32A8,8,0,0,0,155.51,24.81ZM144,207.64,84.91,161.69A7.94,7.94,0,0,0,80,160H32V96H80a7.94,7.94,0,0,0,4.91-1.69L144,48.36ZM192,104v48a8,8,0,0,0,16,0V104a8,8,0,0,0-16,0Zm32-16v80a8,8,0,0,0,16,0V88a8,8,0,0,0-16,0Z"/>
      )}
    </svg>
  );
}

// Speaker Slash icon component
function SpeakerSlashIcon({ weight = 'regular', className = '' }) {
  return (
    <svg className={className} width="1em" height="1em" viewBox="0 0 256 256" fill="currentColor">
      <path d="M53.92,34.62A8,8,0,1,0,42.08,45.38L73.55,80H32A16,16,0,0,0,16,96v64a16,16,0,0,0,16,16H77.25l69.84,54.31A8,8,0,0,0,160,224V175.09l42.08,46.29a8,8,0,1,0,11.84-10.76ZM144,207.64,84.91,161.69A7.94,7.94,0,0,0,80,160H32V96H80a7.94,7.94,0,0,0,4.91-1.69L88,91.73V95.6l56,61.6ZM160,32a8,8,0,0,0-8,8V94.11a8,8,0,0,0,16,0V48.36l21.31,16.57A8,8,0,1,0,199.09,52L147.09,25.69A8,8,0,0,0,160,32Zm42.48,65.76a8,8,0,0,0-10.73,3.58,40,40,0,0,1-11.47,14.39,8,8,0,0,0,10,12.54,56,56,0,0,0,15.78-19.78A8,8,0,0,0,202.48,97.76Z"/>
    </svg>
  );
}

// Waveform icon component
function WaveformIcon({ weight = 'fill', className = '' }) {
  return (
    <svg className={className} width="1em" height="1em" viewBox="0 0 256 256" fill="currentColor">
      <path d="M56,96v64a8,8,0,0,1-16,0V96a8,8,0,0,1,16,0Zm32-56a8,8,0,0,0-8,8V208a8,8,0,0,0,16,0V48A8,8,0,0,0,88,40Zm40,32a8,8,0,0,0-8,8V176a8,8,0,0,0,16,0V80A8,8,0,0,0,128,72Zm40-16a8,8,0,0,0-8,8V192a8,8,0,0,0,16,0V64A8,8,0,0,0,168,56Zm40,48a8,8,0,0,0-8,8v32a8,8,0,0,0,16,0V112A8,8,0,0,0,208,104Z"/>
    </svg>
  );
}

// Channel selector component for menu (grid layout)
export function KracRadioSelector({ selectedChannel, onChannelChange, compact = false }) {
  return (
    <div className="kracradio-section">
      <div className="kracradio-header">
        <h3><RadioIcon weight="bold" /> Station Radio</h3>
        <a
          href="/store"
          className="kracradio-credit"
        >
          Visitez notre boutique
        </a>
      </div>
      <div className={`kracradio-grid ${compact ? 'kracradio-grid-compact' : ''}`}>
        {KRACRADIO_CHANNELS.map((channel) => (
          <button
            key={channel.key}
            className={`kracradio-card ${selectedChannel === channel.key ? 'active' : ''}`}
            onClick={() => onChannelChange(channel.key)}
            style={{ '--channel-color': channel.color }}
          >
            <span
              className="kracradio-dot"
              style={{ background: channel.color }}
            />
            <span className="kracradio-card-name">{channel.name}</span>
            {!compact && <span className="kracradio-card-desc">{channel.description}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

// In-game channel dropdown
export function KracRadioDropdown({ selectedChannel, onChannelChange, isOpen, onToggle }) {
  return (
    <div className="kracradio-dropdown-container">
      <button
        className="kracradio-mini-btn"
        onClick={onToggle}
        title="Changer de station"
      >
        <RadioIcon weight="bold" />
      </button>
      {isOpen && (
        <div className="kracradio-dropdown kracradio-dropdown-open">
          {KRACRADIO_CHANNELS.map((channel) => (
            <button
              key={channel.key}
              className={`kracradio-option ${selectedChannel === channel.key ? 'active' : ''}`}
              onClick={() => onChannelChange(channel.key)}
            >
              <span
                className="kracradio-dot"
                style={{ background: channel.color }}
              />
              <span className="kracradio-option-name">{channel.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Now Playing popup
export function KracRadioNowPlaying({ nowPlaying, show, onClose }) {
  if (!nowPlaying) return null;

  return (
    <div className={`kracradio-now-playing ${show ? 'kracradio-now-playing-visible' : 'kracradio-now-playing-hidden'}`}>
      <button
        className="kracradio-now-playing-close"
        onClick={onClose}
      >
        <XIcon weight="bold" />
      </button>
      <div className="kracradio-now-playing-content">
        {nowPlaying.art ? (
          <img
            src={nowPlaying.art}
            alt={nowPlaying.album || nowPlaying.title}
            className="kracradio-now-playing-art"
          />
        ) : (
          <div className="kracradio-now-playing-art kracradio-now-playing-art-placeholder">
            <WaveformIcon weight="fill" />
          </div>
        )}
        <div className="kracradio-now-playing-info">
          <span className="kracradio-now-playing-channel" style={{ color: nowPlaying.channelColor }}>
            <RadioIcon weight="fill" /> {nowPlaying.channelName}
          </span>
          <span className="kracradio-now-playing-title">{nowPlaying.title}</span>
          <span className="kracradio-now-playing-artist">{nowPlaying.artist}</span>
          {nowPlaying.album && (
            <span className="kracradio-now-playing-album">{nowPlaying.album}</span>
          )}
        </div>
      </div>
      <div className="kracradio-equalizer">
        {[...Array(5)].map((_, i) => (
          <span key={i} className="kracradio-equalizer-bar" style={{ animationDelay: `${i * 0.1}s` }} />
        ))}
      </div>
    </div>
  );
}

// Audio controls (music toggle)
export function KracRadioToggle({ musicEnabled, onToggle, showLabel = true }) {
  return (
    <button
      className={`kracradio-toggle ${musicEnabled ? 'active' : ''}`}
      onClick={onToggle}
      title={musicEnabled ? 'Couper la musique' : 'Activer la musique'}
    >
      {musicEnabled ? <SpeakerHighIcon weight="fill" /> : <SpeakerSlashIcon weight="regular" />}
      {showLabel && <span>Musique</span>}
    </button>
  );
}

// Custom hook for using KracRadio in games
export function useKracRadio(defaultChannel = 'ebm_industrial') {
  const radioRef = useRef(null);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [selectedChannel, setSelectedChannel] = useState(defaultChannel);
  const [showChannelSelector, setShowChannelSelector] = useState(false);
  const [nowPlaying, setNowPlaying] = useState(null);
  const [showNowPlaying, setShowNowPlaying] = useState(false);

  const handleNowPlayingUpdate = useCallback((data, isNewSong) => {
    setNowPlaying(data);
    if (isNewSong && musicEnabled) {
      setShowNowPlaying(true);
      setTimeout(() => setShowNowPlaying(false), 5000);
    }
  }, [musicEnabled]);

  useEffect(() => {
    radioRef.current = getRadioManager();
    radioRef.current.init();
    radioRef.current.setNowPlayingCallback(handleNowPlayingUpdate);

    return () => {
      if (radioRef.current) {
        radioRef.current.setNowPlayingCallback(null);
      }
    };
  }, [handleNowPlayingUpdate]);

  const startMusic = useCallback(() => {
    if (radioRef.current && musicEnabled) {
      radioRef.current.startMusic(selectedChannel);
    }
  }, [musicEnabled, selectedChannel]);

  const stopMusic = useCallback(() => {
    if (radioRef.current) {
      radioRef.current.stopMusic();
    }
  }, []);

  const toggleMusic = useCallback(() => {
    if (radioRef.current) {
      const isPlaying = radioRef.current.toggleMusic(selectedChannel);
      setMusicEnabled(isPlaying);
      return isPlaying;
    }
    return false;
  }, [selectedChannel]);

  const changeChannel = useCallback((channelKey) => {
    setSelectedChannel(channelKey);
    if (radioRef.current) {
      radioRef.current.changeChannel(channelKey);
    }
    setShowChannelSelector(false);
  }, []);

  return {
    musicEnabled,
    setMusicEnabled,
    selectedChannel,
    setSelectedChannel,
    showChannelSelector,
    setShowChannelSelector,
    nowPlaying,
    showNowPlaying,
    setShowNowPlaying,
    startMusic,
    stopMusic,
    toggleMusic,
    changeChannel,
    radioManager: radioRef.current
  };
}

export default {
  KRACRADIO_CHANNELS,
  getRadioManager,
  KracRadioSelector,
  KracRadioDropdown,
  KracRadioNowPlaying,
  KracRadioToggle,
  useKracRadio
};
