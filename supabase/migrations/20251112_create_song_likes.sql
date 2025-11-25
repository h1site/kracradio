-- Create song_likes table
CREATE TABLE IF NOT EXISTS public.song_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_key TEXT NOT NULL,
  channel_name TEXT NOT NULL,
  song_title TEXT NOT NULL,
  song_artist TEXT NOT NULL,
  album_art TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Ensure a user can only like a song once per channel
  UNIQUE(user_id, channel_key, song_title, song_artist)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_song_likes_user_id ON public.song_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_song_likes_channel_key ON public.song_likes(channel_key);
CREATE INDEX IF NOT EXISTS idx_song_likes_created_at ON public.song_likes(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.song_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies (drop if exists, then create)
DROP POLICY IF EXISTS "Users can view their own likes" ON public.song_likes;
CREATE POLICY "Users can view their own likes"
  ON public.song_likes
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own likes" ON public.song_likes;
CREATE POLICY "Users can insert their own likes"
  ON public.song_likes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own likes" ON public.song_likes;
CREATE POLICY "Users can delete their own likes"
  ON public.song_likes
  FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can view like counts" ON public.song_likes;
CREATE POLICY "Anyone can view like counts"
  ON public.song_likes
  FOR SELECT
  USING (true);

-- Grant permissions
GRANT SELECT, INSERT, DELETE ON public.song_likes TO authenticated;
GRANT SELECT ON public.song_likes TO anon;
