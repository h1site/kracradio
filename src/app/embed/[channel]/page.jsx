'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';

// Channel data
const CHANNELS = {
  kracradio: {
    name: 'KracRadio',
    stream: 'https://stream.kracradio.com/listen/kracradio/radio.mp3',
    api: 'https://stream.kracradio.com/api/nowplaying/1',
    frequency: '101.5',
    color: '#dc2626'
  },
  ebm_industrial: {
    name: 'EBM Industrial',
    stream: 'https://stream.kracradio.com/listen/ebm_industrial/radio.mp3',
    api: 'https://stream.kracradio.com/api/nowplaying/4',
    frequency: '95.7',
    color: '#7c3aed'
  },
  electro: {
    name: 'Electro',
    stream: 'https://stream.kracradio.com/listen/electro/radio.mp3',
    api: 'https://stream.kracradio.com/api/nowplaying/7',
    frequency: '98.3',
    color: '#0ea5e9'
  },
  francophonie: {
    name: 'Francophonie',
    stream: 'https://stream.kracradio.com/listen/franco/radio.mp3',
    api: 'https://stream.kracradio.com/api/nowplaying/6',
    frequency: '103.7',
    color: '#0284c7'
  },
  jazz: {
    name: 'Jazz',
    stream: 'https://stream.kracradio.com/listen/jazz/radio.mp3',
    api: 'https://stream.kracradio.com/api/nowplaying/2',
    frequency: '89.1',
    color: '#d97706'
  },
  metal: {
    name: 'Metal',
    stream: 'https://stream.kracradio.com/listen/metal/radio.mp3',
    api: 'https://stream.kracradio.com/api/nowplaying/5',
    frequency: '106.9',
    color: '#374151'
  },
  rock: {
    name: 'Rock',
    stream: 'https://stream.kracradio.com/listen/rock/radio.mp3',
    api: 'https://stream.kracradio.com/api/nowplaying/8',
    frequency: '97.5',
    color: '#b91c1c'
  }
};

const CHANNEL_KEYS = Object.keys(CHANNELS);

export default function EmbedWidget() {
  const { channel } = useParams();
  const searchParams = useSearchParams();
  const theme = searchParams.get('theme') || 'dark';

  const [playing, setPlaying] = useState(false);
  const [nowPlaying, setNowPlaying] = useState({ title: '', artist: '', art: '' });
  const [selectedChannel, setSelectedChannel] = useState(channel === 'all' ? 'kracradio' : channel);
  const [volume, setVolume] = useState(75);
  const audioRef = useRef(null);

  const isAllChannels = channel === 'all';
  const currentChannel = CHANNELS[selectedChannel] || CHANNELS.kracradio;
  const currentIndex = CHANNEL_KEYS.indexOf(selectedChannel);

  // Fetch now playing
  useEffect(() => {
    if (!currentChannel.api) return;

    const fetchNowPlaying = async () => {
      try {
        const res = await fetch(currentChannel.api, { cache: 'no-store' });
        const data = await res.json();
        const song = data?.now_playing?.song || {};
        setNowPlaying({
          title: song.title || currentChannel.name,
          artist: song.artist || 'Live Radio',
          art: song.art || ''
        });
      } catch {}
    };

    fetchNowPlaying();
    const interval = setInterval(fetchNowPlaying, 5000);
    return () => clearInterval(interval);
  }, [currentChannel.api, currentChannel.name]);

  // Play/Pause
  const togglePlay = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(currentChannel.stream);
      audioRef.current.volume = volume / 100;
    }

    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      if (audioRef.current.src !== currentChannel.stream) {
        audioRef.current.src = currentChannel.stream;
      }
      audioRef.current.play();
      setPlaying(true);
    }
  };

  // Change channel
  const changeChannel = (direction) => {
    const newIndex = direction === 'next'
      ? Math.min(currentIndex + 1, CHANNEL_KEYS.length - 1)
      : Math.max(currentIndex - 1, 0);

    const newKey = CHANNEL_KEYS[newIndex];
    setSelectedChannel(newKey);

    if (audioRef.current) {
      audioRef.current.src = CHANNELS[newKey].stream;
      if (playing) {
        audioRef.current.play();
      }
    }
  };

  // Volume change
  const handleVolumeChange = (e) => {
    const val = parseInt(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val / 100;
    }
  };

  const isDark = theme === 'dark';

  return (
    <div
      style={{
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        background: isDark
          ? 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)'
          : 'linear-gradient(135deg, #f8f8f8 0%, #ffffff 50%, #f0f0f0 100%)',
        color: isDark ? 'white' : '#1a1a1a',
        height: '100%',
        minHeight: '200px',
        display: 'flex',
        flexDirection: 'column',
        padding: '16px',
        boxSizing: 'border-box',
        borderRadius: '16px',
        overflow: 'hidden'
      }}
    >
      {/* Album Art + Navigation */}
      <div style={{ display: 'flex', gap: '16px', flex: 1 }}>
        {/* Cover Art */}
        <div style={{ position: 'relative', width: '120px', height: '120px', flexShrink: 0 }}>
          <img
            src={nowPlaying.art || 'https://kracradio.com/icon.png'}
            alt="Cover"
            onError={(e) => { e.target.src = 'https://kracradio.com/icon.png'; }}
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '12px',
              objectFit: 'cover',
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
            }}
          />

          {/* Channel navigation arrows */}
          {isAllChannels && (
            <>
              <button
                onClick={() => changeChannel('prev')}
                disabled={currentIndex === 0}
                style={{
                  position: 'absolute',
                  left: '4px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '28px',
                  height: '28px',
                  border: 'none',
                  borderRadius: '50%',
                  background: 'rgba(0,0,0,0.6)',
                  color: 'white',
                  cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
                  opacity: currentIndex === 0 ? 0.3 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px'
                }}
              >
                ‹
              </button>
              <button
                onClick={() => changeChannel('next')}
                disabled={currentIndex === CHANNEL_KEYS.length - 1}
                style={{
                  position: 'absolute',
                  right: '4px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '28px',
                  height: '28px',
                  border: 'none',
                  borderRadius: '50%',
                  background: 'rgba(0,0,0,0.6)',
                  color: 'white',
                  cursor: currentIndex === CHANNEL_KEYS.length - 1 ? 'not-allowed' : 'pointer',
                  opacity: currentIndex === CHANNEL_KEYS.length - 1 ? 0.3 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px'
                }}
              >
                ›
              </button>
            </>
          )}
        </div>

        {/* Track Info + Controls */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {/* Channel Name + Frequency */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{
              fontSize: '11px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              color: currentChannel.color
            }}>
              {currentChannel.name}
            </span>
            <span style={{
              fontSize: '10px',
              fontFamily: 'monospace',
              color: '#ef4444',
              letterSpacing: '1px'
            }}>
              {currentChannel.frequency} MHz
            </span>
            {/* Live indicator */}
            {playing && (
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#ef4444',
                animation: 'pulse 2s infinite'
              }} />
            )}
          </div>

          {/* Title */}
          <div style={{
            fontSize: '16px',
            fontWeight: 'bold',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            marginBottom: '2px'
          }}>
            {nowPlaying.title}
          </div>

          {/* Artist */}
          <div style={{
            fontSize: '13px',
            color: isDark ? '#aaa' : '#666',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            marginBottom: '12px'
          }}>
            {nowPlaying.artist}
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              style={{
                width: '44px',
                height: '44px',
                border: 'none',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #ef4444, #f97316)',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              {playing ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" rx="1"/>
                  <rect x="14" y="4" width="4" height="16" rx="1"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              )}
            </button>

            {/* Volume */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill={isDark ? '#888' : '#666'}>
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
              </svg>
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={handleVolumeChange}
                style={{
                  flex: 1,
                  height: '4px',
                  WebkitAppearance: 'none',
                  appearance: 'none',
                  background: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                  borderRadius: '2px',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              />
              <span style={{ fontSize: '11px', color: isDark ? '#888' : '#666', width: '32px' }}>
                {volume}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer with backlink */}
      <div style={{
        marginTop: '12px',
        paddingTop: '10px',
        borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <a
          href="https://kracradio.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)',
            textDecoration: 'none',
            fontSize: '11px',
            transition: 'color 0.2s'
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>
          </svg>
          kracradio.com
        </a>
        <a
          href="https://kracradio.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)',
            textDecoration: 'none',
            fontSize: '10px'
          }}
        >
          Écouter sur le site →
        </a>
      </div>

      {/* CSS for pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 12px;
          height: 12px;
          background: white;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        }
        input[type="range"]::-moz-range-thumb {
          width: 12px;
          height: 12px;
          background: white;
          border-radius: 50%;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
}
