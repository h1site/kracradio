// src/pages/Profile.jsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n';
import { listUserArticles } from '../lib/supabase';

export default function Profile() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [params] = useSearchParams(); // optional if you want to read something
  const [articles, setArticles] = useState([]);
  const [error, setError] = useState('');

  // Load my articles safely
  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!user?.id) return;
      try {
        const data = await listUserArticles(user.id);
        if (mounted) setArticles(data);
      } catch (e) {
        console.error('[Profile] listUserArticles error:', e);
        if (mounted) setError(e?.message || 'Failed to load articles');
      }
    }
    load();
    return () => { mounted = false; };
  }, [user?.id]);

  const onLogout = async () => {
    try {
      await signOut();
      navigate('/'); // back to home
    } catch (e) {
      console.error('[Profile] signOut error:', e);
      alert(e?.message || 'Logout failed');
    }
  };

  return (
    <div className="px-5">
      {/* Header line */}
      <div className="flex items-center justify-between py-4">
        <h1 className="text-xl font-bold">{t?.profile?.title || 'Profile'}</h1>
        <div className="flex items-center gap-2">
          <Link
            to="/dashboard/articles/edit"
            className="px-3 py-1.5 rounded-md bg-red-600 text-white text-sm font-semibold hover:opacity-90"
          >
            {t?.profile?.createArticle || 'Create article'}
          </Link>
          <button
            onClick={onLogout}
            className="px-3 py-1.5 rounded-md border border-black/15 dark:border-white/15 text-sm hover:bg-black/5 dark:hover:bg-white/10"
          >
            {t?.nav?.logout || 'Log out'}
          </button>
        </div>
      </div>

      {/* My Articles */}
      <section className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">{t?.profile?.myArticles || 'My articles'}</h2>
        </div>

        {error && (
          <div className="mb-3 text-sm text-red-600">{error}</div>
        )}

        {articles.length === 0 ? (
          <p className="text-sm opacity-80">{t?.profile?.none || 'No articles yet.'}</p>
        ) : (
          <ul className="divide-y divide-black/10 dark:divide-white/10">
            {articles.map((a) => (
              <li key={a.id} className="py-3 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="font-medium truncate">{a.title}</div>
                  <div className="text-xs opacity-70">
                    {t?.profile?.status || 'Status'}:{' '}
                    {a.status === 'published'
                      ? (t?.profile?.published || 'Published')
                      : (t?.profile?.draft || 'Draft')}
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <Link
                    to={`/article/${a.slug}`}
                    className="px-2 py-1 text-sm underline"
                  >
                    {t?.articles?.view || 'View'}
                  </Link>
                  <Link
                    to={`/dashboard/articles/edit?id=${a.id}`}
                    className="px-3 py-1.5 rounded-md border border-black/15 dark:border-white/15 text-sm hover:bg-black/5 dark:hover:bg-white/10"
                  >
                    {t?.profile?.edit || 'Edit'}
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
