import SubmitMusic from '../../pages-components/SubmitMusic';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kracradio.com';

export const metadata = {
  title: 'Submit Your Music | KracRadio',
  description: 'Submit your music to KracRadio for airplay consideration. We support independent artists and emerging talent in indie, rock, electronic, and more.',
  openGraph: {
    type: 'website',
    url: `${siteUrl}/submit-music`,
    title: 'Submit Your Music | KracRadio',
    description: 'Submit your music to KracRadio for airplay. We support independent artists and emerging talent.',
    images: [{
      url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&h=630&fit=crop',
      width: 1200,
      height: 630,
      alt: 'Submit Music to KracRadio',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Submit Your Music | KracRadio',
    description: 'Submit your music to KracRadio for airplay consideration.',
    images: ['https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&h=630&fit=crop'],
  },
};

export default function SubmitMusicPage() { return <SubmitMusic />; }
