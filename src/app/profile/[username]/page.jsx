import { createClient } from '@supabase/supabase-js';
import Script from 'next/script';
import PublicProfile from '../../../pages-components/PublicProfile';
import { personSchema, musicGroupSchema, breadcrumbSchema } from '../../../seo/schemas';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kracradio.com';

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createClient(supabaseUrl, supabaseAnonKey);
}

// Fetch profile data server-side for structured data
async function getProfileData(username) {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('artist_slug', username)
      .eq('is_public', true)
      .single();

    return profile;
  } catch (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { username } = await params;
  const supabase = getSupabaseClient();

  if (!supabase) {
    return { title: 'Artist Profile', description: 'Discover artists on KracRadio' };
  }

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, username, artist_name, bio, avatar_url, genre, genres, location, website_url, spotify_url, soundcloud_url, youtube_url, instagram_url, is_verified')
      .eq('artist_slug', username)
      .eq('is_public', true)
      .single();

    if (!profile) {
      return {
        title: 'Profile Not Found',
        description: 'The requested profile could not be found.',
      };
    }

    const name = profile.display_name || profile.username || profile.artist_name || username;
    const genre = profile.genres?.[0] || profile.genre || 'Music';
    const description = profile.bio
      ? profile.bio.slice(0, 160) + (profile.bio.length > 160 ? '...' : '')
      : `Discover ${name} on KracRadio - ${genre} artist${profile.location ? ` from ${profile.location}` : ''}`;
    const avatar = profile.avatar_url || '/icon.png';
    const profileUrl = `${siteUrl}/profile/${username}`;

    // Collect social links for sameAs
    const sameAs = [
      profile.website_url,
      profile.spotify_url,
      profile.soundcloud_url,
      profile.youtube_url,
      profile.instagram_url,
    ].filter(Boolean);

    return {
      title: `${name} - Artist Profile`,
      description,
      openGraph: {
        type: 'profile',
        url: profileUrl,
        title: `${name} - Artist Profile`,
        description,
        images: [
          {
            url: avatar,
            width: 400,
            height: 400,
            alt: name,
          },
        ],
        profile: {
          username: username,
        },
      },
      twitter: {
        card: 'summary',
        title: `${name} - Artist Profile`,
        description,
        images: [avatar],
      },
      alternates: {
        canonical: profileUrl,
      },
      other: {
        'profile:username': username,
        ...(genre && { 'music:genre': genre }),
      },
    };
  } catch (error) {
    console.error('Error generating profile metadata:', error);
    return {
      title: 'Artist Profile',
      description: 'Discover artists on KracRadio',
    };
  }
}

export default async function ProfilePage({ params }) {
  const { username } = await params;
  const profile = await getProfileData(username);

  // Generate JSON-LD structured data
  let jsonLdData = [];

  if (profile) {
    // Use musicGroupSchema for verified artists, personSchema otherwise
    if (profile.is_verified) {
      jsonLdData.push(musicGroupSchema(profile));
    } else {
      jsonLdData.push(personSchema(profile));
    }
  }

  // Add breadcrumb
  jsonLdData.push(breadcrumbSchema([
    { name: 'Accueil', url: '/' },
    { name: 'Artists', url: '/artists' },
    { name: profile?.username || username }
  ]));

  return (
    <>
      {/* JSON-LD structured data for SEO */}
      {jsonLdData.map((data, index) => (
        <Script
          key={index}
          id={`profile-jsonld-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
        />
      ))}

      {/* Client component for interactive profile */}
      <PublicProfile />
    </>
  );
}
