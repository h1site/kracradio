// Test simple pour debug
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve((req) => {
  const url = new URL(req.url);
  const audioUrl = url.searchParams.get('url');

  return new Response(JSON.stringify({
    message: 'Audio proxy test',
    receivedUrl: audioUrl,
    method: req.method,
    fullUrl: req.url
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
});
