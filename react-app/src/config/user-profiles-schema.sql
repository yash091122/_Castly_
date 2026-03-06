-- ============================================
-- USER PROFILES SYSTEM (Netflix-style)
-- Multiple profiles per account
-- ============================================

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  avatar_url TEXT,
  avatar_color VARCHAR(20) DEFAULT '#3a3a3a',
  is_kids BOOLEAN DEFAULT false,
  is_default BOOLEAN DEFAULT false,
  pin VARCHAR(4),
  language VARCHAR(10) DEFAULT 'en',
  maturity_rating VARCHAR(10) DEFAULT 'all',
  autoplay_next BOOLEAN DEFAULT true,
  autoplay_previews BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(account_id, name)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_account_id ON user_profiles(account_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_last_used ON user_profiles(last_used_at DESC);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view own profiles" ON user_profiles;
CREATE POLICY "Users can view own profiles" 
  ON user_profiles FOR SELECT 
  USING (auth.uid() = account_id);

DROP POLICY IF EXISTS "Users can create own profiles" ON user_profiles;
CREATE POLICY "Users can create own profiles" 
  ON user_profiles FOR INSERT 
  WITH CHECK (auth.uid() = account_id);

DROP POLICY IF EXISTS "Users can update own profiles" ON user_profiles;
CREATE POLICY "Users can update own profiles" 
  ON user_profiles FOR UPDATE 
  USING (auth.uid() = account_id);

DROP POLICY IF EXISTS "Users can delete own profiles" ON user_profiles;
CREATE POLICY "Users can delete own profiles" 
  ON user_profiles FOR DELETE 
  USING (auth.uid() = account_id);

-- Update watch_history to link to profile instead of user
ALTER TABLE watch_history 
ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE;

-- Update favorites to link to profile
ALTER TABLE favorites 
ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE;

-- Function to create default profile on signup
CREATE OR REPLACE FUNCTION create_default_profile() RETURNS TRIGGER AS $$
DECLARE
  profile_name VARCHAR(50);
BEGIN
  -- Get name from metadata or email
  profile_name := COALESCE(
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'username',
    split_part(NEW.email, '@', 1)
  );

  -- Create default profile
  INSERT INTO user_profiles (account_id, name, is_default, avatar_color)
  VALUES (
    NEW.id,
    profile_name,
    true,
    '#3a3a3a'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create default profile
DROP TRIGGER IF EXISTS on_user_created_profile ON auth.users;
CREATE TRIGGER on_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_profile();

-- Function to update last_used_at
CREATE OR REPLACE FUNCTION update_profile_last_used() RETURNS TRIGGER AS $$
BEGIN
  NEW.last_used_at = NOW();
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- DONE! User profiles system created.
-- ============================================
