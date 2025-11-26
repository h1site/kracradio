// src/pages/Dashboard.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n';
import { useTheme } from '../context/ThemeContext';
import Seo from '../seo/Seo';
import { supabase, listUserArticles, deleteArticleById } from '../lib/supabase';
import { importAllUserPodcasts, importPodcastEpisodes } from '../utils/podcastRssParser';

function IconImg({ name, alt = '', className = 'w-5 h-5' }) {
  const { isDark } = useTheme();
  const src = `/icons/${isDark ? 'dark' : 'light'}/${name}.svg`;
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={(e) => {
        e.currentTarget.onerror = null;
        e.currentTarget.src = '/icons/default.svg';
      }}
    />
  );
}

const STRINGS = {
  fr: {
    metaTitle: 'Mon tableau de bord — KracRadio',
    metaDesc: 'Gérez vos podcasts et articles sur KracRadio',
    title: 'Dashboard',
    myBlog: 'Articles',
    createArticle: 'Nouvel article',
    viewArticle: 'Voir',
    editArticle: 'Modifier',
    noArticles: 'Aucun article',
    noArticlesDesc: 'Créez votre premier article pour commencer',
    published: 'Publié',
    draft: 'Brouillon',
    myPodcasts: 'Podcasts',
    addPodcast: 'Ajouter un podcast',
    noPodcasts: 'Aucun podcast',
    noPodcastsDesc: 'Ajoutez votre premier podcast RSS',
    limitReached: 'Limite de 3 podcasts atteinte',
    myStore: 'Boutique',
    storeDesc: 'Vendez votre musique sur store.kracradio.com',
    manageStore: 'Gérer ma boutique',
    submitTrack: 'Soumettre un titre',
    delete: 'Supprimer',
    edit: 'Modifier',
    loading: 'Chargement...',
    podcastDeleted: 'Podcast supprimé',
    podcastAdded: 'Podcast ajouté',
    podcastUpdated: 'Podcast mis à jour',
    confirmDelete: 'Êtes-vous sûr de vouloir supprimer ?',
    importAll: 'Importer tout',
    importing: 'Import...',
    importSuccess: 'Import réussi',
    importError: 'Erreur d\'import',
    importThis: 'Importer',
    save: 'Enregistrer',
    cancel: 'Annuler',
    podcastTitle: 'Titre',
    rssUrl: 'URL RSS',
    description: 'Description',
    author: 'Auteur',
    newPodcast: 'Nouveau podcast',
    editPodcast: 'Modifier le podcast',
  },
  en: {
    metaTitle: 'My Dashboard — KracRadio',
    metaDesc: 'Manage your podcasts and articles on KracRadio',
    title: 'Dashboard',
    myBlog: 'Articles',
    createArticle: 'New article',
    viewArticle: 'View',
    editArticle: 'Edit',
    noArticles: 'No articles',
    noArticlesDesc: 'Create your first article to get started',
    published: 'Published',
    draft: 'Draft',
    myPodcasts: 'Podcasts',
    addPodcast: 'Add podcast',
    noPodcasts: 'No podcasts',
    noPodcastsDesc: 'Add your first RSS podcast',
    limitReached: 'Limit of 3 podcasts reached',
    myStore: 'Store',
    storeDesc: 'Sell your music on store.kracradio.com',
    manageStore: 'Manage my store',
    submitTrack: 'Submit a track',
    delete: 'Delete',
    edit: 'Edit',
    loading: 'Loading...',
    podcastDeleted: 'Podcast deleted',
    podcastAdded: 'Podcast added',
    podcastUpdated: 'Podcast updated',
    confirmDelete: 'Are you sure you want to delete?',
    importAll: 'Import all',
    importing: 'Importing...',
    importSuccess: 'Import successful',
    importError: 'Import error',
    importThis: 'Import',
    save: 'Save',
    cancel: 'Cancel',
    podcastTitle: 'Title',
    rssUrl: 'RSS URL',
    description: 'Description',
    author: 'Author',
    newPodcast: 'New podcast',
    editPodcast: 'Edit podcast',
  },
  es: {
    metaTitle: 'Mi panel — KracRadio',
    metaDesc: 'Administra tus podcasts y artículos en KracRadio',
    title: 'Dashboard',
    myBlog: 'Artículos',
    createArticle: 'Nuevo artículo',
    viewArticle: 'Ver',
    editArticle: 'Editar',
    noArticles: 'Sin artículos',
    noArticlesDesc: 'Crea tu primer artículo para comenzar',
    published: 'Publicado',
    draft: 'Borrador',
    myPodcasts: 'Podcasts',
    addPodcast: 'Agregar podcast',
    noPodcasts: 'Sin podcasts',
    noPodcastsDesc: 'Agrega tu primer podcast RSS',
    limitReached: 'Límite de 3 podcasts alcanzado',
    myStore: 'Tienda',
    storeDesc: 'Vende tu música en store.kracradio.com',
    manageStore: 'Administrar mi tienda',
    submitTrack: 'Enviar una canción',
    delete: 'Eliminar',
    edit: 'Editar',
    loading: 'Cargando...',
    podcastDeleted: 'Podcast eliminado',
    podcastAdded: 'Podcast agregado',
    podcastUpdated: 'Podcast actualizado',
    confirmDelete: '¿Estás seguro de que quieres eliminar?',
    importAll: 'Importar todo',
    importing: 'Importando...',
    importSuccess: 'Importación exitosa',
    importError: 'Error de importación',
    importThis: 'Importar',
    save: 'Guardar',
    cancel: 'Cancelar',
    podcastTitle: 'Título',
    rssUrl: 'URL RSS',
    description: 'Descripción',
    author: 'Autor',
    newPodcast: 'Nuevo podcast',
    editPodcast: 'Editar podcast',
  },
};

const blankPodcast = { title: '', rss_url: '', description: '', image_url: '', author: '' };

export default function Dashboard() {
  const { lang } = useI18n();
  const L = useMemo(() => STRINGS[lang] || STRINGS.fr, [lang]);
  const { user, userRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [podcasts, setPodcasts] = useState([]);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [importing, setImporting] = useState(false);

  // Podcast form state
  const [showPodcastForm, setShowPodcastForm] = useState(false);
  const [editingPodcast, setEditingPodcast] = useState(null);
  const [podcastForm, setPodcastForm] = useState(blankPodcast);
  const [savingPodcast, setSavingPodcast] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      loadPodcasts();
      loadArticles();
    } else {
      // Reset loading si pas de user
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    const action = searchParams.get('action');
    if (tab === 'podcasts' && action === 'new' && user) {
      setShowPodcastForm(true);
      setEditingPodcast(null);
      setPodcastForm(blankPodcast);
    }
  }, [searchParams, user]);

  const loadArticles = async () => {
    try {
      const data = await listUserArticles(user.id);
      setArticles(data || []);
    } catch (error) {
      console.error('Error loading articles:', error);
    }
  };

  const loadPodcasts = async () => {
    if (!user?.id) {
      console.log('[Dashboard] No user id, skipping loadPodcasts');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('[Dashboard] Loading podcasts for user:', user.id);
      const { data, error } = await supabase
        .from('user_podcasts')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('[Dashboard] Podcasts loaded:', data?.length || 0);
      setPodcasts(data || []);
    } catch (error) {
      console.error('Error loading podcasts:', error);
      setPodcasts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteArticle = async (articleId) => {
    if (!window.confirm(L.confirmDelete)) return;
    try {
      await deleteArticleById(articleId);
      await loadArticles();
      setMessage({ type: 'success', text: 'Article deleted' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  const handleDeletePodcast = async (id) => {
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
      setMessage({ type: 'error', text: error.message });
    }
  };

  const handleEditPodcast = (podcast) => {
    setEditingPodcast(podcast);
    setPodcastForm({
      title: podcast.title || '',
      rss_url: podcast.rss_url || '',
      description: podcast.description || '',
      image_url: podcast.image_url || '',
      author: podcast.author || '',
    });
    setShowPodcastForm(true);
  };

  const handleAddPodcast = () => {
    setEditingPodcast(null);
    setPodcastForm(blankPodcast);
    setShowPodcastForm(true);
  };

  const handleCancelPodcastForm = () => {
    setShowPodcastForm(false);
    setEditingPodcast(null);
    setPodcastForm(blankPodcast);
  };

  const handleSavePodcast = async (e) => {
    e.preventDefault();
    setSavingPodcast(true);
    try {
      if (editingPodcast) {
        const { error } = await supabase
          .from('user_podcasts')
          .update(podcastForm)
          .eq('id', editingPodcast.id);
        if (error) throw error;
        setMessage({ type: 'success', text: L.podcastUpdated });
      } else {
        const { error } = await supabase
          .from('user_podcasts')
          .insert([{ ...podcastForm, user_id: user.id, is_active: true }]);
        if (error) throw error;
        setMessage({ type: 'success', text: L.podcastAdded });
      }
      handleCancelPodcastForm();
      loadPodcasts();
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSavingPodcast(false);
    }
  };

  const handleImportAll = async () => {
    setImporting(true);
    try {
      const result = await importAllUserPodcasts(supabase, user.id);
      if (result.success) {
        const total = result.results.reduce((sum, r) => sum + (r.imported || 0), 0);
        setMessage({ type: 'success', text: `${L.importSuccess}: ${total} episodes` });
      } else {
        setMessage({ type: 'error', text: L.importError });
      }
      setTimeout(() => setMessage(null), 5000);
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setImporting(false);
    }
  };

  const handleImportOne = async (podcast) => {
    setImporting(true);
    try {
      const result = await importPodcastEpisodes(supabase, podcast.id, podcast.rss_url);
      if (result.success) {
        setMessage({ type: 'success', text: `${L.importSuccess}: ${result.imported} episodes` });
      } else {
        setMessage({ type: 'error', text: L.importError });
      }
      setTimeout(() => setMessage(null), 5000);
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setImporting(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-black dark:border-t-white rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#121212]">
      <Seo lang={lang} title={L.metaTitle} description={L.metaDesc} path="/dashboard" type="website" />

      {/* Header */}
      <div className="bg-white dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{L.title}</h1>
            <div className="flex items-center gap-2">
              <Link
                to="/settings"
                className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Settings
              </Link>
              {userRole === 'admin' && (
                <Link
                  to="/admin"
                  className="px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                >
                  Admin
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className="max-w-5xl mx-auto px-6 pt-4">
          <div className={`px-4 py-3 rounded-lg text-sm ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300'
              : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'
          }`}>
            {message.text}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">

        {/* Articles Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/10 flex items-center justify-center">
                <IconImg name="paper" className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">{L.myBlog}</h2>
              <span className="text-sm text-gray-500 dark:text-gray-400">({articles.length})</span>
            </div>
            <Link
              to="/dashboard/articles/edit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
              </svg>
              {L.createArticle}
            </Link>
          </div>

          {articles.length === 0 ? (
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-gray-800 p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
                <IconImg name="paper" className="w-6 h-6 opacity-50" />
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{L.noArticles}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{L.noArticlesDesc}</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
              {articles.map((article) => (
                <div key={article.id} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="flex items-center gap-4 min-w-0">
                    <span className={`flex-shrink-0 w-2 h-2 rounded-full ${article.status === 'published' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                    <div className="min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">{article.title}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{article.status === 'published' ? L.published : L.draft}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Link
                      to={`/article/${article.slug}`}
                      className="px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                      {L.viewArticle}
                    </Link>
                    <Link
                      to={`/dashboard/articles/edit/${article.id}`}
                      className="px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                    >
                      {L.editArticle}
                    </Link>
                    <button
                      onClick={() => handleDeleteArticle(article.id)}
                      className="px-3 py-1.5 text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                    >
                      {L.delete}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Podcasts Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/10 flex items-center justify-center">
                <IconImg name="mic" className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">{L.myPodcasts}</h2>
              <span className="text-sm text-gray-500 dark:text-gray-400">({podcasts.length}/3)</span>
            </div>
            <div className="flex items-center gap-2">
              {podcasts.length > 0 && (
                <button
                  onClick={handleImportAll}
                  disabled={importing}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors disabled:opacity-50"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                    <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46A7.93 7.93 0 0020 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74A7.93 7.93 0 004 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
                  </svg>
                  {importing ? L.importing : L.importAll}
                </button>
              )}
              {podcasts.length < 3 && !showPodcastForm && (
                <button
                  onClick={handleAddPodcast}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                  </svg>
                  {L.addPodcast}
                </button>
              )}
            </div>
          </div>

          {podcasts.length >= 3 && !showPodcastForm && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 text-sm text-yellow-700 dark:text-yellow-300">
              {L.limitReached}
            </div>
          )}

          {/* Podcast Form (inline) */}
          {showPodcastForm && (
            <div className="mb-6 bg-white dark:bg-[#1a1a1a] rounded-xl border border-purple-200 dark:border-purple-800 overflow-hidden">
              <div className="px-5 py-4 bg-purple-50 dark:bg-purple-900/20 border-b border-purple-200 dark:border-purple-800">
                <h3 className="font-medium text-purple-900 dark:text-purple-100">
                  {editingPodcast ? L.editPodcast : L.newPodcast}
                </h3>
              </div>
              <form onSubmit={handleSavePodcast} className="p-5 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {L.podcastTitle} *
                    </label>
                    <input
                      type="text"
                      required
                      value={podcastForm.title}
                      onChange={(e) => setPodcastForm({ ...podcastForm, title: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition"
                      placeholder="Mon podcast"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {L.rssUrl} *
                    </label>
                    <input
                      type="url"
                      required
                      value={podcastForm.rss_url}
                      onChange={(e) => setPodcastForm({ ...podcastForm, rss_url: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition"
                      placeholder="https://example.com/feed.xml"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {L.description}
                  </label>
                  <textarea
                    value={podcastForm.description}
                    onChange={(e) => setPodcastForm({ ...podcastForm, description: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition resize-none"
                    placeholder="Description du podcast..."
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Image URL
                    </label>
                    <input
                      type="url"
                      value={podcastForm.image_url}
                      onChange={(e) => setPodcastForm({ ...podcastForm, image_url: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition"
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {L.author}
                    </label>
                    <input
                      type="text"
                      value={podcastForm.author}
                      onChange={(e) => setPodcastForm({ ...podcastForm, author: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition"
                      placeholder="Nom de l'auteur"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleCancelPodcastForm}
                    className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    {L.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={savingPodcast}
                    className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {savingPodcast ? '...' : L.save}
                  </button>
                </div>
              </form>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-6 h-6 border-2 border-gray-300 border-t-purple-600 rounded-full"></div>
            </div>
          ) : podcasts.length === 0 && !showPodcastForm ? (
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-gray-800 p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
                <IconImg name="mic" className="w-6 h-6 opacity-50" />
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{L.noPodcasts}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{L.noPodcastsDesc}</p>
            </div>
          ) : podcasts.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {podcasts.map((podcast) => (
                <div
                  key={podcast.id}
                  className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden"
                >
                  {podcast.image_url && (
                    <img
                      src={podcast.image_url}
                      alt={podcast.title}
                      className="w-full aspect-square object-cover"
                    />
                  )}
                  <div className="p-4">
                    <h3 className="font-medium text-gray-900 dark:text-white truncate">{podcast.title}</h3>
                    {podcast.author && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{podcast.author}</p>
                    )}
                    <div className="flex items-center gap-1 mt-4">
                      <button
                        onClick={() => handleImportOne(podcast)}
                        disabled={importing}
                        className="flex-1 px-3 py-2 text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors disabled:opacity-50"
                      >
                        {L.importThis}
                      </button>
                      <button
                        onClick={() => handleEditPodcast(podcast)}
                        className="px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                      >
                        {L.edit}
                      </button>
                      <button
                        onClick={() => handleDeletePodcast(podcast.id)}
                        className="px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                      >
                        {L.delete}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Store Section - Admin only (module not ready for public) */}
        {userRole === 'admin' && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/10 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="currentColor">
                    <path d="M19 6h-2c0-2.76-2.24-5-5-5S7 3.24 7 6H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-7-3c1.66 0 3 1.34 3 3H9c0-1.66 1.34-3 3-3zm7 17H5V8h14v12zm-7-8c-1.66 0-3-1.34-3-3H7c0 2.76 2.24 5 5 5s5-2.24 5-5h-2c0 1.66-1.34 3-3 3z"/>
                  </svg>
                </div>
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">{L.myStore}</h2>
              </div>
              <Link
                to="/store/submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                </svg>
                {L.submitTrack}
              </Link>
            </div>

            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{L.storeDesc}</p>
              <Link
                to="/dashboard/store"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                  <path d="M19 6h-2c0-2.76-2.24-5-5-5S7 3.24 7 6H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-7-3c1.66 0 3 1.34 3 3H9c0-1.66 1.34-3 3-3zm7 17H5V8h14v12z"/>
                </svg>
                {L.manageStore}
              </Link>
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
