import Script from 'next/script';
import Home from '../pages-components/Home';
import { organizationSchema, websiteSchema, radioStationSchema } from '../seo/schemas';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kracradio.com';

export const metadata = {
  title: 'KracRadio - Your Online Radio',
  description: 'Discover KracRadio, the modern online radio platform for independent artists. Listen to curated music channels, podcasts, and connect with a vibrant community of musicians.',
  keywords: ['online radio', 'independent music', 'podcasts', 'music streaming', 'artists', 'KracRadio'],
  openGraph: {
    type: 'website',
    url: siteUrl,
    title: 'KracRadio - Your Online Radio',
    description: 'Discover KracRadio, the modern online radio platform for independent artists.',
    images: [{ url: '/icon.png', width: 1200, height: 630, alt: 'KracRadio' }],
    siteName: 'KracRadio',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KracRadio - Your Online Radio',
    description: 'Discover KracRadio, the modern online radio platform for independent artists.',
    images: ['/icon.png'],
    site: '@kracradio',
    creator: '@kracradio',
  },
  alternates: {
    canonical: siteUrl,
    languages: {
      'en': siteUrl,
      'fr': `${siteUrl}/fr`,
      'es': `${siteUrl}/es`,
    },
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function HomePage() {
  return (
    <>
      {/* JSON-LD structured data for SEO */}
      <Script
        id="organization-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <Script
        id="website-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <Script
        id="radiostation-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(radioStationSchema) }}
      />

      {/* Client component for interactive home page */}
      <Home />
    </>
  );
}
