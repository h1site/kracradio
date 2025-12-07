'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';

// Channel data
const CHANNELS = {
  kracradio: {
    name: 'KracRadio',
    stream: 'https://stream.kracradio.com/listen/kracradio/radio.mp3',
    api: 'https://stream.kracradio.com/api/nowplaying/1',
    color: '#dc2626'
  },
  ebm_industrial: {
    name: 'EBM Industrial',
    stream: 'https://stream.kracradio.com/listen/ebm_industrial/radio.mp3',
    api: 'https://stream.kracradio.com/api/nowplaying/4',
    color: '#7c3aed'
  },
  electro: {
    name: 'Electro',
    stream: 'https://stream.kracradio.com/listen/electro/radio.mp3',
    api: 'https://stream.kracradio.com/api/nowplaying/7',
    color: '#0ea5e9'
  },
  francophonie: {
    name: 'Francophonie',
    stream: 'https://stream.kracradio.com/listen/franco/radio.mp3',
    api: 'https://stream.kracradio.com/api/nowplaying/6',
    color: '#0284c7'
  },
  jazz: {
    name: 'Jazz',
    stream: 'https://stream.kracradio.com/listen/jazz/radio.mp3',
    api: 'https://stream.kracradio.com/api/nowplaying/2',
    color: '#d97706'
  },
  metal: {
    name: 'Metal',
    stream: 'https://stream.kracradio.com/listen/metal/radio.mp3',
    api: 'https://stream.kracradio.com/api/nowplaying/5',
    color: '#1f2937'
  },
  rock: {
    name: 'Rock',
    stream: 'https://stream.kracradio.com/listen/rock/radio.mp3',
    api: 'https://stream.kracradio.com/api/nowplaying/8',
    color: '#b91c1c'
  },
  all: {
    name: 'Toutes les chaînes',
    color: '#dc2626'
  }
};

// Equalizer animation
const EqualizerBars = ({ playing }) => (
  <div className="flex items-end gap-[2px] h-4">
    {[1, 2, 3, 4, 5].map((i) => (
      <motion.div
        key={i}
        className="w-1 bg-white rounded-full"
        animate={playing ? {
          height: ['40%', '100%', '60%', '80%', '40%'],
        } : { height: '20%' }}
        transition={{
          duration: 0.8,
          repeat: playing ? Infinity : 0,
          delay: i * 0.1,
          ease: 'easeInOut',
        }}
      />
    ))}
  </div>
);

export default function EmbedWidget() {
  const { channel } = useParams();
  const [playing, setPlaying] = useState(false);
  const [nowPlaying, setNowPlaying] = useState({ title: '', artist: '', art: '' });
  const [selectedChannel, setSelectedChannel] = useState(channel === 'all' ? 'kracradio' : channel);
  const [showChannelList, setShowChannelList] = useState(false);
  const audioRef = useRef(null);

  const isAllChannels = channel === 'all';
  const currentChannel = CHANNELS[selectedChannel] || CHANNELS.kracradio;

  // Fetch now playing
  useEffect(() => {
    if (!currentChannel.api) return;

    const fetchNowPlaying = async () => {
      try {
        const res = await fetch(currentChannel.api, { cache: 'no-store' });
        const data = await res.json();
        const song = data?.now_playing?.song || {};
        setNowPlaying({
          title: song.title || 'KracRadio',
          artist: song.artist || 'Live Radio',
          art: song.art || ''
        });
      } catch {}
    };

    fetchNowPlaying();
    const interval = setInterval(fetchNowPlaying, 15000);
    return () => clearInterval(interval);
  }, [currentChannel.api]);

  // Play/Pause
  const togglePlay = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(currentChannel.stream);
    }

    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      // Update stream if channel changed
      if (audioRef.current.src !== currentChannel.stream) {
        audioRef.current.src = currentChannel.stream;
      }
      audioRef.current.play();
      setPlaying(true);
    }
  };

  // Change channel
  const changeChannel = (key) => {
    if (audioRef.current && playing) {
      audioRef.current.pause();
    }
    setSelectedChannel(key);
    setShowChannelList(false);
    if (audioRef.current) {
      audioRef.current.src = CHANNELS[key].stream;
      if (playing) {
        audioRef.current.play();
      }
    }
  };

  return (
    <div
      className="w-full h-full min-h-[120px] font-sans"
      style={{
        background: `linear-gradient(135deg, ${currentChannel.color}dd, ${currentChannel.color}99)`,
        borderRadius: '12px',
        overflow: 'hidden'
      }}
    >
      <div className="p-4 flex flex-col h-full">
        {/* Header with logo */}
        <div className="flex items-center justify-between mb-3">
          <a
            href="https://kracradio.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-white hover:opacity-80 transition-opacity"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
              <path d="M8 12l3 3 5-5" stroke="currentColor" strokeWidth="2" fill="none"/>
            </svg>
            <span className="font-bold text-sm">KracRadio</span>
          </a>

          {isAllChannels && (
            <div className="relative">
              <button
                onClick={() => setShowChannelList(!showChannelList)}
                className="text-white/80 text-xs bg-white/20 px-2 py-1 rounded hover:bg-white/30 transition-colors"
              >
                {currentChannel.name} ▼
              </button>
              {showChannelList && (
                <div className="absolute right-0 top-full mt-1 bg-black/90 backdrop-blur-md rounded-lg overflow-hidden z-10 min-w-[150px]">
                  {Object.entries(CHANNELS).filter(([k]) => k !== 'all').map(([key, ch]) => (
                    <button
                      key={key}
                      onClick={() => changeChannel(key)}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-white/10 transition-colors ${
                        selectedChannel === key ? 'bg-white/20 text-white' : 'text-white/80'
                      }`}
                    >
                      {ch.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Now Playing */}
        <div className="flex items-center gap-3 flex-1">
          {/* Cover Art */}
          <div className="w-14 h-14 rounded-lg overflow-hidden bg-black/30 flex-shrink-0">
            {nowPlaying.art ? (
              <img src={nowPlaying.art} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <EqualizerBars playing={playing} />
              </div>
            )}
          </div>

          {/* Song Info */}
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm truncate">
              {nowPlaying.title}
            </p>
            <p className="text-white/70 text-xs truncate">
              {nowPlaying.artist}
            </p>
            {!isAllChannels && (
              <p className="text-white/50 text-xs mt-1">
                {currentChannel.name}
              </p>
            )}
          </div>

          {/* Play Button */}
          <button
            onClick={togglePlay}
            className="w-12 h-12 rounded-full bg-white flex items-center justify-center hover:scale-105 transition-transform flex-shrink-0"
            style={{ color: currentChannel.color }}
          >
            {playing ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1"/>
                <rect x="14" y="4" width="4" height="16" rx="1"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
            )}
          </button>
        </div>

        {/* Footer link */}
        <div className="mt-3 pt-2 border-t border-white/10">
          <a
            href="https://kracradio.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/50 text-[10px] hover:text-white/80 transition-colors"
          >
            Écouter sur kracradio.com →
          </a>
        </div>
      </div>
    </div>
  );
}
