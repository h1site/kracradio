'use client';
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
  const safe = Array.isArray(items) ? items : [];
  const [meta, setMeta] = useState(() =>
    Object.fromEntries(safe.map((i) => [i.key, { loading: true }]))
  );

  useEffect(() => {
    let aborted = false;
    async function load() {
      const entries = await Promise.all(
        safe.map(async (it) => {
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
    if (safe.length) load();
    return () => { aborted = true; };
  }, [safe]);

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

  const [selectedKey, setSelectedKey] = useState(() => list[0]?.key || '');
  useEffect(() => {
    if (!list.find((x) => x.key === selectedKey)) {
      setSelectedKey(list[0]?.key || '');
    }
  }, [list, selectedKey]);

  const selected = list.find((x) => x.key === selectedKey) || null;
  const embedSrc = selected ? toSpotifyEmbedSrc(selected.url) : '';

  return (
    <main className="container-max pr-[30px] pl-[20px]">
      <Seo
        lang={lang}
        title={`${L.title} — KracRadio`}
        description={L.subtitle}
        path="/spotify"
        type="website"
      />

      <header className="relative -mx-8 -mt-8 mb-8 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1484755560615-a4c64e778a6c?w=1200&h=400&fit=crop&auto=format&q=80"
            alt="Playlists"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent"></div>
        </div>
        <div className="relative pl-[60px] md:pl-[100px] pr-8 py-16 md:py-24">
          <span className="inline-flex items-center rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-red-300">
            Playlists
          </span>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-white md:text-6xl">
            {L.title}
          </h1>
          <p className="mt-4 max-w-3xl text-lg text-gray-200">
            {L.subtitle}
          </p>
        </div>
      </header>

      {list.length === 0 ? (
        <div className="rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-gray-800 dark:bg-gray-950">
          <p className="text-base text-gray-600 dark:text-gray-400">{L.empty}</p>
        </div>
      ) : (
        <>
          {/* ====== MOBILE & TABLET — LISTE SANS SÉLECTEUR ====== */}
          <div className="lg:hidden space-y-5">
            {list.map((it) => {
              const m = metaMap[it.key];
              const title = m?.data?.title || 'Spotify';
              const src = toSpotifyEmbedSrc(it.url);

              return (
                <section
                  key={it.key}
                  className="rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-950 overflow-hidden"
                >
                  <div className="px-4 pt-4 pb-2">
                    <div className="text-base font-semibold text-black dark:text-white">{title}</div>
                  </div>
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
                </section>
              );
            })}
          </div>

          {/* ====== DESKTOP — 2 BLOCS ====== */}
          <div className="hidden lg:grid lg:grid-cols-[320px,1fr] gap-6">
            <aside className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950 max-h-[calc(100vh-200px)] overflow-y-auto">
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

            <div className="rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-950 overflow-hidden">
              {embedSrc ? (
                <iframe
                  title="Spotify Playlist"
                  src={embedSrc}
                  className="w-full h-[calc(100vh-200px)]"
                  frameBorder="0"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                  style={{ border: 0 }}
                />
              ) : null}
            </div>
          </div>
        </>
      )}
    </main>
  );
}
