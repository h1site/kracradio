// scripts/generate-sitemap.js
// Generate dynamic sitemap with articles, videos, and artist profiles from Supabase

import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPABASE_URL = 'https://gpcedzaflhiucwyjgdai.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdwY2VkemFmbGhpdWN3eWpnZGFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNzgzMzAsImV4cCI6MjA3NDc1NDMzMH0.sMkG7VMYRFWF1dKY_XPyQ-6iAJ1BYHKcye1R-CNO3ho';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const BASE_URL = 'https://kracradio.com';

// Generate slug from video title (same logic as in Videos.jsx)
function generateVideoSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function generateSitemap() {
  console.log('Generating sitemap...');

  // Static pages
  const staticPages = [
    { loc: '/', changefreq: 'daily', priority: '1.0' },
    { loc: '/articles', changefreq: 'daily', priority: '0.9' },
    { loc: '/artists', changefreq: 'daily', priority: '0.9' },
    { loc: '/videos', changefreq: 'daily', priority: '0.9' },
    { loc: '/podcasts', changefreq: 'daily', priority: '0.8' },
    { loc: '/charts', changefreq: 'daily', priority: '0.8' },
    { loc: '/schedule', changefreq: 'weekly', priority: '0.7' },
    { loc: '/spotify', changefreq: 'weekly', priority: '0.6' },
    { loc: '/store', changefreq: 'weekly', priority: '0.6' },
    { loc: '/about', changefreq: 'monthly', priority: '0.5' },
    { loc: '/contact', changefreq: 'monthly', priority: '0.5' },
    { loc: '/privacy', changefreq: 'yearly', priority: '0.3' },
    { loc: '/submit-music', changefreq: 'monthly', priority: '0.6' },
    { loc: '/donate', changefreq: 'monthly', priority: '0.5' },
  ];

  // Radio channels
  const channels = ['chill', 'hits', 'oldies', 'hiphop', 'country', 'rock', 'latino', 'lofi'];
  const channelPages = channels.map(ch => ({
    loc: `/channel/${ch}`,
    changefreq: 'daily',
    priority: '0.8'
  }));

  // Charts by channel
  const chartPages = channels.map(ch => ({
    loc: `/charts/${ch}`,
    changefreq: 'daily',
    priority: '0.7'
  }));

  // Fetch published articles (published_at not null means published)
  console.log('Fetching articles...');
  const { data: articles, error: articlesError } = await supabase
    .from('articles')
    .select('slug, updated_at')
    .not('published_at', 'is', null)
    .order('created_at', { ascending: false });

  if (articlesError) {
    console.error('Error fetching articles:', articlesError);
  }

  const articlePages = (articles || []).map(article => ({
    loc: `/article/${article.slug}`,
    changefreq: 'weekly',
    priority: '0.8',
    lastmod: article.updated_at ? article.updated_at.split('T')[0] : undefined
  }));
  console.log(`Found ${articlePages.length} articles`);

  // Fetch approved videos
  console.log('Fetching videos...');
  const { data: videos, error: videosError } = await supabase
    .from('videos')
    .select('title, updated_at')
    .eq('status', 'approved')
    .order('created_at', { ascending: false });

  if (videosError) {
    console.error('Error fetching videos:', videosError);
  }

  const videoPages = (videos || []).map(video => ({
    loc: `/videos/${generateVideoSlug(video.title)}`,
    changefreq: 'weekly',
    priority: '0.7',
    lastmod: video.updated_at ? video.updated_at.split('T')[0] : undefined
  }));
  console.log(`Found ${videoPages.length} videos`);

  // Fetch artist profiles (creators with artist_slug)
  console.log('Fetching artist profiles...');
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('username, artist_slug, updated_at')
    .eq('role', 'creator')
    .not('artist_slug', 'is', null)
    .order('created_at', { ascending: false });

  if (profilesError) {
    console.error('Error fetching profiles:', profilesError);
  }

  const profilePages = (profiles || []).map(profile => ({
    loc: `/profile/${profile.artist_slug || profile.username}`,
    changefreq: 'weekly',
    priority: '0.7',
    lastmod: profile.updated_at ? profile.updated_at.split('T')[0] : undefined
  }));
  console.log(`Found ${profilePages.length} artist profiles`);

  // Combine all pages
  const allPages = [
    ...staticPages,
    ...channelPages,
    ...chartPages,
    ...articlePages,
    ...videoPages,
    ...profilePages
  ];

  // Generate XML
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages.map(page => `  <url>
    <loc>${BASE_URL}${page.loc}</loc>${page.lastmod ? `
    <lastmod>${page.lastmod}</lastmod>` : ''}
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;

  // Write to public/sitemap.xml
  const outputPath = join(__dirname, '..', 'public', 'sitemap.xml');
  writeFileSync(outputPath, xml);
  console.log(`Sitemap generated at ${outputPath}`);
  console.log(`Total URLs: ${allPages.length}`);
}

generateSitemap().catch(console.error);
