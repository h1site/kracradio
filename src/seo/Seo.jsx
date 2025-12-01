'use client';
// src/seo/Seo.jsx - Next.js compatible version
import { useEffect } from 'react';
import Script from 'next/script';
import {
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  siteName,
  social,
  absoluteUrl,
  urlForLang,
} from './constants';

export default function Seo({
  lang = DEFAULT_LOCALE,
  title,
  description,
  path = '/',
  image,
  type = 'website',
  jsonLd,
  noindex = false,
  alternates = true,
}) {
  const canonical = absoluteUrl(path);
  const ogImage = image
    ? (image.startsWith('http') ? image : absoluteUrl(image))
    : absoluteUrl('/logo-og.png');

  const fullTitle = title ? `${title} | ${siteName}` : siteName;
  const jsonLdList = Array.isArray(jsonLd) ? jsonLd : (jsonLd ? [jsonLd] : []);

  // Update document title client-side
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = fullTitle;
      document.documentElement.lang = lang;

      // Update or create meta tags
      const updateMeta = (name, content, isProperty = false) => {
        const attr = isProperty ? 'property' : 'name';
        let meta = document.querySelector(`meta[${attr}="${name}"]`);
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute(attr, name);
          document.head.appendChild(meta);
        }
        meta.setAttribute('content', content || '');
      };

      if (description) updateMeta('description', description);
      if (noindex) updateMeta('robots', 'noindex,nofollow');

      // Open Graph
      updateMeta('og:type', type, true);
      updateMeta('og:title', fullTitle, true);
      updateMeta('og:description', description || '', true);
      updateMeta('og:url', canonical, true);
      updateMeta('og:site_name', siteName, true);
      updateMeta('og:image', ogImage, true);

      // Twitter
      updateMeta('twitter:card', 'summary_large_image');
      if (social.twitter) updateMeta('twitter:site', social.twitter);
      updateMeta('twitter:title', fullTitle);
      updateMeta('twitter:description', description || '');
      updateMeta('twitter:image', ogImage);

      // Canonical
      let canonicalLink = document.querySelector('link[rel="canonical"]');
      if (!canonicalLink) {
        canonicalLink = document.createElement('link');
        canonicalLink.setAttribute('rel', 'canonical');
        document.head.appendChild(canonicalLink);
      }
      canonicalLink.setAttribute('href', canonical);
    }
  }, [fullTitle, lang, description, noindex, type, canonical, ogImage]);

  return (
    <>
      {/* JSON-LD structured data */}
      {jsonLdList.map((obj, i) => (
        <Script
          key={i}
          id={`json-ld-${i}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(obj) }}
        />
      ))}
    </>
  );
}
