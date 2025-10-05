// src/pages/Artists.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { usePublicProfiles } from '../hooks/useCommunity';
import { useI18n } from '../i18n';
import Seo from '../seo/Seo';

export default function Artists() {
  const { t } = useI18n();
  const { profiles, loading, error } = usePublicProfiles();

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary pt-20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bg-primary pt-20 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-text-primary mb-4">❌ Erreur</h1>
          <p className="text-text-secondary">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Seo
        title={`${t.artists.title} - KracRadio`}
        description={t.artists.noArtistsDesc}
      />

      <div className="min-h-screen bg-bg-primary" style={{ paddingTop: '20px', paddingLeft: '30px', paddingRight: '30px' }}>
        <h1 className="text-4xl font-bold text-text-primary mb-8">{t.artists.title}</h1>

        {profiles.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎵</div>
            <h3 className="text-xl font-semibold text-text-primary mb-2">
              {t.artists.noArtists}
            </h3>
            <p className="text-text-secondary">
              {t.artists.noArtistsDesc}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {profiles.map((profile) => {
              const profileLink = profile.artist_slug || profile.user_id;
              return (
                <Link
                  key={profile.user_id}
                  to={`/profile/${profileLink}`}
                  className="flex flex-col items-center text-center group"
                >
                  <div className="w-32 h-32 rounded-full overflow-hidden bg-bg-secondary border-4 border-border group-hover:border-accent transition-colors mb-3">
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-text-secondary">
                        <span className="text-5xl">👤</span>
                      </div>
                    )}
                  </div>

                  <h3 className="font-bold text-text-primary group-hover:text-accent transition-colors flex items-center gap-1">
                    {profile.username || 'Artiste'}
                    {profile.is_verified && (
                      <span className="text-accent text-sm" title="Artiste vérifié">✓</span>
                    )}
                  </h3>

                  {profile.location && (
                    <p className="text-sm text-text-secondary mt-1">
                      📍 {profile.location}
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
