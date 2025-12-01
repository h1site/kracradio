'use client';
// Hooks pour les fonctionnalités communautaires

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// ============================================================================
// PROFILE HOOKS
// ============================================================================

/**
 * Récupère tous les profils publics
 */
export function usePublicProfiles() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchPublicProfiles() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('is_public', true)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setProfiles(data || []);
        setError(null);
      } catch (err) {
        console.error('usePublicProfiles error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchPublicProfiles();
  }, []);

  return { profiles, loading, error };
}

/**
 * Résout un username (slug ou UUID) vers un user_id
 * Vérifie d'abord si c'est un UUID, sinon cherche par artist_slug
 */
export function useResolveUsername(username) {
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!username) {
      setLoading(false);
      return;
    }

    async function resolve() {
      try {
        setLoading(true);

        // Pattern UUID: 8-4-4-4-12 caractères hexadécimaux
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(username);

        if (isUUID) {
          // C'est déjà un UUID
          setUserId(username);
        } else {
          // C'est un artist_slug, on cherche le user_id
          const { data, error } = await supabase
            .rpc('get_user_id_from_slug', { slug: username });

          if (error) throw error;
          setUserId(data);
        }

        setError(null);
      } catch (err) {
        console.error('useResolveUsername error:', err);
        setError(err.message);
        setUserId(null);
      } finally {
        setLoading(false);
      }
    }

    resolve();
  }, [username]);

  return { userId, loading, error };
}

/**
 * Récupère un profil utilisateur
 */
export function useProfile(userId) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    async function fetchProfile() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle(); // Utilise maybeSingle au lieu de single

        if (error) {
          console.error('Profile fetch error:', error);
          throw error;
        }

        setProfile(data);
        setError(null);
      } catch (err) {
        console.error('useProfile error:', err);
        setError(err.message);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [userId]);

  const refetch = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      setProfile(data);
      setError(null);
    } catch (err) {
      console.error('Refetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  return { profile, loading, error, refetch };
}

/**
 * Met à jour le profil utilisateur
 */
export function useUpdateProfile() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const updateProfile = useCallback(async (userId, updates) => {
    try {
      setLoading(true);
      setError(null);

      console.log('[useUpdateProfile] Updating profile:', userId, updates);

      // First check if profile exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      console.log('[useUpdateProfile] Existing profile check:', existingProfile, 'error:', checkError);

      if (!existingProfile) {
        console.log('[useUpdateProfile] Profile does not exist, creating...');
        // Profile doesn't exist, create it
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({ id: userId, ...updates });

        if (insertError) {
          console.error('[useUpdateProfile] Insert error:', insertError);
          throw insertError;
        }
        console.log('[useUpdateProfile] Profile created successfully');
        return { success: true };
      }

      // Profile exists, update it
      const { error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

      console.log('[useUpdateProfile] Update result - error:', updateError);

      if (updateError) {
        console.error('[useUpdateProfile] Update profile error:', updateError);
        throw updateError;
      }

      // Verify the update worked
      const { data: verifyData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      console.log('[useUpdateProfile] Verification - saved data:', verifyData);

      console.log('[useUpdateProfile] Success');
      return { success: true };
    } catch (err) {
      console.error('[useUpdateProfile] Error:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { updateProfile, loading, error };
}

// ============================================================================
// MUSIC LINKS HOOKS
// ============================================================================

/**
 * Récupère les liens musicaux d'un utilisateur
 */
export function useMusicLinks(userId) {
  const [musicLinks, setMusicLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMusicLinks = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('music_links')
        .select('*')
        .eq('user_id', userId)
        .order('display_order');

      if (error) throw error;
      setMusicLinks(data || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchMusicLinks();
  }, [fetchMusicLinks]);

  return { musicLinks, loading, error, refetch: fetchMusicLinks };
}

/**
 * Gère les liens musicaux (ajouter, supprimer)
 */
export function useManageMusicLinks() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const addMusicLink = useCallback(async (userId, platform, url) => {
    try {
      setLoading(true);
      setError(null);

      // Détecter la plateforme et générer l'embed
      const embedHtml = generateEmbed(platform, url);

      const { data, error: insertError } = await supabase
        .from('music_links')
        .insert([{ user_id: userId, platform, url, embed_html: embedHtml }])
        .select()
        .single();

      if (insertError) throw insertError;
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const removeMusicLink = useCallback(async (linkId) => {
    try {
      setLoading(true);
      setError(null);

      const { error: deleteError } = await supabase
        .from('music_links')
        .delete()
        .eq('id', linkId);

      if (deleteError) throw deleteError;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { addMusicLink, removeMusicLink, loading, error };
}

// Helper pour générer les embeds
function generateEmbed(platform, url) {
  switch (platform) {
    case 'spotify':
      // Convertir l'URL Spotify en embed
      const spotifyId = extractSpotifyId(url);
      if (spotifyId) {
        return `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/${spotifyId}" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`;
      }
      break;
    case 'bandcamp':
      // Bandcamp nécessite l'URL d'embed spécifique
      return `<iframe style="border: 0; width: 100%; height: 120px;" src="${url}" seamless></iframe>`;
    case 'apple_music':
      // Apple Music embed
      return `<iframe allow="autoplay *; encrypted-media *;" frameborder="0" height="450" style="width:100%;max-width:660px;overflow:hidden;background:transparent;" sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation" src="${url}"></iframe>`;
    case 'soundcloud':
      // SoundCloud embed
      return `<iframe width="100%" height="166" scrolling="no" frameborder="no" allow="autoplay" src="https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true"></iframe>`;
    default:
      return null;
  }
}

function extractSpotifyId(url) {
  // Exemple: https://open.spotify.com/track/xyz ou album/xyz
  const match = url.match(/spotify\.com\/(track|album|playlist|artist)\/([a-zA-Z0-9]+)/);
  return match ? `${match[1]}/${match[2]}` : null;
}

// ============================================================================
// FOLLOW HOOKS
// ============================================================================

/**
 * Vérifie le statut de follow entre l'utilisateur actuel et un autre
 */
export function useFollowStatus(targetUserId) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!targetUserId) {
      setLoading(false);
      return;
    }

    async function fetchFollowStatus() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.rpc('get_follow_status', {
          current_user_id: user.id,
          target_user_id: targetUserId
        });

        if (error) throw error;
        setStatus(data);
      } catch (err) {
        console.error('Error fetching follow status:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchFollowStatus();
  }, [targetUserId]);

  return { status, loading };
}

/**
 * Gère le follow/unfollow
 */
export function useManageFollow() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const follow = useCallback(async (targetUserId) => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error: followError } = await supabase
        .from('follows')
        .insert([{ follower_id: user.id, following_id: targetUserId }]);

      if (followError) throw followError;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const unfollow = useCallback(async (targetUserId) => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error: unfollowError } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId);

      if (unfollowError) throw unfollowError;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { follow, unfollow, loading, error };
}

/**
 * Récupère les statistiques de follow d'un utilisateur
 */
export function useFollowStats(userId) {
  const [stats, setStats] = useState({ followers: 0, following: 0, connections: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    async function fetchStats() {
      try {
        setLoading(true);

        const [followersRes, followingRes, connectionsRes] = await Promise.all([
          supabase.rpc('count_followers', { user_id: userId }),
          supabase.rpc('count_following', { user_id: userId }),
          supabase.rpc('count_connections', { user_id: userId })
        ]);

        setStats({
          followers: followersRes.data || 0,
          following: followingRes.data || 0,
          connections: connectionsRes.data || 0
        });
      } catch (err) {
        console.error('Error fetching follow stats:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [userId]);

  return { stats, loading };
}

// ============================================================================
// POSTS HOOKS
// ============================================================================

/**
 * Récupère le feed personnalisé
 */
export function useFeed(limit = 20, offset = 0) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  const fetchFeed = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.rpc('get_user_feed', {
        user_id_param: user.id,
        limit_param: limit,
        offset_param: offset
      });

      if (error) throw error;

      if (offset === 0) {
        setPosts(data || []);
      } else {
        setPosts(prev => [...prev, ...(data || [])]);
      }

      setHasMore(data && data.length === limit);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [limit, offset]);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  return { posts, loading, error, hasMore, refetch: fetchFeed };
}

/**
 * Crée un nouveau post
 */
export function useCreatePost() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createPost = useCallback(async (postData) => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error: insertError } = await supabase
        .from('posts')
        .insert([{ ...postData, user_id: user.id }])
        .select()
        .single();

      if (insertError) throw insertError;

      // Si des mentions, les ajouter
      if (postData.mentioned_users && postData.mentioned_users.length > 0) {
        const mentions = postData.mentioned_users.map(userId => ({
          post_id: data.id,
          mentioned_user_id: userId
        }));

        await supabase.from('post_mentions').insert(mentions);
      }

      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { createPost, loading, error };
}

/**
 * Gère les réactions aux posts
 */
export function useManageReaction() {
  const [loading, setLoading] = useState(false);

  const toggleReaction = useCallback(async (postId, reactionType) => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Vérifier si déjà réagi
      const { data: existing } = await supabase
        .from('post_reactions')
        .select('id, reaction_type')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single();

      if (existing) {
        if (existing.reaction_type === reactionType) {
          // Retirer la réaction
          await supabase
            .from('post_reactions')
            .delete()
            .eq('id', existing.id);
        } else {
          // Changer le type de réaction
          await supabase
            .from('post_reactions')
            .update({ reaction_type: reactionType })
            .eq('id', existing.id);
        }
      } else {
        // Ajouter nouvelle réaction
        await supabase
          .from('post_reactions')
          .insert([{ post_id: postId, user_id: user.id, reaction_type: reactionType }]);
      }
    } catch (err) {
      console.error('Error toggling reaction:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { toggleReaction, loading };
}

// ============================================================================
// NOTIFICATIONS HOOKS
// ============================================================================

/**
 * Récupère les notifications
 */
export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('notifications')
          .select(`
            *,
            actor:actor_id (id, username, avatar_url, is_verified)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;

        setNotifications(data || []);
        setUnreadCount(data?.filter(n => !n.read).length || 0);

        // S'abonner aux nouvelles notifications en temps réel
        const subscription = supabase
          .channel('notifications')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${user.id}`
            },
            (payload) => {
              setNotifications(prev => [payload.new, ...prev]);
              setUnreadCount(prev => prev + 1);
            }
          )
          .subscribe();

        return () => {
          subscription.unsubscribe();
        };
      } catch (err) {
        console.error('Error fetching notifications:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchNotifications();
  }, []);

  const markAsRead = useCallback(async (notificationId) => {
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  }, []);

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead };
}
