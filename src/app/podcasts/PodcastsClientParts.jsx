'use client';

import { useRef } from 'react';
import Link from 'next/link';

export default function PodcastsClientParts({ initialPodcasts }) {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (!scrollRef.current) return;
    const scrollAmount = 400;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <section className="relative">
      {/* Navigation buttons */}
      <button
        onClick={() => scroll('left')}
        className="absolute left-0 top-1/2 z-10 -translate-y-1/2 -translate-x-4 flex h-12 w-12 items-center justify-center rounded-full bg-black/80 text-white shadow-lg transition hover:bg-black"
        aria-label="Scroll left"
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
          <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
        </svg>
      </button>

      <button
        onClick={() => scroll('right')}
        className="absolute right-0 top-1/2 z-10 -translate-y-1/2 translate-x-4 flex h-12 w-12 items-center justify-center rounded-full bg-black/80 text-white shadow-lg transition hover:bg-black"
        aria-label="Scroll right"
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
          <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
        </svg>
      </button>

      {/* Carousel */}
      <div
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {initialPodcasts.map((podcast) => (
          <Link
            key={podcast.id}
            href={`/podcast/${podcast.slug || podcast.id}`}
            className="group flex-none w-80 snap-start"
          >
            <article className="podcast-card h-full rounded-3xl border border-gray-200 bg-white overflow-hidden shadow-sm dark:border-gray-800 dark:bg-gray-950 hover:shadow-xl">
              <div className="aspect-square overflow-hidden bg-gray-100 dark:bg-gray-900">
                {podcast.image_url ? (
                  <img
                    src={podcast.image_url}
                    alt={podcast.title}
                    className="h-full w-full object-cover transition group-hover:scale-110"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <svg viewBox="0 0 24 24" className="h-24 w-24 text-gray-300 dark:text-gray-700" fill="currentColor">
                      <path d="M12 3v9.28c-.47-.17-.97-.28-1.5-.28C8.01 12 6 14.01 6 16.5S8.01 21 10.5 21c2.31 0 4.2-1.75 4.45-4H15V6h4V3h-7z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-black dark:text-white line-clamp-2">
                  {podcast.title}
                </h3>
                {podcast.author && (
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    {podcast.author}
                  </p>
                )}
                {podcast.description && (
                  <p className="mt-3 text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
                    {podcast.description}
                  </p>
                )}
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {podcast.episode_count || 0} episodes
                  </span>
                  <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                    View details &rarr;
                  </span>
                </div>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </section>
  );
}
