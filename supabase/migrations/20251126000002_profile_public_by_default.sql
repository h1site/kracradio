-- Set is_public to true by default for new profiles
ALTER TABLE profiles ALTER COLUMN is_public SET DEFAULT true;

-- Update existing profiles to be public by default (if they haven't explicitly set it)
-- Only update profiles that are currently private and have never been modified
UPDATE profiles
SET is_public = true
WHERE is_public = false
  AND artist_slug IS NULL;

-- Update the handle_new_user function to set is_public = true by default
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, is_public, preferred_language)
  VALUES (
    new.id,
    new.email,
    true,
    COALESCE(new.raw_user_meta_data->>'preferred_language', 'fr')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
