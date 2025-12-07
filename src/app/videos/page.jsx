import Videos from '../../pages-components/Videos';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kracradio.com';

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

export default function VideosPage() {
  return <Videos />;
}
