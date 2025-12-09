#!/usr/bin/env node
/**
 * Exporte toutes les vidéos en fichiers JSON de 100 chaque
 * Format: { id, title, description: "" }
 *
 * Usage: node scripts/export-videos-json.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://gpcedzaflhiucwyjgdai.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_KEY) {
  console.error('❌ SUPABASE_ANON_KEY requis');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const BATCH_SIZE = 100;
const OUTPUT_DIR = join(__dirname, 'video-exports');

async function main() {
  console.log('📥 Chargement de toutes les vidéos...\n');

  // Récupérer toutes les vidéos approuvées
  const { data: videos, error } = await supabase
    .from('videos')
    .select('id, title')
    .eq('status', 'approved')
    .order('created_at', { ascending: false });

  if (error) {
    console.error(`❌ Erreur: ${error.message}`);
    process.exit(1);
  }

  console.log(`✅ ${videos.length} vidéos trouvées\n`);

  // Créer le dossier de sortie
  mkdirSync(OUTPUT_DIR, { recursive: true });

  // Diviser en lots de 100
  const batches = [];
  for (let i = 0; i < videos.length; i += BATCH_SIZE) {
    batches.push(videos.slice(i, i + BATCH_SIZE));
  }

  console.log(`📦 ${batches.length} fichiers à créer\n`);

  // Créer chaque fichier JSON
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const filename = `videos-batch-${String(i + 1).padStart(2, '0')}.json`;
    const filepath = join(OUTPUT_DIR, filename);

    // Formater les vidéos avec description vide
    const formattedVideos = batch.map(video => ({
      id: video.id,
      title: video.title,
      description: ""
    }));

    writeFileSync(filepath, JSON.stringify(formattedVideos, null, 2));
    console.log(`✅ ${filename} (${batch.length} vidéos)`);
  }

  console.log(`\n🎉 Terminé! Fichiers créés dans: ${OUTPUT_DIR}`);
  console.log('\n📝 Format pour ChatGPT:');
  console.log('   Chaque fichier contient un tableau JSON avec:');
  console.log('   { "id": "...", "title": "...", "description": "" }');
  console.log('\n   Demande à ChatGPT de remplir le champ "description" avec');
  console.log('   une description courte et factuelle (sans inventer de faits).');
}

main().catch(console.error);
