// src/pages/LikedSongs.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n';
import { getUserLikedSongs, removeSongLike } from '../lib/supabase';

export default function LikedSongs() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [likedSongs, setLikedSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const site = t?.site ?? {};
  const pageTitle = 'Chansons aimées';
  const noLikesMessage = 'Vous n\'avez pas encore aimé de chansons';

  useEffect(() => {
    // Attendre que l'auth soit prêt
    if (authLoading) return;

    if (!user) {
      navigate('/login');
      return;
    }

    const loadLikedSongs = async () => {
      try {
        setLoading(true);
        const songs = await getUserLikedSongs();
        setLikedSongs(songs);
        setError(null);
      } catch (err) {
        console.error('Error loading liked songs:', err);
        // Check if it's a table not found error
        if (err.message?.includes('relation') || err.message?.includes('does not exist')) {
          setError('La fonctionnalité de likes n\'est pas encore activée. Veuillez contacter l\'administrateur.');
        } else {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    loadLikedSongs();
  }, [user, authLoading, navigate]);

  const handleUnlike = async (song) => {
    try {
      await removeSongLike({
        channelKey: song.channel_key,
        title: song.song_title,
        artist: song.song_artist
      });

      // Remove from local state
      setLikedSongs(prev => prev.filter(s => s.id !== song.id));
    } catch (err) {
      console.error('Error unliking song:', err);
    }
  };

  if (loading) {
    return (
      <div className="container-max px-5 py-16">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg opacity-70">Chargement...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-max px-5 py-16">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg text-red-500">Erreur: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-max px-5 pb-16">
      <header className="pt-16 pb-12">
        <h1 className="text-4xl md:text-5xl font-black mb-4">{pageTitle}</h1>
        <p className="text-lg opacity-80">
          {likedSongs.length} chanson{likedSongs.length !== 1 ? 's' : ''} aimée{likedSongs.length !== 1 ? 's' : ''}
        </p>
      </header>

      {likedSongs.length === 0 ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-center">
            <div className="text-6xl mb-4">💔</div>
            <p className="text-xl opacity-70">{noLikesMessage}</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {likedSongs.map((song) => (
            <div
              key={song.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 flex items-center gap-4 hover:shadow-lg transition-shadow"
            >
              {/* Album Art */}
              <div className="w-16 h-16 rounded overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                {song.album_art ? (
                  <img
                    src={song.album_art}
                    alt={song.song_title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">
                    🎵
                  </div>
                )}
              </div>

              {/* Song Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg truncate" title={song.song_title}>
                  {song.song_title}
                </h3>
                <p className="text-sm opacity-70 truncate" title={song.song_artist}>
                  {song.song_artist}
                </p>
                <p className="text-xs opacity-50 mt-1">
                  {song.channel_name} • {new Date(song.created_at).toLocaleDateString('fr-FR')}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleUnlike(song)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                  title="Retirer des favoris"
                  aria-label="Retirer des favoris"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="w-6 h-6 text-red-500"
                    fill="currentColor"
                  >
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
