// src/data/playlists.js
// Liste des playlists Spotify (tu peux en ajouter)
export const spotifyItems = [
  {
    key: 'tabarnak', // ex. Tabarnak de Playlist
    url: 'https://open.spotify.com/playlist/5kpNtVHlJweiibnBmd49Qo'
  },
  {
    key: 'mix-2',
    url: 'https://open.spotify.com/playlist/4J7FhpRSL8sm3KElDf3QGa'
  },
  {
    key: 'mix-3',
    url: 'https://open.spotify.com/playlist/4t214XxynortGAYpm3kl6x'
  }
];

// Helpers
export function parseSpotifyIdFromUrl(u) {
  try {
    const url = new URL(u);
    const [, type, id] = url.pathname.split('/'); // /playlist/{id}
    return { type, id: id?.split('?')[0] || '' };
  } catch {
    return { type: '', id: '' };
  }
}

export function toSpotifyHref(u) {
  // Renvoie l'URL d'origine pour ouvrir dans Spotify
  return u;
}

export function toSpotifyEmbedSrc(u) {
  const { type, id } = parseSpotifyIdFromUrl(u);
  if (!type || !id) return '';
  // L'iframe occupe 100% de la hauteur du conteneur,
  // et c'est l'embed Spotify qui scrolle (pas coupé).
  return `https://open.spotify.com/embed/${type}/${id}?utm_source=generator`;
}

// Endpoint oEmbed (pas de token)
export function toOEmbedUrl(u) {
  return `https://open.spotify.com/oembed?url=${encodeURIComponent(u)}`;
}
