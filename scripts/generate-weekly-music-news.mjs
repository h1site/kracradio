// scripts/generate-weekly-music-news.mjs
// Génère un article hebdo (FR/EN/ES) "Dernières nouvelles musique"
// — s'appuie sur des flux RSS publics, compose un résumé structuré,
// — choisit une image de couverture si dispo,
// — insère l'article (status: 'published') dans Supabase.
//
// ENV requis (mettre dans GitHub Secrets):
// - SUPABASE_URL
// - SUPABASE_SERVICE_ROLE (clé service role de Supabase, pas la anon)
// - OPENAI_API_KEY  (ta NOUVELLE clé — régénère la tienne qui a fuité)
// - NEWS_MAX_ITEMS (optionnel, défaut 10)

import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

// --- Sources RSS (tu peux en ajouter/retirer ici)
const RSS_SOURCES = [
  'https://www.billboard.com/feed/',               // Billboard
  'https://pitchfork.com/rss/news/',               // Pitchfork News
  'https://www.nme.com/news/music/feed',           // NME
  'https://www.rollingstone.com/music/music-news/feed/' // Rolling Stone - Music News
];

const MAX_ITEMS = parseInt(process.env.NEWS_MAX_ITEMS || '10', 10);

// ---- helpers
async function fetchRss(url) {
  const res = await fetch(url, { headers: { 'user-agent': 'kracradio-bot/1.0' } });
  const xml = await res.text();
  // parse XML minimaliste
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = itemRegex.exec(xml))) {
    const block = m[1];
    const title = (block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/) || [,'',''])[1] || RegExp.$2 || '';
    const link  = (block.match(/<link>(.*?)<\/link>/) || [,''])[1];
    const desc  = (block.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>|<description>(.*?)<\/description>/) || [,'',''])[1] || RegExp.$2 || '';
    const enclosure = (block.match(/<enclosure[^>]*url="([^"]+)"/) || [,''])[1];
    const mediaContent = (block.match(/<media:content[^>]*url="([^"]+)"/) || [,''])[1];
    const img = enclosure || mediaContent || (desc.match(/<img[^>]*src="([^"]+)"/i) || [,''])[1] || null;
    items.push({ title: decodeHtml(title), link, desc: stripTags(desc).trim(), image: img });
  }
  return items.slice(0, MAX_ITEMS);
}

function stripTags(html) {
  return String(html || '').replace(/<[^>]*>/g, '');
}
function decodeHtml(s='') {
  return s.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'");
}

// ---- Compose un résumé trilingue avec OpenAI
async function summarizeTrilingual(allItems) {
  const system = `You are a music news editor. Summarize the week's biggest music news as a concise, neutral, SEO-friendly article with short sections and bullet highlights when helpful. Output strict JSON with keys fr, en, es. Each language has: title, excerpt (1-2 sentences), content (markdown). Do not include links.`;
  const user = JSON.stringify({
    week: new Date().toISOString().slice(0,10),
    items: allItems
  });

  // Appel API OpenAI (Responses API format)
  const resp = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-5.1',
      input: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ],
      temperature: 0.5
    })
  });
  if (!resp.ok) {
    const errText = await resp.text().catch(()=> '');
    throw new Error(`OpenAI error ${resp.status}: ${errText}`);
  }
  const data = await resp.json();
  const text = data.output?.[0]?.content?.[0]?.text || data.output_text || '';
  let parsed;
  try { parsed = JSON.parse(text); }
  catch { throw new Error('OpenAI returned non-JSON content'); }

  // valid rapide
  ['fr','en','es'].forEach(k => {
    if (!parsed[k] || !parsed[k].title || !parsed[k].content) {
      throw new Error(`Missing fields in language ${k}`);
    }
  });

  return parsed;
}

// ---- Choisit une image de couverture
function pickCover(items) {
  for (const it of items) {
    if (it.image && /\.(jpg|jpeg|png|webp)$/i.test(it.image)) return it.image;
  }
  return null;
}

// ---- Insère dans Supabase
async function insertArticle({ supabase, payload }) {
  const { data, error } = await supabase
    .from('articles')
    .insert(payload)
    .select('id, slug')
    .single();
  if (error) throw error;
  return data;
}

function slugify(input='') {
  return String(input)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g,'')
    .toLowerCase().trim()
    .replace(/[^a-z0-9]+/g,'-')
    .replace(/(^-|-$)+/g,'');
}

(async function main(){
  const all = [];
  for (const url of RSS_SOURCES) {
    try { all.push(...await fetchRss(url)); } catch(e) {
      console.error('RSS fail', url, e.message);
    }
  }
  if (all.length === 0) throw new Error('No news items fetched.');

  const trilingual = await summarizeTrilingual(all);
  const cover = pickCover(all);

  // On stocke tout le contenu trilingue dans content (JSON stringify),
  // pour que la page Article sélectionne selon la langue active.
  // On met le title FR comme titre principal (cohérent avec ton site par défaut FR).
  const titleFR = `Nouvelles musique — Semaine du ${new Date().toLocaleDateString('fr-CA')}`;
  const slugBase = slugify(titleFR);

  const payload = {
    slug: `${slugBase}-${Date.now().toString(36)}`,
    title: titleFR,
    excerpt: trilingual.fr.excerpt || null,
    content: JSON.stringify(trilingual),   // <<< clé de l’intégration multilingue
    cover_url: cover,
    status: 'published',
    author_id: 'system' // adapte si tu veux tracer un auteur
  };

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE,
    { auth: { persistSession: false } }
  );

  const inserted = await insertArticle({ supabase, payload });
  console.log('Inserted article:', inserted);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
