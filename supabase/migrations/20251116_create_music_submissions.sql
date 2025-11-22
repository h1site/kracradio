-- Migration: Create music_submissions table
-- Created: 2025-11-16
-- Purpose: Track music submissions from artists via Submit Music page

CREATE TABLE music_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  artist_name TEXT NOT NULL,
  genre TEXT NOT NULL,
  files JSONB NOT NULL,
  dropbox_folder TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT
);

-- Indexes for fast queries
CREATE INDEX idx_music_submissions_user_id ON music_submissions(user_id);
CREATE INDEX idx_music_submissions_status ON music_submissions(status);
CREATE INDEX idx_music_submissions_submitted_at ON music_submissions(submitted_at DESC);

-- Enable RLS
ALTER TABLE music_submissions ENABLE ROW LEVEL SECURITY;

-- Users can view their own submissions
CREATE POLICY "Users can view their own submissions"
ON music_submissions FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Admins can view all submissions
CREATE POLICY "Admins can view all submissions"
ON music_submissions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Admins can update submissions (approve/reject, add notes)
CREATE POLICY "Admins can update submissions"
ON music_submissions FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Verify the table was created
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'music_submissions'
ORDER BY ordinal_position;
