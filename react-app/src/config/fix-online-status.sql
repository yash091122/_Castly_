-- ============================================
-- FIX ONLINE STATUS TRACKING
-- Run this in your Supabase SQL Editor
-- ============================================

-- Add last_seen column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'last_seen'
  ) THEN
    ALTER TABLE profiles ADD COLUMN last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- Update existing users to have a last_seen timestamp
UPDATE profiles SET last_seen = NOW() WHERE last_seen IS NULL;

-- Create index for better performance on online status queries
CREATE INDEX IF NOT EXISTS idx_profiles_online_status ON profiles(online_status);
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen ON profiles(last_seen DESC);

-- Function to automatically set users offline after 10 minutes of inactivity
CREATE OR REPLACE FUNCTION auto_set_offline_users() RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET online_status = false
  WHERE online_status = true
    AND last_seen < NOW() - INTERVAL '10 minutes';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optional: Create a scheduled job to run this function every 5 minutes
-- Note: You need to enable pg_cron extension in Supabase for this
-- SELECT cron.schedule('auto-offline-users', '*/5 * * * *', 'SELECT auto_set_offline_users();');

-- ============================================
-- DONE! Online status tracking is now fixed.
-- ============================================
