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
    .select('id, slug, title, excerpt, content, cover_url, status, published_at, created_at, author_id')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();

  console.log('fetchArticleBySlug - slug:', slug, 'data:', data, 'error:', error);
  if (error) throw error;
  return data;
}

/** Lister les articles publiés (pour /articles) */
export async function listPublishedArticles({ limit = 24, offset = 0 } = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    const { data, error } = await supabase
      .from('articles')
      .select('id, slug, title, excerpt, cover_url, published_at, author_id')
      .eq('status', 'published')
      .order('published_at', { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1)
      .abortSignal(controller.signal);

    clearTimeout(timeoutId);
    if (error) throw error;
    return data || [];
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}
