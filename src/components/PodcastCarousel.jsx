// src/components/PodcastCarousel.jsx
import React, { useEffect, useRef } from 'react';
import { useI18n } from '../i18n';

/**
 * Carrousel horizontal pour podcasts avec inertie
 */
export default function PodcastCarousel({ podcasts }) {
  const { t } = useI18n();
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
  }, [podcasts]);

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

  if (!podcasts || podcasts.length === 0) {
    return (
      <div className="px-5">
        <div className="bg-bg-secondary rounded-xl p-12 text-center border border-border">
          <p className="text-text-secondary">{t.home?.noPodcasts || 'Aucun podcast pour le moment'}</p>
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
          {podcasts.map((podcast) => (
            <div
              key={podcast.id}
              className="shrink-0 w-[280px] sm:w-[320px] md:w-[360px] bg-bg-secondary rounded-xl border border-border overflow-hidden hover:border-accent/50 transition-all hover:shadow-lg group"
            >
              {podcast.image_url && (
                <div className="aspect-video overflow-hidden">
                  <img
                    src={podcast.image_url}
                    alt={podcast.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}
              <div className="p-5">
                <h3 className="text-lg font-bold text-text-primary mb-2 line-clamp-2">{podcast.title}</h3>
                {podcast.author && (
                  <p className="text-sm text-accent mb-2">Par {podcast.author}</p>
                )}
                <p className="text-text-secondary text-sm mb-4 line-clamp-2">{podcast.description}</p>
                <a
                  href={podcast.website_url || podcast.rss_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-accent hover:text-accent-hover font-semibold text-sm"
                >
                  {t.home?.listen || 'Écouter'}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
