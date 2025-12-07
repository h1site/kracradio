import './globals.css';
import Providers from '../components/Providers';
import AppLayout from '../components/AppLayout';
import GoogleAnalytics from '../components/GoogleAnalytics';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kracradio.com';

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'KracRadio - Online Radio & Music Community',
    template: '%s | KracRadio',
  },
  description: 'KracRadio is an online radio platform featuring diverse music channels, podcasts, music videos, and a vibrant artist community. Discover independent artists and emerging music.',
  keywords: ['online radio', 'internet radio', 'music streaming', 'podcasts', 'indie music', 'electronic music', 'rock radio', 'metal radio', 'jazz radio', 'french music', 'artist community', 'music videos'],
  authors: [{ name: 'KracRadio', url: siteUrl }],
  creator: 'KracRadio',
  publisher: 'KracRadio',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', type: 'image/png', sizes: '32x32' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    alternateLocale: ['fr_CA', 'es_ES'],
    url: siteUrl,
    siteName: 'KracRadio',
    title: 'KracRadio - Online Radio & Music Community',
    description: 'Discover diverse music channels, podcasts, music videos, and connect with independent artists on KracRadio.',
    images: [
      {
        url: '/icon.png',
        width: 1200,
        height: 630,
        alt: 'KracRadio - Online Radio & Music Community',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@KracRadio',
    creator: '@KracRadio',
    title: 'KracRadio - Online Radio & Music Community',
    description: 'Discover diverse music channels, podcasts, music videos, and connect with independent artists.',
    images: ['/icon.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: siteUrl,
    languages: {
      'en': siteUrl,
      'fr': `${siteUrl}?lang=fr`,
      'es': `${siteUrl}?lang=es`,
    },
  },
  verification: {
    // Add your verification codes here
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
    // bing: 'your-bing-verification-code',
  },
  category: 'music',
  classification: 'Online Radio',
  other: {
    'theme-color': '#E50914',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'apple-mobile-web-app-title': 'KracRadio',
    'application-name': 'KracRadio',
    'msapplication-TileColor': '#E50914',
    'msapplication-config': '/browserconfig.xml',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
};

// Force dynamic rendering for all pages (no static generation)
export const dynamic = 'force-dynamic';

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <GoogleAnalytics />
        {/* Google AdSense */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8781698761921917"
          crossOrigin="anonymous"
        />
        {/* Critical resource hints for Core Web Vitals */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://gpcedzaflhiucwyjgdai.supabase.co" />
        <link rel="dns-prefetch" href="https://gpcedzaflhiucwyjgdai.supabase.co" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://img.youtube.com" />
        <link rel="preconnect" href="https://img.youtube.com" />

        {/* Preload critical LCP images */}
        <link
          rel="preload"
          href="/channels/kracradio.webp"
          as="image"
          type="image/webp"
          fetchPriority="high"
        />
        <link
          rel="preload"
          href="/logo-white.png"
          as="image"
          type="image/png"
        />
      </head>
      <body suppressHydrationWarning>
        <Providers>
          <AppLayout>
            {children}
          </AppLayout>
        </Providers>
      </body>
    </html>
  );
}
