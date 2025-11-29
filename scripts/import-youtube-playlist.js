// scripts/import-youtube-playlist.js
// Import videos from a YouTube playlist into Supabase
// Usage: node scripts/import-youtube-playlist.js

const ytpl = require('ytpl');
const { createClient } = require('@supabase/supabase-js');

// Supabase config - use environment variables or hardcode for one-time use
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://gpcedzaflhiucwyjgdai.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// The playlist URL
const PLAYLIST_URL = 'https://www.youtube.com/playlist?list=PLeDakahyfrO-4kuBioL5ZAoy4j6aCnzWy';

// KracRadio admin user ID - we need to find this
const KRACRADIO_USER_ID = null; // Will be fetched from profiles

async function main() {
  if (!SUPABASE_SERVICE_KEY) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
    console.log('Run with: SUPABASE_SERVICE_ROLE_KEY=your_key node scripts/import-youtube-playlist.js');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  console.log('🎬 Fetching playlist from YouTube...');

  try {
    // Fetch playlist
    const playlist = await ytpl(PLAYLIST_URL, { limit: Infinity });
    console.log(`📺 Found ${playlist.items.length} videos in playlist: ${playlist.title}`);

    // Find KracRadio admin user
    const { data: adminUser, error: adminError } = await supabase
      .from('profiles')
      .select('id, username, role')
      .eq('role', 'admin')
      .limit(1)
      .single();

    if (adminError || !adminUser) {
      console.error('❌ Could not find admin user:', adminError);
      process.exit(1);
    }

    console.log(`👤 Using admin user: ${adminUser.username} (${adminUser.id})`);

    // Get existing videos to avoid duplicates
    const { data: existingVideos } = await supabase
      .from('videos')
      .select('youtube_id');

    const existingIds = new Set((existingVideos || []).map(v => v.youtube_id));
    console.log(`📊 ${existingIds.size} videos already in database`);

    // Prepare videos for insertion
    const videosToInsert = [];
    let skipped = 0;

    for (const item of playlist.items) {
      if (existingIds.has(item.id)) {
        skipped++;
        continue;
      }

      videosToInsert.push({
        user_id: adminUser.id,
        youtube_url: item.shortUrl || `https://www.youtube.com/watch?v=${item.id}`,
        youtube_id: item.id,
        title: item.title,
        description: null, // ytpl doesn't provide full descriptions
        thumbnail_url: item.bestThumbnail?.url || item.thumbnails?.[0]?.url || null,
        artist_name: item.author?.name || null,
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: adminUser.id
      });
    }

    console.log(`⏭️  Skipped ${skipped} existing videos`);
    console.log(`📥 Inserting ${videosToInsert.length} new videos...`);

    if (videosToInsert.length === 0) {
      console.log('✅ No new videos to insert');
      return;
    }

    // Insert in batches of 50
    const batchSize = 50;
    let inserted = 0;

    for (let i = 0; i < videosToInsert.length; i += batchSize) {
      const batch = videosToInsert.slice(i, i + batchSize);

      const { data, error } = await supabase
        .from('videos')
        .insert(batch)
        .select();

      if (error) {
        console.error(`❌ Error inserting batch ${i / batchSize + 1}:`, error);
      } else {
        inserted += data.length;
        console.log(`✅ Inserted batch ${Math.floor(i / batchSize) + 1}: ${data.length} videos`);
      }
    }

    console.log(`\n🎉 Done! Inserted ${inserted} videos total`);

    // List inserted videos
    console.log('\n📋 Videos added:');
    videosToInsert.forEach((v, i) => {
      console.log(`  ${i + 1}. ${v.title}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
