// src/pages/AdminPanel.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n';
import Seo from '../seo/Seo';
import { supabase } from '../lib/supabase';

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
  },
};

export default function AdminPanel() {
  const { lang } = useI18n();
  const L = useMemo(() => STRINGS[lang] || STRINGS.fr, [lang]);
  const { user, userRole, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('users'); // users, rss, articles
  const [users, setUsers] = useState([]);
  const [rssFeeds, setRssFeeds] = useState([]);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  // Filters
  const [userFilter, setUserFilter] = useState('');
  const [rssFilter, setRssFilter] = useState('');
  const [articleFilter, setArticleFilter] = useState('');

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
            .from('user_profiles')
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

          const [usersResult, rssResult, articlesResult] = await Promise.all([
            usersPromise,
            rssPromise,
            articlesPromise
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
    await Promise.all([loadUsers(), loadRssFeeds(), loadArticles()]);
    setLoading(false);
  };

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
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
      const { data, error } = await supabase
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

  const handleDeleteUser = async (userId, userEmail) => {
    if (!window.confirm(`${L.confirmDelete} ${userEmail}?`)) return;

    try {
      // Delete user profile
      const { error } = await supabase
        .from('user_profiles')
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
        .from('user_profiles')
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

  const filteredUsers = users.filter(u =>
    u.email?.toLowerCase().includes(userFilter.toLowerCase())
  );

  const filteredRss = rssFeeds.filter(r =>
    r.title?.toLowerCase().includes(rssFilter.toLowerCase())
  );

  const filteredArticles = articles.filter(a =>
    a.title?.toLowerCase().includes(articleFilter.toLowerCase())
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
          <div className="p-4">
            <input
              type="text"
              placeholder={L.filter}
              value={rssFilter}
              onChange={(e) => setRssFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/30 dark:border-gray-700 dark:bg-gray-900"
            />
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
                          onClick={() => handleDeleteRss(rss.id, rss.title)}
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
                        <Link
                          to={`/dashboard/articles/edit?id=${article.id}`}
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
    </main>
  );
}
