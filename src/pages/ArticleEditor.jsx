// src/pages/ArticleEditor.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n';
import Seo from '../seo/Seo';
import {
  createArticle,
  updateArticleById,
  fetchArticleById,
} from '../lib/supabase';
import TipTapEditor from '../components/TipTapEditor';

export default function ArticleEditor() {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const { id } = useParams();
  const navigate = useNavigate();

  const A = t?.articles || {};
  const P = t?.profile || {};

  const isEdit = Boolean(id);

  // États de base
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('draft');

  // Nouveaux champs WordPress-like
  const [excerpt, setExcerpt] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [categories, setCategories] = useState('');
  const [tags, setTags] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [allowComments, setAllowComments] = useState(true);
  const [isSticky, setIsSticky] = useState(false);

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [activeTab, setActiveTab] = useState('content'); // content | seo | settings

  // Charger l'article à éditer
  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!isEdit) return;
      setBusy(true);
      const { data, error } = await fetchArticleById(id);
      if (mounted) {
        if (error) setErr(error.message || 'Error');
        if (data) {
          setTitle(data.title || '');
          setContent(data.content || '');
          setStatus(data.status || 'draft');
          setExcerpt(data.excerpt || '');
          setFeaturedImage(data.featured_image || '');
          setMetaTitle(data.meta_title || '');
          setMetaDescription(data.meta_description || '');
          setCategories(data.categories ? data.categories.join(', ') : '');
          setTags(data.tags ? data.tags.join(', ') : '');
          setCustomSlug(data.custom_slug || '');
          setAllowComments(data.allow_comments !== false);
          setIsSticky(data.is_sticky || false);
        }
        setBusy(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [id, isEdit]);

  async function onSubmit(e) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    setErr('');

    try {
      const articleData = {
        title,
        content,
        status,
        excerpt,
        featured_image: featuredImage || null,
        meta_title: metaTitle || null,
        meta_description: metaDescription || null,
        categories: categories ? categories.split(',').map(c => c.trim()).filter(Boolean) : [],
        tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        custom_slug: customSlug || null,
        allow_comments: allowComments,
        is_sticky: isSticky,
      };

      if (isEdit) {
        const { data, error } = await updateArticleById(id, articleData);
        if (error) throw error;
        if (data?.slug && data?.status === 'published') {
          navigate(`/article/${data.slug}`, { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      } else {
        const { data, error } = await createArticle({
          ...articleData,
          author_id: user.id,
        });
        if (error) throw error;
        if (data?.slug && data?.status === 'published') {
          navigate(`/article/${data.slug}`, { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      }
    } catch (e2) {
      setErr(e2.message || 'Error');
      setBusy(false);
    }
  }

  return (
    <main className="container-max px-5 py-6 pb-20">
      <Seo
        lang={lang}
        title={isEdit ? (A.editTitle || 'Edit article') : (A.newTitle || 'New article')}
        description={t?.meta?.homeDesc || 'Editor'}
        path={isEdit ? `/dashboard/articles/edit/${id}` : '/dashboard/articles/edit'}
        type="website"
      />

      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-black dark:text-white">
            {isEdit ? (A.editTitle || 'Modifier l\'article') : (A.newTitle || 'Nouvel article')}
          </h1>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold transition hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-900"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
            </svg>
            {P.back || 'Retour'}
          </Link>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          {/* Tabs Navigation */}
          <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800">
            <button
              type="button"
              onClick={() => setActiveTab('content')}
              className={`px-4 py-2 text-sm font-semibold transition ${
                activeTab === 'content'
                  ? 'border-b-2 border-red-600 text-red-600'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              Contenu
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('seo')}
              className={`px-4 py-2 text-sm font-semibold transition ${
                activeTab === 'seo'
                  ? 'border-b-2 border-red-600 text-red-600'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              SEO & Médias
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2 text-sm font-semibold transition ${
                activeTab === 'settings'
                  ? 'border-b-2 border-red-600 text-red-600'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              Paramètres
            </button>
          </div>

          {/* Tab: Contenu */}
          {activeTab === 'content' && (
            <div className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Titre de l'article *
                </label>
                <input
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-lg font-semibold transition focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/30 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="Entrez le titre principal..."
                />
                <p className="mt-1 text-xs text-gray-500">Ce titre apparaît en haut de l'article et dans les résultats de recherche</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Contenu *
                </label>
                <TipTapEditor
                  content={content}
                  onChange={setContent}
                />
                <p className="mt-1 text-xs text-gray-500">Éditeur de blocs WYSIWYG avec support images, liens, YouTube, tableaux, et plus.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Extrait (Excerpt)
                </label>
                <textarea
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 min-h-[100px] transition focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/30 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Résumé court pour les listes et archives (recommandé 120-155 caractères)..."
                  maxLength={300}
                />
                <p className="mt-1 text-xs text-gray-500">{excerpt.length}/300 caractères</p>
              </div>
            </div>
          )}

          {/* Tab: SEO & Médias */}
          {activeTab === 'seo' && (
            <div className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
              <div className="border-b border-gray-200 pb-4 dark:border-gray-800">
                <h3 className="text-lg font-bold text-black dark:text-white">Image mise en avant</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">L'image principale de votre article</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  URL de l'image
                </label>
                <input
                  type="url"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 transition focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/30 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  value={featuredImage}
                  onChange={(e) => setFeaturedImage(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
                <p className="mt-1 text-xs text-gray-500">Téléversez votre image sur Supabase Storage et collez l'URL ici</p>
              </div>

              {featuredImage && (
                <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                  <p className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Aperçu:</p>
                  <img src={featuredImage} alt="Preview" className="max-h-64 rounded-lg object-cover" />
                </div>
              )}

              <div className="border-b border-gray-200 pb-4 pt-6 dark:border-gray-800">
                <h3 className="text-lg font-bold text-black dark:text-white">SEO (Référencement)</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Optimisez pour les moteurs de recherche</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Titre SEO (Meta Title)
                </label>
                <input
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 transition focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/30 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  placeholder={title || "Titre personnalisé pour Google (55-60 caractères)"}
                  maxLength={60}
                />
                <p className="mt-1 text-xs text-gray-500">{metaTitle.length}/60 caractères • Laissez vide pour utiliser le titre de l'article</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Description SEO (Meta Description)
                </label>
                <textarea
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 min-h-[100px] transition focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/30 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  placeholder="Description pour les résultats de recherche (120-155 caractères)..."
                  maxLength={160}
                />
                <p className="mt-1 text-xs text-gray-500">{metaDescription.length}/160 caractères • Laissez vide pour utiliser l'extrait</p>
              </div>
            </div>
          )}

          {/* Tab: Paramètres */}
          {activeTab === 'settings' && (
            <div className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
              <div className="border-b border-gray-200 pb-4 dark:border-gray-800">
                <h3 className="text-lg font-bold text-black dark:text-white">Taxonomies</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Organisez votre contenu</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Catégories
                </label>
                <input
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 transition focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/30 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  value={categories}
                  onChange={(e) => setCategories(e.target.value)}
                  placeholder="Ex: Technologie, Musique (séparées par des virgules)"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Étiquettes (Tags)
                </label>
                <input
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 transition focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/30 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="Ex: react, javascript, tutorial (séparées par des virgules)"
                />
              </div>

              <div className="border-b border-gray-200 pb-4 pt-6 dark:border-gray-800">
                <h3 className="text-lg font-bold text-black dark:text-white">Permalien</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Personnalisez l'URL de l'article</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Slug personnalisé
                </label>
                <input
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 font-mono text-sm transition focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/30 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  value={customSlug}
                  onChange={(e) => setCustomSlug(e.target.value)}
                  placeholder="mon-article-personnalise"
                />
                <p className="mt-1 text-xs text-gray-500">Laissez vide pour générer automatiquement depuis le titre</p>
              </div>

              <div className="border-b border-gray-200 pb-4 pt-6 dark:border-gray-800">
                <h3 className="text-lg font-bold text-black dark:text-white">Options</h3>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowComments}
                    onChange={(e) => setAllowComments(e.target.checked)}
                    className="h-5 w-5 rounded border-gray-300 text-red-600 focus:ring-red-600"
                  />
                  <div>
                    <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">Autoriser les commentaires</div>
                    <div className="text-xs text-gray-500">Les lecteurs pourront commenter cet article</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSticky}
                    onChange={(e) => setIsSticky(e.target.checked)}
                    className="h-5 w-5 rounded border-gray-300 text-red-600 focus:ring-red-600"
                  />
                  <div>
                    <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">Épingler en haut du blog</div>
                    <div className="text-xs text-gray-500">Cet article restera en haut de la liste</div>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Footer fixe avec actions */}
          <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white px-5 py-4 shadow-lg dark:border-gray-800 dark:bg-gray-900">
            <div className="container-max mx-auto flex items-center justify-between">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Statut:</span>
                  <select
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold transition focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/30 dark:border-gray-700 dark:bg-gray-800"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="draft">📝 Brouillon</option>
                    <option value="published">🌍 Publié</option>
                  </select>
                </label>
              </div>

              {err && <div className="text-sm text-red-600 font-medium">{err}</div>}

              <div className="flex items-center gap-3">
                <Link
                  to="/dashboard"
                  className="px-4 py-2 text-sm font-semibold text-gray-700 transition hover:text-gray-900 dark:text-gray-300"
                >
                  Annuler
                </Link>
                <button
                  type="submit"
                  disabled={busy}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {busy ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                        <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/>
                      </svg>
                      {isEdit ? 'Mettre à jour' : 'Publier'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
