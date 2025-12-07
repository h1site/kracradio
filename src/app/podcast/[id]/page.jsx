import { createClient } from '@supabase/supabase-js';
import PodcastDetail from '../../../pages-components/PodcastDetail';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kracradio.com';

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createClient(supabaseUrl, supabaseAnonKey);
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const supabase = getSupabaseClient();

  if (!supabase) {
    return { title: 'Podcast', description: 'Listen to podcasts on KracRadio' };
  }

  try {
    const { data: podcast } = await supabase
      .from('podcasts')
      .select('title, description, cover_image, host_name, rss_feed, created_at, updated_at')
      .eq('id', id)
      .eq('status', 'approved')
      .single();

    if (!podcast) {
      return {
        title: 'Podcast Not Found',
        description: 'The requested podcast could not be found.',
      };
    }

    const description = podcast.description
      ? podcast.description.slice(0, 160) + (podcast.description.length > 160 ? '...' : '')
      : `Listen to ${podcast.title} podcast on KracRadio`;
    const coverImage = podcast.cover_image || '/icon.png';
    const podcastUrl = `${siteUrl}/podcast/${id}`;

    return {
      title: `${podcast.title} - Podcast`,
      description,
      authors: podcast.host_name ? [{ name: podcast.host_name }] : undefined,
      openGraph: {
        type: 'music.playlist',
        url: podcastUrl,
        title: `${podcast.title} - Podcast`,
        description,
        images: [
          {
            url: coverImage,
            width: 1400,
            height: 1400,
            alt: podcast.title,
          },
        ],
        audio: podcast.rss_feed ? [
          {
            url: podcast.rss_feed,
            type: 'application/rss+xml',
          },
        ] : undefined,
      },
      twitter: {
        card: 'summary_large_image',
        title: `${podcast.title} - Podcast`,
        description,
        images: [coverImage],
      },
      alternates: {
        canonical: podcastUrl,
        types: podcast.rss_feed ? {
          'application/rss+xml': podcast.rss_feed,
        } : undefined,
      },
      other: {
        'podcast:author': podcast.host_name || 'KracRadio',
        'podcast:category': 'Music',
      },
    };
  } catch (error) {
    console.error('Error generating podcast metadata:', error);
    return {
      title: 'Podcast',
      description: 'Listen to podcasts on KracRadio',
    };
  }
}

export default function PodcastDetailPage() {
  return <PodcastDetail />;
}
