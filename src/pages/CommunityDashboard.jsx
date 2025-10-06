// src/pages/CommunityDashboard.jsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n';
import Seo from '../seo/Seo';
import CommunitySettings from '../components/community/CommunitySettings';
import ProfileEditor from '../components/community/ProfileEditor';
import MusicLinksManager from '../components/community/MusicLinksManager';
import { useProfile } from '../hooks/useCommunity';

export default function CommunityDashboard() {
  const { t } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('settings');
  const { profile } = useProfile(user?.id);

  const TABS = [
    { id: 'settings', label: t.community.tabs.settings },
    { id: 'profile', label: t.community.tabs.customization },
    { id: 'music', label: t.community.tabs.musicLinks }
  ];

  // Lien vers le profil public
  const profileLink = profile?.artist_slug ? `/profile/${profile.artist_slug}` : '/profile';

  // Rediriger si non authentifié
  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <>
      <Seo
        title={`${t.community.title} - KracRadio`}
        description={t.community.description}
      />

      <div className="min-h-screen bg-bg-primary" style={{ paddingTop: '20px', paddingLeft: '30px', paddingRight: '30px' }}>
        {/* Header avec boutons */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-1">
              {t.community.title}
            </h1>
            <p className="text-text-secondary text-sm">
              {t.community.description}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(profileLink)}
              className="px-4 py-2 bg-accent hover:bg-accent-hover text-bg-primary font-semibold rounded-lg transition-colors flex items-center gap-2"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
              {t.community.viewProfile}
            </button>
            <button
              onClick={() => navigate('/settings')}
              className="px-4 py-2 bg-bg-secondary hover:bg-bg-tertiary border border-border rounded-lg text-text-primary font-medium transition-colors flex items-center gap-2"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
              </svg>
              {t.community.backToSettings}
            </button>
          </div>
        </div>

        {/* Onglets */}
        <div className="mb-6">
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
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

        {/* Contenu des onglets */}
        <div>
          {activeTab === 'settings' && <CommunitySettings />}
          {activeTab === 'profile' && <ProfileEditor />}
          {activeTab === 'music' && <MusicLinksManager />}
        </div>
      </div>
    </>
  );
}
