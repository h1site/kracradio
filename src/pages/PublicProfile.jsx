// src/pages/PublicProfile.jsx
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useResolveUsername, useProfile, useMusicLinks, useFollowStats } from '../hooks/useCommunity';
import Seo from '../seo/Seo';
import { useI18n } from '../i18n';
import FollowButton from '../components/community/FollowButton';

export default function PublicProfile() {
  const { t } = useI18n();
  const { username } = useParams();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('posts');

  // Résoudre le username (slug ou UUID) vers un user_id
  const { userId, loading: resolvingUser, error: resolveError } = useResolveUsername(username);

  const { profile, loading: loadingProfile } = useProfile(userId);
  const { musicLinks, loading: loadingLinks } = useMusicLinks(userId);
  const { stats, loading: loadingStats } = useFollowStats(userId);

  // Vérifier si c'est le propre profil de l'utilisateur
  const isOwnProfile = user && user.id === userId;

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
          <h1 className="text-4xl font-bold text-text-primary mb-4">❌ Erreur</h1>
          <p className="text-text-secondary mb-2">Erreur lors de la résolution du profil</p>
          <p className="text-red-400 text-sm font-mono">{resolveError}</p>
          <p className="text-text-secondary text-sm mt-4">
            Slug recherché: <span className="font-mono text-accent">{username}</span>
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
          <p className="text-text-secondary mb-2">Profil introuvable</p>
          <p className="text-text-secondary text-sm">
            Aucun profil avec le slug: <span className="font-mono text-accent">{username}</span>
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
          <p className="text-text-secondary">Profil introuvable</p>
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
          <h1 className="text-2xl font-bold text-text-primary mb-2">Profil privé</h1>
          <p className="text-text-secondary">
            Ce profil n'est visible que par les connexions de l'artiste
          </p>
        </div>
      </div>
    );
  }

  const TABS = [
    { id: 'posts', label: 'Posts', icon: '📝' },
    { id: 'blogs', label: 'Blogs', icon: '📄' },
    { id: 'podcasts', label: 'Podcasts', icon: '🎙️' },
    { id: 'connections', label: 'Connexions', icon: '👥' }
  ];

  return (
    <>
      <Seo
        title={`${profile.username || 'Profil'} - KracRadio`}
        description={profile.bio || 'Profil artiste sur KracRadio'}
      />

      <div className="min-h-screen bg-bg-primary">
        {/* Bannière */}
        <div
          className="h-48 bg-gradient-to-r from-accent/20 to-accent/5 bg-cover bg-center relative"
          style={{
            backgroundImage: profile.banner_url ? `url(${profile.banner_url})` : undefined
          }}
        />

        <div className="px-4 relative" style={{ paddingLeft: '20px' }}>
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
                    <div><strong className="text-text-primary">{stats.followers || 0}</strong> Followers</div>
                    <div><strong className="text-text-primary">{stats.following || 0}</strong> Following</div>
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
                      <span className="text-accent text-xl" title="Artiste vérifié">✓</span>
                    )}
                  </h1>
                  <p className="text-text-secondary text-sm">@{profile.artist_slug || 'artiste'}</p>
                </div>

                {/* Actions alignées à droite */}
                {isOwnProfile ? (
                  <Link
                    to="/profile"
                    className="px-4 py-2 bg-bg-secondary hover:bg-bg-tertiary border border-border rounded-lg text-text-primary font-medium transition-colors flex items-center gap-2"
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                      <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
                    </svg>
                    Settings
                  </Link>
                ) : (
                  <div className="flex gap-3">
                    <FollowButton userId={userId} />
                    <button className="px-4 py-2 bg-bg-secondary border border-border rounded-lg hover:bg-bg-tertiary transition-colors">
                      💬 Message
                    </button>
                  </div>
                )}
              </div>

              {profile.bio && (
                <p className="text-text-primary mt-2 mb-3">{profile.bio}</p>
              )}

              {/* Métadonnées */}
              <div className="flex flex-wrap items-center gap-3 text-sm text-text-secondary">
                {profile.location && (
                  <span className="flex items-center gap-1">
                    📍 {profile.location}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  🎵 Entertainment & Recreation
                </span>
                <span className="flex items-center gap-1">
                  🗓️ Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
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

          {/* Lecteurs musicaux */}
          {musicLinks && musicLinks.length > 0 && (
            <div className="mb-8 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <span>Ouvrir sur {link.platform}</span>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Onglets */}
          <div className="border-b border-border mb-6">
            <div className="flex gap-2 overflow-x-auto">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    px-6 py-3 font-semibold whitespace-nowrap transition-colors
                    ${activeTab === tab.id
                      ? 'text-accent border-b-2 border-accent'
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
          <div className="pb-12">
            {activeTab === 'posts' && (
              <div className="text-center py-12 text-text-secondary">
                <div className="text-6xl mb-4">📝</div>
                <p>Les posts de {profile.username} apparaîtront ici</p>
                <p className="text-sm mt-2">(À implémenter - Phase 3)</p>
              </div>
            )}

            {activeTab === 'blogs' && (
              <div className="text-center py-12 text-text-secondary">
                <div className="text-6xl mb-4">📄</div>
                <p>Les articles de blog de {profile.username}</p>
                <p className="text-sm mt-2">(À connecter avec articles existants)</p>
              </div>
            )}

            {activeTab === 'podcasts' && (
              <div className="text-center py-12 text-text-secondary">
                <div className="text-6xl mb-4">🎙️</div>
                <p>Les podcasts de {profile.username}</p>
                <p className="text-sm mt-2">(À connecter avec podcasts existants)</p>
              </div>
            )}

            {activeTab === 'connections' && (
              <div className="text-center py-12 text-text-secondary">
                <div className="text-6xl mb-4">👥</div>
                <p>{stats.connections || 0} connexions</p>
                <p className="text-sm mt-2">(Liste des connexions - À implémenter)</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
