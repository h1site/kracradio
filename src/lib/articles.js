// src/lib/articles.js
import { supabase } from './supabase';

/** Slugifier un titre (simple et stable) */
export function slugify(input = '') {
  return String(input)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

/** Vérifie l'unicité du slug et ajoute un suffixe si besoin */
async function ensureUniqueSlug(base) {
  let candidate = base || 'article';
  let attempt = 1;

  // On teste l'existence du slug, si trouvé on suffixe -2, -3, ...
  // La requête avec head:true + count:'exact' permet un check léger
  // @see https://supabase.com/docs/reference/javascript/select#head-requests
  // (au cas où count serait null, on fait un fallback)
  // NB: LIMIT 1 pour éviter trop de charge si head ne donne rien.
  // On boucle jusqu'à trouver un slug libre.
  // C'est suffisant pour un back-office mono-utilisateur.
  while (true) {
    const { count, error } = await supabase
      .from('articles')
      .select('slug', { count: 'exact', head: true })
      .eq('slug', candidate);

    if (error) {
      // Fallback check (rarement nécessaire)
      const { data } = await supabase
        .from('articles')
        .select('slug')
        .eq('slug', candidate)
        .limit(1);
      if (!data || data.length === 0) return candidate;
    } else if (!count || count === 0) {
      return candidate;
    }

    attempt += 1;
    candidate = `${base}-${attempt}`;
  }
}

/** Créer un article (brouillon ou publié) */
export async function createArticle({
  title,
  excerpt = null,
  content = '',
  cover_url = null,
  status = 'draft', // 'draft' | 'published'
  author_id,
}) {
  if (!title || !author_id) throw new Error('title et author_id requis');
  const base = slugify(title);
  const slug = await ensureUniqueSlug(base);

  const payload = {
    slug,
    title: title.trim(),
    excerpt: excerpt || null,
    content: content || '',
    cover_url: cover_url || null,
    status,
    author_id,
    published_at: status === 'published' ? new Date().toISOString() : null,
  };

  const { data, error } = await supabase
    .from('articles')
    .insert(payload)
    .select('id, slug, title, excerpt, content, cover_url, status, published_at, author_id, created_at, updated_at')
    .single();

  if (error) throw error;
  return data;
}

/** Mettre à jour un article par id (ne modifie pas le slug automatiquement) */
export async function updateArticleById(id, patch = {}) {
  if (!id) throw new Error('id requis');

  const now = new Date().toISOString();
  const fields = { ...patch };

  // Publication : si on passe à "published" et qu'il n'y a pas de date, on la met
  if (fields.status === 'published' && !fields.published_at) {
    fields.published_at = now;
  }

  const { data, error } = await supabase
    .from('articles')
    .update(fields)
    .eq('id', id)
    .select('id, slug, title, excerpt, content, cover_url, status, published_at, author_id, created_at, updated_at')
    .single();

  if (error) throw error;
  return data;
}

/** Récupérer un article par id (tous statuts) */
export async function fetchArticleById(id) {
  const { data, error } = await supabase
    .from('articles')
    .select('id, slug, title, excerpt, content, cover_url, status, published_at, created_at, author_id')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Récupérer un article publié par slug (pour la page publique) */
export async function fetchArticleBySlug(slug) {
  const { data, error } = await supabase
    .from('articles')
    .select('id, slug, title, excerpt, content, cover_url, featured_image, categories, status, published_at, created_at, user_id')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();

  console.log('fetchArticleBySlug - slug:', slug, 'data:', data, 'error:', error);
  if (error) throw error;

  // Add author data if user_id exists
  if (data && data.user_id) {
    const { data: author } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, artist_slug')
      .eq('id', data.user_id)
      .single();

    if (author) {
      data.author = author;
      data.author_name = author.username;
      data.author_avatar = author.avatar_url;
      data.author_slug = author.artist_slug;
      data.author_id = data.user_id; // alias for compatibility
    }
  }

  return data;
}

/** Lister les articles publiés (pour /articles) */
export async function listPublishedArticles({ limit = 24, offset = 0 } = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    // First, get articles (note: table uses user_id, not author_id)
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
      .range(offset, offset + limit - 1)
      .abortSignal(controller.signal);

    clearTimeout(timeoutId);
    if (error) {
      console.error('Error loading articles:', error);
      throw error;
    }

    if (!articles || articles.length === 0) {
      console.log('No articles found');
      return [];
    }

    // Get unique author IDs (from user_id field)
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

    // Merge author data into articles (add author_id alias for compatibility)
    const articlesWithAuthors = articles.map(article => {
      const author = authorMap[article.user_id] || null;
      return {
        ...article,
        author_id: article.user_id, // Add alias for compatibility
        author: author,
        author_name: author?.username || null,
        author_avatar: author?.avatar_url || null,
        author_slug: author?.artist_slug || null
      };
    });

    console.log('Articles loaded:', articlesWithAuthors.length, 'items');
    if (articlesWithAuthors.length > 0) {
      console.log('First article:', articlesWithAuthors[0]);
    }

    return articlesWithAuthors;
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('Failed to load articles:', error);
    throw error;
  }
}
