// supabase/functions/sitemap/index.ts
// Dynamic sitemap generator for KracRadio

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const SITE_URL = 'https://kracradio.com'

// Static pages with their priority and change frequency
// Note: Login/register/admin/dashboard pages are excluded (blocked in robots.txt)
const STATIC_PAGES = [
  { path: '/', priority: 1.0, changefreq: 'daily' },
  { path: '/articles', priority: 0.9, changefreq: 'daily' },
  { path: '/artists', priority: 0.9, changefreq: 'daily' },
  { path: '/podcasts', priority: 0.8, changefreq: 'daily' },
  { path: '/charts', priority: 0.8, changefreq: 'daily' },
  { path: '/schedule', priority: 0.7, changefreq: 'weekly' },
  { path: '/spotify', priority: 0.6, changefreq: 'weekly' },
  { path: '/about', priority: 0.5, changefreq: 'monthly' },
  { path: '/contact', priority: 0.5, changefreq: 'monthly' },
  { path: '/privacy', priority: 0.3, changefreq: 'yearly' },
  { path: '/submit-music', priority: 0.6, changefreq: 'monthly' },
]

// Radio channels
const CHANNELS = [
  'chill',
  'hits',
  'oldies',
  'hiphop',
  'country',
  'rock',
  'latino',
  'lofi',
]

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function formatDate(date: string | Date): string {
  const d = new Date(date)
  return d.toISOString().split('T')[0]
}

function buildUrlEntry(
  loc: string,
  lastmod?: string,
  changefreq?: string,
  priority?: number
): string {
  let entry = `  <url>\n    <loc>${escapeXml(loc)}</loc>\n`
  if (lastmod) {
    entry += `    <lastmod>${formatDate(lastmod)}</lastmod>\n`
  }
  if (changefreq) {
    entry += `    <changefreq>${changefreq}</changefreq>\n`
  }
  if (priority !== undefined) {
    entry += `    <priority>${priority.toFixed(1)}</priority>\n`
  }
  entry += `  </url>\n`
  return entry
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const today = new Date().toISOString()
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`

    // 1. Static pages
    for (const page of STATIC_PAGES) {
      xml += buildUrlEntry(
        `${SITE_URL}${page.path}`,
        today,
        page.changefreq,
        page.priority
      )
    }

    // 2. Radio channels
    for (const channel of CHANNELS) {
      xml += buildUrlEntry(
        `${SITE_URL}/channel/${channel}`,
        today,
        'daily',
        0.8
      )
    }

    // 3. Published articles
    const { data: articles, error: articlesError } = await supabase
      .from('articles')
      .select('slug, updated_at, published_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(1000)

    if (!articlesError && articles) {
      for (const article of articles) {
        xml += buildUrlEntry(
          `${SITE_URL}/article/${escapeXml(article.slug)}`,
          article.updated_at || article.published_at,
          'weekly',
          0.7
        )
      }
    }

    // 4. Public artist profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('artist_slug, id, updated_at')
      .eq('is_public', true)
      .not('artist_slug', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(2000)

    if (!profilesError && profiles) {
      for (const profile of profiles) {
        const slug = profile.artist_slug || profile.id
        xml += buildUrlEntry(
          `${SITE_URL}/profile/${escapeXml(slug)}`,
          profile.updated_at,
          'weekly',
          0.6
        )
      }
    }

    // 5. Active podcasts
    const { data: podcasts, error: podcastsError } = await supabase
      .from('user_podcasts')
      .select('id, updated_at')
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(500)

    if (!podcastsError && podcasts) {
      for (const podcast of podcasts) {
        xml += buildUrlEntry(
          `${SITE_URL}/podcast/${podcast.id}`,
          podcast.updated_at,
          'weekly',
          0.6
        )
      }
    }

    // 6. Charts pages for each channel
    for (const channel of CHANNELS) {
      xml += buildUrlEntry(
        `${SITE_URL}/charts/${channel}`,
        today,
        'daily',
        0.7
      )
    }

    xml += `</urlset>`

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    console.error('Sitemap generation error:', error)
    return new Response('Error generating sitemap', { status: 500 })
  }
})
