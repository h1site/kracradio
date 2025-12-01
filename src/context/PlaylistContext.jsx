'use client';
// src/context/PlaylistContext.jsx
// LocalStorage-based playlist management for songs and videos (separate entities)
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const SONG_PLAYLISTS_KEY = 'kracradio_song_playlists';
const VIDEO_PLAYLISTS_KEY = 'kracradio_video_playlists';

const PlaylistContext = createContext();

// Helper to load playlists from localStorage (client-side only)
function loadFromStorage(key) {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Error loading playlists from storage:', e);
  }
  return [];
}

// Helper to save playlists to localStorage (client-side only)
function saveToStorage(key, playlists) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(playlists));
  } catch (e) {
    console.error('Error saving playlists to storage:', e);
  }
}

export function PlaylistProvider({ children }) {
  // Song playlists state - initialize empty, load on client
  const [songPlaylists, setSongPlaylists] = useState([]);
  // Video playlists state - initialize empty, load on client
  const [videoPlaylists, setVideoPlaylists] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on client mount
  useEffect(() => {
    setSongPlaylists(loadFromStorage(SONG_PLAYLISTS_KEY));
    setVideoPlaylists(loadFromStorage(VIDEO_PLAYLISTS_KEY));
    setIsLoaded(true);
  }, []);

  // Persist song playlists to localStorage (only after initial load)
  useEffect(() => {
    if (isLoaded) {
      saveToStorage(SONG_PLAYLISTS_KEY, songPlaylists);
    }
  }, [songPlaylists, isLoaded]);

  // Persist video playlists to localStorage (only after initial load)
  useEffect(() => {
    if (isLoaded) {
      saveToStorage(VIDEO_PLAYLISTS_KEY, videoPlaylists);
    }
  }, [videoPlaylists, isLoaded]);

  // ==================== SONG PLAYLIST FUNCTIONS ====================

  // Create a new song playlist
  const createSongPlaylist = useCallback((name) => {
    const id = `sp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newPlaylist = {
      id,
      name,
      songs: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setSongPlaylists(prev => [...prev, newPlaylist]);
    return newPlaylist;
  }, []);

  // Rename a song playlist
  const renameSongPlaylist = useCallback((playlistId, newName) => {
    setSongPlaylists(prev => prev.map(pl =>
      pl.id === playlistId
        ? { ...pl, name: newName, updatedAt: new Date().toISOString() }
        : pl
    ));
  }, []);

  // Delete a song playlist
  const deleteSongPlaylist = useCallback((playlistId) => {
    setSongPlaylists(prev => prev.filter(pl => pl.id !== playlistId));
  }, []);

  // Add song to playlist
  const addSongToPlaylist = useCallback((playlistId, song) => {
    setSongPlaylists(prev => prev.map(pl => {
      if (pl.id !== playlistId) return pl;

      // Check if song already exists in playlist
      const exists = pl.songs.some(s =>
        s.song_title === song.song_title &&
        s.song_artist === song.song_artist &&
        s.channel_key === song.channel_key
      );

      if (exists) return pl;

      return {
        ...pl,
        songs: [...pl.songs, {
          id: song.id,
          song_title: song.song_title,
          song_artist: song.song_artist,
          channel_key: song.channel_key,
          channel_name: song.channel_name,
          album_art: song.album_art,
          addedAt: new Date().toISOString()
        }],
        updatedAt: new Date().toISOString()
      };
    }));
  }, []);

  // Remove song from playlist
  const removeSongFromPlaylist = useCallback((playlistId, song) => {
    setSongPlaylists(prev => prev.map(pl => {
      if (pl.id !== playlistId) return pl;

      return {
        ...pl,
        songs: pl.songs.filter(s =>
          !(s.song_title === song.song_title &&
            s.song_artist === song.song_artist &&
            s.channel_key === song.channel_key)
        ),
        updatedAt: new Date().toISOString()
      };
    }));
  }, []);

  // Check if song is in any playlist
  const isSongInPlaylist = useCallback((playlistId, song) => {
    const playlist = songPlaylists.find(pl => pl.id === playlistId);
    if (!playlist) return false;

    return playlist.songs.some(s =>
      s.song_title === song.song_title &&
      s.song_artist === song.song_artist &&
      s.channel_key === song.channel_key
    );
  }, [songPlaylists]);

  // Remove song from ALL playlists (when unliked)
  const removeSongFromAllPlaylists = useCallback((song) => {
    setSongPlaylists(prev => prev.map(pl => ({
      ...pl,
      songs: pl.songs.filter(s =>
        !(s.song_title === song.song_title &&
          s.song_artist === song.song_artist &&
          s.channel_key === song.channel_key)
      ),
      updatedAt: new Date().toISOString()
    })));
  }, []);

  // ==================== VIDEO PLAYLIST FUNCTIONS ====================

  // Create a new video playlist
  const createVideoPlaylist = useCallback((name) => {
    const id = `vp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newPlaylist = {
      id,
      name,
      videos: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setVideoPlaylists(prev => [...prev, newPlaylist]);
    return newPlaylist;
  }, []);

  // Rename a video playlist
  const renameVideoPlaylist = useCallback((playlistId, newName) => {
    setVideoPlaylists(prev => prev.map(pl =>
      pl.id === playlistId
        ? { ...pl, name: newName, updatedAt: new Date().toISOString() }
        : pl
    ));
  }, []);

  // Delete a video playlist
  const deleteVideoPlaylist = useCallback((playlistId) => {
    setVideoPlaylists(prev => prev.filter(pl => pl.id !== playlistId));
  }, []);

  // Add video to playlist
  const addVideoToPlaylist = useCallback((playlistId, video) => {
    setVideoPlaylists(prev => prev.map(pl => {
      if (pl.id !== playlistId) return pl;

      // Check if video already exists in playlist
      const exists = pl.videos.some(v => v.youtube_id === video.youtube_id);

      if (exists) return pl;

      return {
        ...pl,
        videos: [...pl.videos, {
          id: video.id,
          youtube_id: video.youtube_id,
          title: video.title,
          thumbnail_url: video.thumbnail_url,
          artist_name: video.artist_name,
          addedAt: new Date().toISOString()
        }],
        updatedAt: new Date().toISOString()
      };
    }));
  }, []);

  // Remove video from playlist
  const removeVideoFromPlaylist = useCallback((playlistId, video) => {
    setVideoPlaylists(prev => prev.map(pl => {
      if (pl.id !== playlistId) return pl;

      return {
        ...pl,
        videos: pl.videos.filter(v => v.youtube_id !== video.youtube_id),
        updatedAt: new Date().toISOString()
      };
    }));
  }, []);

  // Check if video is in playlist
  const isVideoInPlaylist = useCallback((playlistId, video) => {
    const playlist = videoPlaylists.find(pl => pl.id === playlistId);
    if (!playlist) return false;

    return playlist.videos.some(v => v.youtube_id === video.youtube_id);
  }, [videoPlaylists]);

  // Remove video from ALL playlists (when unliked)
  const removeVideoFromAllPlaylists = useCallback((video) => {
    setVideoPlaylists(prev => prev.map(pl => ({
      ...pl,
      videos: pl.videos.filter(v => v.youtube_id !== video.youtube_id),
      updatedAt: new Date().toISOString()
    })));
  }, []);

  return (
    <PlaylistContext.Provider value={{
      // Song playlists
      songPlaylists,
      createSongPlaylist,
      renameSongPlaylist,
      deleteSongPlaylist,
      addSongToPlaylist,
      removeSongFromPlaylist,
      isSongInPlaylist,
      removeSongFromAllPlaylists,
      // Video playlists
      videoPlaylists,
      createVideoPlaylist,
      renameVideoPlaylist,
      deleteVideoPlaylist,
      addVideoToPlaylist,
      removeVideoFromPlaylist,
      isVideoInPlaylist,
      removeVideoFromAllPlaylists
    }}>
      {children}
    </PlaylistContext.Provider>
  );
}

export function usePlaylists() {
  const context = useContext(PlaylistContext);
  if (!context) {
    throw new Error('usePlaylists must be used within PlaylistProvider');
  }
  return context;
}
