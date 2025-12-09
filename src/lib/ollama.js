// src/lib/ollama.js
// Ollama AI service for enriching video descriptions

const OLLAMA_BASE_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';

/**
 * Check if Ollama server is running
 */
export async function isOllamaAvailable() {
  try {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * List available Ollama models
 */
export async function listModels() {
  try {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
    if (!res.ok) throw new Error('Failed to fetch models');
    const data = await res.json();
    return data.models || [];
  } catch (err) {
    console.error('[Ollama] Error listing models:', err);
    return [];
  }
}

/**
 * Generate text using Ollama
 */
export async function generate({ prompt, model = DEFAULT_MODEL, options = {} }) {
  const res = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      options: {
        temperature: 0.7,
        top_p: 0.9,
        ...options,
      },
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Ollama error: ${error}`);
  }

  const data = await res.json();
  return data.response;
}

/**
 * Enrich a video description with AI
 * @param {Object} params
 * @param {string} params.title - Video title
 * @param {string} params.currentDescription - Current description (may be empty)
 * @param {string} params.genres - Video genres
 * @param {string} params.language - Target language (fr, en, es)
 * @param {string} params.model - Ollama model to use
 */
export async function enrichVideoDescription({
  title,
  currentDescription = '',
  genres = '',
  language = 'fr',
  model = DEFAULT_MODEL,
}) {
  const langName = {
    fr: 'French',
    en: 'English',
    es: 'Spanish',
  }[language] || 'French';

  const prompt = `You are a music video description writer for KracRadio, a Caribbean and World Music radio station.

Write an engaging, SEO-friendly description for this music video in ${langName}.

Video Title: ${title}
${genres ? `Genres: ${genres}` : ''}
${currentDescription ? `Current Description: ${currentDescription}` : ''}

Requirements:
- Write 2-3 paragraphs (150-250 words total)
- Be engaging and descriptive
- Include relevant music-related keywords for SEO
- Mention the artist if the title includes their name
- If genres are provided, weave them naturally into the description
- If there's a current description, expand and improve upon it
- Do NOT include hashtags or emojis
- Write ONLY the description text, no titles or headers
- Write in ${langName}

Description:`;

  const response = await generate({ prompt, model, options: { temperature: 0.8 } });

  // Clean up the response
  return response
    .trim()
    .replace(/^["']|["']$/g, '') // Remove leading/trailing quotes
    .replace(/^Description:\s*/i, ''); // Remove "Description:" prefix if present
}

/**
 * Generate SEO tags for a video
 */
export async function generateVideoTags({
  title,
  description = '',
  genres = '',
  model = DEFAULT_MODEL,
}) {
  const prompt = `Generate 5-8 relevant SEO tags for this music video. Return ONLY comma-separated tags, nothing else.

Title: ${title}
${genres ? `Genres: ${genres}` : ''}
${description ? `Description: ${description.substring(0, 200)}` : ''}

Tags:`;

  const response = await generate({ prompt, model, options: { temperature: 0.5 } });

  return response
    .trim()
    .split(',')
    .map(tag => tag.trim().toLowerCase())
    .filter(tag => tag.length > 0 && tag.length < 30);
}

/**
 * Translate a video description
 */
export async function translateDescription({
  description,
  targetLanguage,
  model = DEFAULT_MODEL,
}) {
  const langName = {
    fr: 'French',
    en: 'English',
    es: 'Spanish',
  }[targetLanguage] || 'French';

  const prompt = `Translate the following music video description to ${langName}. Keep the same tone and style. Return ONLY the translated text.

Original:
${description}

Translation:`;

  const response = await generate({ prompt, model, options: { temperature: 0.3 } });

  return response.trim();
}
