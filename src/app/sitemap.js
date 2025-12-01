import { createClient } from '@supabase/supabase-js';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kracradio.com';

// Helper to create supabase client only when needed
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

export default async function sitemap() {
  const supabase = getSupabaseClient();
  // Static pages
  const staticPages = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/articles`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/artists`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/videos`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/podcasts`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/charts`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/feed`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.8 },
    { url: `${baseUrl}/schedule`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/spotify`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/donation`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/submit-music`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/login`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/register`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ];

  // Channel pages
  const channels = ['kracradio', 'ebm_industrial', 'electro', 'francophonie', 'jazz', 'metal', 'rock'];
  const channelPages = channels.map(channel => ({
    url: `${baseUrl}/channel/${channel}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  // Fetch dynamic content from database
  let articlePages = [];
  let videoPages = [];
  let podcastPages = [];
  let profilePages = [];

  // Only fetch dynamic content if supabase is available
  if (!supabase) {
    return [...staticPages, ...channelPages];
  }

  try {
    // Articles
    const { data: articles } = await supabase
      .from('articles')
      .select('slug, updated_at')
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (articles) {
      articlePages = articles.map(article => ({
        url: `${baseUrl}/article/${article.slug}`,
        lastModified: article.updated_at ? new Date(article.updated_at) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      }));
    }
  } catch (e) {
    console.error('Sitemap: Error fetching articles', e);
  }

  try {
    // Videos
    const { data: videos } = await supabase
      .from('videos')
      .select('slug, updated_at')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (videos) {
      videoPages = videos.map(video => ({
        url: `${baseUrl}/videos/${video.slug}`,
        lastModified: video.updated_at ? new Date(video.updated_at) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      }));
    }
  } catch (e) {
    console.error('Sitemap: Error fetching videos', e);
  }

  try {
    // Podcasts
    const { data: podcasts } = await supabase
      .from('podcasts')
      .select('id, updated_at')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (podcasts) {
      podcastPages = podcasts.map(podcast => ({
        url: `${baseUrl}/podcast/${podcast.id}`,
        lastModified: podcast.updated_at ? new Date(podcast.updated_at) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      }));
    }
  } catch (e) {
    console.error('Sitemap: Error fetching podcasts', e);
  }

  try {
    // Profiles (artists/members)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('artist_slug, updated_at')
      .eq('is_public', true)
      .not('artist_slug', 'is', null)
      .order('created_at', { ascending: false });

    if (profiles) {
      profilePages = profiles.map(profile => ({
        url: `${baseUrl}/profile/${profile.artist_slug}`,
        lastModified: profile.updated_at ? new Date(profile.updated_at) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.6,
      }));
    }
  } catch (e) {
    console.error('Sitemap: Error fetching profiles', e);
  }

  return [
    ...staticPages,
    ...channelPages,
    ...articlePages,
    ...videoPages,
    ...podcastPages,
    ...profilePages,
  ];
}
