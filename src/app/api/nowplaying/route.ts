import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const station = searchParams.get('station') || '5'; // Station par défaut
  
  // URL de votre API AzuraCast
  const azuracastUrl = `https://stream.kracradio.com/api/nowplaying/${station}`;
  
  console.log(`🔄 Proxy request: /api/nowplaying?station=${station} → ${azuracastUrl}`);
  
  try {
    const response = await fetch(azuracastUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'RadioMontreal/1.0',
        'Cache-Control': 'no-cache'
      },
      // Pas de cache pour avoir les données en temps réel
      cache: 'no-store'
    });

    if (!response.ok) {
      console.error(`❌ AzuraCast API error: ${response.status} ${response.statusText}`);
      throw new Error(`AzuraCast API error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ Success for station ${station}:`, data.now_playing?.song?.title || 'No title');
    
    // Retourner les données avec headers CORS corrects
    return NextResponse.json(data, {
      status: 200,
      headers: {
        // Headers CORS pour permettre les requêtes depuis votre frontend
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type, Accept',
        
        // Pas de cache pour avoir les données fraîches
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        
        // Type de contenu
        'Content-Type': 'application/json'
      }
    });
    
  } catch (error) {
    console.error('❌ Proxy error:', error);
    
    // En cas d'erreur, retourner une structure minimale
    const fallbackData = {
      station: {
        name: `Station ${station}`,
        listen_url: `https://stream.kracradio.com/listen/station${station}/radio.mp3`
      },
      listeners: { total: 0 },
      live: { is_live: false, streamer_name: '' },
      now_playing: {
        song: {
          title: 'Service temporairement indisponible',
          artist: 'Radio Montréal',
          album: '',
          art: ''
        },
        elapsed: 0,
        duration: 0
      },
      error: true,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
    
    return NextResponse.json(fallbackData, {
      status: 200, // 200 pour éviter d'autres erreurs côté client
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      }
    });
  }
}

// Support des requêtes OPTIONS pour CORS preflight
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept',
      'Access-Control-Max-Age': '86400', // Cache preflight 24h
    }
  });
}