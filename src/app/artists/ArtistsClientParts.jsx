'use client';

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { COUNTRIES } from '../../constants/countries';

const ARTISTS_PER_PAGE = 90;

export default function ArtistsClientParts({ initialProfiles }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const genreFilter = searchParams?.get('genre') || null;
  const countryFilter = searchParams?.get('country') || null;

  const [searchQuery, setSearchQuery] = useState('');
  const [displayCount, setDisplayCount] = useState(ARTISTS_PER_PAGE);

  // Helper function to update search params
  const updateSearchParams = useCallback((newParams) => {
    const params = new URLSearchParams();
    Object.entries(newParams).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname);
  }, [router, pathname]);

  // Extract all unique genres available
  const availableGenres = useMemo(() => {
    if (!initialProfiles) return [];
    const genresSet = new Set();
    initialProfiles.forEach(profile => {
      if (profile.genres && Array.isArray(profile.genres)) {
        profile.genres.forEach(genre => genresSet.add(genre));
      }
    });
    return Array.from(genresSet).sort();
  }, [initialProfiles]);

  // Filter profiles by genre, country and search
  const filteredProfiles = useMemo(() => {
    if (!initialProfiles || !Array.isArray(initialProfiles)) return [];

    let filtered = [...initialProfiles];

    // Filter by genre if active
    if (genreFilter) {
      filtered = filtered.filter(profile =>
        profile.genres && profile.genres.includes(genreFilter)
      );
    }

    // Filter by country if active
    if (countryFilter) {
      filtered = filtered.filter(profile =>
        profile.location === countryFilter
      );
    }

    // Filter by name search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(profile =>
        profile.username?.toLowerCase().includes(query) ||
        profile.artist_slug?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [initialProfiles, genreFilter, countryFilter, searchQuery]);

  // Reset displayCount when filters change
  useEffect(() => {
    setDisplayCount(ARTISTS_PER_PAGE);
  }, [genreFilter, countryFilter, searchQuery]);

  // Artists to display (with pagination)
  const displayedProfiles = useMemo(() => {
    return filteredProfiles.slice(0, displayCount);
  }, [filteredProfiles, displayCount]);

  const hasMore = displayCount < filteredProfiles.length;

  const loadMore = () => {
    setDisplayCount(prev => prev + ARTISTS_PER_PAGE);
  };

  return (
    <>
      {/* Header with filters */}
      <header className="relative w-full overflow-hidden mb-8">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&h=400&fit=crop&auto=format&q=80"
            alt="Artists"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent"></div>
        </div>
        <div className="relative pl-[60px] md:pl-[100px] pr-8 py-12">
          <h1 className="text-4xl md:text-6xl font-black uppercase text-white animate-fade-in-up">Artists</h1>
          <p className="mt-4 max-w-3xl text-lg text-gray-200 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            Discover the artists of the KracRadio community.
          </p>
          {/* Search bar and filters */}
          <div className="mt-6 space-y-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            {/* Search by name */}
            <div className="max-w-md">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search artists..."
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
                    title="Clear search"
                  >
                    X
                  </button>
                )}
              </div>
            </div>

            {/* Genre and country filters */}
            <div className="flex flex-col md:flex-row gap-4 max-w-xl">
              {/* Genre filter */}
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
                  <option value="">All Genres</option>
                  {availableGenres.map(genre => (
                    <option key={genre} value={genre}>
                      {genre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Country filter */}
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
                  <option value="">All Countries</option>
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

      {/* Active filters indicator */}
      {(genreFilter || countryFilter || searchQuery) && (
        <div className="flex items-center gap-3 flex-wrap mb-4 px-8">
          <span className="text-gray-500 dark:text-gray-400">Active filters:</span>

          {genreFilter && (
            <span className="px-4 py-2 bg-red-500/20 text-red-400 rounded-full text-sm font-semibold flex items-center gap-2">
              {genreFilter}
              <button
                onClick={() => {
                  const newParams = {};
                  if (countryFilter) newParams.country = countryFilter;
                  updateSearchParams(newParams);
                }}
                className="hover:text-red-300 transition-colors"
                title="Remove genre filter"
              >
                X
              </button>
            </span>
          )}

          {countryFilter && (
            <span className="px-4 py-2 bg-red-500/20 text-red-400 rounded-full text-sm font-semibold flex items-center gap-2">
              {countryFilter}
              <button
                onClick={() => {
                  const newParams = {};
                  if (genreFilter) newParams.genre = genreFilter;
                  updateSearchParams(newParams);
                }}
                className="hover:text-red-300 transition-colors"
                title="Remove country filter"
              >
                X
              </button>
            </span>
          )}

          {searchQuery && (
            <span className="px-4 py-2 bg-red-500/20 text-red-400 rounded-full text-sm font-semibold flex items-center gap-2">
              &quot;{searchQuery}&quot;
              <button
                onClick={() => setSearchQuery('')}
                className="hover:text-red-300 transition-colors"
                title="Remove search"
              >
                X
              </button>
            </span>
          )}

          <span className="text-gray-500 dark:text-gray-400 text-sm">
            {filteredProfiles.length} artist{filteredProfiles.length !== 1 ? 's' : ''} found
          </span>

          <button
            onClick={() => {
              setSearchQuery('');
              updateSearchParams({});
            }}
            className="text-sm text-red-500 hover:text-red-400 underline transition-colors"
          >
            Reset all filters
          </button>
        </div>
      )}

      {displayedProfiles.length === 0 ? (
        <div className="text-center py-12 px-8">
          <div className="text-6xl mb-4">🎵</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {(genreFilter || countryFilter || searchQuery)
              ? 'No artists found'
              : 'No artists yet'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {(genreFilter || countryFilter || searchQuery)
              ? 'Try modifying your filters'
              : 'Artists will appear here soon'}
          </p>
          {(genreFilter || countryFilter || searchQuery) && (
            <button
              onClick={() => {
                setSearchQuery('');
                updateSearchParams({});
              }}
              className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              View all artists
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-8">
          {displayedProfiles.map((profile, index) => {
            const profileLink = profile.artist_slug || profile.user_id;
            return (
              <Link
                key={profile.user_id}
                href={`/profile/${profileLink}`}
                className="artist-card group block relative rounded-2xl overflow-hidden shadow-lg bg-gray-900 text-white"
                style={{ animationDelay: `${0.05 * (index % 12)}s` }}
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
                      {profile.username || 'Artist'}
                      {profile.is_verified && (
                        <span className="text-red-400 flex-shrink-0" title="Verified artist">V</span>
                      )}
                    </h3>

                    {profile.location && (
                      <p className="text-sm mt-1 text-gray-400 truncate">
                        {profile.location}
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

      {/* Load More button */}
      {hasMore && displayedProfiles.length > 0 && (
        <div className="flex justify-center mt-12 px-8">
          <button
            onClick={loadMore}
            className="px-8 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            Load more
            <span className="text-sm text-red-200">
              ({filteredProfiles.length - displayCount} remaining)
            </span>
          </button>
        </div>
      )}
    </>
  );
}
