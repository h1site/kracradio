// src/pages/Profile.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n';

export default function Profile() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

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
              {user?.email || 'Gérez votre compte'}
            </p>
          </div>
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
      </header>

      {/* Dashboard Card */}
      <section className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-950">
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
              Gérez vos podcasts et articles de blog
            </p>
          </div>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 px-6 py-3 text-base font-semibold text-white shadow-lg transition hover:shadow-xl"
          >
            Accéder au Dashboard
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
              <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
            </svg>
          </Link>
        </div>
      </section>
    </div>
  );
}
