'use client';
// src/pages/Schedule.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useI18n } from '../i18n';
import { channels } from '../data/channels';
import { useUI } from '../context/UIContext';
import { fetchStationSchedule, pickCurrentAndNext, fmtTime } from '../utils/azura';

const KRAC_KEY = 'kracradio';

// Mapping des noms de playlists AzuraCast vers les images
const PLAYLIST_IMAGES = {
  'electronic music': '/schedule/electronic-music.webp',
  'electronic': '/schedule/electronic-music.webp',
  'electro': '/schedule/electronic-music.webp',
  'jazz & instrumental': '/schedule/jazz-instrumental.webp',
  'jazz instrumental': '/schedule/jazz-instrumental.webp',
  'jazz': '/schedule/jazz-instrumental.webp',
  'franco matin': '/schedule/franco-matin.webp',
  'francophonie': '/schedule/franco-matin.webp',
  'soft rock et folk': '/schedule/soft-rock-et-folk.webp',
  'soft rock': '/schedule/soft-rock-et-folk.webp',
  'folk': '/schedule/soft-rock-et-folk.webp',
  'rock alternatif': '/schedule/rock-alternatif.webp',
  'alternative rock': '/schedule/rock-alternatif.webp',
  'indie pop rock': '/schedule/indie-pop-rock.webp',
  'indie pop': '/schedule/indie-pop-rock.webp',
  'indie rock': '/schedule/indie-pop-rock.webp',
  'hip-hop': '/schedule/hip-hop.webp',
  'hip hop': '/schedule/hip-hop.webp',
  'rap': '/schedule/hip-hop.webp',
  'post-punk & cold wave': '/schedule/post-punk-cold-wave.webp',
  'post-punk': '/schedule/post-punk-cold-wave.webp',
  'cold wave': '/schedule/post-punk-cold-wave.webp',
  'coldwave': '/schedule/post-punk-cold-wave.webp',
  'electro pop rock': '/schedule/electro-pop-rock.webp',
  'electro pop': '/schedule/electro-pop-rock.webp',
  'musique québec': '/schedule/musique-quebec.webp',
  'musique quebec': '/schedule/musique-quebec.webp',
  'québec': '/schedule/musique-quebec.webp',
  'quebec': '/schedule/musique-quebec.webp',
  'ebm industrial': '/schedule/ebm-industrial.webp',
  'ebm': '/schedule/ebm-industrial.webp',
  'industrial': '/schedule/ebm-industrial.webp',
  'gothic moose': '/schedule/ebm-industrial.webp',
  'metal': '/schedule/metal.webp',
  'rock': '/schedule/rock.webp',
};

function getPlaylistImage(title, fallbackImage) {
  const key = (title || '').toLowerCase().trim();
  // Cherche une correspondance exacte ou partielle
  if (PLAYLIST_IMAGES[key]) return PLAYLIST_IMAGES[key];
  for (const [k, v] of Object.entries(PLAYLIST_IMAGES)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  return fallbackImage;
}

function fmtRange(start, end, lang) {
  return `${fmtTime(start, lang)} — ${fmtTime(end, lang)}`;
}

export default function Schedule() {
  const { lang, t } = useI18n();
  const { isDesktop, sidebarOpen, sidebarWidth } = useUI();
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const containerStyle = {
    paddingLeft: isDesktop ? (sidebarOpen ? sidebarWidth + 32 : 32) : 32,
    paddingRight: isDesktop ? 32 : 32,
    transition: 'padding-left 300ms ease',
  };

  const krac = useMemo(() => channels.find((c) => c.key === KRAC_KEY), []);
  const kracImage = krac?.image || '/channels/kracradio.webp';
  const kracApiUrl = krac?.apiUrl;

  // Fetch schedule directly from AzuraCast API (simpler, returns current day schedule)
  useEffect(() => {
    async function loadSchedule() {
      if (!kracApiUrl) {
        setError('No API URL configured');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Call AzuraCast schedule API directly (without date params = today's schedule)
        const scheduleUrl = 'https://stream.kracradio.com/api/station/1/schedule';
        const response = await fetch(scheduleUrl, { cache: 'no-store' });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const rawData = await response.json();

        if (rawData && rawData.length > 0) {
          // Normaliser et ajouter les images aux segments
          const withImages = rawData.map((it, idx) => {
            const start = new Date(it.start);
            const end = new Date(it.end);
            return {
              id: it.id || `${start.toISOString()}-${idx}`,
              title: it.title || it.name || 'Programme',
              description: it.description || '',
              start,
              end,
              isPlaying: Boolean(it.is_now),
              image: getPlaylistImage(it.title || it.name, kracImage),
            };
          }).sort((a, b) => a.start - b.start);

          setSegments(withImages);
          setError(null);
        } else {
          setError('No schedule data available');
        }
      } catch (err) {
        console.error('Error fetching schedule:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadSchedule();
    // Refresh every 5 minutes
    const interval = setInterval(loadSchedule, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [kracApiUrl, kracImage]);

  // Now & Next - use null initially to avoid hydration mismatch
  const [now, setNow] = useState(null);
  const [todayLabel, setTodayLabel] = useState('');

  // Set initial values on client only
  useEffect(() => {
    setNow(new Date());
    setTodayLabel(new Intl.DateTimeFormat(lang, {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    }).format(new Date()));

    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, [lang]);

  const { current, next } = useMemo(() => {
    // D'abord chercher celui qui a is_now = true (from API)
    const playing = segments.find(s => s.isPlaying);
    if (playing) {
      const playingIdx = segments.indexOf(playing);
      return {
        current: playing,
        next: segments[playingIdx + 1] || null
      };
    }
    // Sinon, calculer basé sur l'heure (si now est disponible)
    if (!now) return { current: null, next: null };

    let cur = null;
    let nxt = null;
    for (let i = 0; i < segments.length; i++) {
      const s = segments[i];
      if (now >= s.start && now < s.end) {
        cur = s;
        nxt = segments[i + 1] || null;
        break;
      }
      if (now < s.start) {
        nxt = s;
        break;
      }
    }
    return { current: cur, next: nxt };
  }, [segments, now]);

  return (
    <div style={containerStyle} className="min-h-screen">
      {/* En-tête */}
      <header className="relative -mx-8 -mt-8 mb-8 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&h=400&fit=crop&auto=format&q=80"
            alt="Schedule"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent"></div>
        </div>
        <div className="relative pl-[60px] md:pl-[100px] pr-8 py-16 md:py-24">
          <h1 className="text-4xl md:text-6xl font-black uppercase text-white">
            {t?.nav?.schedule || 'Horaire'}
          </h1>
          {todayLabel && (
            <p className="text-lg text-gray-200 font-semibold mt-4">
              {todayLabel}
            </p>
          )}
        </div>
      </header>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full"></div>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="text-center py-20">
          <p className="text-red-500 mb-4">{error}</p>
          <p className="text-gray-500 dark:text-gray-400">
            {t?.schedule?.errorLoading || 'Impossible de charger l\'horaire'}
          </p>
        </div>
      )}

      {/* Grille d'horaire */}
      {!loading && !error && segments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-6">
          {segments.map((it) => {
            const isCurrent = current?.id === it.id;
            const isNext = next?.id === it.id;

            return (
              <article
                key={it.id}
                className={`group relative rounded-2xl overflow-hidden shadow-lg transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl ${
                  isCurrent ? 'ring-4 ring-red-500' : 'ring-1 ring-black/10'
                }`}
              >
                <div className="relative h-80">
                  <img
                    src={it.image}
                    alt={it.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

                  {isCurrent && (
                    <div className="absolute top-4 right-4">
                      <span className="inline-block px-3 py-1.5 rounded-full bg-red-600 text-white text-xs font-bold uppercase tracking-wider">
                        {t?.schedule?.nowPlaying || 'En direct'}
                      </span>
                    </div>
                  )}

                  {isNext && !isCurrent && (
                    <div className="absolute top-4 right-4">
                      <span className="inline-block px-3 py-1.5 rounded-full bg-white text-black text-xs font-bold uppercase tracking-wider">
                        {t?.schedule?.upNext || 'À suivre'}
                      </span>
                    </div>
                  )}

                  <div className="absolute left-5 right-5 bottom-5 text-white">
                    <p className="font-semibold text-red-400 mb-1">
                      {fmtRange(it.start, it.end, lang)}
                    </p>
                    <h3 className="text-2xl font-black uppercase mb-2 drop-shadow-lg">
                      {it.title}
                    </h3>
                    {it.description && (
                      <p className="text-white/80 text-sm line-clamp-2">
                        {it.description}
                      </p>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Info bas de page */}
      <div className="pb-8">
        <div className="rounded-xl bg-neutral-100 dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 p-5">
          <h3 className="text-sm font-bold dark:text-white uppercase mb-2">
            {t?.nav?.channels || 'Chaînes spécialisées'}
          </h3>
          <p className="text-sm text-black/70 dark:text-white/70">
            {t?.schedule?.otherAreRotation ||
              'Les autres chaînes spécialisées sont en rotation musicale 24/7.'}
          </p>
        </div>
      </div>

      {/* Cale mobile pour le player */}
      <div
        className="sm:hidden"
        style={{ height: 'calc(120px + env(safe-area-inset-bottom, 0px))' }}
      />
    </div>
  );
}
