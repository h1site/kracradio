// supabase/functions/audio-proxy/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  // Gérer CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Range, Content-Type',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  try {
    const url = new URL(req.url);
    const audioUrl = url.searchParams.get('url');

    if (!audioUrl) {
      return new Response('Missing url parameter', { status: 400 });
    }

    console.log('[Audio Proxy] Fetching:', audioUrl);

    // Copier les headers de range pour le streaming
    const headers = new Headers();
    const rangeHeader = req.headers.get('range');
    if (rangeHeader) {
      headers.set('Range', rangeHeader);
    }

    // Fetch l'audio depuis la source originale
    const response = await fetch(audioUrl, {
      headers,
      redirect: 'follow', // Suivre les redirections (podtrac)
    });

    if (!response.ok) {
      console.error('[Audio Proxy] Fetch failed:', response.status, response.statusText);
      return new Response(`Failed to fetch audio: ${response.statusText}`, {
        status: response.status,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        },
      });
    }

    // Créer les headers de réponse avec CORS
    const responseHeaders = new Headers({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Range, Content-Type',
      'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges',
    });

    // Copier les headers importants de la réponse originale
    const importantHeaders = [
      'content-type',
      'content-length',
      'content-range',
      'accept-ranges',
      'cache-control',
      'etag',
      'last-modified',
    ];

    for (const header of importantHeaders) {
      const value = response.headers.get(header);
      if (value) {
        responseHeaders.set(header, value);
      }
    }

    console.log('[Audio Proxy] Success, content-type:', response.headers.get('content-type'));

    // Retourner le stream audio avec CORS activé
    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('[Audio Proxy] Error:', error);
    return new Response(`Proxy error: ${error.message}`, {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
});
