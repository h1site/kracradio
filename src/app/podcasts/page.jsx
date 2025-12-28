import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import Script from 'next/script';
import { breadcrumbSchema } from '../../seo/schemas';
import PodcastsClientParts from './PodcastsClientParts';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kracradio.com';

// Helper to create supabase client for server
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createClient(supabaseUrl, supabaseAnonKey);
}

// Fetch active podcasts server-side
async function getActivePodcasts() {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  try {
    const { data: podcastsData, error: podcastsError } = await supabase
      .from('user_podcasts')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

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

    return podcastsWithStats;
  } catch (error) {
    console.error('Error loading podcasts:', error);
    return [];
  }
}

export const metadata = {
  title: 'Podcasts',
  description: 'Listen to music podcasts on KracRadio. Discover conversations about music, artist interviews, industry insights, and curated audio content.',
  openGraph: {
    type: 'website',
    url: `${siteUrl}/podcasts`,
    title: 'Podcasts - KracRadio',
    description: 'Listen to music podcasts. Discover conversations about music and artist interviews.',
    images: [{ url: '/icon.png', width: 1200, height: 630, alt: 'KracRadio Podcasts' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Podcasts - KracRadio',
    description: 'Listen to music podcasts on KracRadio.',
    images: ['/icon.png'],
  },
  alternates: {
    canonical: `${siteUrl}/podcasts`,
  },
};

export default async function PodcastsPage() {
  const podcasts = await getActivePodcasts();

  // JSON-LD schema
  const breadcrumbJsonLd = breadcrumbSchema([
    { name: 'Accueil', url: '/' },
    { name: 'Podcasts' }
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
        .podcast-card {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .podcast-card:hover {
          transform: translateY(-4px) scale(1.02);
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {/* Full-screen header */}
      <header className="relative w-full overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=1200&h=400&fit=crop&auto=format&q=80"
            alt="Podcasts"
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
              Podcasts
            </span>
            <h1
              className="mt-4 text-4xl md:text-6xl font-black uppercase text-white animate-fade-in-up"
              style={{ animationDelay: '0.1s' }}
            >
              Discover our podcasts
            </h1>
            <p
              className="mt-4 max-w-3xl text-lg text-gray-200 animate-fade-in-up"
              style={{ animationDelay: '0.2s' }}
            >
              A selection of independent, varied and exciting podcasts.
            </p>
          </div>
        </div>
      </header>

      <main className="px-[5px] py-12">
        {podcasts.length === 0 ? (
          <div className="rounded-3xl border border-gray-200 bg-white p-12 text-center shadow-sm dark:border-gray-800 dark:bg-gray-950">
            <p className="text-gray-600 dark:text-gray-400">No podcasts available at the moment</p>
          </div>
        ) : (
          <PodcastsClientParts initialPodcasts={podcasts} />
        )}
      </main>
    </div>
  );
}
