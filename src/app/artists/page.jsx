import { createClient } from '@supabase/supabase-js';
import Script from 'next/script';
import { collectionPageSchema, breadcrumbSchema } from '../../seo/schemas';
import ArtistsClientParts from './ArtistsClientParts';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kracradio.com';

// Helper to create supabase client for server
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createClient(supabaseUrl, supabaseAnonKey);
}

// Fetch public profiles server-side
async function getPublicProfiles() {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('is_public', true)
      .order('username', { ascending: true });

    if (error) throw error;

    // Transform to match expected format
    return (data || []).map(profile => ({
      ...profile,
      user_id: profile.id
    }));
  } catch (error) {
    console.error('Error loading profiles:', error);
    return [];
  }
}

export const metadata = {
  title: 'Artists & Members',
  description: 'Discover independent artists and community members on KracRadio. Browse profiles, genres, and connect with musicians from around the world.',
  openGraph: {
    type: 'website',
    url: `${siteUrl}/artists`,
    title: 'Artists & Members - KracRadio',
    description: 'Discover independent artists and community members. Browse profiles and connect with musicians.',
    images: [{ url: '/icon.png', width: 1200, height: 630, alt: 'KracRadio Artists' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Artists & Members - KracRadio',
    description: 'Discover independent artists on KracRadio.',
    images: ['/icon.png'],
  },
  alternates: {
    canonical: `${siteUrl}/artists`,
  },
};

export default async function ArtistsPage() {
  const profiles = await getPublicProfiles();

  // JSON-LD schemas
  const collectionJsonLd = collectionPageSchema('Artists & Members', metadata.description, '/artists', profiles.length);
  const breadcrumbJsonLd = breadcrumbSchema([
    { name: 'Accueil', url: '/' },
    { name: 'Artists' }
  ]);

  return (
    <div className="min-h-screen bg-white dark:bg-black pb-[50px]">
      {/* JSON-LD */}
      <Script
        id="collection-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
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
        .artist-card {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .artist-card:hover {
          transform: translateY(-4px);
        }
      `}</style>

      {/* Client component handles header with search/filters, and display */}
      <ArtistsClientParts initialProfiles={profiles} />
    </div>
  );
}
