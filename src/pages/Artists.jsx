// src/pages/Artists.jsx
import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { usePublicProfiles } from '../hooks/useCommunity';
import { useI18n } from '../i18n';
import Seo from '../seo/Seo';
import { COUNTRIES } from '../constants/countries';

export default function Artists() {
  const { t } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const genreFilter = searchParams.get('genre');
  const countryFilter = searchParams.get('country');
  const { profiles, loading, error } = usePublicProfiles();
  const [searchQuery, setSearchQuery] = useState('');

  // Extraire tous les genres uniques disponibles
  const availableGenres = useMemo(() => {
    if (!profiles) return [];
    const genresSet = new Set();
    profiles.forEach(profile => {
      if (profile.genres && Array.isArray(profile.genres)) {
        profile.genres.forEach(genre => genresSet.add(genre));
      }
    });
    return Array.from(genresSet).sort();
  }, [profiles]);

  // Filtrer les profils par genre, pays et recherche
  const filteredProfiles = useMemo(() => {
    if (!profiles) return profiles;

    let filtered = profiles;

    // Filtrer par genre si un filtre est actif
    if (genreFilter) {
      filtered = filtered.filter(profile =>
        profile.genres && profile.genres.includes(genreFilter)
      );
    }

    // Filtrer par pays si un filtre est actif
    if (countryFilter) {
      filtered = filtered.filter(profile =>
        profile.location === countryFilter
      );
    }

    // Filtrer par recherche de nom
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(profile =>
        profile.username?.toLowerCase().includes(query) ||
        profile.artist_slug?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [profiles, genreFilter, countryFilter, searchQuery]);

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
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-4xl font-bold text-text-primary">{t.artists.title}</h1>
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-bg-secondary border border-border text-text-primary rounded-lg hover:bg-bg-tertiary hover:border-accent transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              {t.artists.back}
            </button>
          </div>

          {/* Barre de recherche et filtres */}
          <div className="space-y-4 mb-6">
            {/* Recherche par nom */}
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder={t.artists.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 pl-11 bg-bg-secondary border border-border text-text-primary rounded-lg focus:outline-none focus:border-accent transition-colors"
                />
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-accent transition-colors"
                    title={t.artists.clearSearch}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Filtres par genre et pays */}
            <div className="flex flex-col md:flex-row gap-4">
              {/* Filtre par genre */}
              <div className="flex-1">
                <select
                  value={genreFilter || ''}
                  onChange={(e) => {
                    const newParams = {};
                    if (e.target.value) newParams.genre = e.target.value;
                    if (countryFilter) newParams.country = countryFilter;
                    setSearchParams(newParams);
                  }}
                  className="w-full px-4 py-3 bg-bg-secondary border border-border text-text-primary rounded-lg focus:outline-none focus:border-accent transition-colors cursor-pointer"
                >
                  <option value="">🎵 {t.artists.allGenres}</option>
                  {availableGenres.map(genre => (
                    <option key={genre} value={genre}>
                      {genre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtre par pays */}
              <div className="flex-1">
                <select
                  value={countryFilter || ''}
                  onChange={(e) => {
                    const newParams = {};
                    if (genreFilter) newParams.genre = genreFilter;
                    if (e.target.value) newParams.country = e.target.value;
                    setSearchParams(newParams);
                  }}
                  className="w-full px-4 py-3 bg-bg-secondary border border-border text-text-primary rounded-lg focus:outline-none focus:border-accent transition-colors cursor-pointer"
                >
                  <option value="">📍 {t.artists.allCountries}</option>
                  {COUNTRIES.map(country => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Indicateur des filtres actifs */}
          {(genreFilter || countryFilter || searchQuery) && (
            <div className="flex items-center gap-3 flex-wrap mb-4">
              <span className="text-text-secondary">{t.artists.activeFilters}:</span>

              {genreFilter && (
                <span className="px-4 py-2 bg-accent/20 text-accent rounded-full text-sm font-semibold flex items-center gap-2">
                  🎵 {genreFilter}
                  <button
                    onClick={() => {
                      const newParams = {};
                      if (countryFilter) newParams.country = countryFilter;
                      setSearchParams(newParams);
                    }}
                    className="hover:text-accent-hover transition-colors"
                    title={t.artists.removeGenreFilter}
                  >
                    ✕
                  </button>
                </span>
              )}

              {countryFilter && (
                <span className="px-4 py-2 bg-accent/20 text-accent rounded-full text-sm font-semibold flex items-center gap-2">
                  📍 {countryFilter}
                  <button
                    onClick={() => {
                      const newParams = {};
                      if (genreFilter) newParams.genre = genreFilter;
                      setSearchParams(newParams);
                    }}
                    className="hover:text-accent-hover transition-colors"
                    title={t.artists.removeCountryFilter}
                  >
                    ✕
                  </button>
                </span>
              )}

              {searchQuery && (
                <span className="px-4 py-2 bg-accent/20 text-accent rounded-full text-sm font-semibold flex items-center gap-2">
                  🔍 "{searchQuery}"
                  <button
                    onClick={() => setSearchQuery('')}
                    className="hover:text-accent-hover transition-colors"
                    title={t.artists.removeSearch}
                  >
                    ✕
                  </button>
                </span>
              )}

              <span className="text-text-secondary text-sm">
                {filteredProfiles.length} {filteredProfiles.length !== 1 ? t.artists.artistsFoundPlural : t.artists.artistsFound} {filteredProfiles.length !== 1 ? t.artists.foundPlural : t.artists.found}
              </span>

              <button
                onClick={() => {
                  setSearchQuery('');
                  setSearchParams({});
                }}
                className="text-sm text-accent hover:text-accent-hover underline transition-colors"
              >
                {t.artists.resetAllFilters}
              </button>
            </div>
          )}
        </div>

        {filteredProfiles.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎵</div>
            <h3 className="text-xl font-semibold text-text-primary mb-2">
              {(genreFilter || countryFilter || searchQuery)
                ? t.artists.noArtistFound
                : t.artists.noArtists}
            </h3>
            <p className="text-text-secondary">
              {(genreFilter || countryFilter || searchQuery)
                ? t.artists.modifyFilters
                : t.artists.noArtistsDesc}
            </p>
            {(genreFilter || countryFilter || searchQuery) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSearchParams({});
                }}
                className="mt-4 px-6 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors"
              >
                {t.artists.viewAllArtists}
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProfiles.map((profile) => {
              const profileLink = profile.artist_slug || profile.user_id;
              return (
                <Link
                  key={profile.user_id}
                  to={`/profile/${profileLink}`}
                  className="relative flex items-center gap-4 p-4 border border-border rounded-lg hover:border-accent transition-all group overflow-hidden"
                >
                  {/* Background image (banner) avec overlay */}
                  {profile.banner_url && (
                    <>
                      <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url(${profile.banner_url})` }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/70 to-black/60 dark:from-black/90 dark:via-black/80 dark:to-black/70" />
                    </>
                  )}

                  {/* Contenu (au-dessus du background) */}
                  <div className="relative flex items-center gap-4 w-full">
                    {/* Image d'artiste */}
                    <div className="w-20 h-20 flex-shrink-0 rounded-full overflow-hidden bg-bg-tertiary border-2 border-border group-hover:border-accent transition-colors">
                      {profile.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt={profile.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-text-secondary">
                          <span className="text-3xl">👤</span>
                        </div>
                      )}
                    </div>

                    {/* Informations de l'artiste */}
                    <div className="flex-1 min-w-0">
                    <h3 className={`font-bold text-lg group-hover:text-accent transition-colors flex items-center gap-2 truncate ${profile.banner_url ? 'text-white' : 'text-text-primary'}`}>
                      {profile.username || 'Artiste'}
                      {profile.is_verified && (
                        <span className="text-accent flex-shrink-0" title="Artiste vérifié">✓</span>
                      )}
                    </h3>

                    {profile.location && (
                      <p className={`text-sm mt-1 truncate ${profile.banner_url ? 'text-white/80' : 'text-text-secondary'}`}>
                        📍 {profile.location}
                      </p>
                    )}

                    {/* Genres musicaux */}
                    {profile.genres && profile.genres.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {profile.genres.slice(0, 3).map(genre => (
                          <span
                            key={genre}
                            className={`px-2 py-1 text-xs rounded-full ${profile.banner_url ? 'bg-white/20 text-white' : 'bg-accent/10 text-accent'}`}
                          >
                            {genre}
                          </span>
                        ))}
                        {profile.genres.length > 3 && (
                          <span className={`px-2 py-1 text-xs rounded-full ${profile.banner_url ? 'bg-white/20 text-white/70' : 'bg-bg-tertiary text-text-secondary'}`}>
                            +{profile.genres.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
