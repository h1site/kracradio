'use client';
// src/pages/Dashboard.jsx
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n';
import { useTheme } from '../context/ThemeContext';
import Seo from '../seo/Seo';
import { supabase, listUserArticles, deleteArticleById, submitVideo, getUserVideos, deleteVideo, updateVideo, extractYouTubeId } from '../lib/supabase';
import { importAllUserPodcasts, importPodcastEpisodes } from '../utils/podcastRssParser';
import MusicSubmissionsManager from '../components/MusicSubmissionsManager';

// Music Genres (same as SubmitMusic.jsx)
const MUSIC_GENRES = [
  { category: 'Pop', genres: ['Pop', 'Pop mainstream / Top 40', 'Pop rock', 'Pop électro / electro-pop', 'Synth-pop', 'Dance-pop', 'Teen pop / boy bands / girl groups', 'K-Pop', 'J-Pop', 'Indie pop', 'Dream pop'] },
  { category: 'Rock', genres: ['Rock', 'Rock classique / classic rock', 'Rock n\' roll', 'Rock alternatif', 'Rock moderne', 'Rock psychédélique', 'Rock progressif', 'Garage rock', 'Stoner rock', 'Post-rock', 'Southern rock', 'Arena rock / stadium rock'] },
  { category: 'Metal', genres: ['Metal', 'Heavy metal', 'Thrash metal', 'Speed metal', 'Power metal', 'Death metal', 'Black metal', 'Doom metal', 'Gothic metal', 'Symphonic metal', 'Progressive metal', 'Industrial metal', 'Nu-metal', 'Metalcore', 'Deathcore', 'Sludge metal'] },
  { category: 'Punk / Hardcore', genres: ['Punk', 'Punk rock', 'Hardcore punk', 'Skate punk', 'Pop punk', 'Street punk / Oi!', 'Post-punk', 'Emo', 'Post-hardcore', 'Screamo'] },
  { category: 'Hip-Hop / Rap', genres: ['Hip-hop / rap', 'Rap old school', 'Rap 90s', 'Boom bap', 'Rap moderne', 'Trap', 'Drill', 'Cloud rap', 'Gangsta rap', 'Hip-hop alternatif', 'Conscious rap', 'Underground hip-hop', 'Latin rap', 'Grime'] },
  { category: 'Électro / Dance', genres: ['Musique électronique', 'EDM', 'Dance', 'Eurodance', 'Big room', 'Electro house', 'Future house', 'Bass house'] },
  { category: 'Industrial / EBM / Dark / Goth', genres: ['Industrial', 'EBM', 'Dark electro', 'Electro-indus', 'Aggrotech / hellectro', 'Industrial rock', 'Industrial metal', 'Darkwave', 'Coldwave', 'Goth rock / gothic rock', 'Post-punk dark', 'Cyberpunk / futurepop'] }
];

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
    myVideos: 'Vidéos',
    addVideo: 'Soumettre une vidéo',
    noVideos: 'Aucune vidéo',
    noVideosDesc: 'Soumettez votre premier vidéoclip',
    videoSubmitted: 'Vidéo soumise pour approbation',
    videoDeleted: 'Vidéo supprimée',
    youtubeUrl: 'URL YouTube',
    videoTitle: 'Titre de la vidéo',
    videoDescription: 'Description',
    videoGenres: 'Genres musicaux',
    selectGenres: 'Sélectionner jusqu\'à 3 genres',
    pending: 'En attente',
    approved: 'Approuvée',
    rejected: 'Refusée',
    newVideo: 'Soumettre un vidéoclip',
    videoWarning: 'Seuls les vidéoclips musicaux sont acceptés. Les vidéos avec image fixe seront refusées.',
    videoApprovalTime: 'Délai d\'approbation : 2-3 jours ouvrables.',
    myMusicSubmissions: 'Soumissions musicales',
    noMusicSubmissions: 'Aucune soumission',
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
    myVideos: 'Videos',
    addVideo: 'Submit a video',
    noVideos: 'No videos',
    noVideosDesc: 'Submit your first music video',
    videoSubmitted: 'Video submitted for approval',
    videoDeleted: 'Video deleted',
    youtubeUrl: 'YouTube URL',
    videoTitle: 'Video title',
    videoDescription: 'Description',
    videoGenres: 'Music genres',
    selectGenres: 'Select up to 3 genres',
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    newVideo: 'Submit a music video',
    videoWarning: 'Only music videos are accepted. Videos with static images will be rejected.',
    videoApprovalTime: 'Approval time: 2-3 business days.',
    myMusicSubmissions: 'Music Submissions',
    noMusicSubmissions: 'No submissions',
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
    myVideos: 'Videos',
    addVideo: 'Enviar un video',
    noVideos: 'Sin videos',
    noVideosDesc: 'Envía tu primer videoclip musical',
    videoSubmitted: 'Video enviado para aprobación',
    videoDeleted: 'Video eliminado',
    youtubeUrl: 'URL de YouTube',
    pending: 'Pendiente',
    approved: 'Aprobado',
    rejected: 'Rechazado',
    newVideo: 'Enviar un videoclip',
    videoWarning: 'Solo se aceptan videoclips musicales. Los videos con imagen fija serán rechazados.',
    videoApprovalTime: 'Tiempo de aprobación: 2-3 días hábiles.',
    myMusicSubmissions: 'Envíos de música',
    noMusicSubmissions: 'Sin envíos',
  },
};

const blankPodcast = { rss_url: '' };

export default function Dashboard() {
  const { lang } = useI18n();
  const L = useMemo(() => STRINGS[lang] || STRINGS.fr, [lang]);
  const { user, userRole, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

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
  const [validatingRss, setValidatingRss] = useState(false);
  const [feedData, setFeedData] = useState(null);

  // Video state
  const [videos, setVideos] = useState([]);
  const [showVideoForm, setShowVideoForm] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDescription, setVideoDescription] = useState('');
  const [videoGenres, setVideoGenres] = useState([]);
  const [savingVideo, setSavingVideo] = useState(false);
  const [editingVideoId, setEditingVideoId] = useState(null);
  const [editVideoForm, setEditVideoForm] = useState({});

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadPodcasts();
      loadArticles();
      loadVideos();
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

  const loadVideos = async () => {
    if (!user?.id) return;
    try {
      const data = await getUserVideos(user.id);
      setVideos(data || []);
    } catch (error) {
      console.error('Error loading videos:', error);
      setVideos([]);
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
      // First delete all episodes for this podcast
      const { error: episodesError } = await supabase
        .from('podcast_episodes')
        .delete()
        .eq('podcast_id', id);

      if (episodesError) {
        console.error('[Dashboard] Error deleting episodes:', episodesError);
        throw episodesError;
      }

      // Then delete the podcast itself
      const { error } = await supabase
        .from('user_podcasts')
        .delete()
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
      rss_url: podcast.rss_url || '',
    });
    // Set existing data as preview (will be refreshed on validation)
    setFeedData({
      feedTitle: podcast.title,
      feedImage: podcast.image_url,
      feedDescription: podcast.description,
      feedAuthor: podcast.author,
      episodeCount: null,
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
    setFeedData(null);
  };

  // Validate and extract RSS feed data
  const validateAndExtractRss = async (url) => {
    if (!url.trim()) {
      setFeedData(null);
      return null;
    }

    setValidatingRss(true);
    setFeedData(null);

    try {
      console.log('[Dashboard] Validating RSS:', url);
      const response = await fetch('/api/validate-rss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const result = await response.json();
      console.log('[Dashboard] RSS validation result:', result);

      if (result.valid) {
        setFeedData(result);
        return result;
      } else {
        setMessage({ type: 'error', text: `${L.rssInvalid || 'Invalid RSS'}: ${result.error}` });
        return null;
      }
    } catch (error) {
      console.error('[Dashboard] RSS validation error:', error);
      setMessage({ type: 'error', text: error.message || 'Network error' });
      return null;
    } finally {
      setValidatingRss(false);
    }
  };

  // Auto-validate when editing existing podcast
  useEffect(() => {
    if (editingPodcast && podcastForm.rss_url?.trim() && !feedData) {
      validateAndExtractRss(podcastForm.rss_url);
    }
  }, [editingPodcast, podcastForm.rss_url]);

  const handleSavePodcast = async (e) => {
    if (e) e.preventDefault();

    if (!feedData) {
      setMessage({ type: 'error', text: L.validateFirst || 'Please validate the RSS feed first' });
      return;
    }

    if (!podcastForm.rss_url?.trim()) {
      setMessage({ type: 'error', text: L.rssRequired || 'RSS URL is required' });
      return;
    }

    setSavingPodcast(true);
    try {
      const podcastData = {
        title: feedData.feedTitle || podcastForm.rss_url,
        rss_url: podcastForm.rss_url,
        description: feedData.feedDescription || null,
        image_url: feedData.feedImage || null,
        website_url: feedData.feedWebsite || null,
        author: feedData.feedAuthor || null,
      };

      let podcastId = editingPodcast?.id;
      let isExisting = false;

      if (editingPodcast) {
        // Update existing podcast
        const { error } = await supabase
          .from('user_podcasts')
          .update(podcastData)
          .eq('id', editingPodcast.id);
        if (error) throw error;
      } else {
        // Check if podcast already exists GLOBALLY (not just for this user)
        const { data: existingPodcast } = await supabase
          .from('user_podcasts')
          .select('id, user_id, is_active')
          .eq('rss_url', podcastForm.rss_url)
          .single();

        console.log('[Dashboard] Existing podcast check:', existingPodcast, 'Current user:', user.id);

        if (existingPodcast) {
          if (existingPodcast.user_id === user.id) {
            // Same user already has this podcast
            podcastId = existingPodcast.id;
            isExisting = true;

            // Always update the podcast data (reactivate if needed, update metadata)
            console.log('[Dashboard] Updating existing podcast:', podcastId, 'was_active:', existingPodcast.is_active);
            const { error: updateError } = await supabase
              .from('user_podcasts')
              .update({ is_active: true, ...podcastData })
              .eq('id', podcastId);

            if (updateError) {
              console.error('[Dashboard] Error updating podcast:', updateError);
              throw updateError;
            }
            console.log('[Dashboard] Podcast updated successfully, will import episodes:', podcastId);
          } else {
            // Another user has this podcast - show error
            setMessage({ type: 'error', text: L.podcastAlreadyExists || 'Ce podcast est déjà importé par un autre utilisateur' });
            setSavingPodcast(false);
            return;
          }
        } else {
          // Insert new podcast
          console.log('[Dashboard] Inserting new podcast:', podcastData);
          const { data: newPodcast, error } = await supabase
            .from('user_podcasts')
            .insert([{ ...podcastData, user_id: user.id, is_active: true }])
            .select()
            .single();

          if (error) {
            console.error('[Dashboard] Insert error:', error);
            throw error;
          }
          console.log('[Dashboard] New podcast created:', newPodcast);
          podcastId = newPodcast.id;
        }
      }

      // Import episodes for the podcast
      if (podcastId) {
        console.log('[Dashboard] Importing episodes for podcast:', podcastId);
        const importResult = await importPodcastEpisodes(supabase, podcastId, podcastForm.rss_url);
        console.log('[Dashboard] Import result:', importResult);

        if (importResult.success) {
          setMessage({
            type: 'success',
            text: isExisting
              ? `${L.episodesUpdated || 'Episodes updated'} - ${importResult.imported || 0} ${L.episodesImported || 'episodes'}`
              : `${L.podcastAdded || 'Podcast ajouté'} - ${importResult.imported || 0} ${L.episodesImported || 'épisodes importés'}`
          });
        } else {
          setMessage({
            type: 'warning',
            text: `${L.podcastAdded || 'Podcast ajouté'}, ${L.importError || 'mais erreur import épisodes'}: ${importResult.error || 'Erreur inconnue'}`
          });
        }
      } else {
        setMessage({ type: 'success', text: editingPodcast ? L.podcastUpdated : L.podcastAdded });
      }

      handleCancelPodcastForm();
      loadPodcasts();
      setTimeout(() => setMessage(null), 5000);
    } catch (error) {
      console.error('Error saving podcast:', error);
      // Handle duplicate RSS URL error (409 Conflict or unique constraint violation)
      if (error.code === '23505' || error.message?.includes('duplicate') || error.message?.includes('unique') || String(error.code) === '409') {
        setMessage({ type: 'error', text: L.duplicatePodcast || 'Ce podcast existe déjà' });
      } else {
        setMessage({ type: 'error', text: error.message || 'Erreur lors de la sauvegarde' });
      }
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

  const handleAddVideo = () => {
    setVideoUrl('');
    setVideoTitle('');
    setVideoDescription('');
    setVideoGenres([]);
    setShowVideoForm(true);
  };

  const handleCancelVideoForm = () => {
    setShowVideoForm(false);
    setVideoUrl('');
    setVideoTitle('');
    setVideoDescription('');
    setVideoGenres([]);
  };

  const handleSaveVideo = async (e) => {
    e.preventDefault();
    if (!videoUrl || !videoTitle || videoGenres.length === 0) {
      setMessage({ type: 'error', text: 'Veuillez remplir tous les champs requis' });
      return;
    }

    setSavingVideo(true);
    try {
      await submitVideo({
        youtubeUrl: videoUrl,
        title: videoTitle,
        description: videoDescription,
        genres: videoGenres.join(', '),
        userId: user.id
      });
      setMessage({ type: 'success', text: L.videoSubmitted });
      handleCancelVideoForm();
      loadVideos();
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSavingVideo(false);
    }
  };

  const handleDeleteVideo = async (videoId) => {
    if (!window.confirm(L.confirmDelete)) return;
    try {
      await deleteVideo(videoId);
      setMessage({ type: 'success', text: L.videoDeleted });
      loadVideos();
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  const startEditVideo = (video) => {
    setEditingVideoId(video.id);
    setEditVideoForm({
      title: video.title,
      description: video.description || '',
      genres: video.genres ? video.genres.split(', ') : [],
    });
  };

  const cancelEditVideo = () => {
    setEditingVideoId(null);
    setEditVideoForm({});
  };

  const saveEditVideo = async (videoId) => {
    try {
      await updateVideo(videoId, {
        title: editVideoForm.title,
        description: editVideoForm.description,
        genres: editVideoForm.genres.join(', '),
      });
      setMessage({ type: 'success', text: 'Vidéo mise à jour' });
      setEditingVideoId(null);
      loadVideos();
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
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
                href="/settings"
                className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Settings
              </Link>
              {userRole === 'admin' && (
                <Link
                  href="/admin"
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

        {/* Videos Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/10 flex items-center justify-center">
                <IconImg name="video" className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">{L.myVideos}</h2>
              <span className="text-sm text-gray-500 dark:text-gray-400">({videos.length})</span>
            </div>
            {!showVideoForm && (
              <button
                onClick={handleAddVideo}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 rounded-lg transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                </svg>
                {L.addVideo}
              </button>
            )}
          </div>

          {/* Video Form */}
          {showVideoForm && (
            <div className="mb-6 bg-white dark:bg-[#1a1a1a] rounded-xl border border-pink-200 dark:border-pink-800 overflow-hidden">
              <div className="px-5 py-4 bg-pink-50 dark:bg-pink-900/20 border-b border-pink-200 dark:border-pink-800">
                <h3 className="font-medium text-pink-900 dark:text-pink-100">
                  {L.newVideo}
                </h3>
              </div>
              <form onSubmit={handleSaveVideo} className="p-5 space-y-4">
                {/* Warning */}
                <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                  <p className="text-xs text-yellow-800 dark:text-yellow-200 font-medium">{L.videoWarning}</p>
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">{L.videoApprovalTime}</p>
                </div>

                {/* YouTube URL */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {L.youtubeUrl} *
                  </label>
                  <input
                    type="url"
                    required
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none transition"
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                </div>

                {/* Video Title */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {L.videoTitle} *
                  </label>
                  <input
                    type="text"
                    required
                    value={videoTitle}
                    onChange={(e) => setVideoTitle(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none transition"
                    placeholder="Ex: Mon nouveau clip 2024"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {L.videoDescription}
                  </label>
                  <textarea
                    value={videoDescription}
                    onChange={(e) => setVideoDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none transition resize-none"
                    placeholder="Description de votre vidéo..."
                  />
                </div>

                {/* Genres */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {L.videoGenres} * ({videoGenres.length}/3)
                  </label>

                  {/* Selected genres */}
                  {videoGenres.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {videoGenres.map((genre) => (
                        <span
                          key={genre}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-pink-600 text-white rounded text-xs"
                        >
                          {genre}
                          <button
                            type="button"
                            onClick={() => setVideoGenres(videoGenres.filter(g => g !== genre))}
                            className="hover:text-pink-200 transition-colors"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Genre selector */}
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value && videoGenres.length < 3 && !videoGenres.includes(e.target.value)) {
                        setVideoGenres([...videoGenres, e.target.value]);
                      }
                    }}
                    disabled={videoGenres.length >= 3}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none transition disabled:opacity-50"
                  >
                    <option value="">{L.selectGenres}</option>
                    {MUSIC_GENRES.map((category) => (
                      <optgroup key={category.category} label={category.category}>
                        {category.genres.map((genre) => (
                          <option
                            key={genre}
                            value={genre}
                            disabled={videoGenres.includes(genre)}
                          >
                            {genre}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleCancelVideoForm}
                    className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    {L.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={savingVideo}
                    className="px-4 py-2 text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {savingVideo ? '...' : L.save}
                  </button>
                </div>
              </form>
            </div>
          )}

          {videos.length === 0 && !showVideoForm ? (
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-gray-800 p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
                <IconImg name="video" className="w-6 h-6 opacity-50" />
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{L.noVideos}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{L.noVideosDesc}</p>
            </div>
          ) : videos.length > 0 && (
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
              {videos.map((video) => {
                const isEditing = editingVideoId === video.id;
                return (
                  <div key={video.id} className="px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <div className="flex items-start gap-4">
                      <img
                        src={video.thumbnail_url || `https://img.youtube.com/vi/${video.youtube_id}/mqdefault.jpg`}
                        alt={video.title}
                        className="w-20 h-12 object-cover rounded flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        {isEditing ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={editVideoForm.title}
                              onChange={(e) => setEditVideoForm({ ...editVideoForm, title: e.target.value })}
                              className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                              placeholder="Titre de la vidéo"
                            />
                            <textarea
                              value={editVideoForm.description}
                              onChange={(e) => setEditVideoForm({ ...editVideoForm, description: e.target.value })}
                              rows={2}
                              className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
                              placeholder="Description (optionnel)"
                            />

                            {/* Genre selector for editing */}
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                  Genres ({editVideoForm.genres?.length || 0}/3)
                                </label>
                              </div>

                              {/* Selected genres */}
                              {editVideoForm.genres && editVideoForm.genres.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-2">
                                  {editVideoForm.genres.map((genre) => (
                                    <span
                                      key={genre}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-pink-600 text-white rounded text-xs"
                                    >
                                      {genre}
                                      <button
                                        type="button"
                                        onClick={() => setEditVideoForm({
                                          ...editVideoForm,
                                          genres: editVideoForm.genres.filter(g => g !== genre)
                                        })}
                                        className="hover:text-pink-200 transition-colors"
                                      >
                                        ×
                                      </button>
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* Genre selector */}
                              <select
                                value=""
                                onChange={(e) => {
                                  if (e.target.value && (!editVideoForm.genres || editVideoForm.genres.length < 3) && !editVideoForm.genres?.includes(e.target.value)) {
                                    setEditVideoForm({
                                      ...editVideoForm,
                                      genres: [...(editVideoForm.genres || []), e.target.value]
                                    });
                                  }
                                }}
                                disabled={editVideoForm.genres && editVideoForm.genres.length >= 3}
                                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-pink-500 disabled:opacity-50"
                              >
                                <option value="">{editVideoForm.genres?.length >= 3 ? 'Maximum 3 genres' : 'Ajouter un genre...'}</option>
                                {MUSIC_GENRES.map((category) => (
                                  <optgroup key={category.category} label={category.category}>
                                    {category.genres.map((genre) => (
                                      <option
                                        key={genre}
                                        value={genre}
                                        disabled={editVideoForm.genres?.includes(genre)}
                                      >
                                        {genre}
                                      </option>
                                    ))}
                                  </optgroup>
                                ))}
                              </select>
                            </div>
                          </div>
                        ) : (
                          <>
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">{video.title}</h3>
                            {video.description && (
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{video.description}</p>
                            )}
                            {video.genres && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {video.genres.split(', ').map((genre, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded"
                                  >
                                    {genre}
                                  </span>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          {video.artist_name && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">{video.artist_name}</span>
                          )}
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            video.status === 'approved'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : video.status === 'rejected'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                          }`}>
                            {video.status === 'approved' ? L.approved : video.status === 'rejected' ? L.rejected : L.pending}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => saveEditVideo(video.id)}
                              className="px-3 py-1.5 text-xs bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                            >
                              Enregistrer
                            </button>
                            <button
                              onClick={cancelEditVideo}
                              className="px-3 py-1.5 text-xs bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                            >
                              Annuler
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEditVideo(video)}
                              className="px-3 py-1.5 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                            >
                              Modifier
                            </button>
                            <button
                              onClick={() => handleDeleteVideo(video.id)}
                              className="px-3 py-1.5 text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                            >
                              {L.delete}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

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
              href="/dashboard/articles/edit"
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
                      href={`/article/${article.slug}`}
                      className="px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                      {L.viewArticle}
                    </Link>
                    <Link
                      href={`/dashboard/articles/edit/${article.id}`}
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
              <div className="p-5 space-y-4">
                {/* Step 1: Enter RSS URL */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {L.rssUrl} *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={podcastForm.rss_url}
                      onChange={(e) => {
                        setPodcastForm({ ...podcastForm, rss_url: e.target.value });
                        setFeedData(null);
                      }}
                      className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition"
                      placeholder="https://example.com/feed.xml"
                      disabled={validatingRss || savingPodcast}
                    />
                    {!feedData && !validatingRss && (
                      <button
                        type="button"
                        onClick={() => validateAndExtractRss(podcastForm.rss_url)}
                        disabled={!podcastForm.rss_url?.trim() || validatingRss}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {L.validate || 'Valider'}
                      </button>
                    )}
                  </div>
                  <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                    {L.rssUrlHint || 'Enter your RSS feed URL and click Validate'}
                  </p>
                </div>

                {/* Loading indicator */}
                {validatingRss && (
                  <div className="flex items-center justify-center gap-2 py-4 text-sm text-gray-600 dark:text-gray-400">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    {L.validating || 'Validation en cours...'}
                  </div>
                )}

                {/* Step 2: Feed Preview - shown after validation */}
                {feedData && !validatingRss && (
                  <div className="rounded-lg border-2 border-green-500 bg-green-50 dark:bg-green-900/20 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <p className="text-sm font-medium text-green-700 dark:text-green-300">
                        {L.feedValid || 'Feed RSS valide!'}
                      </p>
                    </div>
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
                          <p className="font-bold text-base text-gray-900 dark:text-white">
                            {feedData.feedTitle}
                          </p>
                        )}
                        {feedData.feedAuthor && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {L.author || 'Auteur'}: {feedData.feedAuthor}
                          </p>
                        )}
                        {feedData.episodeCount != null && (
                          <p className="text-sm text-purple-600 dark:text-purple-400 font-medium mt-1">
                            {feedData.episodeCount} {L.episodes || 'épisodes'} {L.toImport || 'à importer'}
                          </p>
                        )}
                        {feedData.feedDescription && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">
                            {feedData.feedDescription}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={handleCancelPodcastForm}
                    disabled={savingPodcast}
                    className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors disabled:opacity-50"
                  >
                    {L.cancel}
                  </button>
                  {feedData && !validatingRss && (
                    <button
                      type="button"
                      onClick={handleSavePodcast}
                      disabled={savingPodcast}
                      className="px-6 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {savingPodcast ? (
                        <>
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                          </svg>
                          {L.importing || 'Importation...'}
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                          {L.importPodcast || 'Importer le podcast'}
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
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

        {/* Music Submissions Section */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/10 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="currentColor">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
              </svg>
            </div>
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">{L.myMusicSubmissions}</h2>
          </div>

          <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <MusicSubmissionsManager />
          </div>
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
                href="/store/submit"
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
                href="/dashboard/store"
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
