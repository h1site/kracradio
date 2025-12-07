import Articles from '../../pages-components/Articles';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kracradio.com';

export const metadata = {
  title: 'Articles',
  description: 'Read the latest music news, interviews, and articles from the KracRadio community. Discover stories about independent artists, music trends, and industry insights.',
  openGraph: {
    type: 'website',
    url: `${siteUrl}/articles`,
    title: 'Articles - KracRadio',
    description: 'Read the latest music news, interviews, and articles from the KracRadio community.',
    images: [{ url: '/icon.png', width: 1200, height: 630, alt: 'KracRadio Articles' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Articles - KracRadio',
    description: 'Read the latest music news, interviews, and articles.',
    images: ['/icon.png'],
  },
  alternates: {
    canonical: `${siteUrl}/articles`,
  },
};

export default function ArticlesPage() {
  return <Articles />;
}
