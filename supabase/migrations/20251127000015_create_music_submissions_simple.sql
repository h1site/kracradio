-- Drop existing table if it exists (clean slate)
DROP TABLE IF EXISTS music_submissions CASCADE;

-- Create music_submissions table
CREATE TABLE music_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  submission_title TEXT NOT NULL,
  artist_name TEXT NOT NULL,
  description TEXT,
  genres TEXT NOT NULL,
  file_count INTEGER NOT NULL DEFAULT 0,
  dropbox_folder_path TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id)
);

-- Create indexes for better query performance
CREATE INDEX idx_music_submissions_user_id ON music_submissions(user_id);
CREATE INDEX idx_music_submissions_status ON music_submissions(status);
CREATE INDEX idx_music_submissions_created_at ON music_submissions(created_at);

-- Enable RLS
ALTER TABLE music_submissions ENABLE ROW LEVEL SECURITY;

-- Policies
-- Users can view their own submissions
CREATE POLICY "Users can view own music submissions"
  ON music_submissions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own submissions
CREATE POLICY "Users can create music submissions"
  ON music_submissions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending submissions
CREATE POLICY "Users can update own pending submissions"
  ON music_submissions FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- Users can delete their own pending submissions
CREATE POLICY "Users can delete own pending submissions"
  ON music_submissions FOR DELETE
  USING (auth.uid() = user_id AND status = 'pending');

-- Admins can view all submissions
CREATE POLICY "Admins can view all music submissions"
  ON music_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can update any submission (for review/approval)
CREATE POLICY "Admins can update music submissions"
  ON music_submissions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can delete any submission
CREATE POLICY "Admins can delete music submissions"
  ON music_submissions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_music_submissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_music_submissions_updated_at
  BEFORE UPDATE ON music_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_music_submissions_updated_at();
