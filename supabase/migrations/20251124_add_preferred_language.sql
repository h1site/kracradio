-- Add preferred_language column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'en';

-- Add check constraint for valid languages
ALTER TABLE profiles
ADD CONSTRAINT valid_language CHECK (preferred_language IN ('en', 'fr', 'es') OR preferred_language IS NULL);
