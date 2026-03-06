-- ============================================
-- COPY THIS ENTIRE FILE AND PASTE IN SUPABASE
-- ============================================

-- Step 1: Show all triggers (so you can see what's there)
SELECT 'CURRENT TRIGGERS:' as info;
SELECT 
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users';

-- Step 2: Drop ALL possible trigger names
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user ON auth.users;
DROP TRIGGER IF EXISTS create_profile_on_signup ON auth.users;
DROP TRIGGER IF EXISTS auto_create_profile ON auth.users;

-- Step 3: Drop the function too
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Step 4: Verify triggers are gone
SELECT 'AFTER REMOVAL:' as info;
SELECT 
  CASE WHEN COUNT(*) = 0 
  THEN '✅✅✅ ALL TRIGGERS REMOVED - SIGNUP WILL WORK! ✅✅✅'
  ELSE '❌❌❌ TRIGGERS STILL EXIST - CONTACT SUPPORT ❌❌❌'
  END as status
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users';

-- Step 5: Ensure profiles table has correct permissions
GRANT INSERT ON profiles TO authenticated;
GRANT SELECT ON profiles TO authenticated;
GRANT UPDATE ON profiles TO authenticated;

-- Step 6: Ensure RLS policy allows inserts
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
  
  CREATE POLICY "Users can insert their own profile"
    ON profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);
    
  RAISE NOTICE '✅ Permissions set correctly';
END $$;

-- ============================================
-- DONE! Look for the ✅✅✅ message above
-- If you see it, signup will work immediately!
-- ============================================
