-- Fix existing users: mark them as verified
-- Run this AFTER running 20250106_email_verification.sql

UPDATE profiles
SET email_verified = true
WHERE email_verified = false OR email_verified IS NULL;

-- Verify the update
SELECT
  COUNT(*) as total_users,
  COUNT(CASE WHEN email_verified = true THEN 1 END) as verified_users,
  COUNT(CASE WHEN email_verified = false THEN 1 END) as unverified_users
FROM profiles;
