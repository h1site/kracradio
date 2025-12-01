'use client';
// src/pages/CommunityDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { useRouter } from 'next/navigation';
import { useI18n } from '../i18n';
import Seo from '../seo/Seo';
import CommunitySettings from '../components/community/CommunitySettings';
import ProfileEditor from '../components/community/ProfileEditor';
import MusicLinksManager from '../components/community/MusicLinksManager';
import CommunityTutorial from '../components/CommunityTutorial';
import { useProfile } from '../hooks/useCommunity';

export default function CommunityDashboard() {
  const { t } = useI18n();
  const { user, loading: authLoading } = useAuth();
  const { sidebarOpen, isDesktop, sidebarWidth } = useUI();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('settings');
  const [showTutorial, setShowTutorial] = useState(false);
  const { profile } = useProfile(user?.id);

  // Rediriger si non authentifié (après que l'auth soit prêt)
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Vérifier si c'est la première visite de la page Communauté
  useEffect(() => {
    const tutorialSeen = localStorage.getItem('kracradio_community_tutorial_seen');
    if (!tutorialSeen && user) {
      const timer = setTimeout(() => {
        setShowTutorial(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const TABS = [
    {
      id: 'settings',
      label: t?.community?.tabs?.settings || 'Settings',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
          <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
        </svg>
      )
    },
    {
      id: 'profile',
      label: t?.community?.tabs?.customization || 'Profile',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
        </svg>
      )
    },
    {
      id: 'music',
      label: t?.community?.tabs?.musicLinks || 'Music',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
        </svg>
      )
    }
  ];

  // Lien vers le profil public
  const profileLink = profile?.artist_slug ? `/profile/${profile.artist_slug}` : '/profile';

  // Afficher un loader pendant le chargement de l'auth
  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-red-500/20 rounded-full"></div>
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-red-500 rounded-full animate-spin"></div>
          </div>
          <span className="text-gray-400 text-sm tracking-wider uppercase">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {showTutorial && <CommunityTutorial onClose={() => setShowTutorial(false)} />}

      <Seo
        title={`${t.community.title} - KracRadio`}
        description={t.community.description}
      />

      {/* Fullscreen container */}
      <div className="min-h-screen bg-black">
        {/* Hero Header - Magazine Style - True Fullscreen */}
        <header
          className="relative overflow-hidden"
          style={{
            marginLeft: isDesktop && sidebarOpen ? -sidebarWidth : 0,
            width: isDesktop && sidebarOpen ? `calc(100% + ${sidebarWidth}px)` : '100%',
            transition: 'margin-left 300ms ease, width 300ms ease'
          }}
        >
          {/* Background image with gradient overlay */}
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1920&h=800&fit=crop&auto=format&q=80"
              alt=""
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/90 to-black/70"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
            {/* Geometric accent */}
            <div className="absolute top-20 right-20 w-64 h-64 bg-red-500/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl"></div>
          </div>

          <div
            className="relative"
            style={{
              marginLeft: isDesktop && sidebarOpen ? sidebarWidth : 0,
              paddingLeft: isDesktop && sidebarOpen ? 0 : 0,
              transition: 'margin-left 300ms ease'
            }}
          >
            <div className="px-6 md:px-12 lg:px-16 py-12 md:py-16">
              {/* Top bar with actions */}
              <div className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-red-500/20 border border-red-500/30 rounded-full text-red-400 text-xs font-bold uppercase tracking-widest">
                    Artist Hub
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => router.push(profileLink)}
                    className="group relative px-6 py-3 bg-white text-black font-bold rounded-full transition-all duration-300 hover:bg-red-500 hover:text-white flex items-center gap-2 overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                      {t.community.viewProfile}
                    </span>
                  </button>
                </div>
              </div>

              {/* Main heading */}
              <div className="max-w-4xl">
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white leading-none tracking-tight mb-6">
                  <span className="block">{t.community.title.split(' ')[0] || 'Your'}</span>
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-red-500 to-orange-500">
                    {t.community.title.split(' ').slice(1).join(' ') || 'Settings'}
                  </span>
                </h1>
                <p className="text-xl md:text-2xl text-gray-400 font-light max-w-2xl leading-relaxed">
                  {t.community.description}
                </p>
              </div>

              {/* Tab Navigation - Modern Pills */}
              <div className="mt-12">
                <div className="flex flex-wrap gap-3">
                  {TABS.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        group relative px-6 py-4 rounded-2xl font-semibold transition-all duration-300 flex items-center gap-3
                        ${activeTab === tab.id
                          ? 'bg-white text-black shadow-lg shadow-white/10'
                          : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10'
                        }
                      `}
                    >
                      <span className={`transition-colors ${activeTab === tab.id ? 'text-red-500' : 'text-gray-500 group-hover:text-gray-300'}`}>
                        {tab.icon}
                      </span>
                      {tab.label}
                      {activeTab === tab.id && (
                        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-red-500 rounded-full"></span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area - True Fullscreen */}
        <main
          className="relative"
          style={{
            marginLeft: isDesktop && sidebarOpen ? -sidebarWidth : 0,
            width: isDesktop && sidebarOpen ? `calc(100% + ${sidebarWidth}px)` : '100%',
            transition: 'margin-left 300ms ease, width 300ms ease'
          }}
        >
          {/* Subtle divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-gray-800 to-transparent"></div>

          <div
            className="px-6 md:px-12 lg:px-16 py-12"
            style={{
              marginLeft: isDesktop && sidebarOpen ? sidebarWidth : 0,
              transition: 'margin-left 300ms ease'
            }}
          >
            {/* Tab content with card styling */}
            <div className="relative">
              {/* Background accent for content */}
              <div className="absolute -top-20 right-0 w-72 h-72 bg-red-500/5 rounded-full blur-3xl pointer-events-none"></div>

              <div className="relative z-10">
                {activeTab === 'settings' && <CommunitySettings />}
                {activeTab === 'profile' && <ProfileEditor />}
                {activeTab === 'music' && <MusicLinksManager />}
              </div>
            </div>

            {/* Tutorial button - Minimalist */}
            <div className="mt-16 pt-8 border-t border-gray-800/50">
              <button
                onClick={() => setShowTutorial(true)}
                className="group flex items-center gap-3 text-gray-500 hover:text-white transition-colors duration-300"
              >
                <span className="w-10 h-10 rounded-full bg-gray-800/50 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                    <path d="M12 17h.01"/>
                  </svg>
                </span>
                <span className="text-sm font-medium tracking-wide">
                  Revoir le guide de la communauté
                </span>
              </button>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
