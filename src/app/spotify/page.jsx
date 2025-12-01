import Spotify from '../../pages-components/Spotify';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kracradio.com';

export const metadata = {
  title: 'Spotify Playlists | KracRadio',
  description: 'Discover KracRadio curated Spotify playlists featuring the best indie, alternative, electronic, and rock music.',
  openGraph: {
    type: 'website',
    url: `${siteUrl}/spotify`,
    title: 'Spotify Playlists | KracRadio',
    description: 'Discover KracRadio curated Spotify playlists with the best indie and alternative music.',
    images: [{
      url: 'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=1200&h=630&fit=crop',
      width: 1200,
      height: 630,
      alt: 'KracRadio Spotify Playlists',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Spotify Playlists | KracRadio',
    description: 'Discover KracRadio curated Spotify playlists.',
    images: ['https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=1200&h=630&fit=crop'],
  },
};

export default function SpotifyPage() { return <Spotify />; }
