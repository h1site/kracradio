// src/components/ads/GoogleAd.jsx
'use client';

import React, { useEffect, useRef, useState } from 'react';

const AD_CLIENT = 'ca-pub-8781698761921917';

export default function GoogleAd({
  slot,
  className = '',
  format = 'auto',
  responsive = true,
  layout,
  layoutKey,
  style,
}) {
  const adRef = useRef(null);
  const containerRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const pushedRef = useRef(false);

  // Wait for container to be visible and have width before loading ad
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.boundingClientRect.width >= 250) {
            setIsReady(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.1, rootMargin: '200px' }
    );

    // Small delay to ensure container has dimensions
    const timer = setTimeout(() => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        if (width >= 250) {
          setIsReady(true);
        } else {
          observer.observe(containerRef.current);
        }
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  // Push ad only when ready and not already pushed
  useEffect(() => {
    if (!isReady || !adRef.current || pushedRef.current) return;

    // Check width one more time before pushing
    const containerWidth = containerRef.current?.offsetWidth || 0;
    if (containerWidth < 250) {
      return;
    }

    try {
      // Reset node so AdSense can fill it again (helps with React StrictMode)
      adRef.current.innerHTML = '';
      adRef.current.removeAttribute('data-adsbygoogle-status');

      // Google AdSense requires a fresh push each time the component mounts
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushedRef.current = true;
    } catch (error) {
      // Avoid breaking the UI if AdSense throws
      console.warn('[GoogleAd] AdSense push failed', error);
    }
  }, [isReady, slot]);

  const dataAttrs = {
    'data-ad-client': AD_CLIENT,
    'data-ad-slot': slot,
    'data-ad-format': format,
    'data-full-width-responsive': responsive ? 'true' : 'false',
  };

  if (layout) dataAttrs['data-ad-layout'] = layout;
  if (layoutKey) dataAttrs['data-ad-layout-key'] = layoutKey;

  return (
    <div ref={containerRef} style={{ minWidth: '250px', width: '100%' }}>
      {isReady && (
        <ins
          ref={adRef}
          className={['adsbygoogle', 'block', className].filter(Boolean).join(' ')}
          style={{ display: 'block', minHeight: '90px', ...style }}
          {...dataAttrs}
        />
      )}
    </div>
  );
}
