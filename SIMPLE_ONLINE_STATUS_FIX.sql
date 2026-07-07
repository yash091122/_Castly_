-- ============================================
-- SIMPLE ONLINE STATUS FIX
-- Just copy and paste this into Supabase SQL Editor
-- ============================================

-- Step 1: Add last_seen column if missing
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'last_seen'
  ) THEN
    ALTER TABLE profiles ADD COLUMN last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    RAISE NOTICE 'Added last_seen column to profiles table';
  ELSE
    RAISE NOTICE 'last_seen column already exists';
  END IF;
END $$;

-- Step 2: Update existing users
UPDATE profiles SET last_seen = NOW() WHERE last_seen IS NULL;

-- Step 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_online_status ON profiles(online_status);
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen ON profiles(last_seen DESC);

-- Step 4: Verify the changes
SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name IN ('online_status', 'last_seen')
ORDER BY column_name;

-- ============================================
-- DONE! You should see both columns listed above
-- ============================================
