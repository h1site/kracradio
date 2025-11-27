-- Migration: Ensure the trigger for new user profile creation exists
-- This fixes "Database error saving new user" on registration

-- First, drop the trigger if it exists (to avoid conflicts)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate the handle_new_user function to ensure it's up to date
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
    username = COALESCE(profiles.username, EXCLUDED.username),
    artist_slug = COALESCE(profiles.artist_slug, EXCLUDED.artist_slug),
    updated_at = now();
  RETURN new;
EXCEPTION
  WHEN others THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.profiles TO postgres, service_role;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
