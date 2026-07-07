-- ============================================
-- CASTLY PROFILE SYSTEM DATABASE SCHEMA
-- Run this in your Supabase SQL Editor
-- ============================================

-- ============================================
-- STEP 1: CREATE BASE TABLES (if not exist)
-- ============================================

-- Create profiles table if not exists
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(50) UNIQUE,
  display_name VARCHAR(100),
  email VARCHAR(255),
  avatar_url TEXT,
  online_status BOOLEAN DEFAULT false,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create movies table if not exists
CREATE TABLE IF NOT EXISTS movies (
  id VARCHAR(100) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  poster TEXT,
  backdrop TEXT,
  year INTEGER,
  rating DECIMAL(3,1),
  duration INTEGER,
  genre TEXT[],
  description TEXT,
  video_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create watch_history table if not exists
CREATE TABLE IF NOT EXISTS watch_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  movie_id VARCHAR(100) REFERENCES movies(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0,
  duration INTEGER DEFAULT 0,
  last_watched TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, movie_id)
);

-- Create favorites table if not exists
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  movie_id VARCHAR(100) REFERENCES movies(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, movie_id)
);

-- Create friends table if not exists
CREATE TABLE IF NOT EXISTS friends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- Create watch_parties table if not exists
CREATE TABLE IF NOT EXISTS watch_parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  movie_id VARCHAR(100),
  movie_title VARCHAR(255),
  movie_poster TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE
);

-- Create party_participants table if not exists
CREATE TABLE IF NOT EXISTS party_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id UUID REFERENCES watch_parties(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(party_id, user_id)
);

-- Create reviews table if not exists
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  movie_id VARCHAR(100) REFERENCES movies(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table if not exists
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- STEP 2: ADD PROFILE EXTENSIONS
-- ============================================

-- Add new columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banner_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'en';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS favorite_genres TEXT[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{"notifications": true, "autoplay": true, "hdQuality": true, "subtitles": false}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS privacy JSONB DEFAULT '{"watchPartyInvites": "everyone", "watchHistory": "friends", "onlineStatus": "everyone"}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_watch_time INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- ============================================
-- STEP 3: CREATE BADGES SYSTEM
-- ============================================

-- Create badges table
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50) DEFAULT '🏆',
  requirement_type VARCHAR(50),
  requirement_value INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns to badges table if they don't exist
ALTER TABLE badges ADD COLUMN IF NOT EXISTS requirement_type VARCHAR(50);
ALTER TABLE badges ADD COLUMN IF NOT EXISTS requirement_value INTEGER DEFAULT 1;

-- Create user_badges junction table
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- Create user_activity table for activity feed
CREATE TABLE IF NOT EXISTS user_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create blocked_users table
CREATE TABLE IF NOT EXISTS blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, blocked_user_id)
);

-- ============================================
-- STEP 4: INSERT DEFAULT BADGES
-- ============================================

INSERT INTO badges (name, description, icon, requirement_type, requirement_value) VALUES
  ('Movie Buff', 'Watched 10 movies', '🎬', 'movies_watched', 10),
  ('Binge Master', 'Watched 50 movies', '📺', 'movies_watched', 50),
  ('Party Starter', 'Hosted 5 watch parties', '🎉', 'parties_hosted', 5),
  ('Social Butterfly', 'Made 10 friends', '🦋', 'friends_count', 10),
  ('Night Owl', 'Watched movies after midnight 10 times', '🦉', 'night_watches', 10),
  ('Weekend Warrior', 'Watched 20 movies on weekends', '⚔️', 'weekend_watches', 20),
  ('Early Bird', 'First to join 5 watch parties', '🐦', 'early_joins', 5),
  ('Critic', 'Left 20 reviews', '✍️', 'reviews_count', 20),
  ('Loyal Fan', 'Member for 1 year', '💎', 'membership_days', 365),
  ('Trendsetter', 'Watched 10 new releases', '🌟', 'new_releases', 10)
ON CONFLICT DO NOTHING;

-- ============================================
-- STEP 5: CREATE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_watch_history_user_id ON watch_history(user_id);
CREATE INDEX IF NOT EXISTS idx_watch_history_last_watched ON watch_history(last_watched DESC);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_user_id ON friends(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend_id ON friends(friend_id);
CREATE INDEX IF NOT EXISTS idx_watch_parties_host_id ON watch_parties(host_id);
CREATE INDEX IF NOT EXISTS idx_party_participants_user_id ON party_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON user_activity(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_user_id ON blocked_users(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- ============================================
-- STEP 6: ENABLE RLS
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE watch_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE watch_parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE party_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 7: RLS POLICIES
-- ============================================

-- Profiles policies
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Movies policies (public read)
DROP POLICY IF EXISTS "Movies are viewable by everyone" ON movies;
CREATE POLICY "Movies are viewable by everyone" ON movies FOR SELECT USING (true);

-- Watch history policies
DROP POLICY IF EXISTS "Users can view own watch history" ON watch_history;
CREATE POLICY "Users can view own watch history" ON watch_history FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own watch history" ON watch_history;
CREATE POLICY "Users can insert own watch history" ON watch_history FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own watch history" ON watch_history;
CREATE POLICY "Users can update own watch history" ON watch_history FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own watch history" ON watch_history;
CREATE POLICY "Users can delete own watch history" ON watch_history FOR DELETE USING (auth.uid() = user_id);

-- Favorites policies
DROP POLICY IF EXISTS "Users can view own favorites" ON favorites;
CREATE POLICY "Users can view own favorites" ON favorites FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own favorites" ON favorites;
CREATE POLICY "Users can insert own favorites" ON favorites FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own favorites" ON favorites;
CREATE POLICY "Users can delete own favorites" ON favorites FOR DELETE USING (auth.uid() = user_id);

-- Friends policies
DROP POLICY IF EXISTS "Users can view own friends" ON friends;
CREATE POLICY "Users can view own friends" ON friends FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);

DROP POLICY IF EXISTS "Users can send friend requests" ON friends;
CREATE POLICY "Users can send friend requests" ON friends FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update friend status" ON friends;
CREATE POLICY "Users can update friend status" ON friends FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = friend_id);

DROP POLICY IF EXISTS "Users can delete friendships" ON friends;
CREATE POLICY "Users can delete friendships" ON friends FOR DELETE USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Watch parties policies
DROP POLICY IF EXISTS "Watch parties are viewable by everyone" ON watch_parties;
CREATE POLICY "Watch parties are viewable by everyone" ON watch_parties FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create watch parties" ON watch_parties;
CREATE POLICY "Users can create watch parties" ON watch_parties FOR INSERT WITH CHECK (auth.uid() = host_id);

DROP POLICY IF EXISTS "Hosts can update own parties" ON watch_parties;
CREATE POLICY "Hosts can update own parties" ON watch_parties FOR UPDATE USING (auth.uid() = host_id);

-- Party participants policies
DROP POLICY IF EXISTS "Party participants viewable by all" ON party_participants;
CREATE POLICY "Party participants viewable by all" ON party_participants FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can join parties" ON party_participants;
CREATE POLICY "Users can join parties" ON party_participants FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can leave parties" ON party_participants;
CREATE POLICY "Users can leave parties" ON party_participants FOR DELETE USING (auth.uid() = user_id);

-- Reviews policies
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON reviews;
CREATE POLICY "Reviews are viewable by everyone" ON reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create reviews" ON reviews;
CREATE POLICY "Users can create reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own reviews" ON reviews;
CREATE POLICY "Users can delete own reviews" ON reviews FOR DELETE USING (auth.uid() = user_id);

-- Notifications policies
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can create notifications" ON notifications;
CREATE POLICY "System can create notifications" ON notifications FOR INSERT WITH CHECK (true);

-- Badges policies (public read)
DROP POLICY IF EXISTS "Badges are viewable by everyone" ON badges;
CREATE POLICY "Badges are viewable by everyone" ON badges FOR SELECT USING (true);

-- User badges policies
DROP POLICY IF EXISTS "Users can view own badges" ON user_badges;
CREATE POLICY "Users can view own badges" ON user_badges FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert badges" ON user_badges;
CREATE POLICY "System can insert badges" ON user_badges FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User activity policies
DROP POLICY IF EXISTS "Users can view own activity" ON user_activity;
CREATE POLICY "Users can view own activity" ON user_activity FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own activity" ON user_activity;
CREATE POLICY "Users can insert own activity" ON user_activity FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Blocked users policies
DROP POLICY IF EXISTS "Users can view own blocked list" ON blocked_users;
CREATE POLICY "Users can view own blocked list" ON blocked_users FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can block others" ON blocked_users;
CREATE POLICY "Users can block others" ON blocked_users FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unblock others" ON blocked_users;
CREATE POLICY "Users can unblock others" ON blocked_users FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- STEP 8: HELPER FUNCTIONS
-- ============================================

-- Function to log user activity
CREATE OR REPLACE FUNCTION log_user_activity(
  p_user_id UUID,
  p_type VARCHAR(50),
  p_title TEXT,
  p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  activity_id UUID;
BEGIN
  INSERT INTO user_activity (user_id, type, title, metadata)
  VALUES (p_user_id, p_type, p_title, p_metadata)
  RETURNING id INTO activity_id;
  
  RETURN activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check and award badges
CREATE OR REPLACE FUNCTION check_and_award_badges(p_user_id UUID) RETURNS VOID AS $$
DECLARE
  badge_record RECORD;
  user_value INTEGER;
BEGIN
  FOR badge_record IN SELECT * FROM badges LOOP
    -- Check if user already has this badge
    IF NOT EXISTS (SELECT 1 FROM user_badges WHERE user_id = p_user_id AND badge_id = badge_record.id) THEN
      -- Calculate user's value for this requirement
      CASE badge_record.requirement_type
        WHEN 'movies_watched' THEN
          SELECT COUNT(*) INTO user_value FROM watch_history WHERE user_id = p_user_id;
        WHEN 'parties_hosted' THEN
          SELECT COUNT(*) INTO user_value FROM watch_parties WHERE host_id = p_user_id;
        WHEN 'friends_count' THEN
          SELECT COUNT(*) INTO user_value FROM friends WHERE user_id = p_user_id AND status = 'accepted';
        WHEN 'reviews_count' THEN
          SELECT COUNT(*) INTO user_value FROM reviews WHERE user_id = p_user_id;
        ELSE
          user_value := 0;
      END CASE;
      
      -- Award badge if requirement met
      IF user_value >= badge_record.requirement_value THEN
        INSERT INTO user_badges (user_id, badge_id) VALUES (p_user_id, badge_record.id);
        -- Log activity
        PERFORM log_user_activity(p_user_id, 'badge', badge_record.name, jsonb_build_object('badge_id', badge_record.id));
      END IF;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 9: TRIGGERS
-- ============================================

-- Trigger function to check badges after watch history insert
CREATE OR REPLACE FUNCTION trigger_check_badges() RETURNS TRIGGER AS $$
BEGIN
  PERFORM check_and_award_badges(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_badges_on_watch ON watch_history;
CREATE TRIGGER check_badges_on_watch
  AFTER INSERT ON watch_history
  FOR EACH ROW
  EXECUTE FUNCTION trigger_check_badges();

-- Trigger function to log watch activity (only if columns exist)
CREATE OR REPLACE FUNCTION trigger_log_watch_activity() RETURNS TRIGGER AS $$
DECLARE
  movie_title TEXT;
  v_last_watched TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Safely get movie title
  BEGIN
    SELECT title INTO movie_title FROM movies WHERE id = NEW.movie_id;
  EXCEPTION WHEN OTHERS THEN
    movie_title := 'Unknown';
  END;
  
  -- Safely get last_watched timestamp
  BEGIN
    v_last_watched := NEW.last_watched;
  EXCEPTION WHEN OTHERS THEN
    v_last_watched := NOW();
  END;
  
  -- Log the activity
  BEGIN
    PERFORM log_user_activity(
      NEW.user_id, 
      'watched', 
      COALESCE(movie_title, 'Unknown'), 
      jsonb_build_object('movie_id', NEW.movie_id, 'progress', NEW.progress, 'last_watched', v_last_watched)
    );
  EXCEPTION WHEN OTHERS THEN
    -- Silently fail if logging doesn't work
    NULL;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Only create trigger if watch_history table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'watch_history') THEN
    DROP TRIGGER IF EXISTS log_watch_activity ON watch_history;
    CREATE TRIGGER log_watch_activity
      AFTER INSERT ON watch_history
      FOR EACH ROW
      EXECUTE FUNCTION trigger_log_watch_activity();
  END IF;
END $$;

-- Trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================
-- DONE! All tables and policies created.
-- ============================================
