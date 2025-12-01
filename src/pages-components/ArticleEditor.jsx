'use client';
// src/pages/ArticleEditor.jsx
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n';
import Seo from '../seo/Seo';
import {
  createArticle,
  updateArticleById,
  fetchArticleById,
} from '../lib/supabase';
import { supabase } from '../lib/supabase';
import TipTapEditor from '../components/TipTapEditor';

export default function ArticleEditor() {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const { id } = useParams();
  const router = useRouter();

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
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Charger l'article à éditer
  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!isEdit) return;
      setBusy(true);
      try {
        const result = await fetchArticleById(id);
        console.log('fetchArticleById result:', result);
        console.log('Article keys:', Object.keys(result));
        console.log('Content field:', result.content, result.body, result.text);
        if (mounted && result) {
          setTitle(result.title || '');
          setContent(result.content || result.body || '');
          setStatus(result.status || 'draft');
          setExcerpt(result.excerpt || '');
          setFeaturedImage(result.featured_image || result.cover_url || '');
          setMetaTitle(result.meta_title || '');
          setMetaDescription(result.meta_description || '');
          setCategories(result.categories ? result.categories.join(', ') : '');
          setTags(result.tags ? result.tags.join(', ') : '');
          setCustomSlug(result.custom_slug || '');
          setAllowComments(result.allow_comments !== false);
          setIsSticky(result.is_sticky || false);
        }
      } catch (e) {
        console.error('Load error:', e);
        if (mounted) setErr(e.message || 'Error');
      } finally {
        if (mounted) setBusy(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [id, isEdit]);

  async function convertToWebP(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Créer un canvas pour convertir l'image
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);

          // Convertir en WebP avec qualité 85%
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Conversion WebP échouée'));
              }
            },
            'image/webp',
            0.85
          );
        };
        img.onerror = () => reject(new Error('Impossible de charger l\'image'));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('Impossible de lire le fichier'));
      reader.readAsDataURL(file);
    });
  }

  async function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image trop grande (max 5MB)');
      return;
    }

    // Vérifier le type
    if (!file.type.startsWith('image/')) {
      setUploadError('Veuillez sélectionner une image');
      return;
    }

    setUploadingImage(true);
    setUploadError('');

    try {
      // Convertir en WebP
      const webpBlob = await convertToWebP(file);

      // Générer un nom de fichier unique avec extension .webp
      const timestamp = Date.now();
      const fileName = `${timestamp}.webp`;
      const filePath = `articles/${user.id}/${fileName}`;

      console.log('Uploading to:', filePath);

      // Upload vers Supabase Storage
      const { data, error } = await supabase.storage
        .from('public-assets')
        .upload(filePath, webpBlob, {
          contentType: 'image/webp',
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.error('Storage error details:', error);
        throw new Error(error.message || 'Erreur d\'upload');
      }

      console.log('Upload successful:', data);

      // Obtenir l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('public-assets')
        .getPublicUrl(filePath);

      console.log('Public URL:', publicUrl);
      setFeaturedImage(publicUrl);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error.message || 'Erreur lors de l\'upload. Vérifiez les permissions du bucket.');
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleRemoveImage() {
    if (!featuredImage) return;

    // Extraire le chemin du fichier depuis l'URL
    try {
      const url = new URL(featuredImage);
      const pathMatch = url.pathname.match(/\/public-assets\/(.+)$/);

      if (pathMatch) {
        const filePath = pathMatch[1];
        await supabase.storage
          .from('public-assets')
          .remove([filePath]);
      }
    } catch (error) {
      console.error('Error removing file:', error);
    }

    setFeaturedImage('');
  }

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
        // Redirect to the article page after update
        if (data && data.slug) {
          router.push(`/article/${data.slug}`, { replace: true });
        } else {
          router.push('/dashboard', { replace: true });
        }
      } else {
        const { data, error } = await createArticle({
          ...articleData,
          author_id: user.id,
        });
        if (error) throw error;
        // Redirect to the article page after creation
        if (data && data.slug) {
          router.push(`/article/${data.slug}`, { replace: true });
        } else {
          router.push('/dashboard', { replace: true });
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
            href="/dashboard"
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
              {A.tabContent || 'Contenu'}
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
              {A.tabSeo || 'SEO & Médias'}
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
              {A.tabSettings || 'Paramètres'}
            </button>
          </div>

          {/* Tab: Contenu */}
          {activeTab === 'content' && (
            <div className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {A.titleLabel || 'Titre de l\'article'} *
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
                  {A.contentLabel || 'Contenu'} *
                </label>
                <TipTapEditor
                  content={content}
                  onChange={setContent}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {A.excerpt || 'Extrait'}
                </label>
                <textarea
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 min-h-[100px] transition focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/30 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder={A.excerptPh || 'Un court résumé de votre article...'}
                  maxLength={300}
                />
                <p className="mt-1 text-xs text-gray-500">{excerpt.length}/300</p>
              </div>

              {/* Bouton Enregistrer dans l'onglet */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{A.statusLabel || 'Statut'}:</span>
                  <select
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold transition focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/30 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="draft">{A.statusDraft || '📝 Brouillon'}</option>
                    <option value="published">{A.statusPublished || '🌍 Publié'}</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={busy}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {busy ? (A.saving || 'Enregistrement...') : (isEdit ? (A.update || 'Mettre à jour') : (A.save || 'Publier'))}
                </button>
              </div>
            </div>
          )}

          {/* Tab: SEO & Médias */}
          {activeTab === 'seo' && (
            <div className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
              <div className="border-b border-gray-200 pb-4 dark:border-gray-800">
                <h3 className="text-lg font-bold text-black dark:text-white">{A.featuredImage || 'Image mise en avant'}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{A.featuredImageDesc || 'L\'image principale de votre article'}</p>
              </div>

              <div>
                {!featuredImage ? (
                  <div className="space-y-3">
                    <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-red-500 transition dark:border-gray-700 dark:hover:border-red-500">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        {uploadingImage ? (
                          <>
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mb-3"></div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Téléversement en cours...</p>
                          </>
                        ) : (
                          <>
                            <svg className="w-12 h-12 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <p className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                              Cliquez pour téléverser une image
                            </p>
                            <p className="text-xs text-gray-500">PNG, JPG, GIF (max. 5MB)</p>
                          </>
                        )}
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                      />
                    </label>
                    {uploadError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 dark:bg-red-900/20 dark:border-red-800">
                        {uploadError}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                      <div className="flex items-start justify-between mb-3">
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{A.imagePreview || 'Aperçu'}:</p>
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="px-3 py-1.5 text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition dark:bg-red-900/20 dark:hover:bg-red-900/30"
                        >
                          🗑️ Supprimer
                        </button>
                      </div>
                      <img src={featuredImage} alt="Preview" className="w-full max-h-64 rounded-lg object-cover" />
                    </div>
                    <label className="flex items-center justify-center w-full py-3 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-red-500 transition dark:border-gray-700 dark:hover:border-red-500">
                      <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Remplacer l'image
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                      />
                    </label>
                  </div>
                )}
              </div>

              <div className="border-b border-gray-200 pb-4 pt-6 dark:border-gray-800">
                <h3 className="text-lg font-bold text-black dark:text-white">{A.seoTitle || 'SEO (Référencement)'}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{A.seoDesc || 'Optimisez pour les moteurs de recherche'}</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {A.metaTitle || 'Titre SEO (Meta Title)'}
                </label>
                <input
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 transition focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/30 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  placeholder={title || (A.metaTitlePh || 'Titre personnalisé pour Google (55-60 caractères)')}
                  maxLength={60}
                />
                <p className="mt-1 text-xs text-gray-500">{metaTitle.length}/60 • {A.metaTitleHint || 'Laissez vide pour utiliser le titre de l\'article'}</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {A.metaDescription || 'Description SEO (Meta Description)'}
                </label>
                <textarea
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 min-h-[100px] transition focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/30 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  placeholder={A.metaDescPh || 'Description pour les résultats de recherche (120-155 caractères)...'}
                  maxLength={160}
                />
                <p className="mt-1 text-xs text-gray-500">{metaDescription.length}/160 • {A.metaDescHint || 'Laissez vide pour utiliser l\'extrait'}</p>
              </div>

              {/* Bouton Enregistrer dans l'onglet SEO */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{A.statusLabel || 'Statut'}:</span>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm transition focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/30 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  >
                    <option value="draft">{A.statusDraft || '📝 Brouillon'}</option>
                    <option value="published">{A.statusPublished || '🌍 Publié'}</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={busy}
                  className="rounded-xl bg-red-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {busy ? (A.saving || 'Enregistrement...') : (isEdit ? (A.update || 'Mettre à jour') : (A.save || 'Publier'))}
                </button>
              </div>
            </div>
          )}

          {/* Tab: Paramètres */}
          {activeTab === 'settings' && (
            <div className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
              <div className="border-b border-gray-200 pb-4 dark:border-gray-800">
                <h3 className="text-lg font-bold text-black dark:text-white">{A.taxonomiesTitle || 'Taxonomies'}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{A.taxonomiesDesc || 'Organisez votre contenu'}</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {A.categories || 'Catégories'}
                </label>
                <input
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 transition focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/30 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  value={categories}
                  onChange={(e) => setCategories(e.target.value)}
                  placeholder={A.categoriesPh || 'Ex: Technologie, Musique (séparées par des virgules)'}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {A.tags || 'Étiquettes (Tags)'}
                </label>
                <input
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 transition focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/30 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder={A.tagsPh || 'Ex: react, javascript, tutorial (séparées par des virgules)'}
                />
              </div>

              <div className="border-b border-gray-200 pb-4 pt-6 dark:border-gray-800">
                <h3 className="text-lg font-bold text-black dark:text-white">{A.permalinkTitle || 'Permalien'}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{A.permalinkDesc || 'Personnalisez l\'URL de l\'article'}</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {A.customSlug || 'Slug personnalisé'}
                </label>
                <input
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 font-mono text-sm transition focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/30 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  value={customSlug}
                  onChange={(e) => setCustomSlug(e.target.value)}
                  placeholder={A.customSlugPh || 'mon-article-personnalise'}
                />
                <p className="mt-1 text-xs text-gray-500">{A.customSlugHint || 'Laissez vide pour générer automatiquement depuis le titre'}</p>
              </div>

              <div className="border-b border-gray-200 pb-4 pt-6 dark:border-gray-800">
                <h3 className="text-lg font-bold text-black dark:text-white">{A.optionsTitle || 'Options'}</h3>
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
                    <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">{A.allowComments || 'Autoriser les commentaires'}</div>
                    <div className="text-xs text-gray-500">{A.allowCommentsDesc || 'Les lecteurs pourront commenter cet article'}</div>
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
                    <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">{A.isSticky || 'Épingler en haut du blog'}</div>
                    <div className="text-xs text-gray-500">{A.isStickyDesc || 'Cet article restera en haut de la liste'}</div>
                  </div>
                </label>
              </div>

              {/* Bouton Enregistrer dans l'onglet Paramètres */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{A.statusLabel || 'Statut'}:</span>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm transition focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/30 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  >
                    <option value="draft">{A.statusDraft || '📝 Brouillon'}</option>
                    <option value="published">{A.statusPublished || '🌍 Publié'}</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={busy}
                  className="rounded-xl bg-red-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {busy ? (A.saving || 'Enregistrement...') : (isEdit ? (A.update || 'Mettre à jour') : (A.save || 'Publier'))}
                </button>
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
                  href="/dashboard"
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
