// src/components/StandalonePlayer.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useAudio } from '../context/AudioPlayerContext';
import { useI18n } from '../i18n';
import { channels } from '../data/channels';

export default function StandalonePlayer({ onClose }) {
  const { t } = useI18n();
  const {
    current,
    currentType,
    podcastMeta,
    playing,
    volume,
    setVolume,
    togglePlay,
    playChannel,
    audio
  } = useAudio();

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showChannels, setShowChannels] = useState(false);

  // Update time for podcasts
  useEffect(() => {
    if (!audio || currentType !== 'podcast') return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime || 0);
    const onDurationChange = () => setDuration(audio.duration || 0);

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('durationchange', onDurationChange);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('durationchange', onDurationChange);
    };
  }, [audio, currentType]);

  // Get current display info
  const getDisplayInfo = () => {
    if (currentType === 'podcast' && podcastMeta) {
      return {
        title: podcastMeta.title || 'Podcast',
        subtitle: podcastMeta.podcastTitle || '',
        image: podcastMeta.image || podcastMeta.podcastImage || '/default-podcast.jpg'
      };
    }
    if (current) {
      return {
        title: current.name || 'Radio',
        subtitle: current.tagline || 'En direct',
        image: current.image || '/default-radio.jpg'
      };
    }
    return {
      title: 'KracRadio',
      subtitle: 'Sélectionne une station',
      image: '/logo192.png'
    };
  };

  const info = getDisplayInfo();

  const formatTime = (seconds) => {
    if (!isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e) => {
    if (currentType !== 'podcast' || !audio) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = x / rect.width;
    const newTime = percent * duration;
    audio.currentTime = newTime;
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Modal Container - Style iPod 9:16 */}
      <div
        className="relative w-[90vw] max-w-[400px] aspect-[9/16] bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-[2.5rem] shadow-2xl border-8 border-gray-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>

        {/* Screen Area */}
        <div className="h-full flex flex-col p-6 pt-16">
          {/* Album Art */}
          <div className="flex-shrink-0 mb-6">
            <div className="w-full aspect-square rounded-2xl overflow-hidden shadow-xl bg-gray-700">
              <img
                src={info.image}
                alt={info.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = '/logo192.png';
                }}
              />
            </div>
          </div>

          {/* Track Info */}
          <div className="flex-shrink-0 mb-4 text-center">
            <h2 className="text-xl font-bold text-white truncate mb-1">
              {info.title}
            </h2>
            <p className="text-sm text-gray-400 truncate">
              {info.subtitle}
            </p>
          </div>

          {/* Progress Bar (Podcast only) */}
          {currentType === 'podcast' && (
            <div className="flex-shrink-0 mb-4">
              <div
                className="w-full h-1 bg-gray-700 rounded-full cursor-pointer relative group"
                onClick={handleSeek}
              >
                <div
                  className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full transition-all"
                  style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition"
                  style={{ left: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex-shrink-0 flex items-center justify-center gap-4 mb-4">
            {/* Channel Selector (Radio only) */}
            {currentType === 'radio' && (
              <button
                onClick={() => setShowChannels(!showChannels)}
                className="w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition"
                title="Changer de station"
              >
                <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
                  <path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z" />
                </svg>
              </button>
            )}

            {/* Previous (Podcast only) */}
            {currentType === 'podcast' && (
              <button
                onClick={() => {
                  if (audio) audio.currentTime = Math.max(0, audio.currentTime - 15);
                }}
                className="w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition"
                title="-15s"
              >
                <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
                  <path d="M11.99 5V1l-5 5 5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6h-2c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
                </svg>
              </button>
            )}

            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="w-16 h-16 flex items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white shadow-lg transition"
            >
              {playing ? (
                <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            {/* Next (Podcast only) */}
            {currentType === 'podcast' && (
              <button
                onClick={() => {
                  if (audio) audio.currentTime = Math.min(duration, audio.currentTime + 15);
                }}
                className="w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition"
                title="+15s"
              >
                <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
                  <path d="M12.01 19V15l5 5-5 5v-4c-4.42 0-8-3.58-8-8s3.58-8 8-8v2c-3.31 0-6 2.69-6 6s2.69 6 6 6z" />
                </svg>
              </button>
            )}
          </div>

          {/* Volume Control */}
          <div className="flex-shrink-0 flex items-center gap-3 mb-4">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-400 flex-shrink-0" fill="currentColor">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
            </svg>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="flex-1 h-1 bg-gray-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer"
            />
            <span className="text-xs text-gray-400 w-8 text-right">
              {Math.round(volume * 100)}%
            </span>
          </div>

          {/* Channel List (Radio only) */}
          {currentType === 'radio' && showChannels && (
            <div className="flex-1 overflow-y-auto rounded-xl bg-black/40 p-3 space-y-2 custom-scrollbar">
              {channels.map((ch) => (
                <button
                  key={ch.key}
                  onClick={() => {
                    playChannel(ch.key);
                    setShowChannels(false);
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition ${
                    current?.key === ch.key
                      ? 'bg-gradient-to-r from-red-500/30 to-orange-500/30 border border-red-500/50'
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <img
                    src={ch.image}
                    alt={ch.name}
                    className="w-10 h-10 rounded-lg object-cover"
                    onError={(e) => {
                      e.target.src = '/logo192.png';
                    }}
                  />
                  <div className="flex-1 text-left">
                    <div className="text-sm font-semibold text-white">
                      {ch.name}
                    </div>
                    <div className="text-xs text-gray-400 truncate">
                      {ch.tagline}
                    </div>
                  </div>
                  {current?.key === ch.key && (
                    <svg viewBox="0 0 24 24" className="w-5 h-5 text-red-500" fill="currentColor">
                      <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
