// src/lib/supabase.js
import { supabase } from './supabaseClient';
export { supabase }; // <-- makes { supabase } available from this module

// Small, safe slugify
export function slugify(input = '') {
  return String(input)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 120);
}

// ---- Articles helpers ----

export async function listPublishedArticles() {
  const { data, error } = await supabase
    .from('articles')
    .select('id, slug, title, content, status, created_at, updated_at, user_id')
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function listUserArticles(userId) {
  const { data, error } = await supabase
    .from('articles')
    .select('id, slug, title, content, status, created_at, updated_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function fetchArticleBySlug(slug) {
  const { data, error } = await supabase
    .from('articles')
    .select('id, slug, title, content, status, created_at, updated_at, user_id')
    .eq('slug', slug)
    .single();

  if (error) throw error;
  return data || null;
}

export async function fetchArticleById(id) {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('id', id)
    .single();

  console.log('fetchArticleById - id:', id, 'data:', data, 'error:', error);
  if (error) throw error;
  return data || null;
}

export async function createArticle(articleData) {
  const slug = articleData.custom_slug || slugify(articleData.title);
  const { data, error } = await supabase
    .from('articles')
    .insert([{ ...articleData, slug, user_id: articleData.author_id }])
    .select()
    .single();

  if (error) return { data: null, error };
  return { data, error: null };
}

export async function updateArticleById(id, articleData) {
  const slug = articleData.custom_slug || (articleData.title ? slugify(articleData.title) : undefined);
  const patch = { ...articleData };
  if (slug) patch.slug = slug;
  delete patch.author_id; // Ne pas modifier author_id lors de l'update

  const { data, error } = await supabase
    .from('articles')
    .update(patch)
    .eq('id', id)
    .select()
    .single();

  if (error) return { data: null, error };
  return { data, error: null };
}

export async function deleteArticleById(id) {
  const { data, error } = await supabase
    .from('articles')
    .delete()
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ---- Song Likes helpers ----

/**
 * Add a like for a song
 * @param {Object} songData - { channelKey, channelName, title, artist, albumArt }
 * @returns {Promise<Object>} The created like record
 */
export async function addSongLike(songData) {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User must be authenticated to like songs');
  }

  const { data, error } = await supabase
    .from('song_likes')
    .insert([{
      user_id: user.id,
      channel_key: songData.channelKey,
      channel_name: songData.channelName,
      song_title: songData.title,
      song_artist: songData.artist,
      album_art: songData.albumArt
    }])
    .select()
    .single();

  if (error) {
    // If it's a duplicate, that's okay (already liked)
    if (error.code === '23505') {
      return { data: null, error: null, alreadyLiked: true };
    }
    throw error;
  }

  return { data, error: null };
}

/**
 * Remove a like for a song
 * @param {Object} songData - { channelKey, title, artist }
 * @returns {Promise<void>}
 */
export async function removeSongLike(songData) {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User must be authenticated to unlike songs');
  }

  const { error } = await supabase
    .from('song_likes')
    .delete()
    .eq('user_id', user.id)
    .eq('channel_key', songData.channelKey)
    .eq('song_title', songData.title)
    .eq('song_artist', songData.artist);

  if (error) throw error;
}

/**
 * Check if user has liked a specific song
 * @param {Object} songData - { channelKey, title, artist }
 * @returns {Promise<boolean>}
 */
export async function isSongLiked(songData) {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return false;

  const { data, error } = await supabase
    .from('song_likes')
    .select('id')
    .eq('user_id', user.id)
    .eq('channel_key', songData.channelKey)
    .eq('song_title', songData.title)
    .eq('song_artist', songData.artist)
    .maybeSingle();

  if (error) {
    console.error('Error checking if song is liked:', error);
    return false;
  }

  return !!data;
}

/**
 * Get all likes for the current user
 * @returns {Promise<Array>} Array of liked songs
 */
export async function getUserLikedSongs() {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User must be authenticated');
  }

  const { data, error } = await supabase
    .from('song_likes')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get chart data for a specific channel
 * @param {string} channelKey - The channel to get charts for
 * @param {string} period - 'week', 'month', or 'year'
 * @returns {Promise<Array>} Array of songs with like counts
 */
export async function getChannelCharts(channelKey, period = 'week') {
  // Calculate the start date based on period
  const now = new Date();
  let startDate;

  switch (period) {
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'year':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }

  const { data, error } = await supabase
    .from('song_likes')
    .select('song_title, song_artist, album_art, channel_name')
    .eq('channel_key', channelKey)
    .gte('created_at', startDate.toISOString());

  if (error) throw error;

  // Group by song and count likes
  const songMap = {};
  (data || []).forEach(like => {
    const key = `${like.song_title}|||${like.song_artist}`;
    if (!songMap[key]) {
      songMap[key] = {
        title: like.song_title,
        artist: like.song_artist,
        albumArt: like.album_art,
        channelName: like.channel_name,
        likeCount: 0
      };
    }
    songMap[key].likeCount++;
  });

  // Convert to array and sort by like count
  return Object.values(songMap)
    .sort((a, b) => b.likeCount - a.likeCount)
    .slice(0, 50); // Top 50 songs
}
