// src/components/community/CommunitySettings.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useProfile, useUpdateProfile } from '../../hooks/useCommunity';
import { supabase } from '../../lib/supabase';
import { COUNTRIES } from '../../constants/countries';
import { useI18n } from '../../i18n';

// Info Popup Component
function InfoPopup({ title, content, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" onClick={onClose}>
      <div className="bg-[#242526] rounded-lg max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        <div className="text-[15px] text-gray-300 leading-relaxed space-y-3">
          {content}
        </div>
        <button
          onClick={onClose}
          className="mt-6 w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors"
        >
          Compris
        </button>
      </div>
    </div>
  );
}

// Toggle Switch Component - Style Facebook
function Toggle({ enabled, onChange, disabled }) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      className={`
        relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200
        ${enabled ? 'bg-blue-500' : 'bg-gray-600'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <span
        className={`
          inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200
          ${enabled ? 'translate-x-6' : 'translate-x-1'}
        `}
      />
    </button>
  );
}

// Setting Row Component - Style Facebook épuré
function SettingRow({ title, description, children, link }) {
  return (
    <div className="flex items-start justify-between px-4 py-4 gap-4">
      <div className="flex-1 min-w-0">
        <h4 className="text-[15px] font-medium text-white">{title}</h4>
        {description && (
          <p className="text-[13px] text-gray-400 mt-1 leading-relaxed">{description}</p>
        )}
        {link && (
          <a href={link.href} className="text-[13px] text-blue-400 hover:underline mt-1 inline-block font-medium">
            {link.text}
          </a>
        )}
      </div>
      <div className="flex-shrink-0 pt-0.5">
        {children}
      </div>
    </div>
  );
}

// Section Divider
function Divider() {
  return <div className="h-px bg-gray-800/50 my-1" />;
}

export default function CommunitySettings() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { profile, loading: loadingProfile, refetch } = useProfile(user?.id);
  const { updateProfile, loading: updating } = useUpdateProfile();

  const [settings, setSettings] = useState({
    is_public: true,
    username: '',
    artist_slug: '',
    bio: '',
    location: '',
    genres: []
  });

  const [message, setMessage] = useState({ type: '', text: '' });
  const [slugStatus, setSlugStatus] = useState(null);
  const [slugError, setSlugError] = useState('');
  const [showGenres, setShowGenres] = useState(false);
  const [showPublicProfilePopup, setShowPublicProfilePopup] = useState(false);

  useEffect(() => {
    if (profile) {
      setSettings({
        is_public: profile.is_public ?? true,
        username: profile.username || '',
        artist_slug: profile.artist_slug || '',
        bio: profile.bio || '',
        location: profile.location || '',
        genres: profile.genres || []
      });
    }
  }, [profile]);

  const generateSlug = (text) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  };

  const checkSlugAvailability = async (slug) => {
    if (!slug || slug.length < 3) {
      setSlugStatus(null);
      setSlugError(t.community?.settings?.artistSlugMin || 'Min. 3 caractères');
      return;
    }

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
        setSlugError(t.community?.settings?.artistSlugTaken || 'Ce nom est déjà pris');
      } else {
        setSlugStatus('available');
        setSlugError('');
      }
    } catch (error) {
      console.error('Error checking slug:', error);
      setSlugStatus(null);
      setSlugError('Erreur');
    }
  };

  const handleSlugChange = (e) => {
    const slug = generateSlug(e.target.value);
    setSettings(prev => ({ ...prev, artist_slug: slug }));
    if (slug) {
      setTimeout(() => checkSlugAvailability(slug), 500);
    } else {
      setSlugStatus(null);
      setSlugError('');
    }
  };

  const handleTogglePublic = async () => {
    const newValue = !settings.is_public;

    if (newValue && (!settings.artist_slug || settings.artist_slug.length < 3)) {
      setMessage({ type: 'error', text: t.community?.settings?.artistSlugRequired || 'Définissez un nom d\'artiste (min. 3 car.) pour être public' });
      setTimeout(() => setMessage({ type: '', text: '' }), 4000);
      return;
    }

    if (newValue && slugStatus === 'taken') {
      setMessage({ type: 'error', text: t.community?.settings?.artistSlugTakenError || 'Ce nom est déjà pris' });
      setTimeout(() => setMessage({ type: '', text: '' }), 4000);
      return;
    }

    try {
      await updateProfile(user.id, { is_public: newValue });
      setSettings(prev => ({ ...prev, is_public: newValue }));
      await refetch();
      setMessage({ type: 'success', text: newValue ? (t.community?.settings?.publicEnabled || 'Public profile enabled') : (t.community?.settings?.privateEnabled || 'Private profile enabled') });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: t.community?.customization?.error || 'Error' });
    }
  };

  const handleSave = async () => {
    console.log('[CommunitySettings] handleSave called');
    console.log('[CommunitySettings] user.id:', user?.id);
    console.log('[CommunitySettings] settings:', settings);

    try {
      const updateData = {
        username: settings.username,
        artist_slug: settings.artist_slug,
        bio: settings.bio,
        location: settings.location,
        genres: settings.genres
      };
      console.log('[CommunitySettings] Calling updateProfile with:', updateData);

      await updateProfile(user.id, updateData);
      console.log('[CommunitySettings] updateProfile done, refetching...');

      await refetch();
      console.log('[CommunitySettings] refetch done');

      setMessage({ type: 'success', text: t.community?.settings?.settingsSaved || 'Enregistré' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('[CommunitySettings] handleSave error:', error);
      setMessage({ type: 'error', text: error.message });
    }
  };

  const addGenre = (genre) => {
    if (genre && !settings.genres.includes(genre) && settings.genres.length < 3) {
      setSettings(prev => ({ ...prev, genres: [...prev.genres, genre] }));
    }
  };

  const removeGenre = (genre) => {
    setSettings(prev => ({ ...prev, genres: prev.genres.filter(g => g !== genre) }));
  };

  const allGenres = [
    'Hip-Hop', 'Rap', 'R&B', 'Soul', 'Funk', 'Rock', 'Punk', 'Indie', 'Metal',
    'Électro', 'House', 'Techno', 'Jazz', 'Blues', 'Pop', 'Reggae', 'Afrobeat',
    'Classique', 'Lo-Fi', 'Ambient', 'Country', 'Latin', 'World'
  ];

  if (loadingProfile) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-600 border-t-white"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      {/* Popups */}
      {showPublicProfilePopup && (
        <InfoPopup
          title="Profil Public"
          content={
            <>
              <p>Votre <strong>profil public</strong> est visible par tous les visiteurs de KracRadio.</p>
              <p className="mt-2">Il affiche :</p>
              <ul className="list-disc list-inside space-y-2 mt-2">
                <li>Votre nom d'utilisateur et photo</li>
                <li>Votre bio et localisation</li>
                <li>Vos articles et podcasts publiés</li>
              </ul>
              <p className="mt-3">Vous pouvez désactiver votre profil public à tout moment pour le rendre privé.</p>
            </>
          }
          onClose={() => setShowPublicProfilePopup(false)}
        />
      )}

      {/* Message feedback */}
      {message.text && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${
          message.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
        }`}>
          {message.text}
        </div>
      )}

      {/* Section: Visibilité */}
      <div className="bg-[#242526] rounded-lg mb-4">
        <SettingRow
          title={t.community?.settings?.isPublic || "Profil public"}
          description={settings.is_public
            ? (t.community?.settings?.visibilityBannerPublic || "Votre profil est visible par tous les visiteurs. Vos articles, podcasts et informations sont accessibles publiquement.")
            : (t.community?.settings?.visibilityBannerPrivate || "Votre profil est en mode privé. Activez pour être découvert par la communauté.")
          }
        >
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPublicProfilePopup(true)}
              className="text-gray-400 hover:text-white transition-colors"
              title="En savoir plus"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </button>
            <Toggle enabled={settings.is_public} onChange={handleTogglePublic} disabled={updating} />
          </div>
        </SettingRow>

        {settings.is_public && settings.artist_slug && (
          <>
            <Divider />
            <div className="px-4 py-3">
              <p className="text-[13px] text-gray-400">{t.community?.settings?.yourPublicProfile || "Your public profile"}</p>
              <a
                href={`/profile/${settings.artist_slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline text-[15px] font-medium flex items-center gap-2"
              >
                kracradio.com/profile/{settings.artist_slug}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </>
        )}
      </div>

      {/* Section: Informations du profil */}
      <div className="bg-[#242526] rounded-lg mb-4">
        <div className="px-4 py-3 border-b border-gray-700/50">
          <h3 className="text-[17px] font-semibold text-white">{t.community?.settings?.profileInfo || "Profile information"}</h3>
        </div>

        {/* Nom d'utilisateur */}
        <div className="px-4 py-4">
          <label className="block text-[13px] text-gray-400 mb-2">{t.community?.settings?.username || "Username"}</label>
          <input
            type="text"
            value={settings.username}
            onChange={(e) => setSettings(prev => ({ ...prev, username: e.target.value }))}
            placeholder="votre_nom"
            className="w-full px-3 py-2.5 bg-[#3a3b3c] rounded-lg text-white text-[15px] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <Divider />

        {/* Nom d'artiste (slug) */}
        <div className="px-4 py-4">
          <label className="block text-[13px] text-gray-400 mb-2">
            {t.community?.settings?.artistSlug || "Artist name (public URL)"}
            {settings.is_public && <span className="text-red-400 ml-1">*</span>}
          </label>
          <div className="relative">
            <input
              type="text"
              value={settings.artist_slug}
              onChange={handleSlugChange}
              placeholder="mon_nom_artiste"
              className={`w-full px-3 py-2.5 bg-[#3a3b3c] rounded-lg text-white text-[15px] placeholder-gray-500 focus:outline-none focus:ring-2 ${
                slugStatus === 'available' ? 'focus:ring-green-500 ring-1 ring-green-500/50' :
                slugStatus === 'taken' ? 'focus:ring-red-500 ring-1 ring-red-500/50' :
                'focus:ring-blue-500'
              }`}
            />
            {slugStatus === 'checking' && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-500 border-t-white"></div>
              </div>
            )}
            {slugStatus === 'available' && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            )}
            {slugStatus === 'taken' && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
          {slugError && <p className="text-[12px] text-red-400 mt-1">{slugError}</p>}
          {slugStatus === 'available' && settings.artist_slug && (
            <p className="text-[12px] text-green-400 mt-1">{t.community?.settings?.available || "Available"}</p>
          )}
        </div>

        <Divider />

        {/* Bio */}
        <div className="px-4 py-4">
          <label className="block text-[13px] text-gray-400 mb-2">{t.community?.settings?.bio || "Bio"}</label>
          <textarea
            value={settings.bio}
            onChange={(e) => setSettings(prev => ({ ...prev, bio: e.target.value }))}
            placeholder={t.community?.settings?.bioPlaceholder || "Tell us about you, your music..."}
            maxLength={500}
            rows={3}
            className="w-full px-3 py-2.5 bg-[#3a3b3c] rounded-lg text-white text-[15px] placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <p className="text-[12px] text-gray-500 mt-1 text-right">{settings.bio.length}/500</p>
        </div>

        <Divider />

        {/* Pays */}
        <div className="px-4 py-4">
          <label className="block text-[13px] text-gray-400 mb-2">{t.community?.settings?.country || "Country"}</label>
          <select
            value={settings.location}
            onChange={(e) => setSettings(prev => ({ ...prev, location: e.target.value }))}
            className="w-full px-3 py-2.5 bg-[#3a3b3c] rounded-lg text-white text-[15px] focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="">{t.community?.settings?.selectCountry || "Select a country"}</option>
            {COUNTRIES.map(country => (
              <option key={country} value={country}>{country}</option>
            ))}
          </select>
        </div>

        <Divider />

        {/* Genres */}
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-[13px] text-gray-400">{t.community?.settings?.genresMax || "Music genres (max 3)"}</label>
            <button
              type="button"
              onClick={() => setShowGenres(!showGenres)}
              className="text-[13px] text-blue-400 hover:underline"
            >
              {showGenres ? (t.community?.settings?.hide || 'Hide') : (t.community?.settings?.edit || 'Edit')}
            </button>
          </div>

          {settings.genres.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {settings.genres.map(genre => (
                <span
                  key={genre}
                  className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-[13px] flex items-center gap-1.5"
                >
                  {genre}
                  <button type="button" onClick={() => removeGenre(genre)} className="hover:text-white">×</button>
                </span>
              ))}
            </div>
          )}

          {showGenres && settings.genres.length < 3 && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-700/50">
              {allGenres.filter(g => !settings.genres.includes(g)).map(genre => (
                <button
                  key={genre}
                  type="button"
                  onClick={() => addGenre(genre)}
                  className="px-3 py-1.5 bg-[#3a3b3c] hover:bg-[#4a4b4c] rounded-full text-[13px] text-gray-300 transition-colors"
                >
                  + {genre}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bouton Enregistrer */}
      <button
        onClick={handleSave}
        disabled={updating}
        className="w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        {updating ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
            {t.community?.settings?.saving || "Saving..."}
          </>
        ) : (
          t.community?.settings?.saveChanges || "Save changes"
        )}
      </button>
    </div>
  );
}
