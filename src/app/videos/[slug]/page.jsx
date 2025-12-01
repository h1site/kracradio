import { createClient } from '@supabase/supabase-js';
import VideoDetail from '../../../pages-components/VideoDetail';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kracradio.com';

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createClient(supabaseUrl, supabaseAnonKey);
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const supabase = getSupabaseClient();

  if (!supabase) {
    return { title: 'Music Video', description: 'Watch music videos on KracRadio' };
  }

  try {
    const { data: video } = await supabase
      .from('videos')
      .select('title, description, thumbnail_url, youtube_id, created_at, updated_at, submitter_id')
      .eq('slug', slug)
      .eq('status', 'approved')
      .single();

    if (!video) {
      return {
        title: 'Video Not Found',
        description: 'The requested video could not be found.',
      };
    }

    // Fetch submitter info
    let artistName = 'KracRadio';
    if (video.submitter_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, artist_name')
        .eq('id', video.submitter_id)
        .single();
      if (profile) {
        artistName = profile.display_name || profile.artist_name || 'KracRadio';
      }
    }

    const description = video.description || `Watch ${video.title} by ${artistName} on KracRadio`;
    const thumbnail = video.thumbnail_url || (video.youtube_id ? `https://img.youtube.com/vi/${video.youtube_id}/maxresdefault.jpg` : '/logo-og.png');
    const videoUrl = `${siteUrl}/videos/${slug}`;

    return {
      title: `${video.title} - ${artistName}`,
      description,
      openGraph: {
        type: 'video.other',
        url: videoUrl,
        title: `${video.title} - ${artistName}`,
        description,
        images: [
          {
            url: thumbnail,
            width: 1280,
            height: 720,
            alt: video.title,
          },
        ],
        videos: video.youtube_id ? [
          {
            url: `https://www.youtube.com/watch?v=${video.youtube_id}`,
            secureUrl: `https://www.youtube.com/watch?v=${video.youtube_id}`,
            type: 'text/html',
            width: 1280,
            height: 720,
          },
        ] : undefined,
      },
      twitter: {
        card: 'player',
        title: `${video.title} - ${artistName}`,
        description,
        images: [thumbnail],
        players: video.youtube_id ? [
          {
            playerUrl: `https://www.youtube.com/embed/${video.youtube_id}`,
            streamUrl: `https://www.youtube.com/watch?v=${video.youtube_id}`,
            width: 1280,
            height: 720,
          },
        ] : undefined,
      },
      alternates: {
        canonical: videoUrl,
      },
    };
  } catch (error) {
    console.error('Error generating video metadata:', error);
    return {
      title: 'Music Video',
      description: 'Watch music videos on KracRadio',
    };
  }
}

export default function VideoDetailPage() {
  return <VideoDetail />;
}
