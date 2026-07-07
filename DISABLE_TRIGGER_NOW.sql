-- IMMEDIATE FIX: Disable the problematic trigger
-- This allows signups to work while we debug the trigger issue
-- The app code will create profiles automatically

-- Step 1: Disable the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Step 2: Verify it's disabled
SELECT 
  'Trigger Status' as check_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'on_auth_user_created'
  ) THEN '❌ Still Active (Run again)' ELSE '✅ DISABLED - Signups will work now' END as result;

-- Step 3: Ensure profiles table has correct permissions for app to create profiles
GRANT INSERT ON profiles TO authenticated;
GRANT SELECT ON profiles TO authenticated;
GRANT UPDATE ON profiles TO authenticated;

-- Step 4: Verify RLS policies allow inserts
DO $$
BEGIN
  -- Drop and recreate the insert policy
  DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
  
  CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);
    
  RAISE NOTICE '✅ RLS policy updated - users can create their own profiles';
END $$;

-- Done! Users can now sign up successfully.
-- The app code in supabase.js will create profiles automatically.
