// src/pages/ProfileRedirect.jsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../hooks/useCommunity';

export default function ProfileRedirect() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, loading } = useProfile(user?.id);

  useEffect(() => {
    if (loading) return;

    // Si l'utilisateur a un profil artiste avec slug → aller au profil public
    if (profile?.artist_slug) {
      navigate(`/profile/${profile.artist_slug}`, { replace: true });
    } else {
      // Sinon → aller à /community pour créer le profil
      navigate('/community', { replace: true });
    }
  }, [profile, loading, navigate]);

  // Afficher un loader pendant le chargement
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-black dark:border-t-white rounded-full"></div>
    </div>
  );
}
