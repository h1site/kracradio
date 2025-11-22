// src/pages/PublicProfile.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { useResolveUsername, useProfile, useMusicLinks, useFollowStats } from '../hooks/useCommunity';
import { listUserArticles } from '../lib/supabase';
import { supabase } from '../lib/supabase';
import Seo from '../seo/Seo';
import { useI18n } from '../i18n';
import FollowButton from '../components/community/FollowButton';
import PostsFeed from '../components/posts/PostsFeed';

export default function PublicProfile() {
  const { t, lang } = useI18n();
  const { username } = useParams();
  const { user } = useAuth();
  const { sidebarOpen, isDesktop, sidebarWidth } = useUI();
  const [activeTab, setActiveTab] = useState('blogs');
  const [articles, setArticles] = useState([]);
  const [podcasts, setPodcasts] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [loadingPodcasts, setLoadingPodcasts] = useState(false);
  const [loadingFollowers, setLoadingFollowers] = useState(false);

  // Résoudre le username (slug ou UUID) vers un user_id
  const { userId, loading: resolvingUser, error: resolveError } = useResolveUsername(username);

  const { profile, loading: loadingProfile } = useProfile(userId);
  const { musicLinks, loading: loadingLinks } = useMusicLinks(userId);
  const { stats, loading: loadingStats } = useFollowStats(userId);

  // Vérifier si c'est le propre profil de l'utilisateur
  const isOwnProfile = user && user.id === userId;

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

  // Charger les followers
  useEffect(() => {
    if (userId) {
      setLoadingFollowers(true);
      supabase
        .from('follows')
        .select(`
          follower_id,
          profiles!follows_follower_id_fkey (
            id,
            username,
            avatar_url,
            artist_slug
          )
        `)
        .eq('following_id', userId)
        .then(({ data, error }) => {
          if (!error) setFollowers(data || []);
          else console.error('Error loading followers:', error);
        })
        .finally(() => setLoadingFollowers(false));
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

  const TABS = [
    { id: 'blogs', label: t.publicProfile?.blog || 'Blog', icon: '📄' },
    { id: 'podcasts', label: t.publicProfile?.podcasts || 'Podcasts', icon: '🎙️' },
    { id: 'connections', label: t.publicProfile?.connections || 'Connexions', icon: '👥' }
  ];

  const containerStyle = {
    marginLeft: isDesktop && sidebarOpen ? sidebarWidth : 0,
    transition: 'margin-left 300ms ease',
  };

  return (
    <>
      <Seo
        title={`${profile.username || 'Profil'} - KracRadio`}
        description={profile.bio || 'Profil artiste sur KracRadio'}
      />

      <div className="min-h-screen bg-bg-primary" style={containerStyle}>
        {/* Bannière de couverture */}
        <div
          className="h-48 bg-gradient-to-r from-accent/20 to-accent/5 bg-cover bg-center relative -mx-8"
          style={{
            backgroundImage: profile.banner_url ? `url(${profile.banner_url})` : undefined
          }}
        />

        <div className="px-8 relative">
          {/* Header du profil */}
          <div className="flex items-start gap-6 mb-8">
            {/* Avatar - positioned to overlap banner */}
            <div className="relative -mt-16">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-bg-secondary border-4 border-bg-primary shadow-xl">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-text-secondary">
                    <span className="text-6xl">👤</span>
                  </div>
                )}
              </div>
              {profile.is_verified && (
                <div className="absolute -bottom-1 -right-1 bg-accent rounded-full p-2 shadow-lg">
                  <span className="text-xl">✓</span>
                </div>
              )}

              {/* Info sous l'avatar */}
              <div className="mt-4">
                {!loadingStats && (
                  <div className="text-sm text-text-secondary space-y-1">
                    <div><strong className="text-text-primary">{stats.followers || 0}</strong> {t.publicProfile?.followers || 'Abonnés'}</div>
                    <div><strong className="text-text-primary">{stats.following || 0}</strong> {t.publicProfile?.following || 'Abonnements'}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Infos principales */}
            <div className="flex-1 pt-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-text-primary flex items-center gap-2">
                    {profile.username || 'Utilisateur'}
                    {profile.is_verified && (
                      <span className="text-accent text-xl" title={t.publicProfile?.verifiedArtist || 'Artiste vérifié'}>✓</span>
                    )}
                  </h1>
                  <p className="text-text-secondary text-sm">@{profile.artist_slug || 'artiste'}</p>
                </div>

                {/* Actions alignées à droite */}
                {isOwnProfile ? (
                  <div className="flex flex-wrap gap-2">
                    <Link
                      to="/dashboard/articles/edit"
                      className="px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/40 rounded-lg text-blue-600 dark:text-blue-400 font-medium transition-colors flex items-center gap-2 text-sm"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                        <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 14h-3v3h-2v-3H8v-2h3v-3h2v3h3v2zm-3-7V3.5L18.5 9H13z"/>
                      </svg>
                      {t?.profile?.addBlog || 'Ajouter blog'}
                    </Link>
                    <Link
                      to="/dashboard?tab=podcasts&action=new"
                      className="px-3 py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/40 rounded-lg text-purple-600 dark:text-purple-400 font-medium transition-colors flex items-center gap-2 text-sm"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                        <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
                      </svg>
                      {t?.profile?.addPodcast || 'Ajouter podcast'}
                    </Link>
                    <Link
                      to="/settings"
                      className="px-3 py-2 bg-bg-secondary hover:bg-bg-tertiary border border-border rounded-lg text-text-primary font-medium transition-colors flex items-center gap-2 text-sm"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                        <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
                      </svg>
                      {t.publicProfile?.settings || 'Paramètres'}
                    </Link>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <FollowButton userId={userId} />
                    <button className="px-4 py-2 bg-bg-secondary border border-border rounded-lg hover:bg-bg-tertiary transition-colors">
                      💬 {t.publicProfile?.message || 'Message'}
                    </button>
                  </div>
                )}
              </div>

              {profile.bio && (
                <p className="text-text-primary mt-2 mb-3">{profile.bio}</p>
              )}

              {/* Métadonnées */}
              <div className="flex flex-wrap items-center gap-3 text-sm text-text-secondary">
                {/* Pays cliquable */}
                {profile.location && (
                  <Link
                    to={`/artists?country=${encodeURIComponent(profile.location)}`}
                    className="flex items-center gap-1 text-accent hover:text-accent-hover hover:underline transition-colors"
                  >
                    📍 {profile.location}
                  </Link>
                )}
                {/* Genres musicaux cliquables */}
                {profile.genres && profile.genres.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span>🎵</span>
                    {profile.genres.map((genre, index) => (
                      <React.Fragment key={genre}>
                        <Link
                          to={`/artists?genre=${encodeURIComponent(genre)}`}
                          className="text-accent hover:text-accent-hover hover:underline transition-colors"
                        >
                          {genre}
                        </Link>
                        {index < profile.genres.length - 1 && <span className="text-text-secondary">•</span>}
                      </React.Fragment>
                    ))}
                  </div>
                )}
                <span className="flex items-center gap-1">
                  🗓️ {t.publicProfile?.joined || 'Membre depuis'} {new Date(profile.created_at).toLocaleDateString(lang === 'fr' ? 'fr-CA' : 'en-US', { month: 'short', year: 'numeric' })}
                </span>
              </div>

              {profile.website_url && (
                <a
                  href={profile.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:text-accent-hover text-sm mt-2 inline-block"
                >
                  🔗 {profile.website_url}
                </a>
              )}
            </div>
          </div>

          {/* Layout 2 colonnes: Lecteur musical + Onglets */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Colonne 1 - Lecteur musical */}
            <div>
              {musicLinks && musicLinks.length > 0 && (
                <div className="space-y-4">
                  {musicLinks.map(link => (
                    <div key={link.id} className="rounded-lg">
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
              )}
            </div>

            {/* Colonne 2 - Onglets Blog/Podcasts/Connexions */}
            <div>
              <div className="mb-6">
                <div className="flex gap-2 overflow-x-auto">
                  {TABS.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        px-6 py-3 font-semibold whitespace-nowrap transition-colors
                        ${activeTab === tab.id
                          ? 'text-accent'
                          : 'text-text-secondary hover:text-text-primary'
                        }
                      `}
                    >
                      {tab.icon} {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Contenu des onglets */}
              <div>
                {activeTab === 'blogs' && (
                  <div>
                    {loadingArticles ? (
                      <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
                      </div>
                    ) : articles.length === 0 ? (
                      <div className="text-center py-12 text-text-secondary">
                        <div className="text-6xl mb-4">📄</div>
                        <p>{t.publicProfile?.blogContent?.replace('{username}', profile.username) || `Les articles de blog de ${profile.username}`}</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {articles.map(article => (
                          <div
                            key={article.id}
                            className="bg-bg-secondary rounded-xl p-4 border border-border hover:border-accent transition-colors"
                          >
                            <Link to={`/article/${article.slug}`}>
                              <h3 className="text-lg font-semibold text-text-primary mb-1 hover:text-accent transition-colors">{article.title}</h3>
                            </Link>
                            {article.author && article.author.is_public && (
                              <Link
                                to={`/profile/${article.author.artist_slug || article.author.id}`}
                                className="inline-flex items-center gap-1 text-xs text-accent hover:text-accent-hover transition-colors mb-2"
                              >
                                <span>✍️</span>
                                <span>{article.author.username || t.publicProfile?.author || 'Auteur'}</span>
                              </Link>
                            )}
                            <p className="text-sm text-text-secondary line-clamp-2 mb-3">{article.content?.substring(0, 150)}...</p>
                            <div className="text-xs text-text-secondary">
                              {new Date(article.created_at).toLocaleDateString(lang === 'fr' ? 'fr-CA' : 'en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'podcasts' && (
                  <div>
                    {loadingPodcasts ? (
                      <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
                      </div>
                    ) : podcasts.length === 0 ? (
                      <div className="text-center py-12 text-text-secondary">
                        <div className="text-6xl mb-4">🎙️</div>
                        <p>{t.publicProfile?.podcastsContent?.replace('{username}', profile.username) || `Les podcasts de ${profile.username}`}</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {podcasts.map(podcast => {
                          // Utiliser l'URL RSS ou website_url si disponible, sinon fallback sur l'ID
                          const podcastLink = podcast.website_url || podcast.rss_url || `/podcast/${podcast.id}`;
                          const isExternalLink = podcastLink.startsWith('http');

                          return (
                            <div
                              key={podcast.id}
                              className="bg-bg-secondary rounded-xl p-4 border border-border hover:border-accent transition-colors"
                            >
                              <div className="flex gap-4">
                                {podcast.image_url && (
                                  isExternalLink ? (
                                    <a href={podcastLink} target="_blank" rel="noopener noreferrer">
                                      <img
                                        src={podcast.image_url}
                                        alt={podcast.title}
                                        className="w-20 h-20 rounded-lg object-cover cursor-pointer"
                                      />
                                    </a>
                                  ) : (
                                    <Link to={podcastLink}>
                                      <img
                                        src={podcast.image_url}
                                        alt={podcast.title}
                                        className="w-20 h-20 rounded-lg object-cover cursor-pointer"
                                      />
                                    </Link>
                                  )
                                )}
                                <div className="flex-1">
                                  {isExternalLink ? (
                                    <a href={podcastLink} target="_blank" rel="noopener noreferrer">
                                      <h3 className="text-lg font-semibold text-text-primary mb-1 hover:text-accent transition-colors">{podcast.title}</h3>
                                    </a>
                                  ) : (
                                    <Link to={podcastLink}>
                                      <h3 className="text-lg font-semibold text-text-primary mb-1 hover:text-accent transition-colors">{podcast.title}</h3>
                                    </Link>
                                  )}
                                  {podcast.description && (
                                    <p className="text-sm text-text-secondary line-clamp-2 mb-2">{podcast.description}</p>
                                  )}
                                  {podcast.author && podcast.author.is_public && (
                                    <Link
                                      to={`/profile/${podcast.author.artist_slug || podcast.author.id}`}
                                      className="inline-flex items-center gap-1 text-xs text-accent hover:text-accent-hover transition-colors"
                                    >
                                      <span>🎙️</span>
                                      <span>{podcast.author.username || t.publicProfile?.author || 'Auteur'}</span>
                                    </Link>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'connections' && (
                  <div>
                    {loadingFollowers ? (
                      <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
                      </div>
                    ) : followers.length === 0 ? (
                      <div className="text-center py-12 text-text-secondary">
                        <div className="text-6xl mb-4">👥</div>
                        <p>{t.publicProfile?.connectionsContent?.replace('{count}', 0) || `0 connexions`}</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {followers.map(follow => (
                          <Link
                            key={follow.follower_id}
                            to={`/profile/${follow.profiles?.artist_slug || follow.follower_id}`}
                            className="flex items-center gap-3 bg-bg-secondary rounded-xl p-4 border border-border hover:border-accent transition-colors"
                          >
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-bg-tertiary">
                              {follow.profiles?.avatar_url ? (
                                <img
                                  src={follow.profiles.avatar_url}
                                  alt={follow.profiles.username}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-text-secondary">
                                  <span className="text-2xl">👤</span>
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-text-primary">{follow.profiles?.username || t.publicProfile?.author || 'Utilisateur'}</h3>
                              <p className="text-sm text-text-secondary">@{follow.profiles?.artist_slug || 'artiste'}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section posts - Feed communauté */}
          <div className="pb-12">
            <PostsFeed userId={null} showCreatePost={user?.id === userId} />
          </div>
        </div>
      </div>
    </>
  );
}
