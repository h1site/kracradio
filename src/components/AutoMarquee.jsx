import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

/**
 * AutoMarquee
 * - Fait défiler horizontalement le texte seulement s'il dépasse.
 * - Vitesse réglable (px/s). Pause au survol.
 */
export default function AutoMarquee({
  children,
  className = '',
  speed = 80,   // px / seconde
  gap = 40,     // espace entre les deux copies
}) {
  const viewportRef = useRef(null);
  const textRef = useRef(null);
  const [shouldScroll, setShouldScroll] = useState(false);
  const [duration, setDuration] = useState(12);

  const measure = () => {
    const vp = viewportRef.current;
    const txt = textRef.current;
    if (!vp || !txt) return;
    const vpW = vp.clientWidth;
    const txtW = txt.scrollWidth;
    if (txtW > vpW + 2) {
      setShouldScroll(true);
      setDuration((txtW + gap) / speed);
    } else {
      setShouldScroll(false);
    }
  };

  useLayoutEffect(measure, [children]);
  useEffect(() => {
    const ro = new ResizeObserver(measure);
    viewportRef.current && ro.observe(viewportRef.current);
    textRef.current && ro.observe(textRef.current);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  if (!shouldScroll) {
    return (
      <div ref={viewportRef} className={`overflow-hidden whitespace-nowrap ${className}`}>
        <span ref={textRef} className="align-top">{children}</span>
      </div>
    );
  }

  return (
    <div
      ref={viewportRef}
      className={`overflow-hidden whitespace-nowrap marquee-mask ${className}`}
      style={{ '--marquee-duration': `${duration}s`, '--marquee-gap': `${gap}px` }}
    >
      <div className="marquee-track">
        <span ref={textRef} className="marquee-item">{children}</span>
        <span className="marquee-item" aria-hidden="true">{children}</span>
      </div>
    </div>
  );
}
