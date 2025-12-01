// src/seo/constants.js
export const SUPPORTED_LOCALES = ['fr', 'en', 'es'];
export const DEFAULT_LOCALE = 'fr';

const RAW_SITE_URL =
  (typeof process !== 'undefined' && process.env.REACT_APP_SITE_URL) ||
  'https://kracradio.com';

export const SITE_URL = RAW_SITE_URL.replace(/\/+$/, '');
export const siteName = 'KracRadio';
export const social = { twitter: '@KracRadio' };

export function absoluteUrl(path = '/') {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

// Stratégie actuelle : alternates via ?lang=
export function urlForLang(path, lang) {
  return `${absoluteUrl(path)}?lang=${lang}`;
}
