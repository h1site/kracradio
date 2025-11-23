-- ============================================================
-- FIX ARTICLES PUBLISHED_AT NULL VALUES
-- ============================================================
-- Run this in Supabase Dashboard > SQL Editor
-- This fixes articles that have status='published' but published_at is NULL
-- ============================================================

-- Update all published articles that have NULL published_at
-- Set published_at to created_at or current timestamp
UPDATE articles
SET published_at = COALESCE(created_at, NOW())
WHERE status = 'published'
  AND published_at IS NULL;

-- Verify the fix
SELECT
  id,
  slug,
  title,
  status,
  published_at,
  created_at
FROM articles
WHERE status = 'published'
ORDER BY published_at DESC NULLS LAST
LIMIT 10;
