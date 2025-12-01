import AuthLogin from '../../pages-components/AuthLogin';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kracradio.com';

export const metadata = {
  title: 'Login | KracRadio',
  description: 'Sign in to your KracRadio account to access your playlists, liked songs, and connect with the music community.',
  openGraph: {
    type: 'website',
    url: `${siteUrl}/login`,
    title: 'Login | KracRadio',
    description: 'Sign in to your KracRadio account.',
    images: [{
      url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&h=630&fit=crop',
      width: 1200,
      height: 630,
      alt: 'KracRadio Login',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Login | KracRadio',
    description: 'Sign in to your KracRadio account.',
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&h=630&fit=crop'],
  },
};

export default function LoginPage() {
  return <AuthLogin />;
}
