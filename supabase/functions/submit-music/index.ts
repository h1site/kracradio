// supabase/functions/submit-music/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const DROPBOX_ACCESS_TOKEN = Deno.env.get('DROPBOX_ACCESS_TOKEN');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse form data
    const formData = await req.formData();
    const artistName = formData.get('artistName') as string;
    const genre = formData.get('genre') as string;
    const userEmail = formData.get('userEmail') as string;
    const userId = formData.get('userId') as string;

    if (!artistName || !genre) {
      return new Response(
        JSON.stringify({ error: 'Artist name and genre are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!DROPBOX_ACCESS_TOKEN) {
      console.error('DROPBOX_ACCESS_TOKEN not configured');
      return new Response(
        JSON.stringify({ error: 'Dropbox not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create folder name: reception/ArtistName - Genre
    const folderPath = `/reception/${artistName} - ${genre}`;

    // Upload each file to Dropbox
    const uploadedFiles = [];
    let fileIndex = 0;

    while (true) {
      const file = formData.get(`file${fileIndex}`) as File;
      if (!file) break;

      console.log(`Uploading file: ${file.name} (${file.size} bytes)`);

      // Read file as ArrayBuffer
      const fileBuffer = await file.arrayBuffer();

      // Upload to Dropbox
      const dropboxResponse = await fetch('https://content.dropboxapi.com/2/files/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${DROPBOX_ACCESS_TOKEN}`,
          'Content-Type': 'application/octet-stream',
          'Dropbox-API-Arg': JSON.stringify({
            path: `${folderPath}/${file.name}`,
            mode: 'add',
            autorename: true,
            mute: false
          })
        },
        body: fileBuffer
      });

      if (!dropboxResponse.ok) {
        const errorText = await dropboxResponse.text();
        console.error('Dropbox upload failed:', errorText);
        throw new Error(`Dropbox upload failed: ${errorText}`);
      }

      const dropboxResult = await dropboxResponse.json();
      uploadedFiles.push({
        name: file.name,
        path: dropboxResult.path_display,
        size: file.size
      });

      fileIndex++;
    }

    // Log submission to Supabase (optional)
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

      await supabase.from('music_submissions').insert({
        user_id: userId,
        artist_name: artistName,
        genre: genre,
        files: uploadedFiles,
        dropbox_folder: folderPath,
        status: 'pending',
        submitted_at: new Date().toISOString()
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Music submitted successfully',
        filesUploaded: uploadedFiles.length,
        dropboxFolder: folderPath
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in submit-music function:', error);

    // Send email notification to admin about the error
    try {
      const formData = await req.formData();
      const artistName = formData.get('artistName') as string;
      const userEmail = formData.get('userEmail') as string;

      const emailBody = `
Une erreur est survenue lors de la soumission de musique sur KracRadio.

Détails:
- Artiste: ${artistName || 'Non fourni'}
- Email utilisateur: ${userEmail || 'Non fourni'}
- Erreur: ${error.message}
- Date: ${new Date().toISOString()}

Veuillez vérifier les logs et corriger le problème.
      `.trim();

      // Send email using Resend API or another email service
      const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
      if (RESEND_API_KEY) {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'KracRadio <noreply@kracradio.com>',
            to: ['info@h1site.com'],
            subject: '🚨 Erreur - Soumission de musique KracRadio',
            text: emailBody,
          }),
        });
      }
    } catch (emailError) {
      console.error('Failed to send error notification email:', emailError);
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
