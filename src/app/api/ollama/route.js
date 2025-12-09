// src/app/api/ollama/route.js
// API endpoint for Ollama AI video description enrichment

import {
  isOllamaAvailable,
  listModels,
  enrichVideoDescription,
  generateVideoTags,
  translateDescription,
} from '../../../lib/ollama';

/**
 * GET /api/ollama - Check status and list models
 */
export async function GET() {
  try {
    const available = await isOllamaAvailable();

    if (!available) {
      return Response.json({
        available: false,
        error: 'Ollama server is not running. Start it with: ollama serve',
      });
    }

    const models = await listModels();

    return Response.json({
      available: true,
      models: models.map(m => ({
        name: m.name,
        size: m.size,
        modified: m.modified_at,
      })),
    });
  } catch (error) {
    console.error('[API/Ollama] GET error:', error);
    return Response.json({
      available: false,
      error: error.message,
    }, { status: 500 });
  }
}

/**
 * POST /api/ollama - Generate or enrich content
 *
 * Body:
 * - action: 'enrich' | 'tags' | 'translate'
 * - title: Video title (required for enrich/tags)
 * - description: Current description
 * - genres: Video genres
 * - language: Target language (fr, en, es)
 * - model: Ollama model to use (optional)
 * - targetLanguage: For translate action
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { action, title, description, genres, language, model, targetLanguage } = body;

    // Check if Ollama is available
    const available = await isOllamaAvailable();
    if (!available) {
      return Response.json({
        success: false,
        error: 'Ollama server is not running. Start it with: ollama serve',
      }, { status: 503 });
    }

    let result;

    switch (action) {
      case 'enrich':
        if (!title) {
          return Response.json({
            success: false,
            error: 'Title is required for enrichment',
          }, { status: 400 });
        }

        result = await enrichVideoDescription({
          title,
          currentDescription: description,
          genres,
          language: language || 'fr',
          model,
        });

        return Response.json({
          success: true,
          description: result,
        });

      case 'tags':
        if (!title) {
          return Response.json({
            success: false,
            error: 'Title is required for tag generation',
          }, { status: 400 });
        }

        result = await generateVideoTags({
          title,
          description,
          genres,
          model,
        });

        return Response.json({
          success: true,
          tags: result,
        });

      case 'translate':
        if (!description || !targetLanguage) {
          return Response.json({
            success: false,
            error: 'Description and targetLanguage are required for translation',
          }, { status: 400 });
        }

        result = await translateDescription({
          description,
          targetLanguage,
          model,
        });

        return Response.json({
          success: true,
          translation: result,
        });

      default:
        return Response.json({
          success: false,
          error: `Unknown action: ${action}. Use 'enrich', 'tags', or 'translate'`,
        }, { status: 400 });
    }
  } catch (error) {
    console.error('[API/Ollama] POST error:', error);
    return Response.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
