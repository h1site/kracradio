'use client';
// src/pages/PublicProfile.jsx
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { useTheme } from '../context/ThemeContext';
import { useResolveUsername, useProfile, useMusicLinks, useFollowStats } from '../hooks/useCommunity';
import { supabase } from '../lib/supabase';
import Seo from '../seo/Seo';
import { personSchema, musicGroupSchema, breadcrumbSchema } from '../seo/schemas';
import { useI18n } from '../i18n';
import FollowButton from '../components/community/FollowButton';
import FollowersModal from '../components/community/FollowersModal';
import MessageModal from '../components/messages/MessageModal';

function IconImg({ name, alt = '', className = 'w-6 h-6' }) {
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

export default function PublicProfile() {
  const { t, lang } = useI18n();
  const { username } = useParams();
  const { user } = useAuth();
  const { sidebarOpen, isDesktop, sidebarWidth } = useUI();
  const [articles, setArticles] = useState([]);
  const [podcasts, setPodcasts] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [loadingPodcasts, setLoadingPodcasts] = useState(false);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [spotifyLink, setSpotifyLink] = useState('');
  const [savingSpotify, setSavingSpotify] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [followersModalType, setFollowersModalType] = useState('followers');

  // Résoudre le username (slug ou UUID) vers un user_id
  const { userId, loading: resolvingUser, error: resolveError } = useResolveUsername(username);

  const { profile, loading: loadingProfile } = useProfile(userId);
  const { musicLinks, loading: loadingLinks } = useMusicLinks(userId);
  const { stats, loading: loadingStats } = useFollowStats(userId);

  // Vérifier si c'est le propre profil de l'utilisateur
  const isOwnProfile = user && user.id === userId;

  // Fonction pour sauvegarder le lien Spotify
  const handleSaveSpotifyLink = async () => {
    if (!spotifyLink.trim() || !userId) return;

    setSavingSpotify(true);
    try {
      const { data, error } = await supabase
        .from('music_links')
        .insert([{
          user_id: userId,
          platform: 'spotify',
          url: spotifyLink.trim(),
          embed_html: spotifyLink.includes('spotify.com') ? `<iframe style="border-radius:12px" src="${spotifyLink.replace('spotify.com/', 'spotify.com/embed/')}" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>` : null
        }])
        .select();

      if (error) throw error;

      // Recharger la page pour afficher le nouveau lecteur
      window.location.reload();
    } catch (error) {
      console.error('Error saving Spotify link:', error);
      alert('Erreur lors de la sauvegarde du lien Spotify');
    } finally {
      setSavingSpotify(false);
    }
  };

  // Charger les articles avec infos auteur
  useEffect(() => {
    if (userId) {
      setLoadingArticles(true);
      supabase
        .from('articles')
        .select(`
          *,
          author:profiles!user_id (
            id,
            username,
            artist_slug,
            is_public
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .then(({ data, error }) => {
          if (error) {
            console.error('Error loading articles:', error);
            // Fallback: charger sans les infos auteur
            return supabase
              .from('articles')
              .select('*')
              .eq('user_id', userId)
              .eq('status', 'published')
              .order('created_at', { ascending: false });
          }
          return { data, error };
        })
        .then(({ data, error }) => {
          if (!error) setArticles(data || []);
        })
        .finally(() => setLoadingArticles(false));
    }
  }, [userId]);

  // Charger les podcasts avec infos auteur
  useEffect(() => {
    if (userId) {
      setLoadingPodcasts(true);
      supabase
        .from('user_podcasts')
        .select(`
          *,
          author:profiles!user_id (
            id,
            username,
            artist_slug,
            is_public
          )
        `)
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .then(({ data, error }) => {
          if (error) {
            console.error('Error loading podcasts:', error);
            // Fallback: charger sans les infos auteur
            return supabase
              .from('user_podcasts')
              .select('*')
              .eq('user_id', userId)
              .eq('is_active', true)
              .order('created_at', { ascending: false });
          }
          return { data, error };
        })
        .then(({ data, error }) => {
          if (!error) setPodcasts(data || []);
        })
        .finally(() => setLoadingPodcasts(false));
    }
  }, [userId]);

  // Charger les vidéos approuvées
  useEffect(() => {
    if (userId) {
      setLoadingVideos(true);
      supabase
        .from('videos')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .then(({ data, error }) => {
          if (!error) setVideos(data || []);
        })
        .finally(() => setLoadingVideos(false));
    }
  }, [userId]);

  if (resolvingUser || loadingProfile) {
    return (
      <div className="min-h-screen bg-bg-primary pt-20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (resolveError) {
    return (
      <div className="min-h-screen bg-bg-primary pt-20 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-text-primary mb-4">❌ {t.publicProfile?.error || 'Erreur'}</h1>
          <p className="text-text-secondary mb-2">{t.publicProfile?.errorResolving || 'Erreur lors de la résolution du profil'}</p>
          <p className="text-red-400 text-sm font-mono">{resolveError}</p>
          <p className="text-text-secondary text-sm mt-4">
            {t.publicProfile?.slugSearched || 'Slug recherché:'} <span className="font-mono text-accent">{username}</span>
          </p>
        </div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="min-h-screen bg-bg-primary pt-20 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-text-primary mb-4">404</h1>
          <p className="text-text-secondary mb-2">{t.publicProfile?.notFound || 'Profil introuvable'}</p>
          <p className="text-text-secondary text-sm">
            {t.publicProfile?.noSlug || 'Aucun profil avec le slug:'} <span className="font-mono text-accent">{username}</span>
          </p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-bg-primary pt-20 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-text-primary mb-4">404</h1>
          <p className="text-text-secondary">{t.publicProfile?.notFound || 'Profil introuvable'}</p>
        </div>
      </div>
    );
  }

  // Vérifier si profil privé (à implémenter avec RLS)
  if (!profile.is_public) {
    return (
      <div className="min-h-screen bg-bg-primary pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">{t.publicProfile?.privateProfile || 'Profil privé'}</h1>
          <p className="text-text-secondary">
            {t.publicProfile?.privateProfileDesc || "Ce profil n'est visible que par les connexions de l'artiste"}
          </p>
        </div>
      </div>
    );
  }


  return (
    <>
      <Seo
        lang={lang}
        title={profile.username || 'Profil'}
        description={profile.bio || `Profil de ${profile.username} sur KracRadio`}
        path={`/profile/${profile.artist_slug || username}`}
        image={profile.avatar_url}
        type="profile"
        jsonLd={[
          profile.is_verified ? musicGroupSchema(profile) : personSchema(profile),
          breadcrumbSchema([
            { name: 'Accueil', url: '/' },
            { name: 'Artistes', url: '/artists' },
            { name: profile.username || 'Artiste' },
          ]),
        ]}
      />

      <div className="min-h-screen bg-bg-primary">
        {/* Full-screen header */}
        <div
          className="h-80 bg-cover bg-center relative w-full"
          style={{
            backgroundImage: `url(${profile.banner_url || profile.avatar_url})`,
            marginLeft: isDesktop && sidebarOpen ? -sidebarWidth : 0,
            width: isDesktop && sidebarOpen ? `calc(100% + ${sidebarWidth}px)` : '100%',
            transition: 'margin-left 300ms ease, width 300ms ease'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          {/* Back button - top right */}
          <Link
            href="/artists"
            className="absolute top-4 right-4 z-20 flex items-center gap-2 px-4 py-2 bg-black/50 hover:bg-black/70 text-white rounded-lg backdrop-blur-sm transition-colors"
            style={{
              marginRight: isDesktop && sidebarOpen ? 0 : 0,
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {t.publicProfile?.backToArtists || 'Artistes'}
          </Link>
          <div
            className="relative z-10 flex flex-col justify-end h-full p-8 text-white"
            style={{
              marginLeft: isDesktop && sidebarOpen ? sidebarWidth : 0,
              transition: 'margin-left 300ms ease'
            }}
          >
            <div className="flex items-end gap-6">
              <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-gray-900 shadow-lg -mb-10">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-800">
                    <span className="text-6xl">👤</span>
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-5xl font-black flex items-center gap-3">
                  {profile.username || 'Utilisateur'}
                  {profile.is_verified && (
                    <span className="text-red-400 text-3xl" title={t.publicProfile?.verifiedArtist || 'Artiste vérifié'}>✓</span>
                  )}
                </h1>
                <p className="text-gray-300">@{profile.artist_slug || 'artiste'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-8 pt-16">
          <div className="flex justify-between items-start">
              {/* Stats and Actions */}
              <div className="flex items-center gap-6">
                {!loadingStats && (
                    <div className="flex gap-6 text-lg">
                      <button
                        onClick={() => { setFollowersModalType('followers'); setShowFollowersModal(true); }}
                        className="hover:underline transition-colors"
                      >
                        <strong className="font-bold">{stats.followers || 0}</strong> {t.publicProfile?.followers || 'Abonnés'}
                      </button>
                      <button
                        onClick={() => { setFollowersModalType('following'); setShowFollowersModal(true); }}
                        className="hover:underline transition-colors"
                      >
                        <strong className="font-bold">{stats.following || 0}</strong> {t.publicProfile?.following || 'Abonnements'}
                      </button>
                    </div>
                  )}
                  {isOwnProfile ? (
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href="/settings"
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-lg font-medium transition-colors hover:bg-gray-300 dark:hover:bg-gray-700 flex items-center gap-2 text-sm"
                    >
                      <img
                        src="/icons/dark/settings.svg"
                        alt=""
                        className="w-4 h-4 dark:invert"
                      />
                      {t.publicProfile?.settings || 'Paramètres'}
                    </Link>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <FollowButton userId={userId} />
                    <button
                      onClick={() => setShowMessageModal(true)}
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-800 rounded-lg text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
                    >
                      💬 {t.publicProfile?.message || 'Message'}
                    </button>
                  </div>
                )}
              </div>
              {/* Social links */}
              <div className="flex items-center gap-3">
                  {profile.website_url && (
                    <a
                      href={profile.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-500 hover:text-red-500 transition-colors"
                    >
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L8.99 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                    </a>
                  )}
                  {/* Assuming you have these fields in your profile data */}
                  {profile.twitter_url && <a href={profile.twitter_url} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-red-500 transition-colors">[TW]</a>}
                  {profile.instagram_url && <a href={profile.instagram_url} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-red-500 transition-colors">[IG]</a>}
              </div>
          </div>
          {profile.bio && (
            <p className="text-gray-600 dark:text-gray-400 mt-4 max-w-3xl">{profile.bio}</p>
          )}
        </div>

        <div className="px-8 mt-8">
          {/* Layout 2 colonnes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Colonne 1 - Spotify Player + Podcasts */}
            <div className="space-y-8">
              {/* Lecteur musical Spotify - visible seulement si contenu ou si propre profil */}
              {musicLinks && musicLinks.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                    <IconImg name="spotify" className="w-6 h-6" />
                    Spotify
                  </h2>
                  <div className="space-y-4">
                    {musicLinks.map(link => (
                      <div key={link.id} className="rounded-lg overflow-hidden">
                        {link.embed_html ? (
                          <div dangerouslySetInnerHTML={{ __html: link.embed_html }} />
                        ) : (
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-accent hover:text-accent-hover flex items-center gap-2"
                          >
                            <span className="text-2xl">
                              {link.platform === 'spotify' && '🎵'}
                              {link.platform === 'bandcamp' && '🎸'}
                              {link.platform === 'apple_music' && '🍎'}
                              {link.platform === 'soundcloud' && '☁️'}
                              {link.platform === 'youtube' && '▶️'}
                            </span>
                            <span>{t.publicProfile?.openOn || 'Ouvrir sur'} {link.platform}</span>
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Bouton ajouter Spotify - seulement pour proprio si pas de liens */}
              {isOwnProfile && (!musicLinks || musicLinks.length === 0) && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                    <IconImg name="spotify" className="w-6 h-6" />
                    Spotify
                  </h2>
                  <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {lang === 'fr' ? 'Ajoutez votre lien Spotify pour afficher votre musique' : lang === 'es' ? 'Añade tu enlace de Spotify para mostrar tu música' : 'Add your Spotify link to display your music'}
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={spotifyLink}
                        onChange={(e) => setSpotifyLink(e.target.value)}
                        placeholder="https://open.spotify.com/artist/..."
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                        disabled={savingSpotify}
                      />
                      <button
                        onClick={handleSaveSpotifyLink}
                        disabled={!spotifyLink.trim() || savingSpotify}
                        className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors disabled:cursor-not-allowed"
                      >
                        {savingSpotify ? (lang === 'fr' ? 'Enregistrement...' : lang === 'es' ? 'Guardando...' : 'Saving...') : (lang === 'fr' ? 'Ajouter' : lang === 'es' ? 'Añadir' : 'Add')}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Section Podcasts - visible seulement si contenu ou si propre profil */}
              {(podcasts.length > 0 || isOwnProfile) && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                  <IconImg name="mic" className="w-6 h-6" />
                  {t.publicProfile?.podcasts || 'Podcasts'}
                </h2>
                {loadingPodcasts ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
                  </div>
                ) : podcasts.length === 0 && isOwnProfile ? (
                  <div className="text-center py-12 text-text-secondary">
                    <Link
                      href="/dashboard/podcasts/edit"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-colors shadow-lg hover:shadow-xl"
                    >
                      <img
                        src="/icons/dark/mic.svg"
                        alt=""
                        className="w-5 h-5 invert"
                      />
                      {lang === 'fr' ? 'Ajouter un podcast' : lang === 'es' ? 'Añadir un podcast' : 'Add a podcast'}
                    </Link>
                  </div>
                ) : podcasts.length > 0 ? (
                  <div className="space-y-4">
                    {podcasts.map(podcast => {
                      const podcastLink = podcast.website_url || podcast.rss_url || `/podcast/${podcast.id}`;
                      const isExternalLink = podcastLink.startsWith('http');
                      const LinkWrapper = isExternalLink ? 'a' : Link;
                      const linkProps = isExternalLink
                        ? { href: podcastLink, target: '_blank', rel: 'noopener noreferrer' }
                        : { to: podcastLink };

                      return (
                        <LinkWrapper
                          key={podcast.id}
                          {...linkProps}
                          className="group block bg-gradient-to-br from-gray-900 to-black dark:from-gray-800 dark:to-gray-900 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-700 hover:border-red-500"
                        >
                          <div className="flex gap-4 p-5">
                            {podcast.image_url && (
                              <div className="w-24 h-24 rounded-xl overflow-hidden shadow-md shrink-0">
                                <img
                                  src={podcast.image_url}
                                  alt={podcast.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-red-400 transition-colors leading-tight line-clamp-2">
                                {podcast.title}
                              </h3>
                              {podcast.description && (
                                <p className="text-sm text-gray-400 line-clamp-2 mb-3">
                                  {podcast.description}
                                </p>
                              )}
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/10 text-red-400 rounded-full">
                                  🎙️ Podcast
                                </span>
                                {isExternalLink && (
                                  <span className="inline-flex items-center gap-1 text-gray-400 group-hover:text-red-400 transition-colors">
                                    Écouter
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </LinkWrapper>
                      );
                    })}
                  </div>
                ) : null}
              </div>
              )}
            </div>

            {/* Colonne 2 - Articles - visible seulement si contenu ou si propre profil */}
            {(articles.length > 0 || isOwnProfile) && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                <IconImg name="paper" className="w-6 h-6" />
                {t.publicProfile?.blog || 'Blog'}
              </h2>
              {loadingArticles ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
                </div>
              ) : articles.length === 0 && isOwnProfile ? (
                <div className="text-center py-12 text-text-secondary">
                  <Link
                    href="/dashboard/articles/edit"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors shadow-lg hover:shadow-xl"
                  >
                    <img
                      src="/icons/dark/paper.svg"
                      alt=""
                      className="w-5 h-5 invert"
                    />
                    {lang === 'fr' ? 'Écrire un article' : lang === 'es' ? 'Escribir un artículo' : 'Write an article'}
                  </Link>
                </div>
              ) : articles.length > 0 ? (
                <div className="space-y-6">
                  {articles.map(article => (
                    <Link
                      key={article.id}
                      href={`/article/${article.slug}`}
                      className="group block bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-200 dark:border-gray-800 hover:border-red-500"
                    >
                      {article.featured_image && (
                        <div className="aspect-video w-full overflow-hidden">
                          <img
                            src={article.featured_image}
                            alt={article.title}
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                          />
                        </div>
                      )}
                      <div className="p-5">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2 group-hover:text-red-500 transition-colors leading-tight line-clamp-2">
                          {article.title}
                        </h3>
                        {article.excerpt && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                            {article.excerpt}
                          </p>
                        )}
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
                          <span>
                            {new Date(article.published_at || article.created_at).toLocaleDateString(lang === 'fr' ? 'fr-CA' : 'en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                          <span className="flex items-center gap-1 text-red-500 group-hover:gap-2 transition-all">
                            Lire
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
            )}
          </div>

          {/* Section Vidéos - Full width */}
          {videos.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                <IconImg name="video" className="w-6 h-6" />
                {t.publicProfile?.videos || 'Vidéos'}
              </h2>
              {loadingVideos ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {videos.map(video => {
                    const videoSlug = video.title
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, '-')
                      .replace(/^-+|-+$/g, '');
                    return (
                      <Link
                        key={video.id}
                        href={`/videos/${videoSlug}`}
                        className="group bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-200 dark:border-gray-800 hover:border-red-500"
                      >
                        <div className="aspect-video w-full relative">
                          <img
                            src={video.thumbnail_url || `https://img.youtube.com/vi/${video.youtube_id}/maxresdefault.jpg`}
                            alt={video.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              if (e.target.src.includes('maxresdefault')) {
                                e.target.src = `https://img.youtube.com/vi/${video.youtube_id}/hqdefault.jpg`;
                              } else if (!e.target.src.includes('video-thumbnail-default')) {
                                e.target.src = '/images/video-thumbnail-default.svg';
                              }
                            }}
                          />
                          {/* Play button overlay */}
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-all">
                            <div className="w-16 h-16 flex items-center justify-center rounded-full bg-red-600 group-hover:bg-red-700 group-hover:scale-110 transition-all shadow-2xl">
                              <svg className="w-6 h-6 ml-1 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z"/>
                              </svg>
                            </div>
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="font-bold text-lg text-gray-900 dark:text-white line-clamp-2 group-hover:text-red-500 transition-colors">
                            {video.title}
                          </h3>
                          {video.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                              {video.description}
                            </p>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          </div>
      </div>

      {/* Message Modal */}
      <MessageModal
        isOpen={showMessageModal}
        onClose={() => setShowMessageModal(false)}
        recipient={{
          id: userId,
          username: profile.username,
          avatar_url: profile.avatar_url,
        }}
      />

      {/* Followers/Following Modal */}
      <FollowersModal
        isOpen={showFollowersModal}
        onClose={() => setShowFollowersModal(false)}
        userId={userId}
        type={followersModalType}
      />
    </>
  );
}