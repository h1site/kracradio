'use client';

import { useState, useEffect, useRef } from 'react';
import { useI18n } from '../../i18n';

const CHANNELS_DATA = {
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


// Preview Widget Component
function WidgetPreview({ channel, theme, width }) {
  const [nowPlaying, setNowPlaying] = useState({ title: '', artist: '', art: '' });
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(75);
  const [selectedChannel, setSelectedChannel] = useState(channel === 'all' ? 'kracradio' : channel);
  const audioRef = useRef(null);

  const isAllChannels = channel === 'all';
  const currentChannel = CHANNELS_DATA[selectedChannel] || CHANNELS_DATA.kracradio;
  const channelKeys = Object.keys(CHANNELS_DATA);
  const currentIndex = channelKeys.indexOf(selectedChannel);
  const isDark = theme === 'dark';

  useEffect(() => {
    setSelectedChannel(channel === 'all' ? 'kracradio' : channel);
  }, [channel]);

  useEffect(() => {
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
      } catch (e) {
        console.error('Error fetching now playing:', e);
      }
    };

    fetchNowPlaying();
    const interval = setInterval(fetchNowPlaying, 10000);
    return () => clearInterval(interval);
  }, [currentChannel.api, currentChannel.name]);

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

  const changeChannel = (direction) => {
    const newIndex = direction === 'next'
      ? Math.min(currentIndex + 1, channelKeys.length - 1)
      : Math.max(currentIndex - 1, 0);

    const newKey = channelKeys[newIndex];
    setSelectedChannel(newKey);

    if (audioRef.current) {
      audioRef.current.src = CHANNELS_DATA[newKey].stream;
      if (playing) {
        audioRef.current.play();
      }
    }
  };

  const handleVolumeChange = (e) => {
    const val = parseInt(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val / 100;
    }
  };

  return (
    <div
      style={{
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        background: isDark ? '#121212' : '#f5f5f5',
        color: isDark ? '#ffffff' : '#1a1a1a',
        width: `${width}px`,
        padding: '16px',
        boxSizing: 'border-box',
        borderRadius: '12px',
        border: isDark ? '1px solid #333' : '1px solid #ddd'
      }}
    >
      {/* Main Content */}
      <div style={{ display: 'flex', gap: '14px' }}>
        {/* Cover Art */}
        <div style={{ position: 'relative', width: '90px', height: '90px', flexShrink: 0 }}>
          <img
            src={nowPlaying.art || '/icon.png'}
            alt="Cover"
            onError={(e) => { e.target.src = '/icon.png'; }}
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '8px',
              objectFit: 'cover'
            }}
          />
          {isAllChannels && (
            <>
              <button
                onClick={() => changeChannel('prev')}
                disabled={currentIndex === 0}
                style={{
                  position: 'absolute',
                  left: '2px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '22px',
                  height: '22px',
                  border: 'none',
                  borderRadius: '50%',
                  background: 'rgba(0,0,0,0.7)',
                  color: 'white',
                  cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
                  opacity: currentIndex === 0 ? 0.3 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px'
                }}
              >
                ‹
              </button>
              <button
                onClick={() => changeChannel('next')}
                disabled={currentIndex === channelKeys.length - 1}
                style={{
                  position: 'absolute',
                  right: '2px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '22px',
                  height: '22px',
                  border: 'none',
                  borderRadius: '50%',
                  background: 'rgba(0,0,0,0.7)',
                  color: 'white',
                  cursor: currentIndex === channelKeys.length - 1 ? 'not-allowed' : 'pointer',
                  opacity: currentIndex === channelKeys.length - 1 ? 0.3 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px'
                }}
              >
                ›
              </button>
            </>
          )}
        </div>

        {/* Track Info + Controls */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {/* Channel + Frequency */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{
              fontSize: '10px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              color: isDark ? '#999' : '#666'
            }}>
              {currentChannel.name}
            </span>
            <span style={{
              fontSize: '9px',
              fontFamily: 'monospace',
              color: isDark ? '#666' : '#999',
              letterSpacing: '1px'
            }}>
              {currentChannel.frequency} MHz
            </span>
            {playing && (
              <span style={{
                width: '5px',
                height: '5px',
                borderRadius: '50%',
                background: '#22c55e',
                animation: 'pulse 2s infinite'
              }} />
            )}
          </div>

          {/* Title */}
          <div style={{
            fontSize: '14px',
            fontWeight: 'bold',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            marginBottom: '2px',
            color: isDark ? '#fff' : '#1a1a1a'
          }}>
            {nowPlaying.title || 'Chargement...'}
          </div>

          {/* Artist */}
          <div style={{
            fontSize: '12px',
            color: isDark ? '#888' : '#666',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            marginBottom: '10px'
          }}>
            {nowPlaying.artist || 'Live Radio'}
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              style={{
                width: '36px',
                height: '36px',
                border: 'none',
                borderRadius: '50%',
                background: isDark ? '#fff' : '#1a1a1a',
                color: isDark ? '#1a1a1a' : '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              {playing ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" rx="1"/>
                  <rect x="14" y="4" width="4" height="16" rx="1"/>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              )}
            </button>

            {/* Volume */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill={isDark ? '#666' : '#999'}>
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
                  height: '3px',
                  WebkitAppearance: 'none',
                  appearance: 'none',
                  background: isDark ? '#333' : '#ddd',
                  borderRadius: '2px',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              />
              <span style={{ fontSize: '9px', color: isDark ? '#666' : '#999', width: '26px' }}>
                {volume}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer with backlink */}
      <div style={{
        marginTop: '10px',
        paddingTop: '8px',
        borderTop: isDark ? '1px solid #333' : '1px solid #ddd',
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
            color: isDark ? '#888' : '#666',
            textDecoration: 'none',
            fontSize: '10px',
            fontWeight: 500
          }}
        >
          <img src="/icon.png" alt="KracRadio" style={{ width: '16px', height: '16px', borderRadius: '3px' }} />
          KracRadio
        </a>
        <a
          href="https://kracradio.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: isDark ? '#666' : '#999',
            textDecoration: 'none',
            fontSize: '9px'
          }}
        >
          Ouvrir le site →
        </a>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}

export default function WidgetPage() {
  const { t } = useI18n();
  const txt = t.widget || {};
  const [selectedChannel, setSelectedChannel] = useState('kracradio');
  const [selectedTheme, setSelectedTheme] = useState('dark');
  const [selectedWidth, setSelectedWidth] = useState('400');
  const [copied, setCopied] = useState(false);

  const embedCode = `<script src="https://kracradio.com/embed.js" data-channel="${selectedChannel}" data-theme="${selectedTheme}" data-width="${selectedWidth}"></script>`;

  const copyCode = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Translated channel names
  const channelsTranslated = [
    { key: 'all', name: txt.allChannels || 'All channels' },
    { key: 'kracradio', name: txt.mainChannel || 'KracRadio (main)' },
    { key: 'ebm_industrial', name: 'EBM Industrial' },
    { key: 'electro', name: 'Electro' },
    { key: 'francophonie', name: 'Francophonie' },
    { key: 'jazz', name: 'Jazz' },
    { key: 'metal', name: 'Metal' },
    { key: 'rock', name: 'Rock' }
  ];

  const themesTranslated = [
    { key: 'dark', name: txt.dark || 'Dark' },
    { key: 'light', name: txt.light || 'Light' }
  ];

  const widthsTranslated = [
    { key: '350', name: txt.small || 'Small (350px)' },
    { key: '400', name: txt.medium || 'Medium (400px)' },
    { key: '450', name: txt.large || 'Large (450px)' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">{txt.title || 'KracRadio Widget'}</h1>
          <p className="text-gray-400 text-lg">
            {txt.subtitle || 'Add our radio player to your website with a single line of code'}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Options */}
          <div className="space-y-6">
            {/* Channel Selection */}
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h2 className="text-lg font-semibold mb-4">{txt.channel || 'Channel'}</h2>
              <select
                value={selectedChannel}
                onChange={(e) => setSelectedChannel(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500"
              >
                {channelsTranslated.map(ch => (
                  <option key={ch.key} value={ch.key} className="bg-gray-900">
                    {ch.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Theme Selection */}
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h2 className="text-lg font-semibold mb-4">{txt.theme || 'Theme'}</h2>
              <div className="grid grid-cols-2 gap-3">
                {themesTranslated.map(th => (
                  <button
                    key={th.key}
                    onClick={() => setSelectedTheme(th.key)}
                    className={`py-3 px-4 rounded-lg border transition-all ${
                      selectedTheme === th.key
                        ? 'bg-red-600 border-red-600 text-white'
                        : 'bg-white/5 border-white/20 text-gray-300 hover:border-white/40'
                    }`}
                  >
                    {th.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Width Selection */}
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h2 className="text-lg font-semibold mb-4">{txt.width || 'Width'}</h2>
              <div className="grid grid-cols-3 gap-3">
                {widthsTranslated.map(w => (
                  <button
                    key={w.key}
                    onClick={() => setSelectedWidth(w.key)}
                    className={`py-3 px-4 rounded-lg border transition-all text-sm ${
                      selectedWidth === w.key
                        ? 'bg-red-600 border-red-600 text-white'
                        : 'bg-white/5 border-white/20 text-gray-300 hover:border-white/40'
                    }`}
                  >
                    {w.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Embed Code */}
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">{txt.codeToCopy || 'Code to copy'}</h2>
                <button
                  onClick={copyCode}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    copied
                      ? 'bg-green-600 text-white'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  {copied ? (txt.copied || '✓ Copied!') : (txt.copy || 'Copy')}
                </button>
              </div>
              <pre className="bg-black/50 rounded-lg p-4 overflow-x-auto text-sm text-green-400 font-mono whitespace-pre-wrap break-all">
                {embedCode}
              </pre>
              <p className="mt-3 text-xs text-gray-500">
                {txt.pasteHint || 'Paste this code in the HTML of your site, where you want to display the widget.'}
              </p>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-6">
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h2 className="text-lg font-semibold mb-4">{txt.livePreview || 'Live Preview'}</h2>
              <div
                className={`rounded-xl p-4 flex items-center justify-center ${
                  selectedTheme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'
                }`}
                style={{ minHeight: '220px' }}
              >
                <WidgetPreview
                  channel={selectedChannel}
                  theme={selectedTheme}
                  width={parseInt(selectedWidth)}
                />
              </div>
              <p className="mt-3 text-xs text-gray-500 text-center">
                {txt.previewHint || 'Functional preview - click play to test!'}
              </p>
            </div>

            {/* Features */}
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h2 className="text-lg font-semibold mb-4">{txt.benefits || 'Benefits'}</h2>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-center gap-3">
                  <span className="text-green-500">✓</span>
                  <span dangerouslySetInnerHTML={{ __html: txt.benefit1 || '<strong>Single line of code</strong> - Easy to integrate' }} />
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-green-500">✓</span>
                  <span dangerouslySetInnerHTML={{ __html: txt.benefit2 || '<strong>Guaranteed backlink</strong> - Code cannot be modified' }} />
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-green-500">✓</span>
                  <span>{txt.benefit3 || 'Shows current song with album art'}</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-green-500">✓</span>
                  <span>{txt.benefit4 || 'Built-in volume control'}</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-green-500">✓</span>
                  <span>{txt.benefit5 || 'Dark or light theme'}</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-green-500">✓</span>
                  <span>{txt.benefit6 || 'Auto-updating information'}</span>
                </li>
                {selectedChannel === 'all' && (
                  <li className="flex items-center gap-3">
                    <span className="text-green-500">✓</span>
                    <span>{txt.benefit7 || 'Navigate between all channels'}</span>
                  </li>
                )}
              </ul>
            </div>

            {/* Support */}
            <div className="bg-gradient-to-r from-red-600/20 to-pink-600/20 rounded-xl p-6 border border-red-500/30">
              <h3 className="font-semibold mb-2">{txt.needHelp || 'Need help?'}</h3>
              <p className="text-gray-300 text-sm mb-3">
                {txt.helpText || 'If you have questions about widget integration, contact us.'}
              </p>
              <a
                href="/contact"
                className="text-red-400 hover:text-red-300 text-sm font-medium"
              >
                {txt.contactUs || 'Contact us →'}
              </a>
            </div>
          </div>
        </div>

        {/* Technical Info */}
        <div className="mt-12 bg-white/5 rounded-xl p-6 border border-white/10">
          <h2 className="text-lg font-semibold mb-4">{txt.techInfo || 'Technical Information'}</h2>
          <div className="grid md:grid-cols-3 gap-6 text-sm text-gray-400">
            <div>
              <h3 className="font-medium text-white mb-2">{txt.compatibility || 'Compatibility'}</h3>
              <p>{txt.compatibilityText || 'Works on all modern browsers (Chrome, Firefox, Safari, Edge)'}</p>
            </div>
            <div>
              <h3 className="font-medium text-white mb-2">{txt.performance || 'Performance'}</h3>
              <p>{txt.performanceText || 'Lightweight script (~8KB), async loading, no impact on your SEO'}</p>
            </div>
            <div>
              <h3 className="font-medium text-white mb-2">{txt.security || 'Security'}</h3>
              <p>{txt.securityText || 'No data collected, no cookies, respects privacy'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
