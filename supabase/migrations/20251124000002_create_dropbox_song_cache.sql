-- Migration: Create dropbox_song_cache table
-- Purpose: Cache Dropbox URLs for liked songs to avoid repeated API searches

CREATE TABLE IF NOT EXISTS public.dropbox_song_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  song_title TEXT NOT NULL,
  song_artist TEXT NOT NULL,
  dropbox_path TEXT,              -- Path in Dropbox (null if not found)
  dropbox_url TEXT,               -- Direct download URL (null if not found)
  matched BOOLEAN DEFAULT false,  -- True if file was found in Dropbox
  search_query TEXT,              -- Query used to find it (for debugging)
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  -- Ensure unique combination of title and artist
  UNIQUE(song_title, song_artist)
);

-- Index for fast lookups by title and artist
CREATE INDEX IF NOT EXISTS idx_dropbox_cache_lookup
  ON public.dropbox_song_cache(song_title, song_artist);

-- Index for finding matched songs
CREATE INDEX IF NOT EXISTS idx_dropbox_cache_matched
  ON public.dropbox_song_cache(matched) WHERE matched = true;

-- Enable RLS
ALTER TABLE public.dropbox_song_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Anyone can read cache, only service role can write
DROP POLICY IF EXISTS "Anyone can read dropbox cache" ON public.dropbox_song_cache;
CREATE POLICY "Anyone can read dropbox cache"
  ON public.dropbox_song_cache
  FOR SELECT
  USING (true);

-- Grant permissions
GRANT SELECT ON public.dropbox_song_cache TO anon, authenticated;
GRANT ALL ON public.dropbox_song_cache TO service_role;

-- Add comment
COMMENT ON TABLE public.dropbox_song_cache IS 'Cache for Dropbox song URLs to speed up liked songs playback';
