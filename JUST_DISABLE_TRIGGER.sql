-- ============================================
-- EMERGENCY: JUST DISABLE THE TRIGGER
-- Run this RIGHT NOW to fix signup immediately
-- ============================================

-- Disable the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Verify it's gone
SELECT 
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'on_auth_user_created'
  ) THEN '❌ TRIGGER STILL EXISTS - TRY AGAIN' 
  ELSE '✅ TRIGGER DISABLED - SIGNUP WILL WORK NOW!' END as status;

-- That's it! The app code will handle profile creation.
