import Donation from '../../pages-components/Donation';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kracradio.com';

export const metadata = {
  title: 'Support KracRadio - Donate | KracRadio',
  description: 'Support independent radio! Your donation helps KracRadio continue promoting indie artists and providing free music streaming to the community.',
  openGraph: {
    type: 'website',
    url: `${siteUrl}/donation`,
    title: 'Support KracRadio - Donate | KracRadio',
    description: 'Support independent radio! Your donation helps KracRadio promote indie artists.',
    images: [{
      url: 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=1200&h=630&fit=crop',
      width: 1200,
      height: 630,
      alt: 'Support KracRadio',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Support KracRadio - Donate | KracRadio',
    description: 'Support independent radio and indie artists.',
    images: ['https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=1200&h=630&fit=crop'],
  },
};

export default function DonationPage() { return <Donation />; }
