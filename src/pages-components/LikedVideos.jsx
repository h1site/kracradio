'use client';
// src/pages/LikedVideos.jsx
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n';
import { getUserLikedVideos, unlikeVideo } from '../lib/supabase';
import { usePlaylists } from '../context/PlaylistContext';
import Seo from '../seo/Seo';
import VideoPlayer from '../components/VideoPlayer';
import PlaylistModal from '../components/PlaylistModal';

export default function LikedVideos() {
  const { lang, t } = useI18n();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { videoPlaylists } = usePlaylists();
  const [playlistModalOpen, setPlaylistModalOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [sessionId] = useState(() => {
    let sid = localStorage.getItem('kracradio_session_id');
    if (!sid) {
      sid = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('kracradio_session_id', sid);
    }
    return sid;
  });

  const [likedVideos, setLikedVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [showPlaylist, setShowPlaylist] = useState(true);

  const playerId = 'liked-videos-player';

  // Load liked videos
  useEffect(() => {
    const loadLikedVideos = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const videos = await getUserLikedVideos(user.id, sessionId);
        setLikedVideos(videos || []);
      } catch (err) {
        console.error('Error loading liked videos:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      loadLikedVideos();
    }
  }, [user, authLoading, sessionId]);

  const handleRemoveLike = async (videoId) => {
    try {
      await unlikeVideo(videoId, user?.id, sessionId);
      const newVideos = likedVideos.filter(v => v.id !== videoId);
      setLikedVideos(newVideos);

      // If removed video was playing, play next or stop if it was the last
      if (likedVideos[currentVideoIndex]?.id === videoId) {
        if (newVideos.length > 0) {
          // Play next video or first if it was the last
          const nextIndex = currentVideoIndex >= newVideos.length ? 0 : currentVideoIndex;
          setCurrentVideoIndex(nextIndex);
        } else {
          // No more videos
          setCurrentVideoIndex(0);
        }
      } else if (currentVideoIndex > newVideos.length - 1) {
        // Adjust index if needed
        setCurrentVideoIndex(Math.max(0, newVideos.length - 1));
      }
    } catch (err) {
      console.error('Error removing like:', err);
    }
  };

  const playVideo = (index) => {
    setCurrentVideoIndex(index);
  };

  const playNext = useCallback(() => {
    if (likedVideos.length === 0) return;
    const nextIndex = (currentVideoIndex + 1) % likedVideos.length;
    setCurrentVideoIndex(nextIndex);
  }, [currentVideoIndex, likedVideos.length]);

  const playPrevious = () => {
    if (likedVideos.length === 0) return;
    const prevIndex = currentVideoIndex === 0 ? likedVideos.length - 1 : currentVideoIndex - 1;
    setCurrentVideoIndex(prevIndex);
  };

  const currentVideo = likedVideos[currentVideoIndex];

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-red-500/20 rounded-full"></div>
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-red-500 rounded-full animate-spin"></div>
          </div>
          <span className="text-gray-400 text-sm tracking-wider uppercase">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Please login to view your liked videos</h1>
          <button
            onClick={() => router.push('/login')}
            className="px-6 py-3 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  if (likedVideos.length === 0) {
    return (
      <>
        <Seo
          lang={lang}
          title="Liked Videos — KracRadio"
          description="Your liked videos collection"
          path="/liked-videos"
        />
        <div className="min-h-screen flex items-center justify-center bg-black">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">No liked videos yet</h1>
            <p className="text-gray-400 mb-6">Start exploring and liking videos!</p>
            <button
              onClick={() => router.push('/videos')}
              className="px-6 py-3 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
            >
              Browse Videos
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Seo
        lang={lang}
        title="Liked Videos — KracRadio"
        description="Your liked videos collection"
        path="/liked-videos"
      />

      <div className="min-h-screen bg-[#0f0f0f]">
        {/* Video Player with Playlist */}
        <div className="bg-black">
          <div className="max-w-[1920px] mx-auto">
            <div className="flex flex-col lg:flex-row">
              {/* Main Video Player */}
              <div className={`${showPlaylist ? 'lg:w-[70%]' : 'w-full'} transition-all duration-300`}>
                {currentVideo && (
                  <VideoPlayer
                    videoId={currentVideo.youtube_id}
                    videoTitle={currentVideo.title}
                    playerId={`${playerId}-${currentVideoIndex}`}
                    autoplay={true}
                    showTopBar={true}
                    onVideoEnd={playNext}
                  />
                )}

                {/* Previous/Next Buttons Below Player */}
                <div className="bg-black px-4 py-3 flex items-center justify-between border-t border-gray-800">
                  <button
                    onClick={playPrevious}
                    disabled={likedVideos.length <= 1}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
                    </svg>
                    <span className="hidden sm:inline">Previous</span>
                  </button>

                  <div className="text-center">
                    <p className="text-white text-sm">
                      {currentVideoIndex + 1} / {likedVideos.length}
                    </p>
                  </div>

                  <button
                    onClick={playNext}
                    disabled={likedVideos.length <= 1}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M16 18h2V6h-2v12zm-11-6l8.5-6v12z"/>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Playlist Sidebar */}
              {showPlaylist && (
                <div className="lg:w-[30%] bg-[#0f0f0f] border-l border-gray-800 max-h-[600px] lg:max-h-screen overflow-y-auto">
                  {/* Playlist Header */}
                  <div className="sticky top-0 bg-[#0f0f0f] border-b border-gray-800 px-4 py-3 z-10">
                    <div className="flex items-center justify-between">
                      <h2 className="text-white font-semibold">Liked Videos ({likedVideos.length})</h2>
                      <div className="flex items-center gap-2">
                        <Link
                          href="/playlists"
                          className="flex items-center gap-1 px-2 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-xs text-gray-300 hover:text-white transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                          </svg>
                          {videoPlaylists.length > 0 && (
                            <span className="bg-red-500 text-white text-[10px] px-1 rounded">{videoPlaylists.length}</span>
                          )}
                        </Link>
                        <button
                          onClick={() => setShowPlaylist(false)}
                          className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path d="M6 18L18 6M6 6l12 12"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Playlist Items */}
                  <div className="divide-y divide-gray-800">
                    {likedVideos.map((video, index) => (
                      <div
                        key={video.id}
                        className={`group px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors ${
                          index === currentVideoIndex ? 'bg-white/10' : ''
                        }`}
                        onClick={() => playVideo(index)}
                      >
                        <div className="flex gap-3">
                          {/* Thumbnail */}
                          <div className="relative w-32 h-18 flex-shrink-0 bg-black rounded overflow-hidden">
                            <img
                              src={`https://img.youtube.com/vi/${video.youtube_id}/mqdefault.jpg`}
                              alt={video.title}
                              className="w-full h-full object-cover"
                            />
                            {index === currentVideoIndex && (
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center">
                                  <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z"/>
                                  </svg>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Video Info */}
                          <div className="flex-1 min-w-0">
                            <h3 className={`text-sm font-medium line-clamp-2 mb-1 ${
                              index === currentVideoIndex ? 'text-red-500' : 'text-white'
                            }`}>
                              {video.title}
                            </h3>
                            {video.artist_name && (
                              <p className="text-xs text-gray-400 line-clamp-1">{video.artist_name}</p>
                            )}

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              {/* Add to Playlist Button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedVideo(video);
                                  setPlaylistModalOpen(true);
                                }}
                                className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                </svg>
                                {t.playlists?.addTo || 'Add to playlist'}
                              </button>
                              {/* Remove Button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveLike(video.id);
                                }}
                                className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Toggle Playlist Button (Mobile) */}
              {!showPlaylist && (
                <button
                  onClick={() => setShowPlaylist(true)}
                  className="lg:hidden fixed bottom-20 right-4 p-4 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 transition-colors z-50"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/>
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Video Info Below */}
        <div className="max-w-[1920px] mx-auto px-6 py-6">
          <div className="max-w-[1280px]">
            <Link
              href="/videos"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              <span className="text-sm font-medium">Back to Videos</span>
            </Link>

            {currentVideo && (
              <>
                <h1 className="text-2xl font-bold text-white mb-2">{currentVideo.title}</h1>
                {currentVideo.artist_name && (
                  <p className="text-gray-400 mb-4">{currentVideo.artist_name}</p>
                )}
                {currentVideo.description && (
                  <div className="bg-white/5 hover:bg-white/10 rounded-xl p-4 mb-4 cursor-pointer transition-colors">
                    <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {currentVideo.description}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Playlist Modal */}
      <PlaylistModal
        isOpen={playlistModalOpen}
        onClose={() => {
          setPlaylistModalOpen(false);
          setSelectedVideo(null);
        }}
        item={selectedVideo}
        type="video"
      />
    </>
  );
}
