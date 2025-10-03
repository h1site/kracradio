// src/pages/Spotify.jsx
import React, { useEffect, useMemo, useState } from 'react';
import Seo from '../seo/Seo';
import { useI18n } from '../i18n';

import {
  spotifyItems,
  toSpotifyHref,
  toSpotifyEmbedSrc,
  toOEmbedUrl
} from '../data/playlists.js';

// --- oEmbed pour récupérer title/thumbnail/author sans token ---
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
    return () => { aborted = true; };
  }, [items]);

  return meta;
}

function SidebarItem({ active, meta, onClick }) {
  const title = meta?.data?.title || 'Spotify';
  const author = meta?.data?.author_name || '';
  const thumb = meta?.data?.thumbnail_url || '';

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'w-full text-left px-3 py-2 rounded-lg transition',
        active
          ? 'bg-black/5 dark:bg-white/10'
          : 'hover:bg-black/5 dark:hover:bg-white/5'
      ].join(' ')}
    >
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-md overflow-hidden bg-black/5 dark:bg-white/5 shrink-0">
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
          <div className="text-sm font-semibold truncate">{title}</div>
          {author ? (
            <div className="text-xs opacity-70 truncate">{author}</div>
          ) : null}
        </div>
      </div>
    </button>
  );
}

export default function SpotifyPage() {
  const { lang } = useI18n();

  const L = useMemo(() => {
    const fr = {
      title: 'Playlists',
      subtitle: 'Suivez et partagez nos playlists Spotify.',
      open: 'Ouvrir dans Spotify',
      share: 'Partager',
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

  const list = Array.isArray(spotifyItems) ? spotifyItems : [];
  const metaMap = useOEmbedData(list);

  // Sélection desktop (par défaut la première)
  const [selectedKey, setSelectedKey] = useState(() => list[0]?.key || '');
  useEffect(() => {
    if (!list.find((x) => x.key === selectedKey)) {
      setSelectedKey(list[0]?.key || '');
    }
  }, [list, selectedKey]);

  const selected = list.find((x) => x.key === selectedKey) || null;
  const embedSrc = selected ? toSpotifyEmbedSrc(selected.url) : '';

  return (
    <div className="page-scroll pl-14 pr-2 pt-0">
      <Seo title={L.title} description={L.subtitle} />

      {/* en-tête identique à Horaire (s’appuie sur pl-14 global pour le chevron) */}
      <header className="mb-4 md:mb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight uppercase">
          {L.title}
        </h1>
        <p className="mt-1 text-sm opacity-80">{L.subtitle}</p>
      </header>

      {list.length === 0 ? (
        <div className="text-sm opacity-70">{L.empty}</div>
      ) : (
        <>
          {/* ====== MOBILE & TABLET (lg:hidden) — LISTE SANS SÉLECTEUR ====== */}
          <div className="lg:hidden space-y-5">
            {list.map((it) => {
              const m = metaMap[it.key];
              const title = m?.data?.title || 'Spotify';
              const author = m?.data?.author_name || '';
              const href = toSpotifyHref(it.url);
              const src = toSpotifyEmbedSrc(it.url);

              return (
                <section
                  key={it.key}
                  className="
                    rounded-2xl border border-black/10 dark:border-white/10
                    bg-white/80 dark:bg-zinc-900/70 backdrop-blur
                    shadow-sm overflow-hidden
                  "
                >
                  {/* En-tête compact */}
                  <div className="px-4 pt-4 pb-2">
                    <div className="text-base font-semibold">{title}</div>
                    {author ? (
                      <div className="text-xs opacity-70">{author}</div>
                    ) : null}
                  </div>

                  {/* Iframe : hauteur fixe confortable */}
                  <div className="w-full">
                    <iframe
                      title={`Spotify ${title}`}
                      src={src}
                      className="w-full"
                      style={{ height: 560, border: 0 }}
                      frameBorder="0"
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                      loading="lazy"
                    />
                  </div>

                  {/* Actions — espace au-dessus conforme à ta demande précédente */}
                  <div className="px-4 pb-4 mt-3 flex items-center gap-3">
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-lg border border-emerald-400/30 hover:bg-emerald-400/10 transition"
                    >
                      {L.open}
                    </a>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-lg border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition"
                      onClick={async () => {
                        try {
                          if (navigator.share) {
                            await navigator.share({
                              title,
                              text: author || 'Spotify',
                              url: href
                            });
                          } else {
                            await navigator.clipboard.writeText(href);
                            alert('Lien copié dans le presse-papiers.');
                          }
                        } catch {
                          // ignore
                        }
                      }}
                    >
                      {L.share}
                    </button>
                  </div>
                </section>
              );
            })}
          </div>

          {/* ====== DESKTOP (lg:flex) — 2 BLOCS PLEIN ÉCRAN (comme Horaire) ====== */}
          <div className="hidden lg:flex flex-row gap-4">
            {/* BLOC 1 : Sidebar listes (scrollable vertical) */}
            <aside
              className="
                lg:w-80
                rounded-2xl border border-neutral-800
                bg-white/80 dark:bg-zinc-900/70 backdrop-blur
                shadow-sm
                h-[calc(100vh-128px)] overflow-y-auto
                p-3
              "
            >
              <div className="space-y-2">
                {list.map((item) => (
                  <SidebarItem
                    key={item.key}
                    active={item.key === selectedKey}
                    meta={metaMap[item.key]}
                    onClick={() => setSelectedKey(item.key)}
                  />
                ))}
              </div>
            </aside>

            {/* BLOC 2 : Contenu principal (iframe pleine hauteur, pas coupée) */}
            <main className="flex-1 min-w-0">
              <div
                className="
                  rounded-2xl border border-neutral-800
                  bg-white/80 dark:bg-zinc-900/70 backdrop-blur
                  shadow-sm
                  h-[calc(100vh-128px)] overflow-hidden
                "
              >
                {embedSrc ? (
                  <iframe
                    title="Spotify Playlist"
                    src={embedSrc}
                    className="w-full h-full"
                    frameBorder="0"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                    style={{ border: 0 }}
                  />
                ) : null}
              </div>

              {/* Actions sous le player */}
              {selected ? (
                <div className="mt-3 flex items-center gap-2">
                  <a
                    href={toSpotifyHref(selected.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-lg border border-emerald-400/30 hover:bg-emerald-400/10 transition"
                  >
                    {L.open}
                  </a>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-lg border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition"
                    onClick={async () => {
                      try {
                        const meta = metaMap[selected.key]?.data;
                        const title = meta?.title || 'Spotify';
                        const author = meta?.author_name || 'Spotify';
                        const url = toSpotifyHref(selected.url);

                        if (navigator.share) {
                          await navigator.share({
                            title,
                            text: author,
                            url
                          });
                        } else {
                          await navigator.clipboard.writeText(url);
                          alert('Lien copié dans le presse-papiers.');
                        }
                      } catch {
                        // ignore
                      }
                    }}
                  >
                    {L.share}
                  </button>
                </div>
              ) : null}
            </main>
          </div>

          {/* Espace bas pour un player fixe */}
          <div className="pb-14" aria-hidden="true" />
        </>
      )}
    </div>
  );
}
