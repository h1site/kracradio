import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import Script from 'next/script';
import { breadcrumbSchema } from '../../seo/schemas';
import VideosClientParts from './VideosClientParts';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kracradio.com';

// Helper to create supabase client for server
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createClient(supabaseUrl, supabaseAnonKey);
}

// Fetch approved videos server-side
async function getApprovedVideos() {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  try {
    const { data: videos, error } = await supabase
      .from('videos')
      .select(`
        id,
        title,
        description,
        youtube_id,
        thumbnail_url,
        slug,
        artist_name,
        submitter_id,
        created_at
      `)
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (error || !videos) {
      console.error('Error fetching videos:', error);
      return [];
    }

    // Get submitter info
    const submitterIds = [...new Set(videos.map(v => v.submitter_id).filter(Boolean))];

    let submitterMap = {};
    if (submitterIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, role')
        .in('id', submitterIds);

      if (profiles) {
        profiles.forEach(p => {
          submitterMap[p.id] = p;
        });
      }
    }

    return videos.map(video => ({
      ...video,
      submitter: submitterMap[video.submitter_id] || null
    }));
  } catch (error) {
    console.error('Failed to load videos:', error);
    return [];
  }
}

export const metadata = {
  title: 'Music Videos',
  description: 'Watch music videos from independent artists on KracRadio. Discover new music, official videos, live performances, and exclusive content.',
  openGraph: {
    type: 'website',
    url: `${siteUrl}/videos`,
    title: 'Music Videos - KracRadio',
    description: 'Watch music videos from independent artists. Discover new music and exclusive content.',
    images: [{ url: '/icon.png', width: 1200, height: 630, alt: 'KracRadio Music Videos' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Music Videos - KracRadio',
    description: 'Watch music videos from independent artists.',
    images: ['/icon.png'],
  },
  alternates: {
    canonical: `${siteUrl}/videos`,
  },
};

export default async function VideosPage() {
  const videos = await getApprovedVideos();

  // JSON-LD schema
  const breadcrumbJsonLd = breadcrumbSchema([
    { name: 'Accueil', url: '/' },
    { name: 'Videos' }
  ]);

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* JSON-LD */}
      <Script
        id="breadcrumb-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out forwards;
        }
        .video-card {
          opacity: 0;
          animation: fadeInUp 0.5s ease-out forwards;
        }
        .video-card:hover {
          transform: translateY(-4px) scale(1.02);
        }
      `}</style>

      {/* Full-screen header */}
      <header className="relative w-full overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1574267432644-f65b56c5e2ce?w=1200&h=400&fit=crop&auto=format&q=80"
            alt="Videos"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent"></div>
        </div>
        <div className="relative py-16 md:py-24">
          <div className="max-w-4xl pl-[60px] md:pl-[100px] pr-8">
            <span
              className="inline-flex items-center rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-red-300 animate-fade-in-up"
              style={{ animationDelay: '0s' }}
            >
              Videos
            </span>
            <h1
              className="mt-4 text-4xl md:text-6xl font-black uppercase text-white animate-fade-in-up"
              style={{ animationDelay: '0.1s' }}
            >
              Videos
            </h1>
            <p
              className="mt-4 max-w-3xl text-lg text-gray-200 animate-fade-in-up"
              style={{ animationDelay: '0.2s' }}
            >
              Music videos from our community
            </p>
          </div>
        </div>
      </header>

      <main className="px-[5px] py-12">
        {/* Client component for search and interactive features */}
        <VideosClientParts initialVideos={videos} />
      </main>
    </div>
  );
}
