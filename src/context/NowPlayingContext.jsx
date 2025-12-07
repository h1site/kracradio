'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

const NowPlayingContext = createContext(null);

export function NowPlayingProvider({ children }) {
  const [isVisible, setIsVisible] = useState(false);
  const [songInfo, setSongInfo] = useState({
    channelName: '',
    title: '',
    artist: '',
    coverArt: ''
  });

  const showPopup = useCallback((info) => {
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
