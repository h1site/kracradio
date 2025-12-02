'use client';
// src/pages/VideoDetail.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useI18n } from '../i18n';
import { useAuth } from '../context/AuthContext';
import Seo from '../seo/Seo';
import VideoPlayer from '../components/VideoPlayer';
import { useNotification } from '../context/NotificationContext';
import GoogleAd from '../components/ads/GoogleAd';
import {
  getApprovedVideos,
  getVideoLikeCount,
  hasLikedVideo,
  likeVideo,
  unlikeVideo,
  getVideoComments,
  addVideoComment,
  deleteVideoComment
} from '../lib/supabase';

const STRINGS = {
  fr: {
    metaTitle: 'Vidéo — KracRadio',
    metaDesc: 'Regardez cette vidéo musicale sur KracRadio',
    loading: 'Chargement...',
    notFound: 'Vidéo non trouvée',
    goBack: 'Retour aux vidéos',
    likes: 'likes',
    comments: 'commentaires',
    addComment: 'Ajouter un commentaire...',
    send: 'Envoyer',
    loginToComment: 'Connectez-vous pour commenter',
    delete: 'Supprimer',
    by: 'par',
    submittedBy: 'Soumis par',
  },
  en: {
    metaTitle: 'Video — KracRadio',
    metaDesc: 'Watch this music video on KracRadio',
    loading: 'Loading...',
    notFound: 'Video not found',
    goBack: 'Back to videos',
    likes: 'likes',
    comments: 'comments',
    addComment: 'Add a comment...',
    send: 'Send',
    loginToComment: 'Login to comment',
    delete: 'Delete',
    by: 'by',
    submittedBy: 'Submitted by',
  },
  es: {
    metaTitle: 'Video — KracRadio',
    metaDesc: 'Mira este video musical en KracRadio',
    loading: 'Cargando...',
    notFound: 'Video no encontrado',
    goBack: 'Volver a videos',
    likes: 'me gusta',
    comments: 'comentarios',
    addComment: 'Añadir un comentario...',
    send: 'Enviar',
    loginToComment: 'Inicia sesión para comentar',
    delete: 'Eliminar',
    by: 'por',
    submittedBy: 'Enviado por',
  },
};

// Generate or get session ID for anonymous likes
function getSessionId() {
  let sessionId = localStorage.getItem('krac_session_id');
  if (!sessionId) {
    sessionId = 'sess_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('krac_session_id', sessionId);
  }
  return sessionId;
}

export default function VideoDetail() {
  const { slug } = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { lang } = useI18n();
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const L = useMemo(() => STRINGS[lang] || STRINGS.fr, [lang]);
  const sessionId = useMemo(() => getSessionId(), []);

  // Check if we should autoplay (coming from ended video) - use query param instead of location.state
  const shouldAutoplay = searchParams?.get('autoplay') === 'true';
  const videoContainerRef = React.useRef(null);

  const [video, setVideo] = useState(null);
  const [allVideos, setAllVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loadingLike, setLoadingLike] = useState(false);

  const isAdminSubmission = video?.submitter?.role === 'admin';

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  // Load video by slug
  useEffect(() => {
    const loadVideo = async () => {
      setLoading(true);
      setVideo(null);

      try {
        const videos = await getApprovedVideos();
        setAllVideos(videos);

        // Helper function to normalize slugs
        const normalizeSlug = (str) => {
          return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        };

        const normalizedSlug = normalizeSlug(slug);

        // Match by title only
        const foundVideo = videos.find(v => {
          const titleSlug = normalizeSlug(v.title);
          return titleSlug === normalizedSlug;
        });

        if (foundVideo) {
          setVideo(foundVideo);
          const [count, hasLiked, commentsData] = await Promise.all([
            getVideoLikeCount(foundVideo.id),
            hasLikedVideo(foundVideo.id, user?.id, sessionId),
            getVideoComments(foundVideo.id)
          ]);
          setLikeCount(count);
          setLiked(hasLiked);
          setComments(commentsData || []);
        }
      } catch (error) {
        console.error('Error loading video:', error);
      } finally {
        setLoading(false);
      }
    };

    loadVideo();
  }, [slug, user?.id, sessionId]);

  // Switch to a random video (without full navigation to preserve fullscreen)
  const switchToRandomVideo = async (isFullscreen = false) => {
    if (allVideos.length <= 1) return;

    // Filter out current video and pick a random one
    const otherVideos = allVideos.filter(v => v.id !== video?.id);
    const randomVideo = otherVideos[Math.floor(Math.random() * otherVideos.length)];

    if (randomVideo) {
      const randomSlug = randomVideo.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      if (isFullscreen) {
        // Stay on the same page, just update state and URL
        // This preserves fullscreen mode
        window.history.replaceState(null, '', `/videos/${randomSlug}`);

        // Update video state directly
        setVideo(randomVideo);
        setLiked(false);
        setLikeCount(0);
        setComments([]);

        // Load new video data
        const [count, hasLiked, commentsData] = await Promise.all([
          getVideoLikeCount(randomVideo.id),
          hasLikedVideo(randomVideo.id, user?.id, sessionId),
          getVideoComments(randomVideo.id)
        ]);
        setLikeCount(count);
        setLiked(hasLiked);
        setComments(commentsData || []);
      } else {
        // Normal navigation when not in fullscreen
        router.push(`/videos/${randomSlug}`, { state: { autoplay: true } });
      }
    }
  };

  // Handle video end - play random video
  const handleVideoEnd = (wasFullscreen) => {
    switchToRandomVideo(wasFullscreen);
  };

  // Handle skip button
  const handleSkip = (isFullscreen) => {
    switchToRandomVideo(isFullscreen);
  };

  const handleLike = async () => {
    if (loadingLike || !video) return;
    setLoadingLike(true);
    try {
      if (liked) {
        await unlikeVideo(video.id, user?.id, sessionId);
        setLikeCount(c => c - 1);
        setLiked(false);
      } else {
        await likeVideo(video.id, user?.id, sessionId);
        setLikeCount(c => c + 1);
        setLiked(true);

        // Show notification
        const messages = {
          fr: 'Vidéo ajoutée',
          en: 'Video added',
          es: 'Video añadido'
        };
        showNotification(messages[lang] || messages.fr, 'video');
      }
    } catch (err) {
      console.error('Like error:', err);
    } finally {
      setLoadingLike(false);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !user || !video) return;
    try {
      const comment = await addVideoComment(video.id, user.id, newComment.trim());
      setComments([comment, ...comments]);
      setNewComment('');
    } catch (err) {
      console.error('Comment error:', err);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await deleteVideoComment(commentId);
      setComments(comments.filter(c => c.id !== commentId));
    } catch (err) {
      console.error('Delete comment error:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-red-500/20 rounded-full"></div>
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-red-500 rounded-full animate-spin"></div>
          </div>
          <span className="text-gray-400 text-sm tracking-wider uppercase">{L.loading}</span>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">{L.notFound}</h1>
          <button
            onClick={() => router.push('/videos')}
            className="px-6 py-3 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
          >
            {L.goBack}
          </button>
        </div>
      </div>
    );
  }

  // Generate meta description from video info
  const metaDescription = video.description
    || (video.artist_name
      ? `${lang === 'fr' ? 'Regardez' : lang === 'es' ? 'Mira' : 'Watch'} "${video.title}" ${lang === 'fr' ? 'par' : lang === 'es' ? 'por' : 'by'} ${video.artist_name} ${lang === 'fr' ? 'sur' : lang === 'es' ? 'en' : 'on'} KracRadio`
      : `${lang === 'fr' ? 'Regardez' : lang === 'es' ? 'Mira' : 'Watch'} "${video.title}" ${lang === 'fr' ? 'sur' : lang === 'es' ? 'en' : 'on'} KracRadio`);

  // VideoObject schema for SEO
  const videoSchema = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: video.title,
    description: metaDescription,
    thumbnailUrl: video.thumbnail_url || `https://img.youtube.com/vi/${video.youtube_id}/maxresdefault.jpg`,
    uploadDate: video.created_at,
    contentUrl: `https://www.youtube.com/watch?v=${video.youtube_id}`,
    embedUrl: `https://www.youtube.com/embed/${video.youtube_id}`,
    publisher: {
      '@type': 'Organization',
      name: 'KracRadio',
      logo: {
        '@type': 'ImageObject',
        url: 'https://kracradio.com/images/logos/krac_short_white_white.png'
      }
    },
    ...(video.artist_name && { author: { '@type': 'Person', name: video.artist_name } }),
    interactionStatistic: {
      '@type': 'InteractionCounter',
      interactionType: { '@type': 'LikeAction' },
      userInteractionCount: likeCount
    }
  };

  return (
    <>
      <Seo
        lang={lang}
        title={`${video.title}${video.artist_name ? ` - ${video.artist_name}` : ''}`}
        description={metaDescription}
        path={`/videos/${slug}`}
        image={video.thumbnail_url || `https://img.youtube.com/vi/${video.youtube_id}/maxresdefault.jpg`}
        type="video.other"
        jsonLd={videoSchema}
      />

      <div className="min-h-screen bg-[#0f0f0f]">
        {/* Video player - Max width container like YouTube */}
        <div className="bg-black">
          <div ref={videoContainerRef} className="max-w-[1920px] mx-auto">
            <VideoPlayer
              videoId={video.youtube_id}
              videoTitle={video.title}
              playerId="krac-video-player"
              autoplay={shouldAutoplay || document.fullscreenElement !== null}
              showTopBar={true}
              onVideoEnd={handleVideoEnd}
              onSkip={handleSkip}
              liked={liked}
              likeCount={likeCount}
              onLike={handleLike}
              loadingLike={loadingLike}
            />
          </div>
        </div>

        {/* Video Info Below - YouTube Style */}
        <div className="max-w-[1920px] mx-auto px-6 lg:px-16">
          <div className="max-w-[1280px]">
            {/* Back to Videos Button */}
            <Link
              href="/videos"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mt-4 mb-6 group"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              <span className="text-sm font-medium">Retour aux vidéos</span>
            </Link>

            {/* Title */}
            <h1 className="text-xl font-semibold text-white mb-3">{video.title}</h1>

            {/* Channel Info & Like Button */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                {/* Channel/Artist Avatar & Name */}
                <div className="flex items-center gap-3">
                  {isAdminSubmission ? (
                    <>
                      <img src="/images/logos/krac_short_white_white.png" alt="KracRadio" className="h-10 w-auto object-contain" />
                      <div>
                        <div className="font-medium text-white">KracRadio</div>
                        {video.artist_name && (
                          <div className="text-xs text-gray-400">{video.artist_name}</div>
                        )}
                      </div>
                    </>
                  ) : video.submitter ? (
                    <>
                      <div className="w-10 h-10 rounded-full bg-gray-800 overflow-hidden">
                        {video.submitter.avatar_url ? (
                          <img src={video.submitter.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                            {video.submitter.username?.[0]?.toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-white">{video.submitter.username}</div>
                        {video.artist_name && (
                          <div className="text-xs text-gray-400">{video.artist_name}</div>
                        )}
                      </div>
                    </>
                  ) : null}
                </div>
              </div>

              {/* Like Button - YouTube Style */}
              <button
                onClick={handleLike}
                disabled={loadingLike}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
                  liked
                    ? 'bg-white text-black'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
                  <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                </svg>
                <span className="font-medium">{likeCount}</span>
              </button>
            </div>

            {/* Description Box - YouTube Style */}
            {video.description && (
              <div className="bg-white/5 hover:bg-white/10 rounded-xl p-3 mb-4 cursor-pointer transition-colors">
                <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{video.description}</p>
              </div>
            )}

            {/* Ad before comments */}
            <div className="mt-8 mb-8">
              <GoogleAd slot="5041624401" />
            </div>

            {/* Comments Section */}
            <div className="border-t border-gray-800 pt-12 pb-12">
              <h2 className="text-lg font-semibold text-white mb-8">{comments.length} {L.comments}</h2>

              {/* Add Comment */}
              {user ? (
                <div className="flex gap-3 mb-12">
                  <Link
                    href={`/profile/${user.user_metadata?.username || user.id}`}
                    className="w-10 h-10 rounded-full bg-gray-800 overflow-hidden flex-shrink-0 hover:ring-2 hover:ring-white/30 transition-all"
                  >
                    {user.user_metadata?.avatar_url ? (
                      <img src={user.user_metadata.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        {(user.user_metadata?.username || user.email)?.[0]?.toUpperCase()}
                      </div>
                    )}
                  </Link>
                  <form onSubmit={handleComment} className="flex-1">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder={L.addComment}
                      className="w-full px-0 py-2 bg-transparent border-b border-gray-700 focus:border-white text-white placeholder-gray-500 outline-none transition-colors"
                    />
                    {newComment.trim() && (
                      <div className="flex justify-end gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => setNewComment('')}
                          className="px-4 py-2 text-sm font-medium text-white hover:bg-white/10 rounded-full transition-colors"
                        >
                          Annuler
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors"
                        >
                          {L.send}
                        </button>
                      </div>
                    )}
                  </form>
                </div>
              ) : (
                <p className="text-gray-400 mb-6">{L.loginToComment}</p>
              )}

              {/* Comments List */}
              <div className="space-y-6">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <Link
                      href={`/profile/${comment.username || comment.user_id}`}
                      className="w-10 h-10 rounded-full bg-gray-800 overflow-hidden flex-shrink-0 hover:ring-2 hover:ring-white/30 transition-all"
                    >
                      {comment.avatar_url ? (
                        <img src={comment.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                          {comment.username?.[0]?.toUpperCase()}
                        </div>
                      )}
                    </Link>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-white">{comment.username}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(comment.created_at).toLocaleDateString()}
                        </span>
                        {user?.id === comment.user_id && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-xs text-gray-400 hover:text-white ml-auto"
                          >
                            {L.delete}
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-gray-200">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
