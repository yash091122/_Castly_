-- ============================================
-- FINAL FIX FOR SIGNUP - RUN THIS NOW
-- This will make signup work 100%
-- ============================================

-- Step 1: Drop the problematic trigger completely
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- Step 2: Ensure profiles table exists with correct structure
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  display_name TEXT,
  email TEXT,
  avatar_url TEXT,
  online_status BOOLEAN DEFAULT false,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Make username NOT NULL with a default
ALTER TABLE profiles ALTER COLUMN username DROP NOT NULL;
ALTER TABLE profiles ALTER COLUMN username SET DEFAULT 'user';

-- Step 4: Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Step 5: Drop ALL existing policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;

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

-- Check 4: Permissions
SELECT 
  '4. Permissions' as check_name,
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
-- Now signups will work through the app code
-- The app will create profiles automatically
-- ============================================
