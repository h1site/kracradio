// src/seo/jsonld.js
import { SITE_URL, absoluteUrl, siteName } from './constants';

export function websiteJsonLd(lang = 'fr') {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    url: SITE_URL,
    name: siteName,
    inLanguage: lang,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/search?q={query}`,
      'query-input': 'required name=query'
    }
  };
}

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    url: SITE_URL,
    name: siteName,
    logo: absoluteUrl('/icon.png')
  };
}

export function radioStationJsonLd(channel, lang = 'fr') {
  return {
    '@context': 'https://schema.org',
    '@type': 'RadioStation',
    name: channel?.name || 'Radio',
    url: absoluteUrl(`/channel/${channel?.key || ''}`),
    image: channel?.image ? absoluteUrl(channel.image) : absoluteUrl('/icon.png'),
    inLanguage: lang,
    broadcastService: {
      '@type': 'BroadcastService',
      name: `${channel?.name || 'Radio'} Stream`,
      broadcastFrequency: 'Online',
      broadcastDisplayName: channel?.name,
      area: { '@type': 'Place', name: 'Global' }
    }
  };
}
