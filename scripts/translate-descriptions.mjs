#!/usr/bin/env node
/**
 * Traduit les descriptions FR vers EN et ES avec Ollama
 *
 * Usage: node scripts/translate-descriptions.mjs [--limit=100] [--offset=0] [--dry-run]
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://gpcedzaflhiucwyjgdai.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const MODEL = process.env.OLLAMA_MODEL || 'llama3.2';

if (!SUPABASE_KEY) {
  console.error('❌ SUPABASE_ANON_KEY requis');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const args = process.argv.slice(2);
const getArg = (name, defaultVal) => {
  const arg = args.find(a => a.startsWith(`--${name}=`));
  return arg ? arg.split('=')[1] : defaultVal;
};
const hasFlag = (name) => args.includes(`--${name}`);

const LIMIT = parseInt(getArg('limit', '100'));
const OFFSET = parseInt(getArg('offset', '0'));
const DRY_RUN = hasFlag('dry-run');

async function checkOllama() {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`);
    if (!res.ok) throw new Error('Ollama non disponible');
    console.log('✅ Ollama connecté');
    return true;
  } catch (err) {
    console.error('❌ Ollama non disponible. Lancez: ollama serve');
    return false;
  }
}

async function translate(text, targetLang) {
  const langName = { en: 'English', es: 'Spanish' }[targetLang];

  const prompt = `Translate this French music video description to ${langName}.

RULES:
- Keep all song titles in quotes exactly as they are (don't translate them)
- Keep all artist/band names exactly as they are
- Keep music genre names in their original form when commonly used (punk, ska, rock, metal, hardcore, etc.)
- Translate naturally, maintaining the tone and style

French text:
${text}

${langName} translation:`;

  const res = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      prompt,
      stream: false,
      options: { temperature: 0.3 },
    }),
  });

  if (!res.ok) throw new Error(`Ollama error: ${await res.text()}`);
  const data = await res.json();
  let result = data.response?.trim() || '';

  // Clean up common LLM prefixes
  result = result
    .replace(/^Here's the translated description:\s*/i, '')
    .replace(/^Here is the translation:\s*/i, '')
    .replace(/^Translation:\s*/i, '')
    .replace(/^English translation:\s*/i, '')
    .replace(/^Spanish translation:\s*/i, '')
    .trim();

  return result;
}

async function processVideo(video) {
  console.log(`\n📹 ${video.title?.substring(0, 50)}...`);
  console.log(`   FR: ${video.description?.substring(0, 60)}...`);

  try {
    // Translate to English
    console.log('   🇬🇧 Traduction EN...');
    const descEn = await translate(video.description, 'en');
    console.log(`   ✓ EN: ${descEn.substring(0, 60)}...`);

    // Translate to Spanish
    console.log('   🇪🇸 Traduction ES...');
    const descEs = await translate(video.description, 'es');
    console.log(`   ✓ ES: ${descEs.substring(0, 60)}...`);

    if (DRY_RUN) {
      console.log('   🏃 Dry run - pas de sauvegarde');
      return true;
    }

    // Save to Supabase
    const { error } = await supabase
      .from('videos')
      .update({
        description_en: descEn,
        description_es: descEs,
        updated_at: new Date().toISOString(),
      })
      .eq('id', video.id);

    if (error) {
      if (error.message.includes('column')) {
        console.log('   ⚠️  Colonnes description_en/es non trouvées');
        console.log('   💡 Les traductions ne seront pas sauvegardées');
        return false;
      }
      throw error;
    }

    console.log('   ✅ Sauvegardé!');
    return true;
  } catch (err) {
    console.error(`   ❌ Erreur: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log('🌐 Traduction des descriptions vidéo\n');
  console.log(`   Modèle: ${MODEL}`);
  console.log(`   Limit: ${LIMIT}, Offset: ${OFFSET}`);
  console.log(`   Dry-run: ${DRY_RUN}\n`);

  if (!await checkOllama()) {
    process.exit(1);
  }

  // Get videos with FR description but missing translations
  console.log('\n📥 Chargement des vidéos...');

  const { data: videos, error } = await supabase
    .from('videos')
    .select('id, title, description')
    .eq('status', 'approved')
    .not('description', 'is', null)
    .neq('description', '')
    .order('updated_at', { ascending: false })
    .range(OFFSET, OFFSET + LIMIT - 1);

  if (error) {
    console.error(`❌ Erreur: ${error.message}`);
    process.exit(1);
  }

  console.log(`   Trouvé: ${videos.length} vidéos à traduire\n`);

  let success = 0;
  let failed = 0;

  for (const video of videos) {
    const result = await processVideo(video);
    if (result) success++;
    else failed++;

    // Pause between videos
    await new Promise(r => setTimeout(r, 300));
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 Résumé:');
  console.log(`   ✅ Traduits: ${success}`);
  console.log(`   ❌ Échecs: ${failed}`);
  console.log('='.repeat(50));
}

main().catch(console.error);
