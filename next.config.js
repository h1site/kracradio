/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Compression for smaller bundles
  compress: true,

  // Optimize images for Core Web Vitals
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'stream.kracradio.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
    // Optimize image formats
    formats: ['image/avif', 'image/webp'],
    // Minimize image sizes
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    // Cache optimization
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },

  // Note: optimizeCss requires 'critters' package - disabled for now
  // experimental: {
  //   optimizeCss: true,
  // },

  // Headers for caching and performance
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|jpeg|png|gif|ico|webp|avif)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:all*(js|css)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:all*(woff|woff2|ttf|otf|eot)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/api/proxy/:path*',
        destination: 'https://baladoquebec.ca/:path*',
      },
    ];
  },
  async redirects() {
    return [
      // /donate -> /donation
      {
        source: '/donate',
        destination: '/donation',
        permanent: true,
      },
      // Old article URL pattern: /articles/:slug -> /article/:slug
      {
        source: '/articles/:slug',
        destination: '/article/:slug',
        permanent: true,
      },
      // German language redirect (no DE version)
      {
        source: '/de',
        destination: '/',
        permanent: false,
      },
      {
        source: '/de/:path*',
        destination: '/:path*',
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
