import Artists from '../../pages-components/Artists';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kracradio.com';

export const metadata = {
  title: 'Artists & Members',
  description: 'Discover independent artists and community members on KracRadio. Browse profiles, genres, and connect with musicians from around the world.',
  openGraph: {
    type: 'website',
    url: `${siteUrl}/artists`,
    title: 'Artists & Members - KracRadio',
    description: 'Discover independent artists and community members. Browse profiles and connect with musicians.',
    images: [{ url: '/logo-og.png', width: 1200, height: 630, alt: 'KracRadio Artists' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Artists & Members - KracRadio',
    description: 'Discover independent artists on KracRadio.',
    images: ['/logo-og.png'],
  },
  alternates: {
    canonical: `${siteUrl}/artists`,
  },
};

export default function ArtistsPage() {
  return <Artists />;
}
