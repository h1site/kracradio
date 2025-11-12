// src/pages/Dashboard.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n';
import Seo from '../seo/Seo';
import { supabase, listUserArticles, deleteArticleById } from '../lib/supabase';
import { importAllUserPodcasts, importPodcastEpisodes } from '../utils/podcastRssParser';

const STRINGS = {
  fr: {
    metaTitle: 'Mon tableau de bord — KracRadio',
    metaDesc: 'Gérez vos podcasts et articles sur KracRadio',
    title: 'Mon tableau de bord',
    subtitle: 'Gérez vos podcasts et articles',
    myBlog: 'Mes articles de blog',
    createArticle: 'Créer un article',
    viewArticle: 'Voir',
    editArticle: 'Modifier',
    noArticles: 'Aucun article',
    status: 'Statut',
    published: 'Publié',
    draft: 'Brouillon',
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
    metaDesc: 'Manage your podcasts and articles on KracRadio',
    title: 'My Dashboard',
    subtitle: 'Manage your podcasts and articles',
    myBlog: 'My blog articles',
    createArticle: 'Create article',
    viewArticle: 'View',
    editArticle: 'Edit',
    noArticles: 'No articles',
    status: 'Status',
    published: 'Published',
    draft: 'Draft',
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
    metaDesc: 'Administra tus podcasts y artículos en KracRadio',
    title: 'Mi panel',
    subtitle: 'Administra tus podcasts y artículos',
    myBlog: 'Mis artículos de blog',
    createArticle: 'Crear artículo',
    viewArticle: 'Ver',
    editArticle: 'Editar',
    noArticles: 'Sin artículos',
    status: 'Estado',
    published: 'Publicado',
    draft: 'Borrador',
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
  const { user, userRole, isCreator, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [podcasts, setPodcasts] = useState([]);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null or podcast object
  const [formData, setFormData] = useState(blankPodcast);
  const [message, setMessage] = useState(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      loadPodcasts();
      loadArticles();
    }
  }, [user]);

  const loadArticles = async () => {
    try {
      const data = await listUserArticles(user.id);
      setArticles(data || []);
    } catch (error) {
      console.error('Error loading articles:', error);
    }
  };

  const loadPodcasts = async () => {
    try {
      setLoading(true);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const { data, error } = await supabase
        .from('user_podcasts')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .abortSignal(controller.signal);

      clearTimeout(timeoutId);

      if (error) throw error;
      setPodcasts(data || []);
    } catch (error) {
      console.error('Error loading podcasts:', error);
      setMessage({ type: 'error', text: error.message });
      setPodcasts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (podcast) => {
    navigate(`/dashboard/podcasts/edit/${podcast.id}`);
  };

  const handleAdd = () => {
    navigate('/dashboard/podcasts/edit');
  };

  const handleCancel = () => {
    setEditing(null);
    setFormData(blankPodcast);
  };

  const handleDeleteArticle = async (articleId, articleTitle) => {
    if (!window.confirm(L.confirmDelete || 'Are you sure you want to delete this article?')) {
      return;
    }

    try {
      await deleteArticleById(articleId);
      // Refresh articles list
      await loadArticles();
      setMessage({ type: 'success', text: 'Article deleted successfully' });
    } catch (error) {
      console.error('Error deleting article:', error);
      setMessage({ type: 'error', text: error.message });
    }
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

      <header className="relative pt-6 pb-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex-1">
            <div className="mb-2 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-red-100 to-orange-100 px-3 py-1 text-xs font-semibold text-red-700 dark:from-red-900/30 dark:to-orange-900/30 dark:text-red-300">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
              Content Hub
            </div>
            <h1 className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-3xl font-bold tracking-tight text-transparent dark:from-white dark:to-gray-300 md:text-4xl">
              {L.title}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-gray-600 dark:text-gray-400">
              {L.subtitle}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/settings"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:border-gray-300 hover:shadow dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-gray-600"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
              </svg>
              Settings
            </Link>
            {userRole === 'admin' && (
              <Link
                to="/admin"
                className="inline-flex items-center gap-2 rounded-lg border border-red-600 bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-red-700 hover:border-red-700"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                </svg>
                Admin
              </Link>
            )}
          </div>
        </div>
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

      {/* Section Blog */}
      <section className="mb-12 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-orange-500 shadow-lg">
              <svg viewBox="0 0 24 24" className="h-6 w-6 text-white" fill="currentColor">
                <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-black dark:text-white">{L.myBlog}</h2>
          </div>
          {isCreator() && (
            <Link
              to="/dashboard/articles/edit"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl hover:scale-105"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2Z" />
              </svg>
              {L.createArticle}
            </Link>
          )}
        </div>

        {articles.length === 0 ? (
          <div className="relative overflow-hidden rounded-3xl border-2 border-dashed border-gray-300 bg-gradient-to-br from-gray-50 to-white p-12 text-center shadow-sm dark:border-gray-700 dark:from-gray-900 dark:to-gray-950">
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-red-500/5 blur-2xl"></div>
            <svg viewBox="0 0 24 24" className="mx-auto mb-4 h-16 w-16 text-gray-300 dark:text-gray-700" fill="currentColor">
              <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
            </svg>
            <p className="text-lg font-medium text-gray-600 dark:text-gray-400">{L.noArticles}</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <div
                key={article.id}
                className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-md transition-all duration-300 hover:scale-[1.02] hover:shadow-xl dark:border-gray-800 dark:bg-gray-950"
              >
                <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br from-red-500/10 to-orange-500/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                <div className="relative">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold dark:bg-gray-800">
                    <span className={`h-2 w-2 rounded-full ${article.status === 'published' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                    {article.status === 'published' ? L.published : L.draft}
                  </div>
                  <h3 className="mb-4 text-xl font-bold text-black dark:text-white line-clamp-2">
                    {article.title}
                  </h3>
                  <div className="flex gap-2">
                    <Link
                      to={`/article/${article.slug}`}
                      className="flex-1 rounded-lg border-2 border-gray-200 px-3 py-2 text-center text-sm font-semibold transition hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:border-gray-600 dark:hover:bg-gray-900"
                    >
                      {L.viewArticle}
                    </Link>
                    <Link
                      to={`/dashboard/articles/edit/${article.id}`}
                      className="flex-1 rounded-lg bg-gradient-to-r from-gray-700 to-gray-600 px-3 py-2 text-center text-sm font-semibold text-white transition hover:from-gray-600 hover:to-gray-500"
                    >
                      {L.editArticle}
                    </Link>
                    <button
                      onClick={() => handleDeleteArticle(article.id, article.title)}
                      className="rounded-lg bg-gradient-to-r from-red-600 to-red-700 px-3 py-2 text-sm font-semibold text-white transition hover:from-red-700 hover:to-red-800"
                      title={L.delete || 'Delete'}
                    >
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Section Podcasts */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
              <svg viewBox="0 0 24 24" className="h-6 w-6 text-white" fill="currentColor">
                <path d="M12 2a9 9 0 0 0-9 9v7.5A2.5 2.5 0 0 0 5.5 21h1a2.5 2.5 0 0 0 2.5-2.5V15a2.5 2.5 0 0 0-2.5-2.5h-.5v-1A7 7 0 0 1 19 11.5v1h-.5A2.5 2.5 0 0 0 16 15v3.5a2.5 2.5 0 0 0 2.5 2.5h1a2.5 2.5 0 0 0 2.5-2.5V11a9 9 0 0 0-9-9z"/>
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-black dark:text-white">{L.myPodcasts}</h2>
          </div>
          <div className="flex gap-3">
            {!editing && podcasts.length > 0 && (
              <button
                onClick={handleImportAll}
                disabled={importing}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                  <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46A7.93 7.93 0 0 0 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74A7.93 7.93 0 0 0 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z" />
                </svg>
                {importing ? L.importing : L.importAll}
              </button>
            )}
            {!editing && podcasts.length < 3 && isCreator() && (
              <button
                onClick={handleAdd}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl hover:scale-105"
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

        {/* Formulaire d'édition/ajout - APRÈS la liste */}
        {editing && (
          <form onSubmit={handleSave} className="mt-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
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
      </section>
    </main>
  );
}
