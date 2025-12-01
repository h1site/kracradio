'use client';
// src/pages/PodcastEditor.jsx
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n';
import { supabase } from '../lib/supabaseClient';

const STRINGS = {
  fr: {
    metaTitle: 'Éditeur de podcast',
    newTitle: 'Nouveau podcast',
    editTitle: 'Modifier le podcast',
    back: 'Retour',
    title: 'Titre du podcast',
    rssUrl: 'URL du flux RSS',
    description: 'Description',
    imageUrl: 'URL Image de couverture',
    imageUrlHint: '*Optionnel : l\'image sera fournie par votre flux RSS',
    websiteUrl: 'URL du site web',
    author: 'Auteur',
    imagePreview: 'Aperçu de l\'image',
    save: 'Créer le podcast',
    update: 'Mettre à jour',
    saving: 'Enregistrement...',
    validating: 'Validation du flux RSS...',
    validateRss: 'Valider le flux RSS',
    rssValid: 'Flux RSS valide ✓',
    rssInvalid: 'Flux RSS invalide',
    rssError: 'Erreur de validation',
    rssRequired: 'L\'URL du flux RSS est requise',
  },
  en: {
    metaTitle: 'Podcast Editor',
    newTitle: 'New Podcast',
    editTitle: 'Edit Podcast',
    back: 'Back',
    title: 'Podcast Title',
    rssUrl: 'RSS Feed URL',
    description: 'Description',
    imageUrl: 'Cover Image URL',
    imageUrlHint: '*Optional: image will be provided by your RSS feed',
    websiteUrl: 'Website URL',
    author: 'Author',
    imagePreview: 'Image Preview',
    save: 'Create Podcast',
    update: 'Update',
    saving: 'Saving...',
    validating: 'Validating RSS feed...',
    validateRss: 'Validate RSS Feed',
    rssValid: 'RSS feed is valid ✓',
    rssInvalid: 'Invalid RSS feed',
    rssError: 'Validation error',
    rssRequired: 'RSS feed URL is required',
  },
  es: {
    metaTitle: 'Editor de podcast',
    newTitle: 'Nuevo podcast',
    editTitle: 'Editar podcast',
    back: 'Volver',
    title: 'Título del podcast',
    rssUrl: 'URL del feed RSS',
    description: 'Descripción',
    imageUrl: 'URL de la imagen de portada',
    imageUrlHint: '*Opcional: la imagen será proporcionada por su feed RSS',
    websiteUrl: 'URL del sitio web',
    author: 'Autor',
    imagePreview: 'Vista previa de la imagen',
    save: 'Crear podcast',
    update: 'Actualizar',
    saving: 'Guardando...',
    validating: 'Validando feed RSS...',
    validateRss: 'Validar feed RSS',
    rssValid: 'Feed RSS válido ✓',
    rssInvalid: 'Feed RSS inválido',
    rssError: 'Error de validación',
    rssRequired: 'La URL del feed RSS es obligatoria',
  },
};

export default function PodcastEditor() {
  const { user } = useAuth();
  const { lang } = useI18n();
  const { id } = useParams();
  const router = useRouter();
  const L = STRINGS[lang] || STRINGS.fr;
  const isEdit = Boolean(id);

  const [title, setTitle] = useState('');
  const [rssUrl, setRssUrl] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [author, setAuthor] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null); // null, 'valid', or 'invalid'
  const [validationMessage, setValidationMessage] = useState('');

  // Charger le podcast à éditer
  useEffect(() => {
    if (!isEdit) return;
    let mounted = true;
    async function load() {
      setBusy(true);
      try {
        const { data, error } = await supabase
          .from('user_podcasts')
          .select('*')
          .eq('id', id)
          .single();

        if (mounted) {
          if (error) throw error;
          if (data) {
            setTitle(data.title || '');
            setRssUrl(data.rss_url || '');
            setDescription(data.description || '');
            setImageUrl(data.image_url || '');
            setWebsiteUrl(data.website_url || '');
            setAuthor(data.author || '');
          }
        }
      } catch (e) {
        if (mounted) setErr(e.message || 'Erreur de chargement');
      } finally {
        if (mounted) setBusy(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [id, isEdit]);

  async function validateRssUrl() {
    if (!rssUrl.trim()) {
      setValidationResult('invalid');
      setValidationMessage(L.rssRequired);
      return;
    }

    setValidating(true);
    setValidationResult(null);
    setValidationMessage('');

    try {
      // Try to fetch the RSS feed
      const response = await fetch(rssUrl, {
        method: 'HEAD',
        mode: 'no-cors', // Avoid CORS issues for HEAD request
      });

      // Since mode is no-cors, we can't read the response, but if no error is thrown, URL is accessible
      // Now let's try to actually parse it using a CORS proxy or direct fetch
      const xmlResponse = await fetch(rssUrl);

      if (!xmlResponse.ok) {
        throw new Error(`HTTP ${xmlResponse.status}`);
      }

      const xmlText = await xmlResponse.text();

      // Basic XML validation - check for RSS/feed structure
      if (!xmlText.includes('<rss') && !xmlText.includes('<feed')) {
        throw new Error('Not a valid RSS/Atom feed');
      }

      // Check for essential podcast elements
      const hasChannel = xmlText.includes('<channel') || xmlText.includes('<feed');
      const hasItems = xmlText.includes('<item') || xmlText.includes('<entry');

      if (!hasChannel || !hasItems) {
        throw new Error('Feed missing required elements');
      }

      setValidationResult('valid');
      setValidationMessage(L.rssValid);
    } catch (error) {
      console.error('RSS validation error:', error);
      setValidationResult('invalid');
      setValidationMessage(`${L.rssInvalid}: ${error.message}`);
    } finally {
      setValidating(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    setErr('');

    try {
      const podcastData = {
        title,
        rss_url: rssUrl,
        description,
        image_url: imageUrl || null,
        website_url: websiteUrl || null,
        author: author || null,
      };

      if (isEdit) {
        const { error } = await supabase
          .from('user_podcasts')
          .update(podcastData)
          .eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_podcasts')
          .insert([{ ...podcastData, user_id: user.id, is_active: true }]);
        if (error) throw error;
      }

      router.push('/dashboard', { replace: true });
    } catch (e) {
      setErr(e.message || 'Erreur');
      setBusy(false);
    }
  }

  return (
    <main className="container-max px-5 py-6 pb-20">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-black dark:text-white">
            {isEdit ? L.editTitle : L.newTitle}
          </h1>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold transition hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-900"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
            </svg>
            {L.back}
          </Link>
        </div>

        {err && (
          <div className="mb-4 rounded-xl bg-red-100 p-4 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-200">
            {err}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
            <div className="space-y-6">
              {/* Titre */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {L.title} *
                </label>
                <input
                  type="text"
                  required
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 transition focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/30 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              {/* URL RSS Feed */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {L.rssUrl} *
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    required
                    className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 transition focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/30 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    value={rssUrl}
                    onChange={(e) => {
                      setRssUrl(e.target.value);
                      setValidationResult(null);
                      setValidationMessage('');
                    }}
                    placeholder="https://example.com/feed.xml"
                  />
                  <button
                    type="button"
                    onClick={validateRssUrl}
                    disabled={validating || !rssUrl.trim()}
                    className="px-4 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition whitespace-nowrap"
                  >
                    {validating ? L.validating : L.validateRss}
                  </button>
                </div>
                {validationMessage && (
                  <div className={`mt-2 rounded-lg px-3 py-2 text-sm ${
                    validationResult === 'valid'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
                  }`}>
                    {validationMessage}
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {L.description}
                </label>
                <textarea
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 min-h-[100px] transition focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/30 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {/* URL Image */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {L.imageUrl}
                  </label>
                  <input
                    type="url"
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 transition focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/30 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/cover.jpg"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{L.imageUrlHint}</p>
                </div>

                {/* URL Website */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {L.websiteUrl}
                  </label>
                  <input
                    type="url"
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 transition focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/30 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>
              </div>

              {/* Auteur */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {L.author}
                </label>
                <input
                  type="text"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 transition focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/30 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                />
              </div>

              {imageUrl && (
                <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                  <p className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">{L.imagePreview}:</p>
                  <img src={imageUrl} alt="Preview" className="max-h-48 rounded-lg object-cover" />
                </div>
              )}
            </div>

            {/* Bouton submit */}
            <div className="flex items-center justify-end pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="submit"
                disabled={busy}
                className="rounded-xl bg-red-600 px-8 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {busy ? L.saving : (isEdit ? L.update : L.save)}
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
