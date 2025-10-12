// src/pages/Article.jsx
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { fetchArticleBySlug, listPublishedArticles } from '../lib/articles';
import { useI18n } from '../i18n';
import { useUI } from '../context/UIContext';
import { useAuth } from '../context/AuthContext';
import GoogleAd from '../components/ads/GoogleAd';

const STRINGS = {
  fr: {
    backToArticles: 'Retour aux articles',
    readMore: 'Articles similaires',
    loading: 'Chargement...',
    edit: 'Modifier',
  },
  en: {
    backToArticles: 'Back to articles',
    readMore: 'Similar articles',
    loading: 'Loading...',
    edit: 'Edit',
  },
  es: {
    backToArticles: 'Volver a artículos',
    readMore: 'Artículos similares',
    loading: 'Cargando...',
    edit: 'Editar',
  },
};

export default function Article() {
  const { slug } = useParams();
  const { lang } = useI18n();
  const { user } = useAuth();
  const L = useMemo(() => STRINGS[lang] || STRINGS.fr, [lang]);
  const { isDesktop, sidebarOpen, sidebarWidth } = useUI();
  const [article, setArticle] = useState(null);
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [notFound, setNotFound] = useState(false);
  const carouselRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const a = await fetchArticleBySlug(slug);
        if (!a || a.status !== 'published') {
          setNotFound(true);
        } else {
          setArticle(a);
          // Fetch 8 related articles (excluding current one)
          const related = await listPublishedArticles({ limit: 10 });
          setRelatedArticles(related.filter(r => r.slug !== slug).slice(0, 8));
        }
      } catch {
        setNotFound(true);
      }
    })();
  }, [slug]);

  const langContent = useMemo(() => {
    if (!article) return null;

    // Si content est un JSON trilingue: { fr:{title,excerpt,content}, en:{...}, es:{...} }
    // sinon, on considère que c'est du markdown simple (rétro-compat).
    let parsed = null;
    if (typeof article.content === 'string' && article.content.trim().startsWith('{')) {
      try {
        parsed = JSON.parse(article.content);
      } catch {/* ignore */}
    }
    if (parsed && parsed[lang] && parsed[lang].content) {
      return {
        title: parsed[lang].title || article.title,
        excerpt: parsed[lang].excerpt || article.excerpt,
        content: parsed[lang].content
      };
    }
    return {
      title: article.title,
      excerpt: article.excerpt,
      content: article.content || ''
    };
  }, [article, lang]);

  if (notFound) return <Navigate to="/articles" replace />;

  if (!article || !langContent) {
    return (
      <div className="container mx-auto px-4 py-6 text-sm opacity-80">
        {L.loading}
      </div>
    );
  }

  const containerStyle = {
    paddingTop: '20px',
    paddingLeft: '30px',
    paddingRight: '30px',
    marginLeft: isDesktop ? (sidebarOpen ? sidebarWidth : 30) : 0,
    transition: 'margin-left 300ms ease',
    display: 'flex',
    justifyContent: 'center',
  };

  const imageUrl = article.featured_image || article.cover_url;
  const isAuthor = user && article.user_id && user.id === article.user_id;

  return (
    <div style={containerStyle}>
      <article className="max-w-6xl w-full pb-20">
      {/* Action buttons - Top Right */}
      <div className="flex justify-end gap-3 mb-6">
        {/* Edit button - Only for author */}
        {isAuthor && (
          <Link
            to={`/dashboard/articles/edit/${article.id}`}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-lg hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            {L.edit}
          </Link>
        )}

        {/* Return to articles button */}
        <Link
          to="/articles"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {L.backToArticles}
        </Link>
      </div>

      {/* Tags */}
      {article.categories && article.categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {article.categories.map((category, idx) => (
            <span
              key={idx}
              className="inline-flex items-center rounded-md bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 dark:bg-red-900/20 dark:text-red-400 uppercase tracking-wide"
            >
              {category}
            </span>
          ))}
        </div>
      )}

      {/* Title (Bold) */}
      <h1 className="text-4xl md:text-5xl font-bold mb-8 text-black dark:text-white leading-tight">
        {langContent.title}
      </h1>

      {/* Featured Image - APRÈS le titre */}
      {imageUrl && (
        <div className="mb-10 rounded-xl overflow-hidden w-full">
          <img
            src={imageUrl}
            alt={langContent.title}
            className="w-full h-auto object-cover max-h-[600px]"
            loading="lazy"
          />
        </div>
      )}

      <div className="my-10 flex justify-center">
        <GoogleAd slot="3411355648" className="mx-auto max-w-full" />
      </div>

      {/* Content */}
      <div className="prose prose-lg dark:prose-invert max-w-none mb-12">
        <div dangerouslySetInnerHTML={{ __html: langContent.content }} />
      </div>

      <div className="my-12 flex justify-center">
        <GoogleAd slot="3411355648" className="mx-auto max-w-full" />
      </div>

      {/* Related Articles - Carousel */}
      {relatedArticles.length > 0 && (
        <section className="mt-16 pt-12 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-black dark:text-white">
              {L.readMore}
            </h2>

            {/* Navigation Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (carouselRef.current) {
                    carouselRef.current.scrollBy({ left: -400, behavior: 'smooth' });
                  }
                }}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
                aria-label="Previous"
              >
                <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => {
                  if (carouselRef.current) {
                    carouselRef.current.scrollBy({ left: 400, behavior: 'smooth' });
                  }
                }}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
                aria-label="Next"
              >
                <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Carousel Container */}
          <div
            ref={carouselRef}
            className="flex gap-6 overflow-x-auto scroll-smooth pb-4 no-scrollbar"
          >
            {relatedArticles.map((related) => {
              const relatedImage = related.featured_image || related.cover_url;
              return (
                <Link
                  key={related.slug}
                  to={`/article/${related.slug}`}
                  className="group block flex-shrink-0 w-80"
                >
                  {/* Image */}
                  {relatedImage ? (
                    <div className="aspect-[3/2] w-full overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 mb-3">
                      <img
                        src={relatedImage}
                        alt={related.title}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div className="aspect-[3/2] w-full rounded-lg bg-gray-200 dark:bg-gray-700 mb-3 flex items-center justify-center">
                      <span className="text-gray-400 text-sm">Pas d'image</span>
                    </div>
                  )}

                  {/* Title */}
                  <h3 className="text-base font-semibold text-black dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors line-clamp-2">
                    {related.title}
                  </h3>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </article>
    </div>
  );
}
