-- ============================================
-- MASTER DB REPAIR SCRIPT (ENHANCED)
-- Run this in Supabase SQL Editor
-- ============================================

-- 0. Enable UUID Extension (Crucial for uuid_generate_v4)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Reset Badges System (Clean Slate with CASCADE)
DROP TABLE IF EXISTS user_badges CASCADE;
DROP TABLE IF EXISTS badges CASCADE;

-- 2. Create Badges Table
CREATE TABLE badges (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT, 
  description TEXT,
  required_points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create User Badges Table
CREATE TABLE user_badges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  badge_id INTEGER REFERENCES badges(id) ON DELETE CASCADE NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- 4. Enable RLS
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- 5. Policies
CREATE POLICY "Badges are public" ON badges FOR SELECT USING (true);
CREATE POLICY "User badges are public" ON user_badges FOR SELECT USING (true);
CREATE POLICY "Authenticated can assign badges" ON user_badges FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 6. Seed Data
INSERT INTO badges (name, icon, description, required_points)
VALUES 
  ('Movie Buff', '🎬', 'Watched 10+ movies', 100),
  ('Party Starter', '🎉', 'Hosted 5+ watch parties', 500),
  ('Social Butterfly', '🦋', 'Added 10 friends', 200),
  ('Critic', '✍️', 'Wrote 5 reviews', 150)
ON CONFLICT DO NOTHING;

-- =============================================
-- FIX OTHER MISSING RELATIONSHIPS
-- =============================================

-- Fix party_participants -> watch_parties relationship
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'party_participants_party_id_fkey'
    ) THEN
        ALTER TABLE party_participants
        ADD CONSTRAINT party_participants_party_id_fkey
        FOREIGN KEY (party_id) 
        REFERENCES watch_parties(id) 
        ON DELETE CASCADE;
    END IF;
END $$;

-- Verify
SELECT 'Success! Database repaired.' as status;
