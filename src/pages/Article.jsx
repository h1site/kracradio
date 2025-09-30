import React, { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { fetchArticleBySlug } from '../lib/articles';

export default function Article() {
  const { slug } = useParams();
  const [article, setArticle] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const a = await fetchArticleBySlug(slug);
        if (!a || a.status !== 'published') {
          setNotFound(true);
        } else {
          setArticle(a);
        }
      } catch {
        setNotFound(true);
      }
    })();
  }, [slug]);

  if (notFound) return <Navigate to="/articles" replace />;

  if (!article) {
    return (
      <main className="container-max px-5 py-6">
        <p>Chargement…</p>
      </main>
    );
  }

  return (
    <main className="container-max px-5 py-6">
      <article className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-extrabold mb-3">{article.title}</h1>
        <div className="text-sm opacity-70 mb-5">
          {article.published_at ? new Date(article.published_at).toLocaleString() : ''}
        </div>

        {article.cover_url && (
          <img
            src={article.cover_url}
            alt={article.title}
            className="w-full rounded-xl mb-6"
            loading="lazy"
          />
        )}

        <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap leading-relaxed">
          {article.content}
        </div>
      </article>
    </main>
  );
}
