-- Migration: Set default username and artist_slug for new users
-- Username derived from email (before @), artist_slug = username by default
-- Profile is public by default, users can change their artist_slug later

-- Update the handle_new_user function to generate username and artist_slug
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  counter INT := 0;
BEGIN
  -- Extract username from email (part before @)
  base_username := LOWER(SPLIT_PART(new.email, '@', 1));

  -- Remove special characters, keep only alphanumeric and underscores
  base_username := REGEXP_REPLACE(base_username, '[^a-z0-9_]', '', 'g');

  -- Ensure minimum length
  IF LENGTH(base_username) < 3 THEN
    base_username := 'user' || SUBSTRING(new.id::TEXT, 1, 8);
  END IF;

  -- Truncate if too long
  base_username := SUBSTRING(base_username, 1, 20);

  -- Check for uniqueness and add number if needed
  final_username := base_username;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username OR artist_slug = final_username) LOOP
    counter := counter + 1;
    final_username := base_username || counter::TEXT;
  END LOOP;

  INSERT INTO public.profiles (id, email, username, artist_slug, is_public, preferred_language)
  VALUES (
    new.id,
    new.email,
    final_username,
    final_username,
    true,
    COALESCE(new.raw_user_meta_data->>'preferred_language', 'fr')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    -- Only set username/artist_slug if they are null
    username = COALESCE(profiles.username, EXCLUDED.username),
    artist_slug = COALESCE(profiles.artist_slug, EXCLUDED.artist_slug),
    updated_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also update existing users who don't have a username or artist_slug
DO $$
DECLARE
  r RECORD;
  base_username TEXT;
  final_username TEXT;
  counter INT;
BEGIN
  FOR r IN
    SELECT id, email FROM profiles
    WHERE (username IS NULL OR artist_slug IS NULL)
    AND email IS NOT NULL
  LOOP
    -- Extract username from email
    base_username := LOWER(SPLIT_PART(r.email, '@', 1));
    base_username := REGEXP_REPLACE(base_username, '[^a-z0-9_]', '', 'g');

    IF LENGTH(base_username) < 3 THEN
      base_username := 'user' || SUBSTRING(r.id::TEXT, 1, 8);
    END IF;

    base_username := SUBSTRING(base_username, 1, 20);

    -- Check for uniqueness
    counter := 0;
    final_username := base_username;
    WHILE EXISTS (
      SELECT 1 FROM profiles
      WHERE (username = final_username OR artist_slug = final_username)
      AND id != r.id
    ) LOOP
      counter := counter + 1;
      final_username := base_username || counter::TEXT;
    END LOOP;

    -- Update the profile
    UPDATE profiles
    SET
      username = COALESCE(username, final_username),
      artist_slug = COALESCE(artist_slug, final_username),
      is_public = COALESCE(is_public, true)
    WHERE id = r.id;
  END LOOP;
END $$;
