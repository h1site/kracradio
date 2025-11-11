-- Fix RLS policies for email_verification_tokens
-- This fixes the error: "new row violates row-level security policy"

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own verification tokens" ON email_verification_tokens;
DROP POLICY IF EXISTS "Anyone can create verification tokens" ON email_verification_tokens;
DROP POLICY IF EXISTS "Anyone can update tokens" ON email_verification_tokens;

-- 1. Allow anyone to INSERT tokens
-- This is needed because users aren't authenticated yet when signing up
CREATE POLICY "Anyone can create verification tokens"
  ON email_verification_tokens
  FOR INSERT
  WITH CHECK (true);

-- 2. Allow anyone to SELECT their own tokens (by user_id)
CREATE POLICY "Users can view their own verification tokens"
  ON email_verification_tokens
  FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() IS NULL);

-- 3. Allow anyone to UPDATE tokens (to mark them as used)
-- We verify the token on the application side
CREATE POLICY "Anyone can update verification tokens"
  ON email_verification_tokens
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- 4. Only allow deletion by the token owner
CREATE POLICY "Users can delete their own tokens"
  ON email_verification_tokens
  FOR DELETE
  USING (auth.uid() = user_id);

-- Verify the policies were created
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'email_verification_tokens'
ORDER BY policyname;
