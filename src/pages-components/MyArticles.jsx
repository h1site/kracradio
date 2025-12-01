'use client';
import RedirectTo from '../components/RedirectTo';
// src/pages/MyArticles.jsx
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n';
import { supabase } from '../lib/supabase';

export default function MyArticles() {
  const { user } = useAuth();
  const [rows, setRows] = useState(null);
  const { t } = useI18n();
  const common = t?.common ?? {};
  const profile = t?.profile ?? {};
  const myArticles = t?.myArticles ?? {};

  if (!user) return <RedirectTo href="/login" replace />;

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data, error } = await supabase
        .from('articles')
        .select('id, slug, title, excerpt, cover_url, status, created_at, published_at')
        .eq('author_id', user.id)
        .order('created_at', { ascending: false });

      if (!mounted) return;
      setRows(error ? [] : (data || []));
    })();
    return () => { mounted = false; };
  }, [user?.id]);

  return (
    <main className="container-max px-5 py-5">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-extrabold">{myArticles.title ?? 'Mes articles'}</h1>
        <Link href="/dashboard/articles/edit" className="btn-primary h-11 rounded-xl font-semibold">
          {myArticles.write ?? 'Écrire un article'}
        </Link>
      </div>

      {rows === null ? (
        <p>{common.loading ?? 'Chargement…'}</p>
      ) : rows.length === 0 ? (
        <div className="card p-5 dark:bg-[#1e1e1e]">
          {myArticles.empty ?? 'Aucun article créé pour le moment.'}
        </div>
      ) : (
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {rows.map((a) => (
            <li key={a.id} className="card p-4 dark:bg-[#1e1e1e]">
              {a.cover_url && (
                <img
                  src={a.cover_url}
                  alt={a.title}
                  className="w-full aspect-[16/9] object-cover rounded-lg mb-3"
                  loading="lazy"
                />
              )}

              <h3 className="font-semibold text-lg mb-1">{a.title}</h3>
              {a.excerpt && <p className="text-sm opacity-80 line-clamp-3">{a.excerpt}</p>}

              <div className="mt-3 flex items-center justify-between text-xs">
                <span
                  className={[
                    'px-2 py-0.5 rounded',
                    a.status === 'published'
                      ? 'bg-green-600/15 text-green-500'
                      : 'bg-yellow-600/15 text-yellow-500',
                  ].join(' ')}
                >
                  {a.status === 'published'
                    ? (profile.published ?? 'Publié')
                    : (profile.draft ?? 'Brouillon')}
                </span>

                <div className="flex items-center gap-3">
                  {a.status === 'published' ? (
                    <Link href={`/article/${a.slug}`} className="underline opacity-80 hover:opacity-100">
                      {common.view ?? 'Voir'}
                    </Link>
                  ) : (
                    <span className="opacity-60">{myArticles.notPublished ?? 'Non publié'}</span>
                  )}

                  {/* Lien d'édition par ID */}
                  <Link
                    href={`/dashboard/articles/edit/${a.id}`}
                    className="underline opacity-80 hover:opacity-100"
                    title={myArticles.editTooltip ?? 'Modifier cet article'}
                  >
                    {common.edit ?? 'Modifier'}
                  </Link>
                  {/* Variante query string possible :
                      href={`/dashboard/articles/edit?id=${a.id}`}
                  */}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
