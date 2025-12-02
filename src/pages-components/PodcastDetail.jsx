'use client';
// src/pages/PodcastDetail.jsx
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Seo from '../seo/Seo';
import { useI18n } from '../i18n';
import { useAudio } from '../context/AudioPlayerContext';
import { supabase } from '../lib/supabase';
import { FaPlay, FaGlobe, FaRss, FaSpinner, FaChevronRight } from 'react-icons/fa';
import { useUI } from '../context/UIContext';
import { podcastSeriesSchema, breadcrumbSchema } from '../seo/schemas';

const STRINGS = {
  fr: {
    metaTitle: 'Podcast — KracRadio',
    metaDesc: 'Écoutez ce podcast sur KracRadio',
    backToPodcasts: '← Retour aux podcasts',
    episodes: 'Épisodes',
    noEpisodes: 'Aucun épisode disponible pour le moment.',
    loading: 'Chargement du podcast...',
    notFound: 'Podcast introuvable',
    play: 'Écouter',
    playing: 'Lecture...',
    duration: 'Durée',
    publishedOn: 'Publié le',
    website: 'Site web',
    rss: 'Flux RSS',
    subscribe: 'S\'abonner',
  },
  en: {
    metaTitle: 'Podcast — KracRadio',
    metaDesc: 'Listen to this podcast on KracRadio',
    backToPodcasts: '← Back to podcasts',
    episodes: 'Episodes',
    noEpisodes: 'No episodes available at the moment.',
    loading: 'Loading podcast...',
    notFound: 'Podcast not found',
    play: 'Play',
    playing: 'Playing...',
    duration: 'Duration',
    publishedOn: 'Published on',
    website: 'Website',
    rss: 'RSS Feed',
    subscribe: 'Subscribe',
  },
  es: {
    metaTitle: 'Podcast — KracRadio',
    metaDesc: 'Escucha este podcast en KracRadio',
    backToPodcasts: '← Volver a podcasts',
    episodes: 'Episodios',
    noEpisodes: 'No hay episodios disponibles por el momento.',
    loading: 'Cargando podcast...',
    notFound: 'Podcast no encontrado',
    play: 'Reproducir',
    playing: 'Reproduciendo...',
    duration: 'Duración',
    publishedOn: 'Publicado el',
    website: 'Sitio web',
    rss: 'Feed RSS',
    subscribe: 'Suscribirse',
  },
};

function formatDuration(seconds) {
  if (isNaN(seconds) || seconds < 0) return '--:--';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function generateSlug(title) {
  if (!title) return '';
  return title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 100);
}

export default function PodcastDetail() {
  const { id } = useParams();
  const { lang } = useI18n();
  const L = useMemo(() => STRINGS[lang] || STRINGS.fr, [lang]);
  const { playPodcast, isPlaying, currentTrack } = useAudio();
  const { sidebarOpen, isDesktop, sidebarWidth } = useUI();

  const [podcast, setPodcast] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPodcastAndEpisodes = async () => {
      try {
        setLoading(true);
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

        let podcastQuery = supabase.from('user_podcasts').select('*').eq('is_active', true);
        podcastQuery = isUUID ? podcastQuery.eq('id', id) : podcastQuery.eq('slug', id);

        const { data: podcastData, error: podcastError } = await podcastQuery.single();

        if (podcastError) throw podcastError;
        setPodcast(podcastData);

        if (podcastData) {
          const { data: episodesData, error: episodesError } = await supabase
            .from('podcast_episodes')
            .select('*')
            .eq('podcast_id', podcastData.id)
            .order('pub_date', { ascending: false });
          if (episodesError) throw episodesError;
          setEpisodes(episodesData || []);
        }
      } catch (error) {
        console.error('Error loading podcast details:', error);
        setPodcast(null);
      } finally {
        setLoading(false);
      }
    };
    loadPodcastAndEpisodes();
  }, [id]);

  const handlePlayEpisode = (episode) => {
    playPodcast({
      episodeId: episode.id,
      title: episode.title,
      audioUrl: episode.audio_url,
      image: episode.image_url || podcast?.image_url,
      podcastTitle: podcast?.title,
      podcastImage: podcast?.image_url,
      duration: episode.duration_seconds,
    });
  };

  const containerStyle = {
    marginLeft: isDesktop && sidebarOpen ? sidebarWidth : 0,
    transition: 'margin-left 300ms ease',
  };

  const podcastJsonLd = useMemo(() => {
    if (!podcast) return null;
    return podcastSeriesSchema(podcast);
  }, [podcast]);

  const breadcrumbJsonLd = useMemo(() => {
    return breadcrumbSchema([
      { name: 'Accueil', url: '/' },
      { name: 'Podcasts', url: '/podcasts' },
      { name: podcast?.title || 'Podcast' }
    ]);
  }, [podcast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary text-text-primary flex items-center justify-center p-4" style={containerStyle}>
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-accent mx-auto mb-4" />
          <p className="text-lg text-text-secondary">{L.loading}</p>
        </div>
      </div>
    );
  }

  if (!podcast) {
    return (
      <div className="min-h-screen bg-bg-primary text-text-primary flex items-center justify-center p-4" style={containerStyle}>
        <div className="text-center">
          <h1 className="text-3xl font-bold text-red-500 mb-4">{L.notFound}</h1>
          <Link href="/podcasts" className="mt-4 inline-block text-accent hover:underline">
            {L.backToPodcasts}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Seo
        lang={lang}
        title={`${podcast.title} — ${L.metaTitle}`}
        description={podcast.description || L.metaDesc}
        path={`/podcast/${id}`}
        type="website"
        image={podcast.image_url}
        jsonLd={[podcastJsonLd, breadcrumbJsonLd].filter(Boolean)}
      />

      <div className="min-h-screen bg-white dark:bg-black">
        {/* --- PODCAST HEADER --- Full Screen Hero */}
        <header
          className="relative w-full h-[60vh] bg-cover bg-center"
          style={{
            backgroundImage: `url(${podcast.image_url})`,
            marginLeft: isDesktop && sidebarOpen ? -sidebarWidth : 0,
            width: isDesktop && sidebarOpen ? `calc(100% + ${sidebarWidth}px)` : '100%',
            transition: 'margin-left 300ms ease, width 300ms ease'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />

          <div
            className="relative z-10 flex flex-col justify-end h-full p-8 md:p-12"
            style={{
              paddingLeft: isDesktop && sidebarOpen ? `calc(${sidebarWidth}px + 3rem)` : '2rem',
              transition: 'padding-left 300ms ease'
            }}
          >
            <div className="max-w-4xl">
              <Link href="/podcasts" className="inline-block mb-4 text-white/80 hover:text-white transition-colors">
                {L.backToPodcasts}
              </Link>

              <h1 className="text-4xl md:text-6xl font-black text-white leading-tight drop-shadow-lg mb-4">
                {podcast.title}
              </h1>

              {podcast.author && (
                <p className="text-xl text-white/90 font-medium mb-4">{podcast.author}</p>
              )}

              {podcast.description && (
                <p className="text-white/80 max-w-3xl mb-6 line-clamp-3">
                  {podcast.description}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-4">
                {podcast.website_url && (
                  <a
                    href={podcast.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-sm text-white rounded-full font-semibold hover:bg-white/20 transition-colors border border-white/20"
                  >
                    <FaGlobe /> {L.website}
                  </a>
                )}
                {podcast.rss_url && (
                  <a
                    href={podcast.rss_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-sm text-white rounded-full font-semibold hover:bg-white/20 transition-colors border border-white/20"
                  >
                    <FaRss /> {L.rss}
                  </a>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="pb-16 px-8 md:px-12" style={containerStyle}>

          {/* --- EPISODES LIST --- */}
          <section className="mt-12 max-w-6xl">
            <h2 className="text-3xl md:text-4xl font-black mb-8 text-gray-900 dark:text-white uppercase">{L.episodes}</h2>
            {episodes.length === 0 ? (
              <div className="text-center py-12 bg-gray-100 dark:bg-gray-900 rounded-xl">
                <p className="text-gray-600 dark:text-gray-400">{L.noEpisodes}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {episodes.map((episode, index) => {
                  const isCurrentlyPlaying = isPlaying && currentTrack?.episodeId === episode.id;
                  const episodeImage = episode.image_url || podcast.image_url;

                  return (
                    <div
                      key={episode.id}
                      className="group relative bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all border border-gray-200 dark:border-gray-800"
                    >
                      <div className="flex items-center gap-4 p-4">
                        {/* Episode Image */}
                        <div className="relative flex-shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden">
                          <img
                            src={episodeImage}
                            alt={episode.title}
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={() => handlePlayEpisode(episode)}
                            className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label={`${L.play} ${episode.title}`}
                          >
                            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-red-600 text-white">
                              <FaPlay className="text-lg ml-1" />
                            </div>
                          </button>
                        </div>

                        {/* Episode Info */}
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/podcast/${generateSlug(podcast.title)}/episode/${generateSlug(episode.title)}`}
                            className={`font-bold text-lg mb-1 block hover:text-red-600 dark:hover:text-red-400 transition-colors ${isCurrentlyPlaying ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}
                          >
                            <h3 className="inline">{episode.title}</h3>
                            <FaChevronRight className="inline ml-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Link>
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                            {episode.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500">
                            <span className="flex items-center gap-1">
                              {new Date(episode.pub_date).toLocaleDateString(lang, {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </span>
                            <span>•</span>
                            <span>{formatDuration(episode.duration_seconds)}</span>
                          </div>
                        </div>

                        {/* Play Button (Desktop) */}
                        <button
                          onClick={() => handlePlayEpisode(episode)}
                          className="hidden md:flex items-center justify-center w-12 h-12 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors flex-shrink-0"
                          aria-label={`${L.play} ${episode.title}`}
                        >
                          <FaPlay className="text-sm ml-1" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </main>
      </div>
    </>
  );
}
