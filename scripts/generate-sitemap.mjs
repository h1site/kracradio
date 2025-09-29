// scripts/generate-sitemap.mjs
import { writeFile, readFile } from 'fs/promises';
import { resolve } from 'path';

const SITE_URL = process.env.REACT_APP_SITE_URL || 'https://kracradio.com';
const SUPPORTED_LOCALES = ['fr', 'en', 'es'];
const NOW = new Date().toISOString();

const publicPath = resolve(process.cwd(), 'public', 'sitemap.xml');
const channelsJsonPath = resolve(process.cwd(), 'src', 'data', 'channels.json');

function url(path = '/') {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
function alt(path, lang) {
  return `${url(path)}?lang=${lang}`;
}

const urls = [
  { loc: url('/'), changefreq: 'daily', priority: '1.0', path: '/' },
  // Ajoute ici d'autres routes statiques (blog, artists, etc.)
];

const channelsRaw = JSON.parse(await readFile(channelsJsonPath, 'utf8'));
channelsRaw.forEach((c) => {
  const path = `/channel/${c.key}`;
  urls.push({ loc: url(path), changefreq: 'hourly', priority: '0.9', path });
});

let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n`;

for (const item of urls) {
  xml += `  <url>\n`;
  xml += `    <loc>${item.loc}</loc>\n`;
  xml += `    <lastmod>${NOW}</lastmod>\n`;
  if (item.changefreq) xml += `    <changefreq>${item.changefreq}</changefreq>\n`;
  if (item.priority) xml += `    <priority>${item.priority}</priority>\n`;

  for (const l of SUPPORTED_LOCALES) {
    xml += `    <xhtml:link rel="alternate" hreflang="${l}" href="${alt(item.path, l)}" />\n`;
  }
  xml += `    <xhtml:link rel="alternate" hreflang="x-default" href="${alt(item.path, 'fr')}" />\n`;
  xml += `  </url>\n`;
}
xml += `</urlset>\n`;

await writeFile(publicPath, xml, 'utf8');
console.log(`[sitemap] Generated ${publicPath}`);
