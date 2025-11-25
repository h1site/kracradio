-- Add preferred_language column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'en';

-- Add check constraint for valid languages (drop first if exists to make idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'profiles' AND constraint_name = 'valid_language'
  ) THEN
    ALTER TABLE profiles
    ADD CONSTRAINT valid_language CHECK (preferred_language IN ('en', 'fr', 'es') OR preferred_language IS NULL);
  END IF;
END $$;
