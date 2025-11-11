-- Add role column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';

-- Add index for faster role-based queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Comment
COMMENT ON COLUMN profiles.role IS 'User role: user, creator, or admin';

-- Update existing users (optional - you can customize this)
-- Example: Set all existing users to 'user' role if not already set
UPDATE profiles
SET role = 'user'
WHERE role IS NULL;
