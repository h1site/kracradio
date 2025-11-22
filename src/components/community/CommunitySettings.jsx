// src/components/community/CommunitySettings.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useProfile, useUpdateProfile } from '../../hooks/useCommunity';
import { supabase } from '../../lib/supabase';
import { COUNTRIES } from '../../constants/countries';
import { useI18n } from '../../i18n';

export default function CommunitySettings() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { profile, loading: loadingProfile, refetch } = useProfile(user?.id);
  const { updateProfile, loading: updating } = useUpdateProfile();

  const [settings, setSettings] = useState({
    is_public: false,
    username: '',
    artist_slug: '',
    bio: '',
    location: '',
    genres: []
  });

  const [message, setMessage] = useState({ type: '', text: '' });
  const [slugPreview, setSlugPreview] = useState('');
  const [slugStatus, setSlugStatus] = useState(null); // 'available', 'taken', 'checking'
  const [slugError, setSlugError] = useState('');

  // Charger les settings du profil
  useEffect(() => {
    if (profile) {
      setSettings({
        is_public: profile.is_public || false,
        username: profile.username || '',
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

  // Vérifier la disponibilité du slug
  const checkSlugAvailability = async (slug) => {
    if (!slug || slug.length < 3) {
      setSlugStatus(null);
      setSlugError('Le nom d\'artiste doit contenir au moins 3 caractères');
      return;
    }

    // Si c'est le slug actuel de l'utilisateur, pas besoin de vérifier
    if (slug === profile?.artist_slug) {
      setSlugStatus('available');
      setSlugError('');
      return;
    }

    setSlugStatus('checking');
    setSlugError('');

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('artist_slug', slug)
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        setSlugStatus('taken');
        setSlugError('Ce nom d\'artiste est déjà pris');
      } else {
        setSlugStatus('available');
        setSlugError('');
      }
    } catch (error) {
      console.error('Error checking slug:', error);
      setSlugStatus(null);
      setSlugError('Erreur lors de la vérification');
    }
  };

  const handleSlugChange = (e) => {
    const slug = generateSlug(e.target.value);
    setSettings(prev => ({ ...prev, artist_slug: slug }));
    setSlugPreview(slug);

    // Vérifier la disponibilité après un petit délai (debounce)
    if (slug) {
      setTimeout(() => checkSlugAvailability(slug), 500);
    } else {
      setSlugStatus(null);
      setSlugError('');
    }
  };

  const handleTogglePublic = async () => {
    try {
      const newValue = !settings.is_public;

      // Si on veut rendre le profil public, vérifier que le slug est valide
      if (newValue && (!settings.artist_slug || settings.artist_slug.length < 3)) {
        setMessage({
          type: 'error',
          text: '❌ Vous devez définir un nom d\'artiste (min. 3 caractères) pour rendre votre profil public'
        });
        setTimeout(() => setMessage({ type: '', text: '' }), 5000);
        return;
      }

      if (newValue && slugStatus === 'taken') {
        setMessage({
          type: 'error',
          text: '❌ Le nom d\'artiste choisi est déjà pris. Veuillez en choisir un autre.'
        });
        setTimeout(() => setMessage({ type: '', text: '' }), 5000);
        return;
      }

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

    // Sauvegarder l'ancien slug pour vérifier s'il a changé
    const oldSlug = profile?.artist_slug;
    const slugChanged = oldSlug !== settings.artist_slug;

    try {
      await updateProfile(user.id, {
        username: settings.username,
        artist_slug: settings.artist_slug,
        bio: settings.bio,
        location: settings.location,
        genres: settings.genres
      });

      // Rafraîchir le profil depuis la DB
      await refetch();

      setMessage({ type: 'success', text: '✅ Paramètres enregistrés avec succès' });

      // Si le slug a changé, rafraîchir la page après un court délai
      if (slugChanged) {
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (error) {
      setMessage({ type: 'error', text: `❌ Erreur: ${error.message}` });
    }
  };

  const addGenre = (genre) => {
    if (genre && !settings.genres.includes(genre) && settings.genres.length < 3) {
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
          ⚙️ {t.community.settings.title}
        </h2>
        <button
          onClick={handleSaveSettings}
          disabled={updating}
          className="px-6 py-2 bg-accent text-bg-primary font-semibold rounded-lg hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {updating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-bg-primary"></div>
              {t.community.saving}
            </>
          ) : (
            <>
              💾 {t.community.save}
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
          ✏️ {t.community.settings.profileInfo}
        </h3>

        {/* Username */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-text-primary mb-2">
            👤 {t.community.settings.username || 'Nom d\'utilisateur'}
          </label>
          <input
            type="text"
            value={settings.username}
            onChange={(e) => setSettings(prev => ({ ...prev, username: e.target.value }))}
            placeholder="username"
            className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded-lg
                     text-text-primary placeholder-text-secondary
                     focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <p className="text-xs text-text-secondary mt-1">
            📝 Votre nom d'utilisateur (ex: karpe_25, rhenoir, etc.). Peut contenir des lettres, chiffres et underscores.
          </p>
        </div>

        {/* Nom d'artiste / Slug */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-text-primary mb-2">
            🎤 {t.community.settings.artistSlug} {settings.is_public && <span className="text-red-500">*</span>}
          </label>
          <div className="relative">
            <input
              type="text"
              value={settings.artist_slug}
              onChange={handleSlugChange}
              placeholder={t.community.settings.artistSlugPlaceholder}
              className={`w-full px-4 py-2 pr-10 bg-bg-tertiary border rounded-lg
                       text-text-primary placeholder-text-secondary
                       focus:outline-none focus:ring-2 focus:ring-accent
                       ${slugStatus === 'available' ? 'border-green-500' : ''}
                       ${slugStatus === 'taken' ? 'border-red-500' : 'border-border'}`}
            />
            {/* Indicateur de statut */}
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {slugStatus === 'checking' && (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-accent"></div>
              )}
              {slugStatus === 'available' && (
                <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
              {slugStatus === 'taken' && (
                <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          </div>
          {/* Messages d'erreur */}
          {slugError && (
            <p className="text-xs text-red-500 mt-1">
              {slugError}
            </p>
          )}
          {slugStatus === 'available' && slugPreview && (
            <div className="mt-2 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
              <p className="text-sm text-green-400 flex items-center gap-2">
                ✓ Nom d'artiste disponible
              </p>
              <p className="text-xs text-text-secondary mt-1">
                🔗 Votre URL publique:
              </p>
              <p className="text-accent font-mono text-sm mt-1">
                kracradio.com/profile/{slugPreview}
              </p>
            </div>
          )}
          {!slugError && (
            <p className="text-xs text-text-secondary mt-1">
              Les espaces seront remplacés par des underscores (_). Minimum 3 caractères.
            </p>
          )}
        </div>

        {/* Bio */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-text-primary mb-2">
            {t.community.settings.bio}
          </label>
          <textarea
            value={settings.bio}
            onChange={(e) => setSettings(prev => ({ ...prev, bio: e.target.value }))}
            placeholder={t.community.settings.bioPlaceholder}
            maxLength={500}
            rows={4}
            className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded-lg
                     text-text-primary placeholder-text-secondary
                     focus:outline-none focus:ring-2 focus:ring-accent resize-none"
          />
          <p className="text-xs text-text-secondary mt-1">
            {t.community.settings.bioCount.replace('{count}', settings.bio.length)}
          </p>
        </div>

        {/* Pays */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-text-primary mb-2">
            📍 {t.community.settings.country}
          </label>
          <select
            value={settings.location}
            onChange={(e) => setSettings(prev => ({ ...prev, location: e.target.value }))}
            className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded-lg
                     text-text-primary
                     focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer"
          >
            <option value="">{t.community.settings.countryPlaceholder}</option>
            {COUNTRIES.map(country => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
        </div>

        {/* Genres musicaux */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-text-primary mb-2">
            🎵 {t.community.settings.genresMax}
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

          {/* Suggestions de genres organisées par catégorie */}
          {settings.genres.length < 3 && (
            <div className="space-y-4">
              {/* Musiques urbaines */}
              <div>
                <h4 className="text-xs font-semibold text-text-secondary mb-2">🎤 Musiques urbaines</h4>
                <div className="flex flex-wrap gap-2">
                  {['Hip-Hop', 'Rap', 'Trap', 'Drill', 'R&B', 'Soul', 'Funk', 'Neo-Soul']
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
              </div>

              {/* Musiques Rock et alternatives */}
              <div>
                <h4 className="text-xs font-semibold text-text-secondary mb-2">🎸 Musiques Rock et alternatives</h4>
                <div className="flex flex-wrap gap-2">
                  {['Rock', 'Hard Rock', 'Punk', 'Grunge', 'Indie', 'Alternative Rock', 'Garage Rock', 'Progressive Rock', 'Psychedelic Rock']
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
              </div>

              {/* Musiques électroniques */}
              <div>
                <h4 className="text-xs font-semibold text-text-secondary mb-2">🎧 Musiques électroniques</h4>
                <div className="flex flex-wrap gap-2">
                  {['Électro', 'House', 'Techno', 'Trance', 'Drum & Bass', 'Dubstep', 'Chillwave / Lo-Fi', 'Industrial / EBM', 'Synthwave']
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
              </div>

              {/* Jazz, Blues et dérivés */}
              <div>
                <h4 className="text-xs font-semibold text-text-secondary mb-2">🎷 Jazz, Blues et dérivés</h4>
                <div className="flex flex-wrap gap-2">
                  {['Jazz', 'Smooth Jazz', 'Blues', 'Swing', 'Funk-Jazz / Fusion', 'Bebop']
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
              </div>

              {/* Pop et dérivés */}
              <div>
                <h4 className="text-xs font-semibold text-text-secondary mb-2">🎵 Pop et dérivés</h4>
                <div className="flex flex-wrap gap-2">
                  {['Pop', 'Electro-Pop', 'Dream Pop', 'K-Pop / J-Pop / C-Pop', 'Dance Pop', 'Synth Pop']
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
              </div>

              {/* Métal et ses branches */}
              <div>
                <h4 className="text-xs font-semibold text-text-secondary mb-2">🤘 Métal et ses branches</h4>
                <div className="flex flex-wrap gap-2">
                  {['Metal', 'Heavy Metal', 'Thrash Metal', 'Death Metal', 'Black Metal', 'Doom Metal', 'Metalcore', 'Industrial Metal']
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
              </div>

              {/* Reggae et musiques tropicales */}
              <div>
                <h4 className="text-xs font-semibold text-text-secondary mb-2">🌴 Reggae et musiques tropicales</h4>
                <div className="flex flex-wrap gap-2">
                  {['Reggae', 'Dub', 'Ska', 'Dancehall', 'Calypso', 'Soca', 'Afrobeat']
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
              </div>

              {/* Musiques classiques et instrumentales */}
              <div>
                <h4 className="text-xs font-semibold text-text-secondary mb-2">🎻 Musiques classiques et instrumentales</h4>
                <div className="flex flex-wrap gap-2">
                  {['Classique', 'Opéra', 'Baroque', 'Symphonique', 'Instrumental', 'Film Score / Soundtrack']
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
              </div>

              {/* Musiques du monde */}
              <div>
                <h4 className="text-xs font-semibold text-text-secondary mb-2">🌍 Musiques du monde</h4>
                <div className="flex flex-wrap gap-2">
                  {['Latin', 'Salsa', 'Bachata', 'Flamenco', 'Oriental / Arabe', 'Musique Africaine', 'Celtic / Folk', 'Country', 'Bluegrass']
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
              </div>

              {/* Musiques modernes et hybrides */}
              <div>
                <h4 className="text-xs font-semibold text-text-secondary mb-2">💻 Musiques modernes et hybrides</h4>
                <div className="flex flex-wrap gap-2">
                  {['Lo-Fi', 'Chillout', 'Ambient', 'Experimental', 'Post-Rock', 'Alternative Electronic']
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
              </div>
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
