// supabase/functions/dropbox-upload-submission/index.ts
// Upload store submission files directly to Dropbox when artist submits (before admin approval)
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

// Base folder for store submissions (pending approval)
const STORE_SUBMISSION_FOLDER = '/store-approval';

// Get fresh Dropbox access token
async function getDropboxAccessToken(): Promise<string> {
  if (DROPBOX_REFRESH_TOKEN && DROPBOX_APP_KEY && DROPBOX_APP_SECRET) {
    console.log('Getting fresh Dropbox access token...');
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
    console.log('Got fresh access token');
    return data.access_token;
  }

  if (DROPBOX_ACCESS_TOKEN) {
    console.log('Using legacy access token');
    return DROPBOX_ACCESS_TOKEN;
  }

  throw new Error('No Dropbox credentials configured');
}

// Sanitize filename for Dropbox
function sanitizeFilename(name: string): string {
  return name
    .replace(/[<>:"/\\|?*]/g, '_')  // Invalid chars
    .replace(/\s+/g, ' ')           // Multiple spaces
    .trim();
}

// Create folder in Dropbox if it doesn't exist
async function ensureFolderExists(accessToken: string, folderPath: string): Promise<void> {
  console.log('Ensuring folder exists:', folderPath);

  const response = await fetch('https://api.dropboxapi.com/2/files/create_folder_v2', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      path: folderPath,
      autorename: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    // Ignore "path/conflict/folder" error - folder already exists
    if (!errorText.includes('path/conflict/folder')) {
      console.log('Folder creation response:', errorText);
    } else {
      console.log('Folder already exists');
    }
  } else {
    console.log('Folder created successfully');
  }
}

// Upload file buffer to Dropbox
async function uploadFileToDropbox(
  accessToken: string,
  fileBuffer: ArrayBuffer,
  dropboxPath: string
): Promise<{ path: string; url: string } | null> {
  console.log('Uploading to Dropbox:', dropboxPath, '- Size:', fileBuffer.byteLength);

  const uploadResponse = await fetch('https://content.dropboxapi.com/2/files/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Dropbox-API-Arg': JSON.stringify({
        path: dropboxPath,
        mode: 'overwrite',
        autorename: false,
        mute: true,
      }),
      'Content-Type': 'application/octet-stream',
    },
    body: fileBuffer,
  });

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    console.error('Dropbox upload failed:', errorText);
    return null;
  }

  const uploadResult = await uploadResponse.json();
  console.log('Upload successful:', uploadResult.path_display);

  // Create a shared link for the file
  const shareableUrl = await createShareableLink(accessToken, uploadResult.path_display);

  return {
    path: uploadResult.path_display,
    url: shareableUrl,
  };
}

// Create shareable link for a file
async function createShareableLink(accessToken: string, path: string): Promise<string> {
  console.log('Creating shareable link for:', path);

  // First check for existing links
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
    if (listData.links?.length > 0) {
      return convertToDirectUrl(listData.links[0].url);
    }
  }

  // Create new shared link
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

    // Handle "already exists" error
    if (createResponse.status === 409) {
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.error?.shared_link_already_exists?.metadata?.url) {
          return convertToDirectUrl(errorData.error.shared_link_already_exists.metadata.url);
        }
      } catch {}
    }

    // Fallback to temporary link
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
      console.log('Using temporary link (expires in 4h)');
      return tempData.link;
    }

    throw new Error(`Failed to create shareable link for ${path}`);
  }

  const createData = await createResponse.json();
  return convertToDirectUrl(createData.url);
}

// Convert Dropbox URL to direct download URL
function convertToDirectUrl(url: string): string {
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
    // Verify authorization (any authenticated user can upload)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Verify user is authenticated
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User authenticated:', user.email);

    // Parse FormData (direct file upload)
    const formData = await req.formData();
    const artistName = formData.get('artist_name') as string;
    const trackTitle = formData.get('track_title') as string;
    const audioFile = formData.get('audio_file') as File | null;
    const coverFile = formData.get('cover_file') as File | null;

    if (!artistName || !trackTitle) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields (artist_name, track_title)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing submission upload for:', artistName, '-', trackTitle);
    console.log('Audio file:', audioFile?.name, audioFile?.size);
    console.log('Cover file:', coverFile?.name, coverFile?.size);

    // Get Dropbox access token
    const accessToken = await getDropboxAccessToken();

    // Create artist folder path
    const artistFolder = `${STORE_SUBMISSION_FOLDER}/${sanitizeFilename(artistName)}`;
    await ensureFolderExists(accessToken, STORE_SUBMISSION_FOLDER);
    await ensureFolderExists(accessToken, artistFolder);

    const results: {
      audio_dropbox_url?: string;
      audio_dropbox_path?: string;
      cover_dropbox_url?: string;
      cover_dropbox_path?: string;
    } = {};

    // Upload audio file if provided
    if (audioFile && audioFile.size > 0) {
      const audioFilename = `${sanitizeFilename(artistName)} - ${sanitizeFilename(trackTitle)}.mp3`;
      const audioPath = `${artistFolder}/${audioFilename}`;
      const audioBuffer = await audioFile.arrayBuffer();

      const audioResult = await uploadFileToDropbox(accessToken, audioBuffer, audioPath);
      if (audioResult) {
        results.audio_dropbox_url = audioResult.url;
        results.audio_dropbox_path = audioResult.path;
        console.log('Audio uploaded:', audioResult.url);
      }
    }

    // Upload cover image if provided
    if (coverFile && coverFile.size > 0) {
      // Get file extension from filename
      const coverExt = coverFile.name.match(/\.(jpg|jpeg|png|webp|gif)$/i)?.[1] || 'jpg';
      const coverFilename = `${sanitizeFilename(artistName)} - ${sanitizeFilename(trackTitle)} - cover.${coverExt}`;
      const coverPath = `${artistFolder}/${coverFilename}`;
      const coverBuffer = await coverFile.arrayBuffer();

      const coverResult = await uploadFileToDropbox(accessToken, coverBuffer, coverPath);
      if (coverResult) {
        results.cover_dropbox_url = coverResult.url;
        results.cover_dropbox_path = coverResult.path;
        console.log('Cover uploaded:', coverResult.url);
      }
    }

    // Check if at least one file was uploaded
    if (!results.audio_dropbox_url && !results.cover_dropbox_url) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No files were uploaded. Please provide audio or cover files.'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Files uploaded to Dropbox',
        ...results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in dropbox-upload-submission:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
