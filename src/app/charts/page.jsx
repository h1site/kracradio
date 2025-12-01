import Charts from '../../pages-components/Charts';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kracradio.com';

export const metadata = {
  title: 'Charts - Top Music | KracRadio',
  description: 'Discover the top trending songs and most played tracks on KracRadio. Updated daily with the hottest indie and alternative music.',
  openGraph: {
    type: 'website',
    url: `${siteUrl}/charts`,
    title: 'Charts - Top Music | KracRadio',
    description: 'Discover the top trending songs and most played tracks on KracRadio.',
    images: [{
      url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&h=630&fit=crop',
      width: 1200,
      height: 630,
      alt: 'KracRadio Music Charts',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Charts - Top Music | KracRadio',
    description: 'Discover the top trending songs and most played tracks on KracRadio.',
    images: ['https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&h=630&fit=crop'],
  },
};

export default function ChartsPage() { return <Charts />; }
