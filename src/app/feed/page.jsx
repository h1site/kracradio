import Feed from '../../pages-components/Feed';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kracradio.com';

export const metadata = {
  title: 'Feed - Community Activity | KracRadio',
  description: 'Stay updated with the latest activity from the KracRadio community. See new posts, likes, and interactions from artists and listeners.',
  openGraph: {
    type: 'website',
    url: `${siteUrl}/feed`,
    title: 'Feed - Community Activity | KracRadio',
    description: 'Stay updated with the latest activity from the KracRadio community.',
    images: [{
      url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&h=630&fit=crop',
      width: 1200,
      height: 630,
      alt: 'KracRadio Community Feed',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Feed - Community Activity | KracRadio',
    description: 'Stay updated with the latest activity from the KracRadio community.',
    images: ['https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&h=630&fit=crop'],
  },
};

export default function FeedPage() { return <Feed />; }
