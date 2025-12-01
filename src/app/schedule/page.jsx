import Schedule from '../../pages-components/Schedule';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kracradio.com';

export const metadata = {
  title: 'Schedule - Radio Programming | KracRadio',
  description: 'Check out the KracRadio programming schedule. Find out when your favorite shows and DJs are on air.',
  openGraph: {
    type: 'website',
    url: `${siteUrl}/schedule`,
    title: 'Schedule - Radio Programming | KracRadio',
    description: 'Check out the KracRadio programming schedule. Find your favorite shows and DJs.',
    images: [{
      url: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=1200&h=630&fit=crop',
      width: 1200,
      height: 630,
      alt: 'KracRadio Schedule',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Schedule - Radio Programming | KracRadio',
    description: 'Check out the KracRadio programming schedule.',
    images: ['https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=1200&h=630&fit=crop'],
  },
};

export default function SchedulePage() { return <Schedule />; }
