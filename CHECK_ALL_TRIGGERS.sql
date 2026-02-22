-- Check ALL triggers on auth.users table
SELECT 
  trigger_name,
  event_manipulation,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'users'
  AND event_object_schema = 'auth';

-- If you see ANY triggers listed above, run this to remove them ALL:
-- DROP TRIGGER IF EXISTS <trigger_name> ON auth.users;
