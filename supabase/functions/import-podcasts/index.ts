// supabase/functions/import-podcasts/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface PodcastEpisode {
  title: string;
  description?: string;
  audio_url: string;
  image_url?: string;
  duration_seconds?: number;
  pub_date?: string;
  guid?: string;
  episode_number?: number;
  season_number?: number;
}

// Parse RSS/XML using basic text parsing (Deno doesn't have DOMParser by default)
async function parseRssFeed(rssUrl: string): Promise<{ episodes: PodcastEpisode[], channelImage?: string, channelDescription?: string }> {
  try {
    const response = await fetch(rssUrl);
    const xmlText = await response.text();

    const episodes: PodcastEpisode[] = [];

    // Extract channel-level metadata
    const channelMatch = xmlText.match(/<channel>([\s\S]*?)<\/channel>/i);
    const channelXml = channelMatch ? channelMatch[1] : '';

    const channelImageMatch = channelXml.match(/<image><url>(.*?)<\/url><\/image>|<itunes:image[^>]+href=["']([^"']+)["'][^>]*>/i);
    const channelImage = channelImageMatch?.[1] || channelImageMatch?.[2] || undefined;

    const channelDescMatch = channelXml.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>|<description>(.*?)<\/description>/i);
    const channelDescription = channelDescMatch?.[1] || channelDescMatch?.[2] || undefined;

    // Extract items using regex (simple approach for RSS)
    const itemMatches = xmlText.matchAll(/<item>([\s\S]*?)<\/item>/gi);

    for (const match of itemMatches) {
      const itemXml = match[1];

      // Extract fields
      const title = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/i)?.[1] ||
                    itemXml.match(/<title>(.*?)<\/title>/i)?.[1] || '';

      const description = itemXml.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>|<description>(.*?)<\/description>/i)?.[1] ||
                          itemXml.match(/<description>(.*?)<\/description>/i)?.[1] || '';

      const enclosureMatch = itemXml.match(/<enclosure[^>]+url=["']([^"']+)["'][^>]*>/i);
      const audioUrl = enclosureMatch?.[1] || '';

      const imageMatch = itemXml.match(/<itunes:image[^>]+href=["']([^"']+)["'][^>]*>|<image><url>(.*?)<\/url><\/image>/i);
      const imageUrl = imageMatch?.[1] || imageMatch?.[2] || '';

      const durationMatch = itemXml.match(/<itunes:duration>(.*?)<\/itunes:duration>/i);
      let durationSeconds = 0;
      if (durationMatch) {
        const dur = durationMatch[1];
        // Format peut être HH:MM:SS ou MM:SS ou juste des secondes
        const parts = dur.split(':').map(Number);
        if (parts.length === 3) {
          durationSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
        } else if (parts.length === 2) {
          durationSeconds = parts[0] * 60 + parts[1];
        } else {
          durationSeconds = parseInt(dur) || 0;
        }
      }

      const pubDateMatch = itemXml.match(/<pubDate>(.*?)<\/pubDate>/i);
      const pubDate = pubDateMatch?.[1] || '';

      const guidMatch = itemXml.match(/<guid[^>]*>(.*?)<\/guid>/i);
      const guid = guidMatch?.[1] || '';

      const episodeMatch = itemXml.match(/<itunes:episode>(.*?)<\/itunes:episode>/i);
      const episodeNumber = episodeMatch ? parseInt(episodeMatch[1]) : undefined;

      const seasonMatch = itemXml.match(/<itunes:season>(.*?)<\/itunes:season>/i);
      const seasonNumber = seasonMatch ? parseInt(seasonMatch[1]) : undefined;

      if (title && audioUrl) {
        episodes.push({
          title: title.trim(),
          description: description.trim(),
          audio_url: audioUrl.trim(),
          image_url: imageUrl ? imageUrl.trim() : undefined,
          duration_seconds: durationSeconds || undefined,
          pub_date: pubDate ? new Date(pubDate).toISOString() : undefined,
          guid: guid.trim() || undefined,
          episode_number: episodeNumber,
          season_number: seasonNumber,
        });
      }
    }

    return { episodes, channelImage, channelDescription };
  } catch (error) {
    console.error('Error parsing RSS:', error);
    return { episodes: [] };
  }
}

serve(async (req) => {
  try {
    // Vérifier l'authentification (optionnel, peut être appelé par un cron)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Récupérer tous les podcasts actifs
    const { data: podcasts, error: podcastsError } = await supabaseClient
      .from('user_podcasts')
      .select('*')
      .eq('is_active', true);

    if (podcastsError) {
      throw podcastsError;
    }

    const results = [];

    // Pour chaque podcast, parser le RSS et importer les épisodes
    for (const podcast of podcasts || []) {
      try {
        console.log(`Importing podcast: ${podcast.title} (${podcast.rss_url})`);

        const { episodes, channelImage, channelDescription } = await parseRssFeed(podcast.rss_url);

        // Mettre à jour l'image et la description du podcast si elles n'existent pas
        const updates: any = {};
        if (channelImage && !podcast.image_url) {
          updates.image_url = channelImage;
        }
        if (channelDescription && !podcast.description) {
          updates.description = channelDescription;
        }

        if (Object.keys(updates).length > 0) {
          await supabaseClient
            .from('user_podcasts')
            .update(updates)
            .eq('id', podcast.id);

          console.log(`Updated podcast metadata for ${podcast.title}:`, updates);
        }

        // Insérer ou mettre à jour les épisodes
        let imported = 0;
        let skipped = 0;

        for (const episode of episodes) {
          const { error } = await supabaseClient
            .from('podcast_episodes')
            .upsert(
              {
                podcast_id: podcast.id,
                ...episode,
              },
              {
                onConflict: 'podcast_id,guid',
                ignoreDuplicates: true,
              }
            );

          if (error) {
            console.error(`Error importing episode: ${episode.title}`, error);
            skipped++;
          } else {
            imported++;
          }
        }

        // Mettre à jour last_fetched_at
        await supabaseClient
          .from('user_podcasts')
          .update({ last_fetched_at: new Date().toISOString() })
          .eq('id', podcast.id);

        results.push({
          podcast_id: podcast.id,
          podcast_title: podcast.title,
          total_episodes: episodes.length,
          imported,
          skipped,
        });
      } catch (error) {
        console.error(`Error processing podcast ${podcast.title}:`, error);
        results.push({
          podcast_id: podcast.id,
          podcast_title: podcast.title,
          error: error.message,
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        total_podcasts: podcasts?.length || 0,
        results,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in import-podcasts function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
