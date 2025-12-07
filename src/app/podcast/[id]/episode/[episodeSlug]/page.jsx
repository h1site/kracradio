import { createClient } from '@supabase/supabase-js';
import EpisodeDetail from '../../../../../pages-components/EpisodeDetail';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kracradio.com';

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createClient(supabaseUrl, supabaseAnonKey);
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

export async function generateMetadata({ params }) {
  const { id, episodeSlug } = await params;
  const supabase = getSupabaseClient();

  if (!supabase) {
    return { title: 'Episode', description: 'Listen to this podcast episode on KracRadio' };
  }

  try {
    // Find podcast by id or slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    let podcastQuery = supabase.from('user_podcasts').select('id, title, image_url, author, slug').eq('is_active', true);
    podcastQuery = isUUID ? podcastQuery.eq('id', id) : podcastQuery.eq('slug', id);
    const { data: podcastData, error: podcastError } = await podcastQuery.single();

    let podcast = podcastData;

    // If not found by UUID or slug, try matching by generated slug from title
    if (podcastError || !podcastData) {
      const { data: allPodcasts } = await supabase
        .from('user_podcasts')
        .select('id, title, image_url, author, slug')
        .eq('is_active', true);

      podcast = allPodcasts?.find(p => generateSlug(p.title) === id);
    }

    if (!podcast) {
      return { title: 'Episode Not Found', description: 'The requested episode could not be found.' };
    }

    // Find episode by matching slug
    const { data: episodes } = await supabase
      .from('podcast_episodes')
      .select('id, title, description, image_url, audio_url, pub_date, duration_seconds')
      .eq('podcast_id', podcast.id);

    const episode = episodes?.find(ep => generateSlug(ep.title) === episodeSlug);

    if (!episode) {
      return { title: 'Episode Not Found', description: 'The requested episode could not be found.' };
    }

    const description = episode.description
      ? episode.description.replace(/<[^>]*>/g, '').slice(0, 160) + (episode.description.length > 160 ? '...' : '')
      : `Listen to ${episode.title} from ${podcast.title} on KracRadio`;

    const coverImage = episode.image_url || podcast.image_url || '/icon.png';
    const podcastSlug = podcast.slug || generateSlug(podcast.title);
    const episodeUrl = `${siteUrl}/podcast/${podcastSlug}/episode/${episodeSlug}`;

    return {
      title: `${episode.title} | ${podcast.title}`,
      description,
      authors: podcast.author ? [{ name: podcast.author }] : undefined,
      openGraph: {
        type: 'music.song',
        url: episodeUrl,
        title: episode.title,
        description,
        siteName: 'KracRadio',
        images: [
          {
            url: coverImage,
            width: 1400,
            height: 1400,
            alt: episode.title,
          },
        ],
        audio: episode.audio_url ? [
          {
            url: episode.audio_url,
            type: 'audio/mpeg',
          },
        ] : undefined,
      },
      twitter: {
        card: 'summary_large_image',
        title: `${episode.title} | ${podcast.title}`,
        description,
        images: [coverImage],
      },
      alternates: {
        canonical: episodeUrl,
      },
      other: {
        'podcast:episode': episode.title,
        'podcast:show': podcast.title,
        'podcast:author': podcast.author || 'KracRadio',
        'music:duration': episode.duration_seconds || undefined,
        'music:release_date': episode.pub_date || undefined,
      },
    };
  } catch (error) {
    console.error('Error generating episode metadata:', error);
    return {
      title: 'Podcast Episode',
      description: 'Listen to podcast episodes on KracRadio',
    };
  }
}

export default function EpisodeDetailPage() {
  return <EpisodeDetail />;
}
