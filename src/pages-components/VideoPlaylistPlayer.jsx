'use client';
// src/pages/VideoPlaylistPlayer.jsx
// Dedicated player page for video playlists
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { usePlaylists } from '../context/PlaylistContext';
import { useI18n } from '../i18n';
import Seo from '../seo/Seo';
import VideoPlayer from '../components/VideoPlayer';

export default function VideoPlaylistPlayer() {
  const { playlistId } = useParams();
  const router = useRouter();
  const { lang } = useI18n();
  const { videoPlaylists } = usePlaylists();

  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [showPlaylist, setShowPlaylist] = useState(true);

  // Find the playlist - this will update when videoPlaylists changes
  const playlist = videoPlaylists.find(pl => pl.id === playlistId);

  // Redirect if playlist not found (only after initial load)
  useEffect(() => {
    if (!playlist && videoPlaylists.length > 0) {
      router.push('/playlists');
    }
  }, [playlist, videoPlaylists, router]);

  // Adjust currentVideoIndex if it's out of bounds after playlist changes
  useEffect(() => {
    if (playlist && playlist.videos.length > 0 && currentVideoIndex >= playlist.videos.length) {
      setCurrentVideoIndex(playlist.videos.length - 1);
    }
  }, [playlist, currentVideoIndex]);

  const playVideo = (index) => {
    setCurrentVideoIndex(index);
  };

  const playNext = useCallback(() => {
    if (!playlist || playlist.videos.length === 0) return;
    const nextIndex = (currentVideoIndex + 1) % playlist.videos.length;
    setCurrentVideoIndex(nextIndex);
  }, [currentVideoIndex, playlist]);

  const playPrevious = () => {
    if (!playlist || playlist.videos.length === 0) return;
    const prevIndex = currentVideoIndex === 0 ? playlist.videos.length - 1 : currentVideoIndex - 1;
    setCurrentVideoIndex(prevIndex);
  };

  if (!playlist) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-red-500/20 rounded-full"></div>
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-red-500 rounded-full animate-spin"></div>
          </div>
          <span className="text-gray-400 text-sm tracking-wider uppercase">Chargement...</span>
        </div>
      </div>
    );
  }

  if (playlist.videos.length === 0) {
    return (
      <>
        <Seo lang={lang} title={`${playlist.name} — KracRadio`} description="Playlist vidéo" path={`/playlist/video/${playlistId}`} />
        <div className="min-h-screen flex items-center justify-center bg-black">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">{playlist.name}</h1>
            <p className="text-gray-400 mb-6">Cette playlist est vide</p>
            <Link href="/playlists" className="px-6 py-3 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors inline-block">
              Retour aux playlists
            </Link>
          </div>
        </div>
      </>
    );
  }

  const currentVideo = playlist.videos[currentVideoIndex];

  return (
    <>
      <Seo lang={lang} title={`${playlist.name} — KracRadio`} description={`Playlist vidéo: ${playlist.name}`} path={`/playlist/video/${playlistId}`} />

      <div className="min-h-screen bg-[#0f0f0f]">
        <div className="bg-black">
          <div className="max-w-[1920px] mx-auto">
            <div className="flex flex-col lg:flex-row">
              {/* Main Video Player */}
              <div className={`${showPlaylist ? 'lg:w-[70%]' : 'w-full'} transition-all duration-300`}>
                {currentVideo && (
                  <VideoPlayer
                    videoId={currentVideo.youtube_id}
                    videoTitle={currentVideo.title}
                    playerId={`playlist-video-${currentVideoIndex}`}
                    autoplay={true}
                    showTopBar={true}
                    onVideoEnd={playNext}
                  />
                )}

                {/* Previous/Next Buttons Below Player */}
                <div className="bg-black px-4 py-3 flex items-center justify-between border-t border-gray-800">
                  <button
                    onClick={playPrevious}
                    disabled={playlist.videos.length <= 1}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
                    </svg>
                    <span className="hidden sm:inline">Précédent</span>
                  </button>

                  <div className="text-center">
                    <p className="text-white text-sm">
                      {currentVideoIndex + 1} / {playlist.videos.length}
                    </p>
                  </div>

                  <button
                    onClick={playNext}
                    disabled={playlist.videos.length <= 1}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="hidden sm:inline">Suivant</span>
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
                      <div>
                        <h2 className="text-white font-semibold">{playlist.name}</h2>
                        <p className="text-gray-400 text-sm">{playlist.videos.length} vidéo{playlist.videos.length !== 1 ? 's' : ''}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          href="/playlists"
                          className="flex items-center gap-1 px-2 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-xs text-gray-300 hover:text-white transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                          </svg>
                          Retour
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
                    {playlist.videos.map((video, index) => (
                      <div
                        key={video.youtube_id || index}
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
              href="/playlists"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              <span className="text-sm font-medium">Retour aux playlists</span>
            </Link>

            {currentVideo && (
              <>
                <h1 className="text-2xl font-bold text-white mb-2">{currentVideo.title}</h1>
                {currentVideo.artist_name && (
                  <p className="text-gray-400 mb-4">{currentVideo.artist_name}</p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
