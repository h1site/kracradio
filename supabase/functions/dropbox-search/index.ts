// supabase/functions/dropbox-search/index.ts
// Search Dropbox for songs and cache results for liked songs playback

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Dropbox credentials
const DROPBOX_REFRESH_TOKEN = Deno.env.get('DROPBOX_REFRESH_TOKEN');
const DROPBOX_APP_KEY = Deno.env.get('DROPBOX_APP_KEY');
const DROPBOX_APP_SECRET = Deno.env.get('DROPBOX_APP_SECRET');
const DROPBOX_ACCESS_TOKEN = Deno.env.get('DROPBOX_ACCESS_TOKEN');

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Get fresh Dropbox access token
async function getDropboxAccessToken(): Promise<string> {
  if (DROPBOX_REFRESH_TOKEN && DROPBOX_APP_KEY && DROPBOX_APP_SECRET) {
    const response = await fetch('https://api.dropboxapi.com/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: DROPBOX_REFRESH_TOKEN,
        client_id: DROPBOX_APP_KEY,
        client_secret: DROPBOX_APP_SECRET,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to refresh Dropbox token: ${await response.text()}`);
    }

    const data = await response.json();
    return data.access_token;
  }

  if (DROPBOX_ACCESS_TOKEN) {
    return DROPBOX_ACCESS_TOKEN;
  }

  throw new Error('No Dropbox credentials configured');
}

// Normalize text for fuzzy matching
function normalizeForSearch(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/feat\./gi, 'ft.')
    .replace(/featuring/gi, 'ft.')
    .replace(/&/g, 'and')
    .replace(/[^\w\s]/g, ' ') // Replace special chars with space
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .trim();
}

// Extract featured artists from title (e.g., "Song Feat. Artist2" -> ["Artist2"])
function extractFeaturedArtists(title: string): string[] {
  const featPatterns = [
    /feat\.?\s+([^,\(\)]+)/gi,
    /featuring\s+([^,\(\)]+)/gi,
    /ft\.?\s+([^,\(\)]+)/gi,
    /with\s+([^,\(\)]+)/gi,
    /\(feat\.?\s+([^)]+)\)/gi,
    /\(ft\.?\s+([^)]+)\)/gi,
  ];

  const artists: string[] = [];
  for (const pattern of featPatterns) {
    let match;
    while ((match = pattern.exec(title)) !== null) {
      artists.push(match[1].trim());
    }
  }
  return artists;
}

// Extract clean title without feat. part
function cleanTitle(title: string): string {
  return title
    .replace(/\s*[\(\[]?(feat\.?|featuring|ft\.?|with)\s+[^\)\]]+[\)\]]?/gi, '')
    .trim();
}

// Generate search queries for matching
function generateSearchQueries(title: string, artist: string): string[] {
  const normTitle = normalizeForSearch(title);
  const normArtist = normalizeForSearch(artist);
  const cleanedTitle = cleanTitle(title);
  const featuredArtists = extractFeaturedArtists(title);

  const queries = [
    `${artist} - ${title}`,           // Exact: "Artist - Title"
    `${title} - ${artist}`,           // Exact: "Title - Artist"
    `${artist} ${title}`,             // "Artist Title"
    `${normArtist} ${normTitle}`,     // Normalized combined
    `${artist} - ${cleanedTitle}`,    // Artist - Clean title (no feat.)
    `${artist} ${cleanedTitle}`,      // Artist + clean title
  ];

  // Add queries with featured artists (they might be the main artist in filename)
  for (const featArtist of featuredArtists) {
    queries.push(`${featArtist} - ${cleanedTitle}`);  // FeatArtist - CleanTitle
    queries.push(`${featArtist} ${cleanedTitle}`);    // FeatArtist CleanTitle
    queries.push(`${featArtist} ${artist}`);          // FeatArtist MainArtist
    queries.push(`${artist} ${featArtist}`);          // MainArtist FeatArtist
  }

  // Last resort: individual words
  queries.push(normTitle);            // Title only
  queries.push(cleanedTitle);         // Clean title only

  return queries;
}

// Search Dropbox for a file
async function searchDropbox(accessToken: string, query: string): Promise<any | null> {
  // Try with path first, then without
  const paths = ['/Artists', ''];

  for (const searchPath of paths) {
    const options: any = {
      max_results: 10,
      file_extensions: ['mp3', 'm4a', 'flac', 'wav', 'aac', 'ogg'],
    };

    if (searchPath) {
      options.path = searchPath;
    }

    const response = await fetch('https://api.dropboxapi.com/2/files/search_v2', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: query,
        options: options,
      }),
    });

    if (!response.ok) {
      console.error('Dropbox search failed:', await response.text());
      continue;
    }

    const data = await response.json();
    const match = data.matches?.[0]?.metadata?.metadata;
    if (match) {
      console.log(`Found match in path "${searchPath || 'root'}":`, match.path_display);
      return match;
    }
  }

  return null;
}

// Get or create a shareable link for a file
async function getShareableLink(accessToken: string, path: string): Promise<string | null> {
  console.log('Getting shareable link for:', path);

  // First, try to get existing shared links
  const listResponse = await fetch('https://api.dropboxapi.com/2/sharing/list_shared_links', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      path: path,
      direct_only: true,
    }),
  });

  if (listResponse.ok) {
    const listData = await listResponse.json();
    console.log('Existing links:', listData.links?.length || 0);
    if (listData.links?.length > 0) {
      return convertToDirectUrl(listData.links[0].url);
    }
  } else {
    console.error('List shared links failed:', await listResponse.text());
  }

  // Try to create a new shared link
  const createResponse = await fetch('https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      path: path,
      settings: {
        requested_visibility: 'public',
        audience: 'public',
        access: 'viewer',
      },
    }),
  });

  if (!createResponse.ok) {
    const errorText = await createResponse.text();
    console.error('Create shared link failed:', createResponse.status, errorText);

    // Check if link already exists (409 conflict)
    if (createResponse.status === 409) {
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.error?.shared_link_already_exists?.metadata?.url) {
          return convertToDirectUrl(errorData.error.shared_link_already_exists.metadata.url);
        }
      } catch {}
    }

    // Fallback: try to get a temporary link (works without sharing permissions)
    console.log('Trying temporary link fallback...');
    const tempResponse = await fetch('https://api.dropboxapi.com/2/files/get_temporary_link', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ path }),
    });

    if (tempResponse.ok) {
      const tempData = await tempResponse.json();
      console.log('Got temporary link');
      return tempData.link;
    } else {
      console.error('Temporary link also failed:', await tempResponse.text());
    }

    return null;
  }

  const createData = await createResponse.json();
  console.log('Created shared link successfully');
  return convertToDirectUrl(createData.url);
}

// Convert Dropbox sharing URL to direct download URL
function convertToDirectUrl(url: string): string {
  // https://www.dropbox.com/s/xxx/file.mp3?dl=0
  // → https://dl.dropboxusercontent.com/s/xxx/file.mp3
  return url
    .replace('www.dropbox.com', 'dl.dropboxusercontent.com')
    .replace('?dl=0', '')
    .replace('?dl=1', '');
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { title, artist, action, skipCache } = body;

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Action: clear-cache - Clear all or specific cache entries
    if (action === 'clear-cache') {
      if (title && artist) {
        await supabase.from('dropbox_song_cache').delete().eq('song_title', title).eq('song_artist', artist);
        return new Response(
          JSON.stringify({ success: true, message: `Cleared cache for "${artist} - ${title}"` }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        // Clear all not-found entries
        await supabase.from('dropbox_song_cache').delete().eq('matched', false);
        return new Response(
          JSON.stringify({ success: true, message: 'Cleared all not-found cache entries' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Action: list-folder - List files in a Dropbox folder (for debugging)
    if (action === 'list-folder') {
      const accessToken = await getDropboxAccessToken();
      const folderPath = body.path || '/Artists';

      const response = await fetch('https://api.dropboxapi.com/2/files/list_folder', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: folderPath,
          recursive: false,
          limit: 100,
        }),
      });

      if (!response.ok) {
        return new Response(
          JSON.stringify({ error: 'Failed to list folder', details: await response.text() }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const data = await response.json();
      return new Response(
        JSON.stringify({
          path: folderPath,
          entries: data.entries?.map((e: any) => ({ name: e.name, type: e['.tag'], path: e.path_display })) || [],
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!title || !artist) {
      return new Response(
        JSON.stringify({ error: 'Title and artist are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Searching for: "${artist}" - "${title}"`);

    // Check cache first (unless skipCache is true)
    if (!skipCache) {
      const { data: cached } = await supabase
        .from('dropbox_song_cache')
        .select('*')
        .eq('song_title', title)
        .eq('song_artist', artist)
        .single();

      // Only use cache if we have a valid URL or if it was definitively not found
      if (cached && (cached.dropbox_url || !cached.matched)) {
        console.log('Cache hit for:', title, artist);
        return new Response(
          JSON.stringify({
            found: cached.matched,
            dropbox_url: cached.dropbox_url,
            dropbox_path: cached.dropbox_path,
            cached: true,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else if (cached) {
        // Cache had a match but no URL - delete it and search again
        console.log('Cache had match without URL, re-searching...');
        await supabase.from('dropbox_song_cache').delete().eq('id', cached.id);
      }
    } else {
      // Skip cache - clear existing entry if any
      await supabase.from('dropbox_song_cache').delete().eq('song_title', title).eq('song_artist', artist);
    }

    // Not in cache - search Dropbox
    console.log('Cache miss - searching Dropbox...');
    const accessToken = await getDropboxAccessToken();
    const queries = generateSearchQueries(title, artist);

    let foundFile = null;
    let successfulQuery = '';

    // Try each query until we find a match
    for (const query of queries) {
      console.log(`Trying query: "${query}"`);
      foundFile = await searchDropbox(accessToken, query);
      if (foundFile) {
        successfulQuery = query;
        console.log('Found match:', foundFile.path_display);
        break;
      }
    }

    let dropboxUrl = null;
    let dropboxPath = null;

    if (foundFile) {
      dropboxPath = foundFile.path_display;
      dropboxUrl = await getShareableLink(accessToken, dropboxPath);
      console.log('Shareable URL:', dropboxUrl);
    }

    // Cache the result (even if not found)
    const { error: cacheError } = await supabase
      .from('dropbox_song_cache')
      .upsert({
        song_title: title,
        song_artist: artist,
        dropbox_path: dropboxPath,
        dropbox_url: dropboxUrl,
        matched: !!foundFile,
        search_query: successfulQuery || queries[0],
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'song_title,song_artist',
      });

    if (cacheError) {
      console.error('Failed to cache result:', cacheError);
    }

    return new Response(
      JSON.stringify({
        found: !!foundFile,
        dropbox_url: dropboxUrl,
        dropbox_path: dropboxPath,
        cached: false,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in dropbox-search:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
