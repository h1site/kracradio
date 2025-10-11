// src/pages/Articles.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Seo from '../seo/Seo';
import { listPublishedArticles } from '../lib/articles';
import { useI18n } from '../i18n';
import GoogleAd from '../components/ads/GoogleAd';

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
    by: 'Par',
    defaultTag: 'Article',
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
    by: 'By',
    defaultTag: 'Article',
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
    by: 'Por',
    defaultTag: 'Artículo',
  },
};

export default function Articles() {
  const { lang } = useI18n();
  const L = useMemo(() => STRINGS[lang] || STRINGS.fr, [lang]);

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
          setRows(data || []);
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

      <div className="pb-10">
        <GoogleAd slot="3411355648" className="mx-auto max-w-4xl" />
      </div>

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
        <div className="space-y-8 pb-16">
          {rows.map((article, index) => {
            let excerpt = article.excerpt || '';
            // si excerpt vide mais content JSON, essaye d'en tirer l'excerpt de la langue active
            if (!excerpt && typeof article.content === 'string' && article.content.trim().startsWith('{')) {
              try {
                const p = JSON.parse(article.content);
                excerpt = p?.[lang]?.excerpt || '';
              } catch {/* ignore */}
            }

            const imageUrl = article.featured_image || article.cover_url;

            return (
              <React.Fragment key={article.slug}>
                <article
                  className="group border-b border-gray-200 dark:border-gray-800 pb-8 last:border-b-0"
                >
                  <Link to={`/article/${article.slug}`} className="block">
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Bloc 1: Image rectangle à gauche */}
                    {imageUrl && (
                      <div className="w-full md:w-72 flex-shrink-0">
                        <div className="aspect-[3/2] w-full overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                          <img
                            src={imageUrl}
                            alt={article.title}
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                            loading="lazy"
                          />
                        </div>
                      </div>
                    )}

                    {/* Bloc 2: Contenu vertical à droite */}
                    <div className="flex-1 min-w-0 flex flex-col">
                      {/* Ligne 1: Tags à gauche + Date à droite */}
                      <div className="flex items-center justify-between mb-3">
                        {/* Tags à gauche */}
                        <div className="flex items-center gap-2">
                          {article.categories && article.categories.length > 0 ? (
                            article.categories.slice(0, 2).map((category, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center rounded-md bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 dark:bg-red-900/20 dark:text-red-400 uppercase tracking-wide"
                              >
                                {category}
                              </span>
                            ))
                          ) : (
                            <span className="inline-flex items-center rounded-md bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-700 dark:bg-gray-900/20 dark:text-gray-400 uppercase tracking-wide">
                              {L.defaultTag}
                            </span>
                          )}
                        </div>

                        {/* Date à droite */}
                        {article.published_at && (
                          <time
                            dateTime={article.published_at}
                            className="text-xs font-medium text-gray-500 dark:text-gray-500 uppercase tracking-wide"
                          >
                            {new Date(article.published_at).toLocaleDateString(lang, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </time>
                        )}
                      </div>

                      {/* Ligne 2: Titre en gras */}
                      <h2 className="text-2xl md:text-3xl font-bold text-black dark:text-white mb-3 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors leading-tight">
                        {article.title}
                      </h2>

                      {/* Ligne 3: Auteur du blog */}
                      {article.author?.username && (
                        <div className="mb-3">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {L.by} {article.author.username}
                          </span>
                        </div>
                      )}

                      {/* Ligne 4 (optionnelle): Extrait */}
                      {excerpt && (
                        <p className="text-base text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
                          {excerpt}
                        </p>
                      )}
                    </div>
                  </div>
                  </Link>
                </article>
                {index === 1 && (
                  <div className="my-10">
                    <GoogleAd slot="3411355648" className="mx-auto max-w-4xl" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}
    </main>
  );
}
