// src/app/api/validate-rss/route.js
// Server-side RSS validation to bypass CORS restrictions

export async function POST(request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return Response.json({ valid: false, error: 'URL is required' }, { status: 400 });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return Response.json({ valid: false, error: 'Invalid URL format' }, { status: 400 });
    }

    // Fetch the RSS feed server-side (bypasses CORS)
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'KracRadio/1.0 RSS Validator',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      return Response.json({
        valid: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      });
    }

    const contentType = response.headers.get('content-type') || '';
    const xmlText = await response.text();

    // Basic validation - check for RSS/Atom feed structure
    const isRss = xmlText.includes('<rss') || xmlText.includes('<feed');
    const hasChannel = xmlText.includes('<channel') || xmlText.includes('<feed');
    const hasItems = xmlText.includes('<item') || xmlText.includes('<entry');

    if (!isRss) {
      return Response.json({
        valid: false,
        error: 'Not a valid RSS/Atom feed (missing <rss> or <feed> element)',
      });
    }

    if (!hasChannel) {
      return Response.json({
        valid: false,
        error: 'Feed missing <channel> or <feed> element',
      });
    }

    if (!hasItems) {
      return Response.json({
        valid: false,
        error: 'Feed has no episodes (<item> or <entry> elements)',
      });
    }

    // Extract metadata from the feed
    let feedTitle = '';
    let feedImage = '';
    let feedDescription = '';
    let feedAuthor = '';
    let feedWebsite = '';
    let episodeCount = 0;

    // Try to extract title
    const titleMatch = xmlText.match(/<title[^>]*>([^<]+)<\/title>/);
    if (titleMatch) {
      feedTitle = titleMatch[1].replace(/<!?\[CDATA\[|\]\]>/g, '').trim();
    }

    // Try to extract image
    const imageMatch = xmlText.match(/<itunes:image[^>]*href=["']([^"']+)["']/);
    if (imageMatch) {
      feedImage = imageMatch[1];
    } else {
      const urlMatch = xmlText.match(/<image>[\s\S]*?<url>([^<]+)<\/url>/);
      if (urlMatch) {
        feedImage = urlMatch[1].trim();
      }
    }

    // Try to extract description
    const descMatch = xmlText.match(/<description[^>]*>([\s\S]*?)<\/description>/);
    if (descMatch) {
      feedDescription = descMatch[1]
        .replace(/<!?\[CDATA\[|\]\]>/g, '')
        .replace(/<[^>]+>/g, '') // Remove HTML tags
        .trim()
        .slice(0, 500); // Limit to 500 chars
    }

    // Try to extract author
    const authorMatch = xmlText.match(/<itunes:author[^>]*>([^<]+)<\/itunes:author>/);
    if (authorMatch) {
      feedAuthor = authorMatch[1].replace(/<!?\[CDATA\[|\]\]>/g, '').trim();
    } else {
      const managingEditorMatch = xmlText.match(/<managingEditor[^>]*>([^<]+)<\/managingEditor>/);
      if (managingEditorMatch) {
        feedAuthor = managingEditorMatch[1].replace(/<!?\[CDATA\[|\]\]>/g, '').trim();
      }
    }

    // Try to extract website link
    const linkMatch = xmlText.match(/<link[^>]*>([^<]+)<\/link>/);
    if (linkMatch) {
      feedWebsite = linkMatch[1].trim();
    }

    // Count episodes
    episodeCount = (xmlText.match(/<item[^>]*>/g) || []).length;
    if (episodeCount === 0) {
      episodeCount = (xmlText.match(/<entry[^>]*>/g) || []).length;
    }

    return Response.json({
      valid: true,
      feedTitle,
      feedImage,
      feedDescription,
      feedAuthor,
      feedWebsite,
      episodeCount,
      message: `Feed validated: "${feedTitle}" with ${episodeCount} episodes`,
    });

  } catch (error) {
    console.error('RSS validation error:', error);

    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      return Response.json({
        valid: false,
        error: 'Request timeout - the server took too long to respond',
      });
    }

    return Response.json({
      valid: false,
      error: error.message || 'Failed to validate RSS feed',
    });
  }
}
