/**
 * KracRadio Embeddable Widget
 * Usage: <script src="https://kracradio.com/embed.js" data-channel="kracradio"></script>
 *
 * Options (data attributes):
 * - data-channel: Channel key (kracradio, ebm_industrial, electro, francophonie, jazz, metal, rock) or "all"
 * - data-theme: "dark" or "light" (default: dark)
 * - data-width: Width in pixels (default: 400)
 */
(function() {
  'use strict';

  const CHANNELS = {
    kracradio: {
      name: 'KracRadio',
      stream: 'https://stream.kracradio.com/listen/kracradio/radio.mp3',
      api: 'https://stream.kracradio.com/api/nowplaying/1',
      frequency: '101.5',
      color: '#dc2626'
    },
    ebm_industrial: {
      name: 'EBM Industrial',
      stream: 'https://stream.kracradio.com/listen/ebm_industrial/radio.mp3',
      api: 'https://stream.kracradio.com/api/nowplaying/4',
      frequency: '95.7',
      color: '#7c3aed'
    },
    electro: {
      name: 'Electro',
      stream: 'https://stream.kracradio.com/listen/electro/radio.mp3',
      api: 'https://stream.kracradio.com/api/nowplaying/7',
      frequency: '98.3',
      color: '#0ea5e9'
    },
    francophonie: {
      name: 'Francophonie',
      stream: 'https://stream.kracradio.com/listen/franco/radio.mp3',
      api: 'https://stream.kracradio.com/api/nowplaying/6',
      frequency: '103.7',
      color: '#0284c7'
    },
    jazz: {
      name: 'Jazz',
      stream: 'https://stream.kracradio.com/listen/jazz/radio.mp3',
      api: 'https://stream.kracradio.com/api/nowplaying/2',
      frequency: '89.1',
      color: '#d97706'
    },
    metal: {
      name: 'Metal',
      stream: 'https://stream.kracradio.com/listen/metal/radio.mp3',
      api: 'https://stream.kracradio.com/api/nowplaying/5',
      frequency: '106.9',
      color: '#374151'
    },
    rock: {
      name: 'Rock',
      stream: 'https://stream.kracradio.com/listen/rock/radio.mp3',
      api: 'https://stream.kracradio.com/api/nowplaying/8',
      frequency: '97.5',
      color: '#b91c1c'
    }
  };

  const CHANNEL_KEYS = Object.keys(CHANNELS);

  class KracRadioWidget {
    constructor(container, options) {
      this.container = container;
      this.options = {
        channel: options.channel || 'kracradio',
        theme: options.theme || 'dark',
        width: parseInt(options.width) || 400
      };

      this.isAllChannels = this.options.channel === 'all';
      this.selectedChannel = this.isAllChannels ? 'kracradio' : this.options.channel;
      this.currentIndex = CHANNEL_KEYS.indexOf(this.selectedChannel);
      this.audio = null;
      this.playing = false;
      this.volume = 75;
      this.nowPlaying = { title: '', artist: '', art: '' };

      this.init();
    }

    init() {
      this.render();
      this.fetchNowPlaying();
      this.pollInterval = setInterval(() => this.fetchNowPlaying(), 5000);
    }

    get channel() {
      return CHANNELS[this.selectedChannel] || CHANNELS.kracradio;
    }

    get isDark() {
      return this.options.theme === 'dark';
    }

    async fetchNowPlaying() {
      try {
        const res = await fetch(this.channel.api, { cache: 'no-store' });
        const data = await res.json();
        const song = data?.now_playing?.song || {};
        this.nowPlaying = {
          title: song.title || this.channel.name,
          artist: song.artist || 'Live Radio',
          art: song.art || ''
        };
        this.updateDisplay();
      } catch (e) {
        console.error('[KracRadio] Error fetching now playing:', e);
      }
    }

    togglePlay() {
      if (!this.audio) {
        this.audio = new Audio(this.channel.stream);
        this.audio.volume = this.volume / 100;
      }

      if (this.playing) {
        this.audio.pause();
        this.playing = false;
      } else {
        if (this.audio.src !== this.channel.stream) {
          this.audio.src = this.channel.stream;
        }
        this.audio.play();
        this.playing = true;
      }
      this.updateDisplay();
    }

    changeChannel(direction) {
      const newIndex = direction === 'next'
        ? Math.min(this.currentIndex + 1, CHANNEL_KEYS.length - 1)
        : Math.max(this.currentIndex - 1, 0);

      this.selectedChannel = CHANNEL_KEYS[newIndex];
      this.currentIndex = newIndex;

      if (this.audio) {
        this.audio.src = this.channel.stream;
        if (this.playing) {
          this.audio.play();
        }
      }

      this.fetchNowPlaying();
      this.updateDisplay();
    }

    setVolume(val) {
      this.volume = val;
      if (this.audio) {
        this.audio.volume = val / 100;
      }
      this.updateDisplay();
    }

    updateDisplay() {
      const titleEl = this.container.querySelector('.krac-title');
      const artistEl = this.container.querySelector('.krac-artist');
      const artEl = this.container.querySelector('.krac-art');
      const playBtn = this.container.querySelector('.krac-play-btn');
      const liveIndicator = this.container.querySelector('.krac-live');
      const channelName = this.container.querySelector('.krac-channel-name');
      const frequency = this.container.querySelector('.krac-frequency');
      const volumeSlider = this.container.querySelector('.krac-volume');
      const volumeText = this.container.querySelector('.krac-volume-text');
      const prevBtn = this.container.querySelector('.krac-prev');
      const nextBtn = this.container.querySelector('.krac-next');

      if (titleEl) titleEl.textContent = this.nowPlaying.title;
      if (artistEl) artistEl.textContent = this.nowPlaying.artist;
      if (artEl) artEl.src = this.nowPlaying.art || 'https://kracradio.com/icon.png';
      if (channelName) {
        channelName.textContent = this.channel.name;
        channelName.style.color = this.channel.color;
      }
      if (frequency) frequency.textContent = this.channel.frequency + ' MHz';
      if (volumeSlider) volumeSlider.value = this.volume;
      if (volumeText) volumeText.textContent = this.volume + '%';

      if (playBtn) {
        playBtn.innerHTML = this.playing ? this.pauseIcon() : this.playIcon();
      }

      if (liveIndicator) {
        liveIndicator.style.display = this.playing ? 'inline-block' : 'none';
      }

      if (prevBtn) {
        prevBtn.disabled = this.currentIndex === 0;
        prevBtn.style.opacity = this.currentIndex === 0 ? '0.3' : '1';
        prevBtn.style.cursor = this.currentIndex === 0 ? 'not-allowed' : 'pointer';
      }

      if (nextBtn) {
        nextBtn.disabled = this.currentIndex === CHANNEL_KEYS.length - 1;
        nextBtn.style.opacity = this.currentIndex === CHANNEL_KEYS.length - 1 ? '0.3' : '1';
        nextBtn.style.cursor = this.currentIndex === CHANNEL_KEYS.length - 1 ? 'not-allowed' : 'pointer';
      }
    }

    playIcon() {
      return '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
    }

    pauseIcon() {
      return '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>';
    }

    render() {
      const width = this.options.width;
      const isDark = this.isDark;

      this.container.innerHTML = `
        <div class="krac-widget" style="
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: ${isDark ? '#121212' : '#f5f5f5'};
          color: ${isDark ? '#ffffff' : '#1a1a1a'};
          width: ${width}px;
          padding: 16px;
          box-sizing: border-box;
          border-radius: 12px;
          border: 1px solid ${isDark ? '#333' : '#ddd'};
        ">
          <!-- Main Content -->
          <div style="display: flex; gap: 14px;">
            <!-- Cover Art -->
            <div style="position: relative; width: 90px; height: 90px; flex-shrink: 0;">
              <img
                class="krac-art"
                src="${this.nowPlaying.art || 'https://kracradio.com/icon.png'}"
                alt="Cover"
                onerror="this.src='https://kracradio.com/icon.png'"
                style="
                  width: 100%;
                  height: 100%;
                  border-radius: 8px;
                  object-fit: cover;
                "
              />
              ${this.isAllChannels ? `
                <button class="krac-prev" style="
                  position: absolute;
                  left: 2px;
                  top: 50%;
                  transform: translateY(-50%);
                  width: 22px;
                  height: 22px;
                  border: none;
                  border-radius: 50%;
                  background: rgba(0,0,0,0.7);
                  color: white;
                  cursor: pointer;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 12px;
                ">&lsaquo;</button>
                <button class="krac-next" style="
                  position: absolute;
                  right: 2px;
                  top: 50%;
                  transform: translateY(-50%);
                  width: 22px;
                  height: 22px;
                  border: none;
                  border-radius: 50%;
                  background: rgba(0,0,0,0.7);
                  color: white;
                  cursor: pointer;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 12px;
                ">&rsaquo;</button>
              ` : ''}
            </div>

            <!-- Track Info + Controls -->
            <div style="flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center;">
              <!-- Channel + Frequency -->
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                <span class="krac-channel-name" style="
                  font-size: 10px;
                  font-weight: 600;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                  color: ${isDark ? '#999' : '#666'};
                ">${this.channel.name}</span>
                <span class="krac-frequency" style="
                  font-size: 9px;
                  font-family: monospace;
                  color: ${isDark ? '#666' : '#999'};
                  letter-spacing: 1px;
                ">${this.channel.frequency} MHz</span>
                <span class="krac-live" style="
                  width: 5px;
                  height: 5px;
                  border-radius: 50%;
                  background: #22c55e;
                  display: none;
                  animation: krac-pulse 2s infinite;
                "></span>
              </div>

              <!-- Title -->
              <div class="krac-title" style="
                font-size: 14px;
                font-weight: bold;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                margin-bottom: 2px;
                color: ${isDark ? '#fff' : '#1a1a1a'};
              ">${this.nowPlaying.title}</div>

              <!-- Artist -->
              <div class="krac-artist" style="
                font-size: 12px;
                color: ${isDark ? '#888' : '#666'};
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                margin-bottom: 10px;
              ">${this.nowPlaying.artist}</div>

              <!-- Controls -->
              <div style="display: flex; align-items: center; gap: 10px;">
                <!-- Play/Pause -->
                <button class="krac-play-btn" style="
                  width: 36px;
                  height: 36px;
                  border: none;
                  border-radius: 50%;
                  background: ${isDark ? '#fff' : '#1a1a1a'};
                  color: ${isDark ? '#1a1a1a' : '#fff'};
                  cursor: pointer;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  flex-shrink: 0;
                ">${this.playIcon()}</button>

                <!-- Volume -->
                <div style="display: flex; align-items: center; gap: 6px; flex: 1;">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="${isDark ? '#666' : '#999'}">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
                  </svg>
                  <input
                    type="range"
                    class="krac-volume"
                    min="0"
                    max="100"
                    value="${this.volume}"
                    style="
                      flex: 1;
                      height: 3px;
                      -webkit-appearance: none;
                      appearance: none;
                      background: ${isDark ? '#333' : '#ddd'};
                      border-radius: 2px;
                      outline: none;
                      cursor: pointer;
                    "
                  />
                  <span class="krac-volume-text" style="font-size: 9px; color: ${isDark ? '#666' : '#999'}; width: 26px;">
                    ${this.volume}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer with backlink -->
          <div style="
            margin-top: 10px;
            padding-top: 8px;
            border-top: 1px solid ${isDark ? '#333' : '#ddd'};
            display: flex;
            align-items: center;
            justify-content: space-between;
          ">
            <a
              href="https://kracradio.com"
              target="_blank"
              style="
                display: flex;
                align-items: center;
                gap: 6px;
                color: ${isDark ? '#888' : '#666'};
                text-decoration: none;
                font-size: 10px;
                font-weight: 500;
              "
            >
              <img src="https://kracradio.com/icon.png" alt="KracRadio" style="width: 16px; height: 16px; border-radius: 3px;" />
              KracRadio
            </a>
            <a
              href="https://kracradio.com"
              target="_blank"
              style="
                color: ${isDark ? '#666' : '#999'};
                text-decoration: none;
                font-size: 9px;
              "
            >
              Ouvrir le site &rarr;
            </a>
          </div>
        </div>

        <style>
          @keyframes krac-pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.4; }
          }
          .krac-widget input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 10px;
            height: 10px;
            background: ${isDark ? '#fff' : '#1a1a1a'};
            border-radius: 50%;
            cursor: pointer;
          }
          .krac-widget input[type="range"]::-moz-range-thumb {
            width: 10px;
            height: 10px;
            background: ${isDark ? '#fff' : '#1a1a1a'};
            border-radius: 50%;
            cursor: pointer;
            border: none;
          }
        </style>
      `;

      // Bind events
      const playBtn = this.container.querySelector('.krac-play-btn');
      const volumeSlider = this.container.querySelector('.krac-volume');
      const prevBtn = this.container.querySelector('.krac-prev');
      const nextBtn = this.container.querySelector('.krac-next');

      if (playBtn) playBtn.addEventListener('click', () => this.togglePlay());
      if (volumeSlider) volumeSlider.addEventListener('input', (e) => this.setVolume(parseInt(e.target.value)));
      if (prevBtn) prevBtn.addEventListener('click', () => this.changeChannel('prev'));
      if (nextBtn) nextBtn.addEventListener('click', () => this.changeChannel('next'));

      this.updateDisplay();
    }

    destroy() {
      if (this.pollInterval) clearInterval(this.pollInterval);
      if (this.audio) {
        this.audio.pause();
        this.audio = null;
      }
    }
  }

  // Auto-initialize widgets
  function initWidgets() {
    const scripts = document.querySelectorAll('script[src*="embed.js"]');

    scripts.forEach(script => {
      // Skip if already initialized
      if (script.dataset.initialized) return;
      script.dataset.initialized = 'true';

      const container = document.createElement('div');
      container.className = 'kracradio-widget-container';
      script.parentNode.insertBefore(container, script.nextSibling);

      new KracRadioWidget(container, {
        channel: script.dataset.channel || 'kracradio',
        theme: script.dataset.theme || 'dark',
        width: script.dataset.width || '400'
      });
    });
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidgets);
  } else {
    initWidgets();
  }

  // Expose for manual initialization
  window.KracRadioWidget = KracRadioWidget;
})();
