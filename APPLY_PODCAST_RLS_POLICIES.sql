-- ============================================================
-- FIX PODCAST IMPORT 403 ERRORS
-- ============================================================
-- Run this in Supabase Dashboard > SQL Editor
-- This fixes the 403 errors when importing podcast episodes
-- ============================================================

-- USER_PODCASTS TABLE RLS POLICIES
ALTER TABLE user_podcasts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own podcasts" ON user_podcasts;
DROP POLICY IF EXISTS "Users can insert their own podcasts" ON user_podcasts;
DROP POLICY IF EXISTS "Users can update their own podcasts" ON user_podcasts;
DROP POLICY IF EXISTS "Users can delete their own podcasts" ON user_podcasts;
DROP POLICY IF EXISTS "Admins can view all podcasts" ON user_podcasts;
DROP POLICY IF EXISTS "Admins can manage all podcasts" ON user_podcasts;
DROP POLICY IF EXISTS "Admins can insert any podcast" ON user_podcasts;
DROP POLICY IF EXISTS "Admins can update any podcast" ON user_podcasts;
DROP POLICY IF EXISTS "Admins can delete any podcast" ON user_podcasts;

CREATE POLICY "Users can view their own podcasts"
ON user_podcasts FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all podcasts"
ON user_podcasts FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Users can insert their own podcasts"
ON user_podcasts FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can insert any podcast"
ON user_podcasts FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Users can update their own podcasts"
ON user_podcasts FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update any podcast"
ON user_podcasts FOR UPDATE TO authenticated
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

CREATE POLICY "Users can delete their own podcasts"
ON user_podcasts FOR DELETE TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can delete any podcast"
ON user_podcasts FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- PODCAST_EPISODES TABLE RLS POLICIES
ALTER TABLE podcast_episodes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view published episodes" ON podcast_episodes;
DROP POLICY IF EXISTS "Users can view episodes of their podcasts" ON podcast_episodes;
DROP POLICY IF EXISTS "Users can insert episodes to their podcasts" ON podcast_episodes;
DROP POLICY IF EXISTS "Users can update episodes of their podcasts" ON podcast_episodes;
DROP POLICY IF EXISTS "Users can delete episodes of their podcasts" ON podcast_episodes;
DROP POLICY IF EXISTS "Admins can view all episodes" ON podcast_episodes;
DROP POLICY IF EXISTS "Admins can manage all episodes" ON podcast_episodes;
DROP POLICY IF EXISTS "Admins can insert episodes to any podcast" ON podcast_episodes;
DROP POLICY IF EXISTS "Admins can update any episode" ON podcast_episodes;
DROP POLICY IF EXISTS "Admins can delete any episode" ON podcast_episodes;

CREATE POLICY "Anyone can view published episodes"
ON podcast_episodes FOR SELECT TO authenticated, anon
USING (true);

CREATE POLICY "Users can insert episodes to their podcasts"
ON podcast_episodes FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_podcasts
    WHERE user_podcasts.id = podcast_episodes.podcast_id
    AND user_podcasts.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can insert episodes to any podcast"
ON podcast_episodes FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Users can update episodes of their podcasts"
ON podcast_episodes FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_podcasts
    WHERE user_podcasts.id = podcast_episodes.podcast_id
    AND user_podcasts.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_podcasts
    WHERE user_podcasts.id = podcast_episodes.podcast_id
    AND user_podcasts.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can update any episode"
ON podcast_episodes FOR UPDATE TO authenticated
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

CREATE POLICY "Users can delete episodes of their podcasts"
ON podcast_episodes FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_podcasts
    WHERE user_podcasts.id = podcast_episodes.podcast_id
    AND user_podcasts.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can delete any episode"
ON podcast_episodes FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Verify policies were created
SELECT
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('user_podcasts', 'podcast_episodes')
ORDER BY tablename, cmd, policyname;
