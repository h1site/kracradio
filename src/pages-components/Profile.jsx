'use client';
// src/pages/Profile.jsx
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n';
import { useProfile } from '../hooks/useCommunity';
import WelcomeTutorial from '../components/WelcomeTutorial';

export default function Profile() {
  const { t } = useI18n();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { profile } = useProfile(user?.id);

  const [showTutorial, setShowTutorial] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Handle OAuth callback hash fragment
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('access_token')) {
      window.history.replaceState(null, '', window.pathname);
    }
  }, []);

  // Vérifier si c'est la première visite
  useEffect(() => {
    const tutorialSeen = localStorage.getItem('kracradio_tutorial_seen');
    if (!tutorialSeen && user) {
      const timer = setTimeout(() => {
        setShowTutorial(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const onLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await signOut();
    } catch (e) {
      console.error('[Profile] signOut error:', e);
    } finally {
      window.location.href = '/';
    }
  };

  return (
    <>
      {showTutorial && <WelcomeTutorial onClose={() => setShowTutorial(false)} />}

      <div className="min-h-screen bg-gray-50 dark:bg-[#121212]">
        {/* Header Section */}
        <div className="bg-white dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-5xl mx-auto px-6 py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="relative">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="Profile"
                      className="w-16 h-16 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-700"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <span className="text-2xl">👤</span>
                    </div>
                  )}
                  {profile?.is_verified && (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {profile?.username || user?.email?.split('@')[0] || 'User'}
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {user?.email}
                  </p>
                </div>
              </div>
              <button
                onClick={onLogout}
                disabled={loggingOut}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors disabled:opacity-50"
              >
                {loggingOut ? '...' : (t?.nav?.logout || 'Log out')}
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-5xl mx-auto px-6 py-8">
          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            <Link
              href="/dashboard/articles/edit"
              className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="currentColor">
                  <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 14h-3v3h-2v-3H8v-2h3v-3h2v3h3v2z"/>
                </svg>
              </div>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">New Article</span>
            </Link>
            <Link
              href="/dashboard?tab=podcasts&action=new"
              className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="currentColor">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
                </svg>
              </div>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">New Podcast</span>
            </Link>
            <Link
              href="/submit-music"
              className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                </svg>
              </div>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Submit Music</span>
            </Link>
            <Link
              href="/liked-songs"
              className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-red-600 dark:text-red-400" fill="currentColor">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              </div>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Liked Songs</span>
            </Link>
          </div>

          {/* Menu Items */}
          <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            {/* Dashboard */}
            <Link
              href="/dashboard"
              className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border-b border-gray-100 dark:border-gray-800"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="currentColor">
                    <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">Dashboard</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Manage your content</p>
                </div>
              </div>
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-400" fill="currentColor">
                <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
              </svg>
            </Link>

            {/* Settings */}
            <Link
              href="/settings"
              className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border-b border-gray-100 dark:border-gray-800"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="currentColor">
                    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">Community Profile</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Edit your public profile</p>
                </div>
              </div>
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-400" fill="currentColor">
                <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
              </svg>
            </Link>

            {/* Public Profile Link */}
            {profile?.is_public && profile?.artist_slug && (
              <Link
                href={`/profile/${profile.artist_slug}`}
                className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border-b border-gray-100 dark:border-gray-800"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">View Public Profile</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">kracradio.com/profile/{profile.artist_slug}</p>
                  </div>
                </div>
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-400" fill="currentColor">
                  <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
                </svg>
              </Link>
            )}

            {/* Charts */}
            <Link
              href="/charts"
              className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="currentColor">
                    <path d="M5 9.2h3V19H5V9.2zM10.6 5h2.8v14h-2.8V5zm5.6 8H19v6h-2.8v-6z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">Charts</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">View top songs</p>
                </div>
              </div>
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-400" fill="currentColor">
                <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
              </svg>
            </Link>
          </div>

          {/* Tutorial Link */}
          <div className="mt-8 text-center">
            <button
              onClick={() => setShowTutorial(true)}
              className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              View welcome tutorial
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
