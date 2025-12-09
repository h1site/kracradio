#!/usr/bin/env node
/**
 * Script local pour enrichir les descriptions de vidéos avec Ollama
 * et les traduire en 3 langues (FR, EN, ES)
 *
 * Usage: node scripts/enrich-videos.mjs [--limit=10] [--offset=0] [--force]
 *
 * Options:
 *   --limit=N   Nombre de vidéos à traiter (défaut: 10)
 *   --offset=N  Décalage pour pagination (défaut: 0)
 *   --force     Réécrire même si description existe déjà
 *   --dry-run   Afficher sans sauvegarder
 */

import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://gpcedzaflhiucwyjgdai.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const MODEL = process.env.OLLAMA_MODEL || 'llama3.2';

if (!SUPABASE_KEY) {
  console.error('❌ SUPABASE_SERVICE_KEY ou SUPABASE_ANON_KEY requis');
  console.error('   Export: export SUPABASE_SERVICE_KEY="votre_clé"');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Parse arguments
const args = process.argv.slice(2);
const getArg = (name, defaultVal) => {
  const arg = args.find(a => a.startsWith(`--${name}=`));
  return arg ? arg.split('=')[1] : defaultVal;
};
const hasFlag = (name) => args.includes(`--${name}`);

const LIMIT = parseInt(getArg('limit', '10'));
const OFFSET = parseInt(getArg('offset', '0'));
const FORCE = hasFlag('force');
const DRY_RUN = hasFlag('dry-run');

// Vérifier Ollama
async function checkOllama() {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`);
    if (!res.ok) throw new Error('Ollama non disponible');
    const data = await res.json();
    console.log(`✅ Ollama connecté - Modèles: ${data.models?.map(m => m.name).join(', ')}`);
    return true;
  } catch (err) {
    console.error('❌ Ollama non disponible. Lancez: ollama serve');
    return false;
  }
}

// Générer avec Ollama
async function generate(prompt, options = {}) {
  const res = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      prompt,
      stream: false,
      options: {
        temperature: options.temperature || 0.7,
        top_p: 0.9,
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`Ollama error: ${await res.text()}`);
  }

  const data = await res.json();
  return data.response?.trim() || '';
}

// Enrichir description
async function enrichDescription(title, currentDesc, genres) {
  const prompt = `Tu es un rédacteur de descriptions de vidéos musicales pour KracRadio, une radio de musique caribéenne et du monde.

Écris une description engageante et optimisée SEO pour ce clip vidéo.

Titre de la vidéo: "${title}"

Consignes:
- Écris 2-3 paragraphes (150-200 mots au total)
- Mentionne l'artiste et le titre de la chanson
- Décris le style musical et l'ambiance de la vidéo
- Utilise des mots-clés pertinents pour le référencement
- N'utilise PAS de hashtags ni d'emojis
- Écris UNIQUEMENT le texte de la description, sans titre
- Écris en français

Description:`;

  const response = await generate(prompt, { temperature: 0.8 });
  return response.replace(/^["']|["']$/g, '').replace(/^Description:\s*/i, '');
}

// Traduire description
async function translateDescription(description, targetLang) {
  const langName = { en: 'English', es: 'Spanish' }[targetLang];

  const prompt = `Translate the following music video description to ${langName}. Keep the same tone and style. Return ONLY the translated text, nothing else.

Original (French):
${description}

Translation in ${langName}:`;

  const response = await generate(prompt, { temperature: 0.3 });
  return response.trim();
}

// Traiter une vidéo
async function processVideo(video) {
  console.log(`\n📹 ${video.title}`);
  console.log(`   ID: ${video.id}`);
  console.log(`   Description actuelle: ${video.description ? video.description.substring(0, 50) + '...' : 'Aucune'}`);

  // Vérifier si déjà une description
  if (!FORCE && video.description && video.description.length > 100) {
    console.log('   ⏭️  Déjà une description, skip (utilisez --force pour réécrire)');
    return null;
  }

  try {
    // 1. Enrichir en français
    console.log('   🇫🇷 Génération description FR...');
    const descFr = await enrichDescription(video.title, video.description, '');
    console.log(`   ✓ FR: ${descFr.substring(0, 80)}...`);

    // 2. Traduire en anglais
    console.log('   🇬🇧 Traduction EN...');
    const descEn = await translateDescription(descFr, 'en');
    console.log(`   ✓ EN: ${descEn.substring(0, 80)}...`);

    // 3. Traduire en espagnol
    console.log('   🇪🇸 Traduction ES...');
    const descEs = await translateDescription(descFr, 'es');
    console.log(`   ✓ ES: ${descEs.substring(0, 80)}...`);

    if (DRY_RUN) {
      console.log('   🏃 Dry run - pas de sauvegarde');
      return { descFr, descEn, descEs };
    }

    // 4. Sauvegarder dans Supabase
    console.log('   💾 Sauvegarde...');

    // Essayer avec les colonnes de traduction, sinon juste description
    let updateData = {
      description: descFr,
      updated_at: new Date().toISOString(),
    };

    // Tenter d'ajouter les traductions (si les colonnes existent)
    try {
      const { error: testError } = await supabase
        .from('videos')
        .update({
          description: descFr,
          description_fr: descFr,
          description_en: descEn,
          description_es: descEs,
          updated_at: new Date().toISOString(),
        })
        .eq('id', video.id);

      if (testError && testError.message.includes('column')) {
        // Colonnes n'existent pas, sauvegarder juste description
        console.log('   ⚠️  Colonnes traduction non trouvées, sauvegarde FR uniquement');
        console.log('   💡 Exécutez: scripts/add-video-translations.sql dans Supabase');

        const { error: fallbackError } = await supabase
          .from('videos')
          .update(updateData)
          .eq('id', video.id);

        if (fallbackError) throw fallbackError;
      } else if (testError) {
        throw testError;
      }
    } catch (err) {
      // Fallback: juste description
      const { error: fallbackError } = await supabase
        .from('videos')
        .update(updateData)
        .eq('id', video.id);

      if (fallbackError) {
        console.error(`   ❌ Erreur Supabase: ${fallbackError.message}`);
        return null;
      }
    }

    console.log('   ✅ Sauvegardé!');
    return { descFr, descEn, descEs };

  } catch (err) {
    console.error(`   ❌ Erreur: ${err.message}`);
    return null;
  }
}

// Main
async function main() {
  console.log('🎬 Enrichissement des descriptions vidéo avec Ollama\n');
  console.log(`   Modèle: ${MODEL}`);
  console.log(`   Limit: ${LIMIT}, Offset: ${OFFSET}`);
  console.log(`   Force: ${FORCE}, Dry-run: ${DRY_RUN}\n`);

  // Vérifier Ollama
  if (!await checkOllama()) {
    process.exit(1);
  }

  // Récupérer les vidéos
  console.log('\n📥 Chargement des vidéos...');

  let query = supabase
    .from('videos')
    .select('id, title, description')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .range(OFFSET, OFFSET + LIMIT - 1);

  // Si pas force, prendre celles sans description
  if (!FORCE) {
    query = query.or('description.is.null,description.eq.');
  }

  const { data: videos, error } = await query;

  if (error) {
    console.error(`❌ Erreur Supabase: ${error.message}`);
    process.exit(1);
  }

  console.log(`   Trouvé: ${videos.length} vidéos à traiter\n`);

  if (videos.length === 0) {
    console.log('✅ Aucune vidéo à traiter!');
    return;
  }

  // Traiter chaque vidéo
  let success = 0;
  let failed = 0;
  let skipped = 0;

  for (const video of videos) {
    const result = await processVideo(video);
    if (result === null && !FORCE) {
      skipped++;
    } else if (result) {
      success++;
    } else {
      failed++;
    }

    // Petite pause entre chaque vidéo
    await new Promise(r => setTimeout(r, 500));
  }

  console.log('\n' + '='.repeat(50));
  console.log(`📊 Résumé:`);
  console.log(`   ✅ Succès: ${success}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❌ Échecs: ${failed}`);
  console.log('='.repeat(50));
}

main().catch(console.error);
