// src/components/ads/GoogleAd.jsx
import React, { useEffect, useRef } from 'react';

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

  useEffect(() => {
    if (!adRef.current || typeof window === 'undefined') {
      return;
    }

    try {
      // Reset node so AdSense can fill it again (helps with React StrictMode).
      adRef.current.innerHTML = '';
      adRef.current.removeAttribute('data-adsbygoogle-status');

      // Google AdSense requires a fresh push each time the component mounts.
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (error) {
      // Avoid breaking the UI if AdSense throws.
      // eslint-disable-next-line no-console
      console.warn('[GoogleAd] AdSense push failed', error);
    }
  }, [slot, format]);

  const dataAttrs = {
    'data-ad-client': AD_CLIENT,
    'data-ad-slot': slot,
    'data-ad-format': format,
    'data-full-width-responsive': responsive ? 'true' : 'false',
  };

  if (layout) dataAttrs['data-ad-layout'] = layout;
  if (layoutKey) dataAttrs['data-ad-layout-key'] = layoutKey;

  return (
    <ins
      ref={adRef}
      className={['adsbygoogle', 'block', className].filter(Boolean).join(' ')}
      style={{ display: 'block', minHeight: '120px', ...style }}
      {...dataAttrs}
    />
  );
}
