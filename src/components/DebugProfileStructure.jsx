// Composant temporaire de debug pour vérifier la structure de la table profiles
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function DebugProfileStructure() {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user?.id) return;

    async function checkProfile() {
      try {
        console.log('🔍 Fetching profile for user:', user.id);

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          console.error('❌ Error fetching profile:', error);
          setError(error.message);
          return;
        }

        console.log('✅ Profile data:', data);
        setProfileData(data);

        // Vérifier si artist_slug existe
        if (data && !('artist_slug' in data)) {
          console.warn('⚠️ COLONNE artist_slug MANQUANTE!');
          console.log('📋 Colonnes disponibles:', Object.keys(data));
        }
      } catch (err) {
        console.error('❌ Exception:', err);
        setError(err.message);
      }
    }

    checkProfile();
  }, [user?.id]);

  if (!user) return null;

  return (
    <div className="fixed bottom-20 left-4 p-4 bg-yellow-500/20 border border-yellow-500 rounded-lg text-xs max-w-md">
      <div className="font-bold mb-2">🔍 Debug Profile Structure</div>

      {error && (
        <div className="text-red-400 mb-2">
          ❌ Error: {error}
        </div>
      )}

      {profileData ? (
        <div className="space-y-1">
          <div className="text-green-400">✅ Profile trouvé</div>
          <div className="font-mono text-[10px] bg-black/30 p-2 rounded max-h-40 overflow-auto">
            {Object.keys(profileData).map(key => (
              <div key={key}>
                <span className={key === 'artist_slug' ? 'text-yellow-300 font-bold' : ''}>
                  {key}:
                </span>{' '}
                <span className="text-gray-400">
                  {JSON.stringify(profileData[key])}
                </span>
              </div>
            ))}
          </div>

          {!('artist_slug' in profileData) && (
            <div className="text-red-400 font-bold mt-2">
              ⚠️ COLONNE artist_slug MANQUANTE!
              <div className="text-xs mt-1">
                Execute: supabase/add_artist_slug.sql
              </div>
            </div>
          )}

          {('artist_slug' in profileData) && (
            <div className="text-green-400 mt-2">
              ✅ Colonne artist_slug existe: "{profileData.artist_slug || '(vide)'}"
            </div>
          )}
        </div>
      ) : (
        <div className="text-yellow-400">⏳ Chargement...</div>
      )}
    </div>
  );
}
