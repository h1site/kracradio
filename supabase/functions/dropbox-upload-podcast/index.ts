// supabase/functions/dropbox-upload-podcast/index.ts
// Deploy with: supabase functions deploy dropbox-upload-podcast

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const DROPBOX_ACCESS_TOKEN = Deno.env.get("DROPBOX_ACCESS_TOKEN");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!DROPBOX_ACCESS_TOKEN) {
      throw new Error("DROPBOX_ACCESS_TOKEN not configured");
    }

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
        Authorization: `Bearer ${DROPBOX_ACCESS_TOKEN}`,
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
