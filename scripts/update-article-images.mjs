// Script to update article images with relevant Unsplash photos
// Run with: node scripts/update-article-images.mjs

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Article slug -> relevant Unsplash image
const articleImages = [
  {
    slug: 'liste-des-radios-en-ligne-specialisees-en-musique-independante-francophone',
    // Radio studio with microphone and equipment
    image: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=1200&h=630&fit=crop&auto=format&q=80'
  },
  {
    slug: 'quelles-plateformes-permettent-de-decouvrir-de-la-musique-independante-francophone',
    // Phone with music app / headphones
    image: 'https://images.unsplash.com/photo-1611339555312-e607c8352fd7?w=1200&h=630&fit=crop&auto=format&q=80'
  },
  {
    slug: 'les-meilleurs-services-de-streaming-pour-la-musique-independante-canadienne',
    // Streaming / headphones with phone
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&h=630&fit=crop&auto=format&q=80'
  },
  {
    slug: 'comment-acheter-des-albums-de-musique-independante-en-ligne-au-canada',
    // CD/vinyl collection or music store
    image: 'https://images.unsplash.com/photo-1483412033650-1015ddeb83d1?w=1200&h=630&fit=crop&auto=format&q=80'
  },
  {
    slug: 'ou-trouver-des-boutiques-en-ligne-vendant-des-vinyles-de-musique-independante',
    // Vinyl records collection
    image: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=1200&h=630&fit=crop&auto=format&q=80'
  },
  {
    slug: 'acheter-directement-aupres-des-artistes-independants-guide-complet',
    // Artist performing / indie musician
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&h=630&fit=crop&auto=format&q=80'
  },
  {
    slug: 'ou-trouver-des-billets-pour-des-concerts-de-musique-independante',
    // Concert crowd / live music
    image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1200&h=630&fit=crop&auto=format&q=80'
  }
];

async function updateImages() {
  console.log('Updating article images...\n');

  for (const article of articleImages) {
    const { data, error } = await supabase
      .from('articles')
      .update({
        featured_image: article.image,
        cover_url: article.image,
        updated_at: new Date().toISOString()
      })
      .eq('slug', article.slug)
      .select('title')
      .single();

    if (error) {
      console.log(`❌ Error updating "${article.slug}": ${error.message}`);
    } else if (data) {
      console.log(`✅ Updated: ${data.title}`);
    } else {
      console.log(`⏭️  Not found: ${article.slug}`);
    }
  }

  console.log('\n🎉 Done!');
}

updateImages().catch(console.error);
