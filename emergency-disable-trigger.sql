-- EMERGENCY: Disable the trigger if it's causing 500 errors
-- This allows users to sign up, and profiles will be created by the app code
-- Run this ONLY if you're getting 500 errors on signup

-- Disable the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Verify it's disabled
SELECT 
  'Trigger disabled' as status,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'on_auth_user_created'
  ) THEN '❌ Still exists' ELSE '✅ Disabled' END as result;

-- Note: With the trigger disabled, profiles will be created by the 
-- fallback code in react-app/src/config/supabase.js
-- This is a temporary workaround until the trigger is fixed
