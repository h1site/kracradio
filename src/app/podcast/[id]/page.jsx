import { createClient } from '@supabase/supabase-js';
import Script from 'next/script';
import PodcastDetail from '../../../pages-components/PodcastDetail';
import { podcastSeriesSchema, breadcrumbSchema } from '../../../seo/schemas';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kracradio.com';

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createClient(supabaseUrl, supabaseAnonKey);
}

// Fetch podcast data server-side for structured data
async function getPodcastData(id) {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    // Try to get from user_podcasts first (new table)
    let podcast = null;
    const { data: userPodcast } = await supabase
      .from('user_podcasts')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (userPodcast) {
      podcast = userPodcast;
    } else {
      // Fallback to legacy podcasts table
      const { data: legacyPodcast } = await supabase
        .from('podcasts')
        .select('*')
        .eq('id', id)
        .eq('status', 'approved')
        .single();
      podcast = legacyPodcast;
    }

    return podcast;
  } catch (error) {
    console.error('Error fetching podcast:', error);
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const supabase = getSupabaseClient();

  if (!supabase) {
    return { title: 'Podcast', description: 'Listen to podcasts on KracRadio' };
  }

  try {
    // Try user_podcasts first
    let podcast = null;
    const { data: userPodcast } = await supabase
      .from('user_podcasts')
      .select('title, description, image_url, author, feed_url, created_at, updated_at')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (userPodcast) {
      podcast = {
        title: userPodcast.title,
        description: userPodcast.description,
        cover_image: userPodcast.image_url,
        host_name: userPodcast.author,
        rss_feed: userPodcast.feed_url,
        created_at: userPodcast.created_at,
        updated_at: userPodcast.updated_at,
      };
    } else {
      // Fallback to legacy podcasts table
      const { data: legacyPodcast } = await supabase
        .from('podcasts')
        .select('title, description, cover_image, host_name, rss_feed, created_at, updated_at')
        .eq('id', id)
        .eq('status', 'approved')
        .single();
      podcast = legacyPodcast;
    }

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

export default async function PodcastDetailPage({ params }) {
  const { id } = await params;
  const podcast = await getPodcastData(id);

  // Generate JSON-LD structured data
  let jsonLdData = [];

  if (podcast) {
    // PodcastSeries schema
    const podcastSchema = podcastSeriesSchema(podcast);
    if (podcastSchema) {
      jsonLdData.push(podcastSchema);
    }
  }

  // Breadcrumb
  jsonLdData.push(breadcrumbSchema([
    { name: 'Accueil', url: '/' },
    { name: 'Podcasts', url: '/podcasts' },
    { name: podcast?.title || 'Podcast' }
  ]));

  return (
    <>
      {/* JSON-LD structured data for SEO */}
      {jsonLdData.map((data, index) => (
        <Script
          key={index}
          id={`podcast-jsonld-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
        />
      ))}

      {/* Client component for interactive podcast player */}
      <PodcastDetail />
    </>
  );
}
