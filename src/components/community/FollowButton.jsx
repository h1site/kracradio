// src/components/community/FollowButton.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../i18n';
import { useFollowStatus, useManageFollow } from '../../hooks/useCommunity';

export default function FollowButton({ userId, onFollowChange }) {
  const { user } = useAuth();
  const { status, loading: loadingStatus } = useFollowStatus(userId);
  const { follow, unfollow, loading: managing } = useManageFollow();
  const [localStatus, setLocalStatus] = useState(null);
  const { t } = useI18n();
  const community = t?.community ?? {};
  const followText = community.follow ?? {};
  const states = followText.states ?? {};
  const compact = followText.compact ?? {};
  const defaultState = states.default ?? {};
  const followingState = states.following ?? {};
  const followerState = states.follower ?? {};
  const connectedState = states.connected ?? {};
  const loadingLabel = followText.loading ?? 'Chargement...';

  useEffect(() => {
    if (status !== undefined) {
      setLocalStatus(status);
    }
  }, [status]);

  // Ne pas afficher le bouton pour son propre profil
  if (!user || user.id === userId) {
    return null;
  }

  const handleClick = async () => {
    try {
      if (localStatus === 'following' || localStatus === 'connected') {
        // Unfollow
        await unfollow(userId);
        setLocalStatus(localStatus === 'connected' ? 'follower' : null);
      } else {
        // Follow
        await follow(userId);
        setLocalStatus(localStatus === 'follower' ? 'connected' : 'following');
      }

      // Callback optionnel pour notifier le parent
      if (onFollowChange) {
        onFollowChange();
      }
    } catch (error) {
      console.error('Follow/unfollow error:', error);
    }
  };

  // Configuration des états
  const config = {
    null: {
      label: defaultState.label ?? 'Suivre',
      icon: '➕',
      className: 'bg-accent text-bg-primary hover:bg-accent-hover',
      description: defaultState.description ?? 'Suivre cet artiste'
    },
    following: {
      label: followingState.label ?? 'En attente',
      icon: '⏳',
      className: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/30',
      description: followingState.description ?? 'Vous suivez cet artiste, en attente de connexion'
    },
    follower: {
      label: followerState.label ?? 'Suivre en retour',
      icon: '🔄',
      className: 'bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30',
      description: followerState.description ?? 'Cet artiste vous suit, suivez-le en retour pour connecter'
    },
    connected: {
      label: connectedState.label ?? 'Connecté(e)',
      icon: '✓',
      className: 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30',
      description: connectedState.description ?? 'Vous êtes connectés mutuellement'
    }
  };

  const currentConfig = config[localStatus] || config.null;

  if (loadingStatus) {
    return (
      <button
        disabled
        className="px-4 py-2 bg-bg-secondary border border-border rounded-lg text-text-secondary"
      >
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-text-secondary"></div>
          {loadingLabel}
        </div>
      </button>
    );
  }

  return (
    <div className="relative group">
      <button
        onClick={handleClick}
        disabled={managing}
        className={`
          px-4 py-2 font-semibold rounded-lg transition-all
          disabled:opacity-50 disabled:cursor-not-allowed
          ${currentConfig.className}
        `}
        title={currentConfig.description}
      >
        <div className="flex items-center gap-2">
          <span>{currentConfig.icon}</span>
          <span>{managing ? loadingLabel : currentConfig.label}</span>
        </div>
      </button>

      {/* Tooltip au hover (optionnel) */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2
                    opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none
                    bg-bg-tertiary border border-border rounded-lg px-3 py-2 text-sm text-text-secondary
                    whitespace-nowrap z-10">
        {currentConfig.description}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2
                      border-4 border-transparent border-t-border"></div>
      </div>
    </div>
  );
}

// Version compacte (pour listes)
export function FollowButtonCompact({ userId, showLabel = false }) {
  const { user } = useAuth();
  const { status } = useFollowStatus(userId);
  const { follow, unfollow, loading } = useManageFollow();
  const { t } = useI18n();
  const followText = t?.community?.follow ?? {};
  const compact = followText.compact ?? {};
  const loadingLabelCompact = compact.loading ?? followText.loading ?? '...';
  const connectedLabel = compact.connected ?? 'Connecté';
  const followLabel = compact.follow ?? 'Suivre';

  if (!user || user.id === userId) return null;

  const handleClick = async (e) => {
    e.stopPropagation(); // Éviter de trigger le clic sur le profil
    try {
      if (status === 'following' || status === 'connected') {
        await unfollow(userId);
      } else {
        await follow(userId);
      }
    } catch (error) {
      console.error('Follow error:', error);
    }
  };

  const icons = {
    null: '➕',
    following: '⏳',
    follower: '🔄',
    connected: '✓'
  };

  const colors = {
    null: 'bg-accent text-bg-primary',
    following: 'bg-yellow-500/20 text-yellow-400',
    follower: 'bg-blue-500/20 text-blue-400',
    connected: 'bg-green-500/20 text-green-400'
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`
        px-3 py-1 rounded-full text-sm font-semibold transition-all
        disabled:opacity-50
        ${colors[status] || colors.null}
      `}
    >
      {loading ? loadingLabelCompact : (
        <span className="flex items-center gap-1">
          <span>{icons[status] || icons.null}</span>
          {showLabel && <span>{status === 'connected' ? connectedLabel : followLabel}</span>}
        </span>
      )}
    </button>
  );
}
