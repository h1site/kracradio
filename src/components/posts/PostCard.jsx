'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../i18n';
import CreatePost from './CreatePost';

export default function PostCard({ post, onUpdate, onDelete }) {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const [showReply, setShowReply] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [isLiked, setIsLiked] = useState(post.user_has_liked || false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [commentsCount, setCommentsCount] = useState(post.comments_count || 0);
  const [isDeleting, setIsDeleting] = useState(false);

  const author = post.author;
  const isOwner = user?.id === post.user_id;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return t.posts?.postCard?.justNow || 'À l\'instant';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}j`;

    return date.toLocaleDateString(lang === 'fr' ? 'fr-CA' : 'en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const handleLike = async () => {
    if (!user) return;

    try {
      if (isLiked) {
        // Unlike
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id);

        setIsLiked(false);
        setLikesCount(prev => prev - 1);
      } else {
        // Like
        await supabase
          .from('post_likes')
          .insert([{ post_id: post.id, user_id: user.id }]);

        setIsLiked(true);
        setLikesCount(prev => prev + 1);
      }
    } catch (error) {
      console.error(t.posts?.postCard?.likeError || 'Erreur like:', error);
    }
  };

  const handleRepost = async () => {
    if (!user) return;

    try {
      // Vérifier si déjà reposté
      const { data: existing } = await supabase
        .from('post_reposts')
        .select('id')
        .eq('post_id', post.id)
        .eq('user_id', user.id)
        .single();

      if (existing) {
        // Unrepost
        await supabase
          .from('post_reposts')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id);
      } else {
        // Repost
        await supabase
          .from('post_reposts')
          .insert([{ post_id: post.id, user_id: user.id }]);
      }

      if (onUpdate) onUpdate();
    } catch (error) {
      console.error(t.posts?.postCard?.repostError || 'Erreur repost:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm(t.posts?.postCard?.deleteConfirm || 'Supprimer ce post ?')) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', post.id);

      if (error) throw error;

      if (onDelete) onDelete(post.id);
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert(t.posts?.postCard?.deleteError || 'Erreur lors de la suppression');
    } finally {
      setIsDeleting(false);
    }
  };

  const loadReplies = async () => {
    if (!showReplies || loadingReplies) return;

    setLoadingReplies(true);
    try {
      const { data: repliesData } = await supabase
        .from('posts')
        .select('*')
        .eq('reply_to_id', post.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: true });

      if (repliesData) {
        // Charger les profils des auteurs
        const userIds = [...new Set(repliesData.map(r => r.user_id))];
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

        const repliesWithAuthors = repliesData.map(reply => ({
          ...reply,
          author: profilesMap[reply.user_id] || null
        }));

        setReplies(repliesWithAuthors);
      }
    } catch (error) {
      console.error('Erreur chargement réponses:', error);
    } finally {
      setLoadingReplies(false);
    }
  };

  useEffect(() => {
    if (showReplies) {
      loadReplies();
    }
  }, [showReplies]);

  const handleReplyCreated = (newReply) => {
    setShowReply(false);
    setCommentsCount(prev => prev + 1);
    loadReplies();
    if (onUpdate) onUpdate();
  };

  const toggleReplies = () => {
    setShowReplies(!showReplies);
  };

  const profileLink = author?.artist_slug
    ? `/profile/${author.artist_slug}`
    : post.user_id ? `/profile/${post.user_id}` : '#';

  return (
    <div className="bg-bg-secondary rounded-xl p-4 border border-border">
      {/* En-tête */}
      <div className="flex items-start gap-3 mb-3">
        {/* Avatar */}
        <Link href={profileLink}>
          {author?.avatar_url ? (
            <img
              src={author.avatar_url}
              alt={author.username}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-semibold">
              {author?.username?.[0]?.toUpperCase() || '?'}
            </div>
          )}
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link
              href={profileLink}
              className="font-semibold text-text-primary hover:text-accent transition-colors"
            >
              {author?.username || 'Utilisateur'}
            </Link>
            {author?.is_verified && (
              <svg className="w-4 h-4 text-accent" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
            <span className="text-text-secondary text-sm">·</span>
            <span className="text-text-secondary text-sm">{formatDate(post.created_at)}</span>
          </div>
        </div>

        {/* Menu actions (supprimer si owner) */}
        {isOwner && (
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-text-secondary hover:text-red-500 transition-colors"
            title="Supprimer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>

      {/* Contenu */}
      <div className="mb-3">
        <p className="text-text-primary whitespace-pre-wrap break-words">{post.content}</p>
      </div>

      {/* Médias */}
      {post.media_urls && post.media_urls.length > 0 && (
        <div className={`mb-3 grid gap-2 ${post.media_urls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {post.media_urls.map((url, index) => (
            <div key={index} className="rounded-lg overflow-hidden">
              {post.media_type === 'image' ? (
                <img
                  src={url}
                  alt=""
                  className="w-full h-auto max-h-96 object-cover cursor-pointer"
                  onClick={() => window.open(url, '_blank')}
                />
              ) : (
                <video src={url} controls className="w-full h-auto max-h-96" />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-6 pt-2">
        {/* Commentaires */}
        <button
          onClick={toggleReplies}
          className="flex items-center gap-2 text-text-secondary hover:text-accent transition-colors group"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {commentsCount > 0 && <span className="text-sm">{commentsCount}</span>}
        </button>

        {/* Like (Cœur) */}
        <button
          onClick={handleLike}
          className={`flex items-center gap-2 transition-colors ${
            isLiked ? 'text-red-500' : 'text-text-secondary hover:text-red-500'
          }`}
        >
          <svg
            className="w-5 h-5"
            fill={isLiked ? 'currentColor' : 'none'}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          {likesCount > 0 && <span className="text-sm">{likesCount}</span>}
        </button>
      </div>

      {/* Affichage des réponses */}
      {showReplies && (
        <div className="mt-4 pt-4 border-t border-border">
          {loadingReplies ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto"></div>
            </div>
          ) : (
            <>
              {/* Bouton pour répondre */}
              {!showReply && (
                <button
                  onClick={() => setShowReply(true)}
                  className="mb-4 text-sm text-accent hover:text-accent-hover transition-colors"
                >
                  💬 {t.posts?.createPost?.reply || 'Répondre'}
                </button>
              )}

              {/* Formulaire de réponse */}
              {showReply && (
                <div className="mb-4">
                  <CreatePost replyTo={post} onPostCreated={handleReplyCreated} />
                  <button
                    onClick={() => setShowReply(false)}
                    className="mt-2 text-sm text-text-secondary hover:text-text-primary"
                  >
                    {t.editor?.cancel || 'Annuler'}
                  </button>
                </div>
              )}

              {/* Liste des réponses */}
              {replies.length > 0 && (
                <div className="space-y-4">
                  {replies.map(reply => {
                    const isReplyOwner = user?.id === reply.user_id;

                    return (
                      <div key={reply.id} className="pl-4 border-l-2 border-border">
                        <div className="flex items-start gap-3">
                          <Link href={reply.author?.artist_slug ? `/profile/${reply.author.artist_slug}` : reply.user_id ? `/profile/${reply.user_id}` : '#'}>
                            {reply.author?.avatar_url ? (
                              <img
                                src={reply.author.avatar_url}
                                alt={reply.author.username}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-semibold text-sm">
                                {reply.author?.username?.[0]?.toUpperCase() || '?'}
                              </div>
                            )}
                          </Link>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Link
                                href={reply.author?.artist_slug ? `/profile/${reply.author.artist_slug}` : reply.user_id ? `/profile/${reply.user_id}` : '#'}
                                className="font-semibold text-text-primary hover:text-accent transition-colors text-sm"
                              >
                                {reply.author?.username || 'Utilisateur'}
                              </Link>
                              {reply.author?.is_verified && (
                                <svg className="w-3 h-3 text-accent" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              )}
                              <span className="text-text-secondary text-xs">·</span>
                              <span className="text-text-secondary text-xs">{formatDate(reply.created_at)}</span>
                            </div>
                            <p className="text-text-primary text-sm mt-1 whitespace-pre-wrap break-words">{reply.content}</p>
                          </div>
                          {/* Bouton supprimer si propriétaire */}
                          {isReplyOwner && (
                            <button
                              onClick={async () => {
                                if (!confirm(t.posts?.postCard?.deleteReplyConfirm || 'Supprimer cette réponse ?')) return;

                                try {
                                  const { error } = await supabase
                                    .from('posts')
                                    .delete()
                                    .eq('id', reply.id);

                                  if (error) throw error;

                                  setReplies(replies.filter(r => r.id !== reply.id));
                                  setCommentsCount(prev => prev - 1);
                                } catch (error) {
                                  console.error('Erreur suppression réponse:', error);
                                  alert(t.posts?.postCard?.deleteError || 'Erreur lors de la suppression');
                                }
                              }}
                              className="text-text-secondary hover:text-red-500 transition-colors"
                              title={t.posts?.postCard?.delete || 'Supprimer'}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
