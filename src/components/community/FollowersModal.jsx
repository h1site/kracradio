'use client';
// src/components/community/FollowersModal.jsx
// Modal pour afficher la liste des followers ou following
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { useI18n } from '../../i18n';
import { useAuth } from '../../context/AuthContext';
import FollowButton from './FollowButton';

const STRINGS = {
  fr: {
    followers: 'Abonnés',
    following: 'Abonnements',
    noFollowers: 'Aucun abonné',
    noFollowing: 'Aucun abonnement',
    followsYou: 'Vous suit',
    close: 'Fermer',
  },
  en: {
    followers: 'Followers',
    following: 'Following',
    noFollowers: 'No followers',
    noFollowing: 'Not following anyone',
    followsYou: 'Follows you',
    close: 'Close',
  },
  es: {
    followers: 'Seguidores',
    following: 'Siguiendo',
    noFollowers: 'Sin seguidores',
    noFollowing: 'No sigue a nadie',
    followsYou: 'Te sigue',
    close: 'Cerrar',
  },
};

export default function FollowersModal({ isOpen, onClose, userId, type = 'followers' }) {
  const { lang } = useI18n();
  const { user } = useAuth();
  const L = STRINGS[lang] || STRINGS.fr;

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myFollowers, setMyFollowers] = useState(new Set()); // IDs des gens qui me suivent

  useEffect(() => {
    if (!isOpen || !userId) return;

    const loadData = async () => {
      setLoading(true);
      try {
        if (type === 'followers') {
          // Charger les gens qui suivent cet utilisateur
          const { data, error } = await supabase
            .from('follows')
            .select(`
              follower_id,
              created_at,
              profiles:profiles!follows_follower_id_fkey (
                id,
                username,
                avatar_url,
                artist_slug,
                is_verified
              )
            `)
            .eq('following_id', userId)
            .order('created_at', { ascending: false });

          if (error) throw error;
          setUsers(data?.map(f => ({ ...f.profiles, followedAt: f.created_at })) || []);
        } else {
          // Charger les gens que cet utilisateur suit
          const { data, error } = await supabase
            .from('follows')
            .select(`
              following_id,
              created_at,
              profiles:profiles!follows_following_id_fkey (
                id,
                username,
                avatar_url,
                artist_slug,
                is_verified
              )
            `)
            .eq('follower_id', userId)
            .order('created_at', { ascending: false });

          if (error) throw error;
          setUsers(data?.map(f => ({ ...f.profiles, followedAt: f.created_at })) || []);
        }

        // Charger qui me suit (pour afficher "Follows you")
        if (user) {
          const { data: myFollowersData } = await supabase
            .from('follows')
            .select('follower_id')
            .eq('following_id', user.id);

          setMyFollowers(new Set(myFollowersData?.map(f => f.follower_id) || []));
        }
      } catch (error) {
        console.error('Error loading followers/following:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isOpen, userId, type, user]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md max-h-[80vh] bg-black rounded-2xl border border-gray-800 overflow-hidden flex flex-col mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-800">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-full transition-colors"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h2 className="text-lg font-bold text-white">
            {type === 'followers' ? L.followers : L.following}
          </h2>
          <div className="w-9" /> {/* Spacer for centering */}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-600 border-t-white"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              {type === 'followers' ? L.noFollowers : L.noFollowing}
            </div>
          ) : (
            <div className="divide-y divide-gray-800/50">
              {users.map(u => (
                <div
                  key={u.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-900/50 transition-colors"
                >
                  {/* Avatar - cliquable vers profil */}
                  <Link
                    href={`/profile/${u.artist_slug || u.id}`}
                    onClick={onClose}
                    className="flex-shrink-0"
                  >
                    {u.avatar_url ? (
                      <img
                        src={u.avatar_url}
                        alt={u.username}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center">
                        <span className="text-xl">👤</span>
                      </div>
                    )}
                  </Link>

                  {/* Info - cliquable vers profil */}
                  <Link
                    href={`/profile/${u.artist_slug || u.id}`}
                    onClick={onClose}
                    className="flex-1 min-w-0"
                  >
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-white truncate hover:underline">
                        {u.username || 'Utilisateur'}
                      </span>
                      {u.is_verified && (
                        <span className="text-blue-400 text-sm">✓</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 text-sm truncate">
                        @{u.artist_slug || 'user'}
                      </span>
                      {/* Badge "Follows you" */}
                      {user && myFollowers.has(u.id) && u.id !== user.id && (
                        <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded">
                          {L.followsYou}
                        </span>
                      )}
                    </div>
                  </Link>

                  {/* Follow button */}
                  <div className="flex-shrink-0">
                    <FollowButton userId={u.id} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
