// src/components/PlaylistModal.jsx
// Modal for adding songs or videos to user playlists
import React, { useState } from 'react';
import { usePlaylists } from '../context/PlaylistContext';
import { useI18n } from '../i18n';

export default function PlaylistModal({ isOpen, onClose, item, type = 'song' }) {
  const { t } = useI18n();
  const {
    songPlaylists,
    videoPlaylists,
    createSongPlaylist,
    createVideoPlaylist,
    addSongToPlaylist,
    addVideoToPlaylist,
    isSongInPlaylist,
    isVideoInPlaylist,
    removeSongFromPlaylist,
    removeVideoFromPlaylist
  } = usePlaylists();

  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [showCreateInput, setShowCreateInput] = useState(false);

  if (!isOpen || !item) return null;

  const playlists = type === 'song' ? songPlaylists : videoPlaylists;
  const createPlaylist = type === 'song' ? createSongPlaylist : createVideoPlaylist;
  const addToPlaylist = type === 'song' ? addSongToPlaylist : addVideoToPlaylist;
  const isInPlaylist = type === 'song' ? isSongInPlaylist : isVideoInPlaylist;
  const removeFromPlaylist = type === 'song' ? removeSongFromPlaylist : removeVideoFromPlaylist;

  const handleCreatePlaylist = () => {
    if (!newPlaylistName.trim()) return;

    const newPl = createPlaylist(newPlaylistName.trim());
    // Automatically add the current item to the new playlist
    addToPlaylist(newPl.id, item);
    setNewPlaylistName('');
    setShowCreateInput(false);
  };

  const handleTogglePlaylist = (playlistId) => {
    if (isInPlaylist(playlistId, item)) {
      removeFromPlaylist(playlistId, item);
    } else {
      addToPlaylist(playlistId, item);
    }
  };

  const itemTitle = type === 'song'
    ? `${item.song_title} - ${item.song_artist}`
    : item.title;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {t.playlists?.addTo || 'Add to Playlist'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[280px]">
              {itemTitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Create New Playlist */}
        <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-700">
          {showCreateInput ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreatePlaylist()}
                placeholder={t.playlists?.playlistName || 'Playlist name...'}
                className="flex-1 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 border-0 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
                autoFocus
              />
              <button
                onClick={handleCreatePlaylist}
                disabled={!newPlaylistName.trim()}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 disabled:dark:bg-gray-600 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                {t.playlists?.create || 'Create'}
              </button>
              <button
                onClick={() => {
                  setShowCreateInput(false);
                  setNewPlaylistName('');
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowCreateInput(true)}
              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <span className="font-medium">{t.playlists?.newPlaylist || 'New Playlist'}</span>
            </button>
          )}
        </div>

        {/* Playlist List */}
        <div className="max-h-[300px] overflow-y-auto">
          {playlists.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                {t.playlists?.noPlaylists || 'No playlists yet. Create one above!'}
              </p>
            </div>
          ) : (
            <div className="py-2">
              {playlists.map((playlist) => {
                const isAdded = isInPlaylist(playlist.id, item);
                const itemCount = type === 'song' ? playlist.songs.length : playlist.videos.length;

                return (
                  <button
                    key={playlist.id}
                    onClick={() => handleTogglePlaylist(playlist.id)}
                    className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      isAdded
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-600'
                    }`}>
                      {isAdded ? (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-gray-900 dark:text-white">{playlist.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {itemCount} {type === 'song'
                          ? (itemCount === 1 ? (t.likedSongs?.song || 'song') : (t.likedSongs?.songs || 'songs'))
                          : (itemCount === 1 ? 'video' : 'videos')
                        }
                      </p>
                    </div>
                    {isAdded && (
                      <span className="text-xs text-red-500 font-medium">
                        {t.playlists?.added || 'Added'}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <button
            onClick={onClose}
            className="w-full py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            {t.common?.done || 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
}
