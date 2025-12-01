// src/utils/podcastRssParser.js
import { SUPABASE_FUNCTIONS_URL } from '../lib/supabaseClient';

/**
 * Enveloppe une URL audio avec le proxy Supabase pour contourner CORS
 */
function wrapWithProxy(audioUrl) {
  if (!audioUrl || !SUPABASE_FUNCTIONS_URL) {
    return audioUrl;
  }

  // Si l'URL est déjà un proxy, ne pas la wrapper à nouveau
  if (audioUrl.includes('/functions/v1/audio-proxy')) {
    return audioUrl;
  }

  return `${SUPABASE_FUNCTIONS_URL}/audio-proxy?url=${encodeURIComponent(audioUrl)}`;
}

/**
 * Nettoie le HTML d'une description
 */
function stripHtml(html) {
  if (!html) return '';
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

/**
 * Parse un flux RSS de podcast et retourne les épisodes
 */
export async function parseRssFeed(rssUrl) {
  try {
    console.log('[RSS Parser] Fetching:', rssUrl);
    const response = await fetch(rssUrl);
    const xmlText = await response.text();
    console.log('[RSS Parser] Response length:', xmlText.length);

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

    // Vérifier les erreurs de parsing
    const parseError = xmlDoc.querySelector('parsererror');
    if (parseError) {
      console.error('[RSS Parser] Parse error:', parseError.textContent);
      throw new Error('Erreur de parsing XML');
    }

    // Extraire l'image du podcast (channel level)
    const channelImage = xmlDoc.querySelector('channel > image > url')?.textContent?.trim() ||
                         xmlDoc.getElementsByTagNameNS('*', 'image')[0]?.getAttribute('href') || '';

    // Extraire la description du podcast (channel level)
    let channelDescription = xmlDoc.querySelector('channel > description')?.textContent?.trim() || '';
    if (!channelDescription) {
      channelDescription = xmlDoc.querySelector('channel')?.getElementsByTagNameNS('*', 'summary')[0]?.textContent?.trim() || '';
    }
    if (!channelDescription) {
      channelDescription = xmlDoc.querySelector('channel')?.getElementsByTagNameNS('*', 'subtitle')[0]?.textContent?.trim() || '';
    }
    // Nettoyer le HTML de la description
    channelDescription = stripHtml(channelDescription);

    const items = xmlDoc.querySelectorAll('item');
    console.log('[RSS Parser] Found items:', items.length);
    console.log('[RSS Parser] Channel image:', channelImage);
    console.log('[RSS Parser] Channel description:', channelDescription?.substring(0, 100) + '...');
    const episodes = [];

    items.forEach((item) => {
      // Titre
      const title = item.querySelector('title')?.textContent?.trim() || '';

      // Description (essayer plusieurs formats et nettoyer le HTML)
      let description = item.querySelector('description')?.textContent?.trim() || '';
      if (!description) {
        description = item.getElementsByTagNameNS('*', 'summary')[0]?.textContent?.trim() || '';
      }
      if (!description) {
        description = item.getElementsByTagNameNS('*', 'subtitle')[0]?.textContent?.trim() || '';
      }
      // Nettoyer le HTML de la description
      description = stripHtml(description);

      // URL audio (enclosure)
      const enclosure = item.querySelector('enclosure');
      const audioUrl = enclosure?.getAttribute('url') || '';

      // Image (essayer namespace itunes, sinon utiliser l'image du channel)
      let imageUrl = '';
      const itunesImageNS = item.getElementsByTagNameNS('*', 'image')[0];
      if (itunesImageNS) {
        imageUrl = itunesImageNS.getAttribute('href') || '';
      }
      if (!imageUrl) {
        imageUrl = item.querySelector('image url')?.textContent?.trim() || '';
      }
      if (!imageUrl) {
        imageUrl = channelImage; // Fallback vers l'image du podcast
      }

      // Durée (namespace itunes)
      const durationElem = item.getElementsByTagNameNS('*', 'duration')[0];
      const durationText = durationElem?.textContent?.trim() || '';
      let durationSeconds = 0;
      if (durationText) {
        const parts = durationText.split(':').map(Number);
        if (parts.length === 3) {
          durationSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
        } else if (parts.length === 2) {
          durationSeconds = parts[0] * 60 + parts[1];
        } else {
          durationSeconds = parseInt(durationText) || 0;
        }
      }

      // Date de publication
      const pubDateText = item.querySelector('pubDate')?.textContent?.trim() || '';
      const pubDate = pubDateText ? new Date(pubDateText).toISOString() : null;

      // GUID (identifiant unique)
      const guid = item.querySelector('guid')?.textContent?.trim() || '';

      // Numéro d'épisode et saison (namespace itunes)
      const episodeElem = item.getElementsByTagNameNS('*', 'episode')[0];
      const seasonElem = item.getElementsByTagNameNS('*', 'season')[0];
      const episodeNumber = episodeElem ? parseInt(episodeElem.textContent) || null : null;
      const seasonNumber = seasonElem ? parseInt(seasonElem.textContent) || null : null;

      if (title && audioUrl) {
        episodes.push({
          title,
          description,
          audio_url: wrapWithProxy(audioUrl), // ← Wrapper l'URL avec le proxy
          image_url: imageUrl || null,
          duration_seconds: durationSeconds || null,
          pub_date: pubDate,
          guid: guid || `${audioUrl}-${pubDate}`, // Fallback GUID
          episode_number: episodeNumber,
          season_number: seasonNumber,
        });
      } else {
        console.log('[RSS Parser] Skipped item - title:', title, 'audioUrl:', audioUrl);
      }
    });

    console.log('[RSS Parser] Total episodes parsed:', episodes.length);
    return { episodes, channelImage, channelDescription };
  } catch (error) {
    console.error('Erreur parsing RSS:', error);
    throw error;
  }
}

/**
 * Importe les épisodes d'un podcast dans Supabase
 */
export async function importPodcastEpisodes(supabase, podcastId, rssUrl) {
  try {
    const { episodes, channelImage, channelDescription } = await parseRssFeed(rssUrl);

    let imported = 0;
    let skipped = 0;
    const errors = [];

    // Mettre à jour l'image et la description du podcast si elles n'existent pas
    const { data: podcast } = await supabase
      .from('user_podcasts')
      .select('image_url, description')
      .eq('id', podcastId)
      .single();

    if (podcast) {
      const updates = {};
      if (channelImage && !podcast.image_url) {
        updates.image_url = channelImage;
      }
      if (channelDescription && !podcast.description) {
        updates.description = channelDescription;
      }

      if (Object.keys(updates).length > 0) {
        await supabase
          .from('user_podcasts')
          .update(updates)
          .eq('id', podcastId);

        console.log('[RSS Parser] Updated podcast metadata:', updates);
      }
    }

    for (const episode of episodes) {
      try {
        const { error } = await supabase
          .from('podcast_episodes')
          .upsert(
            {
              podcast_id: podcastId,
              ...episode,
            },
            {
              onConflict: 'podcast_id,guid',
              ignoreDuplicates: false,
            }
          );

        if (error) {
          console.error(`Erreur import épisode: ${episode.title}`, error);
          skipped++;
          errors.push({ episode: episode.title, error: error.message });
        } else {
          imported++;
        }
      } catch (err) {
        console.error(`Exception import épisode: ${episode.title}`, err);
        skipped++;
        errors.push({ episode: episode.title, error: err.message });
      }
    }

    // Mettre à jour last_fetched_at
    await supabase
      .from('user_podcasts')
      .update({ last_fetched_at: new Date().toISOString() })
      .eq('id', podcastId);

    return {
      success: true,
      total: episodes.length,
      imported,
      skipped,
      errors,
    };
  } catch (error) {
    console.error('Erreur importPodcastEpisodes:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Parse les métadonnées d'un podcast depuis son flux RSS
 * @returns {title, description, coverImage, author, episodes}
 */
export async function parsePodcastMetadata(rssUrl) {
  try {
    console.log('[RSS Parser] Fetching metadata from:', rssUrl);
    const response = await fetch(rssUrl);
    const xmlText = await response.text();

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

    const parseError = xmlDoc.querySelector('parsererror');
    if (parseError) {
      throw new Error('Erreur de parsing XML');
    }

    const channel = xmlDoc.querySelector('channel');
    if (!channel) {
      throw new Error('Flux RSS invalide - pas de channel trouvé');
    }

    // Titre
    const title = channel.querySelector('title')?.textContent?.trim() || 'Podcast sans titre';

    // Description
    let description = channel.querySelector('description')?.textContent?.trim() || '';
    if (!description) {
      description = channel.getElementsByTagNameNS('*', 'summary')[0]?.textContent?.trim() || '';
    }
    if (!description) {
      description = channel.getElementsByTagNameNS('*', 'subtitle')[0]?.textContent?.trim() || '';
    }
    // Nettoyer le HTML
    description = stripHtml(description);

    // Image
    let coverImage = channel.querySelector('image > url')?.textContent?.trim() || '';
    if (!coverImage) {
      const itunesImage = channel.getElementsByTagNameNS('*', 'image')[0];
      if (itunesImage) {
        coverImage = itunesImage.getAttribute('href') || '';
      }
    }

    // Auteur/Host
    let author = '';
    const itunesAuthor = channel.getElementsByTagNameNS('*', 'author')[0];
    if (itunesAuthor) {
      author = itunesAuthor.textContent?.trim() || '';
    }
    if (!author) {
      const itunesOwner = channel.getElementsByTagNameNS('*', 'owner')[0];
      if (itunesOwner) {
        const ownerName = itunesOwner.getElementsByTagNameNS('*', 'name')[0];
        author = ownerName?.textContent?.trim() || '';
      }
    }
    if (!author) {
      author = channel.querySelector('managingEditor')?.textContent?.trim() || '';
    }

    // Compter les épisodes
    const items = xmlDoc.querySelectorAll('item');
    const episodeCount = items.length;

    console.log('[RSS Parser] Parsed metadata:', { title, author, episodeCount });

    return {
      title,
      description,
      coverImage,
      author,
      episodeCount,
    };
  } catch (error) {
    console.error('Erreur parsing podcast metadata:', error);
    throw error;
  }
}

/**
 * Importe un podcast externe dans la table user_podcasts (pour admin)
 */
export async function importExternalPodcast(supabase, rssUrl, adminUserId) {
  try {
    // Parser les métadonnées du podcast
    const metadata = await parsePodcastMetadata(rssUrl);

    // Vérifier si le podcast existe déjà
    const { data: existing } = await supabase
      .from('user_podcasts')
      .select('id')
      .eq('rss_url', rssUrl)
      .single();

    if (existing) {
      throw new Error('Ce podcast est déjà importé');
    }

    // Insérer le podcast dans user_podcasts
    const { data, error } = await supabase
      .from('user_podcasts')
      .insert({
        title: metadata.title,
        description: metadata.description,
        image_url: metadata.coverImage,
        author: metadata.author || 'KracRadio',
        rss_url: rssUrl,
        user_id: adminUserId,
        is_active: true,
        is_kracradio_import: true, // Marquer comme importé par KracRadio
      })
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      podcast: data,
      metadata,
    };
  } catch (error) {
    console.error('Erreur importExternalPodcast:', error);
    throw error;
  }
}

/**
 * Importe tous les podcasts actifs d'un utilisateur
 */
export async function importAllUserPodcasts(supabase, userId) {
  try {
    // Récupérer tous les podcasts de l'utilisateur
    const { data: podcasts, error } = await supabase
      .from('user_podcasts')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) throw error;

    const results = [];

    for (const podcast of podcasts || []) {
      const result = await importPodcastEpisodes(supabase, podcast.id, podcast.rss_url);
      results.push({
        podcast_id: podcast.id,
        podcast_title: podcast.title,
        ...result,
      });
    }

    return {
      success: true,
      total_podcasts: podcasts?.length || 0,
      results,
    };
  } catch (error) {
    console.error('Erreur importAllUserPodcasts:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}
