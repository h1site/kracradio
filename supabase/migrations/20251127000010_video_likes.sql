-- Create video_likes table
CREATE TABLE IF NOT EXISTS video_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, video_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_video_likes_user_id ON video_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_video_likes_video_id ON video_likes(video_id);
CREATE INDEX IF NOT EXISTS idx_video_likes_created_at ON video_likes(created_at);

-- Enable RLS
ALTER TABLE video_likes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view all video likes"
  ON video_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can add their own video likes"
  ON video_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own video likes"
  ON video_likes FOR DELETE
  USING (auth.uid() = user_id);
