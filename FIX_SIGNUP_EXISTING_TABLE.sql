-- ============================================
-- FINAL FIX FOR SIGNUP - Works with existing table
-- ============================================

-- Step 1: Drop the problematic trigger completely
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- Step 2: Add missing columns if they don't exist
DO $$ 
BEGIN
  -- Add email column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'email'
  ) THEN
    ALTER TABLE profiles ADD COLUMN email TEXT;
    RAISE NOTICE 'Added email column';
  END IF;
  
  -- Add online_status if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'online_status'
  ) THEN
    ALTER TABLE profiles ADD COLUMN online_status BOOLEAN DEFAULT false;
    RAISE NOTICE 'Added online_status column';
  END IF;
  
  -- Add last_seen if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'last_seen'
  ) THEN
    ALTER TABLE profiles ADD COLUMN last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    RAISE NOTICE 'Added last_seen column';
  END IF;
  
  -- Add created_at if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    RAISE NOTICE 'Added created_at column';
  END IF;
  
  -- Add updated_at if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    RAISE NOTICE 'Added updated_at column';
  END IF;
END $$;

-- Step 3: Make username nullable (allow app to set it)
ALTER TABLE profiles ALTER COLUMN username DROP NOT NULL;

-- Step 4: Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Step 5: Drop ALL existing policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Step 6: Create simple, permissive policies
CREATE POLICY "Anyone can view profiles"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Step 7: Grant permissions
GRANT ALL ON profiles TO authenticated;
GRANT SELECT ON profiles TO anon;
GRANT ALL ON profiles TO service_role;

-- Step 8: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_online_status ON profiles(online_status);

-- ============================================
-- VERIFICATION
-- ============================================

-- Check 1: Trigger is disabled
SELECT 
  '1. Trigger Status' as check_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'on_auth_user_created'
  ) THEN '❌ STILL ACTIVE - RUN SCRIPT AGAIN' 
  ELSE '✅ DISABLED - Good!' END as result;

-- Check 2: RLS is enabled
SELECT 
  '2. RLS Status' as check_name,
  CASE WHEN rowsecurity THEN '✅ ENABLED - Good!' 
  ELSE '❌ DISABLED - Problem!' END as result
FROM pg_tables
WHERE tablename = 'profiles';

-- Check 3: Policies exist
SELECT 
  '3. Policies Count' as check_name,
  COUNT(*)::text || ' policies (should be 3)' as result
FROM pg_policies
WHERE tablename = 'profiles';

-- Check 4: Show current table structure
SELECT 
  '4. Table Structure' as check_name,
  'Check columns below' as result;

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- Check 5: Permissions
SELECT 
  '5. Permissions' as check_name,
  'Check output below' as result;

SELECT 
  grantee,
  string_agg(privilege_type, ', ') as privileges
FROM information_schema.table_privileges
WHERE table_name = 'profiles'
GROUP BY grantee;

-- ============================================
-- DONE!
-- ============================================
-- Trigger is disabled
-- Permissions are set
-- App will create profiles automatically
-- ============================================
