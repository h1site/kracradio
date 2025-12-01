'use client';
// src/context/LikedSongsContext.jsx
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getUserLikedSongs } from '../lib/supabase';

const LikedSongsContext = createContext();

export function LikedSongsProvider({ children }) {
  const { user } = useAuth();
  const [likedSongs, setLikedSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [needsRefresh, setNeedsRefresh] = useState(false);

  // Load liked songs
  const loadLikedSongs = useCallback(async () => {
    if (!user) {
      setLikedSongs([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const songs = await getUserLikedSongs();
      setLikedSongs(songs);
      setNeedsRefresh(false);
    } catch (error) {
      console.error('Error loading liked songs:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initial load
  useEffect(() => {
    loadLikedSongs();
  }, [loadLikedSongs]);

  // Trigger refresh when needed
  const triggerRefresh = useCallback(() => {
    setNeedsRefresh(true);
    loadLikedSongs();
  }, [loadLikedSongs]);

  // Add a song to the local state (optimistic update)
  const addSongToList = useCallback((song) => {
    setLikedSongs(prev => {
      // Check if already exists
      const exists = prev.some(s =>
        s.song_title === song.title &&
        s.song_artist === song.artist &&
        s.channel_key === song.channelKey
      );

      if (exists) return prev;

      // Add new song at the beginning
      return [{
        id: `temp-${Date.now()}`, // Temporary ID
        song_title: song.title,
        song_artist: song.artist,
        channel_key: song.channelKey,
        channel_name: song.channelName,
        album_art: song.albumArt,
        created_at: new Date().toISOString()
      }, ...prev];
    });
  }, []);

  // Remove a song from the local state
  const removeSongFromList = useCallback((song) => {
    setLikedSongs(prev => prev.filter(s =>
      !(s.song_title === song.title &&
        s.song_artist === song.artist &&
        s.channel_key === song.channelKey)
    ));
  }, []);

  return (
    <LikedSongsContext.Provider value={{
      likedSongs,
      loading,
      needsRefresh,
      triggerRefresh,
      addSongToList,
      removeSongFromList
    }}>
      {children}
    </LikedSongsContext.Provider>
  );
}

export function useLikedSongs() {
  const context = useContext(LikedSongsContext);
  if (!context) {
    throw new Error('useLikedSongs must be used within LikedSongsProvider');
  }
  return context;
}
