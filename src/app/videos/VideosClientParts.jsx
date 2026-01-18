'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { getVideoLikeCount } from '../../lib/supabase';
import { InFeedAd } from '../../components/ads';

const INITIAL_LOAD = 6;
const LOAD_MORE = 6;

// Video Card Component
function VideoCard({ video }) {
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      const count = await getVideoLikeCount(video.id);
      setLikeCount(count);
    };
    loadData();
  }, [video.id]);

  const videoSlug = video.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return (
    <Link href={`/videos/${videoSlug}`} className="block group">
      <div className="video-card bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-lg transition-all duration-200">
        {/* YouTube Preview/Thumbnail */}
        <div className="relative aspect-video w-full bg-black overflow-hidden">
          <img
            src={video.thumbnail_url || `https://img.youtube.com/vi/${video.youtube_id}/hqdefault.jpg`}
            alt={video.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              if (!e.target.src.includes('video-thumbnail-default')) {
                e.target.src = '/images/video-thumbnail-default.svg';
              }
            }}
          />

          {/* Play button overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-all">
            <div className="w-20 h-20 flex items-center justify-center rounded-full bg-red-600 group-hover:bg-red-700 group-hover:scale-110 transition-all shadow-2xl">
              <svg className="w-8 h-8 ml-1 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
          </div>

          {/* KracRadio logo badge for admin-posted videos */}
          {video.submitter?.role === 'admin' && (
            <div className="absolute top-3 left-3 z-10">
              <img
                src="/images/logos/krac_short_white_white.png"
                alt="KracRadio"
                className="h-6 w-auto drop-shadow-lg"
              />
            </div>
          )}
        </div>

        {/* Video Info */}
        <div className="p-5">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 line-clamp-2">{video.title}</h3>
          {video.artist_name && (
            <p className="text-sm text-gray-600 dark:text-gray-400">{video.artist_name}</p>
          )}
          {video.description && (
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2 line-clamp-2">{video.description}</p>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mt-3">
            <div className="flex items-center gap-1">
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              <span>{likeCount}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function VideosClientParts({ initialVideos }) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_LOAD);
  const [searchQuery, setSearchQuery] = useState('');
  const loaderRef = useRef(null);
  const searchInputRef = useRef(null);

  // Filter videos based on search query
  const filteredVideos = useMemo(() => {
    if (!searchQuery.trim()) return initialVideos;
    const query = searchQuery.toLowerCase().trim();
    return initialVideos.filter(video =>
      video.title?.toLowerCase().includes(query) ||
      video.artist_name?.toLowerCase().includes(query) ||
      video.description?.toLowerCase().includes(query)
    );
  }, [initialVideos, searchQuery]);

  const visibleVideos = filteredVideos.slice(0, visibleCount);
  const hasMore = visibleCount < filteredVideos.length;

  // Reset visible count when search changes
  useEffect(() => {
    setVisibleCount(INITIAL_LOAD);
  }, [searchQuery]);

  // Infinite scroll with IntersectionObserver
  useEffect(() => {
    if (visibleCount >= filteredVideos.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + LOAD_MORE, filteredVideos.length));
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [visibleCount, filteredVideos.length]);

  if (initialVideos.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 dark:text-gray-400">No videos yet</p>
      </div>
    );
  }

  return (
    <>
      {/* Search Bar in header area */}
      <div className="mb-8 max-w-xl">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search videos..."
            className="w-full pl-12 pr-12 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                searchInputRef.current?.focus();
              }}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        {searchQuery && (
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {filteredVideos.length} {filteredVideos.length === 1 ? 'video' : 'videos'}
          </p>
        )}
      </div>

      {filteredVideos.length === 0 ? (
        <div className="text-center py-20">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400">No results for &quot;{searchQuery}&quot;</p>
          <button
            onClick={() => setSearchQuery('')}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Clear search
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {visibleVideos.map((video, index) => (
              <React.Fragment key={video.id}>
                <div style={{ animationDelay: `${0.05 * (index % LOAD_MORE)}s` }}>
                  <VideoCard video={video} />
                </div>
                {/* Insert ad after every 6 videos */}
                {(index + 1) % 6 === 0 && index < visibleVideos.length - 1 && (
                  <div className="col-span-1 md:col-span-2 xl:col-span-3">
                    <InFeedAd />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Loader for infinite scroll */}
          {hasMore && (
            <div ref={loaderRef} className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </>
      )}
    </>
  );
}
