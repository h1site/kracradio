// src/lib/supabase.js
import { supabase, SUPABASE_FUNCTIONS_URL } from './supabaseClient';
export { supabase, SUPABASE_FUNCTIONS_URL }; // <-- makes { supabase } available from this module

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
  const payload = { ...articleData, slug, user_id: articleData.author_id };

  // Si l'article est publié et n'a pas de published_at, on le définit maintenant
  if (payload.status === 'published' && !payload.published_at) {
    payload.published_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('articles')
    .insert([payload])
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

  // Si l'article passe à "published" et n'a pas de published_at, on le définit maintenant
  if (patch.status === 'published' && !patch.published_at) {
    // Récupérer l'article actuel pour vérifier s'il a déjà une date de publication
    const { data: currentArticle } = await supabase
      .from('articles')
      .select('published_at')
      .eq('id', id)
      .single();

    // Si l'article n'a pas encore de published_at, on la définit
    if (!currentArticle?.published_at) {
      patch.published_at = new Date().toISOString();
    }
  }

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
 * Calculate period start date
 * - week: Sunday to Saturday (current week starting from last Sunday)
 * - month: Current calendar month (1st to today)
 * - year: Current calendar year (Jan 1st to today)
 */
function getChartPeriodStart(period) {
  const now = new Date();

  switch (period) {
    case 'week': {
      // Get last Sunday (start of current week)
      const day = now.getDay(); // 0 = Sunday
      const diff = day; // days since last Sunday
      const sunday = new Date(now);
      sunday.setDate(now.getDate() - diff);
      sunday.setHours(0, 0, 0, 0);
      return sunday;
    }
    case 'month': {
      // First day of current month
      return new Date(now.getFullYear(), now.getMonth(), 1);
    }
    case 'year': {
      // January 1st of current year
      return new Date(now.getFullYear(), 0, 1);
    }
    default:
      return getChartPeriodStart('week');
  }
}

/**
 * Get chart data for a specific channel
 * @param {string} channelKey - The channel to get charts for
 * @param {string} period - 'week', 'month', or 'year'
 * @returns {Promise<Array>} Array of songs with like counts
 */
export async function getChannelCharts(channelKey, period = 'week') {
  const startDate = getChartPeriodStart(period);

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

/**
 * Get global chart data across all channels (for KracRadio cumulative)
 * @param {string} period - 'week', 'month', or 'year'
 * @returns {Promise<Array>} Array of songs with like counts
 */
export async function getGlobalCharts(period = 'week') {
  const startDate = getChartPeriodStart(period);

  const { data, error } = await supabase
    .from('song_likes')
    .select('song_title, song_artist, album_art, channel_name')
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

// ==================== VIDEO FUNCTIONS ====================

/**
 * Extract YouTube video ID from URL
 */
export function extractYouTubeId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/**
 * Get approved videos (random order) with submitter profile info
 */
export async function getApprovedVideos() {
  const { data: videos, error } = await supabase
    .from('videos')
    .select('*')
    .eq('status', 'approved')
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Get unique user_ids to fetch profiles
  const userIds = [...new Set((videos || []).map(v => v.user_id).filter(Boolean))];

  // Fetch profiles for these users
  let profilesMap = {};
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, artist_slug, role')
      .in('id', userIds);

    if (profiles) {
      profiles.forEach(p => {
        profilesMap[p.id] = p;
      });
    }
  }

  // Attach profile info to videos
  const videosWithProfiles = (videos || []).map(video => ({
    ...video,
    submitter: profilesMap[video.user_id] || null
  }));

  // Shuffle for random order
  const shuffled = videosWithProfiles.sort(() => Math.random() - 0.5);
  return shuffled;
}

/**
 * Get video by ID
 */
export async function getVideoById(id) {
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Submit a new video (by artist)
 */
export async function submitVideo({ youtubeUrl, userId }) {
  const youtubeId = extractYouTubeId(youtubeUrl);
  if (!youtubeId) throw new Error('Invalid YouTube URL');

  // Fetch video info from YouTube oEmbed API
  let title = 'Video';
  let artistName = '';
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(youtubeUrl)}&format=json`;
    const response = await fetch(oembedUrl);
    if (response.ok) {
      const oembedData = await response.json();
      title = oembedData.title || 'Video';
      artistName = oembedData.author_name || '';
    }
  } catch (e) {
    console.warn('Could not fetch YouTube info:', e);
  }

  const thumbnailUrl = `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;

  const { data, error } = await supabase
    .from('videos')
    .insert({
      youtube_url: youtubeUrl,
      youtube_id: youtubeId,
      title,
      description: '',
      thumbnail_url: thumbnailUrl,
      artist_name: artistName,
      user_id: userId,
      status: 'pending'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get user's submitted videos
 */
export async function getUserVideos(userId) {
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get all videos for admin
 */
export async function getAllVideosAdmin() {
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Update video status (admin)
 */
export async function updateVideoStatus(videoId, status, adminId) {
  const updateData = {
    status,
    updated_at: new Date().toISOString()
  };

  if (status === 'approved') {
    updateData.approved_at = new Date().toISOString();
    updateData.approved_by = adminId;
  }

  const { data, error } = await supabase
    .from('videos')
    .update(updateData)
    .eq('id', videoId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete video (admin)
 */
export async function deleteVideo(videoId) {
  const { error } = await supabase
    .from('videos')
    .delete()
    .eq('id', videoId);

  if (error) throw error;
}

/**
 * Update video information (title, description)
 */
export async function updateVideo(videoId, updates) {
  const { data, error } = await supabase
    .from('videos')
    .update(updates)
    .eq('id', videoId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Like a video
 */
export async function likeVideo(videoId, userId, sessionId) {
  const { error } = await supabase
    .from('video_likes')
    .insert({
      video_id: videoId,
      user_id: userId || null,
      session_id: userId ? null : sessionId
    });

  if (error && error.code !== '23505') throw error; // Ignore duplicate
  return true;
}

/**
 * Unlike a video
 */
export async function unlikeVideo(videoId, userId, sessionId) {
  let query = supabase.from('video_likes').delete().eq('video_id', videoId);

  if (userId) {
    query = query.eq('user_id', userId);
  } else {
    query = query.eq('session_id', sessionId);
  }

  const { error } = await query;
  if (error) throw error;
  return true;
}

/**
 * Check if user liked a video
 */
export async function hasLikedVideo(videoId, userId, sessionId) {
  let query = supabase
    .from('video_likes')
    .select('id')
    .eq('video_id', videoId);

  if (userId) {
    query = query.eq('user_id', userId);
  } else {
    query = query.eq('session_id', sessionId);
  }

  const { data } = await query.maybeSingle();
  return !!data;
}

/**
 * Get video like count
 */
export async function getVideoLikeCount(videoId) {
  const { count, error } = await supabase
    .from('video_likes')
    .select('*', { count: 'exact', head: true })
    .eq('video_id', videoId);

  if (error) throw error;
  return count || 0;
}

/**
 * Get user's liked videos
 */
export async function getUserLikedVideos(userId, sessionId) {
  if (!userId && !sessionId) return [];

  const query = supabase
    .from('video_likes')
    .select('video_id, created_at')
    .order('created_at', { ascending: false });

  if (userId) {
    query.eq('user_id', userId);
  } else if (sessionId) {
    query.eq('session_id', sessionId);
  }

  const { data: likes, error: likesError } = await query;
  if (likesError) throw likesError;
  if (!likes || likes.length === 0) return [];

  // Get video IDs
  const videoIds = likes.map(like => like.video_id);

  // Fetch full video details
  const { data: videos, error: videosError } = await supabase
    .from('videos')
    .select('*')
    .in('id', videoIds)
    .eq('status', 'approved');

  if (videosError) throw videosError;

  // Get unique user_ids to fetch profiles
  const userIds = [...new Set((videos || []).map(v => v.user_id).filter(Boolean))];

  // Fetch profiles for these users
  let profilesMap = {};
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, artist_slug, role')
      .in('id', userIds);

    if (profiles) {
      profiles.forEach(p => {
        profilesMap[p.id] = p;
      });
    }
  }

  // Create a map of liked_at times
  const likedAtMap = {};
  likes.forEach(like => {
    likedAtMap[like.video_id] = like.created_at;
  });

  // Attach profile info and sort by liked date
  const videosWithProfiles = (videos || [])
    .map(video => ({
      ...video,
      submitter: profilesMap[video.user_id] || null,
      liked_at: likedAtMap[video.id]
    }))
    .sort((a, b) => new Date(b.liked_at) - new Date(a.liked_at));

  return videosWithProfiles;
}

/**
 * Get video comments
 */
export async function getVideoComments(videoId) {
  const { data, error } = await supabase
    .from('video_comments')
    .select('*')
    .eq('video_id', videoId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Add video comment
 */
export async function addVideoComment(videoId, userId, username, avatarUrl, content) {
  const { data, error } = await supabase
    .from('video_comments')
    .insert({
      video_id: videoId,
      user_id: userId,
      username,
      avatar_url: avatarUrl,
      content
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete video comment
 */
export async function deleteVideoComment(commentId) {
  const { error } = await supabase
    .from('video_comments')
    .delete()
    .eq('id', commentId);

  if (error) throw error;
}

/**
 * Get video charts (most liked videos)
 */
export async function getVideoCharts(period = 'week') {
  const startDate = getChartPeriodStart(period);

  const { data, error } = await supabase
    .from('video_likes')
    .select('video_id, videos(id, title, youtube_id, thumbnail_url, artist_name)')
    .gte('created_at', startDate.toISOString());

  if (error) throw error;

  // Group by video and count likes
  const videoMap = {};
  (data || []).forEach(like => {
    if (!like.videos) return;
    const key = like.video_id;
    if (!videoMap[key]) {
      videoMap[key] = {
        id: like.videos.id,
        title: like.videos.title,
        youtubeId: like.videos.youtube_id,
        thumbnailUrl: like.videos.thumbnail_url,
        artistName: like.videos.artist_name,
        likeCount: 0
      };
    }
    videoMap[key].likeCount++;
  });

  return Object.values(videoMap)
    .sort((a, b) => b.likeCount - a.likeCount)
    .slice(0, 50);
}

// ---- Music Submissions ----

/**
 * Get user's music submissions
 */
export async function getUserMusicSubmissions(userId) {
  const { data, error } = await supabase
    .from('music_submissions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get all music submissions (admin only)
 */
export async function getAllMusicSubmissions() {
  const { data, error } = await supabase
    .from('music_submissions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Update music submission
 */
export async function updateMusicSubmission(id, updates) {
  const { data, error } = await supabase
    .from('music_submissions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete music submission (users can only delete pending)
 */
export async function deleteMusicSubmission(id) {
  const { error } = await supabase
    .from('music_submissions')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

/**
 * Admin: Update submission status
 */
export async function updateSubmissionStatus(id, status, adminNotes = null, reviewedBy = null) {
  const updates = {
    status,
    reviewed_at: new Date().toISOString()
  };

  if (adminNotes) updates.admin_notes = adminNotes;
  if (reviewedBy) updates.reviewed_by = reviewedBy;

  const { data, error } = await supabase
    .from('music_submissions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// =============================================
// USER PLAYLISTS (Songs & Videos)
// =============================================

// ---- SONG PLAYLISTS ----

/**
 * Get all song playlists for a user (with items)
 */
export async function getUserSongPlaylists(userId) {
  const { data, error } = await supabase
    .from('song_playlists')
    .select(`
      *,
      items:song_playlist_items(*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Transform to match our context format
  return (data || []).map(pl => ({
    id: pl.id,
    name: pl.name,
    songs: (pl.items || []).map(item => ({
      id: item.id,
      song_title: item.song_title,
      song_artist: item.song_artist,
      channel_key: item.channel_key,
      channel_name: item.channel_name,
      album_art: item.album_art,
      addedAt: item.added_at
    })),
    createdAt: pl.created_at,
    updatedAt: pl.updated_at
  }));
}

/**
 * Create a new song playlist
 */
export async function createSongPlaylist(userId, name) {
  const { data, error } = await supabase
    .from('song_playlists')
    .insert({ user_id: userId, name })
    .select()
    .single();

  if (error) throw error;
  return {
    id: data.id,
    name: data.name,
    songs: [],
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
}

/**
 * Rename a song playlist
 */
export async function renameSongPlaylist(playlistId, newName) {
  const { error } = await supabase
    .from('song_playlists')
    .update({ name: newName })
    .eq('id', playlistId);

  if (error) throw error;
}

/**
 * Delete a song playlist
 */
export async function deleteSongPlaylist(playlistId) {
  const { error } = await supabase
    .from('song_playlists')
    .delete()
    .eq('id', playlistId);

  if (error) throw error;
}

/**
 * Add a song to a playlist
 */
export async function addSongToPlaylist(playlistId, song) {
  const { data, error } = await supabase
    .from('song_playlist_items')
    .insert({
      playlist_id: playlistId,
      song_title: song.song_title,
      song_artist: song.song_artist,
      channel_key: song.channel_key,
      channel_name: song.channel_name,
      album_art: song.album_art
    })
    .select()
    .single();

  if (error) {
    // Ignore duplicate errors
    if (error.code === '23505') return null;
    throw error;
  }
  return data;
}

/**
 * Remove a song from a playlist
 */
export async function removeSongFromPlaylist(playlistId, song) {
  const { error } = await supabase
    .from('song_playlist_items')
    .delete()
    .eq('playlist_id', playlistId)
    .eq('song_title', song.song_title)
    .eq('song_artist', song.song_artist)
    .eq('channel_key', song.channel_key);

  if (error) throw error;
}

// ---- VIDEO PLAYLISTS ----

/**
 * Get all video playlists for a user (with items)
 */
export async function getUserVideoPlaylists(userId) {
  const { data, error } = await supabase
    .from('video_playlists')
    .select(`
      *,
      items:video_playlist_items(*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Transform to match our context format
  return (data || []).map(pl => ({
    id: pl.id,
    name: pl.name,
    videos: (pl.items || []).map(item => ({
      id: item.id,
      video_id: item.video_id,
      youtube_id: item.youtube_id,
      title: item.title,
      thumbnail_url: item.thumbnail_url,
      artist_name: item.artist_name,
      addedAt: item.added_at
    })),
    createdAt: pl.created_at,
    updatedAt: pl.updated_at
  }));
}

/**
 * Create a new video playlist
 */
export async function createVideoPlaylist(userId, name) {
  const { data, error } = await supabase
    .from('video_playlists')
    .insert({ user_id: userId, name })
    .select()
    .single();

  if (error) throw error;
  return {
    id: data.id,
    name: data.name,
    videos: [],
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
}

/**
 * Rename a video playlist
 */
export async function renameVideoPlaylist(playlistId, newName) {
  const { error } = await supabase
    .from('video_playlists')
    .update({ name: newName })
    .eq('id', playlistId);

  if (error) throw error;
}

/**
 * Delete a video playlist
 */
export async function deleteVideoPlaylist(playlistId) {
  const { error } = await supabase
    .from('video_playlists')
    .delete()
    .eq('id', playlistId);

  if (error) throw error;
}

/**
 * Add a video to a playlist
 */
export async function addVideoToPlaylist(playlistId, video) {
  const { data, error } = await supabase
    .from('video_playlist_items')
    .insert({
      playlist_id: playlistId,
      video_id: video.id || null,
      youtube_id: video.youtube_id,
      title: video.title,
      thumbnail_url: video.thumbnail_url,
      artist_name: video.artist_name
    })
    .select()
    .single();

  if (error) {
    // Ignore duplicate errors
    if (error.code === '23505') return null;
    throw error;
  }
  return data;
}

/**
 * Remove a video from a playlist
 */
export async function removeVideoFromPlaylist(playlistId, video) {
  const { error } = await supabase
    .from('video_playlist_items')
    .delete()
    .eq('playlist_id', playlistId)
    .eq('youtube_id', video.youtube_id);

  if (error) throw error;
}
