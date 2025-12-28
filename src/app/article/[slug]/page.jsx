import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import ArticleClientParts from './ArticleClientParts';
import { articleSchema, breadcrumbSchema } from '../../../seo/schemas';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kracradio.com';

// Helper to create supabase client
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createClient(supabaseUrl, supabaseAnonKey);
}

// Helper to strip HTML and truncate
function stripHtml(html, maxLength = 160) {
  if (!html) return '';
  const text = html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
}

// Helper to decode HTML entities server-side
function decodeHtmlEntities(html) {
  if (!html) return '';
  return html
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

// Fetch article data
async function getArticle(slug) {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data: article, error } = await supabase
    .from('articles')
    .select('id, slug, title, excerpt, content, cover_url, featured_image, categories, status, published_at, created_at, updated_at, user_id')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (error || !article) return null;

  // Fetch author info
  if (article.user_id) {
    const { data: author } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, artist_slug, display_name, artist_name')
      .eq('id', article.user_id)
      .single();

    if (author) {
      article.author_name = author.display_name || author.artist_name || author.username;
      article.author_avatar = author.avatar_url;
      article.author_slug = author.artist_slug;
    }
  }

  return article;
}

// Fetch related articles
async function getRelatedArticles(excludeSlug, limit = 8) {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data: articles } = await supabase
    .from('articles')
    .select('slug, title, featured_image, cover_url')
    .eq('status', 'published')
    .neq('slug', excludeSlug)
    .order('published_at', { ascending: false })
    .limit(limit);

  return articles || [];
}

// Generate metadata for SEO
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    return {
      title: 'Article Not Found',
      description: 'The requested article could not be found.',
    };
  }

  const description = stripHtml(article.content, 160);
  const ogImage = article.featured_image || article.cover_url || '/icon.png';
  const articleUrl = `${siteUrl}/article/${slug}`;

  return {
    title: article.title,
    description,
    authors: [{ name: article.author_name || 'KracRadio' }],
    openGraph: {
      type: 'article',
      url: articleUrl,
      title: article.title,
      description,
      images: [{ url: ogImage, width: 1200, height: 630, alt: article.title }],
      publishedTime: article.published_at || article.created_at,
      modifiedTime: article.updated_at,
      authors: [article.author_name || 'KracRadio'],
      section: 'Music',
      tags: ['music', 'article', 'kracradio'],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description,
      images: [ogImage],
    },
    alternates: {
      canonical: articleUrl,
    },
  };
}

// Server Component
export default async function ArticlePage({ params }) {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    notFound();
  }

  const relatedArticles = await getRelatedArticles(slug);

  // Parse multilingual content if available
  let langContent = { title: article.title, excerpt: article.excerpt, content: article.content || '' };

  // Decode HTML entities
  if (typeof langContent.content === 'string') {
    langContent.content = decodeHtmlEntities(langContent.content);
  }

  const imageUrl = article.featured_image || article.cover_url;
  const publishDate = article.published_at
    ? new Date(article.published_at).toLocaleDateString('fr', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  // JSON-LD schemas
  const articleJsonLd = articleSchema(article, article.author_name ? { username: article.author_name, artist_slug: article.author_slug } : null);
  const breadcrumbJsonLd = breadcrumbSchema([
    { name: 'Accueil', url: '/' },
    { name: 'Articles', url: '/articles' },
    { name: langContent.title },
  ]);

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* JSON-LD */}
      <Script
        id="article-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <Script
        id="breadcrumb-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Client-side interactive parts */}
      <ArticleClientParts articleUserId={article.user_id} />

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

      {/* Hero Section with Image */}
      {imageUrl && (
        <div className="relative w-full h-[70vh] md:h-[80vh] overflow-hidden">
          <img
            src={imageUrl}
            alt={langContent.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

          <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16">
            <div className="max-w-5xl mx-auto">
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

              <h1 className="text-4xl md:text-6xl lg:text-7xl font-black mb-6 text-white leading-[1.1] drop-shadow-2xl">
                {langContent.title}
              </h1>

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

          <div className="absolute top-6 right-6 flex gap-3 z-10">
            <Link
              href="/articles"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-black/50 backdrop-blur-sm border border-white/20 rounded-full hover:bg-black/70 transition-all shadow-lg"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Retour aux articles
            </Link>
          </div>
        </div>
      )}

      {/* Article without image - alternate layout */}
      {!imageUrl && (
        <div className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-black py-16 px-8">
          <div className="max-w-5xl mx-auto">
            <div className="flex justify-end gap-3 mb-8">
              <Link
                href="/articles"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-full hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Retour aux articles
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
        {langContent.excerpt && (
          <div className="mb-12 p-6 bg-gray-50 dark:bg-gray-900 rounded-2xl border-l-4 border-red-500">
            <p className="text-xl font-medium text-gray-700 dark:text-gray-300 italic leading-relaxed">
              {langContent.excerpt}
            </p>
          </div>
        )}

        <div className="article-content">
          <div dangerouslySetInnerHTML={{ __html: langContent.content }} />
        </div>
      </article>

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <section className="bg-gray-50 dark:bg-gray-900 py-16">
          <div className="max-w-7xl mx-auto px-6 md:px-8">
            <h2 className="text-3xl md:text-4xl font-black mb-10 text-black dark:text-white uppercase">
              À lire aussi
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
