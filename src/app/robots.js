export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kracradio.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/admin/*',
          '/dashboard',
          '/dashboard/*',
          '/settings',
          '/messages',
          '/liked-songs',
          '/liked-videos',
          '/playlists',
          '/auth/*',
          '/api/*',
          '/_next/*',
          '/private/*',
        ],
      },
      {
        userAgent: 'GPTBot',
        disallow: ['/'],
      },
      {
        userAgent: 'ChatGPT-User',
        disallow: ['/'],
      },
      {
        userAgent: 'CCBot',
        disallow: ['/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
