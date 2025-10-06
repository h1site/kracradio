// src/pages/Articles.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Seo from '../seo/Seo';
import { listPublishedArticles } from '../lib/articles';
import { useI18n } from '../i18n';

const STRINGS = {
  fr: {
    metaTitle: 'Articles — KracRadio',
    metaDesc: 'Découvrez nos articles sur la musique, la culture et l\'actualité musicale.',
    heroBadge: 'Articles',
    heroTitle: 'Articles',
    heroSubtitle: 'Découvrez nos derniers articles sur la musique, la culture et l\'actualité musicale.',
    loading: 'Chargement en cours...',
    empty: 'Aucun article publié pour le moment.',
    readMore: 'Lire la suite',
  },
  en: {
    metaTitle: 'Articles — KracRadio',
    metaDesc: 'Discover our articles about music, culture and music news.',
    heroBadge: 'Articles',
    heroTitle: 'Articles',
    heroSubtitle: 'Discover our latest articles about music, culture and music news.',
    loading: 'Loading...',
    empty: 'No published articles yet.',
    readMore: 'Read more',
  },
  es: {
    metaTitle: 'Artículos — KracRadio',
    metaDesc: 'Descubre nuestros artículos sobre música, cultura y actualidad musical.',
    heroBadge: 'Artículos',
    heroTitle: 'Artículos',
    heroSubtitle: 'Descubre nuestros últimos artículos sobre música, cultura y actualidad musical.',
    loading: 'Cargando...',
    empty: 'No hay artículos publicados todavía.',
    readMore: 'Leer más',
  },
};

export default function Articles() {
  const { lang } = useI18n();
  const L = useMemo(() => STRINGS[lang] || STRINGS.fr, [lang]);

  const [rows, setRows] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await listPublishedArticles({ limit: 20 });
        if (mounted) {
          setRows(data || []);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error loading articles:', error);
        if (mounted) {
          setRows([]);
          setLoading(false);
        }
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <main className="container-max pr-[30px] pl-[20px]">
      <Seo
        lang={lang}
        title={L.metaTitle}
        description={L.metaDesc}
        path="/articles"
        type="website"
      />

      <header className="pb-12">
        <span className="inline-flex items-center rounded-full border border-red-600/40 bg-red-600/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-red-700 dark:text-red-300">
          {L.heroBadge}
        </span>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-black dark:text-white md:text-5xl">
          {L.heroTitle}
        </h1>
        <p className="mt-4 max-w-3xl text-base text-gray-700 dark:text-gray-300 md:text-lg">
          {L.heroSubtitle}
        </p>
      </header>

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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {rows.map((article) => {
            let excerpt = article.excerpt || '';
            // si excerpt vide mais content JSON, essaye d'en tirer l'excerpt de la langue active
            if (!excerpt && typeof article.content === 'string' && article.content.trim().startsWith('{')) {
              try {
                const p = JSON.parse(article.content);
                excerpt = p?.[lang]?.excerpt || '';
              } catch {/* ignore */}
            }

            return (
              <article
                key={article.slug}
                className="rounded-3xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md dark:border-gray-800 dark:bg-gray-950 overflow-hidden"
              >
                {article.cover_url && (
                  <div className="aspect-video w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <img
                      src={article.cover_url}
                      alt={article.title}
                      className="h-full w-full object-cover transition hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                )}

                <div className="p-6">
                  <h3 className="text-xl font-semibold text-black dark:text-white mb-3">
                    <Link
                      to={`/article/${article.slug}`}
                      className="hover:text-red-600 dark:hover:text-red-400 transition"
                    >
                      {article.title}
                    </Link>
                  </h3>

                  {excerpt && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                      {excerpt}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    {article.published_at && (
                      <time
                        dateTime={article.published_at}
                        className="text-xs text-gray-500 dark:text-gray-500"
                      >
                        {new Date(article.published_at).toLocaleDateString(lang, {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </time>
                    )}

                    <Link
                      to={`/article/${article.slug}`}
                      className="inline-flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition"
                    >
                      {L.readMore}
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                        <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
                      </svg>
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
