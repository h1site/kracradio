// src/components/ads/GoogleAd.jsx
'use client';

import { useEffect, useRef, useState } from 'react';

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
  const [mounted, setMounted] = useState(false);
  const pushedRef = useRef(false);

  // Only render on client to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Push ad when mounted and container has width
  useEffect(() => {
    if (!mounted || !adRef.current || pushedRef.current) return;

    const pushAd = () => {
      const containerWidth = containerRef.current?.offsetWidth || 0;
      if (containerWidth < 250) {
        // Retry after a short delay if container not ready
        return false;
      }

      try {
        // Reset node so AdSense can fill it again
        if (adRef.current) {
          adRef.current.innerHTML = '';
          adRef.current.removeAttribute('data-adsbygoogle-status');
        }

        // Google AdSense requires a fresh push
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        pushedRef.current = true;
        return true;
      } catch (error) {
        console.warn('[GoogleAd] AdSense push failed', error);
        return false;
      }
    };

    // Try immediately
    if (pushAd()) return;

    // Retry with delays if needed
    const timers = [
      setTimeout(() => pushAd(), 100),
      setTimeout(() => pushAd(), 500),
      setTimeout(() => pushAd(), 1000),
    ];

    return () => timers.forEach(clearTimeout);
  }, [mounted, slot]);

  const dataAttrs = {
    'data-ad-client': AD_CLIENT,
    'data-ad-slot': slot,
    'data-ad-format': format,
    'data-full-width-responsive': responsive ? 'true' : 'false',
  };

  if (layout) dataAttrs['data-ad-layout'] = layout;
  if (layoutKey) dataAttrs['data-ad-layout-key'] = layoutKey;

  // Always render the same structure to avoid hydration mismatch
  // The ad only gets pushed on the client side
  return (
    <div
      ref={containerRef}
      style={{ minWidth: '250px', width: '100%', minHeight: '90px' }}
      suppressHydrationWarning
    >
      {mounted && (
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
