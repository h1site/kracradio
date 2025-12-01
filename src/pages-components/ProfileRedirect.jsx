'use client';
// src/pages/ProfileRedirect.jsx
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../hooks/useCommunity';

export default function ProfileRedirect() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile(user?.id);

  useEffect(() => {
    // Attendre que l'auth soit prêt
    if (authLoading) return;

    // Si pas d'utilisateur, rediriger vers login
    if (!user) {
      router.push('/login', { replace: true });
      return;
    }

    // Attendre que le profile soit chargé
    if (profileLoading) return;

    // Si l'utilisateur a un profil artiste avec slug → aller au profil public
    if (profile?.artist_slug) {
      router.push(`/profile/${profile.artist_slug}`, { replace: true });
    } else {
      // Sinon → aller à /settings pour créer le profil
      router.push('/settings', { replace: true });
    }
  }, [profile, profileLoading, authLoading, user, router]);

  // Afficher un loader pendant le chargement
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-red-500 rounded-full"></div>
    </div>
  );
}
