import PrivacyPolicy from '../../pages-components/PrivacyPolicy';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kracradio.com';

export const metadata = {
  title: 'Privacy Policy | KracRadio',
  description: 'Read KracRadio\'s privacy policy. Learn how we collect, use, and protect your personal information.',
  openGraph: {
    type: 'website',
    url: `${siteUrl}/privacy`,
    title: 'Privacy Policy | KracRadio',
    description: 'Read KracRadio\'s privacy policy and learn how we protect your data.',
    images: [{
      url: '/logo-og.png',
      width: 1200,
      height: 630,
      alt: 'KracRadio Privacy Policy',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Privacy Policy | KracRadio',
    description: 'Read KracRadio\'s privacy policy.',
    images: ['/logo-og.png'],
  },
};

export default function PrivacyPage() { return <PrivacyPolicy />; }
