-- Complete fix for profiles table and user creation
-- Run this in Supabase SQL Editor

-- Step 1: Ensure profiles table has correct structure
DO $$ 
BEGIN
  -- Add NOT NULL constraint to username if missing
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'username'
    AND is_nullable = 'YES'
  ) THEN
    -- First, update any NULL usernames
    UPDATE profiles 
    SET username = COALESCE(username, split_part(email, '@', 1), 'user_' || id::text)
    WHERE username IS NULL;
    
    -- Then add NOT NULL constraint
    ALTER TABLE profiles ALTER COLUMN username SET NOT NULL;
    RAISE NOTICE 'Added NOT NULL constraint to username column';
  END IF;
END $$;

-- Step 2: Create or replace the trigger function with better error handling
CREATE OR REPLACE FUNCTION handle_new_user() RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_username TEXT;
  v_display_name TEXT;
BEGIN
  -- Extract username from metadata or generate from email
  v_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    split_part(NEW.email, '@', 1)
  );
  
  -- Extract display name
  v_display_name := COALESCE(
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'username',
    split_part(NEW.email, '@', 1)
  );
  
  -- Insert into profiles
  INSERT INTO profiles (
    id, 
    email, 
    username, 
    display_name, 
    avatar_url,
    online_status,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    v_username,
    v_display_name,
    NEW.raw_user_meta_data->>'avatar_url',
    false,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    username = COALESCE(EXCLUDED.username, profiles.username),
    display_name = COALESCE(EXCLUDED.display_name, profiles.display_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    updated_at = NOW();
    
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- If username is taken, append a number
    v_username := v_username || '_' || substr(NEW.id::text, 1, 8);
    
    INSERT INTO profiles (
      id, 
      email, 
      username, 
      display_name, 
      avatar_url,
      online_status,
      created_at,
      updated_at
    )
    VALUES (
      NEW.id,
      NEW.email,
      v_username,
      v_display_name,
      NEW.raw_user_meta_data->>'avatar_url',
      false,
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      updated_at = NOW();
      
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log error but don't fail user creation
    RAISE WARNING 'Error in handle_new_user for user %: % %', NEW.id, SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$;

-- Step 3: Drop and recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Step 4: Ensure RLS policies allow inserts
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;

-- Recreate policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Step 5: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON profiles TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;
GRANT SELECT ON profiles TO anon;

-- Step 6: Verify everything
SELECT 
  'Trigger exists' as check_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'on_auth_user_created'
  ) THEN '✅ YES' ELSE '❌ NO' END as result
UNION ALL
SELECT 
  'Function exists' as check_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_name = 'handle_new_user'
  ) THEN '✅ YES' ELSE '❌ NO' END as result
UNION ALL
SELECT 
  'RLS enabled' as check_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'profiles' AND rowsecurity = true
  ) THEN '✅ YES' ELSE '❌ NO' END as result;

-- Show current policies
SELECT 
  policyname,
  cmd as operation,
  CASE 
    WHEN qual IS NOT NULL THEN 'Has USING clause'
    ELSE 'No USING clause'
  END as using_clause,
  CASE 
    WHEN with_check IS NOT NULL THEN 'Has WITH CHECK clause'
    ELSE 'No WITH CHECK clause'
  END as with_check_clause
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;
