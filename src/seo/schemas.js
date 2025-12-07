// src/seo/schemas.js
// Schema.org JSON-LD markup generators for KracRadio

import { siteName, absoluteUrl } from './constants';

const SITE_URL = 'https://kracradio.com';

// =============================================================================
// ORGANIZATION SCHEMA (used on all pages)
// =============================================================================
export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${SITE_URL}/#organization`,
  name: siteName,
  url: SITE_URL,
  logo: {
    '@type': 'ImageObject',
    url: `${SITE_URL}/icon.png`,
    width: 512,
    height: 512,
  },
  sameAs: [
    'https://twitter.com/KracRadio',
    'https://www.instagram.com/kracradio/',
    'https://www.facebook.com/kracradio',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer service',
    email: 'contact@kracradio.com',
    availableLanguage: ['French', 'English', 'Spanish'],
  },
};

// =============================================================================
// WEBSITE SCHEMA
// =============================================================================
export const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  name: siteName,
  url: SITE_URL,
  publisher: { '@id': `${SITE_URL}/#organization` },
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${SITE_URL}/artists?search={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
  inLanguage: ['fr', 'en', 'es'],
};

// =============================================================================
// RADIO STATION SCHEMA (for Home page)
// =============================================================================
export const radioStationSchema = {
  '@context': 'https://schema.org',
  '@type': 'RadioStation',
  '@id': `${SITE_URL}/#radiostation`,
  name: siteName,
  url: SITE_URL,
  logo: `${SITE_URL}/icon.png`,
  image: `${SITE_URL}/icon.png`,
  description: 'Radio en ligne avec plusieurs chaînes musicales: Chill, Hits, Hip-Hop, Rock, Country, Oldies, Latino, Lo-Fi',
  broadcastDisplayName: siteName,
  broadcastTimezone: 'America/Montreal',
  parentOrganization: { '@id': `${SITE_URL}/#organization` },
  areaServed: {
    '@type': 'Country',
    name: 'Canada',
  },
};

// =============================================================================
// RADIO CHANNEL SCHEMA
// =============================================================================
export function radioChannelSchema(channel) {
  return {
    '@context': 'https://schema.org',
    '@type': 'RadioChannel',
    name: `${siteName} - ${channel.name}`,
    url: absoluteUrl(`/channel/${channel.key}`),
    description: channel.description || `Écoutez ${channel.name} sur ${siteName}`,
    broadcastDisplayName: channel.name,
    inBroadcastLineup: { '@id': `${SITE_URL}/#radiostation` },
    image: channel.image || `${SITE_URL}/icon.png`,
  };
}

// =============================================================================
// ARTICLE SCHEMA
// =============================================================================
export function articleSchema(article, author) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': absoluteUrl(`/article/${article.slug}#article`),
    headline: article.title,
    description: article.excerpt || article.title,
    url: absoluteUrl(`/article/${article.slug}`),
    datePublished: article.published_at || article.created_at,
    dateModified: article.updated_at || article.published_at || article.created_at,
    publisher: { '@id': `${SITE_URL}/#organization` },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': absoluteUrl(`/article/${article.slug}`),
    },
    inLanguage: article.language || 'fr',
  };

  if (article.featured_image) {
    schema.image = {
      '@type': 'ImageObject',
      url: article.featured_image,
    };
  }

  if (author) {
    schema.author = {
      '@type': 'Person',
      name: author.username || 'KracRadio',
      url: author.artist_slug ? absoluteUrl(`/profile/${author.artist_slug}`) : SITE_URL,
    };
  } else {
    schema.author = { '@id': `${SITE_URL}/#organization` };
  }

  return schema;
}

// =============================================================================
// PERSON/ARTIST PROFILE SCHEMA
// =============================================================================
export function personSchema(profile) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': absoluteUrl(`/profile/${profile.artist_slug || profile.id}#person`),
    name: profile.username || 'Artiste',
    url: absoluteUrl(`/profile/${profile.artist_slug || profile.id}`),
    description: profile.bio || `Profil de ${profile.username} sur ${siteName}`,
  };

  if (profile.avatar_url) {
    schema.image = profile.avatar_url;
  }

  if (profile.location) {
    schema.address = {
      '@type': 'PostalAddress',
      addressLocality: profile.location,
    };
  }

  if (profile.website_url) {
    schema.sameAs = [profile.website_url];
  }

  // If verified artist, add MusicGroup type
  if (profile.is_verified) {
    schema['@type'] = ['Person', 'MusicGroup'];
    schema.genre = profile.genres || [];
  }

  return schema;
}

// =============================================================================
// MUSIC GROUP SCHEMA (for verified artists)
// =============================================================================
export function musicGroupSchema(profile) {
  return {
    '@context': 'https://schema.org',
    '@type': 'MusicGroup',
    '@id': absoluteUrl(`/profile/${profile.artist_slug || profile.id}#musicgroup`),
    name: profile.username,
    url: absoluteUrl(`/profile/${profile.artist_slug || profile.id}`),
    description: profile.bio || `Artiste musical sur ${siteName}`,
    image: profile.avatar_url || `${SITE_URL}/icon.png`,
    genre: profile.genres || [],
    foundingLocation: profile.location ? {
      '@type': 'Place',
      name: profile.location,
    } : undefined,
    sameAs: profile.website_url ? [profile.website_url] : undefined,
  };
}

// =============================================================================
// PODCAST SERIES SCHEMA
// =============================================================================
export function podcastSeriesSchema(podcast, author) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'PodcastSeries',
    '@id': absoluteUrl(`/podcast/${podcast.id}#podcastseries`),
    name: podcast.title,
    description: podcast.description || podcast.title,
    url: absoluteUrl(`/podcast/${podcast.id}`),
    webFeed: podcast.rss_url,
    inLanguage: podcast.language || 'fr',
  };

  if (podcast.image_url) {
    schema.image = podcast.image_url;
  }

  if (author) {
    schema.author = {
      '@type': 'Person',
      name: author.username,
      url: author.artist_slug ? absoluteUrl(`/profile/${author.artist_slug}`) : undefined,
    };
  }

  if (podcast.website_url) {
    schema.sameAs = [podcast.website_url];
  }

  return schema;
}

// =============================================================================
// BREADCRUMB SCHEMA
// =============================================================================
export function breadcrumbSchema(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url ? absoluteUrl(item.url) : undefined,
    })),
  };
}

// =============================================================================
// COLLECTION PAGE SCHEMA (for Artists, Articles, Podcasts lists)
// =============================================================================
export function collectionPageSchema(name, description, path, itemCount) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: name,
    description: description,
    url: absoluteUrl(path),
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: itemCount || 0,
    },
    isPartOf: { '@id': `${SITE_URL}/#website` },
  };
}

// =============================================================================
// CONTACT PAGE SCHEMA
// =============================================================================
export const contactPageSchema = {
  '@context': 'https://schema.org',
  '@type': 'ContactPage',
  name: 'Contact - KracRadio',
  description: 'Contactez KracRadio pour toute question ou collaboration',
  url: absoluteUrl('/contact'),
  mainEntity: { '@id': `${SITE_URL}/#organization` },
};

// =============================================================================
// ABOUT PAGE SCHEMA
// =============================================================================
export const aboutPageSchema = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  name: 'À propos - KracRadio',
  description: 'Découvrez KracRadio, votre radio en ligne multichaînes',
  url: absoluteUrl('/about'),
  mainEntity: { '@id': `${SITE_URL}/#organization` },
};

// =============================================================================
// FAQ PAGE SCHEMA (if needed)
// =============================================================================
export function faqSchema(questions) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map(q => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.answer,
      },
    })),
  };
}

// =============================================================================
// EVENT SCHEMA (for schedule/shows)
// =============================================================================
export function eventSchema(event) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BroadcastEvent',
    name: event.name,
    description: event.description,
    startDate: event.startDate,
    endDate: event.endDate,
    isLiveBroadcast: true,
    broadcastOfEvent: {
      '@type': 'Event',
      name: event.name,
    },
    videoFormat: 'SD',
  };
}

// =============================================================================
// MUSIC PLAYLIST SCHEMA (for charts)
// =============================================================================
export function musicPlaylistSchema(name, description, tracks, channelKey) {
  return {
    '@context': 'https://schema.org',
    '@type': 'MusicPlaylist',
    name: name,
    description: description,
    url: absoluteUrl(channelKey ? `/charts/${channelKey}` : '/charts'),
    numTracks: tracks?.length || 0,
    track: tracks?.slice(0, 10).map((track, index) => ({
      '@type': 'MusicRecording',
      position: index + 1,
      name: track.title || track.name,
      byArtist: {
        '@type': 'MusicGroup',
        name: track.artist,
      },
    })) || [],
  };
}
