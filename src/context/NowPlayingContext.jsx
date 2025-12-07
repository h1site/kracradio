'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

const NowPlayingContext = createContext(null);

// Minimum 30 seconds between popups
const MIN_POPUP_INTERVAL = 30000;

export function NowPlayingProvider({ children }) {
  const [isVisible, setIsVisible] = useState(false);
  const [songInfo, setSongInfo] = useState({
    channelName: '',
    title: '',
    artist: '',
    coverArt: ''
  });
  const lastPopupTimeRef = useRef(0);
  const lastSongKeyRef = useRef('');

  const showPopup = useCallback((info) => {
    const now = Date.now();
    const songKey = `${info.title}-${info.artist}-${info.channelName}`;

    // Skip if same song or too soon since last popup
    if (songKey === lastSongKeyRef.current) {
      return;
    }

    if (now - lastPopupTimeRef.current < MIN_POPUP_INTERVAL) {
      console.log('[NowPlaying] Skipping popup - too soon (cooldown)');
      return;
    }

    lastPopupTimeRef.current = now;
    lastSongKeyRef.current = songKey;
    setSongInfo(info);
    setIsVisible(true);
  }, []);

  const hidePopup = useCallback(() => {
    setIsVisible(false);
  }, []);

  return (
    <NowPlayingContext.Provider value={{ isVisible, songInfo, showPopup, hidePopup }}>
      {children}
    </NowPlayingContext.Provider>
  );
}

export function useNowPlayingPopup() {
  const context = useContext(NowPlayingContext);
  if (!context) {
    throw new Error('useNowPlayingPopup must be used within NowPlayingProvider');
  }
  return context;
}
