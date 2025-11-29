// supabase/functions/import-youtube-playlist/index.ts
// Import videos from a YouTube playlist into Supabase
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface YouTubePlaylistItem {
  id: string;
  title: string;
  thumbnail: string | null;
  author: string;
}

const DEFAULT_THUMBNAIL = '/images/video-thumbnail-default.svg';

// Extract playlist ID from URL
function extractPlaylistId(url: string): string | null {
  const match = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

// Fetch playlist videos using YouTube's oEmbed and page scraping
// Since we don't have a YouTube API key, we'll use a workaround
async function fetchPlaylistVideos(playlistId: string): Promise<YouTubePlaylistItem[]> {
  const videos: YouTubePlaylistItem[] = [];

  try {
    // Fetch playlist page
    const playlistUrl = `https://www.youtube.com/playlist?list=${playlistId}`;
    const response = await fetch(playlistUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch playlist: ${response.status}`);
    }

    const html = await response.text();

    // Extract video data from initial data JSON embedded in the page
    const ytInitialDataMatch = html.match(/var ytInitialData = ({.*?});<\/script>/s);
    if (!ytInitialDataMatch) {
      // Try alternative pattern
      const altMatch = html.match(/ytInitialData["\s]*[=:]\s*({.*?});/s);
      if (!altMatch) {
        console.log('Could not find ytInitialData in page');
        return videos;
      }
    }

    // Parse all video IDs from the page using multiple patterns
    const videoIdPattern = /"videoId":"([a-zA-Z0-9_-]{11})"/g;
    const foundIds = new Set<string>();
    let match;

    while ((match = videoIdPattern.exec(html)) !== null) {
      foundIds.add(match[1]);
    }

    // Also try to extract video info with titles
    const videoInfoPattern = /"videoId":"([a-zA-Z0-9_-]{11})"[^}]*?"title":\s*\{\s*"runs":\s*\[\s*\{\s*"text":\s*"([^"]+)"/g;
    const videoInfoMap = new Map<string, { title: string }>();

    while ((match = videoInfoPattern.exec(html)) !== null) {
      if (!videoInfoMap.has(match[1])) {
        videoInfoMap.set(match[1], { title: match[2] });
      }
    }

    // For each video ID, try to get info via oEmbed
    for (const videoId of foundIds) {
      try {
        const oembedResponse = await fetch(
          `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
        );

        if (oembedResponse.ok) {
          const data = await oembedResponse.json();
          videos.push({
            id: videoId,
            title: data.title,
            thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
            author: data.author_name
          });
        } else {
          // Fallback to info from page if available
          const info = videoInfoMap.get(videoId);
          if (info) {
            videos.push({
              id: videoId,
              title: info.title,
              thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
              author: 'Unknown'
            });
          }
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (e) {
        console.error(`Failed to fetch info for video ${videoId}:`, e);
      }
    }

    console.log(`Found ${videos.length} videos in playlist`);
    return videos;
  } catch (error) {
    console.error('Error fetching playlist:', error);
    return videos;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { playlistUrl, adminUserId } = await req.json();

    if (!playlistUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing playlistUrl' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const playlistId = extractPlaylistId(playlistUrl);
    if (!playlistId) {
      return new Response(
        JSON.stringify({ error: 'Invalid playlist URL' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get existing video IDs to avoid duplicates
    const { data: existingVideos } = await supabaseAdmin
      .from('videos')
      .select('youtube_id');

    const existingIds = new Set((existingVideos || []).map(v => v.youtube_id));
    console.log(`${existingIds.size} videos already in database`);

    // Fetch playlist videos
    console.log(`Fetching playlist: ${playlistId}`);
    const playlistVideos = await fetchPlaylistVideos(playlistId);

    if (playlistVideos.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          imported: 0,
          skipped: 0,
          message: 'No videos found in playlist or unable to parse playlist'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Filter out existing videos
    const newVideos = playlistVideos.filter(v => !existingIds.has(v.id));
    const skipped = playlistVideos.length - newVideos.length;

    console.log(`Found ${playlistVideos.length} videos, ${skipped} already exist, inserting ${newVideos.length}`);

    if (newVideos.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          imported: 0,
          skipped,
          message: 'All videos already imported'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare videos for insertion
    const videosToInsert = newVideos.map(v => ({
      user_id: adminUserId,
      youtube_url: `https://www.youtube.com/watch?v=${v.id}`,
      youtube_id: v.id,
      title: v.title,
      thumbnail_url: v.thumbnail || DEFAULT_THUMBNAIL,
      artist_name: v.author,
      status: 'approved',
      approved_at: new Date().toISOString(),
      approved_by: adminUserId
    }));

    // Insert in batches
    const batchSize = 50;
    let inserted = 0;

    for (let i = 0; i < videosToInsert.length; i += batchSize) {
      const batch = videosToInsert.slice(i, i + batchSize);

      const { data, error } = await supabaseAdmin
        .from('videos')
        .insert(batch)
        .select();

      if (error) {
        console.error(`Error inserting batch:`, error);
      } else {
        inserted += data?.length || 0;
      }
    }

    console.log(`Successfully imported ${inserted} videos`);

    return new Response(
      JSON.stringify({
        success: true,
        imported: inserted,
        skipped,
        total: playlistVideos.length
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in import-youtube-playlist:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
