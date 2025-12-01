'use client';
// src/pages/Artists.jsx
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { usePublicProfiles } from '../hooks/useCommunity';
import { useI18n } from '../i18n';
import Seo from '../seo/Seo';
import { COUNTRIES } from '../constants/countries';
import { collectionPageSchema, breadcrumbSchema } from '../seo/schemas';

const ARTISTS_PER_PAGE = 90;

export default function Artists() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const genreFilter = searchParams?.get('genre') || null;
  const countryFilter = searchParams?.get('country') || null;

  // Helper function to update search params
  const updateSearchParams = useCallback((newParams) => {
    const params = new URLSearchParams();
    Object.entries(newParams).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname);
  }, [router, pathname]);
  const { profiles, loading, error } = usePublicProfiles();
  const [searchQuery, setSearchQuery] = useState('');
  const [displayCount, setDisplayCount] = useState(ARTISTS_PER_PAGE);

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
    if (!profiles || !Array.isArray(profiles)) return [];

    let filtered = [...profiles];

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

  // Reset displayCount quand les filtres changent
  useEffect(() => {
    setDisplayCount(ARTISTS_PER_PAGE);
  }, [genreFilter, countryFilter, searchQuery]);

  // Artistes à afficher (avec pagination)
  const displayedProfiles = useMemo(() => {
    return filteredProfiles.slice(0, displayCount);
  }, [filteredProfiles, displayCount]);

  const hasMore = displayCount < filteredProfiles.length;

  const loadMore = () => {
    setDisplayCount(prev => prev + ARTISTS_PER_PAGE);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
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
        path="/artists"
        jsonLd={[
          collectionPageSchema(t.artists.title, t.artists.noArtistsDesc, '/artists', filteredProfiles?.length || 0),
          breadcrumbSchema([
            { name: 'Accueil', url: '/' },
            { name: t.artists.title }
          ])
        ]}
      />

      <div className="pb-[50px]">
        {/* En-tête avec filtres */}
        <header className="relative -mx-8 -mt-8 mb-8 overflow-hidden">
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&h=400&fit=crop&auto=format&q=80"
              alt="Artists"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent"></div>
          </div>
          <div className="relative pl-[60px] md:pl-[100px] pr-8 py-12">
            <h1 className="text-4xl md:text-6xl font-black uppercase text-white">{t.artists.title}</h1>
            <p className="mt-4 max-w-3xl text-lg text-gray-200">
              Découvrez les artistes de la communauté KracRadio.
            </p>
            {/* Barre de recherche et filtres */}
            <div className="mt-6 space-y-4">
              {/* Recherche par nom */}
              <div className="max-w-md">
                <div className="relative">
                  <input
                    type="text"
                    placeholder={t.artists.searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-3 pl-11 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-red-500 transition-colors"
                  />
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                      title={t.artists.clearSearch}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Filtres par genre et pays */}
              <div className="flex flex-col md:flex-row gap-4 max-w-xl">
                {/* Filtre par genre */}
                <div className="flex-1">
                  <select
                    value={genreFilter || ''}
                    onChange={(e) => {
                      const newParams = {};
                      if (e.target.value) newParams.genre = e.target.value;
                      if (countryFilter) newParams.country = countryFilter;
                      updateSearchParams(newParams);
                    }}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-red-500 transition-colors cursor-pointer"
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
                      updateSearchParams(newParams);
                    }}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-red-500 transition-colors cursor-pointer"
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
          </div>
        </header>

        {/* Indicateur des filtres actifs */}
        {(genreFilter || countryFilter || searchQuery) && (
          <div className="flex items-center gap-3 flex-wrap mb-4 px-8">
            <span className="text-text-secondary">{t.artists.activeFilters}:</span>

            {genreFilter && (
              <span className="px-4 py-2 bg-accent/20 text-accent rounded-full text-sm font-semibold flex items-center gap-2">
                🎵 {genreFilter}
                <button
                  onClick={() => {
                    const newParams = {};
                    if (countryFilter) newParams.country = countryFilter;
                    updateSearchParams(newParams);
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
                    updateSearchParams(newParams);
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
                updateSearchParams({});
              }}
              className="text-sm text-accent hover:text-accent-hover underline transition-colors"
            >
              {t.artists.resetAllFilters}
            </button>
          </div>
        )}

        {displayedProfiles.length === 0 ? (
          <div className="text-center py-12 px-8">
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
                  updateSearchParams({});
                }}
                className="mt-4 px-6 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors"
              >
                {t.artists.viewAllArtists}
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-8">
            {displayedProfiles.map((profile) => {
              const profileLink = profile.artist_slug || profile.user_id;
              return (
                <Link
                  key={profile.user_id}
                  href={`/profile/${profileLink}`}
                  className="group block relative rounded-2xl overflow-hidden shadow-lg bg-gray-900 text-white"
                >
                  <div className="h-48 bg-cover bg-center" style={{ backgroundImage: `url(${profile.banner_url || profile.avatar_url})` }}>
                    {profile.banner_url && <div className="absolute inset-0 bg-black/30" />}
                  </div>
                  <div className="p-6 relative">
                    <div className="absolute -top-12 left-6">
                      <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-800 border-4 border-gray-900 group-hover:border-red-500 transition-colors">
                        {profile.avatar_url ? (
                          <img
                            src={profile.avatar_url}
                            alt={profile.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-500">
                            <span className="text-4xl">👤</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="pt-14">
                      <h3 className="font-bold text-2xl group-hover:text-red-400 transition-colors flex items-center gap-2 truncate">
                        {profile.username || 'Artiste'}
                        {profile.is_verified && (
                          <span className="text-red-400 flex-shrink-0" title="Artiste vérifié">✓</span>
                        )}
                      </h3>

                      {profile.location && (
                        <p className="text-sm mt-1 text-gray-400 truncate">
                          📍 {profile.location}
                        </p>
                      )}
                    </div>
                    {profile.genres && profile.genres.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-800">
                        {profile.genres.slice(0, 3).map(genre => (
                          <span
                            key={genre}
                            className="px-3 py-1 text-xs rounded-full bg-red-500/20 text-red-300"
                          >
                            {genre}
                          </span>
                        ))}
                        {profile.genres.length > 3 && (
                          <span className="px-3 py-1 text-xs rounded-full bg-gray-700 text-gray-400">
                            +{profile.genres.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Bouton Load More */}
        {hasMore && displayedProfiles.length > 0 && (
          <div className="flex justify-center mt-12 px-8">
            <button
              onClick={loadMore}
              className="px-8 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              {t.artists.loadMore || 'Voir plus'}
              <span className="text-sm text-red-200">
                ({filteredProfiles.length - displayCount} {t.artists.remaining || 'restants'})
              </span>
            </button>
          </div>
        )}
      </div>
    </>
  );
}
