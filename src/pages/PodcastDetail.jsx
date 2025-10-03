// src/pages/PodcastDetail.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Seo from '../seo/Seo';
import { useI18n } from '../i18n';
import { useAudio } from '../context/AudioPlayerContext';
import { supabase } from '../lib/supabase';

const STRINGS = {
  fr: {
    metaTitle: 'Podcast — KracRadio',
    metaDesc: 'Écoutez ce podcast sur KracRadio',
    backToPodcasts: '← Retour aux podcasts',
    episodes: 'Épisodes',
    noEpisodes: 'Aucun épisode disponible',
    loading: 'Chargement...',
    notFound: 'Podcast introuvable',
    play: 'Écouter',
    duration: 'Durée',
    publishedOn: 'Publié le',
    website: 'Site web',
    rss: 'Flux RSS',
  },
  en: {
    metaTitle: 'Podcast — KracRadio',
    metaDesc: 'Listen to this podcast on KracRadio',
    backToPodcasts: '← Back to podcasts',
    episodes: 'Episodes',
    noEpisodes: 'No episodes available',
    loading: 'Loading...',
    notFound: 'Podcast not found',
    play: 'Play',
    duration: 'Duration',
    publishedOn: 'Published on',
    website: 'Website',
    rss: 'RSS Feed',
  },
  es: {
    metaTitle: 'Podcast — KracRadio',
    metaDesc: 'Escucha este podcast en KracRadio',
    backToPodcasts: '← Volver a podcasts',
    episodes: 'Episodios',
    noEpisodes: 'No hay episodios disponibles',
    loading: 'Cargando...',
    notFound: 'Podcast no encontrado',
    play: 'Reproducir',
    duration: 'Duración',
    publishedOn: 'Publicado el',
    website: 'Sitio web',
    rss: 'Feed RSS',
  },
};

function formatDuration(seconds) {
  if (!seconds) return '--:--';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function PodcastDetail() {
  const { id } = useParams();
  const { lang } = useI18n();
  const L = useMemo(() => STRINGS[lang] || STRINGS.fr, [lang]);
  const { playPodcast } = useAudio();

  const [podcast, setPodcast] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPodcast();
  }, [id]);

  useEffect(() => {
    if (podcast?.id) {
      loadEpisodes(podcast.id);
    }
  }, [podcast?.id]);

  const loadPodcast = async () => {
    try {
      setLoading(true);

      // Essayer d'abord par slug, sinon par ID
      let query = supabase
        .from('user_podcasts')
        .select('*')
        .eq('is_active', true);

      // Vérifier si c'est un UUID (format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

      if (isUUID) {
        query = query.eq('id', id);
      } else {
        query = query.eq('slug', id);
      }

      const { data, error } = await query.single();

      if (error) throw error;
      setPodcast(data);
    } catch (error) {
      console.error('Error loading podcast:', error);
      setPodcast(null);
    } finally {
      setLoading(false);
    }
  };

  const loadEpisodes = async (podcastId) => {
    try {
      const { data, error } = await supabase
        .from('podcast_episodes')
        .select('*')
        .eq('podcast_id', podcastId)
        .order('pub_date', { ascending: false });

      if (error) throw error;
      setEpisodes(data || []);
    } catch (error) {
      console.error('Error loading episodes:', error);
    }
  };

  const handlePlayEpisode = async (episode) => {
    console.log('[PodcastDetail] Playing episode:', episode.title);
    console.log('[PodcastDetail] Audio URL:', episode.audio_url);
    console.log('[PodcastDetail] Episode data:', {
      episodeId: episode.id,
      title: episode.title,
      audioUrl: episode.audio_url,
      image: episode.image_url || podcast?.image_url,
      podcastTitle: podcast?.title,
      podcastImage: podcast?.image_url,
      duration: episode.duration_seconds,
    });

    await playPodcast({
      episodeId: episode.id,
      title: episode.title,
      audioUrl: episode.audio_url,
      image: episode.image_url || podcast?.image_url,
      podcastTitle: podcast?.title,
      podcastImage: podcast?.image_url,
      duration: episode.duration_seconds,
    });
  };

  if (loading) {
    return (
      <div className="container-max px-5 pt-20 pb-16 text-center">
        <p className="text-gray-600 dark:text-gray-400">{L.loading}</p>
      </div>
    );
  }

  if (!podcast) {
    return (
      <div className="container-max px-5 pt-20 pb-16 text-center">
        <p className="text-gray-600 dark:text-gray-400">{L.notFound}</p>
        <Link to="/podcasts" className="mt-4 inline-block text-red-600 hover:underline dark:text-red-400">
          {L.backToPodcasts}
        </Link>
      </div>
    );
  }

  // Schema.org pour SEO Podcasts
  const podcastSchema = {
    '@context': 'https://schema.org',
    '@type': 'PodcastSeries',
    name: podcast.title,
    description: podcast.description || L.metaDesc,
    url: `https://kracradio.com/podcast/${id}`,
    author: podcast.author ? {
      '@type': 'Person',
      name: podcast.author,
    } : undefined,
    image: podcast.image_url,
    webFeed: podcast.rss_url,
    episode: episodes.map(ep => ({
      '@type': 'PodcastEpisode',
      name: ep.title,
      description: ep.description,
      url: `https://kracradio.com/podcast/${id}#episode-${ep.id}`,
      datePublished: ep.pub_date,
      duration: ep.duration_seconds ? `PT${ep.duration_seconds}S` : undefined,
      associatedMedia: {
        '@type': 'MediaObject',
        contentUrl: ep.audio_url,
      },
    })),
  };

  return (
    <main className="container-max px-5 pb-16">
      <Seo
        lang={lang}
        title={`${podcast.title} — ${L.metaTitle}`}
        description={podcast.description || L.metaDesc}
        path={`/podcast/${id}`}
        type="website"
      />

      {/* Schema.org JSON-LD */}
      <script type="application/ld+json">
        {JSON.stringify(podcastSchema)}
      </script>

      <header className="pt-16 pb-8">
        <Link
          to="/podcasts"
          className="inline-flex items-center text-sm text-red-600 hover:underline dark:text-red-400"
        >
          {L.backToPodcasts}
        </Link>
      </header>

      {/* Podcast Header */}
      <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-950">
        <div className="flex flex-col gap-8 md:flex-row">
          {/* Podcast Image */}
          <div className="flex-none">
            {podcast.image_url ? (
              <img
                src={podcast.image_url}
                alt={podcast.title}
                className="aspect-square w-full rounded-2xl object-cover shadow-lg md:w-80"
              />
            ) : (
              <div className="flex aspect-square w-full items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-900 md:w-80">
                <svg viewBox="0 0 24 24" className="h-32 w-32 text-gray-300 dark:text-gray-700" fill="currentColor">
                  <path d="M12 3v9.28c-.47-.17-.97-.28-1.5-.28C8.01 12 6 14.01 6 16.5S8.01 21 10.5 21c2.31 0 4.2-1.75 4.45-4H15V6h4V3h-7z" />
                </svg>
              </div>
            )}
          </div>

          {/* Podcast Info */}
          <div className="flex-1">
            <h1 className="text-3xl font-extrabold tracking-tight text-black dark:text-white md:text-4xl">
              {podcast.title}
            </h1>
            {podcast.author && (
              <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">{podcast.author}</p>
            )}
            {podcast.description && (
              <p className="mt-4 text-base leading-relaxed text-gray-700 dark:text-gray-300">
                {podcast.description}
              </p>
            )}

            <div className="mt-6 flex flex-wrap gap-4">
              {podcast.website_url && (
                <a
                  href={podcast.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-900"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                    <path d="M16.36 14c.08-.66.14-1.32.14-2 0-.68-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2m-5.15 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95a8.03 8.03 0 0 1-4.33 3.56M14.34 14H9.66c-.1-.66-.16-1.32-.16-2 0-.68.06-1.35.16-2h4.68c.09.65.16 1.32.16 2 0 .68-.07 1.34-.16 2M12 19.96c-.83-1.2-1.5-2.53-1.91-3.96h3.82c-.41 1.43-1.08 2.76-1.91 3.96M8 8H5.08A7.923 7.923 0 0 1 9.4 4.44C8.8 5.55 8.35 6.75 8 8m-2.92 8H8c.35 1.25.8 2.45 1.4 3.56A8.008 8.008 0 0 1 5.08 16m-.82-2C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2 0 .68.06 1.34.14 2M12 4.03c.83 1.2 1.5 2.54 1.91 3.97h-3.82c.41-1.43 1.08-2.77 1.91-3.97M18.92 8h-2.95a15.65 15.65 0 0 0-1.38-3.56c1.84.63 3.37 1.9 4.33 3.56M12 2C6.47 2 2 6.5 2 12a10 10 0 0 0 10 10 10 10 0 0 0 10-10A10 10 0 0 0 12 2z" />
                  </svg>
                  {L.website}
                </a>
              )}
              {podcast.rss_url && (
                <a
                  href={podcast.rss_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-orange-500/40 px-4 py-2 text-sm font-semibold text-orange-600 transition hover:bg-orange-50 dark:border-orange-500/30 dark:text-orange-400 dark:hover:bg-orange-900/30"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                    <path d="M6.18 15.64a2.18 2.18 0 0 1 2.18 2.18C8.36 19 7.38 20 6.18 20C5 20 4 19 4 17.82a2.18 2.18 0 0 1 2.18-2.18M4 4.44A15.56 15.56 0 0 1 19.56 20h-2.83A12.73 12.73 0 0 0 4 7.27V4.44m0 5.66a9.9 9.9 0 0 1 9.9 9.9h-2.83A7.07 7.07 0 0 0 4 12.93V10.1z" />
                  </svg>
                  {L.rss}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Episodes List */}
      <section className="mt-12">
        <h2 className="mb-6 text-2xl font-semibold text-black dark:text-white">{L.episodes}</h2>

        {episodes.length === 0 ? (
          <div className="rounded-3xl border border-gray-200 bg-white p-12 text-center shadow-sm dark:border-gray-800 dark:bg-gray-950">
            <p className="text-gray-600 dark:text-gray-400">{L.noEpisodes}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {episodes.map((episode, index) => (
              <article
                key={episode.id}
                className="group rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-gray-800 dark:bg-gray-950"
              >
                <div className="flex gap-6">
                  {/* Episode Image or Index */}
                  <div className="flex-none">
                    {episode.image_url ? (
                      <img
                        src={episode.image_url}
                        alt={episode.title}
                        className="h-24 w-24 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-900">
                        <span className="text-2xl font-bold text-gray-400 dark:text-gray-600">
                          {episode.episode_number || index + 1}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Episode Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-semibold text-black dark:text-white">
                      {episode.title}
                    </h3>
                    {episode.pub_date && (
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {L.publishedOn} {new Date(episode.pub_date).toLocaleDateString(lang)}
                      </p>
                    )}
                    {episode.description && (
                      <p className="mt-2 line-clamp-2 text-sm text-gray-700 dark:text-gray-300">
                        {episode.description}
                      </p>
                    )}
                    <div className="mt-3 flex items-center gap-4">
                      <button
                        onClick={() => handlePlayEpisode(episode)}
                        className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                      >
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                        {L.play}
                      </button>
                      {episode.duration_seconds && (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {L.duration}: {formatDuration(episode.duration_seconds)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
