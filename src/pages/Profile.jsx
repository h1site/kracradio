// src/pages/Profile.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n';
import { useProfile } from '../hooks/useCommunity';

export default function Profile() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile } = useProfile(user?.id);

  const onLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (e) {
      console.error('[Profile] signOut error:', e);
      alert(e?.message || 'Logout failed');
    }
  };

  return (
    <div className="container-max px-5 pb-16">
      <header className="pt-16 pb-12">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-black dark:text-white md:text-5xl">
              {t?.profile?.title || 'Profile'}
            </h1>
            <p className="mt-4 text-base text-gray-700 dark:text-gray-300 md:text-lg">
              {user?.email || t?.profile?.manageAccount || 'Manage your account'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard/articles/edit"
              className="inline-flex items-center gap-2 rounded-xl border border-blue-500/40 px-4 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50 dark:border-blue-500/30 dark:text-blue-400 dark:hover:bg-blue-900/30"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 14h-3v3h-2v-3H8v-2h3v-3h2v3h3v2zm-3-7V3.5L18.5 9H13z"/>
              </svg>
              {t?.profile?.addBlog || 'Add blog'}
            </Link>
            <Link
              to="/dashboard?tab=podcasts&action=new"
              className="inline-flex items-center gap-2 rounded-xl border border-purple-500/40 px-4 py-2 text-sm font-semibold text-purple-600 transition hover:bg-purple-50 dark:border-purple-500/30 dark:text-purple-400 dark:hover:bg-purple-900/30"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
              </svg>
              {t?.profile?.addPodcast || 'Add podcast'}
            </Link>
            <button
              onClick={onLogout}
              className="inline-flex items-center gap-2 rounded-xl border border-red-500/40 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-900/30"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
              </svg>
              {t?.nav?.logout || 'Log out'}
            </button>
          </div>
        </div>
      </header>

      {/* Dashboard Card */}
      <section className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-950 mb-6">
        <div className="flex flex-col items-center justify-center gap-6 text-center md:flex-row md:text-left">
          <div className="flex-shrink-0">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-orange-500">
              <svg viewBox="0 0 24 24" className="h-10 w-10 text-white" fill="currentColor">
                <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-black dark:text-white">
              {t?.profile?.dashboard || 'Dashboard'}
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {t?.profile?.dashboardDesc || 'Manage your podcasts and blog articles'}
            </p>
          </div>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 px-6 py-3 text-base font-semibold text-white shadow-lg transition hover:shadow-xl"
          >
            {t?.profile?.accessDashboard || 'Access Dashboard'}
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
              <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
            </svg>
          </Link>
        </div>
      </section>

      {/* Communauté Card */}
      <section className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-950">
        <div className="flex flex-col items-center justify-center gap-6 text-center md:flex-row md:text-left">
          <div className="flex-shrink-0">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500">
              <svg viewBox="0 0 24 24" className="h-10 w-10 text-white" fill="currentColor">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-black dark:text-white">
              {t?.profile?.communityTitle || 'My Community'}
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {t?.profile?.communityDesc || 'Manage your public profile, music links and follow other artists'}
            </p>
          </div>
          <Link
            to="/community"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 text-base font-semibold text-white shadow-lg transition hover:shadow-xl"
          >
            {t?.profile?.accessCommunity || 'Access Community'}
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
              <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
            </svg>
          </Link>
        </div>
      </section>

      {/* Mon Profil Public Card */}
      {profile?.is_public && profile?.artist_slug && (
        <section className="rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-8 shadow-sm dark:border-blue-800 dark:from-blue-950/30 dark:to-cyan-950/30">
          <div className="flex flex-col items-center justify-center gap-6 text-center md:flex-row md:text-left">
            <div className="flex-shrink-0">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500">
                <svg viewBox="0 0 24 24" className="h-10 w-10 text-white" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-black dark:text-white">
                {t?.profile?.publicProfileTitle || 'My Public Profile'}
              </h2>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                {t?.profile?.publicProfileDesc || 'Your profile is publicly visible'}
              </p>
              <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-white/80 px-4 py-2 dark:bg-gray-900/80">
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-blue-500" fill="currentColor">
                  <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
                </svg>
                <code className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                  kracradio.com/profile/{profile.artist_slug}
                </code>
              </div>
            </div>
            <Link
              to={`/profile/${profile.artist_slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-3 text-base font-semibold text-white shadow-lg transition hover:shadow-xl"
            >
              {t?.profile?.viewMyProfile || 'View my profile'}
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
              </svg>
            </Link>
          </div>
        </section>
      )}

      {/* Message si profil pas public */}
      {profile && !profile.is_public && (
        <section className="rounded-3xl border border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50 p-8 shadow-sm dark:border-yellow-800 dark:from-yellow-950/30 dark:to-orange-950/30">
          <div className="flex flex-col items-center justify-center gap-6 text-center md:flex-row md:text-left">
            <div className="flex-shrink-0">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-500">
                <svg viewBox="0 0 24 24" className="h-10 w-10 text-white" fill="currentColor">
                  <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-black dark:text-white">
                {t?.profile?.privateProfileTitle || 'Private Profile'}
              </h2>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                {t?.profile?.privateProfileDesc || 'Your profile is not yet public. Enable it in community settings to share it.'}
              </p>
            </div>
            <Link
              to="/community"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-yellow-600 to-orange-600 px-6 py-3 text-base font-semibold text-white shadow-lg transition hover:shadow-xl"
            >
              {t?.profile?.makePublic || 'Make my profile public'}
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
              </svg>
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
