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

// Helper to generate slug from title
function generateSlug(title) {
  if (!title) return '';
  return title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 100);
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
  let episodePages = [];
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
    // Videos - generate slug from title (slug column may not exist)
    const { data: videos, error: videosError } = await supabase
      .from('videos')
      .select('id, title, youtube_id, updated_at')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (videosError) {
      console.error('Sitemap: Error fetching videos:', videosError);
    } else if (videos && videos.length > 0) {
      console.log(`Sitemap: Found ${videos.length} approved videos`);
      videoPages = videos.map(video => {
        // Generate slug from title (same logic as Videos.jsx)
        const videoSlug = generateSlug(video.title);
        return {
          url: `${baseUrl}/videos/${videoSlug}`,
          lastModified: video.updated_at ? new Date(video.updated_at) : new Date(),
          changeFrequency: 'weekly',
          priority: 0.7,
        };
      });
    } else {
      console.log('Sitemap: No approved videos found');
    }
  } catch (e) {
    console.error('Sitemap: Exception fetching videos', e);
  }

  try {
    // User Podcasts (from user_podcasts table)
    const { data: userPodcasts } = await supabase
      .from('user_podcasts')
      .select('id, title, updated_at')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (userPodcasts) {
      const userPodcastPages = userPodcasts.map(podcast => {
        const podcastSlug = generateSlug(podcast.title);
        return {
          url: `${baseUrl}/podcast/${podcastSlug}`,
          lastModified: podcast.updated_at ? new Date(podcast.updated_at) : new Date(),
          changeFrequency: 'weekly',
          priority: 0.7,
        };
      });
      podcastPages = [...podcastPages, ...userPodcastPages];
    }
  } catch (e) {
    console.error('Sitemap: Error fetching user podcasts', e);
  }

  try {
    // Legacy Podcasts (from podcasts table)
    const { data: podcasts } = await supabase
      .from('podcasts')
      .select('id, title, updated_at')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (podcasts) {
      const legacyPodcastPages = podcasts.map(podcast => ({
        url: `${baseUrl}/podcast/${podcast.id}`,
        lastModified: podcast.updated_at ? new Date(podcast.updated_at) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      }));
      podcastPages = [...podcastPages, ...legacyPodcastPages];
    }
  } catch (e) {
    console.error('Sitemap: Error fetching legacy podcasts', e);
  }

  try {
    // Podcast Episodes - get all episodes
    const { data: episodes, error: episodesError } = await supabase
      .from('podcast_episodes')
      .select('id, title, podcast_id, pub_date, created_at')
      .order('pub_date', { ascending: false });

    if (episodesError) {
      console.error('Sitemap: Error fetching episodes:', episodesError);
    } else if (episodes && episodes.length > 0) {
      console.log(`Sitemap: Found ${episodes.length} podcast episodes`);

      // Get podcast info for slug generation
      const podcastIds = [...new Set(episodes.map(e => e.podcast_id).filter(Boolean))];
      let podcastsMap = {};

      if (podcastIds.length > 0) {
        const { data: podcastsData } = await supabase
          .from('user_podcasts')
          .select('id, title')
          .in('id', podcastIds);

        if (podcastsData) {
          console.log(`Sitemap: Found ${podcastsData.length} podcasts for episodes`);
          podcastsData.forEach(p => {
            podcastsMap[p.id] = generateSlug(p.title);
          });
        }
      }

      episodePages = episodes
        .filter(episode => podcastsMap[episode.podcast_id])
        .map(episode => {
          const podcastSlug = podcastsMap[episode.podcast_id];
          const episodeSlug = generateSlug(episode.title);
          return {
            url: `${baseUrl}/podcast/${podcastSlug}/episode/${episodeSlug}`,
            lastModified: episode.pub_date || episode.created_at
              ? new Date(episode.pub_date || episode.created_at)
              : new Date(),
            changeFrequency: 'monthly',
            priority: 0.6,
          };
        });

      console.log(`Sitemap: Added ${episodePages.length} episode pages`);
    } else {
      console.log('Sitemap: No podcast episodes found');
    }
  } catch (e) {
    console.error('Sitemap: Exception fetching podcast episodes', e);
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
    ...episodePages,
    ...profilePages,
  ];
}
