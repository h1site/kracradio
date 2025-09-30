import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listPublishedArticles } from '../lib/articles';

export default function Articles() {
  const [rows, setRows] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await listPublishedArticles({ limit: 20 });
        setRows(data);
      } catch {
        setRows([]);
      }
    })();
  }, []);

  return (
    <main className="container-max px-5 py-6">
      <h1 className="text-2xl font-bold mb-4">Articles</h1>

      {rows === null ? (
        <p>Chargement…</p>
      ) : rows.length === 0 ? (
        <p>Aucun article publié pour le moment.</p>
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
              <h3 className="font-semibold text-lg mb-1">
                <Link to={`/article/${a.slug}`} className="hover:underline">{a.title}</Link>
              </h3>
              {a.excerpt && <p className="text-sm opacity-80 line-clamp-3">{a.excerpt}</p>}
              <div className="mt-3 text-xs opacity-60">
                {a.published_at ? new Date(a.published_at).toLocaleString() : ''}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
