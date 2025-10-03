// src/pages/Articles.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listPublishedArticles } from '../lib/articles';
import { useI18n } from '../i18n';

export default function Articles() {
  const { lang } = useI18n();
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
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">Articles</h1>

      {rows === null ? (
        <div className="text-sm opacity-80">Chargement…</div>
      ) : rows.length === 0 ? (
        <div>Aucun article publié pour le moment.</div>
      ) : (
        <ul className="grid gap-6 md:grid-cols-2">
          {rows.map((a) => {
            let excerpt = a.excerpt || '';
            // si excerpt vide mais content JSON, essaye d’en tirer l’excerpt de la langue active
            if (!excerpt && typeof a.content === 'string' && a.content.trim().startsWith('{')) {
              try {
                const p = JSON.parse(a.content);
                excerpt = p?.[lang]?.excerpt || '';
              } catch {/* ignore */}
            }
            return (
              <li key={a.slug} className="rounded-lg border border-black/10 dark:border-white/10 overflow-hidden">
                {a.cover_url && (
                  <img src={a.cover_url} alt="" className="w-full h-40 object-cover" loading="lazy" />
                )}
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-1">
                    <Link to={`/articles/${a.slug}`}>{a.title}</Link>
                  </h3>
                  {excerpt ? <p className="text-sm opacity-90 mb-2">{excerpt}</p> : null}
                  <div className="text-xs opacity-70">
                    {a.published_at ? new Date(a.published_at).toLocaleString() : ''}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
