import { createClient } from '@supabase/supabase-js';
import PublicProfile from '../../../pages-components/PublicProfile';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kracradio.com';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function generateMetadata({ params }) {
  const { username } = await params;

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, artist_name, bio, avatar_url, genre, country, website, spotify_url, soundcloud_url, youtube_url, instagram_url')
      .eq('artist_slug', username)
      .eq('is_public', true)
      .single();

    if (!profile) {
      return {
        title: 'Profile Not Found',
        description: 'The requested profile could not be found.',
      };
    }

    const name = profile.display_name || profile.artist_name || username;
    const description = profile.bio
      ? profile.bio.slice(0, 160) + (profile.bio.length > 160 ? '...' : '')
      : `Discover ${name} on KracRadio - ${profile.genre || 'Music'} artist${profile.country ? ` from ${profile.country}` : ''}`;
    const avatar = profile.avatar_url || '/logo-og.png';
    const profileUrl = `${siteUrl}/profile/${username}`;

    // Collect social links for sameAs
    const sameAs = [
      profile.website,
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
        ...(profile.genre && { 'music:genre': profile.genre }),
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

export default function ProfilePage() {
  return <PublicProfile />;
}
