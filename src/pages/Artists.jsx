// src/pages/Artists.jsx
import React, { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { usePublicProfiles } from '../hooks/useCommunity';
import { useI18n } from '../i18n';
import Seo from '../seo/Seo';

export default function Artists() {
  const { t } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const genreFilter = searchParams.get('genre');
  const { profiles, loading, error } = usePublicProfiles();

  // Filtrer les profils par genre si un filtre est actif
  const filteredProfiles = useMemo(() => {
    if (!genreFilter || !profiles) return profiles;
    return profiles.filter(profile =>
      profile.genres && profile.genres.includes(genreFilter)
    );
  }, [profiles, genreFilter]);

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
        {/* En-tête avec filtre actif */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-4xl font-bold text-text-primary">{t.artists.title}</h1>
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-bg-secondary border border-border text-text-primary rounded-lg hover:bg-bg-tertiary hover:border-accent transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Retour
            </button>
          </div>

          {genreFilter && (
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-text-secondary">Filtré par genre:</span>
              <span className="px-4 py-2 bg-accent/20 text-accent rounded-full text-sm font-semibold flex items-center gap-2">
                🎵 {genreFilter}
                <button
                  onClick={() => setSearchParams({})}
                  className="hover:text-accent-hover transition-colors"
                  title="Supprimer le filtre"
                >
                  ✕
                </button>
              </span>
              <span className="text-text-secondary text-sm">
                {filteredProfiles.length} artiste{filteredProfiles.length !== 1 ? 's' : ''} trouvé{filteredProfiles.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        {filteredProfiles.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎵</div>
            <h3 className="text-xl font-semibold text-text-primary mb-2">
              {genreFilter ? `Aucun artiste trouvé pour "${genreFilter}"` : t.artists.noArtists}
            </h3>
            <p className="text-text-secondary">
              {genreFilter ? 'Essayez un autre genre musical' : t.artists.noArtistsDesc}
            </p>
            {genreFilter && (
              <button
                onClick={() => setSearchParams({})}
                className="mt-4 px-6 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors"
              >
                Voir tous les artistes
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredProfiles.map((profile) => {
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

                  {/* Genres musicaux */}
                  {profile.genres && profile.genres.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-1 mt-2">
                      {profile.genres.slice(0, 3).map(genre => (
                        <span
                          key={genre}
                          className="px-2 py-1 bg-accent/10 text-accent text-xs rounded-full"
                        >
                          {genre}
                        </span>
                      ))}
                    </div>
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
