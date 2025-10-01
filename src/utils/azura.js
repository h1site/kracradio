// src/utils/azura.js

// ────────────────────────────────────────────────────────────────
// Fetch helper (timeout + cache no-store)
// ────────────────────────────────────────────────────────────────
async function getJSON(url, { timeout = 8000, signal } = {}) {
  const controller = !signal ? new AbortController() : null;
  const t = !signal ? setTimeout(() => controller.abort(), timeout) : null;

  try {
    const res = await fetch(url, {
      cache: 'no-store',
      signal: signal ?? controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    if (t) clearTimeout(t);
  }
}

// ────────────────────────────────────────────────────────────────
// Now playing + historiques
// ────────────────────────────────────────────────────────────────

/** Now Playing depuis un endpoint AzuraCast /api/nowplaying/:id */
export async function getNowPlaying(apiUrl) {
  try {
    const data = await getJSON(apiUrl);
    const np = data?.now_playing ?? data?.nowPlaying ?? data;
    const song = np?.song ?? {};
    return {
      title: song?.title ?? np?.title ?? '',
      artist: song?.artist ?? np?.artist ?? '',
      art: song?.art ?? np?.art ?? '',
      raw: data,
    };
  } catch {
    return null;
  }
}

/** Dernières pistes jouées (song_history) */
export async function getRecentTracks(apiUrl, limit = 10) {
  try {
    const data = await getJSON(apiUrl);
    const arr = data?.song_history ?? data?.songHistory ?? [];
    return arr.slice(0, limit).map((item) => ({
      title: item?.song?.title ?? '',
      artist: item?.song?.artist ?? '',
      art: item?.song?.art ?? '',
    }));
  } catch {
    return [];
  }
}

// ────────────────────────────────────────────────────────────────
// Outils URL / station
// ────────────────────────────────────────────────────────────────

/** Déduit origin + stationId depuis une URL /api/nowplaying/:id */
export function parseApiOriginAndStationId(apiUrl) {
  const u = new URL(apiUrl);
  const segments = u.pathname.split('/').filter(Boolean); // ['api','nowplaying','1']
  const idStr = segments[2];
  const stationId = Number.parseInt(idStr, 10);
  return { origin: u.origin, stationId };
}

/** Récupère le slug public depuis /listen/:slug/radio.mp3 (optionnel) */
export function stationPublicSlugFromStreamUrl(streamUrl) {
  try {
    const u = new URL(streamUrl);
    const parts = u.pathname.split('/').filter(Boolean); // ['listen','slug','radio.mp3']
    return parts[1] || null;
  } catch {
    return null;
  }
}

// ────────────────────────────────────────────────────────────────
/**
 * Horaire temps réel AzuraCast sur une fenêtre [aujourd’hui 00:00 → +days].
 * On accepte soit un objet channel (avec .apiUrl) soit directement l’apiUrl.
 * Retourne une liste normalisée avec dates JS.
 */
export async function fetchStationSchedule(channelOrApiUrl, days = 2) {
  try {
    const apiUrl = typeof channelOrApiUrl === 'string'
      ? channelOrApiUrl
      : channelOrApiUrl.apiUrl;

    const { origin, stationId } = parseApiOriginAndStationId(apiUrl);

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + days);

    const qs = new URLSearchParams({
      start: start.toISOString(),
      end: end.toISOString(),
    }).toString();

    // Certaines versions utilisent /schedule, d’autres /schedules
    const tries = [
      `${origin}/api/station/${stationId}/schedule?${qs}`,
      `${origin}/api/station/${stationId}/schedules?${qs}`,
    ];

    let raw = null;
    for (const url of tries) {
      try {
        raw = await getJSON(url);
        if (raw) break;
      } catch {
        /* continue */
      }
    }
    if (!raw) return [];

    return normalizeSchedule(raw);
  } catch {
    return [];
  }
}

// ────────────────────────────────────────────────────────────────
// Normalisation Horaire + helpers d’affichage
// ────────────────────────────────────────────────────────────────

/**
 * Normalise l’horaire quelle que soit la forme :
 * items -> { id, title, description, start:Date, end:Date, isPlaying:boolean, type }
 */
export function normalizeSchedule(items) {
  if (!Array.isArray(items)) return [];
  return items
    .map((it, idx) => {
      const startIso = it.start || it.start_time || it.start_at || it.start_timestamp;
      const endIso   = it.end   || it.end_time   || it.end_at   || it.end_timestamp;

      const start =
        typeof startIso === 'number' ? new Date(startIso * 1000) : new Date(startIso);
      const end =
        typeof endIso === 'number' ? new Date(endIso * 1000) : new Date(endIso);

      if (isNaN(start?.getTime()) || isNaN(end?.getTime())) return null;

      return {
        id: it.id ?? idx,
        title: it.title || it.name || it.program || it.playlist || 'Programme',
        description: it.description || '',
        start,
        end,
        isPlaying: Boolean(it.is_playing ?? it.isPlaying ?? false),
        type: it.type || it.category || 'playlist',
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.start - b.start);
}

/** Item en cours et suivant */
export function pickCurrentAndNext(items, now = new Date()) {
  let current = null;
  let next = null;

  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    if (now >= it.start && now < it.end) {
      current = it;
      next = items[i + 1] || null;
      break;
    }
    if (now < it.start) {
      current = null;
      next = it;
      break;
    }
  }
  return { current, next };
}

/** Groupage par jour YYYY-MM-DD */
export function groupByDay(items) {
  const by = {};
  for (const it of items) {
    const key = it.start.toISOString().slice(0, 10);
    (by[key] ||= []).push(it);
  }
  return by;
}

/** hh:mm local */
export function fmtTime(d, lang = 'fr') {
  try {
    return new Intl.DateTimeFormat(lang, { hour: '2-digit', minute: '2-digit' }).format(d);
  } catch {
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  }
}

/** mm:ss pour le player */
export function mmss(sec) {
  if (sec == null || isNaN(sec)) return '--:--';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
