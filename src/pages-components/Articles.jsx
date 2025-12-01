'use client';
// src/pages/Articles.jsx
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Seo from '../seo/Seo';
import { listPublishedArticles } from '../lib/articles';
import { useI18n } from '../i18n';
import GoogleAd from '../components/ads/GoogleAd';
import { useUI } from '../context/UIContext';
import { collectionPageSchema, breadcrumbSchema } from '../seo/schemas';

const STRINGS = {
  fr: {
    metaTitle: 'Articles — KracRadio',
    metaDesc: 'Découvrez nos articles sur la musique, la culture et l\'actualité musicale.',
    heroBadge: 'Blogue',
    heroTitle: 'Articles',
    heroSubtitle: 'Découvrez nos derniers articles sur la musique, la culture et l\'actualité musicale.',
    loading: 'Chargement en cours...',
    empty: 'Aucun article publié pour le moment.',
    readMore: 'Lire la suite',
    by: 'Par',
    defaultTag: 'Article',
  },
  en: {
    metaTitle: 'Articles — KracRadio',
    metaDesc: 'Discover our articles about music, culture and music news.',
    heroBadge: 'Blog',
    heroTitle: 'Articles',
    heroSubtitle: 'Discover our latest articles about music, culture and music news.',
    loading: 'Loading...',
    empty: 'No published articles yet.',
    readMore: 'Read more',
    by: 'By',
    defaultTag: 'Article',
  },
  es: {
    metaTitle: 'Artículos — KracRadio',
    metaDesc: 'Descubre nuestros artículos sobre música, cultura y actualidad musical.',
    heroBadge: 'Blog',
    heroTitle: 'Artículos',
    heroSubtitle: 'Descubre nuestros últimos artículos sobre música, cultura y actualidad musical.',
    loading: 'Cargando...',
    empty: 'No hay artículos publicados todavía.',
    readMore: 'Leer más',
    by: 'Por',
    defaultTag: 'Artículo',
  },
};

export default function Articles() {
  const { lang } = useI18n();
  const L = useMemo(() => STRINGS[lang] || STRINGS.fr, [lang]);
  const { isDesktop, sidebarOpen, sidebarWidth } = useUI();

  const [rows, setRows] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        console.log('Fetching published articles...');
        const data = await listPublishedArticles({ limit: 20 });
        console.log('Articles data received:', data);
        if (mounted) {
          // Sort by published_at descending (newest first)
          const sorted = (data || []).sort((a, b) => {
            const dateA = new Date(a.published_at || a.created_at);
            const dateB = new Date(b.published_at || b.created_at);
            return dateB - dateA; // Newest first
          });
          setRows(sorted);
          setLoading(false);
          setError(null);
        }
      } catch (err) {
        console.error('Error loading articles:', err);
        console.error('Error details:', err.message, err.details);
        if (mounted) {
          setRows([]);
          setLoading(false);
          setError(err.message || 'Failed to load articles');
        }
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <>
      <Seo
        lang={lang}
        title={L.metaTitle}
        description={L.metaDesc}
        path="/articles"
        type="website"
        jsonLd={[
          collectionPageSchema(L.heroTitle, L.metaDesc, '/articles', rows?.length || 0),
          breadcrumbSchema([
            { name: 'Accueil', url: '/' },
            { name: L.heroTitle }
          ])
        ]}
      />

      <div className="min-h-screen bg-white dark:bg-black">
        {/* Full-screen header */}
        <header
          className="relative w-full overflow-hidden"
          style={{
            marginLeft: isDesktop && sidebarOpen ? -sidebarWidth : 0,
            width: isDesktop && sidebarOpen ? `calc(100% + ${sidebarWidth}px)` : '100%',
            transition: 'margin-left 300ms ease, width 300ms ease'
          }}
        >
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1471107340929-a87cd0f5b5f3?w=1200&h=400&fit=crop&auto=format&q=80"
              alt="Articles"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent"></div>
          </div>
          <div
            className="relative py-16 md:py-24"
            style={{
              marginLeft: isDesktop && sidebarOpen ? sidebarWidth : 0,
              transition: 'margin-left 300ms ease'
            }}
          >
            <div className="max-w-4xl pl-[60px] md:pl-[100px] pr-8">
              <span className="inline-flex items-center rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-red-300">
                {L.heroBadge}
              </span>
              <h1 className="mt-4 text-4xl md:text-6xl font-black uppercase text-white">
                {L.heroTitle}
              </h1>
              <p className="mt-4 max-w-3xl text-lg text-gray-200">
                {L.heroSubtitle}
              </p>
            </div>
          </div>
        </header>

        <main className="px-[5px] py-12">

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
          <p className="font-semibold">Error loading articles:</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-red-600 border-r-transparent"></div>
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">{L.loading}</p>
          </div>
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-gray-800 dark:bg-gray-950">
          <p className="text-base text-gray-600 dark:text-gray-400">{L.empty}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-16">
            {rows.map((article, index) => {
              let excerpt = article.excerpt || '';
              if (!excerpt && typeof article.content === 'string' && article.content.trim().startsWith('{')) {
                try {
                  const p = JSON.parse(article.content);
                  excerpt = p?.[lang]?.excerpt || '';
                } catch {/* ignore */}
              }
              const imageUrl = article.featured_image || article.cover_url;

              if (index === 0) {
                const publishDate = article.published_at ? new Date(article.published_at).toLocaleDateString(lang, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : '';

                return (
                  <React.Fragment key={article.slug}>
                    <article className="group md:col-span-2 lg:col-span-3 relative rounded-2xl overflow-hidden shadow-lg">
                      <Link href={`/article/${article.slug}`} className="block">
                        <div className="h-96">
                          {imageUrl && (
                            <img
                              src={imageUrl}
                              alt={article.title}
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                        </div>
                        <div className="absolute bottom-0 left-0 p-5 text-white">
                          {/* Author info */}
                          <div className="flex items-center gap-3 mb-4">
                            {article.author_avatar && (
                              <img
                                src={article.author_avatar}
                                alt={article.author_name || 'Author'}
                                className="w-10 h-10 rounded-full object-cover border-2 border-white/20"
                              />
                            )}
                            <div className="text-sm">
                              <div className="font-semibold text-white">
                                {article.author_name || 'Auteur'}
                              </div>
                              {publishDate && (
                                <div className="text-gray-300 text-xs">
                                  {publishDate}
                                </div>
                              )}
                            </div>
                          </div>

                          <h2 className="text-4xl font-black leading-tight drop-shadow-lg mb-2 group-hover:text-red-400 transition-colors">
                            {article.title}
                          </h2>
                          <p className="text-gray-300 line-clamp-2">{excerpt}</p>
                        </div>
                      </Link>
                    </article>
                  </React.Fragment>
                )
              }

              return (
                <article key={article.slug} className="group relative rounded-2xl overflow-hidden shadow-lg bg-white dark:bg-gray-800">
                   <Link href={`/article/${article.slug}`} className="block">
                    {imageUrl && (
                      <div className="aspect-video w-full overflow-hidden">
                        <img
                          src={imageUrl}
                          alt={article.title}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />
                      </div>
                    )}
                    <div className="p-5">
                      {/* Author info */}
                      {article.author_name && (
                        <div className="flex items-center gap-2 mb-2">
                          {article.author_avatar && (
                            <img
                              src={article.author_avatar}
                              alt={article.author_name}
                              className="w-6 h-6 rounded-full object-cover border border-gray-200 dark:border-gray-700"
                            />
                          )}
                          <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                            {article.author_name}
                          </div>
                        </div>
                      )}
                      <h2 className="text-xl font-bold mb-2 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors leading-tight">
                        {article.title}
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-3">
                        {excerpt}
                      </p>
                    </div>
                  </Link>
                </article>
              );
            })}
          </div>

          <div className="pb-10">
            <GoogleAd slot="3411355648" className="mx-auto max-w-4xl" />
          </div>
        </>
      )}
        </main>
      </div>
    </>
  );
}
