import { createClient } from '@supabase/supabase-js';
import Article from '../../../pages-components/Article';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kracradio.com';

// Helper to create supabase client only when needed
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

// Generate metadata for SEO
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const supabase = getSupabaseClient();

  if (!supabase) {
    return { title: 'Article', description: 'Read articles on KracRadio' };
  }

  try {
    const { data: article } = await supabase
      .from('articles')
      .select('title, content, cover_image, created_at, updated_at, user_id')
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (!article) {
      return {
        title: 'Article Not Found',
        description: 'The requested article could not be found.',
      };
    }

    // Fetch author info
    let authorName = 'KracRadio';
    if (article.user_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, artist_name')
        .eq('id', article.user_id)
        .single();
      if (profile) {
        authorName = profile.display_name || profile.artist_name || 'KracRadio';
      }
    }

    const description = stripHtml(article.content, 160);
    const ogImage = article.cover_image || '/icon.png';
    const articleUrl = `${siteUrl}/article/${slug}`;

    return {
      title: article.title,
      description,
      authors: [{ name: authorName }],
      openGraph: {
        type: 'article',
        url: articleUrl,
        title: article.title,
        description,
        images: [
          {
            url: ogImage,
            width: 1200,
            height: 630,
            alt: article.title,
          },
        ],
        publishedTime: article.created_at,
        modifiedTime: article.updated_at,
        authors: [authorName],
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
  } catch (error) {
    console.error('Error generating article metadata:', error);
    return {
      title: 'Article',
      description: 'Read articles on KracRadio',
    };
  }
}

export default function ArticlePage() {
  return <Article />;
}
