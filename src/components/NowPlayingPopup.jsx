'use client';
import React, { useEffect, useState, useRef } from 'react';
import { Radio, X, Waveform } from '@phosphor-icons/react';

// CSS-based animated equalizer bars
const EqualizerBars = () => {
  return (
    <>
      <style>{`
        @keyframes equalizerBar {
          0%, 100% { height: 40%; }
          25% { height: 100%; }
          50% { height: 60%; }
          75% { height: 80%; }
        }
        .equalizer-bar {
          animation: equalizerBar 0.8s ease-in-out infinite;
        }
      `}</style>
      <div className="flex items-end gap-[2px] h-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="equalizer-bar w-1 bg-gradient-to-t from-pink-500 to-purple-500 rounded-full"
            style={{
              animationDelay: `${i * 0.1}s`,
              height: '40%',
            }}
          />
        ))}
      </div>
    </>
  );
};

export default function NowPlayingPopup({
  isVisible,
  onClose,
  channelName,
  title,
  artist,
  album,
  coverArt,
  autoHideDuration = 8000
}) {
  const [mounted, setMounted] = useState(false);
  const [show, setShow] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const timerRef = useRef(null);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (isVisible) {
      setIsExiting(false);
      setShow(true);

      // Auto-hide after duration
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        handleClose();
      }, autoHideDuration);
    } else {
      handleClose();
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isVisible, autoHideDuration, mounted]);

  const handleClose = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsExiting(true);
    setTimeout(() => {
      setShow(false);
      setIsExiting(false);
      onClose?.();
    }, 300); // Match animation duration
  };

  if (!mounted || !show) return null;

  return (
    <>
      <style>{`
        @keyframes slideInFromRight {
          from {
            opacity: 0;
            transform: translateX(100px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
        @keyframes slideOutToRight {
          from {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
          to {
            opacity: 0;
            transform: translateX(100px) scale(0.9);
          }
        }
        .popup-enter {
          animation: slideInFromRight 0.3s cubic-bezier(0.25, 0.1, 0.25, 1) forwards;
        }
        .popup-exit {
          animation: slideOutToRight 0.3s cubic-bezier(0.25, 0.1, 0.25, 1) forwards;
        }
      `}</style>
      <div
        className={`fixed bottom-20 right-4 z-50 w-80 max-w-[calc(100vw-2rem)] md:bottom-24 ${isExiting ? 'popup-exit' : 'popup-enter'}`}
        style={{
          background: 'rgba(15, 20, 41, 0.95)',
          border: '1px solid rgba(244, 114, 182, 0.3)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(244, 114, 182, 0.15), 0 0 60px rgba(139, 92, 246, 0.1)',
        }}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-white/10 transition-colors"
          aria-label="Fermer"
        >
          <X size={18} weight="bold" className="text-gray-400 hover:text-white" />
        </button>

        <div className="p-4">
          {/* Header with radio icon */}
          <div className="flex items-center gap-2 mb-3">
            <Radio size={16} weight="fill" className="text-pink-500" />
            <span className="text-xs font-medium text-pink-400 uppercase tracking-wider">
              {channelName || 'KracRadio'}
            </span>
          </div>

          {/* Content */}
          <div className="flex gap-3">
            {/* Cover art */}
            <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gradient-to-br from-purple-900/50 to-pink-900/50 flex items-center justify-center">
              {coverArt ? (
                <img
                  src={coverArt}
                  alt={`${title} cover`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <Waveform
                size={28}
                weight="duotone"
                className={`text-pink-400 ${coverArt ? 'hidden' : ''}`}
              />
            </div>

            {/* Song info */}
            <div className="flex-1 min-w-0">
              <h4 className="text-white font-semibold text-sm truncate">
                {title || 'Unknown Track'}
              </h4>
              <p className="text-gray-400 text-xs truncate mt-0.5">
                {artist || 'Unknown Artist'}
              </p>
              {album && (
                <p className="text-gray-500 text-xs truncate mt-0.5">
                  {album}
                </p>
              )}
            </div>
          </div>

          {/* Equalizer animation */}
          <div className="flex justify-center mt-3 pt-3 border-t border-white/5">
            <EqualizerBars />
          </div>
        </div>
      </div>
    </>
  );
}
