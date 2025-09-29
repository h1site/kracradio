export async function getNowPlaying(apiUrl) {
const res = await fetch(apiUrl, { cache: 'no-store' });
if (!res.ok) throw new Error('AzuraCast API error');
const data = await res.json();
// Typical schema: data.now_playing.song.title / artist / art
const now = data.now_playing || data.nowPlaying || data;
const song = now.song || {};
return {
title: song.title || '—',
artist: song.artist || '—',
art: song.art || song.album_art || null,
listeners: (now.listeners && (now.listeners.total || now.listeners.current)) || null
};
}


export async function getHistory(apiUrl, take = 10) {
const res = await fetch(apiUrl, { cache: 'no-store' });
if (!res.ok) throw new Error('AzuraCast API error');
const data = await res.json();
// Many instances expose recent song history under data.song_history
const history = data.song_history || data.recent || [];
return history.slice(0, take).map((h) => ({
title: h.song?.title || '—',
artist: h.song?.artist || '—',
played_at: h.played_at || h.timestamp || null,
art: h.song?.art || null
}));
}