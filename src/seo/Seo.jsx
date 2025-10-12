// src/seo/Seo.jsx
import React from 'react';
import { Helmet } from 'react-helmet-async';
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

  return (
    <Helmet htmlAttributes={{ lang }}>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      <link rel="canonical" href={canonical} />
      {noindex && <meta name="robots" content="noindex,nofollow" />}

      {/* hreflang alternates */}
      {alternates && (
        <>
          <link rel="alternate" hrefLang="x-default" href={urlForLang(path, 'fr')} />
          {SUPPORTED_LOCALES.map((l) => (
            <link key={l} rel="alternate" hrefLang={l} href={urlForLang(path, l)} />
          ))}
        </>
      )}

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description || ''} />
      <meta property="og:url" content={canonical} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:image" content={ogImage} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      {social.twitter && <meta name="twitter:site" content={social.twitter} />}
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description || ''} />
      <meta name="twitter:image" content={ogImage} />

      {/* JSON-LD */}
      {jsonLdList.map((obj, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(obj)}
        </script>
      ))}
    </Helmet>
  );
}
