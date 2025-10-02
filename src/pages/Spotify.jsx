// src/pages/Playlists.jsx
import React, { useEffect, useMemo, useState } from 'react';
import Seo from '../seo/Seo';
import { useI18n } from '../i18n';

// IMPORTANT : on lit maintenant la data depuis src/data/spotify.js
// et on importe avec l'extension .js (puisque ton fichier est bien .js)
import {
  spotifyItems,
  toSpotifyHref,
  toSpotifyEmbedSrc,
  toOEmbedUrl
} from '../data/playlists.js';

// Même look que précédemment (cartes sobres)
const EMBED_HEIGHT = 352;
const GRID_CLASSES =
  'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6';
const FRAME_CLASSES = `
  group relative overflow-hidden rounded-2xl
  border border-black/10 dark:border-white/10
  bg-white/80 dark:bg-zinc-900/70 backdrop-blur
  shadow-sm transition hover:shadow-lg
`;

// oEmbed Spotify pour récupérer title/thumbnail/author sans token
function useOEmbedData(items) {
  const [meta, setMeta] = useState(() =>
    Object.fromEntries((items || []).map((i) => [i.key, { loading: true }]))
  );

  useEffect(() => {
    let aborted = false;

    async function load() {
      const entries = await Promise.all(
        (items || []).map(async (it) => {
          try {
            const res = await fetch(toOEmbedUrl(it.url), { cache: 'no-store' });
            const data = await res.json();
            return [it.key, { loading: false, ok: true, data }];
          } catch (e) {
            return [it.key, { loading: false, ok: false, error: String(e) }];
          }
        })
      );

      if (!aborted) {
        setMeta((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
      }
    }

    load();
    return () => {
      aborted = true;
    };
  }, [items]);

  return meta;
}

function PlaylistCard({ item, meta, labels }) {
  const href = toSpotifyHref(item.url);
  const src = toSpotifyEmbedSrc(item.url);

  const title = meta?.data?.title || 'Spotify';
  const author = meta?.data?.author_name || '';
  const thumb = meta?.data?.thumbnail_url || '';

  return (
    <article className={FRAME_CLASSES}>
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-black/5 dark:border-white/10">
        <div className="relative w-12 h-12 rounded-md overflow-hidden bg-black/5 dark:bg-white/5 shrink-0">
          {thumb ? (
            <img
              src={thumb}
              alt={title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full" />
          )}
        </div>

        <div className="min-w-0">
          <h2 className="text-sm font-semibold truncate">{title}</h2>
          {author ? (
            <p className="text-xs opacity-70 truncate">{author}</p>
          ) : null}
        </div>
      </div>

      {/* Embed */}
      <div className="p-4">
        <iframe
          title={title}
          src={src}
          width="100%"
          height={EMBED_HEIGHT}
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          className="rounded-xl w-full"
          style={{ border: 0 }}
        />
      </div>

      {/* Actions */}
      <div className="px-4 pb-4 flex items-center gap-2">
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-lg border border-emerald-400/30 hover:bg-emerald-400/10 transition"
          aria-label={labels.open}
          title={labels.open}
        >
          {labels.open}
        </a>

        <button
          type="button"
          className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-lg border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition"
          onClick={async () => {
            try {
              if (navigator.share) {
                await navigator.share({
                  title,
                  text: author ? `${title} — ${author}` : title,
                  url: href
                });
              } else {
                await navigator.clipboard.writeText(href);
                alert('Lien copié dans le presse-papiers.');
              }
            } catch {
              // cancel/error ignoré
            }
          }}
          aria-label={labels.share}
          title={labels.share}
        >
          {labels.share}
        </button>
      </div>
    </article>
  );
}

export default function Playlists() {
  const { lang } = useI18n();

  // Libellés
  const L = useMemo(() => {
    const fr = {
      title: 'Playlists',
      subtitle: 'Suivez et partagez nos playlists Spotify.',
      open: 'Open in Spotify',
      share: 'Share',
      empty: 'Aucune playlist à afficher.'
    };
    const en = {
      title: 'Playlists',
      subtitle: 'Follow and share our Spotify playlists.',
      open: 'Open in Spotify',
      share: 'Share',
      empty: 'No playlist to display.'
    };
    return lang === 'fr' ? fr : en;
  }, [lang]);

  // ✅ Sécurise la liste pour éviter l’erreur “reading map of undefined”
  const list = Array.isArray(spotifyItems) ? spotifyItems : [];

  // oEmbed pour tuiles (title/thumbnail/author)
  const metaMap = useOEmbedData(list);

  return (
    <div className="px-5 py-6 md:py-8 overflow-y-auto">
      <Seo title={L.title} description={L.subtitle} />

      <div className="max-w-6xl mx-auto">
        <header className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            {L.title}
          </h1>
          <p className="mt-1 text-sm opacity-80">{L.subtitle}</p>
        </header>

        {/* Empty state propre si la liste est vide */}
        {list.length === 0 ? (
          <div className="text-sm opacity-70">{L.empty}</div>
        ) : (
          <section className={GRID_CLASSES}>
            {list.map((item) => (
              <PlaylistCard
                key={item.key}
                item={item}
                meta={metaMap[item.key]}
                labels={{ open: L.open, share: L.share }}
              />
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
