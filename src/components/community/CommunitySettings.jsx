// src/components/community/CommunitySettings.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useProfile, useUpdateProfile } from '../../hooks/useCommunity';

export default function CommunitySettings() {
  const { user } = useAuth();
  const { profile, loading: loadingProfile, refetch } = useProfile(user?.id);
  const { updateProfile, loading: updating } = useUpdateProfile();

  const [settings, setSettings] = useState({
    is_public: false,
    artist_slug: '',
    bio: '',
    location: '',
    genres: []
  });

  const [message, setMessage] = useState({ type: '', text: '' });
  const [slugPreview, setSlugPreview] = useState('');

  // Charger les settings du profil
  useEffect(() => {
    if (profile) {
      setSettings({
        is_public: profile.is_public || false,
        artist_slug: profile.artist_slug || '',
        bio: profile.bio || '',
        location: profile.location || '',
        genres: profile.genres || []
      });
      setSlugPreview(profile.artist_slug || '');
    }
  }, [profile]);

  // Fonction pour générer un slug propre
  const generateSlug = (text) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Retire accents
      .replace(/[^a-z0-9\s]/g, '') // Garde seulement lettres, chiffres, espaces
      .replace(/\s+/g, '_') // Remplace espaces par _
      .replace(/_+/g, '_') // Retire _ multiples
      .replace(/^_|_$/g, ''); // Retire _ début/fin
  };

  const handleSlugChange = (e) => {
    const slug = generateSlug(e.target.value);
    setSettings(prev => ({ ...prev, artist_slug: slug }));
    setSlugPreview(slug);
  };

  const handleTogglePublic = async () => {
    try {
      const newValue = !settings.is_public;
      await updateProfile(user.id, { is_public: newValue });
      setSettings(prev => ({ ...prev, is_public: newValue }));

      // Rafraîchir le profil depuis la DB
      await refetch();

      setMessage({
        type: 'success',
        text: newValue
          ? '✅ Votre profil est maintenant public'
          : '🔒 Votre profil est maintenant privé'
      });

      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: '❌ Erreur lors de la mise à jour' });
      console.error('Toggle public error:', error);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();

    try {
      await updateProfile(user.id, {
        artist_slug: settings.artist_slug,
        bio: settings.bio,
        location: settings.location,
        genres: settings.genres
      });

      // Rafraîchir le profil depuis la DB
      await refetch();

      setMessage({ type: 'success', text: '✅ Paramètres enregistrés avec succès' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: `❌ Erreur: ${error.message}` });
    }
  };

  const addGenre = (genre) => {
    if (genre && !settings.genres.includes(genre) && settings.genres.length < 5) {
      setSettings(prev => ({ ...prev, genres: [...prev.genres, genre] }));
    }
  };

  const removeGenre = (genre) => {
    setSettings(prev => ({
      ...prev,
      genres: prev.genres.filter(g => g !== genre)
    }));
  };

  if (loadingProfile) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px' }}>
      {/* Header avec bouton Enregistrer */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-text-primary">
          ⚙️ Paramètres de la communauté
        </h2>
        <button
          onClick={handleSaveSettings}
          disabled={updating}
          className="px-6 py-2 bg-accent text-bg-primary font-semibold rounded-lg hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {updating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-bg-primary"></div>
              Enregistrement...
            </>
          ) : (
            <>
              💾 Enregistrer
            </>
          )}
        </button>
      </div>

      {/* Messages de feedback */}
      {message.text && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success'
            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
            : 'bg-red-500/20 text-red-400 border border-red-500/30'
        }`}>
          {message.text}
        </div>
      )}

      {/* Section visibilité du profil */}
      <div className="bg-bg-secondary rounded-lg p-6 mb-6 border border-border">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-text-primary mb-2 flex items-center gap-2">
              {settings.is_public ? '🌐 Profil public' : '🔒 Profil privé'}
              {settings.is_public && (
                <span className="px-2 py-1 text-xs bg-accent/20 text-accent rounded-full">
                  PUBLIC
                </span>
              )}
            </h3>
            <p className="text-text-secondary text-sm">
              {settings.is_public
                ? 'Votre profil est visible par tous les visiteurs de KracRadio'
                : 'Votre profil est visible uniquement par vos connexions'}
            </p>
          </div>

          <button
            onClick={handleTogglePublic}
            disabled={updating}
            className={`
              relative inline-flex h-8 w-14 items-center rounded-full transition-colors
              ${settings.is_public ? 'bg-accent' : 'bg-border'}
              ${updating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <span
              className={`
                inline-block h-6 w-6 transform rounded-full bg-white transition-transform
                ${settings.is_public ? 'translate-x-7' : 'translate-x-1'}
              `}
            />
          </button>
        </div>

        {settings.is_public && (
          <div className="mt-4 p-4 bg-accent/10 rounded-lg border border-accent/20">
            <p className="text-sm text-text-secondary">
              💡 <strong>Mode public activé:</strong> Les gens peuvent voir votre profil,
              vos posts publics, vos blogs et podcasts. Vous pouvez recevoir des demandes de follow.
            </p>
          </div>
        )}
      </div>

      {/* Formulaire des paramètres */}
      <form onSubmit={handleSaveSettings} className="bg-bg-secondary rounded-lg p-6 border border-border">
        <h3 className="text-xl font-semibold text-text-primary mb-4">
          ✏️ Informations du profil
        </h3>

        {/* Nom d'artiste / Slug */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-text-primary mb-2">
            🎤 Nom d'artiste (pour URL publique)
          </label>
          <input
            type="text"
            value={settings.artist_slug}
            onChange={handleSlugChange}
            placeholder="mon_nom_artiste"
            className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded-lg
                     text-text-primary placeholder-text-secondary
                     focus:outline-none focus:ring-2 focus:ring-accent"
          />
          {slugPreview && (
            <div className="mt-2 p-3 bg-accent/10 rounded-lg border border-accent/20">
              <p className="text-sm text-text-secondary">
                🔗 Votre URL publique:
              </p>
              <p className="text-accent font-mono text-sm mt-1">
                kracradio.com/profile/{slugPreview}
              </p>
            </div>
          )}
          <p className="text-xs text-text-secondary mt-1">
            Les espaces seront remplacés par des underscores (_)
          </p>
        </div>

        {/* Bio */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-text-primary mb-2">
            Bio
          </label>
          <textarea
            value={settings.bio}
            onChange={(e) => setSettings(prev => ({ ...prev, bio: e.target.value }))}
            placeholder="Parlez-nous de vous, votre musique, vos projets..."
            maxLength={500}
            rows={4}
            className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded-lg
                     text-text-primary placeholder-text-secondary
                     focus:outline-none focus:ring-2 focus:ring-accent resize-none"
          />
          <p className="text-xs text-text-secondary mt-1">
            {settings.bio.length}/500 caractères
          </p>
        </div>

        {/* Localisation */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-text-primary mb-2">
            📍 Localisation
          </label>
          <input
            type="text"
            value={settings.location}
            onChange={(e) => setSettings(prev => ({ ...prev, location: e.target.value }))}
            placeholder="ex: Montréal, QC"
            className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded-lg
                     text-text-primary placeholder-text-secondary
                     focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        {/* Genres musicaux */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-text-primary mb-2">
            🎵 Genres musicaux (max 5)
          </label>

          {/* Tags sélectionnés */}
          <div className="flex flex-wrap gap-2 mb-3">
            {settings.genres.map(genre => (
              <span
                key={genre}
                className="px-3 py-1 bg-accent/20 text-accent rounded-full text-sm flex items-center gap-2"
              >
                {genre}
                <button
                  type="button"
                  onClick={() => removeGenre(genre)}
                  className="hover:text-accent-hover"
                >
                  ×
                </button>
              </span>
            ))}
          </div>

          {/* Suggestions de genres */}
          {settings.genres.length < 5 && (
            <div className="flex flex-wrap gap-2">
              {['Hip-Hop', 'Rap', 'R&B', 'Rock', 'Jazz', 'Électro', 'Pop', 'Indie', 'Metal', 'Reggae']
                .filter(g => !settings.genres.includes(g))
                .map(genre => (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => addGenre(genre)}
                    className="px-3 py-1 bg-bg-tertiary border border-border rounded-full text-sm
                             hover:bg-accent/10 hover:border-accent/30 transition-colors"
                  >
                    + {genre}
                  </button>
                ))}
            </div>
          )}
        </div>

      </form>

      {/* Lien vers profil public */}
      {settings.is_public && settings.artist_slug && (
        <div className="mt-6 p-4 bg-bg-secondary rounded-lg border border-border">
          <p className="text-sm text-text-secondary mb-2">
            🔗 Votre profil public:
          </p>
          <a
            href={`/profile/${settings.artist_slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:text-accent-hover underline"
          >
            kracradio.com/profile/{settings.artist_slug}
          </a>
        </div>
      )}

    </div>
  );
}
