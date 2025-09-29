// src/utils/azura.js
export async function getNowPlaying(apiUrl) {
  try {
    const res = await fetch(apiUrl, { cache: 'no-store' });
    const data = await res.json();
    // AzuraCast typical shape: { now_playing: { song: { title, artist, art } }, ... }
    const np = data?.now_playing;
    const title = np?.song?.title || data?.song?.title || '';
    const artist = np?.song?.artist || data?.song?.artist || '';
    const art = np?.song?.art || data?.song?.art || '';
    return { title, artist, art };
  } catch {
    return null;
  }
}

export async function getRecentTracks(apiUrl, limit = 10) {
  try {
    const res = await fetch(apiUrl, { cache: 'no-store' });
    const data = await res.json();
    // AzuraCast has "song_history": [{ song: { title, artist, art } }, ...]
    const arr = data?.song_history || [];
    return arr.slice(0, limit).map((item) => ({
      title: item?.song?.title || '',
      artist: item?.song?.artist || '',
      art: item?.song?.art || '',
    }));
  } catch {
    return [];
  }
}
