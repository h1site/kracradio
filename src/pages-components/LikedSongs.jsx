'use client';
// src/pages/LikedSongs.jsx
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useAudio } from '../context/AudioPlayerContext';
import { useI18n } from '../i18n';
import { removeSongLike } from '../lib/supabase';
import { SUPABASE_FUNCTIONS_URL } from '../lib/supabaseClient';
import { useLikedSongs } from '../context/LikedSongsContext';
import { usePlaylists } from '../context/PlaylistContext';
import PlaylistModal from '../components/PlaylistModal';

const STORAGE_KEY = 'likedSongs_warning_dismissed';

export default function LikedSongs() {
  const { t } = useI18n();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { playLikedSong, playPlaylist, playing, podcastMeta, currentType, togglePlay } = useAudio();
  const { likedSongs, loading, removeSongFromList } = useLikedSongs();
  const { songPlaylists } = usePlaylists();

  const [error, setError] = useState(null);
  const [showWarning, setShowWarning] = useState(false);
  const [playlistModalOpen, setPlaylistModalOpen] = useState(false);
  const [selectedSong, setSelectedSong] = useState(null);

  // Open playlist modal for a song
  const openPlaylistModal = (song) => {
    setSelectedSong(song);
    setPlaylistModalOpen(true);
  };

  // Track which songs have Dropbox URLs (and loading states)
  const [songUrls, setSongUrls] = useState({}); // { songId: { url, loading, notFound } }

  // Check localStorage for warning dismissal
  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) {
      setShowWarning(true);
    }
  }, []);

  const dismissWarning = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setShowWarning(false);
  };

  // Shuffle array helper
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Redirect if not logged in
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Search Dropbox for a song
  const searchDropboxUrl = useCallback(async (song) => {
    const songId = song.id;

    // Already have URL or already loading
    if (songUrls[songId]?.url || songUrls[songId]?.loading) {
      return songUrls[songId]?.url;
    }

    // Set loading state
    setSongUrls(prev => ({ ...prev, [songId]: { loading: true } }));

    try {
      const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/dropbox-search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: song.song_title,
          artist: song.song_artist,
        }),
      });

      const data = await response.json();

      if (data.found && data.dropbox_url) {
        // Wrap with audio-proxy for CORS
        const proxyUrl = `${SUPABASE_FUNCTIONS_URL}/audio-proxy?url=${encodeURIComponent(data.dropbox_url)}`;
        setSongUrls(prev => ({ ...prev, [songId]: { url: proxyUrl, loading: false } }));
        return proxyUrl;
      } else {
        setSongUrls(prev => ({ ...prev, [songId]: { notFound: true, loading: false } }));
        return null;
      }
    } catch (err) {
      console.error('Error searching Dropbox:', err);
      setSongUrls(prev => ({ ...prev, [songId]: { error: true, loading: false } }));
      return null;
    }
  }, [songUrls]);

  // Play or pause a single song
  const handlePlay = async (song) => {
    // If this song is already playing, toggle play/pause
    if (isCurrentlyPlaying(song)) {
      togglePlay();
      return;
    }

    // Otherwise, start playing this song
    let audioUrl = songUrls[song.id]?.url;

    if (!audioUrl) {
      audioUrl = await searchDropboxUrl(song);
    }

    if (audioUrl) {
      await playLikedSong({
        id: song.id,
        title: song.song_title,
        artist: song.song_artist,
        audioUrl: audioUrl,
        albumArt: song.album_art,
      });
    }
  };

  // Play all songs
  const handlePlayAll = async (shuffle = false) => {
    // First, fetch URLs for all songs that don't have them yet
    const songsWithUrls = await Promise.all(
      likedSongs.map(async (song) => {
        let audioUrl = songUrls[song.id]?.url;
        if (!audioUrl) {
          audioUrl = await searchDropboxUrl(song);
        }
        return {
          id: song.id,
          title: song.song_title,
          artist: song.song_artist,
          audioUrl: audioUrl,
          albumArt: song.album_art,
        };
      })
    );

    // Filter only playable songs
    let playable = songsWithUrls.filter(s => s.audioUrl);

    // Shuffle if requested
    if (shuffle && playable.length > 0) {
      playable = shuffleArray(playable);
    }

    if (playable.length > 0) {
      await playPlaylist(playable);
    }
  };

  const handleUnlike = async (song) => {
    try {
      await removeSongLike({
        channelKey: song.channel_key,
        title: song.song_title,
        artist: song.song_artist
      });
      // Remove from context (updates immediately)
      removeSongFromList({
        title: song.song_title,
        artist: song.song_artist,
        channelKey: song.channel_key
      });
    } catch (err) {
      console.error('Error unliking song:', err);
    }
  };

  // Check if a song is the current song (regardless of play/pause state)
  const isCurrentSong = (song) => {
    return currentType === 'liked' &&
           podcastMeta?.title === song.song_title &&
           podcastMeta?.podcastTitle === song.song_artist;
  };

  // Check if a song is currently playing (not just current, but actively playing)
  const isCurrentlyPlaying = (song) => {
    return isCurrentSong(song) && playing;
  };

  // Count playable songs (with URLs)
  const playableCount = Object.values(songUrls).filter(s => s.url).length;

  if (loading) {
    return (
      <div className="container-max px-5 py-16">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-red-500 rounded-full"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-max px-5 py-16">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg text-red-500">{t.likedSongs?.error || 'Error'}: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-max px-4 md:px-5 pb-16 overflow-hidden">
      <header className="pt-12 md:pt-16 pb-6 md:pb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-5xl font-black mb-1 md:mb-2">{t.likedSongs?.title || 'Liked Songs'}</h1>
              <p className="text-sm md:text-lg opacity-80">
                {likedSongs.length} {likedSongs.length === 1 ? (t.likedSongs?.song || 'song') : (t.likedSongs?.songs || 'songs')}
              </p>
            </div>
            <Link
              href="/playlists"
              className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-300 hover:text-white transition-colors text-xs font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
              <span className="hidden sm:inline">{t.playlists?.title || 'My Playlists'}</span>
              {songPlaylists.length > 0 && (
                <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{songPlaylists.length}</span>
              )}
            </Link>
            <Link
              href="/liked-videos"
              className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-300 hover:text-white transition-colors text-xs font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span className="hidden sm:inline">Vidéos</span>
            </Link>
          </div>

          {likedSongs.length > 0 && (
            <div className="flex items-center gap-2 md:gap-3">
              <button
                onClick={() => handlePlayAll(false)}
                className="flex items-center gap-1.5 md:gap-2 px-4 md:px-6 py-2.5 md:py-3 bg-red-500 hover:bg-red-600 text-white text-sm md:text-base font-semibold rounded-full transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 md:w-5 md:h-5" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
                {t.likedSongs?.playAll || 'Play All'}
              </button>
              <button
                onClick={() => handlePlayAll(true)}
                className="flex items-center gap-1.5 md:gap-2 px-4 md:px-5 py-2.5 md:py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-sm md:text-base font-semibold rounded-full transition-colors"
                title={t.likedSongs?.shuffle || 'Shuffle'}
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 md:w-5 md:h-5" fill="currentColor">
                  <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z" />
                </svg>
                <span className="hidden md:inline">{t.likedSongs?.shuffle || 'Shuffle'}</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* First-time warning banner */}
      {showWarning && (
        <div className="mb-4 md:mb-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-3 md:p-4">
          <div className="flex flex-col md:flex-row md:items-start gap-3">
            <div className="flex items-start gap-3 flex-1">
              <div className="flex-shrink-0 text-amber-500">
                <svg viewBox="0 0 24 24" className="w-5 h-5 md:w-6 md:h-6" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-amber-800 dark:text-amber-200 text-sm md:text-base mb-1">
                  {t.likedSongs?.warningTitle || 'First time playing'}
                </h3>
                <p className="text-xs md:text-sm text-amber-700 dark:text-amber-300 mb-1 md:mb-2">
                  {t.likedSongs?.warningMessage || 'The first time you press play, our search engine may take a few seconds to find the song in our database. Some songs may also not be available.'}
                </p>
                <p className="text-xs md:text-sm text-amber-700 dark:text-amber-300 font-medium">
                  {t.likedSongs?.warningSupport || 'If you like an artist, consider buying their music to support them!'}
                </p>
              </div>
            </div>
            <button
              onClick={dismissWarning}
              className="flex-shrink-0 w-full md:w-auto px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              {t.likedSongs?.warningDismiss || 'Got it!'}
            </button>
          </div>
        </div>
      )}

      {likedSongs.length === 0 ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-center">
            <div className="text-6xl mb-4">💔</div>
            <p className="text-xl opacity-70">{t.likedSongs?.noLikes || "You haven't liked any songs yet"}</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-3">
          {likedSongs.map((song) => {
            const urlState = songUrls[song.id] || {};
            const isCurrent = isCurrentSong(song);
            const isPlaying = isCurrentlyPlaying(song);

            return (
              <div
                key={song.id}
                className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm p-3 md:p-4 flex items-center gap-2 md:gap-4 hover:shadow-md transition-all overflow-hidden ${isCurrent ? 'ring-2 ring-red-500 bg-red-50 dark:bg-red-900/20' : ''}`}
              >
                {/* Play/Pause Button */}
                <button
                  onClick={() => handlePlay(song)}
                  disabled={urlState.loading || urlState.notFound}
                  className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                    urlState.notFound
                      ? 'bg-gray-200 dark:bg-gray-700 cursor-not-allowed opacity-50'
                      : isCurrent
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 hover:bg-red-500 hover:text-white'
                  }`}
                  title={urlState.notFound ? (t.likedSongs?.notAvailable || 'Not available') : isPlaying ? (t.player?.pause || 'Pause') : (t.player?.play || 'Play')}
                >
                  {urlState.loading ? (
                    <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  ) : isPlaying ? (
                    <svg viewBox="0 0 24 24" className="w-4 h-4 md:w-5 md:h-5" fill="currentColor">
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                    </svg>
                  ) : urlState.notFound ? (
                    <svg viewBox="0 0 24 24" className="w-4 h-4 md:w-5 md:h-5" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" className="w-4 h-4 md:w-5 md:h-5" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>

                {/* Album Art */}
                <div className="w-11 h-11 md:w-14 md:h-14 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                  {song.album_art ? (
                    <img
                      src={song.album_art}
                      alt={song.song_title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl md:text-2xl">
                      🎵
                    </div>
                  )}
                </div>

                {/* Song Info */}
                <div className="flex-1 min-w-0 overflow-hidden">
                  <h3 className={`font-semibold text-sm md:text-lg truncate ${isCurrent ? 'text-red-500' : ''}`} title={song.song_title}>
                    {song.song_title}
                  </h3>
                  <p className="text-xs md:text-sm opacity-70 truncate" title={song.song_artist}>
                    {song.song_artist}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 md:mt-1">
                    <span className="text-[10px] md:text-xs opacity-50 truncate">
                      {song.channel_name}
                    </span>
                    {urlState.notFound && (
                      <span className="text-[10px] md:text-xs text-orange-500 bg-orange-100 dark:bg-orange-900/30 px-1.5 md:px-2 py-0.5 rounded flex-shrink-0">
                        {t.likedSongs?.notAvailable || 'Not available'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {/* Add to Playlist Button */}
                  <button
                    onClick={() => openPlaylistModal(song)}
                    className="p-1.5 md:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                    title={t.playlists?.addTo || 'Add to playlist'}
                    aria-label={t.playlists?.addTo || 'Add to playlist'}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="w-5 h-5 md:w-6 md:h-6 opacity-70 hover:opacity-100"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                  {/* Unlike Button */}
                  <button
                    onClick={() => handleUnlike(song)}
                    className="p-1.5 md:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                    title={t.likedSongs?.removeFromFavorites || 'Remove from favorites'}
                    aria-label={t.likedSongs?.removeFromFavorites || 'Remove from favorites'}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="w-5 h-5 md:w-6 md:h-6 text-red-500"
                      fill="currentColor"
                    >
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Playlist Modal */}
      <PlaylistModal
        isOpen={playlistModalOpen}
        onClose={() => {
          setPlaylistModalOpen(false);
          setSelectedSong(null);
        }}
        item={selectedSong}
        type="song"
      />
    </div>
  );
}
