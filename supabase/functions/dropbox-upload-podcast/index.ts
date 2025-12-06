// supabase/functions/dropbox-upload-podcast/index.ts
// Deploy with: supabase functions deploy dropbox-upload-podcast

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const DROPBOX_REFRESH_TOKEN = Deno.env.get("DROPBOX_REFRESH_TOKEN");
const DROPBOX_APP_KEY = Deno.env.get("DROPBOX_APP_KEY");
const DROPBOX_APP_SECRET = Deno.env.get("DROPBOX_APP_SECRET");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Get a fresh access token using the refresh token
async function getAccessToken(): Promise<string> {
  const response = await fetch("https://api.dropboxapi.com/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: DROPBOX_REFRESH_TOKEN!,
      client_id: DROPBOX_APP_KEY!,
      client_secret: DROPBOX_APP_SECRET!,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Token refresh error:", errorText);
    throw new Error(`Failed to refresh Dropbox token: ${response.status}`);
  }

  const data = await response.json();
  return data.access_token;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!DROPBOX_REFRESH_TOKEN || !DROPBOX_APP_KEY || !DROPBOX_APP_SECRET) {
      throw new Error("Dropbox credentials not configured (DROPBOX_REFRESH_TOKEN, DROPBOX_APP_KEY, DROPBOX_APP_SECRET)");
    }

    // Get fresh access token
    const accessToken = await getAccessToken();

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const folder = formData.get("folder") as string;

    if (!file) {
      throw new Error("No file provided");
    }

    if (!folder) {
      throw new Error("No folder specified");
    }

    // Read file content
    const fileBuffer = await file.arrayBuffer();
    const fileBytes = new Uint8Array(fileBuffer);

    // Clean filename (remove special characters)
    const cleanFilename = file.name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9._-]/g, "_");

    // Upload to Dropbox in podcasts/{folder}/
    const dropboxPath = `/podcasts/${folder}/${cleanFilename}`;

    const uploadResponse = await fetch("https://content.dropboxapi.com/2/files/upload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/octet-stream",
        "Dropbox-API-Arg": JSON.stringify({
          path: dropboxPath,
          mode: "overwrite",
          autorename: true,
          mute: false,
        }),
      },
      body: fileBytes,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error("Dropbox upload error:", errorText);
      throw new Error(`Dropbox upload failed: ${uploadResponse.status}`);
    }

    const result = await uploadResponse.json();

    return new Response(
      JSON.stringify({
        success: true,
        path: result.path_display,
        filename: cleanFilename,
        size: result.size,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
