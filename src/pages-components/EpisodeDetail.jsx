'use client';
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useI18n } from '../i18n';
import { useAudio } from '../context/AudioPlayerContext';
import { supabase } from '../lib/supabase';
import { FaPlay, FaPause, FaClock, FaCalendar, FaRss, FaArrowLeft } from 'react-icons/fa';

const STRINGS = {
  fr: {
    backToPodcast: 'Retour au podcast',
    play: 'Écouter cet épisode',
    playing: 'En lecture...',
    pause: 'Pause',
    duration: 'Durée',
    publishedOn: 'Publié le',
    loading: 'Chargement...',
    notFound: 'Épisode introuvable',
    previousEpisodes: 'Épisodes précédents',
    listenNow: 'Écouter maintenant',
    episode: 'Épisode',
    from: 'de',
    subscribe: 'S\'abonner au podcast',
  },
  en: {
    backToPodcast: 'Back to podcast',
    play: 'Listen to this episode',
    playing: 'Playing...',
    pause: 'Pause',
    duration: 'Duration',
    publishedOn: 'Published on',
    loading: 'Loading...',
    notFound: 'Episode not found',
    previousEpisodes: 'Previous episodes',
    listenNow: 'Listen now',
    episode: 'Episode',
    from: 'from',
    subscribe: 'Subscribe to podcast',
  },
  es: {
    backToPodcast: 'Volver al podcast',
    play: 'Escuchar este episodio',
    playing: 'Reproduciendo...',
    pause: 'Pausa',
    duration: 'Duración',
    publishedOn: 'Publicado el',
    loading: 'Cargando...',
    notFound: 'Episodio no encontrado',
    previousEpisodes: 'Episodios anteriores',
    listenNow: 'Escuchar ahora',
    episode: 'Episodio',
    from: 'de',
    subscribe: 'Suscribirse al podcast',
  },
};

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

function formatDuration(seconds) {
  if (!seconds || isNaN(seconds) || seconds < 0) return '--:--';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}min`;
  return `${m}min ${s}s`;
}

function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').trim();
}

export default function EpisodeDetail() {
  const { id, episodeSlug } = useParams();
  const { lang } = useI18n();
  const L = useMemo(() => STRINGS[lang] || STRINGS.fr, [lang]);
  const { playPodcast, pauseAudio, isPlaying, currentTrack } = useAudio();
  const { sidebarOpen, isDesktop, sidebarWidth } = useUI();

  const [podcast, setPodcast] = useState(null);
  const [episode, setEpisode] = useState(null);
  const [previousEpisodes, setPreviousEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEpisode = async () => {
      try {
        setLoading(true);

        // Find podcast by id or slug
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        let podcastQuery = supabase.from('user_podcasts').select('*').eq('is_active', true);
        podcastQuery = isUUID ? podcastQuery.eq('id', id) : podcastQuery.eq('slug', id);
        const { data: podcastData, error: podcastError } = await podcastQuery.single();

        if (podcastError || !podcastData) {
          // Try matching by generated slug from title
          const { data: allPodcasts } = await supabase
            .from('user_podcasts')
            .select('*')
            .eq('is_active', true);

          const matchedPodcast = allPodcasts?.find(p => generateSlug(p.title) === id);
          if (!matchedPodcast) {
            setLoading(false);
            return;
          }
          setPodcast(matchedPodcast);

          // Load episodes for matched podcast
          const { data: episodes } = await supabase
            .from('podcast_episodes')
            .select('*')
            .eq('podcast_id', matchedPodcast.id)
            .order('pub_date', { ascending: false });

          const matchedEpisode = episodes?.find(ep => generateSlug(ep.title) === episodeSlug);
          setEpisode(matchedEpisode || null);

          // Get 3 previous episodes (excluding current)
          if (matchedEpisode && episodes) {
            const currentIndex = episodes.findIndex(ep => ep.id === matchedEpisode.id);
            const prevEps = episodes
              .filter((ep, idx) => idx > currentIndex && idx <= currentIndex + 3)
              .slice(0, 3);
            setPreviousEpisodes(prevEps);
          }
        } else {
          setPodcast(podcastData);

          // Load all episodes
          const { data: episodes } = await supabase
            .from('podcast_episodes')
            .select('*')
            .eq('podcast_id', podcastData.id)
            .order('pub_date', { ascending: false });

          const matchedEpisode = episodes?.find(ep => generateSlug(ep.title) === episodeSlug);
          setEpisode(matchedEpisode || null);

          // Get 3 previous episodes (excluding current)
          if (matchedEpisode && episodes) {
            const currentIndex = episodes.findIndex(ep => ep.id === matchedEpisode.id);
            const prevEps = episodes
              .filter((ep, idx) => idx > currentIndex && idx <= currentIndex + 3)
              .slice(0, 3);
            setPreviousEpisodes(prevEps);
          }
        }
      } catch (error) {
        console.error('Error loading episode:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEpisode();
  }, [id, episodeSlug]);

  const handlePlayEpisode = () => {
    if (!episode || !podcast) return;
    playPodcast({
      episodeId: episode.id,
      title: episode.title,
      audioUrl: episode.audio_url,
      image: episode.image_url || podcast.image_url,
      podcastTitle: podcast.title,
      podcastImage: podcast.image_url,
      duration: episode.duration_seconds,
    });
  };

  const isCurrentlyPlaying = isPlaying && currentTrack?.episodeId === episode?.id;

  const podcastSlug = podcast ? generateSlug(podcast.title) : id;

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{L.loading}</p>
        </div>
      </div>
    );
  }

  if (!episode || !podcast) {
    return (
      <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-red-600 mb-4">{L.notFound}</h1>
          <Link href="/podcasts" className="text-red-600 hover:underline">
            {L.backToPodcast}
          </Link>
        </div>
      </div>
    );
  }

  const episodeImage = episode.image_url || podcast.image_url;
  const pubDate = episode.pub_date ? new Date(episode.pub_date) : null;

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-b from-gray-900 to-black">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Back Link */}
          <Link
            href={`/podcast/${podcastSlug}`}
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8"
          >
            <FaArrowLeft className="text-sm" />
            <span>{L.backToPodcast}</span>
          </Link>

          <div className="flex flex-col md:flex-row gap-8">
            {/* Episode Image */}
            <div className="flex-shrink-0">
              <img
                src={episodeImage}
                alt={episode.title}
                className="w-64 h-64 md:w-80 md:h-80 object-cover rounded-xl shadow-2xl mx-auto md:mx-0"
              />
            </div>

            {/* Episode Info */}
            <div className="flex-1 text-center md:text-left">
              {/* Podcast Name - H2 */}
              <Link href={`/podcast/${podcastSlug}`}>
                <h2 className="text-red-500 hover:text-red-400 font-semibold text-lg mb-2 transition-colors">
                  {podcast.title}
                </h2>
              </Link>

              {/* Episode Title - H1 */}
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight mb-6">
                {episode.title}
              </h1>

              {/* Meta Info */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-gray-400 mb-6">
                {pubDate && (
                  <div className="flex items-center gap-2">
                    <FaCalendar className="text-sm" />
                    <span>
                      {pubDate.toLocaleDateString(lang, {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                )}
                {episode.duration_seconds && (
                  <div className="flex items-center gap-2">
                    <FaClock className="text-sm" />
                    <span>{formatDuration(episode.duration_seconds)}</span>
                  </div>
                )}
              </div>

              {/* Play Button */}
              <button
                onClick={isCurrentlyPlaying ? pauseAudio : handlePlayEpisode}
                className={`inline-flex items-center gap-3 px-8 py-4 rounded-full font-bold text-lg transition-all ${
                  isCurrentlyPlaying
                    ? 'bg-white text-black hover:bg-gray-200'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {isCurrentlyPlaying ? (
                  <>
                    <FaPause className="text-xl" />
                    {L.playing}
                  </>
                ) : (
                  <>
                    <FaPlay className="text-xl ml-1" />
                    {L.play}
                  </>
                )}
              </button>

              {/* Subscribe Link */}
              {podcast.rss_url && (
                <a
                  href={podcast.rss_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 ml-4 px-6 py-4 text-gray-400 hover:text-white transition-colors"
                >
                  <FaRss />
                  <span>{L.subscribe}</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Description Section */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {episode.description && (
          <article className="prose prose-lg dark:prose-invert max-w-none">
            <div
              className="text-gray-700 dark:text-gray-300 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: episode.description }}
            />
          </article>
        )}

        {/* Episode Details */}
        <div className="mt-12 p-6 bg-gray-100 dark:bg-gray-900 rounded-xl">
          <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4">
            {L.episode} {L.from} {podcast.title}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {podcast.author && (
              <div>
                <span className="text-gray-500 dark:text-gray-400">Auteur:</span>
                <span className="ml-2 text-gray-900 dark:text-white">{podcast.author}</span>
              </div>
            )}
            {podcast.category && (
              <div>
                <span className="text-gray-500 dark:text-gray-400">Catégorie:</span>
                <span className="ml-2 text-gray-900 dark:text-white">{podcast.category}</span>
              </div>
            )}
            {episode.guid && (
              <div>
                <span className="text-gray-500 dark:text-gray-400">GUID:</span>
                <span className="ml-2 text-gray-600 dark:text-gray-400 text-xs font-mono break-all">{episode.guid}</span>
              </div>
            )}
          </div>
        </div>

        {/* Previous Episodes - Internal Linking */}
        {previousEpisodes.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              {L.previousEpisodes}
            </h2>
            <div className="space-y-4">
              {previousEpisodes.map((prevEp) => {
                const prevEpSlug = generateSlug(prevEp.title);
                const prevEpImage = prevEp.image_url || podcast.image_url;
                const prevPubDate = prevEp.pub_date ? new Date(prevEp.pub_date) : null;

                return (
                  <Link
                    key={prevEp.id}
                    href={`/podcast/${podcastSlug}/episode/${prevEpSlug}`}
                    className="group flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border border-gray-200 dark:border-gray-800"
                  >
                    <img
                      src={prevEpImage}
                      alt={prevEp.title}
                      className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors line-clamp-1">
                        {prevEp.title}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {prevPubDate && (
                          <span>
                            {prevPubDate.toLocaleDateString(lang, {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                        )}
                        {prevEp.duration_seconds && (
                          <>
                            <span>•</span>
                            <span>{formatDuration(prevEp.duration_seconds)}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-red-600 dark:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      <FaPlay />
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Back to Podcast */}
        <div className="mt-12 text-center">
          <Link
            href={`/podcast/${podcastSlug}`}
            className="inline-flex items-center gap-2 text-red-600 hover:text-red-700 font-semibold transition-colors"
          >
            <FaArrowLeft />
            {L.backToPodcast}: {podcast.title}
          </Link>
        </div>
      </main>
    </div>
  );
}
