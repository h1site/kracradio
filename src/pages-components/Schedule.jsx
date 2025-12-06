'use client';
// src/pages/Schedule.jsx
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useI18n } from '../i18n';
import { channels } from '../data/channels';
import { useUI } from '../context/UIContext';
import { fmtTime } from '../utils/azura';

const KRAC_KEY = 'kracradio';

// Mapping des noms de playlists AzuraCast vers les images (Unsplash)
const PLAYLIST_IMAGES = {
  // Electronic / EDM
  'electronic music': 'https://images.unsplash.com/photo-1720048169707-a32d6dfca0b3?w=800&h=600&fit=crop',
  'electronic': 'https://images.unsplash.com/photo-1720048169707-a32d6dfca0b3?w=800&h=600&fit=crop',
  'electro': 'https://images.unsplash.com/photo-1720048169707-a32d6dfca0b3?w=800&h=600&fit=crop',

  // Jazz
  'jazz & instrumental': 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800&h=600&fit=crop',
  'jazz instrumental': 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800&h=600&fit=crop',
  'jazz': 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800&h=600&fit=crop',

  // Franco / Quebec
  'franco matin': 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&h=600&fit=crop',
  'francophonie': 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&h=600&fit=crop',
  'musique québec': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=600&fit=crop',
  'musique quebec': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=600&fit=crop',
  'québec': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=600&fit=crop',
  'quebec': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=600&fit=crop',

  // Rock / Folk
  'soft rock et folk': 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800&h=600&fit=crop',
  'soft rock': 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800&h=600&fit=crop',
  'folk': 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800&h=600&fit=crop',
  'rock alternatif': 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=800&h=600&fit=crop',
  'alternative rock': 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=800&h=600&fit=crop',
  'rock': 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=800&h=600&fit=crop',

  // Indie
  'indie pop rock': 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&h=600&fit=crop',
  'indie pop': 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&h=600&fit=crop',
  'indie rock': 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&h=600&fit=crop',
  'indie': 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&h=600&fit=crop',

  // Hip-Hop
  'hip-hop': 'https://images.unsplash.com/photo-1547355253-ff0740f6e8c1?w=800&h=600&fit=crop',
  'hip hop': 'https://images.unsplash.com/photo-1547355253-ff0740f6e8c1?w=800&h=600&fit=crop',
  'rap': 'https://images.unsplash.com/photo-1547355253-ff0740f6e8c1?w=800&h=600&fit=crop',

  // Post-punk / Cold Wave
  'post-punk & cold wave': 'https://images.unsplash.com/photo-1598387993441-a364f854c3e1?w=800&h=600&fit=crop',
  'post-punk': 'https://images.unsplash.com/photo-1598387993441-a364f854c3e1?w=800&h=600&fit=crop',
  'cold wave': 'https://images.unsplash.com/photo-1598387993441-a364f854c3e1?w=800&h=600&fit=crop',
  'coldwave': 'https://images.unsplash.com/photo-1598387993441-a364f854c3e1?w=800&h=600&fit=crop',

  // Electro Pop
  'electro pop rock': 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&h=600&fit=crop',
  'electro pop': 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&h=600&fit=crop',

  // Gothic / EBM / Industrial
  'gothic moose': 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=800&h=600&fit=crop',
  'gothic': 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=800&h=600&fit=crop',
  'ebm industrial': 'https://images.unsplash.com/photo-1504898770365-14faca6a7320?w=800&h=600&fit=crop',
  'ebm': 'https://images.unsplash.com/photo-1504898770365-14faca6a7320?w=800&h=600&fit=crop',
  'industrial': 'https://images.unsplash.com/photo-1504898770365-14faca6a7320?w=800&h=600&fit=crop',

  // Metal
  'metal': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=600&fit=crop',
};

// Noms des jours de la semaine
const WEEKDAYS = {
  fr: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  es: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
};

function getPlaylistImage(title, fallbackImage) {
  const key = (title || '').toLowerCase().trim();
  if (PLAYLIST_IMAGES[key]) return PLAYLIST_IMAGES[key];
  for (const [k, v] of Object.entries(PLAYLIST_IMAGES)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  return fallbackImage;
}

function fmtRange(start, end, lang) {
  return `${fmtTime(start, lang)} — ${fmtTime(end, lang)}`;
}

// Get date for a specific day offset (0 = today, 1 = tomorrow, etc.)
function getDateForOffset(offset) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  date.setHours(0, 0, 0, 0);
  return date;
}

export default function Schedule() {
  const { lang, t } = useI18n();
  const { isDesktop, sidebarOpen, sidebarWidth } = useUI();
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDayOffset, setSelectedDayOffset] = useState(0); // 0 = today

  const containerStyle = {
    paddingLeft: isDesktop ? (sidebarOpen ? sidebarWidth + 32 : 32) : 32,
    paddingRight: isDesktop ? 32 : 32,
    transition: 'padding-left 300ms ease',
  };

  const krac = useMemo(() => channels.find((c) => c.key === KRAC_KEY), []);
  const kracImage = krac?.image || '/channels/kracradio.webp';

  // Load schedule for selected day
  const loadSchedule = useCallback(async () => {
    try {
      setLoading(true);

      // Calculate start and end dates for the selected day
      const startDate = getDateForOffset(selectedDayOffset);
      const endDate = getDateForOffset(selectedDayOffset + 1);

      const params = new URLSearchParams({
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      });

      const scheduleUrl = `https://stream.kracradio.com/api/station/1/schedule?${params}`;
      const response = await fetch(scheduleUrl, { cache: 'no-store' });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const rawData = await response.json();

      if (rawData && rawData.length > 0) {
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
        setSegments([]);
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching schedule:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedDayOffset, kracImage]);

  useEffect(() => {
    loadSchedule();
    const interval = setInterval(loadSchedule, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadSchedule]);

  // Now & Next - use null initially to avoid hydration mismatch
  const [now, setNow] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const { current, next } = useMemo(() => {
    // Only show current/next for today
    if (selectedDayOffset !== 0) return { current: null, next: null };

    const playing = segments.find(s => s.isPlaying);
    if (playing) {
      const playingIdx = segments.indexOf(playing);
      return {
        current: playing,
        next: segments[playingIdx + 1] || null
      };
    }
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
  }, [segments, now, selectedDayOffset]);

  // Generate day labels
  const dayLabels = useMemo(() => {
    if (!mounted) return [];
    const weekdays = WEEKDAYS[lang] || WEEKDAYS.en;
    return [-1, 0, 1, 2, 3, 4, 5, 6].map(offset => {
      const date = getDateForOffset(offset);
      const dayName = weekdays[date.getDay()];
      const dayNum = date.getDate();
      const isToday = offset === 0;
      const isYesterday = offset === -1;
      const isTomorrow = offset === 1;

      let label = dayName;
      if (isToday) label = t?.schedule?.today || "Aujourd'hui";
      else if (isYesterday) label = t?.schedule?.yesterday || 'Hier';
      else if (isTomorrow) label = t?.schedule?.tomorrow || 'Demain';

      return { offset, label, dayName, dayNum, isToday };
    });
  }, [mounted, lang, t]);

  const selectedDayLabel = useMemo(() => {
    if (!mounted) return '';
    const date = getDateForOffset(selectedDayOffset);
    return new Intl.DateTimeFormat(lang, {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    }).format(date);
  }, [mounted, lang, selectedDayOffset]);

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
          {selectedDayLabel && (
            <p className="text-lg text-gray-200 font-semibold mt-4 capitalize">
              {selectedDayLabel}
            </p>
          )}
        </div>
      </header>

      {/* Day selector */}
      {mounted && (
        <div className="mb-6 -mx-2 overflow-x-auto">
          <div className="flex gap-2 px-2 pb-2 min-w-max">
            {dayLabels.map(({ offset, label, dayNum, isToday }) => (
              <button
                key={offset}
                onClick={() => setSelectedDayOffset(offset)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  selectedDayOffset === offset
                    ? 'bg-red-600 text-white shadow-lg'
                    : isToday
                    ? 'bg-red-600/20 text-red-500 hover:bg-red-600/30'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <span className="block">{label}</span>
                <span className="block text-xs opacity-70">{dayNum}</span>
              </button>
            ))}
          </div>
        </div>
      )}

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
            {t?.schedule?.errorLoading || "Impossible de charger l'horaire"}
          </p>
        </div>
      )}

      {/* No schedule */}
      {!loading && !error && segments.length === 0 && (
        <div className="text-center py-20">
          <p className="text-gray-500 dark:text-gray-400">
            {t?.schedule?.noSchedule || "Aucun programme prévu pour cette journée"}
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
                      <span className="inline-block px-3 py-1.5 rounded-full bg-red-600 text-white text-xs font-bold uppercase tracking-wider animate-pulse">
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
