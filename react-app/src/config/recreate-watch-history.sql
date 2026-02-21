-- ============================================
-- RECREATE WATCH HISTORY TABLE
-- Run this to fix the 400 error on watch_history queries
-- ============================================

-- Drop the existing watch_history table and recreate it properly
DROP TABLE IF EXISTS watch_history CASCADE;

-- Create watch_history table with correct structure
CREATE TABLE watch_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  movie_id VARCHAR(100) NOT NULL,
  progress INTEGER DEFAULT 0,
  duration INTEGER DEFAULT 0,
  last_watched TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, movie_id)
);

-- Enable Row Level Security
ALTER TABLE watch_history ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Users can view own watch history" ON watch_history;
DROP POLICY IF EXISTS "Users can insert own watch history" ON watch_history;
DROP POLICY IF EXISTS "Users can update own watch history" ON watch_history;
DROP POLICY IF EXISTS "Users can delete own watch history" ON watch_history;

-- Create RLS policies for security
CREATE POLICY "Users can view own watch history" 
  ON watch_history FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own watch history" 
  ON watch_history FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own watch history" 
  ON watch_history FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own watch history" 
  ON watch_history FOR DELETE 
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_watch_history_user_id ON watch_history(user_id);
CREATE INDEX idx_watch_history_last_watched ON watch_history(last_watched DESC);
CREATE INDEX idx_watch_history_user_movie ON watch_history(user_id, movie_id);

-- Verify the table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'watch_history'
ORDER BY ordinal_position;

-- ============================================
-- DONE! Watch history table recreated with correct structure.
-- The 400 error should be fixed now.
-- ============================================
