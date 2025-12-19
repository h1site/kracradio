'use client';
// src/pages/PodcastsNew.jsx
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Seo from '../seo/Seo';
import { useI18n } from '../i18n';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { supabase } from '../lib/supabase';
import { motion } from '../components/animations';

const STRINGS = {
  fr: {
    metaTitle: 'Podcasts KracRadio — Découvrez nos podcasts indépendants',
    metaDesc: 'Écoutez des podcasts indépendants sur KracRadio. Une sélection variée de contenus audio originaux.',
    heroBadge: 'Podcasts',
    heroTitle: 'Découvrez nos podcasts',
    heroSubtitle: 'Une sélection de podcasts indépendants, variés et passionnants.',
    managePodcasts: 'Gérer mes podcasts',
    loading: 'Chargement...',
    noPodcasts: 'Aucun podcast disponible pour le moment',
    episodes: 'épisodes',
    viewDetails: 'Voir les détails',
  },
  en: {
    metaTitle: 'KracRadio Podcasts — Discover our independent podcasts',
    metaDesc: 'Listen to independent podcasts on KracRadio. A varied selection of original audio content.',
    heroBadge: 'Podcasts',
    heroTitle: 'Discover our podcasts',
    heroSubtitle: 'A selection of independent, varied and exciting podcasts.',
    managePodcasts: 'Manage my podcasts',
    loading: 'Loading...',
    noPodcasts: 'No podcasts available at the moment',
    episodes: 'episodes',
    viewDetails: 'View details',
  },
  es: {
    metaTitle: 'Podcasts KracRadio — Descubre nuestros podcasts independientes',
    metaDesc: 'Escucha podcasts independientes en KracRadio. Una selección variada de contenido de audio original.',
    heroBadge: 'Podcasts',
    heroTitle: 'Descubre nuestros podcasts',
    heroSubtitle: 'Una selección de podcasts independientes, variados y emocionantes.',
    managePodcasts: 'Administrar mis podcasts',
    loading: 'Cargando...',
    noPodcasts: 'No hay podcasts disponibles en este momento',
    episodes: 'episodios',
    viewDetails: 'Ver detalles',
  },
};

export default function Podcasts() {
  const { lang } = useI18n();
  const L = useMemo(() => STRINGS[lang] || STRINGS.fr, [lang]);
  const { user } = useAuth();
  const { isDesktop, sidebarOpen, sidebarWidth } = useUI();

  const [podcasts, setPodcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    loadPodcasts();
  }, []);

  const loadPodcasts = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      // Get podcasts from user_podcasts table
      const { data: podcastsData, error: podcastsError } = await supabase
        .from('user_podcasts')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .abortSignal(controller.signal);

      clearTimeout(timeoutId);

      if (podcastsError) throw podcastsError;

      // Get episode counts for each podcast
      const podcastsWithStats = await Promise.all(
        (podcastsData || []).map(async (podcast) => {
          const { count } = await supabase
            .from('podcast_episodes')
            .select('*', { count: 'exact', head: true })
            .eq('podcast_id', podcast.id);

          return {
            ...podcast,
            episode_count: count || 0,
          };
        })
      );

      setPodcasts(podcastsWithStats);
    } catch (error) {
      console.error('Error loading podcasts:', error);
      setPodcasts([]);
    } finally {
      setLoading(false);
    }
  };

  const scroll = (direction) => {
    if (!scrollRef.current) return;
    const scrollAmount = 400;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <>
      <Seo
        lang={lang}
        title={L.metaTitle}
        description={L.metaDesc}
        path="/podcasts"
        type="website"
      />

      <div className="min-h-screen bg-white dark:bg-black">
        {/* Full-screen header */}
        <header
          className="relative w-full overflow-hidden"
          style={{
            marginLeft: isDesktop && sidebarOpen ? -sidebarWidth : 0,
            width: isDesktop && sidebarOpen ? `calc(100% + ${sidebarWidth}px)` : '100%',
            transition: 'margin-left 300ms ease, width 300ms ease'
          }}
        >
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=1200&h=400&fit=crop&auto=format&q=80"
              alt="Podcasts"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent"></div>
          </div>
          <div
            className="relative py-16 md:py-24"
            style={{
              marginLeft: isDesktop && sidebarOpen ? sidebarWidth : 0,
              transition: 'margin-left 300ms ease'
            }}
          >
            <div className="max-w-4xl pl-[60px] md:pl-[100px] pr-8">
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-red-300"
              >
                {L.heroBadge}
              </motion.span>
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="mt-4 text-4xl md:text-6xl font-black uppercase text-white"
              >
                {L.heroTitle}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mt-4 max-w-3xl text-lg text-gray-200"
              >
                {L.heroSubtitle}
              </motion.p>
              {user && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="mt-6"
                >
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                  >
                    {L.managePodcasts}
                  </Link>
                </motion.div>
              )}
            </div>
          </div>
        </header>

        <main className="px-[5px] py-12">

      {loading ? (
        <div className="py-20 text-center text-gray-600 dark:text-gray-400">
          <p>{L.loading}</p>
        </div>
      ) : podcasts.length === 0 ? (
        <div className="rounded-3xl border border-gray-200 bg-white p-12 text-center shadow-sm dark:border-gray-800 dark:bg-gray-950">
          <p className="text-gray-600 dark:text-gray-400">{L.noPodcasts}</p>
        </div>
      ) : (
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
            {podcasts.map((podcast) => (
              <Link
                key={podcast.id}
                href={`/podcast/${podcast.slug || podcast.id}`}
                className="group flex-none w-80 snap-start"
              >
                <article className="h-full rounded-3xl border border-gray-200 bg-white overflow-hidden shadow-sm transition hover:shadow-xl hover:scale-105 dark:border-gray-800 dark:bg-gray-950">
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
                        {podcast.episode_count || 0} {L.episodes}
                      </span>
                      <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                        {L.viewDetails} →
                      </span>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </section>
      )}

        <style>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        </main>
      </div>
    </>
  );
}
