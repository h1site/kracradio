// src/pages/Dashboard.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n';
import Seo from '../seo/Seo';
import { supabase } from '../lib/supabase';
import { importAllUserPodcasts, importPodcastEpisodes } from '../utils/podcastRssParser';

const STRINGS = {
  fr: {
    metaTitle: 'Mon tableau de bord — KracRadio',
    metaDesc: 'Gérez vos podcasts sur KracRadio',
    title: 'Mon tableau de bord',
    subtitle: 'Gérez vos podcasts (maximum 3)',
    myPodcasts: 'Mes podcasts',
    addPodcast: 'Ajouter un podcast',
    noPodcasts: 'Vous n\'avez aucun podcast enregistré',
    limitReached: 'Vous avez atteint la limite de 3 podcasts',
    podcastTitle: 'Titre du podcast',
    rssUrl: 'URL du flux RSS',
    description: 'Description (optionnel)',
    imageUrl: 'URL de l\'image (optionnel)',
    websiteUrl: 'Site web (optionnel)',
    author: 'Auteur (optionnel)',
    save: 'Enregistrer',
    cancel: 'Annuler',
    delete: 'Supprimer',
    edit: 'Modifier',
    episodes: 'épisodes',
    lastUpdate: 'Dernière mise à jour',
    loading: 'Chargement...',
    error: 'Erreur',
    success: 'Succès',
    podcastAdded: 'Podcast ajouté avec succès',
    podcastUpdated: 'Podcast mis à jour avec succès',
    podcastDeleted: 'Podcast supprimé',
    confirmDelete: 'Êtes-vous sûr de vouloir supprimer ce podcast ?',
    notAuthenticated: 'Vous devez être connecté pour accéder à cette page',
    importAll: 'Importer tous les épisodes',
    importing: 'Import en cours...',
    importSuccess: 'Import réussi',
    importError: 'Erreur lors de l\'import',
    importThis: 'Importer',
  },
  en: {
    metaTitle: 'My Dashboard — KracRadio',
    metaDesc: 'Manage your podcasts on KracRadio',
    title: 'My Dashboard',
    subtitle: 'Manage your podcasts (maximum 3)',
    myPodcasts: 'My podcasts',
    addPodcast: 'Add a podcast',
    noPodcasts: 'You have no registered podcasts',
    limitReached: 'You have reached the limit of 3 podcasts',
    podcastTitle: 'Podcast title',
    rssUrl: 'RSS feed URL',
    description: 'Description (optional)',
    imageUrl: 'Image URL (optional)',
    websiteUrl: 'Website (optional)',
    author: 'Author (optional)',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    episodes: 'episodes',
    lastUpdate: 'Last update',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    podcastAdded: 'Podcast added successfully',
    podcastUpdated: 'Podcast updated successfully',
    podcastDeleted: 'Podcast deleted',
    confirmDelete: 'Are you sure you want to delete this podcast?',
    notAuthenticated: 'You must be logged in to access this page',
    importAll: 'Import all episodes',
    importing: 'Importing...',
    importSuccess: 'Import successful',
    importError: 'Import error',
    importThis: 'Import',
  },
  es: {
    metaTitle: 'Mi panel — KracRadio',
    metaDesc: 'Administra tus podcasts en KracRadio',
    title: 'Mi panel',
    subtitle: 'Administra tus podcasts (máximo 3)',
    myPodcasts: 'Mis podcasts',
    addPodcast: 'Agregar un podcast',
    noPodcasts: 'No tienes podcasts registrados',
    limitReached: 'Has alcanzado el límite de 3 podcasts',
    podcastTitle: 'Título del podcast',
    rssUrl: 'URL del feed RSS',
    description: 'Descripción (opcional)',
    imageUrl: 'URL de imagen (opcional)',
    websiteUrl: 'Sitio web (opcional)',
    author: 'Autor (opcional)',
    save: 'Guardar',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    edit: 'Editar',
    episodes: 'episodios',
    lastUpdate: 'Última actualización',
    loading: 'Cargando...',
    error: 'Error',
    success: 'Éxito',
    podcastAdded: 'Podcast agregado exitosamente',
    podcastUpdated: 'Podcast actualizado exitosamente',
    podcastDeleted: 'Podcast eliminado',
    confirmDelete: '¿Estás seguro de que quieres eliminar este podcast?',
    notAuthenticated: 'Debes iniciar sesión para acceder a esta página',
    importAll: 'Importar todos los episodios',
    importing: 'Importando...',
    importSuccess: 'Importación exitosa',
    importError: 'Error de importación',
    importThis: 'Importar',
  },
};

const blankPodcast = {
  title: '',
  rss_url: '',
  description: '',
  image_url: '',
  website_url: '',
  author: '',
};

export default function Dashboard() {
  const { lang } = useI18n();
  const L = useMemo(() => STRINGS[lang] || STRINGS.fr, [lang]);
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [podcasts, setPodcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null or podcast object
  const [formData, setFormData] = useState(blankPodcast);
  const [message, setMessage] = useState(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      loadPodcasts();
    }
  }, [user]);

  const loadPodcasts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_podcasts')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPodcasts(data || []);
    } catch (error) {
      console.error('Error loading podcasts:', error);
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (podcast) => {
    setEditing(podcast);
    setFormData({
      title: podcast.title,
      rss_url: podcast.rss_url,
      description: podcast.description || '',
      image_url: podcast.image_url || '',
      website_url: podcast.website_url || '',
      author: podcast.author || '',
    });
  };

  const handleAdd = () => {
    setEditing({ id: null });
    setFormData(blankPodcast);
  };

  const handleCancel = () => {
    setEditing(null);
    setFormData(blankPodcast);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    try {
      if (editing?.id) {
        // Update existing
        const { error } = await supabase
          .from('user_podcasts')
          .update(formData)
          .eq('id', editing.id);

        if (error) throw error;
        setMessage({ type: 'success', text: L.podcastUpdated });
      } else {
        // Insert new
        const { error } = await supabase
          .from('user_podcasts')
          .insert([{ ...formData, user_id: user.id }]);

        if (error) throw error;
        setMessage({ type: 'success', text: L.podcastAdded });
      }

      handleCancel();
      loadPodcasts();
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error saving podcast:', error);
      setMessage({ type: 'error', text: error.message });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(L.confirmDelete)) return;

    try {
      const { error } = await supabase
        .from('user_podcasts')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      setMessage({ type: 'success', text: L.podcastDeleted });
      loadPodcasts();
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error deleting podcast:', error);
      setMessage({ type: 'error', text: error.message });
    }
  };

  const handleImportAll = async () => {
    setImporting(true);
    setMessage({ type: 'info', text: L.importing });

    try {
      const result = await importAllUserPodcasts(supabase, user.id);

      if (result.success) {
        const totalImported = result.results.reduce((sum, r) => sum + (r.imported || 0), 0);
        setMessage({
          type: 'success',
          text: `${L.importSuccess}: ${totalImported} épisodes importés`,
        });
      } else {
        setMessage({ type: 'error', text: `${L.importError}: ${result.error}` });
      }

      setTimeout(() => setMessage(null), 5000);
    } catch (error) {
      console.error('Error importing podcasts:', error);
      setMessage({ type: 'error', text: error.message });
    } finally {
      setImporting(false);
    }
  };

  const handleImportOne = async (podcast) => {
    setImporting(true);
    setMessage({ type: 'info', text: L.importing });

    try {
      const result = await importPodcastEpisodes(supabase, podcast.id, podcast.rss_url);

      if (result.success) {
        setMessage({
          type: 'success',
          text: `${L.importSuccess}: ${result.imported} épisodes importés pour "${podcast.title}"`,
        });
      } else {
        setMessage({ type: 'error', text: `${L.importError}: ${result.error}` });
      }

      setTimeout(() => setMessage(null), 5000);
    } catch (error) {
      console.error('Error importing podcast:', error);
      setMessage({ type: 'error', text: error.message });
    } finally {
      setImporting(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="container-max px-5 pt-20 pb-16 text-center">
        <p>{L.loading}</p>
      </div>
    );
  }

  return (
    <main className="container-max px-5 pb-16">
      <Seo
        lang={lang}
        title={L.metaTitle}
        description={L.metaDesc}
        path="/dashboard"
        type="website"
      />

      <header className="pt-16 pb-12">
        <h1 className="text-3xl font-extrabold tracking-tight text-black dark:text-white md:text-5xl">
          {L.title}
        </h1>
        <p className="mt-4 max-w-3xl text-base text-gray-700 dark:text-gray-300 md:text-lg">
          {L.subtitle}
        </p>
      </header>

      {message && (
        <div className={`mb-6 rounded-2xl border p-4 ${
          message.type === 'success'
            ? 'border-green-500/40 bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-100'
            : 'border-red-500/40 bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-100'
        }`}>
          {message.text}
        </div>
      )}

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-black dark:text-white">{L.myPodcasts}</h2>
          <div className="flex gap-3">
            {!editing && podcasts.length > 0 && (
              <button
                onClick={handleImportAll}
                disabled={importing}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                  <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46A7.93 7.93 0 0 0 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74A7.93 7.93 0 0 0 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z" />
                </svg>
                {importing ? L.importing : L.importAll}
              </button>
            )}
            {!editing && podcasts.length < 3 && (
              <button
                onClick={handleAdd}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2Z" />
                </svg>
                {L.addPodcast}
              </button>
            )}
          </div>
        </div>

        {podcasts.length >= 3 && !editing && (
          <div className="rounded-2xl border border-yellow-500/40 bg-yellow-50 p-4 text-sm text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-100">
            {L.limitReached}
          </div>
        )}

        {editing && (
          <form onSubmit={handleSave} className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
            <h3 className="mb-4 text-xl font-semibold text-black dark:text-white">
              {editing.id ? L.edit : L.addPodcast}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {L.podcastTitle} *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/30 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {L.rssUrl} *
                </label>
                <input
                  type="url"
                  required
                  value={formData.rss_url}
                  onChange={(e) => setFormData({ ...formData, rss_url: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/30 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                  placeholder="https://example.com/feed.xml"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {L.description}
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/30 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {L.imageUrl}
                  </label>
                  <input
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/30 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {L.websiteUrl}
                  </label>
                  <input
                    type="url"
                    value={formData.website_url}
                    onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/30 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {L.author}
                </label>
                <input
                  type="text"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm transition focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/30 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="submit"
                className="inline-flex items-center rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                {L.save}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="inline-flex items-center rounded-xl border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-900"
              >
                {L.cancel}
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <p className="text-center text-gray-600 dark:text-gray-400">{L.loading}</p>
        ) : podcasts.length === 0 && !editing ? (
          <div className="rounded-3xl border border-gray-200 bg-white p-12 text-center shadow-sm dark:border-gray-800 dark:bg-gray-950">
            <p className="text-gray-600 dark:text-gray-400">{L.noPodcasts}</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {podcasts.map((podcast) => (
              <article
                key={podcast.id}
                className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-gray-800 dark:bg-gray-950"
              >
                {podcast.image_url && (
                  <img
                    src={podcast.image_url}
                    alt={podcast.title}
                    className="mb-4 aspect-square w-full rounded-2xl object-cover"
                  />
                )}
                <h3 className="text-xl font-semibold text-black dark:text-white">{podcast.title}</h3>
                {podcast.author && (
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{podcast.author}</p>
                )}
                {podcast.description && (
                  <p className="mt-2 line-clamp-3 text-sm text-gray-700 dark:text-gray-300">
                    {podcast.description}
                  </p>
                )}
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => handleImportOne(podcast)}
                    disabled={importing}
                    className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {L.importThis}
                  </button>
                  <button
                    onClick={() => handleEdit(podcast)}
                    className="flex-1 rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-900"
                  >
                    {L.edit}
                  </button>
                  <button
                    onClick={() => handleDelete(podcast.id)}
                    className="rounded-xl border border-red-500/40 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-500/30 dark:text-red-300 dark:hover:bg-red-900/30"
                  >
                    {L.delete}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
