'use client';
// src/pages/Feed.jsx
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useUI } from '../context/UIContext';
import { useI18n } from '../i18n';
import { useProfile } from '../hooks/useCommunity';
import CreatePost from '../components/posts/CreatePost';
import Seo from '../seo/Seo';
import { InFeedAd } from '../components/ads';

function FeedPostCard({ post, onUpdate, onDelete, currentUser }) {
  const { t, lang } = useI18n();
  const { isDark } = useTheme();
  const router = useRouter();
  const [replies, setReplies] = useState([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isLiked, setIsLiked] = useState(post.user_has_liked || false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [commentsCount, setCommentsCount] = useState(post.comments_count || 0);
  const [isDeleting, setIsDeleting] = useState(false);

  const author = post.author;
  const isOwner = currentUser?.id === post.user_id;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return t.posts?.postCard?.justNow || 'now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;

    return date.toLocaleDateString(lang === 'fr' ? 'fr-CA' : lang === 'es' ? 'es-ES' : 'en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  // Load replies automatically
  useEffect(() => {
    const loadReplies = async () => {
      setLoadingReplies(true);
      try {
        const { data: repliesData } = await supabase
          .from('posts')
          .select('*')
          .eq('reply_to_id', post.id)
          .is('deleted_at', null)
          .order('created_at', { ascending: true });

        if (repliesData && repliesData.length > 0) {
          const userIds = [...new Set(repliesData.map(r => r.user_id))];
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, username, artist_slug, avatar_url, is_verified')
            .in('id', userIds);

          const profilesMap = {};
          if (profiles) {
            profiles.forEach(p => { profilesMap[p.id] = p; });
          }

          const repliesWithAuthors = repliesData.map(reply => ({
            ...reply,
            author: profilesMap[reply.user_id] || null
          }));

          setReplies(repliesWithAuthors);
          setCommentsCount(repliesData.length);
        }
      } catch (error) {
        console.error('Error loading replies:', error);
      } finally {
        setLoadingReplies(false);
      }
    };

    loadReplies();
  }, [post.id]);

  const handleLike = async () => {
    if (!currentUser) {
      router.push('/login');
      return;
    }

    try {
      if (isLiked) {
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', currentUser.id);
        setIsLiked(false);
        setLikesCount(prev => prev - 1);
      } else {
        await supabase
          .from('post_likes')
          .insert([{ post_id: post.id, user_id: currentUser.id }]);
        setIsLiked(true);
        setLikesCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Like error:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm(t.posts?.postCard?.deleteConfirm || 'Delete this post?')) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', post.id);

      if (error) throw error;
      if (onDelete) onDelete(post.id);
    } catch (error) {
      console.error('Delete error:', error);
      alert(t.posts?.postCard?.deleteError || 'Error deleting post');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReplyCreated = async (newReply) => {
    setShowReplyForm(false);
    // Reload replies
    const { data: repliesData } = await supabase
      .from('posts')
      .select('*')
      .eq('reply_to_id', post.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: true });

    if (repliesData) {
      const userIds = [...new Set(repliesData.map(r => r.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, artist_slug, avatar_url, is_verified')
        .in('id', userIds);

      const profilesMap = {};
      if (profiles) {
        profiles.forEach(p => { profilesMap[p.id] = p; });
      }

      const repliesWithAuthors = repliesData.map(reply => ({
        ...reply,
        author: profilesMap[reply.user_id] || null
      }));

      setReplies(repliesWithAuthors);
      setCommentsCount(repliesData.length);
    }
  };

  const handleDeleteReply = async (replyId) => {
    if (!confirm(t.posts?.postCard?.deleteReplyConfirm || 'Delete this reply?')) return;

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', replyId);

      if (error) throw error;

      setReplies(replies.filter(r => r.id !== replyId));
      setCommentsCount(prev => prev - 1);
    } catch (error) {
      console.error('Delete reply error:', error);
    }
  };

  const profileLink = author?.artist_slug
    ? `/profile/${author.artist_slug}`
    : post.user_id ? `/profile/${post.user_id}` : '#';

  return (
    <article className={`rounded-2xl overflow-hidden ${isDark ? 'bg-[#242526]' : 'bg-white'} shadow-sm border ${isDark ? 'border-gray-700/50' : 'border-gray-200'}`}>
      {/* Post header */}
      <div className="p-4 pb-0">
        <div className="flex items-start gap-3">
          <Link href={profileLink} className="shrink-0">
            {author?.avatar_url ? (
              <img
                src={author.avatar_url}
                alt={author.username}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-700"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                {author?.username?.[0]?.toUpperCase() || '?'}
              </div>
            )}
          </Link>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Link
                href={profileLink}
                className={`font-semibold hover:underline ${isDark ? 'text-white' : 'text-gray-900'}`}
              >
                {author?.username || 'User'}
              </Link>
              {author?.is_verified && (
                <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {formatDate(post.created_at)}
            </p>
          </div>

          {isOwner && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-gray-400 hover:text-red-400' : 'hover:bg-gray-100 text-gray-500 hover:text-red-500'}`}
              title={t.posts?.postCard?.delete || 'Delete'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Post content */}
      <div className="px-4 py-3">
        <p className={`text-[15px] leading-relaxed whitespace-pre-wrap break-words ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
          {post.content}
        </p>
      </div>

      {/* Media */}
      {post.media_urls && post.media_urls.length > 0 && (
        <div className={`grid gap-1 ${post.media_urls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {post.media_urls.map((url, index) => (
            <div key={index} className="overflow-hidden">
              {post.media_type === 'image' ? (
                <img
                  src={url}
                  alt=""
                  className="w-full h-auto max-h-[500px] object-cover cursor-pointer hover:opacity-95 transition-opacity"
                  onClick={() => window.open(url, '_blank')}
                />
              ) : (
                <video src={url} controls className="w-full h-auto max-h-[500px]" />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className={`px-4 py-3 flex items-center gap-1 border-t ${isDark ? 'border-gray-700/50' : 'border-gray-100'}`}>
        <button
          onClick={handleLike}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            isLiked
              ? 'text-red-500 bg-red-500/10'
              : isDark
                ? 'text-gray-400 hover:bg-white/5 hover:text-red-400'
                : 'text-gray-500 hover:bg-gray-100 hover:text-red-500'
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
          <span className="text-sm font-medium">{likesCount > 0 ? likesCount : ''} {t.feed?.like || 'Like'}</span>
        </button>

        <button
          onClick={() => {
            if (!currentUser) {
              router.push('/login');
              return;
            }
            setShowReplyForm(!showReplyForm);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${isDark ? 'text-gray-400 hover:bg-white/5 hover:text-blue-400' : 'text-gray-500 hover:bg-gray-100 hover:text-blue-500'}`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="text-sm font-medium">{commentsCount > 0 ? commentsCount : ''} {t.feed?.comment || 'Comment'}</span>
        </button>
      </div>

      {/* Reply form */}
      {showReplyForm && (
        <div className={`px-4 pb-4 border-t ${isDark ? 'border-gray-700/50' : 'border-gray-100'}`}>
          <div className="pt-4">
            <CreatePost replyTo={post} onPostCreated={handleReplyCreated} />
          </div>
        </div>
      )}

      {/* Comments/Replies section - always visible */}
      {(replies.length > 0 || loadingReplies) && (
        <div className={`border-t ${isDark ? 'border-gray-700/50 bg-[#1c1c1d]' : 'border-gray-100 bg-gray-50'}`}>
          {loadingReplies ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-500 border-t-red-500 mx-auto"></div>
            </div>
          ) : (
            <div className="divide-y divide-gray-700/30 dark:divide-gray-700/30">
              {replies.map(reply => {
                const replyAuthor = reply.author;
                const isReplyOwner = currentUser?.id === reply.user_id;
                const replyProfileLink = replyAuthor?.artist_slug
                  ? `/profile/${replyAuthor.artist_slug}`
                  : reply.user_id ? `/profile/${reply.user_id}` : '#';

                return (
                  <div key={reply.id} className="px-4 py-3">
                    <div className="flex gap-3">
                      <Link href={replyProfileLink} className="shrink-0">
                        {replyAuthor?.avatar_url ? (
                          <img
                            src={replyAuthor.avatar_url}
                            alt={replyAuthor.username}
                            className="w-9 h-9 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center text-white font-semibold text-sm">
                            {replyAuthor?.username?.[0]?.toUpperCase() || '?'}
                          </div>
                        )}
                      </Link>

                      <div className="flex-1 min-w-0">
                        <div className={`inline-block rounded-2xl px-4 py-2.5 ${isDark ? 'bg-[#3a3b3c]' : 'bg-white'}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <Link
                              href={replyProfileLink}
                              className={`font-semibold text-[13px] hover:underline ${isDark ? 'text-white' : 'text-gray-900'}`}
                            >
                              {replyAuthor?.username || 'User'}
                            </Link>
                            {replyAuthor?.is_verified && (
                              <svg className="w-3.5 h-3.5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <p className={`text-[15px] whitespace-pre-wrap break-words ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                            {reply.content}
                          </p>
                        </div>

                        <div className="flex items-center gap-4 mt-1 ml-2">
                          <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            {formatDate(reply.created_at)}
                          </span>
                          {isReplyOwner && (
                            <button
                              onClick={() => handleDeleteReply(reply.id)}
                              className={`text-xs font-medium transition-colors ${isDark ? 'text-gray-500 hover:text-red-400' : 'text-gray-400 hover:text-red-500'}`}
                            >
                              {t.posts?.postCard?.delete || 'Delete'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </article>
  );
}

export default function Feed() {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const { isDark } = useTheme();
  const { profile } = useProfile(user?.id);
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .is('deleted_at', null)
        .is('reply_to_id', null)
        .order('created_at', { ascending: false })
        .limit(50);

      if (postsError) throw postsError;

      if (!postsData || postsData.length === 0) {
        setPosts([]);
        return;
      }

      // Load author profiles
      const userIds = [...new Set(postsData.map(p => p.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, artist_slug, avatar_url, is_verified')
        .in('id', userIds);

      const profilesMap = {};
      if (profiles) {
        profiles.forEach(p => { profilesMap[p.id] = p; });
      }

      // Check likes for current user (only if logged in)
      const postsWithData = await Promise.all(
        postsData.map(async (post) => {
          let userHasLiked = false;
          if (user) {
            const { data: likeData } = await supabase
              .from('post_likes')
              .select('id')
              .eq('post_id', post.id)
              .eq('user_id', user.id)
              .single();
            userHasLiked = !!likeData;
          }

          return {
            ...post,
            author: profilesMap[post.user_id] || null,
            user_has_liked: userHasLiked
          };
        })
      );

      setPosts(postsWithData);
    } catch (err) {
      console.error('Error loading posts:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handlePostCreated = (newPost) => {
    setPosts([newPost, ...posts]);
  };

  const handlePostDeleted = (postId) => {
    setPosts(posts.filter(p => p.id !== postId));
  };

  const { isDesktop, sidebarOpen, sidebarWidth } = useUI();

  return (
    <>
      <Seo
        lang={lang}
        title={t.feed?.title || 'Feed'}
        description={t.feed?.description || 'Community feed'}
        path="/feed"
      />

      <div className="min-h-screen bg-white dark:bg-black">
        {/* Full-screen header */}
        <header
          className="relative w-full overflow-hidden"
          style={{
            marginLeft: isDesktop && sidebarOpen ? -sidebarWidth : 0,
            width: isDesktop && sidebarOpen ? `calc(100% + ${sidebarWidth}px)` : '100%',
            transition: 'margin-left 300ms ease, width 300ms ease'
          }}
        >
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&h=400&fit=crop&auto=format&q=80"
              alt="Feed"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent"></div>
          </div>
          <div
            className="relative py-16 md:py-24"
            style={{
              marginLeft: isDesktop && sidebarOpen ? sidebarWidth : 0,
              transition: 'margin-left 300ms ease'
            }}
          >
            <div className="max-w-4xl pl-[60px] md:pl-[100px] pr-8">
              <span className="inline-flex items-center rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-red-300">
                {t.feed?.badge || 'Community'}
              </span>
              <h1 className="mt-4 text-4xl md:text-6xl font-black uppercase text-white">
                {t.feed?.title || 'Feed'}
              </h1>
              <p className="mt-4 max-w-3xl text-lg text-gray-200">
                {t.feed?.subtitle || 'Share your thoughts with the community'}
              </p>
            </div>
          </div>
        </header>

        <main className={`px-4 py-8 ${isDark ? 'bg-[#18191a]' : 'bg-gray-100'}`}>
          <div className="max-w-2xl mx-auto">
          {/* Create post - or login prompt */}
          {user ? (
            <div className={`mb-6 shadow-sm border ${isDark ? 'border-gray-700/50' : 'border-gray-200'} rounded-2xl overflow-hidden`}>
              <CreatePost onPostCreated={handlePostCreated} />
            </div>
          ) : (
            <div
              onClick={() => router.push('/login')}
              className={`mb-6 rounded-2xl cursor-pointer transition-all hover:shadow-md ${isDark ? 'bg-[#242526] hover:bg-[#2d2e2f]' : 'bg-white hover:bg-gray-50'} shadow-sm border ${isDark ? 'border-gray-700/50' : 'border-gray-200'}`}
            >
              <div className="flex gap-3 p-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                  <svg className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className={`flex-1 rounded-full px-4 py-2.5 ${isDark ? 'bg-[#3a3b3c] text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                  {t.feed?.loginToPost || 'Log in to share something...'}
                </div>
              </div>
            </div>
          )}

          {/* Posts list */}
          {loading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-red-500 mx-auto"></div>
              <p className={`mt-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {t.feed?.loading || 'Loading...'}
              </p>
            </div>
          ) : error ? (
            <div className={`text-center py-16 rounded-2xl ${isDark ? 'bg-[#242526]' : 'bg-white'}`}>
              <div className="text-red-500 text-5xl mb-4">!</div>
              <p className="text-red-500 mb-4">{error}</p>
              <button
                onClick={loadPosts}
                className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
              >
                {t.feed?.retry || 'Retry'}
              </button>
            </div>
          ) : posts.length === 0 ? (
            <div className={`text-center py-16 rounded-2xl ${isDark ? 'bg-[#242526]' : 'bg-white'}`}>
              <div className="text-6xl mb-4">
                <svg className={`w-16 h-16 mx-auto ${isDark ? 'text-gray-600' : 'text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
              <p className={`text-lg font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                {t.feed?.noPosts || 'No posts yet'}
              </p>
              <p className={`text-sm mt-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                {t.feed?.startConversation || 'Be the first to post!'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post, index) => (
                <React.Fragment key={post.id}>
                  <FeedPostCard
                    post={post}
                    onUpdate={loadPosts}
                    onDelete={handlePostDeleted}
                    currentUser={user}
                  />
                  {/* Insert ad after every 4 posts */}
                  {(index + 1) % 4 === 0 && index < posts.length - 1 && (
                    <div className="my-4">
                      <InFeedAd />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
          </div>
        </main>
      </div>
    </>
  );
}
