-- Create videos table if not exists
CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  youtube_url TEXT NOT NULL,
  youtube_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  artist_name TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id)
);

-- Create video_likes table
CREATE TABLE IF NOT EXISTS video_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(video_id, user_id),
  UNIQUE(video_id, session_id)
);

-- Create video_comments table
CREATE TABLE IF NOT EXISTS video_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  username TEXT NOT NULL,
  avatar_url TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_videos_status ON videos(status);
CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos(user_id);
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_video_likes_video_id ON video_likes(video_id);
CREATE INDEX IF NOT EXISTS idx_video_likes_created_at ON video_likes(created_at);
CREATE INDEX IF NOT EXISTS idx_video_comments_video_id ON video_comments(video_id);

-- Enable RLS
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_comments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Anyone can view approved videos" ON videos;
DROP POLICY IF EXISTS "Users can view their own videos" ON videos;
DROP POLICY IF EXISTS "Users can insert their own videos" ON videos;
DROP POLICY IF EXISTS "Users can update their own pending videos" ON videos;
DROP POLICY IF EXISTS "Users can delete their own videos" ON videos;
DROP POLICY IF EXISTS "Admins can do everything on videos" ON videos;
DROP POLICY IF EXISTS "View videos policy" ON videos;

-- Videos policies - combined SELECT policy
CREATE POLICY "View videos policy" ON videos
  FOR SELECT USING (
    status = 'approved'
    OR auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE POLICY "Users can insert their own videos" ON videos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending videos" ON videos
  FOR UPDATE USING (
    (auth.uid() = user_id AND status = 'pending')
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE POLICY "Users can delete their own videos" ON videos
  FOR DELETE USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- Video likes policies
DROP POLICY IF EXISTS "Anyone can view video likes" ON video_likes;
DROP POLICY IF EXISTS "Anyone can insert video likes" ON video_likes;
DROP POLICY IF EXISTS "Users can delete their own likes" ON video_likes;

CREATE POLICY "Anyone can view video likes" ON video_likes
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert video likes" ON video_likes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can delete their own likes" ON video_likes
  FOR DELETE USING (auth.uid() = user_id OR session_id IS NOT NULL);

-- Video comments policies
DROP POLICY IF EXISTS "Anyone can view video comments" ON video_comments;
DROP POLICY IF EXISTS "Authenticated users can insert comments" ON video_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON video_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON video_comments;
DROP POLICY IF EXISTS "Admins can do everything on comments" ON video_comments;

CREATE POLICY "Anyone can view video comments" ON video_comments
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert comments" ON video_comments
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own comments" ON video_comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users and admins can delete comments" ON video_comments
  FOR DELETE USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );
