// src/pages/Article.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { fetchArticleBySlug } from '../lib/articles';
import { useI18n } from '../i18n';

export default function Article() {
  const { slug } = useParams();
  const { lang } = useI18n();
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

  const langContent = useMemo(() => {
    if (!article) return null;

    // Si content est un JSON trilingue: { fr:{title,excerpt,content}, en:{...}, es:{...} }
    // sinon, on considère que c'est du markdown simple (rétro-compat).
    let parsed = null;
    if (typeof article.content === 'string' && article.content.trim().startsWith('{')) {
      try {
        parsed = JSON.parse(article.content);
      } catch {/* ignore */}
    }
    if (parsed && parsed[lang] && parsed[lang].content) {
      return {
        title: parsed[lang].title || article.title,
        excerpt: parsed[lang].excerpt || article.excerpt,
        content: parsed[lang].content
      };
    }
    return {
      title: article.title,
      excerpt: article.excerpt,
      content: article.content || ''
    };
  }, [article, lang]);

  if (notFound) return <Navigate to="/articles" replace />;

  if (!article || !langContent) {
    return (
      <div className="container mx-auto px-4 py-6 text-sm opacity-80">
        Chargement…
      </div>
    );
  }

  return (
    <article className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-2">{langContent.title}</h1>

      {article.published_at ? (
        <div className="text-xs opacity-70 mb-4">
          {new Date(article.published_at).toLocaleString()}
        </div>
      ) : null}

      {article.cover_url ? (
        <img
          src={article.cover_url}
          alt=""
          className="w-full max-h-[420px] object-cover rounded-lg mb-4"
          loading="lazy"
        />
      ) : null}

      {langContent.excerpt ? (
        <p className="text-base mb-4 opacity-90">{langContent.excerpt}</p>
      ) : null}

      {/* contenu markdown (respecte le style actuel - pas de look nouveau) */}
      <div className="prose dark:prose-invert max-w-none">
        <ReactMarkdown>{langContent.content}</ReactMarkdown>
      </div>
    </article>
  );
}
