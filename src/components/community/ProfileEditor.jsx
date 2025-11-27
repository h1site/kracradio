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

  const [uploading, setUploading] = useState({ avatar: false, banner: false });
  const [message, setMessage] = useState({ type: '', text: '' });

  const avatarInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  const uploadImage = async (file, bucket) => {
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Image trop volumineuse (max 5MB)');
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    console.log('[ProfileEditor] Uploading to bucket:', bucket, 'file:', fileName);

    const { error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, { cacheControl: '3600', upsert: true });

    if (error) {
      console.error('[ProfileEditor] Upload error:', error);
      throw error;
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    console.log('[ProfileEditor] Upload success, publicUrl:', publicUrl);
    return publicUrl;
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(prev => ({ ...prev, avatar: true }));
      const avatarUrl = await uploadImage(file, 'profile-images');
      console.log('[ProfileEditor] Avatar URL:', avatarUrl);
      console.log('[ProfileEditor] Updating profile with avatar_url...');
      await updateProfile(user.id, { avatar_url: avatarUrl });
      console.log('[ProfileEditor] Profile updated, refetching...');
      await refetch();
      console.log('[ProfileEditor] Refetch done');
      setMessage({ type: 'success', text: t.community?.customization?.avatarUpdated || 'Avatar updated' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('[ProfileEditor] Avatar change error:', error);
      setMessage({ type: 'error', text: error.message || 'Upload failed' });
    } finally {
      setUploading(prev => ({ ...prev, avatar: false }));
    }
  };

  const handleBannerChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(prev => ({ ...prev, banner: true }));
      const bannerUrl = await uploadImage(file, 'banners');
      console.log('[ProfileEditor] Banner URL:', bannerUrl);
      console.log('[ProfileEditor] Updating profile with banner_url...');
      await updateProfile(user.id, { banner_url: bannerUrl });
      console.log('[ProfileEditor] Profile updated, refetching...');
      await refetch();
      console.log('[ProfileEditor] Refetch done');
      setMessage({ type: 'success', text: t.community?.customization?.bannerUpdated || 'Banner updated' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('[ProfileEditor] Banner change error:', error);
      setMessage({ type: 'error', text: error.message || 'Upload failed' });
    } finally {
      setUploading(prev => ({ ...prev, banner: false }));
    }
  };

  const removeAvatar = async () => {
    try {
      await updateProfile(user.id, { avatar_url: null });
      await refetch();
      setMessage({ type: 'success', text: t.community?.customization?.avatarRemoved || 'Avatar removed' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: t.community?.customization?.error || 'Error' });
    }
  };

  const removeBanner = async () => {
    try {
      await updateProfile(user.id, { banner_url: null });
      await refetch();
      setMessage({ type: 'success', text: t.community?.customization?.bannerRemoved || 'Banner removed' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: t.community?.customization?.error || 'Error' });
    }
  };

  if (loadingProfile) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-600 border-t-white"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      {/* Message feedback */}
      {message.text && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${
          message.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
        }`}>
          {message.text}
        </div>
      )}

      {/* Section: Bannière */}
      <div className="bg-[#242526] rounded-lg mb-4">
        <div className="px-4 py-3 border-b border-gray-700/50">
          <h3 className="text-[17px] font-semibold text-white">{t.community?.customization?.banner || "Profile banner"}</h3>
          <p className="text-[13px] text-gray-400 mt-0.5">{t.community?.customization?.bannerRecommended || "Recommended: 1500x500px, max 5MB"}</p>
        </div>

        <div className="p-4">
          {/* Aperçu bannière */}
          <div className="relative rounded-lg overflow-hidden">
            <div
              className="h-40 bg-[#3a3b3c] bg-cover bg-center"
              style={{ backgroundImage: profile?.banner_url ? `url(${profile.banner_url})` : undefined }}
            >
              {!profile?.banner_url && (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => bannerInputRef.current?.click()}
              disabled={uploading.banner || updating}
              className="flex-1 py-2.5 bg-[#3a3b3c] hover:bg-[#4a4b4c] text-white font-medium rounded-lg transition-colors disabled:opacity-50 text-[15px]"
            >
              {uploading.banner ? (t.community?.customization?.upload || 'Uploading...') : (profile?.banner_url ? (t.community?.customization?.change || 'Change') : (t.community?.customization?.addBanner || 'Add banner'))}
            </button>
            {profile?.banner_url && (
              <button
                onClick={removeBanner}
                disabled={updating}
                className="px-4 py-2.5 bg-[#3a3b3c] hover:bg-red-500/20 text-gray-400 hover:text-red-400 font-medium rounded-lg transition-colors disabled:opacity-50 text-[15px]"
              >
                {t.community?.customization?.remove || "Remove"}
              </button>
            )}
          </div>
          <input ref={bannerInputRef} type="file" accept="image/*" onChange={handleBannerChange} className="hidden" />
        </div>
      </div>

      {/* Section: Avatar */}
      <div className="bg-[#242526] rounded-lg mb-4">
        <div className="px-4 py-3 border-b border-gray-700/50">
          <h3 className="text-[17px] font-semibold text-white">{t.community?.customization?.avatar || "Profile picture"}</h3>
          <p className="text-[13px] text-gray-400 mt-0.5">{t.community?.customization?.avatarRecommended || "Recommended: 400x400px, max 5MB"}</p>
        </div>

        <div className="p-4">
          <div className="flex items-center gap-4">
            {/* Avatar preview */}
            <div className="relative flex-shrink-0">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-[#3a3b3c] border-2 border-gray-700">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>
                )}
              </div>
              {profile?.is_verified && (
                <div className="absolute bottom-0 right-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center border-2 border-[#242526]">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex-1 flex gap-2">
              <button
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploading.avatar || updating}
                className="flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 text-[15px]"
              >
                {uploading.avatar ? (t.community?.customization?.upload || 'Uploading...') : (profile?.avatar_url ? (t.community?.customization?.change || 'Change') : (t.community?.customization?.add || 'Add'))}
              </button>
              {profile?.avatar_url && (
                <button
                  onClick={removeAvatar}
                  disabled={updating}
                  className="px-4 py-2.5 bg-[#3a3b3c] hover:bg-red-500/20 text-gray-400 hover:text-red-400 font-medium rounded-lg transition-colors disabled:opacity-50 text-[15px]"
                >
                  {t.community?.customization?.remove || "Remove"}
                </button>
              )}
            </div>
          </div>
          <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
        </div>
      </div>

      {/* Section: Aperçu */}
      <div className="bg-[#242526] rounded-lg">
        <div className="px-4 py-3 border-b border-gray-700/50">
          <h3 className="text-[17px] font-semibold text-white">{t.community?.customization?.preview || "Profile preview"}</h3>
        </div>

        <div className="p-4">
          <div className="bg-[#18191a] rounded-lg overflow-hidden">
            {/* Banner preview */}
            <div
              className="h-28 bg-[#3a3b3c] bg-cover bg-center"
              style={{ backgroundImage: profile?.banner_url ? `url(${profile.banner_url})` : undefined }}
            />

            {/* Profile info preview */}
            <div className="px-4 pb-4">
              <div className="-mt-10 mb-3">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-[#3a3b3c] border-4 border-[#18191a]">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                      <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              <h4 className="text-[17px] font-bold text-white flex items-center gap-2">
                {profile?.username || (t.community?.customization?.yourName || 'Your name')}
                {profile?.is_verified && (
                  <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </h4>
              <p className="text-[13px] text-gray-400 mt-1">
                {profile?.bio || (t.community?.customization?.yourBio || 'Your bio will appear here...')}
              </p>

              {profile?.location && (
                <p className="text-[13px] text-gray-500 mt-2 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                  {profile.location}
                </p>
              )}

              {profile?.genres?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {profile.genres.map(genre => (
                    <span key={genre} className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-[12px]">
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
