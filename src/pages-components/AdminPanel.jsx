'use client';
// src/pages/AdminPanel.jsx
import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n';
import Seo from '../seo/Seo';
import { supabase } from '../lib/supabase';
import { importPodcastEpisodes, importExternalPodcast } from '../utils/podcastRssParser';

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
    videos: 'Vidéos',
    noVideos: 'Aucune vidéo',
    pending: 'En attente',
    approved: 'Approuvé',
    rejected: 'Rejeté',
    approve: 'Approuver',
    reject: 'Rejeter',
    youtubeUrl: 'URL YouTube',
    artistName: 'Nom artiste',
    submittedBy: 'Soumis par',
    importVideo: 'Importer une vidéo',
    importPlaylist: 'Importer une playlist',
    videoUrl: 'URL de la vidéo YouTube',
    playlistUrl: 'URL de la playlist YouTube',
    importSingleVideo: 'Importer',
    importPlaylistBtn: 'Importer la playlist',
    importingVideo: 'Import en cours...',
    importingPlaylist: 'Import de la playlist...',
    videoImported: 'Vidéo importée avec succès',
    playlistImported: 'Playlist importée: {count} vidéos',
    invalidYoutubeUrl: 'URL YouTube invalide',
    fetchingVideoInfo: 'Récupération des infos...',
    // Podcasts section
    podcasts: 'Podcasts',
    noPodcasts: 'Aucun podcast',
    importPodcast: 'Importer un podcast',
    podcastRssUrl: 'URL du flux RSS du podcast',
    importPodcastBtn: 'Importer le podcast',
    importingPodcast: 'Import en cours...',
    podcastImported: 'Podcast importé avec succès',
    invalidRssUrl: 'URL RSS invalide',
    podcastAlreadyExists: 'Ce podcast existe déjà',
    hostName: 'Animateur',
    episodeCount: 'Épisodes',
    kracradioImport: 'Import KracRadio',
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
    videos: 'Videos',
    noVideos: 'No videos',
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    approve: 'Approve',
    reject: 'Reject',
    youtubeUrl: 'YouTube URL',
    artistName: 'Artist name',
    submittedBy: 'Submitted by',
    importVideo: 'Import a video',
    importPlaylist: 'Import a playlist',
    videoUrl: 'YouTube video URL',
    playlistUrl: 'YouTube playlist URL',
    importSingleVideo: 'Import',
    importPlaylistBtn: 'Import playlist',
    importingVideo: 'Importing...',
    importingPlaylist: 'Importing playlist...',
    videoImported: 'Video imported successfully',
    playlistImported: 'Playlist imported: {count} videos',
    invalidYoutubeUrl: 'Invalid YouTube URL',
    fetchingVideoInfo: 'Fetching info...',
    // Podcasts section
    podcasts: 'Podcasts',
    noPodcasts: 'No podcasts',
    importPodcast: 'Import a podcast',
    podcastRssUrl: 'Podcast RSS feed URL',
    importPodcastBtn: 'Import podcast',
    importingPodcast: 'Importing...',
    podcastImported: 'Podcast imported successfully',
    invalidRssUrl: 'Invalid RSS URL',
    podcastAlreadyExists: 'This podcast already exists',
    hostName: 'Host',
    episodeCount: 'Episodes',
    kracradioImport: 'KracRadio Import',
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
    videos: 'Videos',
    noVideos: 'Sin videos',
    pending: 'Pendiente',
    approved: 'Aprobado',
    rejected: 'Rechazado',
    approve: 'Aprobar',
    reject: 'Rechazar',
    youtubeUrl: 'URL de YouTube',
    artistName: 'Nombre del artista',
    submittedBy: 'Enviado por',
    importVideo: 'Importar un video',
    importPlaylist: 'Importar una playlist',
    videoUrl: 'URL del video de YouTube',
    playlistUrl: 'URL de la playlist de YouTube',
    importSingleVideo: 'Importar',
    importPlaylistBtn: 'Importar playlist',
    importingVideo: 'Importando...',
    importingPlaylist: 'Importando playlist...',
    videoImported: 'Video importado con éxito',
    playlistImported: 'Playlist importada: {count} videos',
    invalidYoutubeUrl: 'URL de YouTube inválida',
    fetchingVideoInfo: 'Obteniendo información...',
    // Podcasts section
    podcasts: 'Podcasts',
    noPodcasts: 'Sin podcasts',
    importPodcast: 'Importar un podcast',
    podcastRssUrl: 'URL del feed RSS del podcast',
    importPodcastBtn: 'Importar podcast',
    importingPodcast: 'Importando...',
    podcastImported: 'Podcast importado con éxito',
    invalidRssUrl: 'URL RSS inválida',
    podcastAlreadyExists: 'Este podcast ya existe',
    hostName: 'Presentador',
    episodeCount: 'Episodios',
    kracradioImport: 'Importación KracRadio',
  },
};

export default function AdminPanel() {
  const { lang } = useI18n();
  const L = useMemo(() => STRINGS[lang] || STRINGS.fr, [lang]);
  const { user, userRole, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('users'); // users, rss, articles, artists, videos, podcasts
  const [users, setUsers] = useState([]);
  const [rssFeeds, setRssFeeds] = useState([]);
  const [articles, setArticles] = useState([]);
  const [artists, setArtists] = useState([]);
  const [videos, setVideos] = useState([]);
  const [podcasts, setPodcasts] = useState([]); // External podcasts (from podcasts table)
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [importing, setImporting] = useState(null); // null or podcast ID being imported
  const [importingAll, setImportingAll] = useState(false);

  // Filters
  const [userFilter, setUserFilter] = useState('');
  const [rssFilter, setRssFilter] = useState('');
  const [articleFilter, setArticleFilter] = useState('');
  const [artistFilter, setArtistFilter] = useState('');
  const [videoFilter, setVideoFilter] = useState('');
  const [previewVideo, setPreviewVideo] = useState(null);

  // Video import states
  const [singleVideoUrl, setSingleVideoUrl] = useState('');
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [importingVideo, setImportingVideo] = useState(false);
  const [importingPlaylist, setImportingPlaylist] = useState(false);

  // Podcast import states
  const [podcastRssUrl, setPodcastRssUrl] = useState('');
  const [importingExternalPodcast, setImportingExternalPodcast] = useState(false);
  const [podcastFilter, setPodcastFilter] = useState('');

  // Protection stricte: vérifier le rôle exactement (DOIT être avant les early returns)
  useEffect(() => {
    console.log('[AdminPanel] Auth state:', { authLoading, userRole });
    if (!authLoading && userRole !== 'admin') {
      console.warn('[AdminPanel] Access denied. Redirecting to home. User role:', userRole);
      router.push('/', { replace: true });
    }
  }, [authLoading, userRole, router]);

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

          const videosPromise = supabase
            .from('videos')
            .select('*')
            .order('created_at', { ascending: false });

          const podcastsPromise = supabase
            .from('user_podcasts')
            .select('*')
            .order('created_at', { ascending: false });

          const [usersResult, rssResult, articlesResult, artistsResult, videosResult, podcastsResult] = await Promise.all([
            usersPromise,
            rssPromise,
            articlesPromise,
            artistsPromise,
            videosPromise,
            podcastsPromise
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

          // Debug videos loading
          console.log('[AdminPanel] Videos result:', videosResult);
          if (videosResult.error) {
            console.error('[AdminPanel] Videos error:', videosResult.error);
          }
          if (videosResult.data) {
            console.log('[AdminPanel] Videos loaded:', videosResult.data.length);
            setVideos(videosResult.data);
          }

          // Podcasts loading
          if (podcastsResult.error) {
            console.error('[AdminPanel] Podcasts error:', podcastsResult.error);
          }
          if (podcastsResult.data) {
            console.log('[AdminPanel] Podcasts loaded:', podcastsResult.data.length);
            setPodcasts(podcastsResult.data);
          }
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

  // Video functions
  const handleVideoStatus = async (videoId, status) => {
    try {
      const { error } = await supabase
        .from('videos')
        .update({
          status,
          updated_at: new Date().toISOString(),
          ...(status === 'approved' ? {
            approved_at: new Date().toISOString(),
            approved_by: user.id
          } : {})
        })
        .eq('id', videoId);

      if (error) throw error;

      setVideos(videos.map(v => v.id === videoId ? { ...v, status } : v));
      setMessage({ type: 'success', text: `Video ${status}` });
    } catch (error) {
      console.error('Error updating video:', error);
      setMessage({ type: 'error', text: error.message });
    }
  };

  const handleDeleteVideo = async (videoId, title) => {
    if (!window.confirm(`${L.confirmDelete} "${title}"?`)) return;

    try {
      const { error } = await supabase
        .from('videos')
        .delete()
        .eq('id', videoId);

      if (error) throw error;

      setVideos(videos.filter(v => v.id !== videoId));
      setMessage({ type: 'success', text: `Video deleted: ${title}` });
    } catch (error) {
      console.error('Error deleting video:', error);
      setMessage({ type: 'error', text: error.message });
    }
  };

  // Extract YouTube video ID from various URL formats
  const extractYoutubeVideoId = (url) => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /^([a-zA-Z0-9_-]{11})$/
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  // Extract YouTube playlist ID from URL
  const extractPlaylistId = (url) => {
    const match = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  };

  // Default thumbnail when YouTube doesn't have one
  const DEFAULT_THUMBNAIL = '/images/video-thumbnail-default.svg';

  // Check if YouTube thumbnail exists
  const checkThumbnailExists = async (videoId) => {
    try {
      // Try maxresdefault first
      const maxRes = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      const response = await fetch(maxRes, { method: 'HEAD' });
      if (response.ok) return maxRes;

      // Fallback to hqdefault
      const hq = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      const hqResponse = await fetch(hq, { method: 'HEAD' });
      if (hqResponse.ok) return hq;

      // No thumbnail available
      return null;
    } catch {
      return null;
    }
  };

  // Fetch video info using oEmbed (no API key needed)
  const fetchVideoInfo = async (videoId) => {
    try {
      const response = await fetch(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
      );
      if (!response.ok) throw new Error('Video not found');
      const data = await response.json();

      // Check if thumbnail exists, otherwise use default
      const thumbnailUrl = await checkThumbnailExists(videoId) || DEFAULT_THUMBNAIL;

      return {
        title: data.title,
        thumbnail_url: thumbnailUrl,
        artist_name: data.author_name
      };
    } catch (error) {
      console.error('Error fetching video info:', error);
      return null;
    }
  };

  // Import single video
  const handleImportSingleVideo = async () => {
    if (!singleVideoUrl.trim()) return;

    const videoId = extractYoutubeVideoId(singleVideoUrl.trim());
    if (!videoId) {
      setMessage({ type: 'error', text: L.invalidYoutubeUrl });
      return;
    }

    // Check if video already exists
    const existing = videos.find(v => v.youtube_id === videoId);
    if (existing) {
      setMessage({ type: 'error', text: `Video already exists: ${existing.title}` });
      return;
    }

    setImportingVideo(true);
    setMessage(null);

    try {
      // Fetch video info
      const videoInfo = await fetchVideoInfo(videoId);
      if (!videoInfo) {
        throw new Error('Could not fetch video info');
      }

      // Insert video with admin as owner
      const { data, error } = await supabase
        .from('videos')
        .insert({
          user_id: user.id,
          youtube_url: `https://www.youtube.com/watch?v=${videoId}`,
          youtube_id: videoId,
          title: videoInfo.title,
          thumbnail_url: videoInfo.thumbnail_url,
          artist_name: videoInfo.artist_name,
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      setVideos([data, ...videos]);
      setSingleVideoUrl('');
      setMessage({ type: 'success', text: `${L.videoImported}: ${videoInfo.title}` });
    } catch (error) {
      console.error('Error importing video:', error);
      setMessage({ type: 'error', text: error.message });
    } finally {
      setImportingVideo(false);
    }
  };

  // Import playlist using YouTube Data API through a simple fetch approach
  const handleImportPlaylist = async () => {
    if (!playlistUrl.trim()) return;

    const playlistId = extractPlaylistId(playlistUrl.trim());
    if (!playlistId) {
      setMessage({ type: 'error', text: L.invalidYoutubeUrl });
      return;
    }

    setImportingPlaylist(true);
    setMessage(null);

    try {
      // We'll use a workaround - fetch playlist page and extract video IDs
      // Since we don't have API key, we'll use oEmbed for each video
      // First, let's try to get playlist info from YouTube

      // For playlists, we need to use a different approach
      // We'll call a Supabase Edge Function to handle the ytpl import
      const { data: result, error } = await supabase.functions.invoke('import-youtube-playlist', {
        body: { playlistUrl: playlistUrl.trim(), adminUserId: user.id }
      });

      if (error) throw error;

      // Reload videos
      const { data: newVideos } = await supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false });

      if (newVideos) setVideos(newVideos);

      setPlaylistUrl('');
      setMessage({
        type: 'success',
        text: L.playlistImported.replace('{count}', result?.imported || 0)
      });
    } catch (error) {
      console.error('Error importing playlist:', error);
      setMessage({ type: 'error', text: error.message });
    } finally {
      setImportingPlaylist(false);
    }
  };

  // Podcast functions
  const handleImportExternalPodcast = async () => {
    if (!podcastRssUrl.trim()) return;

    // Validate RSS URL format
    if (!podcastRssUrl.match(/^https?:\/\//)) {
      setMessage({ type: 'error', text: L.invalidRssUrl });
      return;
    }

    setImportingExternalPodcast(true);
    setMessage(null);

    try {
      const result = await importExternalPodcast(supabase, podcastRssUrl.trim(), user.id);

      // Reload podcasts
      const { data: newPodcasts } = await supabase
        .from('user_podcasts')
        .select('*')
        .order('created_at', { ascending: false });

      if (newPodcasts) setPodcasts(newPodcasts);

      setPodcastRssUrl('');
      setMessage({
        type: 'success',
        text: `${L.podcastImported}: ${result.metadata.title}`
      });
    } catch (error) {
      console.error('Error importing podcast:', error);
      setMessage({
        type: 'error',
        text: error.message.includes('déjà') || error.message.includes('already')
          ? L.podcastAlreadyExists
          : error.message
      });
    } finally {
      setImportingExternalPodcast(false);
    }
  };

  const handlePodcastStatus = async (podcastId, isActive) => {
    try {
      const { error } = await supabase
        .from('user_podcasts')
        .update({
          is_active: isActive,
          updated_at: new Date().toISOString(),
        })
        .eq('id', podcastId);

      if (error) throw error;

      setPodcasts(podcasts.map(p => p.id === podcastId ? { ...p, is_active: isActive } : p));
      setMessage({ type: 'success', text: `Podcast ${isActive ? 'activé' : 'désactivé'}` });
    } catch (error) {
      console.error('Error updating podcast:', error);
      setMessage({ type: 'error', text: error.message });
    }
  };

  const handleDeletePodcast = async (podcastId, title) => {
    if (!window.confirm(`${L.confirmDelete} "${title}"?`)) return;

    try {
      const { error } = await supabase
        .from('user_podcasts')
        .delete()
        .eq('id', podcastId);

      if (error) throw error;

      setPodcasts(podcasts.filter(p => p.id !== podcastId));
      setMessage({ type: 'success', text: `Podcast deleted: ${title}` });
    } catch (error) {
      console.error('Error deleting podcast:', error);
      setMessage({ type: 'error', text: error.message });
    }
  };

  const filteredPodcasts = podcasts.filter(p =>
    p.title?.toLowerCase().includes(podcastFilter.toLowerCase()) ||
    p.author?.toLowerCase().includes(podcastFilter.toLowerCase())
  );

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
          href="/dashboard"
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
        <button
          onClick={() => setActiveTab('videos')}
          className={`px-4 py-2 text-sm font-semibold transition ${
            activeTab === 'videos'
              ? 'border-b-2 border-red-600 text-red-600'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          🎬 {L.videos} ({videos.length})
        </button>
        <button
          onClick={() => setActiveTab('podcasts')}
          className={`px-4 py-2 text-sm font-semibold transition ${
            activeTab === 'podcasts'
              ? 'border-b-2 border-red-600 text-red-600'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          🎙️ {L.podcasts} ({podcasts.length})
        </button>
        <Link
          href="/admin/store"
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
                          href={`/dashboard/podcasts/edit/${rss.id}`}
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
                          href={`/article/${article.slug}`}
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
                          href={`/dashboard/articles/edit/${article.id}`}
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
                          href={`/community/${artist.artist_slug}`}
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

      {/* Videos Table */}
      {activeTab === 'videos' && (
        <div className="space-y-4">
          {/* Import Section */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
            <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">
              📥 {L.importVideo} / {L.importPlaylist}
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              {/* Single Video Import */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {L.videoUrl}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={singleVideoUrl}
                    onChange={(e) => setSingleVideoUrl(e.target.value)}
                    className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/30 dark:border-gray-700 dark:bg-gray-900"
                    disabled={importingVideo}
                  />
                  <button
                    onClick={handleImportSingleVideo}
                    disabled={importingVideo || !singleVideoUrl.trim()}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 flex items-center gap-2"
                  >
                    {importingVideo ? (
                      <>
                        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                        {L.importingVideo}
                      </>
                    ) : (
                      <>🎬 {L.importSingleVideo}</>
                    )}
                  </button>
                </div>
              </div>

              {/* Playlist Import */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {L.playlistUrl}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="https://www.youtube.com/playlist?list=..."
                    value={playlistUrl}
                    onChange={(e) => setPlaylistUrl(e.target.value)}
                    className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/30 dark:border-gray-700 dark:bg-gray-900"
                    disabled={importingPlaylist}
                  />
                  <button
                    onClick={handleImportPlaylist}
                    disabled={importingPlaylist || !playlistUrl.trim()}
                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50 flex items-center gap-2"
                  >
                    {importingPlaylist ? (
                      <>
                        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                        {L.importingPlaylist}
                      </>
                    ) : (
                      <>📋 {L.importPlaylistBtn}</>
                    )}
                  </button>
                </div>
              </div>
            </div>
            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
              {lang === 'fr' ? 'Les vidéos importées seront automatiquement approuvées et appartiennent à KracRadio.' :
               lang === 'en' ? 'Imported videos will be automatically approved and owned by KracRadio.' :
               'Los videos importados serán aprobados automáticamente y pertenecerán a KracRadio.'}
            </p>
          </div>

          {/* Videos List */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-950">
            <div className="p-4">
              <input
                type="text"
                placeholder={L.filter}
                value={videoFilter}
                onChange={(e) => setVideoFilter(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
              />
            </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Video</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">{L.title_col}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">{L.artistName}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">{L.submittedBy}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">{L.status}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">{L.createdAt}</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500">{L.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {videos
                  .filter(v =>
                    v.title?.toLowerCase().includes(videoFilter.toLowerCase()) ||
                    v.artist_name?.toLowerCase().includes(videoFilter.toLowerCase())
                  )
                  .map((video) => (
                  <tr key={video.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setPreviewVideo(video)}
                        className="relative group block"
                      >
                        <img
                          src={video.thumbnail_url || `https://img.youtube.com/vi/${video.youtube_id}/mqdefault.jpg`}
                          alt={video.title}
                          className="w-24 h-14 object-cover rounded"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded">
                          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                        </div>
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={video.youtube_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-gray-900 dark:text-white hover:text-red-600 dark:hover:text-red-400"
                      >
                        {video.title}
                      </a>
                      {video.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">{video.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {video.artist_name || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {video.user_id?.substring(0, 8) || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        video.status === 'approved'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                          : video.status === 'rejected'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'
                      }`}>
                        {video.status === 'approved' ? L.approved : video.status === 'rejected' ? L.rejected : L.pending}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {new Date(video.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        {video.status !== 'approved' && (
                          <button
                            onClick={() => handleVideoStatus(video.id, 'approved')}
                            className="rounded bg-green-600 px-3 py-1 text-xs font-semibold text-white hover:bg-green-700"
                          >
                            ✓ {L.approve}
                          </button>
                        )}
                        {video.status !== 'rejected' && (
                          <button
                            onClick={() => handleVideoStatus(video.id, 'rejected')}
                            className="rounded bg-yellow-600 px-3 py-1 text-xs font-semibold text-white hover:bg-yellow-700"
                          >
                            ✗ {L.reject}
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteVideo(video.id, video.title)}
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
            {videos.filter(v =>
              v.title?.toLowerCase().includes(videoFilter.toLowerCase()) ||
              v.artist_name?.toLowerCase().includes(videoFilter.toLowerCase())
            ).length === 0 && (
              <p className="p-8 text-center text-gray-500">{L.noVideos}</p>
            )}
          </div>
          </div>
        </div>
      )}

      {/* Podcasts Table */}
      {activeTab === 'podcasts' && (
        <div className="space-y-4">
          {/* Import Section */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
            <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">
              🎙️ {L.importPodcast}
            </h3>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {L.podcastRssUrl}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="https://anchor.fm/s/.../podcast/rss"
                  value={podcastRssUrl}
                  onChange={(e) => setPodcastRssUrl(e.target.value)}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/30 dark:border-gray-700 dark:bg-gray-900"
                  disabled={importingExternalPodcast}
                />
                <button
                  onClick={handleImportExternalPodcast}
                  disabled={importingExternalPodcast || !podcastRssUrl.trim()}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 flex items-center gap-2"
                >
                  {importingExternalPodcast ? (
                    <>
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                      {L.importingPodcast}
                    </>
                  ) : (
                    <>🎙️ {L.importPodcastBtn}</>
                  )}
                </button>
              </div>
            </div>
            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
              {lang === 'fr' ? 'Les podcasts importés seront automatiquement approuvés et marqués comme "Import KracRadio".' :
               lang === 'en' ? 'Imported podcasts will be automatically approved and marked as "KracRadio Import".' :
               'Los podcasts importados serán aprobados automáticamente y marcados como "Importación KracRadio".'}
            </p>
          </div>

          {/* Podcasts List */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-950">
            <div className="p-4">
              <input
                type="text"
                placeholder={L.filter}
                value={podcastFilter}
                onChange={(e) => setPodcastFilter(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Cover</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">{L.title_col}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">{L.hostName}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">{L.status}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">{L.createdAt}</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500">{L.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {filteredPodcasts.map((podcast) => (
                    <tr key={podcast.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                      <td className="px-4 py-3">
                        <div className="relative">
                          <img
                            src={podcast.image_url || '/logo-og.png'}
                            alt={podcast.title}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                          {podcast.is_kracradio_import && (
                            <div className="absolute -top-1 -right-1 bg-red-600 rounded-full p-1" title={L.kracradioImport}>
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM8.5 7.5a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm4.5 6a4 4 0 01-6 0 .5.5 0 01.5-.5h5a.5.5 0 01.5.5z"/>
                              </svg>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <a
                          href={`/podcast/${podcast.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-gray-900 dark:text-white hover:text-red-600 dark:hover:text-red-400"
                        >
                          {podcast.title}
                        </a>
                        {podcast.description && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{podcast.description}</p>
                        )}
                        {podcast.rss_url && (
                          <a
                            href={podcast.rss_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-500 hover:underline"
                          >
                            RSS Feed
                          </a>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {podcast.author || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          podcast.is_active
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'
                        }`}>
                          {podcast.is_active ? L.approved : L.pending}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {new Date(podcast.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          {!podcast.is_active && (
                            <button
                              onClick={() => handlePodcastStatus(podcast.id, true)}
                              className="rounded bg-green-600 px-3 py-1 text-xs font-semibold text-white hover:bg-green-700"
                            >
                              {L.approve}
                            </button>
                          )}
                          {podcast.is_active && (
                            <button
                              onClick={() => handlePodcastStatus(podcast.id, false)}
                              className="rounded bg-yellow-600 px-3 py-1 text-xs font-semibold text-white hover:bg-yellow-700"
                            >
                              {L.reject}
                            </button>
                          )}
                          <button
                            onClick={() => handleDeletePodcast(podcast.id, podcast.title)}
                            className="rounded bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700"
                          >
                            {L.delete}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredPodcasts.length === 0 && (
                <p className="p-8 text-center text-gray-500">{L.noPodcasts}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Video Preview Modal */}
      {previewVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreviewVideo(null)}
        >
          <div
            className="relative w-full max-w-4xl bg-gray-900 rounded-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <div>
                <h3 className="font-bold text-white text-lg">{previewVideo.title}</h3>
                {previewVideo.artist_name && (
                  <p className="text-sm text-gray-400">{previewVideo.artist_name}</p>
                )}
              </div>
              <button
                onClick={() => setPreviewVideo(null)}
                className="p-2 hover:bg-gray-800 rounded-full transition-colors"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="aspect-video">
              <iframe
                src={`https://www.youtube.com/embed/${previewVideo.youtube_id}?autoplay=1`}
                title={previewVideo.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className="p-4 border-t border-gray-800 flex justify-between items-center">
              <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                previewVideo.status === 'approved'
                  ? 'bg-green-900/50 text-green-200'
                  : previewVideo.status === 'rejected'
                  ? 'bg-red-900/50 text-red-200'
                  : 'bg-yellow-900/50 text-yellow-200'
              }`}>
                {previewVideo.status === 'approved' ? L.approved : previewVideo.status === 'rejected' ? L.rejected : L.pending}
              </span>
              <div className="flex gap-2">
                {previewVideo.status !== 'approved' && (
                  <button
                    onClick={() => { handleVideoStatus(previewVideo.id, 'approved'); setPreviewVideo(null); }}
                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                  >
                    ✓ {L.approve}
                  </button>
                )}
                {previewVideo.status !== 'rejected' && (
                  <button
                    onClick={() => { handleVideoStatus(previewVideo.id, 'rejected'); setPreviewVideo(null); }}
                    className="rounded-lg bg-yellow-600 px-4 py-2 text-sm font-semibold text-white hover:bg-yellow-700"
                  >
                    ✗ {L.reject}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
