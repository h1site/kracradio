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
    newTitle: 'Ajouter un podcast',
    editTitle: 'Modifier le podcast',
    back: 'Retour',
    rssUrl: 'URL du flux RSS',
    rssUrlHint: 'Entrez l\'URL de votre flux RSS et les informations seront extraites automatiquement',
    save: 'Ajouter le podcast',
    update: 'Mettre à jour',
    saving: 'Enregistrement...',
    validating: 'Validation...',
    rssInvalid: 'Flux RSS invalide',
    rssError: 'Erreur de validation',
    rssRequired: 'L\'URL du flux RSS est requise',
    feedInfo: 'Informations du flux',
    title: 'Titre',
    author: 'Auteur',
    episodes: 'Épisodes',
    description: 'Description',
  },
  en: {
    metaTitle: 'Podcast Editor',
    newTitle: 'Add a Podcast',
    editTitle: 'Edit Podcast',
    back: 'Back',
    rssUrl: 'RSS Feed URL',
    rssUrlHint: 'Enter your RSS feed URL and the information will be extracted automatically',
    save: 'Add Podcast',
    update: 'Update',
    saving: 'Saving...',
    validating: 'Validating...',
    rssInvalid: 'Invalid RSS feed',
    rssError: 'Validation error',
    rssRequired: 'RSS feed URL is required',
    feedInfo: 'Feed Information',
    title: 'Title',
    author: 'Author',
    episodes: 'Episodes',
    description: 'Description',
  },
  es: {
    metaTitle: 'Editor de podcast',
    newTitle: 'Agregar un podcast',
    editTitle: 'Editar podcast',
    back: 'Volver',
    rssUrl: 'URL del feed RSS',
    rssUrlHint: 'Ingrese la URL de su feed RSS y la información se extraerá automáticamente',
    save: 'Agregar podcast',
    update: 'Actualizar',
    saving: 'Guardando...',
    validating: 'Validando...',
    rssInvalid: 'Feed RSS inválido',
    rssError: 'Error de validación',
    rssRequired: 'La URL del feed RSS es obligatoria',
    feedInfo: 'Información del feed',
    title: 'Título',
    author: 'Autor',
    episodes: 'Episodios',
    description: 'Descripción',
  },
};

export default function PodcastEditor() {
  const { user } = useAuth();
  const { lang } = useI18n();
  const { id } = useParams();
  const router = useRouter();
  const L = STRINGS[lang] || STRINGS.fr;
  const isEdit = Boolean(id);

  const [rssUrl, setRssUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [validating, setValidating] = useState(false);
  const [feedData, setFeedData] = useState(null); // Extracted feed data

  // Load existing podcast for editing
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
            setRssUrl(data.rss_url || '');
            // Set existing data as feed preview
            setFeedData({
              feedTitle: data.title,
              feedImage: data.image_url,
              feedDescription: data.description,
              feedAuthor: data.author,
              feedWebsite: data.website_url,
              episodeCount: null, // Unknown for existing
            });
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

  async function validateAndExtract(url) {
    if (!url.trim()) {
      setFeedData(null);
      return null;
    }

    setValidating(true);
    setErr('');
    setFeedData(null);

    try {
      const response = await fetch('/api/validate-rss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const result = await response.json();

      if (result.valid) {
        setFeedData(result);
        return result;
      } else {
        setErr(`${L.rssInvalid}: ${result.error}`);
        return null;
      }
    } catch (error) {
      console.error('RSS validation error:', error);
      setErr(`${L.rssError}: ${error.message}`);
      return null;
    } finally {
      setValidating(false);
    }
  }

  // Debounced validation on URL change
  useEffect(() => {
    if (!rssUrl.trim() || isEdit) return;

    const timer = setTimeout(() => {
      validateAndExtract(rssUrl);
    }, 800);

    return () => clearTimeout(timer);
  }, [rssUrl, isEdit]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!user) return;

    if (!rssUrl.trim()) {
      setErr(L.rssRequired);
      return;
    }

    setBusy(true);
    setErr('');

    try {
      // If no feed data yet, validate first
      let data = feedData;
      if (!data && !isEdit) {
        data = await validateAndExtract(rssUrl);
        if (!data) {
          setBusy(false);
          return;
        }
      }

      const podcastData = {
        title: data?.feedTitle || rssUrl,
        rss_url: rssUrl,
        description: data?.feedDescription || null,
        image_url: data?.feedImage || null,
        website_url: data?.feedWebsite || null,
        author: data?.feedAuthor || null,
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
      <div className="max-w-2xl mx-auto">
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
            {/* RSS URL Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {L.rssUrl} *
              </label>
              <input
                type="url"
                required
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 transition focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/30 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                value={rssUrl}
                onChange={(e) => {
                  setRssUrl(e.target.value);
                  if (!isEdit) {
                    setFeedData(null);
                    setErr('');
                  }
                }}
                placeholder="https://example.com/feed.xml"
              />
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {L.rssUrlHint}
              </p>
            </div>

            {/* Loading indicator */}
            {validating && (
              <div className="mt-4 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                {L.validating}
              </div>
            )}

            {/* Feed Preview */}
            {feedData && !validating && (
              <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  {L.feedInfo}
                </h3>
                <div className="flex gap-4">
                  {feedData.feedImage && (
                    <img
                      src={feedData.feedImage}
                      alt={feedData.feedTitle}
                      className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    {feedData.feedTitle && (
                      <p className="font-semibold text-gray-900 dark:text-white truncate">
                        {feedData.feedTitle}
                      </p>
                    )}
                    {feedData.feedAuthor && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {L.author}: {feedData.feedAuthor}
                      </p>
                    )}
                    {feedData.episodeCount != null && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {feedData.episodeCount} {L.episodes}
                      </p>
                    )}
                    {feedData.feedDescription && (
                      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                        {feedData.feedDescription}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex items-center justify-end pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="submit"
                disabled={busy || validating}
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
