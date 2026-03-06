-- ============================================
-- PROFILE PAGE BACKEND ENHANCEMENT SCRIPT
-- Run this in your Supabase SQL Editor
-- ============================================

-- 0. Enable UUID Extension (Required)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Badges Table
CREATE TABLE IF NOT EXISTS badges (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT, 
  description TEXT,
  required_points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create User Badges Table
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  badge_id INTEGER REFERENCES badges(id) ON DELETE CASCADE NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- 3. Create User Activity Table (if not exists)
CREATE TABLE IF NOT EXISTS user_activity (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL, -- 'watched', 'party', 'friend', 'badge'
  title TEXT, -- Movie title, Badge name, Friend name
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Enable RLS
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
-- Badges
DROP POLICY IF EXISTS "Badges are public" ON badges;
CREATE POLICY "Badges are public" ON badges FOR SELECT USING (true);

-- User Badges
DROP POLICY IF EXISTS "User badges are public" ON user_badges;
CREATE POLICY "User badges are public" ON user_badges FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own badges" ON user_badges;
CREATE POLICY "Users can insert own badges" ON user_badges FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User Activity
DROP POLICY IF EXISTS "Activity is public" ON user_activity;
CREATE POLICY "Activity is public" ON user_activity FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own activity" ON user_activity;
CREATE POLICY "Users can insert own activity" ON user_activity FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 6. Seed Initial Badges
INSERT INTO badges (name, icon, description, required_points)
VALUES 
  ('Movie Buff', '🎬', 'Watched 10+ movies', 100),
  ('Party Starter', '🎉', 'Hosted 5+ watch parties', 500),
  ('Social Butterfly', '🦋', 'Added 10 friends', 200),
  ('Critic', '✍️', 'Wrote 5 reviews', 150),
  ('Early Bird', '🌅', 'Joined during beta', 0)
ON CONFLICT DO NOTHING;

-- 7. Function to automatically track activity (Optional trigger example)
-- This is just an example; actual activity tracking should likely be done in application logic for simplicity
