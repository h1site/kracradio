import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import Script from 'next/script';
import { collectionPageSchema, breadcrumbSchema } from '../../seo/schemas';
import ArticlesClientParts from './ArticlesClientParts';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kracradio.com';

// Helper to create supabase client for server
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createClient(supabaseUrl, supabaseAnonKey);
}

// Fetch published articles server-side
async function getPublishedArticles(limit = 24) {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  try {
    const { data: articles, error } = await supabase
      .from('articles')
      .select(`
        id,
        slug,
        title,
        excerpt,
        content,
        cover_url,
        featured_image,
        categories,
        published_at,
        user_id
      `)
      .eq('status', 'published')
      .order('published_at', { ascending: false, nullsFirst: false })
      .limit(limit);

    if (error || !articles || articles.length === 0) {
      return [];
    }

    // Get unique author IDs
    const authorIds = [...new Set(articles.map(a => a.user_id).filter(Boolean))];

    // Fetch authors
    const { data: authors } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, artist_slug')
      .in('id', authorIds);

    // Create author map
    const authorMap = {};
    if (authors) {
      authors.forEach(author => {
        authorMap[author.id] = author;
      });
    }

    // Merge author data into articles
    return articles.map(article => {
      const author = authorMap[article.user_id] || null;
      return {
        ...article,
        author_name: author?.username || null,
        author_avatar: author?.avatar_url || null,
        author_slug: author?.artist_slug || null
      };
    });
  } catch (error) {
    console.error('Failed to load articles:', error);
    return [];
  }
}

export const metadata = {
  title: 'Articles',
  description: 'Read the latest music news, interviews, and articles from the KracRadio community. Discover stories about independent artists, music trends, and industry insights.',
  openGraph: {
    type: 'website',
    url: `${siteUrl}/articles`,
    title: 'Articles - KracRadio',
    description: 'Read the latest music news, interviews, and articles from the KracRadio community.',
    images: [{ url: '/icon.png', width: 1200, height: 630, alt: 'KracRadio Articles' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Articles - KracRadio',
    description: 'Read the latest music news, interviews, and articles.',
    images: ['/icon.png'],
  },
  alternates: {
    canonical: `${siteUrl}/articles`,
  },
};

export default async function ArticlesPage() {
  const articles = await getPublishedArticles();

  // JSON-LD schemas
  const collectionJsonLd = collectionPageSchema('Articles', metadata.description, '/articles', articles.length);
  const breadcrumbJsonLd = breadcrumbSchema([
    { name: 'Accueil', url: '/' },
    { name: 'Articles' }
  ]);

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* JSON-LD */}
      <Script
        id="collection-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
      <Script
        id="breadcrumb-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Client parts for sidebar interaction */}
      <ArticlesClientParts />

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out forwards;
        }
        .article-card {
          opacity: 0;
          animation: fadeInUp 0.5s ease-out forwards;
        }
        .article-card:hover {
          transform: translateY(-5px) scale(1.01);
        }
        .featured-article:hover {
          transform: scale(1.01);
        }
      `}</style>

      {/* Full-screen header */}
      <header className="relative w-full overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1471107340929-a87cd0f5b5f3?w=1200&h=400&fit=crop&auto=format&q=80"
            alt="Articles"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent"></div>
        </div>
        <div className="relative py-16 md:py-24">
          <div className="max-w-4xl pl-[60px] md:pl-[100px] pr-8">
            <span
              className="inline-flex items-center rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-red-300 animate-fade-in-up"
              style={{ animationDelay: '0s' }}
            >
              Blogue
            </span>
            <h1
              className="mt-4 text-4xl md:text-6xl font-black uppercase text-white animate-fade-in-up"
              style={{ animationDelay: '0.1s' }}
            >
              Articles
            </h1>
            <p
              className="mt-4 max-w-3xl text-lg text-gray-200 animate-fade-in-up"
              style={{ animationDelay: '0.2s' }}
            >
              Discover our latest articles about music, culture and music news.
            </p>
          </div>
        </div>
      </header>

      <main className="px-[5px] py-12">
        {articles.length === 0 ? (
          <div className="rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-gray-800 dark:bg-gray-950">
            <p className="text-base text-gray-600 dark:text-gray-400">No published articles yet.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-16">
              {articles.map((article, index) => {
                let excerpt = article.excerpt || '';
                if (!excerpt && typeof article.content === 'string' && article.content.trim().startsWith('{')) {
                  try {
                    const p = JSON.parse(article.content);
                    excerpt = p?.en?.excerpt || p?.fr?.excerpt || '';
                  } catch {/* ignore */}
                }
                const imageUrl = article.featured_image || article.cover_url;

                // Featured article (first one)
                if (index === 0) {
                  const publishDate = article.published_at ? new Date(article.published_at).toLocaleDateString('en', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : '';

                  return (
                    <article
                      key={article.slug}
                      className="md:col-span-2 lg:col-span-3 article-card featured-article group relative rounded-2xl overflow-hidden shadow-lg transition-all duration-300"
                      style={{ animationDelay: `${0.08 * index}s` }}
                    >
                      <Link href={`/article/${article.slug}`} className="block">
                        <div className="h-96">
                          {imageUrl && (
                            <img
                              src={imageUrl}
                              alt={article.title}
                              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
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
                                {article.author_name || 'Author'}
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
                  );
                }

                // Regular article cards
                return (
                  <article
                    key={article.slug}
                    className="article-card group relative rounded-2xl overflow-hidden shadow-lg bg-white dark:bg-gray-800 h-full transition-all duration-300"
                    style={{ animationDelay: `${0.08 * index}s` }}
                  >
                    <Link href={`/article/${article.slug}`} className="block h-full">
                      {imageUrl && (
                        <div className="aspect-video w-full overflow-hidden">
                          <img
                            src={imageUrl}
                            alt={article.title}
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
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
          </>
        )}
      </main>
    </div>
  );
}
