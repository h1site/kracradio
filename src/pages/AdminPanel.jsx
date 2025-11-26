// src/pages/AdminPanel.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n';
import Seo from '../seo/Seo';
import { supabase } from '../lib/supabase';
import { importPodcastEpisodes } from '../utils/podcastRssParser';

const STRINGS = {
  fr: {
    title: 'Panneau d\'Administration',
    desc: 'Gestion complète du site',
    accessDenied: 'Accès refusé - Admins uniquement',
    backToDashboard: '← Retour au Dashboard',
    users: 'Utilisateurs',
    rssFeeds: 'Flux RSS (Podcasts)',
    articles: 'Articles',
    email: 'Email',
    role: 'Rôle',
    createdAt: 'Créé le',
    actions: 'Actions',
    delete: 'Supprimer',
    promote: 'Promouvoir',
    demote: 'Rétrograder',
    confirmDelete: 'Êtes-vous sûr de vouloir supprimer',
    confirmPromote: 'Promouvoir cet utilisateur à',
    confirmDemote: 'Rétrograder cet utilisateur à',
    user: 'Utilisateur',
    creator: 'Créateur',
    admin: 'Admin',
    title_col: 'Titre',
    author: 'Auteur',
    status: 'Statut',
    published: 'Publié',
    draft: 'Brouillon',
    episodes: 'Épisodes',
    rssUrl: 'URL RSS',
    edit: 'Modifier',
    view: 'Voir',
    filter: 'Filtrer...',
    noUsers: 'Aucun utilisateur',
    noRss: 'Aucun flux RSS',
    noArticles: 'Aucun article',
    loading: 'Chargement...',
    success: 'Succès',
    error: 'Erreur',
    artists: 'Artistes',
    import: 'Importer',
    importing: 'Import en cours...',
    importAll: 'Importer tous les podcasts',
    importingAll: 'Import en cours...',
    lastSync: 'Dernier import',
    never: 'Jamais',
    verified: 'Vérifié',
    public: 'Public',
    private: 'Privé',
    genres: 'Genres',
    toggleStatus: 'Changer statut',
    makePublic: 'Rendre public',
    makePrivate: 'Rendre privé',
    verify: 'Vérifier',
    unverify: 'Retirer vérification',
    noArtists: 'Aucun artiste',
    username: 'Nom d\'utilisateur',
    profile: 'Profil',
    viewProfile: 'Voir profil',
    confirmToggleStatus: 'Changer le statut de cet article ?',
    confirmTogglePublic: 'Changer la visibilité de ce profil ?',
    confirmToggleVerified: 'Changer le statut vérifié de cet artiste ?',
    store: 'Boutique',
    manageStore: 'Gérer les soumissions boutique',
  },
  en: {
    title: 'Admin Panel',
    desc: 'Complete site management',
    accessDenied: 'Access denied - Admins only',
    backToDashboard: '← Back to Dashboard',
    users: 'Users',
    rssFeeds: 'RSS Feeds (Podcasts)',
    articles: 'Articles',
    email: 'Email',
    role: 'Role',
    createdAt: 'Created',
    actions: 'Actions',
    delete: 'Delete',
    promote: 'Promote',
    demote: 'Demote',
    confirmDelete: 'Are you sure you want to delete',
    confirmPromote: 'Promote this user to',
    confirmDemote: 'Demote this user to',
    user: 'User',
    creator: 'Creator',
    admin: 'Admin',
    title_col: 'Title',
    author: 'Author',
    status: 'Status',
    published: 'Published',
    draft: 'Draft',
    episodes: 'Episodes',
    rssUrl: 'RSS URL',
    edit: 'Edit',
    view: 'View',
    filter: 'Filter...',
    noUsers: 'No users',
    noRss: 'No RSS feeds',
    noArticles: 'No articles',
    loading: 'Loading...',
    success: 'Success',
    error: 'Error',
    artists: 'Artists',
    import: 'Import',
    importing: 'Importing...',
    importAll: 'Import All Podcasts',
    importingAll: 'Importing...',
    lastSync: 'Last sync',
    never: 'Never',
    verified: 'Verified',
    public: 'Public',
    private: 'Private',
    genres: 'Genres',
    toggleStatus: 'Toggle status',
    makePublic: 'Make public',
    makePrivate: 'Make private',
    verify: 'Verify',
    unverify: 'Unverify',
    noArtists: 'No artists',
    username: 'Username',
    profile: 'Profile',
    viewProfile: 'View profile',
    confirmToggleStatus: 'Change article status?',
    confirmTogglePublic: 'Change profile visibility?',
    confirmToggleVerified: 'Change artist verified status?',
    store: 'Store',
    manageStore: 'Manage store submissions',
  },
  es: {
    title: 'Panel de Administración',
    desc: 'Gestión completa del sitio',
    accessDenied: 'Acceso denegado - Solo administradores',
    backToDashboard: '← Volver al Panel',
    users: 'Usuarios',
    rssFeeds: 'Feeds RSS (Podcasts)',
    articles: 'Artículos',
    email: 'Correo',
    role: 'Rol',
    createdAt: 'Creado',
    actions: 'Acciones',
    delete: 'Eliminar',
    promote: 'Promover',
    demote: 'Degradar',
    confirmDelete: '¿Estás seguro de que quieres eliminar',
    confirmPromote: 'Promover este usuario a',
    confirmDemote: 'Degradar este usuario a',
    user: 'Usuario',
    creator: 'Creador',
    admin: 'Admin',
    title_col: 'Título',
    author: 'Autor',
    status: 'Estado',
    published: 'Publicado',
    draft: 'Borrador',
    episodes: 'Episodios',
    rssUrl: 'URL RSS',
    edit: 'Editar',
    view: 'Ver',
    filter: 'Filtrar...',
    noUsers: 'Sin usuarios',
    noRss: 'Sin feeds RSS',
    noArticles: 'Sin artículos',
    loading: 'Cargando...',
    success: 'Éxito',
    error: 'Error',
    artists: 'Artistas',
    import: 'Importar',
    importing: 'Importando...',
    importAll: 'Importar Todos los Podcasts',
    importingAll: 'Importando...',
    lastSync: 'Última sincronización',
    never: 'Nunca',
    verified: 'Verificado',
    public: 'Público',
    private: 'Privado',
    genres: 'Géneros',
    toggleStatus: 'Cambiar estado',
    makePublic: 'Hacer público',
    makePrivate: 'Hacer privado',
    verify: 'Verificar',
    unverify: 'Quitar verificación',
    noArtists: 'Sin artistas',
    username: 'Nombre de usuario',
    profile: 'Perfil',
    viewProfile: 'Ver perfil',
    confirmToggleStatus: '¿Cambiar el estado del artículo?',
    confirmTogglePublic: '¿Cambiar la visibilidad del perfil?',
    confirmToggleVerified: '¿Cambiar el estado verificado del artista?',
    store: 'Tienda',
    manageStore: 'Gestionar envíos de tienda',
  },
};

export default function AdminPanel() {
  const { lang } = useI18n();
  const L = useMemo(() => STRINGS[lang] || STRINGS.fr, [lang]);
  const { user, userRole, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('users'); // users, rss, articles, artists
  const [users, setUsers] = useState([]);
  const [rssFeeds, setRssFeeds] = useState([]);
  const [articles, setArticles] = useState([]);
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [importing, setImporting] = useState(null); // null or podcast ID being imported
  const [importingAll, setImportingAll] = useState(false);

  // Filters
  const [userFilter, setUserFilter] = useState('');
  const [rssFilter, setRssFilter] = useState('');
  const [articleFilter, setArticleFilter] = useState('');
  const [artistFilter, setArtistFilter] = useState('');

  // Protection stricte: vérifier le rôle exactement (DOIT être avant les early returns)
  useEffect(() => {
    console.log('[AdminPanel] Auth state:', { authLoading, userRole });
    if (!authLoading && userRole !== 'admin') {
      console.warn('[AdminPanel] Access denied. Redirecting to home. User role:', userRole);
      navigate('/', { replace: true });
    }
  }, [authLoading, userRole, navigate]);

  // Charger les données si admin
  useEffect(() => {
    if (userRole === 'admin' && !authLoading) {
      const load = async () => {
        setLoading(true);
        try {
          // Charger toutes les données en parallèle
          const usersPromise = supabase
            .from('profiles')
            .select('id, role, created_at')
            .order('created_at', { ascending: false });

          const rssPromise = supabase
            .from('user_podcasts')
            .select('id, title, rss_url, user_id, created_at')
            .order('created_at', { ascending: false });

          const articlesPromise = supabase
            .from('articles')
            .select('id, title, author_id, status, created_at, slug')
            .order('created_at', { ascending: false });

          const artistsPromise = supabase
            .from('profiles')
            .select('id, username, artist_slug, avatar_url, bio, genres, is_verified, is_public, created_at')
            .not('artist_slug', 'is', null)
            .order('created_at', { ascending: false });

          const [usersResult, rssResult, articlesResult, artistsResult] = await Promise.all([
            usersPromise,
            rssPromise,
            articlesPromise,
            artistsPromise
          ]);

          // Charger les emails depuis auth
          if (usersResult.data) {
            const { data: authUsers } = await supabase.auth.admin.listUsers();
            const usersWithEmails = usersResult.data.map(profile => {
              const authUser = authUsers?.users?.find(au => au.id === profile.id);
              return { ...profile, email: authUser?.email || 'Unknown' };
            });
            setUsers(usersWithEmails);
          }

          if (rssResult.data) setRssFeeds(rssResult.data);
          if (articlesResult.data) setArticles(articlesResult.data);
          if (artistsResult.data) setArtists(artistsResult.data);
        } catch (error) {
          console.error('[AdminPanel] Error loading data:', error);
        }
        setLoading(false);
      };
      load();
    }
  }, [userRole, authLoading]);

  // Définir toutes les fonctions AVANT les early returns
  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadUsers(), loadRssFeeds(), loadArticles(), loadArtists()]);
    setLoading(false);
  };

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          role,
          created_at,
          users:id (
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch emails from auth.users separately since we can't join
      const userIds = data.map(u => u.id);
      const { data: authUsers } = await supabase.auth.admin.listUsers();

      const usersWithEmails = data.map(profile => {
        const authUser = authUsers?.users?.find(au => au.id === profile.id);
        return {
          ...profile,
          email: authUser?.email || 'Unknown'
        };
      });

      setUsers(usersWithEmails || []);
    } catch (error) {
      console.error('Error loading users:', error);
      setMessage({ type: 'error', text: error.message });
    }
  };

  const loadRssFeeds = async () => {
    try {
      const { data, error } = await supabase
        .from('user_podcasts')
        .select(`
          id,
          title,
          rss_url,
          user_id,
          created_at,
          episodes:podcast_episodes(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRssFeeds(data || []);
    } catch (error) {
      console.error('Error loading RSS feeds:', error);
      setMessage({ type: 'error', text: error.message });
    }
  };

  const loadArticles = async () => {
    try {
      const { data, error} = await supabase
        .from('articles')
        .select('id, title, author_id, status, created_at, slug')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setArticles(data || []);
    } catch (error) {
      console.error('Error loading articles:', error);
      setMessage({ type: 'error', text: error.message });
    }
  };

  const loadArtists = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, artist_slug, avatar_url, bio, genres, is_verified, is_public, created_at')
        .not('artist_slug', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setArtists(data || []);
    } catch (error) {
      console.error('Error loading artists:', error);
      setMessage({ type: 'error', text: error.message });
    }
  };

  const handleDeleteUser = async (userId, userEmail) => {
    if (!window.confirm(`${L.confirmDelete} ${userEmail}?`)) return;

    try {
      // Delete user profile
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      // Also delete from auth (requires admin privileges)
      await supabase.auth.admin.deleteUser(userId);

      setMessage({ type: 'success', text: `User ${userEmail} deleted` });
      await loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      setMessage({ type: 'error', text: error.message });
    }
  };

  const handleChangeRole = async (userId, userEmail, newRole) => {
    const action = newRole === 'admin' || newRole === 'creator' ? L.confirmPromote : L.confirmDemote;
    if (!window.confirm(`${action} ${newRole}? (${userEmail})`)) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      setMessage({ type: 'success', text: `${userEmail} → ${newRole}` });
      await loadUsers();
    } catch (error) {
      console.error('Error changing role:', error);
      setMessage({ type: 'error', text: error.message });
    }
  };

  const handleDeleteRss = async (rssId, title) => {
    if (!window.confirm(`${L.confirmDelete} "${title}"?`)) return;

    try {
      const { error } = await supabase
        .from('user_podcasts')
        .delete()
        .eq('id', rssId);

      if (error) throw error;

      setMessage({ type: 'success', text: `RSS feed deleted: ${title}` });
      await loadRssFeeds();
    } catch (error) {
      console.error('Error deleting RSS:', error);
      setMessage({ type: 'error', text: error.message });
    }
  };

  const handleDeleteArticle = async (articleId, title) => {
    if (!window.confirm(`${L.confirmDelete} "${title}"?`)) return;

    try {
      const { error } = await supabase
        .from('articles')
        .delete()
        .eq('id', articleId);

      if (error) throw error;

      setMessage({ type: 'success', text: `Article deleted: ${title}` });
      await loadArticles();
    } catch (error) {
      console.error('Error deleting article:', error);
      setMessage({ type: 'error', text: error.message });
    }
  };

  const handleImportPodcast = async (podcastId, rssUrl) => {
    setImporting(podcastId);
    setMessage(null);
    try {
      const result = await importPodcastEpisodes(supabase, podcastId, rssUrl);
      setMessage({
        type: 'success',
        text: `✅ Import terminé: ${result.imported} nouveaux épisodes`
      });
      await loadRssFeeds();
    } catch (error) {
      console.error('Error importing podcast:', error);
      setMessage({ type: 'error', text: error.message });
    } finally {
      setImporting(null);
    }
  };

  const handleImportAll = async () => {
    if (!window.confirm(`Importer tous les ${rssFeeds.length} podcasts ?`)) return;

    setImportingAll(true);
    setMessage(null);

    let totalImported = 0;
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const podcast of rssFeeds) {
        setImporting(podcast.id);
        try {
          const result = await importPodcastEpisodes(supabase, podcast.id, podcast.rss_url);
          totalImported += result.imported;
          successCount++;
          console.log(`✅ ${podcast.title}: ${result.imported} épisodes importés`);
        } catch (error) {
          errorCount++;
          console.error(`❌ ${podcast.title}:`, error.message);
        }
      }

      setMessage({
        type: successCount > 0 ? 'success' : 'error',
        text: `✅ Import terminé: ${totalImported} nouveaux épisodes (${successCount} réussis, ${errorCount} échoués)`
      });
      await loadRssFeeds();
    } catch (error) {
      console.error('Error during bulk import:', error);
      setMessage({ type: 'error', text: error.message });
    } finally {
      setImporting(null);
      setImportingAll(false);
    }
  };

  const handleToggleArticleStatus = async (articleId, currentStatus, title) => {
    if (!window.confirm(L.confirmToggleStatus)) return;

    const newStatus = currentStatus === 'published' ? 'draft' : 'published';

    try {
      const { error } = await supabase
        .from('articles')
        .update({ status: newStatus })
        .eq('id', articleId);

      if (error) throw error;

      setMessage({
        type: 'success',
        text: `${title} → ${newStatus === 'published' ? L.published : L.draft}`
      });
      await loadArticles();
    } catch (error) {
      console.error('Error toggling article status:', error);
      setMessage({ type: 'error', text: error.message });
    }
  };

  const handleToggleArtistVerified = async (artistId, currentStatus, username) => {
    if (!window.confirm(L.confirmToggleVerified)) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_verified: !currentStatus })
        .eq('id', artistId);

      if (error) throw error;

      setMessage({
        type: 'success',
        text: `${username} → ${!currentStatus ? L.verified : 'Non ' + L.verified}`
      });
      await loadArtists();
    } catch (error) {
      console.error('Error toggling artist verification:', error);
      setMessage({ type: 'error', text: error.message });
    }
  };

  const handleToggleArtistPublic = async (artistId, currentStatus, username) => {
    if (!window.confirm(L.confirmTogglePublic)) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_public: !currentStatus })
        .eq('id', artistId);

      if (error) throw error;

      setMessage({
        type: 'success',
        text: `${username} → ${!currentStatus ? L.public : L.private}`
      });
      await loadArtists();
    } catch (error) {
      console.error('Error toggling artist visibility:', error);
      setMessage({ type: 'error', text: error.message });
    }
  };

  const handleDeleteArtist = async (artistId, username) => {
    if (!window.confirm(`${L.confirmDelete} ${username}?`)) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ artist_slug: null, is_verified: false })
        .eq('id', artistId);

      if (error) throw error;

      setMessage({ type: 'success', text: `Artist profile removed: ${username}` });
      await loadArtists();
    } catch (error) {
      console.error('Error removing artist:', error);
      setMessage({ type: 'error', text: error.message });
    }
  };

  const filteredUsers = users.filter(u =>
    u.email?.toLowerCase().includes(userFilter.toLowerCase())
  );

  const filteredRss = rssFeeds.filter(r =>
    r.title?.toLowerCase().includes(rssFilter.toLowerCase())
  );

  const filteredArticles = articles.filter(a =>
    a.title?.toLowerCase().includes(articleFilter.toLowerCase())
  );

  const filteredArtists = artists.filter(a =>
    a.username?.toLowerCase().includes(artistFilter.toLowerCase()) ||
    a.artist_slug?.toLowerCase().includes(artistFilter.toLowerCase())
  );

  // Early return pour non-admins
  if (authLoading) {
    return (
      <div className="container-max px-5 py-20 text-center">
        <p className="text-xl text-gray-600 dark:text-gray-400">
          {L.loading}
        </p>
      </div>
    );
  }

  if (userRole !== 'admin') {
    return null; // Ne rien afficher pendant la redirection
  }

  return (
    <main className="container-max px-5 py-6">
      <Seo
        lang={lang}
        title={`${L.title} — KracRadio`}
        description={L.desc}
        path="/admin"
        type="website"
      />

      {/* Header */}
      <header className="mb-8">
        <Link
          to="/dashboard"
          className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-gray-600 transition hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
          {L.backToDashboard}
        </Link>
        <h1 className="text-4xl font-black text-black dark:text-white">
          {L.title}
        </h1>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">{L.desc}</p>
      </header>

      {/* Message */}
      {message && (
        <div className={`mb-6 rounded-xl p-4 ${
          message.type === 'success'
            ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-200'
            : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 flex gap-2 border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 text-sm font-semibold transition ${
            activeTab === 'users'
              ? 'border-b-2 border-red-600 text-red-600'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          👥 {L.users} ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('rss')}
          className={`px-4 py-2 text-sm font-semibold transition ${
            activeTab === 'rss'
              ? 'border-b-2 border-red-600 text-red-600'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          📡 {L.rssFeeds} ({rssFeeds.length})
        </button>
        <button
          onClick={() => setActiveTab('articles')}
          className={`px-4 py-2 text-sm font-semibold transition ${
            activeTab === 'articles'
              ? 'border-b-2 border-red-600 text-red-600'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          📝 {L.articles} ({articles.length})
        </button>
        <button
          onClick={() => setActiveTab('artists')}
          className={`px-4 py-2 text-sm font-semibold transition ${
            activeTab === 'artists'
              ? 'border-b-2 border-red-600 text-red-600'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          🎨 {L.artists} ({artists.length})
        </button>
        <Link
          to="/admin/store"
          className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition"
        >
          🛒 {L.store}
        </Link>
      </div>

      {/* Users Table */}
      {activeTab === 'users' && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-950">
          <div className="p-4">
            <input
              type="text"
              placeholder={L.filter}
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/30 dark:border-gray-700 dark:bg-gray-900"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">{L.email}</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">{L.role}</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">{L.createdAt}</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">{L.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                    <td className="px-4 py-3 text-sm">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        user.role === 'admin'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
                          : user.role === 'creator'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        {user.role === 'user' && (
                          <button
                            onClick={() => handleChangeRole(user.id, user.email, 'creator')}
                            className="rounded bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700"
                          >
                            → Creator
                          </button>
                        )}
                        {user.role === 'creator' && (
                          <>
                            <button
                              onClick={() => handleChangeRole(user.id, user.email, 'admin')}
                              className="rounded bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700"
                            >
                              → Admin
                            </button>
                            <button
                              onClick={() => handleChangeRole(user.id, user.email, 'user')}
                              className="rounded bg-gray-600 px-3 py-1 text-xs font-semibold text-white hover:bg-gray-700"
                            >
                              → User
                            </button>
                          </>
                        )}
                        {user.role === 'admin' && user.id !== user?.id && (
                          <button
                            onClick={() => handleChangeRole(user.id, user.email, 'creator')}
                            className="rounded bg-gray-600 px-3 py-1 text-xs font-semibold text-white hover:bg-gray-700"
                          >
                            → Creator
                          </button>
                        )}
                        {user.id !== user?.id && (
                          <button
                            onClick={() => handleDeleteUser(user.id, user.email)}
                            className="rounded bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredUsers.length === 0 && (
              <p className="p-8 text-center text-gray-500">{L.noUsers}</p>
            )}
          </div>
        </div>
      )}

      {/* RSS Feeds Table */}
      {activeTab === 'rss' && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-950">
          <div className="p-4 space-y-3">
            <input
              type="text"
              placeholder={L.filter}
              value={rssFilter}
              onChange={(e) => setRssFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/30 dark:border-gray-700 dark:bg-gray-900"
            />
            {filteredRss.length > 0 && (
              <button
                onClick={handleImportAll}
                disabled={importingAll || importing !== null}
                className="w-full rounded-lg bg-green-600 px-4 py-3 font-semibold text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {importingAll ? (
                  <>
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                    {L.importingAll}
                  </>
                ) : (
                  <>
                    🔄 {L.importAll}
                  </>
                )}
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">{L.title_col}</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">{L.rssUrl}</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">{L.episodes}</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">{L.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {filteredRss.map((rss) => (
                  <tr key={rss.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                    <td className="px-4 py-3 text-sm font-semibold">{rss.title}</td>
                    <td className="px-4 py-3 text-sm">
                      <a
                        href={rss.rss_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline dark:text-blue-400"
                      >
                        {rss.rss_url.substring(0, 50)}...
                      </a>
                    </td>
                    <td className="px-4 py-3 text-sm">{rss.episodes?.[0]?.count || 0}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleImportPodcast(rss.id, rss.rss_url)}
                          disabled={importing !== null || importingAll}
                          className="rounded bg-green-600 px-3 py-1 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                        >
                          {importing === rss.id ? (
                            <>
                              <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                              {L.importing}
                            </>
                          ) : (
                            <>
                              🔄 {L.import}
                            </>
                          )}
                        </button>
                        <Link
                          to={`/dashboard/podcasts/edit/${rss.id}`}
                          className="rounded bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700"
                        >
                          ✏️ {L.edit}
                        </Link>
                        <button
                          onClick={() => handleDeleteRss(rss.id, rss.title)}
                          disabled={importing !== null || importingAll}
                          className="rounded bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          🗑️ {L.delete}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredRss.length === 0 && (
              <p className="p-8 text-center text-gray-500">{L.noRss}</p>
            )}
          </div>
        </div>
      )}

      {/* Articles Table */}
      {activeTab === 'articles' && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-950">
          <div className="p-4">
            <input
              type="text"
              placeholder={L.filter}
              value={articleFilter}
              onChange={(e) => setArticleFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/30 dark:border-gray-700 dark:bg-gray-900"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">{L.title_col}</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">{L.status}</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">{L.createdAt}</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">{L.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {filteredArticles.map((article) => (
                  <tr key={article.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                    <td className="px-4 py-3 text-sm font-semibold">{article.title}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        article.status === 'published'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'
                      }`}>
                        {article.status === 'published' ? L.published : L.draft}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {new Date(article.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/article/${article.slug}`}
                          className="rounded bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700"
                        >
                          👁️ {L.view}
                        </Link>
                        <button
                          onClick={() => handleToggleArticleStatus(article.id, article.status, article.title)}
                          className={`rounded px-3 py-1 text-xs font-semibold text-white ${
                            article.status === 'published'
                              ? 'bg-yellow-600 hover:bg-yellow-700'
                              : 'bg-green-600 hover:bg-green-700'
                          }`}
                        >
                          {article.status === 'published' ? '📝 → Draft' : '✅ → Publish'}
                        </button>
                        <Link
                          to={`/dashboard/articles/edit/${article.id}`}
                          className="rounded bg-gray-600 px-3 py-1 text-xs font-semibold text-white hover:bg-gray-700"
                        >
                          ✏️ {L.edit}
                        </Link>
                        <button
                          onClick={() => handleDeleteArticle(article.id, article.title)}
                          className="rounded bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700"
                        >
                          🗑️ {L.delete}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredArticles.length === 0 && (
              <p className="p-8 text-center text-gray-500">{L.noArticles}</p>
            )}
          </div>
        </div>
      )}

      {/* Artists Table */}
      {activeTab === 'artists' && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-950">
          <div className="p-4">
            <input
              type="text"
              placeholder={L.filter}
              value={artistFilter}
              onChange={(e) => setArtistFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/30 dark:border-gray-700 dark:bg-gray-900"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">{L.username}</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">{L.genres}</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">{L.status}</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">{L.createdAt}</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">{L.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {filteredArtists.map((artist) => (
                  <tr key={artist.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {artist.avatar_url && (
                          <img
                            src={artist.avatar_url}
                            alt={artist.username}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        )}
                        <div>
                          <div className="text-sm font-semibold">{artist.username || 'No username'}</div>
                          <div className="text-xs text-gray-500">@{artist.artist_slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {artist.genres && artist.genres.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {artist.genres.slice(0, 2).map((genre, idx) => (
                            <span
                              key={idx}
                              className="rounded bg-gray-100 px-2 py-0.5 text-xs dark:bg-gray-800"
                            >
                              {genre}
                            </span>
                          ))}
                          {artist.genres.length > 2 && (
                            <span className="text-xs text-gray-500">+{artist.genres.length - 2}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {artist.is_verified && (
                          <span className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
                            ✓ {L.verified}
                          </span>
                        )}
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          artist.is_public
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                        }`}>
                          {artist.is_public ? L.public : L.private}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {new Date(artist.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/community/${artist.artist_slug}`}
                          className="rounded bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700"
                        >
                          👁️ {L.viewProfile}
                        </Link>
                        <button
                          onClick={() => handleToggleArtistVerified(artist.id, artist.is_verified, artist.username)}
                          className={`rounded px-3 py-1 text-xs font-semibold text-white ${
                            artist.is_verified
                              ? 'bg-gray-600 hover:bg-gray-700'
                              : 'bg-blue-600 hover:bg-blue-700'
                          }`}
                        >
                          {artist.is_verified ? '✗ ' + L.unverify : '✓ ' + L.verify}
                        </button>
                        <button
                          onClick={() => handleToggleArtistPublic(artist.id, artist.is_public, artist.username)}
                          className={`rounded px-3 py-1 text-xs font-semibold text-white ${
                            artist.is_public
                              ? 'bg-yellow-600 hover:bg-yellow-700'
                              : 'bg-green-600 hover:bg-green-700'
                          }`}
                        >
                          {artist.is_public ? '🔒 ' + L.makePrivate : '🌐 ' + L.makePublic}
                        </button>
                        <button
                          onClick={() => handleDeleteArtist(artist.id, artist.username)}
                          className="rounded bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700"
                        >
                          🗑️ {L.delete}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredArtists.length === 0 && (
              <p className="p-8 text-center text-gray-500">{L.noArtists}</p>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
