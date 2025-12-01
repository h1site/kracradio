'use client';
// src/components/ArticleCarousel.jsx
import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useI18n } from '../i18n';

/**
 * Carrousel horizontal pour articles avec inertie
 */
export default function ArticleCarousel({ articles }) {
  const { t, lang } = useI18n();
  const viewportRef = useRef(null);
  const rowRef = useRef(null);

  const st = useRef({
    down: false,
    startX: 0,
    startTx: 0,
    tx: 0,
    v: 0,
    lastX: 0,
    lastT: 0,
    raf: 0,
    wView: 0,
    wRow: 0,
    min: 0,
    max: 0
  });

  const clamp = (val, min, max) => Math.max(min, Math.min(max, val));
  const applyTx = (tx) => { if (rowRef.current) rowRef.current.style.transform = `translate3d(${tx}px,0,0)`; };

  const measure = () => {
    const view = viewportRef.current;
    const row = rowRef.current;
    if (!view || !row) return;
    const wView = view.clientWidth;
    const wRow = row.scrollWidth;
    st.current.wView = wView;
    st.current.wRow = wRow;
    st.current.min = Math.min(0, wView - wRow);
    st.current.max = 0;
    st.current.tx = clamp(st.current.tx, st.current.min, st.current.max);
    applyTx(st.current.tx);
  };

  useEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    viewportRef.current && ro.observe(viewportRef.current);
    rowRef.current && ro.observe(rowRef.current);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
      cancelAnimationFrame(st.current.raf);
    };
  }, [articles]);

  const isInteractive = (el) => el?.closest?.('button,a,input,select,textarea');

  const onPointerDown = (e) => {
    if (isInteractive(e.target)) return;
    const x = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    st.current.down = true;
    st.current.startX = x;
    st.current.startTx = st.current.tx;
    st.current.lastX = x;
    st.current.lastT = performance.now();
    st.current.v = 0;
    viewportRef.current?.classList.add('cursor-grabbing');
    viewportRef.current?.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!st.current.down) return;
    e.preventDefault();
    const x = e.clientX ?? e.touches?.[0]?.clientX ?? st.current.lastX;
    const dx = x - st.current.startX;
    const raw = st.current.startTx + dx;
    let next = raw;
    if (raw > st.current.max)       next = st.current.max + (raw - st.current.max) * 0.25;
    else if (raw < st.current.min)  next = st.current.min + (raw - st.current.min) * 0.25;
    st.current.tx = next;
    applyTx(next);

    const now = performance.now();
    const dt = Math.max(16, now - st.current.lastT);
    st.current.v = ((x - st.current.lastX) / dt) * 1000;
    st.current.lastX = x;
    st.current.lastT = now;
  };

  const animateMomentum = () => {
    cancelAnimationFrame(st.current.raf);
    const step = () => {
      st.current.v *= 0.95;
      let next = st.current.tx + st.current.v * (1 / 60);
      if (next > st.current.max) { next = (next + st.current.max) / 2; st.current.v *= 0.5; }
      else if (next < st.current.min) { next = (next + st.current.min) / 2; st.current.v *= 0.5; }
      st.current.tx = next;
      applyTx(next);
      if (Math.abs(st.current.v) > 20) st.current.raf = requestAnimationFrame(step);
      else { st.current.tx = clamp(st.current.tx, st.current.min, st.current.max); applyTx(st.current.tx); }
    };
    if (Math.abs(st.current.v) > 20) st.current.raf = requestAnimationFrame(step);
  };

  const onPointerUp = (e) => {
    st.current.down = false;
    viewportRef.current?.classList.remove('cursor-grabbing');
    viewportRef.current?.releasePointerCapture?.(e.pointerId);
    animateMomentum();
  };

  const onWheel = (e) => {
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    st.current.v = delta * 10;
    st.current.tx = clamp(st.current.tx - delta, st.current.min - 200, st.current.max + 200);
    applyTx(st.current.tx);
    animateMomentum();
  };

  if (!articles || articles.length === 0) {
    return (
      <div className="px-5">
        <div className="bg-bg-secondary rounded-xl p-12 text-center border border-border">
          <p className="text-text-secondary">{t.home?.noArticles || 'Aucun article pour le moment'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        ref={viewportRef}
        className="overflow-hidden select-none cursor-grab px-5 pb-6"
        style={{ touchAction: 'pan-x', willChange: 'transform' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onTouchStart={onPointerDown}
        onTouchMove={onPointerMove}
        onTouchEnd={onPointerUp}
        onWheel={onWheel}
      >
        <div
          ref={rowRef}
          className="flex gap-5 will-change-transform"
          style={{ transform: 'translate3d(0,0,0)' }}
        >
          {articles.map((article) => {
            const imageUrl = article.featured_image || article.cover_url;
            const authorSlug = article.author_slug || article.author_name;
            const cleanUsername = article.author_name?.replace(/^@/, '') || '';
            return (
            <div
              key={article.id}
              className="shrink-0 w-[280px] sm:w-[320px] md:w-[360px] bg-bg-secondary rounded-xl border border-border overflow-hidden hover:border-accent/50 transition-all hover:shadow-lg group"
            >
              {imageUrl && (
                <Link href={`/article/${article.slug}`} className="block aspect-video overflow-hidden">
                  <img
                    src={imageUrl}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </Link>
              )}
              <div className="p-5">
                <Link href={`/article/${article.slug}`}>
                  <h3 className="text-lg font-bold text-text-primary mb-3 line-clamp-2 group-hover:text-accent transition-colors">
                    {article.title}
                  </h3>
                </Link>
                {article.author_name && (
                  <Link
                    href={authorSlug ? `/profile/${authorSlug}` : '#'}
                    className="flex items-center gap-2 mb-3 group/author"
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-bg-tertiary border border-border flex-shrink-0">
                      {article.author_avatar ? (
                        <img
                          src={article.author_avatar}
                          alt={article.author_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-accent to-purple-500">
                          <span className="text-white text-xs font-bold">
                            {article.author_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-text-secondary group-hover/author:text-accent transition-colors">
                      {t.home?.writtenBy || 'Par'} <span className="font-semibold text-accent">{article.author_name}</span>
                    </span>
                  </Link>
                )}
                <Link
                  href={`/article/${article.slug}`}
                  className="inline-flex items-center gap-1 text-accent hover:text-accent-hover font-semibold text-sm transition-colors"
                >
                  {t.home?.readMore || 'Lire plus'}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
