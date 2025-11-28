// src/components/ChannelCarousel.jsx
import React, { useEffect, useRef, useState } from 'react';
import ChannelCard from './ChannelCard';

/**
 * Carrousel horizontal avec scroll natif sur mobile (meilleure UX)
 * et drag personnalisé sur desktop.
 */
export default function ChannelCarousel({ channels }) {
  const viewportRef = useRef(null);
  const rowRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);

  // Détecter mobile/touch device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
  const applyTx = (tx) => { if (rowRef.current && !isMobile) rowRef.current.style.transform = `translate3d(${tx}px,0,0)`; };

  const measure = () => {
    if (isMobile) return; // Skip pour mobile - utilise scroll natif
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
  }, [isMobile]);

  const isInteractive = (el) => el?.closest?.('button,a,input,select,textarea');

  const onPointerDown = (e) => {
    if (isMobile) return; // Utilise scroll natif sur mobile
    if (isInteractive(e.target)) return;
    const x = e.clientX ?? 0;
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
    if (isMobile || !st.current.down) return;
    e.preventDefault();
    const x = e.clientX ?? st.current.lastX;
    const dx = x - st.current.startX;
    const raw = st.current.startTx + dx;
    let next = raw;
    if (raw > st.current.max) next = st.current.max + (raw - st.current.max) * 0.25;
    else if (raw < st.current.min) next = st.current.min + (raw - st.current.min) * 0.25;
    st.current.tx = next;
    applyTx(next);

    const now = performance.now();
    const dt = Math.max(16, now - st.current.lastT);
    st.current.v = ((x - st.current.lastX) / dt) * 1000;
    st.current.lastX = x;
    st.current.lastT = now;
  };

  const animateMomentum = () => {
    if (isMobile) return;
    cancelAnimationFrame(st.current.raf);
    const step = () => {
      st.current.v *= 0.92;
      let next = st.current.tx + st.current.v * (1 / 60);
      if (next > st.current.max) { next = (next + st.current.max) / 2; st.current.v *= 0.5; }
      else if (next < st.current.min) { next = (next + st.current.min) / 2; st.current.v *= 0.5; }
      st.current.tx = next;
      applyTx(next);
      if (Math.abs(st.current.v) > 10) st.current.raf = requestAnimationFrame(step);
      else { st.current.tx = clamp(st.current.tx, st.current.min, st.current.max); applyTx(st.current.tx); }
    };
    if (Math.abs(st.current.v) > 10) st.current.raf = requestAnimationFrame(step);
  };

  const onPointerUp = (e) => {
    if (isMobile) return;
    st.current.down = false;
    viewportRef.current?.classList.remove('cursor-grabbing');
    viewportRef.current?.releasePointerCapture?.(e.pointerId);
    animateMomentum();
  };

  // Utiliser useEffect pour attacher wheel avec passive: false
  useEffect(() => {
    if (isMobile) return;
    const viewport = viewportRef.current;
    if (!viewport) return;

    const handleWheel = (e) => {
      e.preventDefault();
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      st.current.v = delta * 5;
      st.current.tx = clamp(st.current.tx - delta * 1.5, st.current.min - 200, st.current.max + 200);
      applyTx(st.current.tx);
      animateMomentum();
    };

    viewport.addEventListener('wheel', handleWheel, { passive: false });
    return () => viewport.removeEventListener('wheel', handleWheel);
  }, [isMobile]);

  // Mobile: utilise scroll natif avec -webkit-overflow-scrolling
  if (isMobile) {
    return (
      <div className="relative">
        <div
          className="overflow-x-auto scrollbar-hide px-5 pb-6 -mx-5"
          style={{
            WebkitOverflowScrolling: 'touch',
            scrollSnapType: 'x mandatory',
            scrollPaddingLeft: '20px'
          }}
        >
          <div className="flex gap-4 px-5" style={{ width: 'max-content' }}>
            {channels.map((ch) => (
              <div
                key={ch.key}
                className="shrink-0 w-[280px]"
                style={{ scrollSnapAlign: 'start' }}
              >
                <ChannelCard channel={ch} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Desktop: drag personnalisé
  return (
    <div className="relative">
      <div
        ref={viewportRef}
        className="overflow-hidden select-none cursor-grab px-5 pb-6"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div
          ref={rowRef}
          className="flex gap-5"
          style={{
            transform: 'translate3d(0,0,0)',
            willChange: 'transform',
            backfaceVisibility: 'hidden',
            perspective: 1000
          }}
        >
          {channels.map((ch) => (
            <div key={ch.key} className="shrink-0 w-[280px] md:w-[300px]">
              <ChannelCard channel={ch} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
