// src/pages/ArticleEditor.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n';
import Seo from '../seo/Seo';
import {
  createArticle,
  updateArticleById,
  fetchArticleById,
} from '../lib/supabase';

export default function ArticleEditor() {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const { id } = useParams();
  const navigate = useNavigate();

  const A = t?.articles || {};
  const P = t?.profile || {};

  const isEdit = Boolean(id);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('draft');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  // Charger l’article à éditer
  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!isEdit) return;
      setBusy(true);
      const { data, error } = await fetchArticleById(id);
      if (mounted) {
        if (error) setErr(error.message || 'Error');
        if (data) {
          setTitle(data.title || '');
          setContent(data.content || '');
          setStatus(data.status || 'draft');
        }
        setBusy(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [id, isEdit]);

  async function onSubmit(e) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    setErr('');

    try {
      if (isEdit) {
        const { data, error } = await updateArticleById(id, { title, content, status });
        if (error) throw error;
        // redirige vers l’article s’il est publié, sinon profil
        if (data?.slug && data?.status === 'published') {
          navigate(`/article/${data.slug}`, { replace: true });
        } else {
          navigate('/profile', { replace: true });
        }
      } else {
        const { data, error } = await createArticle({
          title,
          content,
          status,
          author_id: user.id,
        });
        if (error) throw error;
        if (data?.slug && data?.status === 'published') {
          navigate(`/article/${data.slug}`, { replace: true });
        } else {
          navigate('/profile', { replace: true });
        }
      }
    } catch (e2) {
      setErr(e2.message || 'Error');
      setBusy(false);
    }
  }

  return (
    <main className="container-max px-5 py-6">
      <Seo
        lang={lang}
        title={isEdit ? (A.editTitle || 'Edit article') : (A.newTitle || 'New article')}
        description={t?.meta?.homeDesc || 'Editor'}
        path={isEdit ? `/dashboard/articles/edit/${id}` : '/dashboard/articles/edit'}
        type="website"
      />

      <div className="max-w-3xl mx-auto card p-5 dark:bg-[#1e1e1e]">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-extrabold">
            {isEdit ? (A.editTitle || 'Edit article') : (A.newTitle || 'New article')}
          </h1>
          <Link to="/profile" className="underline text-sm">
            {P.back || 'Back'}
          </Link>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block">
            <span className="text-sm opacity-80">{A.titleLabel || 'Title'}</span>
            <input
              className="input w-full mt-1"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder={A.titlePh || 'Article title'}
            />
          </label>

          <label className="block">
            <span className="text-sm opacity-80">{A.contentLabel || 'Content'}</span>
            <textarea
              className="input w-full mt-1 min-h-[220px]"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={A.contentPh || 'Write your article...'}
            />
          </label>

          <label className="block">
            <span className="text-sm opacity-80">{A.statusLabel || 'Status'}</span>
            <select
              className="input w-full mt-1"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="draft">{A.statusDraft || 'Draft'}</option>
              <option value="published">{A.statusPublished || 'Published'}</option>
            </select>
          </label>

          {err ? <div className="text-sm text-red-500">{err}</div> : null}

          <button
            type="submit"
            disabled={busy}
            className="btn-primary h-11 px-5 rounded-xl font-semibold"
          >
            {busy ? '…' : (isEdit ? (A.update || 'Update') : (A.save || 'Save'))}
          </button>
        </form>
      </div>
    </main>
  );
}
