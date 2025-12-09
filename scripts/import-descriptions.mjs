#!/usr/bin/env node
/**
 * Importe les descriptions enrichies depuis les fichiers JSON
 *
 * Usage: node scripts/import-descriptions.mjs [fichier.json]
 *        node scripts/import-descriptions.mjs --all
 *
 * Options:
 *   --all       Importer tous les fichiers videos-batch-*.json
 *   --dry-run   Afficher sans sauvegarder
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync } from 'fs';
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

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const IMPORT_ALL = args.includes('--all');

async function importFile(filepath) {
  console.log(`\n📄 Import: ${filepath}`);

  let videos;
  try {
    const content = readFileSync(filepath, 'utf-8');
    videos = JSON.parse(content);
  } catch (err) {
    console.error(`   ❌ Erreur lecture: ${err.message}`);
    return { success: 0, failed: 0, skipped: 0 };
  }

  let success = 0;
  let failed = 0;
  let skipped = 0;

  for (const video of videos) {
    if (!video.id || !video.description || video.description.trim() === '') {
      skipped++;
      continue;
    }

    console.log(`   📹 ${video.title?.substring(0, 50)}...`);

    if (DRY_RUN) {
      console.log(`      Description: ${video.description.substring(0, 80)}...`);
      success++;
      continue;
    }

    try {
      const { error } = await supabase
        .from('videos')
        .update({
          description: video.description,
          updated_at: new Date().toISOString(),
        })
        .eq('id', video.id);

      if (error) {
        console.error(`      ❌ ${error.message}`);
        failed++;
      } else {
        console.log(`      ✅ Sauvegardé`);
        success++;
      }
    } catch (err) {
      console.error(`      ❌ ${err.message}`);
      failed++;
    }

    // Petite pause pour ne pas surcharger
    await new Promise(r => setTimeout(r, 100));
  }

  return { success, failed, skipped };
}

async function main() {
  console.log('📥 Import des descriptions vidéo\n');
  console.log(`   Dry-run: ${DRY_RUN}`);

  let files = [];

  if (IMPORT_ALL) {
    const exportDir = join(__dirname, 'video-exports');
    const allFiles = readdirSync(exportDir);
    files = allFiles
      .filter(f => f.startsWith('videos-batch-') && f.endsWith('.json'))
      .map(f => join(exportDir, f))
      .sort();
    console.log(`   Fichiers trouvés: ${files.length}`);
  } else {
    // Fichiers spécifiés en arguments
    files = args.filter(a => !a.startsWith('--'));
    if (files.length === 0) {
      console.error('\n❌ Usage: node scripts/import-descriptions.mjs [fichier.json] [--dry-run]');
      console.error('         node scripts/import-descriptions.mjs --all [--dry-run]');
      process.exit(1);
    }
  }

  let totalSuccess = 0;
  let totalFailed = 0;
  let totalSkipped = 0;

  for (const file of files) {
    const { success, failed, skipped } = await importFile(file);
    totalSuccess += success;
    totalFailed += failed;
    totalSkipped += skipped;
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 Résumé:');
  console.log(`   ✅ Importés: ${totalSuccess}`);
  console.log(`   ⏭️  Skipped (vides): ${totalSkipped}`);
  console.log(`   ❌ Échecs: ${totalFailed}`);
  console.log('='.repeat(50));
}

main().catch(console.error);
