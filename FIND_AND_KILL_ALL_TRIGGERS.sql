-- ============================================
-- FIND AND REMOVE ALL TRIGGERS ON auth.users
-- ============================================

-- Step 1: Show EVERYTHING about triggers on auth.users
SELECT 
  'FOUND THESE TRIGGERS:' as info,
  trigger_schema,
  trigger_name,
  event_object_schema,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users'
  AND event_object_schema = 'auth';

-- Step 2: Generate DROP commands for each trigger found
-- Copy the output and run it
SELECT 
  'DROP TRIGGER IF EXISTS ' || trigger_name || ' ON ' || event_object_schema || '.' || event_object_table || ';' as drop_command
FROM information_schema.triggers
WHERE event_object_table = 'users'
  AND event_object_schema = 'auth';

-- Step 3: Try to drop with full schema qualification
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP TRIGGER IF EXISTS handle_new_user ON auth.users CASCADE;
DROP TRIGGER IF EXISTS create_profile_on_signup ON auth.users CASCADE;

-- Step 4: Check if any functions are causing this
SELECT 
  'FOUND THESE FUNCTIONS:' as info,
  routine_schema,
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_name LIKE '%user%'
  AND routine_schema IN ('public', 'auth');

-- Step 5: Drop all related functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user(jsonb) CASCADE;
DROP FUNCTION IF EXISTS auth.handle_new_user() CASCADE;

-- Step 6: Final check
SELECT 
  CASE WHEN COUNT(*) = 0 
  THEN '✅ SUCCESS - ALL TRIGGERS REMOVED!'
  ELSE '❌ STILL ' || COUNT(*)::text || ' TRIGGERS REMAINING'
  END as final_status
FROM information_schema.triggers
WHERE event_object_table = 'users'
  AND event_object_schema = 'auth';

-- If triggers still exist, they might be system triggers
-- In that case, we need to disable them differently
