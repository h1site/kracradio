// src/components/community/ProfileEditor.jsx
import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../i18n';
import { useProfile, useUpdateProfile } from '../../hooks/useCommunity';
import { supabase } from '../../lib/supabase';

export default function ProfileEditor() {
  const { user } = useAuth();
  const { profile, loading: loadingProfile, refetch } = useProfile(user?.id);
  const { updateProfile, loading: updating } = useUpdateProfile();
  const { t } = useI18n();
  const community = t?.community ?? {};
  const customization = community.customization ?? {};
  const settings = community.settings ?? {};
  const common = t?.common ?? {};
  const saveLabel = community.save ?? common.save ?? 'Enregistrer';
  const savedLabel = community.saved ?? 'Modifications enregistrées';
  const changeLabel = customization.change ?? 'Changer';
  const uploadLabel = customization.upload ?? 'Upload...';
  const removeLabel = customization.remove ?? common.delete ?? 'Supprimer';
  const titleLabel = customization.title ?? 'Personnalisation du profil';
  const bannerLabel = customization.banner ?? 'Bannière du profil';
  const bannerRecommended = customization.bannerRecommended ?? 'Recommandé: 1500x500px, max 5MB (JPG, PNG, GIF)';
  const avatarLabel = customization.avatar ?? 'Photo de profil';
  const avatarRecommended = customization.avatarRecommended ?? 'Recommandé: 400x400px, max 5MB';
  const previewLabel = customization.preview ?? 'Aperçu du profil';
  const tooLarge = customization.tooLarge ?? 'Image trop volumineuse (max 5MB)';
  const avatarUpdated = customization.avatarUpdated ?? 'Avatar mis à jour avec succès';
  const bannerUpdated = customization.bannerUpdated ?? 'Bannière mise à jour avec succès';
  const avatarRemoved = customization.avatarRemoved ?? 'Avatar supprimé';
  const bannerRemoved = customization.bannerRemoved ?? 'Bannière supprimée';
  const errorLabel = customization.error ?? 'Erreur lors de la suppression';
  const changeAvatarLabel = customization.changeAvatar ?? changeLabel;
  const fallbackName = settings.usernamePlaceholder ?? 'Votre nom';
  const fallbackBio = settings.bioPlaceholder ?? 'Votre bio apparaîtra ici...';

  const [uploading, setUploading] = useState({ avatar: false, banner: false });
  const [message, setMessage] = useState({ type: '', text: '' });

  const avatarInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  const uploadImage = async (file, bucket, folder) => {
    try {
      // Vérifier la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error(tooLarge);
      }

      // Générer un nom unique
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // Upload vers Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) throw error;

      // Obtenir l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(prev => ({ ...prev, avatar: true }));

      const avatarUrl = await uploadImage(file, 'avatars', user.id);
      await updateProfile(user.id, { avatar_url: avatarUrl });
      await refetch();

      setMessage({ type: 'success', text: `✅ ${avatarUpdated}` });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: `❌ ${error.message}` });
    } finally {
      setUploading(prev => ({ ...prev, avatar: false }));
    }
  };

  const handleBannerChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(prev => ({ ...prev, banner: true }));

      const bannerUrl = await uploadImage(file, 'banners', user.id);
      await updateProfile(user.id, { banner_url: bannerUrl });
      await refetch();

      setMessage({ type: 'success', text: `✅ ${bannerUpdated}` });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: `❌ ${error.message}` });
    } finally {
      setUploading(prev => ({ ...prev, banner: false }));
    }
  };

  const removeAvatar = async () => {
    try {
      await updateProfile(user.id, { avatar_url: null });
      await refetch();
      setMessage({ type: 'success', text: `✅ ${avatarRemoved}` });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: `❌ ${errorLabel}` });
    }
  };

  const removeBanner = async () => {
    try {
      await updateProfile(user.id, { banner_url: null });
      await refetch();
      setMessage({ type: 'success', text: `✅ ${bannerRemoved}` });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: `❌ ${errorLabel}` });
    }
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
          {`🎨 ${titleLabel}`}
        </h2>
        <button
          onClick={async () => {
            // Trigger a refetch to save any changes
            await refetch();
            setMessage({ type: 'success', text: `✅ ${savedLabel}` });
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
          }}
          className="px-6 py-2 bg-accent text-bg-primary font-semibold rounded-lg hover:bg-accent-hover transition-colors flex items-center gap-2"
        >
          {`💾 ${saveLabel}`}
        </button>
      </div>

      {/* Messages */}
      {message.text && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success'
            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
            : 'bg-red-500/20 text-red-400 border border-red-500/30'
        }`}>
          {message.text}
        </div>
      )}

      {/* Bannière */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-text-primary mb-2">
          {bannerLabel}
        </label>
        <div className="relative bg-bg-secondary rounded-lg overflow-hidden border border-border">
          {/* Aperçu bannière */}
          <div
            className="h-48 bg-gradient-to-r from-accent/20 to-accent/5 bg-cover bg-center"
            style={{
              backgroundImage: profile?.banner_url ? `url(${profile.banner_url})` : undefined
            }}
          >
            {!profile?.banner_url && (
              <div className="flex items-center justify-center h-full text-text-secondary">
                <span className="text-6xl">🎵</span>
              </div>
            )}
          </div>

          {/* Actions bannière */}
          <div className="absolute bottom-4 right-4 flex gap-2">
            <button
              onClick={() => bannerInputRef.current?.click()}
              disabled={uploading.banner || updating}
              className="px-4 py-2 bg-bg-primary/80 backdrop-blur-sm text-text-primary rounded-lg
                       hover:bg-bg-primary transition-colors disabled:opacity-50 text-sm font-medium"
            >
              {uploading.banner ? `⏳ ${uploadLabel}` : `📤 ${changeLabel}`}
            </button>
            {profile?.banner_url && (
              <button
                onClick={removeBanner}
                disabled={updating}
                className="px-4 py-2 bg-red-500/20 backdrop-blur-sm text-red-400 rounded-lg
                         hover:bg-red-500/30 transition-colors disabled:opacity-50 text-sm font-medium"
              >
                {`🗑️ ${removeLabel}`}
              </button>
            )}
          </div>

          <input
            ref={bannerInputRef}
            type="file"
            accept="image/*"
            onChange={handleBannerChange}
            className="hidden"
          />
        </div>
        <p className="text-xs text-text-secondary mt-2">
          {bannerRecommended}
        </p>
      </div>

      {/* Avatar */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-text-primary mb-2">
          {avatarLabel}
        </label>
        <div className="flex items-center gap-6">
          {/* Aperçu avatar */}
          <div className="relative">
            <div className="w-32 h-32 rounded-full overflow-hidden bg-bg-secondary border-4 border-border">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.username || 'Avatar'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-text-secondary">
                  <span className="text-5xl">👤</span>
                </div>
              )}
            </div>

            {profile?.is_verified && (
              <div className="absolute bottom-0 right-0 bg-accent rounded-full p-1">
                <span className="text-lg">✓</span>
              </div>
            )}
          </div>

          {/* Actions avatar */}
          <div className="flex-1">
            <div className="flex gap-3">
              <button
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploading.avatar || updating}
                className="px-4 py-2 bg-accent text-bg-primary font-semibold rounded-lg
                         hover:bg-accent-hover transition-colors disabled:opacity-50"
              >
                {uploading.avatar ? `⏳ ${uploadLabel}` : `📤 ${changeAvatarLabel}`}
              </button>
              {profile?.avatar_url && (
                <button
                  onClick={removeAvatar}
                  disabled={updating}
                  className="px-4 py-2 bg-bg-secondary border border-border text-text-secondary rounded-lg
                           hover:bg-bg-tertiary hover:text-text-primary transition-colors disabled:opacity-50"
                >
                  {`🗑️ ${removeLabel}`}
                </button>
              )}
            </div>
            <p className="text-xs text-text-secondary mt-2">
              {avatarRecommended}
            </p>

            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>
        </div>
      </div>

      {/* Aperçu du profil */}
      <div className="mt-8 p-6 bg-bg-secondary rounded-lg border border-border">
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          {`👁️ ${previewLabel}`}
        </h3>

        {/* Mini aperçu */}
        <div className="bg-bg-tertiary rounded-lg overflow-hidden">
          {/* Bannière preview */}
          <div
            className="h-32 bg-gradient-to-r from-accent/20 to-accent/5 bg-cover bg-center"
            style={{
              backgroundImage: profile?.banner_url ? `url(${profile.banner_url})` : undefined
            }}
          />

          {/* Profil preview */}
          <div className="px-6 pb-6">
            <div className="-mt-16 mb-4">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-bg-secondary border-4 border-bg-tertiary">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.username || 'Avatar'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-text-secondary">
                    <span className="text-4xl">👤</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-xl font-bold text-text-primary flex items-center gap-2">
                {profile?.username || fallbackName}
                {profile?.is_verified && <span className="text-accent">✓</span>}
              </h4>
              <p className="text-text-secondary text-sm mt-1">
                {profile?.bio || fallbackBio}
              </p>

              {profile?.location && (
                <p className="text-text-secondary text-sm mt-2">
                  📍 {profile.location}
                </p>
              )}

              {profile?.genres && profile.genres.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {profile.genres.map(genre => (
                    <span
                      key={genre}
                      className="px-2 py-1 bg-accent/20 text-accent rounded-full text-xs"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
