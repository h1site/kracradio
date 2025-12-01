// src/components/community/FollowButton.jsx
// Système de follow simplifié: pas de demande, follow direct
// "Follow back" si la personne te suit déjà
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../i18n';
import { useFollowStatus, useManageFollow } from '../../hooks/useCommunity';
import { supabase } from '../../lib/supabase';

export default function FollowButton({ userId, onFollowChange }) {
  const { user } = useAuth();
  const { status, loading: loadingStatus } = useFollowStatus(userId);
  const { follow, unfollow, loading: managing } = useManageFollow();
  const [localStatus, setLocalStatus] = useState(null);
  const { t, lang } = useI18n();

  const L = {
    fr: {
      follow: 'Suivre',
      followBack: 'Follow back',
      following: 'Abonné',
      unfollow: 'Se désabonner',
      loading: 'Chargement...'
    },
    en: {
      follow: 'Follow',
      followBack: 'Follow back',
      following: 'Following',
      unfollow: 'Unfollow',
      loading: 'Loading...'
    },
    es: {
      follow: 'Seguir',
      followBack: 'Seguir de vuelta',
      following: 'Siguiendo',
      unfollow: 'Dejar de seguir',
      loading: 'Cargando...'
    }
  }[lang] || {
    follow: 'Suivre',
    followBack: 'Follow back',
    following: 'Abonné',
    unfollow: 'Se désabonner',
    loading: 'Chargement...'
  };

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
      const isFollowing = localStatus === 'following' || localStatus === 'connected';

      if (isFollowing) {
        // Unfollow
        await unfollow(userId);
        setLocalStatus(localStatus === 'connected' ? 'follower' : null);
      } else {
        // Follow - et créer notification pour l'autre utilisateur
        await follow(userId);

        // Créer une notification de follow
        try {
          await supabase.from('notifications').insert({
            user_id: userId,
            actor_id: user.id,
            type: 'follow',
            content: 'a commencé à vous suivre'
          });
        } catch (notifError) {
          console.warn('Could not create follow notification:', notifError);
        }

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

  // Configuration simplifiée des états
  const isFollowing = localStatus === 'following' || localStatus === 'connected';
  const isFollower = localStatus === 'follower'; // Cette personne me suit

  const getConfig = () => {
    if (isFollowing) {
      // Je le suis déjà
      return {
        label: L.following,
        icon: '✓',
        className: 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30',
        hoverLabel: L.unfollow
      };
    } else if (isFollower) {
      // Il me suit, je peux follow back
      return {
        label: L.followBack,
        icon: '🔄',
        className: 'bg-blue-500 text-white hover:bg-blue-600',
        hoverLabel: null
      };
    } else {
      // Pas de relation
      return {
        label: L.follow,
        icon: '➕',
        className: 'bg-red-600 text-white hover:bg-red-700',
        hoverLabel: null
      };
    }
  };

  const config = getConfig();
  const [isHovered, setIsHovered] = useState(false);

  if (loadingStatus) {
    return (
      <button
        disabled
        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg text-gray-500"
      >
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
          {L.loading}
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={managing}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        px-4 py-2 font-semibold rounded-lg transition-all
        disabled:opacity-50 disabled:cursor-not-allowed
        ${config.className}
      `}
    >
      <div className="flex items-center gap-2">
        <span>{config.icon}</span>
        <span>{managing ? L.loading : (isHovered && config.hoverLabel ? config.hoverLabel : config.label)}</span>
      </div>
    </button>
  );
}

// Version compacte (pour listes)
export function FollowButtonCompact({ userId, showLabel = false }) {
  const { user } = useAuth();
  const { status } = useFollowStatus(userId);
  const { follow, unfollow, loading } = useManageFollow();
  const { lang } = useI18n();

  const L = {
    fr: { follow: 'Suivre', followBack: 'Follow back', following: 'Abonné' },
    en: { follow: 'Follow', followBack: 'Follow back', following: 'Following' },
    es: { follow: 'Seguir', followBack: 'Seguir', following: 'Siguiendo' }
  }[lang] || { follow: 'Suivre', followBack: 'Follow back', following: 'Abonné' };

  if (!user || user.id === userId) return null;

  const isFollowing = status === 'following' || status === 'connected';
  const isFollower = status === 'follower';

  const handleClick = async (e) => {
    e.stopPropagation();
    try {
      if (isFollowing) {
        await unfollow(userId);
      } else {
        await follow(userId);
        // Notification de follow
        try {
          await supabase.from('notifications').insert({
            user_id: userId,
            actor_id: user.id,
            type: 'follow',
            content: 'a commencé à vous suivre'
          });
        } catch (e) {}
      }
    } catch (error) {
      console.error('Follow error:', error);
    }
  };

  const getDisplay = () => {
    if (isFollowing) return { icon: '✓', label: L.following, color: 'bg-green-500/20 text-green-400' };
    if (isFollower) return { icon: '🔄', label: L.followBack, color: 'bg-blue-500 text-white' };
    return { icon: '➕', label: L.follow, color: 'bg-red-600 text-white' };
  };

  const display = getDisplay();

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`px-3 py-1 rounded-full text-sm font-semibold transition-all disabled:opacity-50 ${display.color}`}
    >
      {loading ? '...' : (
        <span className="flex items-center gap-1">
          <span>{display.icon}</span>
          {showLabel && <span>{display.label}</span>}
        </span>
      )}
    </button>
  );
}
