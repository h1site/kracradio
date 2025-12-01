import AuthRegister from '../../pages-components/AuthRegister';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kracradio.com';

export const metadata = {
  title: 'Create Account | KracRadio',
  description: 'Join KracRadio! Create your free account to submit music, create playlists, and connect with indie artists and music lovers.',
  openGraph: {
    type: 'website',
    url: `${siteUrl}/register`,
    title: 'Create Account | KracRadio',
    description: 'Join KracRadio! Create your free account to submit music and connect with the community.',
    images: [{
      url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&h=630&fit=crop',
      width: 1200,
      height: 630,
      alt: 'Join KracRadio',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Create Account | KracRadio',
    description: 'Join KracRadio and connect with indie artists.',
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&h=630&fit=crop'],
  },
};

export default function RegisterPage() { return <AuthRegister />; }
