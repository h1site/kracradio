'use client';
import RedirectTo from '../components/RedirectTo';
// src/pages/Article.jsx
import React, { useEffect, useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useParams, redirect } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { fetchArticleBySlug, listPublishedArticles } from '../lib/articles';
import { useI18n } from '../i18n';
import { useUI } from '../context/UIContext';
import { useAuth } from '../context/AuthContext';
import GoogleAd from '../components/ads/GoogleAd';
import Seo from '../seo/Seo';
import { articleSchema, breadcrumbSchema } from '../seo/schemas';

const STRINGS = {
  fr: {
    backToArticles: 'Retour aux articles',
    readMore: 'À lire aussi',
    loading: 'Chargement...',
    edit: 'Modifier',
    publishedOn: 'Publié le',
  },
  en: {
    backToArticles: 'Back to articles',
    readMore: 'Read also',
    loading: 'Loading...',
    edit: 'Edit',
    publishedOn: 'Published on',
  },
  es: {
    backToArticles: 'Volver a artículos',
    readMore: 'Leer también',
    loading: 'Cargando...',
    edit: 'Editar',
    publishedOn: 'Publicado el',
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
  const [readingProgress, setReadingProgress] = useState(0);

  const handleScroll = () => {
    const el = document.documentElement;
    const totalHeight = el.scrollHeight - el.clientHeight;
    if (totalHeight > 0) {
      setReadingProgress((el.scrollTop / totalHeight) * 100);
    } else {
      setReadingProgress(0);
    }
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  // Helper function to decode HTML entities
  const decodeHTML = (html) => {
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
  };

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
        content: decodeHTML(parsed[lang].content)
      };
    }
    return {
      title: article.title,
      excerpt: article.excerpt,
      content: typeof article.content === 'string' ? decodeHTML(article.content) : (article.content || '')
    };
  }, [article, lang]);

  // Build schemas for SEO - Must be called before any conditional returns
  const articleJsonLd = useMemo(() => {
    if (!article) return null;
    const author = article.author_name ? {
      username: article.author_name,
      artist_slug: article.author_slug,
    } : null;
    return articleSchema(article, author);
  }, [article]);

  const breadcrumbJsonLd = useMemo(() => {
    if (!article || !langContent) return null;
    return breadcrumbSchema([
      { name: 'Accueil', url: '/' },
      { name: 'Articles', url: '/articles' },
      { name: langContent.title || article.title },
    ]);
  }, [article, langContent]);

  if (notFound) return <RedirectTo href="/articles" replace />;

  if (!article || !langContent) {
    return (
      <div className="container mx-auto px-4 py-6 text-sm opacity-80">
        {L.loading}
      </div>
    );
  }

  const containerStyle = {
    marginLeft: isDesktop && sidebarOpen ? sidebarWidth : 0,
    transition: 'margin-left 300ms ease',
  };

  const imageUrl = article.featured_image || article.cover_url;
  const isAuthor = user && article.user_id && user.id === article.user_id;

  // Format date
  const publishDate = article.published_at ? new Date(article.published_at).toLocaleDateString(lang, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : '';

  return (
    <div style={containerStyle} className="min-h-screen bg-white dark:bg-black">
      {article && langContent && (
        <Seo
          lang={lang}
          title={langContent.title}
          description={langContent.excerpt || langContent.title}
          path={`/article/${article.slug}`}
          image={article.featured_image}
          type="article"
          jsonLd={[articleJsonLd, breadcrumbJsonLd].filter(Boolean)}
        />
      )}

      {/* Reading Progress Bar */}
      <div
        className="fixed top-0 left-0 h-1 bg-red-500 z-50 transition-all duration-150"
        style={{ width: `${readingProgress}%` }}
      />

      <style>{`
        .article-content p {
          margin-bottom: 1.5em;
          line-height: 1.8;
          font-size: 1.125rem;
          color: #374151;
        }
        .dark .article-content p {
          color: #d1d5db;
        }
        .article-content p:last-child {
          margin-bottom: 0;
        }
        .article-content h1,
        .article-content h2,
        .article-content h3 {
          margin-top: 2em;
          margin-bottom: 1em;
          font-weight: 700;
          color: #111827;
        }
        .dark .article-content h1,
        .dark .article-content h2,
        .dark .article-content h3 {
          color: #f9fafb;
        }
        .article-content h2 {
          font-size: 1.875rem;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 0.5rem;
        }
        .dark .article-content h2 {
          border-bottom-color: #374151;
        }
        .article-content h3 {
          font-size: 1.5rem;
        }
        .article-content ul,
        .article-content ol {
          margin-bottom: 1.5em;
          padding-left: 2em;
        }
        .article-content li {
          margin-bottom: 0.75em;
          line-height: 1.8;
        }
        .article-content blockquote {
          margin: 2em 0;
          padding-left: 1.5em;
          border-left: 4px solid #ef4444;
          font-style: italic;
          color: #4b5563;
        }
        .dark .article-content blockquote {
          border-left-color: #ef4444;
          color: #9ca3af;
        }
        .article-content a {
          color: #ef4444;
          text-decoration: underline;
          text-decoration-color: rgba(239, 68, 68, 0.3);
          transition: all 0.2s;
        }
        .article-content a:hover {
          text-decoration-color: #ef4444;
        }
      `}</style>

      {/* Hero Section avec Image en plein écran */}
      {imageUrl && (
        <div className="relative w-full h-[70vh] md:h-[80vh] overflow-hidden">
          <img
            src={imageUrl}
            alt={langContent.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

          {/* Title overlay sur l'image */}
          <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16">
            <div className="max-w-5xl mx-auto">
              {/* Categories */}
              {article.categories && article.categories.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {article.categories.map((category, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center rounded-full bg-red-600 px-4 py-1.5 text-xs font-bold text-white uppercase tracking-wider backdrop-blur-sm"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              )}

              {/* Title */}
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-black mb-6 text-white leading-[1.1] drop-shadow-2xl">
                {langContent.title}
              </h1>

              {/* Author & Date */}
              <div className="flex items-center gap-6 text-white/90">
                {article.author_name && (
                  <Link
                    href={`/profile/${article.author_slug || article.author_name}`}
                    className="flex items-center gap-3 hover:text-white transition-colors group"
                  >
                    {article.author_avatar ? (
                      <img
                        src={article.author_avatar}
                        alt={article.author_name}
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-white/50 group-hover:ring-red-500 transition-all"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white text-lg font-bold ring-2 ring-white/50 group-hover:ring-red-500 transition-all">
                        {article.author_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="font-semibold text-lg">{article.author_name}</span>
                  </Link>
                )}
                {publishDate && (
                  <>
                    <span className="text-white/40">•</span>
                    <time className="text-sm font-medium">{publishDate}</time>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons - Positioned in hero */}
          <div className="absolute top-6 right-6 flex gap-3 z-10">
            {isAuthor && (
              <Link
                href={`/dashboard/articles/edit/${article.id}`}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600/90 backdrop-blur-sm border border-white/20 rounded-full hover:bg-blue-700 transition-all shadow-lg"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                {L.edit}
              </Link>
            )}
            <Link
              href="/articles"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-black/50 backdrop-blur-sm border border-white/20 rounded-full hover:bg-black/70 transition-all shadow-lg"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              {L.backToArticles}
            </Link>
          </div>
        </div>
      )}

      {/* Article sans image - Layout alternatif */}
      {!imageUrl && (
        <div className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-black py-16 px-8">
          <div className="max-w-5xl mx-auto">
            {/* Action buttons */}
            <div className="flex justify-end gap-3 mb-8">
              {isAuthor && (
                <Link
                  href={`/dashboard/articles/edit/${article.id}`}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-full hover:bg-blue-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  {L.edit}
                </Link>
              )}
              <Link
                href="/articles"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-full hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                {L.backToArticles}
              </Link>
            </div>

            {article.categories && article.categories.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {article.categories.map((category, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center rounded-full bg-red-600 px-4 py-1.5 text-xs font-bold text-white uppercase tracking-wider"
                  >
                    {category}
                  </span>
                ))}
              </div>
            )}

            <h1 className="text-5xl md:text-7xl font-black mb-8 text-black dark:text-white leading-[1.1]">
              {langContent.title}
            </h1>

            <div className="flex items-center gap-6 text-gray-600 dark:text-gray-400">
              {article.author_name && (
                <Link
                  href={`/profile/${article.author_slug || article.author_name}`}
                  className="flex items-center gap-3 hover:text-red-600 dark:hover:text-red-400 transition-colors group"
                >
                  {article.author_avatar ? (
                    <img
                      src={article.author_avatar}
                      alt={article.author_name}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-700 group-hover:ring-red-500 transition-all"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white text-lg font-bold ring-2 ring-gray-200 dark:ring-gray-700 group-hover:ring-red-500 transition-all">
                      {article.author_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="font-semibold text-lg">{article.author_name}</span>
                </Link>
              )}
              {publishDate && (
                <>
                  <span className="text-gray-300 dark:text-gray-700">•</span>
                  <time className="text-sm font-medium">{publishDate}</time>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <article className="max-w-4xl mx-auto px-6 md:px-8 py-16">

        {/* Excerpt si présent */}
        {langContent.excerpt && (
          <div className="mb-12 p-6 bg-gray-50 dark:bg-gray-900 rounded-2xl border-l-4 border-red-500">
            <p className="text-xl font-medium text-gray-700 dark:text-gray-300 italic leading-relaxed">
              {langContent.excerpt}
            </p>
          </div>
        )}

        <div className="my-12 flex justify-center">
          <GoogleAd slot="3411355648" className="mx-auto max-w-full" />
        </div>

        {/* Article Content */}
        <div className="article-content">
          <div dangerouslySetInnerHTML={{ __html: langContent.content }} />
        </div>

        <div className="my-16 flex justify-center">
          <GoogleAd slot="3411355648" className="mx-auto max-w-full" />
        </div>
      </article>

      {/* Related Articles Section */}
      {relatedArticles.length > 0 && (
        <section className="bg-gray-50 dark:bg-gray-900 py-16">
          <div className="max-w-7xl mx-auto px-6 md:px-8">
            <h2 className="text-3xl md:text-4xl font-black mb-10 text-black dark:text-white uppercase">
              {L.readMore}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedArticles.map((related) => {
                const relatedImage = related.featured_image || related.cover_url;
                return (
                  <Link
                    key={related.slug}
                    href={`/article/${related.slug}`}
                    className="group block bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all"
                  >
                    {relatedImage ? (
                      <div className="aspect-[4/3] w-full overflow-hidden bg-gray-100 dark:bg-gray-700">
                        <img
                          src={relatedImage}
                          alt={related.title}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-110"
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div className="aspect-[4/3] w-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                        <span className="text-white text-4xl font-bold opacity-50">?</span>
                      </div>
                    )}

                    <div className="p-5">
                      <h3 className="text-base font-bold text-black dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors line-clamp-2 leading-snug">
                        {related.title}
                      </h3>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
