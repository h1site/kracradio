-- ============================================================
-- FIX ALL ARTICLES - Complete Solution
-- ============================================================
-- Run this in Supabase Dashboard > SQL Editor
-- This will:
-- 1. Show current state of articles
-- 2. Show rhenoir user info
-- 3. Assign ALL articles to rhenoir user
-- 4. Verify the fix worked
-- ============================================================

-- STEP 1: Check current state of articles
SELECT
  '=== CURRENT ARTICLES STATE ===' as info;

SELECT
  a.id,
  a.title,
  a.slug,
  a.status,
  a.user_id,
  p.username as current_author
FROM articles a
LEFT JOIN profiles p ON a.user_id = p.id
ORDER BY a.created_at DESC;

-- STEP 2: Find rhenoir user
SELECT
  '=== RHENOIR USER INFO ===' as info;

SELECT
  id,
  username,
  email,
  role
FROM profiles
WHERE username LIKE '%rhenoir%' OR email LIKE '%rhenoir%';

-- STEP 3: Assign ALL published articles to rhenoir
SELECT
  '=== UPDATING ARTICLES ===' as info;

UPDATE articles
SET user_id = (
  SELECT id
  FROM profiles
  WHERE username = 'rhenoir' OR username = '@rhenoir'
  LIMIT 1
)
WHERE status = 'published';

-- STEP 4: Verify the update worked
SELECT
  '=== VERIFICATION - ALL ARTICLES SHOULD NOW HAVE RHENOIR AS AUTHOR ===' as info;

SELECT
  a.id,
  a.title,
  a.slug,
  a.status,
  a.user_id,
  p.username as author,
  p.avatar_url
FROM articles a
LEFT JOIN profiles p ON a.user_id = p.id
WHERE a.status = 'published'
ORDER BY a.created_at DESC;

-- STEP 5: Count articles by author
SELECT
  '=== ARTICLES COUNT BY AUTHOR ===' as info;

SELECT
  p.username,
  COUNT(a.id) as article_count
FROM articles a
LEFT JOIN profiles p ON a.user_id = p.id
WHERE a.status = 'published'
GROUP BY p.username
ORDER BY article_count DESC;
