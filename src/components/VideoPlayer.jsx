// src/components/VideoPlayer.jsx
import React, { useState, useEffect, useRef } from 'react';

/**
 * Custom YouTube Video Player Component
 *
 * @param {Object} props
 * @param {string} props.videoId - YouTube video ID
 * @param {string} props.videoTitle - Video title for display
 * @param {Function} props.onVideoEnd - Callback when video ends (optional)
 * @param {Function} props.onSkip - Callback when skip button is clicked (optional)
 * @param {boolean} props.autoplay - Whether to autoplay (default: false)
 * @param {string} props.playerId - Unique player ID (required for multiple players)
 * @param {boolean} props.showTopBar - Whether to show top bar with logo/title/share (default: true)
 * @param {Function} props.onPlayerReady - Callback when player is ready (optional)
 * @param {boolean} props.liked - Whether the video is liked (optional)
 * @param {number} props.likeCount - Number of likes (optional)
 * @param {Function} props.onLike - Callback when like button is clicked (optional)
 * @param {boolean} props.loadingLike - Whether like is loading (optional)
 */
export default function VideoPlayer({
  videoId,
  videoTitle,
  onVideoEnd,
  onSkip,
  autoplay = false,
  playerId,
  showTopBar = true,
  onPlayerReady,
  liked = false,
  likeCount = 0,
  onLike,
  loadingLike = false
}) {
  const [player, setPlayer] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [apiReady, setApiReady] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showOverlay, setShowOverlay] = useState(true);
  const [showTopBarState, setShowTopBarState] = useState(true);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobileFullscreen, setIsMobileFullscreen] = useState(false);
  const [isMobile] = useState(() => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));

  const videoContainerRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const hideControlsTimeoutRef = useRef(null);
  const overlayTimeoutRef = useRef(null);
  const hideTopBarTimeoutRef = useRef(null);
  const isFullscreenRef = useRef(false);

  // Load YouTube API
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

      // Add CSS to hide YouTube UI elements and mobile fullscreen styles
      if (!document.getElementById('hide-youtube-ui-style')) {
        const style = document.createElement('style');
        style.id = 'hide-youtube-ui-style';
        style.textContent = `
          .ytp-chrome-top,
          .ytp-chrome-top-buttons,
          .ytp-show-cards-title,
          .ytp-cards-teaser,
          .ytp-ce-element,
          .ytp-watermark,
          .ytp-pause-overlay {
            display: none !important;
            opacity: 0 !important;
            visibility: hidden !important;
            pointer-events: none !important;
          }

          /* Mobile fullscreen - hide everything except video */
          html.mobile-fullscreen-active,
          html.mobile-fullscreen-active body {
            overflow: hidden !important;
            position: fixed !important;
            width: 100% !important;
            height: 100% !important;
          }

          html.mobile-fullscreen-active header,
          html.mobile-fullscreen-active footer,
          html.mobile-fullscreen-active nav,
          html.mobile-fullscreen-active .sidebar,
          html.mobile-fullscreen-active .mobile-nav,
          html.mobile-fullscreen-active .bottom-nav,
          html.mobile-fullscreen-active [data-hide-on-fullscreen] {
            display: none !important;
          }

          /* Mobile fullscreen in LANDSCAPE orientation */
          @media screen and (orientation: landscape) {
            html.mobile-fullscreen-active .mobile-fullscreen-container {
              position: fixed !important;
              top: 0 !important;
              left: 0 !important;
              right: 0 !important;
              bottom: 0 !important;
              width: 100% !important;
              height: 100% !important;
              z-index: 99999 !important;
              background: black !important;
            }
            html.mobile-fullscreen-active .mobile-fullscreen-container iframe,
            html.mobile-fullscreen-active .mobile-fullscreen-container > div {
              width: 100% !important;
              height: 100% !important;
            }
          }

          /* Mobile fullscreen in PORTRAIT orientation - rotate to landscape */
          @media screen and (orientation: portrait) {
            html.mobile-fullscreen-active .mobile-fullscreen-container {
              position: fixed !important;
              top: 0 !important;
              left: 100dvw !important;
              /* After 90deg rotation: width becomes visual height, height becomes visual width */
              width: 100dvh !important;
              height: 100dvw !important;
              transform-origin: top left !important;
              transform: rotate(90deg) !important;
              z-index: 99999 !important;
              background: black !important;
            }
            html.mobile-fullscreen-active .mobile-fullscreen-container iframe,
            html.mobile-fullscreen-active .mobile-fullscreen-container > div:first-child {
              position: absolute !important;
              top: 0 !important;
              left: 0 !important;
              width: 100% !important;
              height: 100% !important;
            }
            /* Controls in rotated mode - full width */
            html.mobile-fullscreen-active .mobile-fullscreen-container .video-controls-wrapper {
              padding-bottom: 20px !important;
              padding-right: 24px !important;
              padding-left: 24px !important;
              width: 100% !important;
              box-sizing: border-box !important;
            }
          }
        `;
        document.head.appendChild(style);
      }
    }

    const checkYTReady = () => {
      if (window.YT && window.YT.Player) {
        setApiReady(true);
      } else {
        window.onYouTubeIframeAPIReady = () => {
          setApiReady(true);
        };
      }
    };

    checkYTReady();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (player && typeof player.destroy === 'function') {
        try {
          player.destroy();
        } catch (err) {
          console.error('Error destroying player:', err);
        }
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (overlayTimeoutRef.current) {
        clearTimeout(overlayTimeoutRef.current);
      }
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
      if (hideTopBarTimeoutRef.current) {
        clearTimeout(hideTopBarTimeoutRef.current);
      }
      // Reset body overflow on unmount
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.documentElement.classList.remove('mobile-fullscreen-active');
    };
  }, [player]);

  // Initialize YouTube player
  useEffect(() => {
    if (!apiReady || !videoId || !playerId) return;

    const timer = setTimeout(() => {
      const playerElement = document.getElementById(playerId);
      if (!playerElement) return;

      if (playerElement.hasAttribute('data-player-initialized')) {
        return;
      }

      playerElement.setAttribute('data-player-initialized', 'true');

      try {
        const newPlayer = new window.YT.Player(playerId, {
          videoId: videoId,
          playerVars: {
            autoplay: autoplay ? 1 : 0,
            // Use custom controls on all devices (same behavior mobile & desktop)
            controls: 0,
            modestbranding: 1,
            rel: 0,
            showinfo: 0,
            iv_load_policy: 3,
            disablekb: 1,
            // Enable fullscreen button
            fs: 1,
            // playsinline=1 keeps video inline on all devices
            playsinline: 1,
            autohide: 1,
            cc_load_policy: 0,
            enablejsapi: 1,
            origin: window.location.origin
          },
          events: {
            onReady: (event) => {
              setDuration(event.target.getDuration());
              setPlayer(event.target);

              // Hide YouTube UI elements
              const hideYouTubeUI = setInterval(() => {
                const ytElements = document.querySelectorAll('.ytp-chrome-top, .ytp-chrome-top-buttons, .ytp-show-cards-title, .ytp-cards-teaser, .ytp-ce-element, .ytp-watermark');
                ytElements.forEach(el => {
                  el.style.display = 'none';
                  el.style.opacity = '0';
                  el.style.visibility = 'hidden';
                  el.style.pointerEvents = 'none';
                });
              }, 100);

              setTimeout(() => clearInterval(hideYouTubeUI), 5000);

              if (onPlayerReady) {
                onPlayerReady(event.target);
              }
            },
            onStateChange: (event) => {
              const isNowPlaying = event.data === window.YT.PlayerState.PLAYING;
              setIsPlaying(isNowPlaying);

              if (isNowPlaying) {
                // When video starts playing, fade out overlay
                if (overlayTimeoutRef.current) {
                  clearTimeout(overlayTimeoutRef.current);
                }
                setShowOverlay(false);

                progressIntervalRef.current = setInterval(() => {
                  if (event.target && event.target.getCurrentTime) {
                    setCurrentTime(event.target.getCurrentTime());
                  }
                }, 100);
              } else {
                // When paused, show overlay
                setShowOverlay(true);
                if (overlayTimeoutRef.current) {
                  clearTimeout(overlayTimeoutRef.current);
                }
                if (progressIntervalRef.current) {
                  clearInterval(progressIntervalRef.current);
                }
              }

              // Check if video ended
              if (event.data === window.YT.PlayerState.ENDED && onVideoEnd) {
                onVideoEnd(isFullscreenRef.current);
              }
            }
          }
        });
      } catch (err) {
        console.error('Error creating YouTube player:', err);
        playerElement.removeAttribute('data-player-initialized');
      }
    }, 100);

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [apiReady, playerId, showTopBar, onPlayerReady]);

  // Handle video change - use loadVideoById to preserve fullscreen
  useEffect(() => {
    if (player && videoId && typeof player.loadVideoById === 'function') {
      // Check if this is a different video than currently playing
      const currentVideoUrl = player.getVideoUrl?.() || '';
      const currentVideoId = currentVideoUrl.match(/[?&]v=([^&]+)/)?.[1];

      if (currentVideoId !== videoId) {
        // Reset states for new video
        setCurrentTime(0);
        setDuration(0);
        setIsPlaying(false);
        setShowOverlay(true);

        // Load the new video (autoplay since we're switching)
        player.loadVideoById(videoId);

        // Get duration after a short delay
        setTimeout(() => {
          if (player.getDuration) {
            setDuration(player.getDuration());
          }
        }, 1000);
      }
    }
  }, [player, videoId]);

  // Handle mouse movement for controls
  const handleMouseMove = () => {
    setShowControls(true);
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current);
    }
    if (isPlaying) {
      hideControlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  // Fullscreen change listener (with webkit support for iOS/Safari)
  useEffect(() => {
    const handleFullscreenChange = () => {
      const fs = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
      setIsFullscreen(fs);
      isFullscreenRef.current = fs;

      // Lock to landscape on mobile when entering fullscreen
      if (fs && screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('landscape').catch(() => {
          // Silently fail - not all devices support orientation lock
        });
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // Handle top bar visibility based on playing state
  useEffect(() => {
    if (!showTopBar) return;

    if (isPlaying) {
      // Show top bar first
      setShowTopBarState(true);

      // Clear existing timeout
      if (hideTopBarTimeoutRef.current) {
        clearTimeout(hideTopBarTimeoutRef.current);
      }

      // Hide after 3 seconds when playing
      hideTopBarTimeoutRef.current = setTimeout(() => {
        setShowTopBarState(false);
      }, 3000);
    } else {
      // Show top bar when paused
      setShowTopBarState(true);

      // Clear hide timeout when paused
      if (hideTopBarTimeoutRef.current) {
        clearTimeout(hideTopBarTimeoutRef.current);
      }
    }

    // Cleanup
    return () => {
      if (hideTopBarTimeoutRef.current) {
        clearTimeout(hideTopBarTimeoutRef.current);
      }
    };
  }, [isPlaying, showTopBar]);

  const togglePlay = () => {
    if (!player || typeof player.playVideo !== 'function') return;
    if (isPlaying) {
      player.pauseVideo();
      setShowControls(true); // Show controls when pausing
    } else {
      player.playVideo();
      // Start hiding controls immediately when pressing play
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
      hideControlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 2000); // Slightly shorter delay when pressing play
    }
  };

  const toggleMute = () => {
    if (!player || typeof player.mute !== 'function') return;
    if (isMuted) {
      player.unMute();
      player.setVolume(volume);
      setIsMuted(false);
    } else {
      player.mute();
      setIsMuted(true);
    }
  };

  const handleVolumeChange = (e) => {
    if (!player || typeof player.setVolume !== 'function') return;
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);
    player.setVolume(newVolume);
    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      player.unMute();
      setIsMuted(false);
    }
  };

  const toggleFullscreen = () => {
    if (!videoContainerRef.current) return;

    const elem = videoContainerRef.current;
    const iframe = elem.querySelector('iframe');
    const isCurrentlyFullscreen = document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement;

    // Check device type
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isAndroid = /Android/i.test(navigator.userAgent);
    const isMobileDevice = isIOS || isAndroid || /webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // If currently in fullscreen, exit
    if (isCurrentlyFullscreen || isMobileFullscreen) {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
      // Reset CSS fullscreen state
      setIsMobileFullscreen(false);
      setIsFullscreen(false);
      isFullscreenRef.current = false;
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.documentElement.classList.remove('mobile-fullscreen-active');
      if (screen.orientation && screen.orientation.unlock) {
        screen.orientation.unlock();
      }
      return;
    }

    // On iOS, try to use the native video fullscreen (webkitEnterFullscreen)
    // This gives TRUE fullscreen without browser chrome
    if (isIOS && iframe) {
      try {
        // Try to access the video element inside the iframe
        // Note: This only works if the iframe allows it (same-origin or allowfullscreen)
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        const video = iframeDoc?.querySelector('video');
        if (video && video.webkitEnterFullscreen) {
          video.webkitEnterFullscreen();
          setIsFullscreen(true);
          isFullscreenRef.current = true;
          return;
        }
      } catch (e) {
        // Cross-origin iframe, can't access video element directly
        console.log('Cannot access iframe video element, trying alternative methods');
      }

      // Alternative: Try iframe webkitRequestFullscreen
      if (iframe.webkitRequestFullscreen) {
        iframe.webkitRequestFullscreen();
        setIsFullscreen(true);
        isFullscreenRef.current = true;
        return;
      }
    }

    // On Android, try container fullscreen (usually works well)
    if (isAndroid) {
      const requestFs = elem.requestFullscreen || elem.webkitRequestFullscreen;
      if (requestFs) {
        requestFs.call(elem).then(() => {
          setIsFullscreen(true);
          isFullscreenRef.current = true;
          if (screen.orientation && screen.orientation.lock) {
            screen.orientation.lock('landscape').catch(() => {});
          }
        }).catch(() => {
          // Fallback to CSS
          activateCSSFullscreen();
        });
        return;
      }
    }

    // Desktop or fallback
    const requestFs = elem.requestFullscreen || elem.webkitRequestFullscreen || elem.mozRequestFullScreen || elem.msRequestFullscreen;
    if (requestFs) {
      requestFs.call(elem).then(() => {
        setIsFullscreen(true);
        isFullscreenRef.current = true;
      }).catch(() => {
        if (isMobileDevice) {
          activateCSSFullscreen();
        }
      });
    } else if (isMobileDevice) {
      activateCSSFullscreen();
    }
  };

  const activateCSSFullscreen = () => {
    setIsMobileFullscreen(true);
    setIsFullscreen(true);
    isFullscreenRef.current = true;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.classList.add('mobile-fullscreen-active');
    if (screen.orientation && screen.orientation.lock) {
      screen.orientation.lock('landscape').catch(() => {});
    }
    window.scrollTo(0, 1);
  };

  const handleSeek = (e) => {
    if (!player || !duration || typeof player.seekTo !== 'function') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;
    player.seekTo(newTime, true);
    setCurrentTime(newTime);
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopySuccess(true);
      setTimeout(() => {
        setCopySuccess(false);
        setShowShareMenu(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const shareToSocial = (platform) => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`Regardez "${videoTitle}" sur KracRadio`);

    const shareUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      twitter: `https://twitter.com/intent/tweet?url=${url}&text=${text}`,
      whatsapp: `https://wa.me/?text=${text}%20${url}`,
      telegram: `https://t.me/share/url?url=${url}&text=${text}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`
    };

    if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
      setShowShareMenu(false);
    }
  };

  return (
    <div
      ref={videoContainerRef}
      className={`relative w-full bg-black ${
        isMobileFullscreen
          ? 'fixed inset-0 z-[9999] aspect-auto mobile-fullscreen-container'
          : 'aspect-video'
      }`}
      style={isMobileFullscreen ? { width: '100vw', height: '100vh' } : {}}
      onMouseMove={handleMouseMove}
      onTouchStart={handleMouseMove}
    >
      <div id={playerId} className="w-full h-full"></div>

      {/* Custom Black Bar - Shows for 5 seconds then disappears */}
      {showTopBar && videoTitle && (
        <div
          className={`absolute top-0 left-0 right-0 bg-black/95 backdrop-blur-sm transition-opacity duration-500 z-50 ${
            showTopBarState ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div className="flex items-center justify-between px-6 py-3">
            {/* Left: Logo */}
            <div className="flex-shrink-0">
              <img
                src="/images/logos/krac-short_red_white.png"
                alt="KracRadio"
                className="h-8 object-contain"
              />
            </div>

            {/* Center/Right: Video Title */}
            <div className="flex-1 px-6">
              <h2 className="text-white text-sm md:text-base font-semibold line-clamp-1">
                {videoTitle}
              </h2>
            </div>

            {/* Right: Share Button with Menu */}
            <div className="flex-shrink-0 relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowShareMenu(!showShareMenu);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-white text-sm font-medium transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
                </svg>
                <span className="hidden sm:inline">Partager</span>
              </button>

              {/* Share Menu Dropdown */}
              {showShareMenu && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-gray-900 rounded-lg shadow-xl border border-gray-700 overflow-hidden z-50">
                  {/* Copy Link */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyLink();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 text-white text-sm transition-colors"
                  >
                    {copySuccess ? (
                      <>
                        <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                        <span className="text-green-400">Lien copié !</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                        </svg>
                        <span>Copier le lien</span>
                      </>
                    )}
                  </button>

                  <div className="h-px bg-gray-700"></div>

                  {/* Facebook */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      shareToSocial('facebook');
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 text-white text-sm transition-colors"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    <span>Facebook</span>
                  </button>

                  {/* Twitter / X */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      shareToSocial('twitter');
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 text-white text-sm transition-colors"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                    <span>Twitter / X</span>
                  </button>

                  {/* WhatsApp */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      shareToSocial('whatsapp');
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 text-white text-sm transition-colors"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                    <span>WhatsApp</span>
                  </button>

                  {/* Telegram */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      shareToSocial('telegram');
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 text-white text-sm transition-colors"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                    </svg>
                    <span>Telegram</span>
                  </button>

                  {/* LinkedIn */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      shareToSocial('linkedin');
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 text-white text-sm transition-colors"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                    <span>LinkedIn</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hide YouTube endscreen suggestions */}
      <div
        className={`absolute bottom-0 left-0 right-0 h-72 bg-gradient-to-t from-black via-black to-transparent pointer-events-none z-15 transition-opacity duration-200 ${
          showOverlay ? 'opacity-100' : 'opacity-0'
        }`}
      ></div>

      {/* KracRadio Logo */}
      <div
        className={`absolute bottom-0 left-0 right-0 flex items-end justify-center pb-20 pointer-events-none z-25 transition-all duration-500 ${
          !isPlaying ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
        }`}
      >
        <img
          src="/logo-white.png"
          alt="KracRadio"
          className="h-16 object-contain drop-shadow-2xl"
        />
      </div>

      {/* Invisible overlay to toggle play/pause */}
      <div
        className="absolute inset-0 cursor-pointer z-20"
        onClick={togglePlay}
      ></div>

      {/* Custom Controls Overlay */}
      <div className={`absolute inset-0 transition-opacity duration-300 pointer-events-none z-30 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
        <div className={`video-controls-wrapper absolute bottom-0 left-0 right-0 pointer-events-auto z-40 ${isMobileFullscreen ? 'p-6 pb-16' : 'p-4'}`}>
          {/* Progress Bar */}
          <div className="mb-3">
            <div
              onClick={handleSeek}
              className="relative w-full h-1 bg-white/30 rounded-full cursor-pointer hover:h-1.5 transition-all group/progress"
            >
              <div
                className="absolute top-0 left-0 h-full bg-red-600 rounded-full transition-all"
                style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }}
              ></div>
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity shadow-lg"
                style={{ left: duration ? `${(currentTime / duration) * 100}%` : '0%' }}
              ></div>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Play/Pause */}
              <button
                onClick={togglePlay}
                className={`flex items-center justify-center rounded-full hover:bg-white/10 text-white transition-colors ${isMobileFullscreen ? 'w-14 h-14' : 'w-10 h-10'}`}
              >
                {isPlaying ? (
                  <svg className={isMobileFullscreen ? "w-8 h-8" : "w-6 h-6"} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                  </svg>
                ) : (
                  <svg className={`ml-0.5 ${isMobileFullscreen ? "w-8 h-8" : "w-6 h-6"}`} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                )}
              </button>

              {/* Volume */}
              <div
                className="relative flex items-center"
                onMouseEnter={() => setShowVolumeSlider(true)}
                onMouseLeave={() => setShowVolumeSlider(false)}
              >
                <button
                  onClick={toggleMute}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 text-white transition-colors"
                >
                  {isMuted || volume === 0 ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                    </svg>
                  ) : volume < 50 ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M7 9v6h4l5 5V4l-5 5H7z"/>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                    </svg>
                  )}
                </button>
                <div className={`absolute left-12 bottom-0 transition-all duration-200 ${showVolumeSlider ? 'opacity-100 w-24' : 'opacity-0 w-0 pointer-events-none'}`}>
                  <div className="flex items-center h-10 bg-black/90 rounded px-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={volume}
                      onChange={handleVolumeChange}
                      className="w-full h-1 bg-white/30 rounded-full appearance-none cursor-pointer
                        [&::-webkit-slider-thumb]:appearance-none
                        [&::-webkit-slider-thumb]:w-3
                        [&::-webkit-slider-thumb]:h-3
                        [&::-webkit-slider-thumb]:rounded-full
                        [&::-webkit-slider-thumb]:bg-white
                        [&::-webkit-slider-thumb]:cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, white ${volume}%, rgba(255,255,255,0.3) ${volume}%)`
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Time */}
              <span className="text-sm text-white font-medium ml-2">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-1">
              {/* Like Button */}
              {onLike && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onLike();
                  }}
                  disabled={loadingLike}
                  className={`flex items-center gap-2 px-3 py-2 rounded-full transition-colors ${
                    liked
                      ? 'bg-white text-black'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                  title="Like"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                  <span className="text-sm font-medium">{likeCount}</span>
                </button>
              )}

              {/* Skip Button */}
              {onSkip && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSkip(isFullscreen);
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                  title="Skip"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                    <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
                  </svg>
                  <span className="text-sm font-medium hidden sm:inline">Skip</span>
                </button>
              )}

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className={`flex items-center justify-center rounded-full hover:bg-white/10 text-white transition-colors ${isMobileFullscreen ? 'w-14 h-14' : 'w-10 h-10'}`}
              >
                {isFullscreen ? (
                  <svg className={isMobileFullscreen ? "w-7 h-7" : "w-5 h-5"} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
                  </svg>
                ) : (
                  <svg className={isMobileFullscreen ? "w-7 h-7" : "w-5 h-5"} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
