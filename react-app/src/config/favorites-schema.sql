-- ============================================
-- FAVORITES TABLE V2 - FLEXIBLE SCHEMA
-- Works with both static content IDs and database UUIDs
-- Run this in Supabase SQL Editor
-- ============================================

-- Drop the old table if it exists (CAUTION: This deletes all existing favorites)
DROP TABLE IF EXISTS favorites CASCADE;

-- 1. Create Favorites Table with TEXT columns for flexible ID storage
CREATE TABLE favorites (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  -- Use TEXT to allow both UUID and string IDs from static data
  movie_id TEXT,
  series_id TEXT,
  content_type TEXT DEFAULT 'movie',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Ensure one target is set, but not both
  CONSTRAINT favorites_target_check CHECK (
    (movie_id IS NOT NULL AND series_id IS NULL) OR 
    (movie_id IS NULL AND series_id IS NOT NULL)
  ),
  -- Prevent duplicates
  UNIQUE(user_id, movie_id),
  UNIQUE(user_id, series_id)
);

-- 2. Enable RLS
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- 3. Policies
-- Users can view their own favorites
DROP POLICY IF EXISTS "Users can view own favorites" ON favorites;
CREATE POLICY "Users can view own favorites" ON favorites FOR SELECT USING (auth.uid() = user_id);

-- Users can add their own favorites
DROP POLICY IF EXISTS "Users can add own favorites" ON favorites;
CREATE POLICY "Users can add own favorites" ON favorites FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own favorites
DROP POLICY IF EXISTS "Users can delete own favorites" ON favorites;
CREATE POLICY "Users can delete own favorites" ON favorites FOR DELETE USING (auth.uid() = user_id);

-- 4. Enable Realtime
-- Add table to publication
ALTER PUBLICATION supabase_realtime ADD TABLE favorites;

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_created_at ON favorites(created_at);
CREATE INDEX IF NOT EXISTS idx_favorites_movie_id ON favorites(movie_id);
CREATE INDEX IF NOT EXISTS idx_favorites_series_id ON favorites(series_id);
