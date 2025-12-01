import PodcastsNew from '../../pages-components/PodcastsNew';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kracradio.com';

export const metadata = {
  title: 'Podcasts',
  description: 'Listen to music podcasts on KracRadio. Discover conversations about music, artist interviews, industry insights, and curated audio content.',
  openGraph: {
    type: 'website',
    url: `${siteUrl}/podcasts`,
    title: 'Podcasts - KracRadio',
    description: 'Listen to music podcasts. Discover conversations about music and artist interviews.',
    images: [{ url: '/logo-og.png', width: 1200, height: 630, alt: 'KracRadio Podcasts' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Podcasts - KracRadio',
    description: 'Listen to music podcasts on KracRadio.',
    images: ['/logo-og.png'],
  },
  alternates: {
    canonical: `${siteUrl}/podcasts`,
  },
};

export default function PodcastsPage() {
  return <PodcastsNew />;
}
