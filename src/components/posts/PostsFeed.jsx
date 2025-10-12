import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../i18n';
import PostCard from './PostCard';
import CreatePost from './CreatePost';

export default function PostsFeed({ userId = null, showCreatePost = true }) {
  const { user } = useAuth();
  const { t } = useI18n();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('posts')
        .select('*')
        .is('deleted_at', null)
        .is('reply_to_id', null)
        .order('created_at', { ascending: false })
        .limit(50);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data: postsData, error } = await query;

      if (error) throw error;

      if (!postsData || postsData.length === 0) {
        setPosts([]);
        return;
      }

      // Charger les profils des auteurs
      const userIds = [...new Set(postsData.map(p => p.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, artist_slug, avatar_url, is_verified')
        .in('id', userIds);

      const profilesMap = {};
      if (profiles) {
        profiles.forEach(p => {
          profilesMap[p.id] = p;
        });
      }

      // Vérifier les likes si connecté
      let postsWithData = postsData.map(post => ({
        ...post,
        author: profilesMap[post.user_id] || null
      }));

      if (user) {
        const postsWithLikes = await Promise.all(
          postsWithData.map(async (post) => {
            const { data: likeData } = await supabase
              .from('post_likes')
              .select('id')
              .eq('post_id', post.id)
              .eq('user_id', user.id)
              .single();

            return {
              ...post,
              user_has_liked: !!likeData
            };
          })
        );

        setPosts(postsWithLikes);
      } else {
        setPosts(postsWithData);
      }
    } catch (err) {
      console.error(t.posts?.feed?.loadingError || 'Erreur lors du chargement des posts:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId, user, t]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handlePostCreated = (newPost) => {
    setPosts([newPost, ...posts]);
  };

  const handlePostDeleted = (postId) => {
    setPosts(posts.filter(p => p.id !== postId));
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-500">
        <p>{t.posts?.feed?.loadingError || 'Erreur'}: {error}</p>
        <button
          onClick={loadPosts}
          className="mt-4 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors"
        >
          {t.posts?.feed?.retry || 'Réessayer'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Formulaire de création de post */}
      {showCreatePost && user && (
        <CreatePost onPostCreated={handlePostCreated} />
      )}

      {/* Liste des posts */}
      {posts.length === 0 ? (
        <div className="text-center py-12 text-text-secondary">
          <div className="text-6xl mb-4">📝</div>
          <p>{t.posts?.feed?.noPosts || 'Aucun post pour le moment'}</p>
          {showCreatePost && user && (
            <p className="text-sm mt-2">{t.posts?.feed?.startConversation || 'Soyez le premier à publier !'}</p>
          )}
        </div>
      ) : (
        posts.map(post => (
          <PostCard
            key={post.id}
            post={post}
            onUpdate={loadPosts}
            onDelete={handlePostDeleted}
          />
        ))
      )}
    </div>
  );
}
