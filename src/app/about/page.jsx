import About from '../../pages-components/About';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kracradio.com';

export const metadata = {
  title: 'About Us | KracRadio',
  description: 'Learn about KracRadio, an independent online radio platform dedicated to promoting indie artists, alternative music, and building a vibrant music community.',
  openGraph: {
    type: 'website',
    url: `${siteUrl}/about`,
    title: 'About Us | KracRadio',
    description: 'Learn about KracRadio, an independent online radio platform dedicated to promoting indie artists and alternative music.',
    images: [{
      url: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1200&h=630&fit=crop',
      width: 1200,
      height: 630,
      alt: 'About KracRadio',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Us | KracRadio',
    description: 'Learn about KracRadio, an independent online radio platform.',
    images: ['https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1200&h=630&fit=crop'],
  },
};

export default function AboutPage() { return <About />; }
