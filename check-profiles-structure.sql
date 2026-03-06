-- Check what's wrong with the profiles table

-- 1. Check if profiles table exists and its structure
SELECT 
  column_name, 
  data_type, 
  character_maximum_length,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- 2. Check constraints
SELECT
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  tc.is_deferrable,
  tc.initially_deferred
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'profiles'
ORDER BY tc.constraint_type, kcu.column_name;

-- 3. Check if auth.users reference is valid
SELECT 
  'Foreign Key Check' as test,
  CASE WHEN EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE table_name = 'profiles' 
    AND constraint_type = 'FOREIGN KEY'
    AND constraint_name LIKE '%auth_users%'
  ) THEN '✅ Foreign key to auth.users exists' 
  ELSE '❌ No foreign key to auth.users' END as result;

-- 4. Check if username column allows NULL
SELECT 
  'Username NULL Check' as test,
  CASE WHEN EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'username'
    AND is_nullable = 'YES'
  ) THEN '⚠️ Username allows NULL (might cause issues)' 
  ELSE '✅ Username is NOT NULL' END as result;

-- 5. Try to see recent auth.users without profiles
SELECT 
  u.id,
  u.email,
  u.created_at,
  CASE WHEN p.id IS NULL THEN '❌ No Profile' ELSE '✅ Has Profile' END as profile_status
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
ORDER BY u.created_at DESC
LIMIT 10;
