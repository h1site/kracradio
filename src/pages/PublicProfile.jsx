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

  return (
    <>
      <Seo
        title={`${profile.username || 'Profil'} - KracRadio`}
        description={profile.bio || 'Profil artiste sur KracRadio'}
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
                      <div><strong className="font-bold">{stats.followers || 0}</strong> {t.publicProfile?.followers || 'Abonnés'}</div>
                      <div><strong className="font-bold">{stats.following || 0}</strong> {t.publicProfile?.following || 'Abonnements'}</div>
                    </div>
                  )}
                  {isOwnProfile ? (
                  <div className="flex flex-wrap gap-2">
                    <Link
                      to="/settings"
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm"
                    >
                      {t.publicProfile?.settings || 'Paramètres'}
                    </Link>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <FollowButton userId={userId} />
                    <button className="px-4 py-2 bg-gray-200 dark:bg-gray-800 rounded-lg text-gray-800 dark:text-gray-200">
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
          {/* Layout 2 colonnes: Lecteur musical + Onglets */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Colonne 1 - Lecteur musical */}
            <div>
              {musicLinks && musicLinks.length > 0 && (
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
              )}
            </div>

            {/* Colonne 2 - Onglets Blog/Podcasts/Connexions */}
            <div>
              <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex gap-2 -mb-px">
                  {TABS.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-6 py-3 font-semibold whitespace-nowrap transition-colors border-b-2 ${
                        activeTab === tab.id
                          ? 'border-red-500 text-red-500'
                          : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                      }`}
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
                            className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:border-red-500 transition-colors"
                          >
                            <Link to={`/article/${article.slug}`}>
                              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1 hover:text-red-500 transition-colors">{article.title}</h3>
                            </Link>
                            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">{article.content?.substring(0, 150)}...</p>
                            <div className="text-xs text-gray-400">
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
                          const podcastLink = podcast.website_url || podcast.rss_url || `/podcast/${podcast.id}`;
                          const isExternalLink = podcastLink.startsWith('http');

                          return (
                            <div
                              key={podcast.id}
                              className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:border-red-500 transition-colors flex gap-4"
                            >
                              {podcast.image_url && (
                                isExternalLink ? (
                                  <a href={podcastLink} target="_blank" rel="noopener noreferrer">
                                    <img
                                      src={podcast.image_url}
                                      alt={podcast.title}
                                      className="w-20 h-20 rounded-lg object-cover"
                                    />
                                  </a>
                                ) : (
                                  <Link to={podcastLink}>
                                    <img
                                      src={podcast.image_url}
                                      alt={podcast.title}
                                      className="w-20 h-20 rounded-lg object-cover"
                                    />
                                  </Link>
                                )
                              )}
                              <div className="flex-1">
                                {isExternalLink ? (
                                  <a href={podcastLink} target="_blank" rel="noopener noreferrer">
                                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1 hover:text-red-500 transition-colors">{podcast.title}</h3>
                                  </a>
                                ) : (
                                  <Link to={podcastLink}>
                                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1 hover:text-red-500 transition-colors">{podcast.title}</h3>
                                  </Link>
                                )}
                                {podcast.description && (
                                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{podcast.description}</p>
                                )}
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
                            className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:border-red-500 transition-colors"
                          >
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                              {follow.profiles?.avatar_url ? (
                                <img
                                  src={follow.profiles.avatar_url}
                                  alt={follow.profiles.username}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                  <span className="text-2xl">👤</span>
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-800 dark:text-white">{follow.profiles?.username || t.publicProfile?.author || 'Utilisateur'}</h3>
                              <p className="text-sm text-gray-500">@{follow.profiles?.artist_slug || 'artiste'}</p>
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