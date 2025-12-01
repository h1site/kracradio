'use client';
// src/pages/UserPlaylists.jsx
// Unified playlists page: Liked Songs, Liked Videos, and Custom Playlists
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useAudio } from '../context/AudioPlayerContext';
import { usePlaylists } from '../context/PlaylistContext';
import { useLikedSongs } from '../context/LikedSongsContext';
import { useI18n } from '../i18n';
import { getUserLikedVideos, unlikeVideo, removeSongLike } from '../lib/supabase';
import { SUPABASE_FUNCTIONS_URL } from '../lib/supabaseClient';
import Seo from '../seo/Seo';
import PlaylistModal from '../components/PlaylistModal';

export default function UserPlaylists() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { playLikedSong, playPlaylist, playing, podcastMeta, currentType, togglePlay } = useAudio();
  const { likedSongs, loading: songsLoading, removeSongFromList } = useLikedSongs();
  const {
    songPlaylists,
    videoPlaylists,
    createSongPlaylist,
    createVideoPlaylist,
    renameSongPlaylist,
    renameVideoPlaylist,
    deleteSongPlaylist,
    deleteVideoPlaylist,
    removeSongFromPlaylist,
    removeVideoFromPlaylist,
    removeSongFromAllPlaylists,
    removeVideoFromAllPlaylists
  } = usePlaylists();

  // State
  const [activeTab, setActiveTab] = useState('liked-songs'); // 'liked-songs' | 'liked-videos' | 'custom-songs' | 'custom-videos'
  const [likedVideos, setLikedVideos] = useState([]);
  const [videosLoading, setVideosLoading] = useState(true);
  const [songUrls, setSongUrls] = useState({});
  const [expandedPlaylist, setExpandedPlaylist] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [playlistModalOpen, setPlaylistModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedType, setSelectedType] = useState('song');

  const [sessionId] = useState(() => {
    let sid = localStorage.getItem('kracradio_session_id');
    if (!sid) {
      sid = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('kracradio_session_id', sid);
    }
    return sid;
  });

  // Load liked videos
  useEffect(() => {
    const loadLikedVideos = async () => {
      if (!user) {
        setVideosLoading(false);
        return;
      }
      try {
        const videos = await getUserLikedVideos(user.id, sessionId);
        setLikedVideos(videos || []);
      } catch (err) {
        console.error('Error loading liked videos:', err);
      } finally {
        setVideosLoading(false);
      }
    };
    if (!authLoading) {
      loadLikedVideos();
    }
  }, [user, authLoading, sessionId]);

  // Search Dropbox for a song
  const searchDropboxUrl = useCallback(async (song) => {
    const songKey = `${song.song_title}-${song.song_artist}`;
    if (songUrls[songKey]?.url || songUrls[songKey]?.loading) {
      return songUrls[songKey]?.url;
    }
    setSongUrls(prev => ({ ...prev, [songKey]: { loading: true } }));
    try {
      const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/dropbox-search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: song.song_title, artist: song.song_artist }),
      });
      const data = await response.json();
      if (data.found && data.dropbox_url) {
        const proxyUrl = `${SUPABASE_FUNCTIONS_URL}/audio-proxy?url=${encodeURIComponent(data.dropbox_url)}`;
        setSongUrls(prev => ({ ...prev, [songKey]: { url: proxyUrl, loading: false } }));
        return proxyUrl;
      } else {
        setSongUrls(prev => ({ ...prev, [songKey]: { notFound: true, loading: false } }));
        return null;
      }
    } catch (err) {
      console.error('Error searching Dropbox:', err);
      setSongUrls(prev => ({ ...prev, [songKey]: { error: true, loading: false } }));
      return null;
    }
  }, [songUrls]);

  // Play a single song
  const handlePlaySong = async (song) => {
    const isCurrentSong = currentType === 'liked' && podcastMeta?.title === song.song_title && podcastMeta?.podcastTitle === song.song_artist;
    if (isCurrentSong) {
      togglePlay();
      return;
    }
    let audioUrl = await searchDropboxUrl(song);
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
  const handlePlayAllSongs = async (songs) => {
    const songsWithUrls = await Promise.all(
      songs.map(async (song) => {
        const audioUrl = await searchDropboxUrl(song);
        return {
          id: song.id,
          title: song.song_title,
          artist: song.song_artist,
          audioUrl: audioUrl,
          albumArt: song.album_art,
        };
      })
    );
    const playable = songsWithUrls.filter(s => s.audioUrl);
    if (playable.length > 0) {
      await playPlaylist(playable);
    }
  };

  // Unlike song - also removes from all custom playlists
  const handleUnlikeSong = async (song) => {
    try {
      await removeSongLike({ channelKey: song.channel_key, title: song.song_title, artist: song.song_artist });
      removeSongFromList({ title: song.song_title, artist: song.song_artist, channelKey: song.channel_key });
      // Also remove from all custom playlists
      removeSongFromAllPlaylists(song);
    } catch (err) {
      console.error('Error unliking song:', err);
    }
  };

  // Unlike video - also removes from all custom playlists
  const handleUnlikeVideo = async (video) => {
    try {
      await unlikeVideo(video.id, user?.id, sessionId);
      setLikedVideos(prev => prev.filter(v => v.id !== video.id));
      // Also remove from all custom playlists
      removeVideoFromAllPlaylists(video);
    } catch (err) {
      console.error('Error unliking video:', err);
    }
  };

  // Navigate to video
  const handlePlayVideo = (video) => {
    const slug = video.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    router.push(`/videos/${slug}`);
  };

  // Create playlist
  const handleCreatePlaylist = () => {
    if (!newPlaylistName.trim()) return;
    if (activeTab === 'custom-songs') {
      createSongPlaylist(newPlaylistName.trim());
    } else {
      createVideoPlaylist(newPlaylistName.trim());
    }
    setNewPlaylistName('');
    setShowCreateModal(false);
  };

  // Rename playlist
  const handleRename = (playlistId) => {
    if (!editName.trim()) return;
    if (activeTab === 'custom-songs') {
      renameSongPlaylist(playlistId, editName.trim());
    } else {
      renameVideoPlaylist(playlistId, editName.trim());
    }
    setEditingId(null);
    setEditName('');
  };

  // Delete playlist
  const handleDelete = (playlistId, name) => {
    if (window.confirm(`Supprimer "${name}"?`)) {
      if (activeTab === 'custom-songs') {
        deleteSongPlaylist(playlistId);
      } else {
        deleteVideoPlaylist(playlistId);
      }
    }
  };

  // Open add to playlist modal
  const openPlaylistModal = (item, type) => {
    setSelectedItem(item);
    setSelectedType(type);
    setPlaylistModalOpen(true);
  };

  const isLoading = authLoading || songsLoading || videosLoading;

  // Check if currently playing
  const isCurrentlyPlaying = (song) => {
    return currentType === 'liked' && podcastMeta?.title === song.song_title && podcastMeta?.podcastTitle === song.song_artist && playing;
  };

  return (
    <>
      <Seo lang={lang} title="Mes Playlists" description="Gérez vos playlists personnelles" path="/playlists" />

      <div className="container-max px-4 md:px-5 pb-16">
        <header className="pt-12 md:pt-16 pb-6 md:pb-8">
          <h1 className="text-2xl md:text-5xl font-black mb-2">Mes Playlists</h1>
          <p className="text-sm md:text-lg opacity-80">Vos chansons et vidéos favorites</p>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mt-6">
            <button
              onClick={() => setActiveTab('liked-songs')}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                activeTab === 'liked-songs' ? 'bg-red-500 text-white' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Chansons aimées ({likedSongs.length})
            </button>
            <button
              onClick={() => setActiveTab('liked-videos')}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                activeTab === 'liked-videos' ? 'bg-red-500 text-white' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Vidéos aimées ({likedVideos.length})
            </button>
            <button
              onClick={() => setActiveTab('custom-songs')}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                activeTab === 'custom-songs' ? 'bg-red-500 text-white' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Playlists Musique ({songPlaylists.length})
            </button>
            <button
              onClick={() => setActiveTab('custom-videos')}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                activeTab === 'custom-videos' ? 'bg-red-500 text-white' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Playlists Vidéo ({videoPlaylists.length})
            </button>
          </div>
        </header>

        {!user && !authLoading ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="text-center">
              <div className="text-6xl mb-4">🔒</div>
              <p className="text-xl opacity-70 mb-4">Connectez-vous pour voir vos playlists</p>
              <button onClick={() => router.push('/login')} className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-full transition-colors">
                Se connecter
              </button>
            </div>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-red-500 rounded-full"></div>
          </div>
        ) : (
          <>
            {/* LIKED SONGS TAB */}
            {activeTab === 'liked-songs' && (
              <>
                {likedSongs.length > 0 && (
                  <div className="flex gap-2 mb-4">
                    <button onClick={() => handlePlayAllSongs(likedSongs)} className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-full transition-colors">
                      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                      Tout jouer
                    </button>
                  </div>
                )}
                {likedSongs.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="text-6xl mb-4">💔</div>
                    <p className="text-xl opacity-70">Aucune chanson aimée</p>
                    <p className="text-sm opacity-50 mt-2">Aimez des chansons depuis la radio pour les voir ici</p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {likedSongs.map((song) => {
                      const songKey = `${song.song_title}-${song.song_artist}`;
                      const urlState = songUrls[songKey] || {};
                      const isPlaying = isCurrentlyPlaying(song);
                      return (
                        <div key={song.id} className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm p-3 md:p-4 flex items-center gap-3 hover:shadow-md transition-all ${isPlaying ? 'ring-2 ring-red-500' : ''}`}>
                          <button onClick={() => handlePlaySong(song)} disabled={urlState.loading || urlState.notFound} className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${urlState.notFound ? 'bg-gray-200 dark:bg-gray-700 cursor-not-allowed opacity-50' : isPlaying ? 'bg-red-500 text-white' : 'bg-gray-100 dark:bg-gray-700 hover:bg-red-500 hover:text-white'}`}>
                            {urlState.loading ? <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" /> : isPlaying ? <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg> : <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>}
                          </button>
                          <div className="w-10 h-10 rounded bg-gray-200 dark:bg-gray-700 overflow-hidden flex-shrink-0">
                            {song.album_art ? <img src={song.album_art} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-lg">🎵</div>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-semibold truncate ${isPlaying ? 'text-red-500' : ''}`}>{song.song_title}</p>
                            <p className="text-sm opacity-70 truncate">{song.song_artist}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <button onClick={() => openPlaylistModal(song, 'song')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors" title="Ajouter à une playlist">
                              <svg viewBox="0 0 24 24" className="w-5 h-5 opacity-70" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                            </button>
                            <button onClick={() => handleUnlikeSong(song)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors" title="Retirer des favoris">
                              <svg viewBox="0 0 24 24" className="w-5 h-5 text-red-500" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* LIKED VIDEOS TAB */}
            {activeTab === 'liked-videos' && (
              <>
                {likedVideos.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="text-6xl mb-4">🎬</div>
                    <p className="text-xl opacity-70">Aucune vidéo aimée</p>
                    <p className="text-sm opacity-50 mt-2">Aimez des vidéos pour les voir ici</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {likedVideos.map((video) => (
                      <div key={video.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden group">
                        <div onClick={() => handlePlayVideo(video)} className="relative aspect-video bg-gray-200 dark:bg-gray-700 cursor-pointer">
                          <img src={`https://img.youtube.com/vi/${video.youtube_id}/mqdefault.jpg`} alt={video.title} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center">
                              <svg viewBox="0 0 24 24" className="w-6 h-6 text-white ml-1" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                            </div>
                          </div>
                        </div>
                        <div className="p-3">
                          <h3 className="font-semibold line-clamp-2 mb-1">{video.title}</h3>
                          {video.artist_name && <p className="text-sm opacity-70">{video.artist_name}</p>}
                          <div className="flex items-center gap-2 mt-2">
                            <button onClick={() => openPlaylistModal(video, 'video')} className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-white flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                              Ajouter
                            </button>
                            <button onClick={() => handleUnlikeVideo(video)} className="text-xs text-red-500 hover:text-red-600">Retirer</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* CUSTOM SONG PLAYLISTS TAB */}
            {activeTab === 'custom-songs' && (
              <>
                <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-full transition-colors mb-4">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                  Nouvelle playlist
                </button>
                {songPlaylists.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="text-6xl mb-4">🎵</div>
                    <p className="text-xl opacity-70">Aucune playlist musique</p>
                    <p className="text-sm opacity-50 mt-2">Créez une playlist et ajoutez-y vos chansons aimées</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {songPlaylists.map((playlist) => (
                      <div key={playlist.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                        <div className="p-4 flex items-center gap-4">
                          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center text-white text-2xl flex-shrink-0">🎵</div>
                          <div className="flex-1 min-w-0">
                            {editingId === playlist.id ? (
                              <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleRename(playlist.id)} onBlur={() => handleRename(playlist.id)} className="w-full px-2 py-1 text-lg font-bold bg-gray-100 dark:bg-gray-700 rounded focus:ring-2 focus:ring-red-500 focus:outline-none" autoFocus />
                            ) : (
                              <h3 className="text-lg font-bold truncate">{playlist.name}</h3>
                            )}
                            <p className="text-sm opacity-70">{playlist.songs.length} chanson{playlist.songs.length !== 1 ? 's' : ''}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {playlist.songs.length > 0 && (
                              <button onClick={() => handlePlayAllSongs(playlist.songs)} className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors">
                                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                              </button>
                            )}
                            <button onClick={() => setExpandedPlaylist(expandedPlaylist === playlist.id ? null : playlist.id)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                              <svg className={`w-5 h-5 transition-transform ${expandedPlaylist === playlist.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                            </button>
                            <button onClick={() => { setEditingId(playlist.id); setEditName(playlist.name); }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            </button>
                            <button onClick={() => handleDelete(playlist.id, playlist.name)} className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 rounded-full transition-colors">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        </div>
                        {expandedPlaylist === playlist.id && (
                          <div className="border-t border-gray-200 dark:border-gray-700">
                            {playlist.songs.length === 0 ? (
                              <p className="p-4 text-center text-sm opacity-50">Playlist vide - ajoutez des chansons depuis "Chansons aimées"</p>
                            ) : (
                              playlist.songs.map((song, idx) => (
                                <div key={idx} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                  <button onClick={() => handlePlaySong(song)} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-red-500 hover:text-white flex items-center justify-center flex-shrink-0 transition-colors">
                                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                                  </button>
                                  <div className="w-8 h-8 rounded bg-gray-200 dark:bg-gray-700 overflow-hidden flex-shrink-0">
                                    {song.album_art ? <img src={song.album_art} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-sm">🎵</div>}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate text-sm">{song.song_title}</p>
                                    <p className="text-xs opacity-70 truncate">{song.song_artist}</p>
                                  </div>
                                  <button onClick={() => removeSongFromPlaylist(playlist.id, song)} className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 rounded-full transition-colors">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                  </button>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* CUSTOM VIDEO PLAYLISTS TAB */}
            {activeTab === 'custom-videos' && (
              <>
                <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-full transition-colors mb-4">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                  Nouvelle playlist
                </button>
                {videoPlaylists.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="text-6xl mb-4">🎬</div>
                    <p className="text-xl opacity-70">Aucune playlist vidéo</p>
                    <p className="text-sm opacity-50 mt-2">Créez une playlist et ajoutez-y vos vidéos aimées</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {videoPlaylists.map((playlist) => (
                      <div key={playlist.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                        <div className="p-4 flex items-center gap-4">
                          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-2xl flex-shrink-0">🎬</div>
                          <div className="flex-1 min-w-0">
                            {editingId === playlist.id ? (
                              <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleRename(playlist.id)} onBlur={() => handleRename(playlist.id)} className="w-full px-2 py-1 text-lg font-bold bg-gray-100 dark:bg-gray-700 rounded focus:ring-2 focus:ring-red-500 focus:outline-none" autoFocus />
                            ) : (
                              <h3 className="text-lg font-bold truncate">{playlist.name}</h3>
                            )}
                            <p className="text-sm opacity-70">{playlist.videos.length} vidéo{playlist.videos.length !== 1 ? 's' : ''}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {playlist.videos.length > 0 && (
                              <button onClick={() => router.push(`/playlist/video/${playlist.id}`)} className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors" title="Lire la playlist">
                                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                              </button>
                            )}
                            <button onClick={() => setExpandedPlaylist(expandedPlaylist === playlist.id ? null : playlist.id)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                              <svg className={`w-5 h-5 transition-transform ${expandedPlaylist === playlist.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                            </button>
                            <button onClick={() => { setEditingId(playlist.id); setEditName(playlist.name); }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            </button>
                            <button onClick={() => handleDelete(playlist.id, playlist.name)} className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 rounded-full transition-colors">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        </div>
                        {expandedPlaylist === playlist.id && (
                          <div className="border-t border-gray-200 dark:border-gray-700">
                            {playlist.videos.length === 0 ? (
                              <p className="p-4 text-center text-sm opacity-50">Playlist vide - ajoutez des vidéos depuis "Vidéos aimées"</p>
                            ) : (
                              <div className="grid gap-2 p-2 md:grid-cols-2">
                                {playlist.videos.map((video, idx) => (
                                  <div key={idx} className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors">
                                    <div onClick={() => handlePlayVideo(video)} className="w-24 h-14 rounded bg-gray-200 dark:bg-gray-700 overflow-hidden flex-shrink-0 cursor-pointer relative group">
                                      <img src={`https://img.youtube.com/vi/${video.youtube_id}/mqdefault.jpg`} alt="" className="w-full h-full object-cover" />
                                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                        <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                                      </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium truncate text-sm">{video.title}</p>
                                      {video.artist_name && <p className="text-xs opacity-70 truncate">{video.artist_name}</p>}
                                    </div>
                                    <button onClick={() => removeVideoFromPlaylist(playlist.id, video)} className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 rounded-full transition-colors">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Create Playlist Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Nouvelle playlist {activeTab === 'custom-songs' ? 'musique' : 'vidéo'}</h2>
            <input
              type="text"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreatePlaylist()}
              placeholder="Nom de la playlist..."
              className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none mb-4"
              autoFocus
            />
            <div className="flex gap-2">
              <button onClick={() => setShowCreateModal(false)} className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                Annuler
              </button>
              <button onClick={handleCreatePlaylist} disabled={!newPlaylistName.trim()} className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 disabled:bg-gray-300 disabled:text-gray-500 transition-colors">
                Créer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add to Playlist Modal */}
      <PlaylistModal
        isOpen={playlistModalOpen}
        onClose={() => { setPlaylistModalOpen(false); setSelectedItem(null); }}
        item={selectedItem}
        type={selectedType}
      />
    </>
  );
}
