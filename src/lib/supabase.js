// src/lib/supabase.js
import { supabase } from './supabaseClient';
export { supabase }; // <-- makes { supabase } available from this module

// Small, safe slugify
export function slugify(input = '') {
  return String(input)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 120);
}

// ---- Articles helpers ----

export async function listPublishedArticles() {
  const { data, error } = await supabase
    .from('articles')
    .select('id, slug, title, content, status, created_at, updated_at, user_id')
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function listUserArticles(userId) {
  const { data, error } = await supabase
    .from('articles')
    .select('id, slug, title, content, status, created_at, updated_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function fetchArticleBySlug(slug) {
  const { data, error } = await supabase
    .from('articles')
    .select('id, slug, title, content, status, created_at, updated_at, user_id')
    .eq('slug', slug)
    .single();

  if (error) throw error;
  return data || null;
}

export async function fetchArticleById(id) {
  const { data, error } = await supabase
    .from('articles')
    .select('id, slug, title, content, status, created_at, updated_at, user_id')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data || null;
}

export async function createArticle({ userId, title, content = '', status = 'draft' }) {
  const slug = slugify(title);
  const { data, error } = await supabase
    .from('articles')
    .insert([{ user_id: userId, title, content, slug, status }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateArticleById(id, { title, content, status }) {
  const patch = {};
  if (title != null) patch.title = title;
  if (content != null) patch.content = content;
  if (status != null) patch.status = status;
  if (title != null) patch.slug = slugify(title);

  const { data, error } = await supabase
    .from('articles')
    .update(patch)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteArticleById(id) {
  const { data, error } = await supabase
    .from('articles')
    .delete()
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}
