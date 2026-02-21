-- Complete Admin Panel Database Schema for Castly OTT Platform
-- Run this in Supabase SQL Editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. PROFILES TABLE (Enhanced for Admin)
-- ============================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator', 'content_manager'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'blocked'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- ============================================
-- 2. MOVIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS movies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  poster_url TEXT,
  banner_url TEXT,
  trailer_url TEXT,
  video_url TEXT,
  genre TEXT,
  duration TEXT,
  release_date DATE,
  year INTEGER,
  rating DECIMAL(2,1),
  status TEXT DEFAULT 'draft' CHECK (status IN ('published', 'draft')),
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Movies are viewable by everyone" ON movies;
CREATE POLICY "Movies are viewable by everyone" ON movies FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can insert movies" ON movies;
CREATE POLICY "Admins can insert movies" ON movies FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'content_manager'))
);

DROP POLICY IF EXISTS "Admins can update movies" ON movies;
CREATE POLICY "Admins can update movies" ON movies FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'content_manager'))
);

DROP POLICY IF EXISTS "Admins can delete movies" ON movies;
CREATE POLICY "Admins can delete movies" ON movies FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'content_manager'))
);

-- ============================================
-- 3. SERIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS series (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  poster_url TEXT,
  banner_url TEXT,
  genre TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('published', 'draft')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE series ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Series viewable by everyone" ON series;
CREATE POLICY "Series viewable by everyone" ON series FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage series" ON series;
CREATE POLICY "Admins can manage series" ON series FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'content_manager'))
);

-- ============================================
-- 4. SEASONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS seasons (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  series_id UUID REFERENCES series(id) ON DELETE CASCADE NOT NULL,
  season_number INTEGER NOT NULL,
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(series_id, season_number)
);

ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Seasons viewable by everyone" ON seasons;
CREATE POLICY "Seasons viewable by everyone" ON seasons FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage seasons" ON seasons;
CREATE POLICY "Admins can manage seasons" ON seasons FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'content_manager'))
);

-- ============================================
-- 5. EPISODES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS episodes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  season_id UUID REFERENCES seasons(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT,
  thumbnail_url TEXT,
  duration TEXT,
  episode_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE episodes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Episodes viewable by everyone" ON episodes;
CREATE POLICY "Episodes viewable by everyone" ON episodes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage episodes" ON episodes;
CREATE POLICY "Admins can manage episodes" ON episodes FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'content_manager'))
);

-- ============================================
-- 6. WATCH PARTIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS watch_parties (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  host_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  movie_id TEXT,
  movie_title TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'ended')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE watch_parties ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Watch parties viewable by everyone" ON watch_parties;
CREATE POLICY "Watch parties viewable by everyone" ON watch_parties FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can create watch parties" ON watch_parties;
CREATE POLICY "Users can create watch parties" ON watch_parties FOR INSERT WITH CHECK (auth.uid() = host_id);
DROP POLICY IF EXISTS "Hosts and admins can update parties" ON watch_parties;
CREATE POLICY "Hosts and admins can update parties" ON watch_parties FOR UPDATE USING (
  auth.uid() = host_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
);

-- ============================================
-- 7. PARTY PARTICIPANTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS party_participants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  party_id UUID REFERENCES watch_parties(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(party_id, user_id)
);

ALTER TABLE party_participants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Participants viewable by everyone" ON party_participants;
CREATE POLICY "Participants viewable by everyone" ON party_participants FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can join parties" ON party_participants;
CREATE POLICY "Users can join parties" ON party_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can leave parties" ON party_participants;
CREATE POLICY "Users can leave parties" ON party_participants FOR DELETE USING (
  auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
);

-- ============================================
-- 8. CHAT MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  party_id UUID REFERENCES watch_parties(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'text' CHECK (type IN ('text', 'emoji', 'reaction', 'system')),
  is_flagged BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Messages viewable by everyone" ON chat_messages;
CREATE POLICY "Messages viewable by everyone" ON chat_messages FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can send messages" ON chat_messages;
CREATE POLICY "Users can send messages" ON chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can manage messages" ON chat_messages;
CREATE POLICY "Admins can manage messages" ON chat_messages FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
);

-- ============================================
-- 9. REPORTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  reported_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reported_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'dismissed')),
  resolved_by UUID REFERENCES profiles(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can create reports" ON reports;
CREATE POLICY "Users can create reports" ON reports FOR INSERT WITH CHECK (auth.uid() = reported_by);
DROP POLICY IF EXISTS "Admins can view reports" ON reports;
CREATE POLICY "Admins can view reports" ON reports FOR SELECT USING (
  auth.uid() = reported_by OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
);
DROP POLICY IF EXISTS "Admins can manage reports" ON reports;
CREATE POLICY "Admins can manage reports" ON reports FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
);

-- ============================================
-- 10. ADMIN NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS admin_notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  target_audience TEXT DEFAULT 'all' CHECK (target_audience IN ('all', 'premium', 'active')),
  sent_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Everyone can view admin notifications" ON admin_notifications;
CREATE POLICY "Everyone can view admin notifications" ON admin_notifications FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can create notifications" ON admin_notifications;
CREATE POLICY "Admins can create notifications" ON admin_notifications FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
DROP POLICY IF EXISTS "Admins can delete notifications" ON admin_notifications;
CREATE POLICY "Admins can delete notifications" ON admin_notifications FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================
-- 11. ANNOUNCEMENT BANNERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS announcement_banners (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE announcement_banners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Everyone can view active banners" ON announcement_banners;
CREATE POLICY "Everyone can view active banners" ON announcement_banners FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "Admins can manage banners" ON announcement_banners;
CREATE POLICY "Admins can manage banners" ON announcement_banners FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================
-- 12. ADMIN LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS admin_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT CHECK (target_type IN ('user', 'movie', 'series', 'party', 'settings', 'report', 'notification')),
  target_id TEXT,
  target_name TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view logs" ON admin_logs;
CREATE POLICY "Admins can view logs" ON admin_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
DROP POLICY IF EXISTS "System can create logs" ON admin_logs;
CREATE POLICY "System can create logs" ON admin_logs FOR INSERT WITH CHECK (true);

-- ============================================
-- 13. APP SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS app_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Everyone can view settings" ON app_settings;
CREATE POLICY "Everyone can view settings" ON app_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can update settings" ON app_settings;
CREATE POLICY "Admins can update settings" ON app_settings FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Insert default settings
INSERT INTO app_settings (key, value) VALUES 
  ('app_name', '"Castly"'),
  ('maintenance_mode', 'false'),
  ('accent_color', '"#ffffff"'),
  ('default_language', '"English"')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_last_active ON profiles(last_active);
CREATE INDEX IF NOT EXISTS idx_movies_status ON movies(status);
CREATE INDEX IF NOT EXISTS idx_movies_created_at ON movies(created_at);
CREATE INDEX IF NOT EXISTS idx_movies_genre ON movies(genre);
CREATE INDEX IF NOT EXISTS idx_series_status ON series(status);
CREATE INDEX IF NOT EXISTS idx_watch_parties_status ON watch_parties(status);
CREATE INDEX IF NOT EXISTS idx_watch_parties_created_at ON watch_parties(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_party_id ON chat_messages(party_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_is_flagged ON chat_messages(is_flagged);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON admin_logs(admin_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to increment movie view count
CREATE OR REPLACE FUNCTION increment_view_count(movie_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE movies SET view_count = COALESCE(view_count, 0) + 1 WHERE id = movie_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get dashboard stats
CREATE OR REPLACE FUNCTION get_admin_dashboard_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM profiles),
    'active_users', (SELECT COUNT(*) FROM profiles WHERE online_status = true OR last_active > NOW() - INTERVAL '24 hours'),
    'blocked_users', (SELECT COUNT(*) FROM profiles WHERE status = 'blocked'),
    'total_movies', (SELECT COUNT(*) FROM movies),
    'published_movies', (SELECT COUNT(*) FROM movies WHERE status = 'published'),
    'draft_movies', (SELECT COUNT(*) FROM movies WHERE status = 'draft'),
    'total_series', (SELECT COUNT(*) FROM series),
    'active_parties', (SELECT COUNT(*) FROM watch_parties WHERE status = 'active'),
    'total_parties', (SELECT COUNT(*) FROM watch_parties),
    'pending_reports', (SELECT COUNT(*) FROM reports WHERE status = 'open'),
    'flagged_messages', (SELECT COUNT(*) FROM chat_messages WHERE is_flagged = true)
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to broadcast system message to watch party
CREATE OR REPLACE FUNCTION broadcast_party_message(p_party_id UUID, p_message TEXT)
RETURNS UUID AS $$
DECLARE
  host_user_id UUID;
  message_id UUID;
BEGIN
  -- Get the host_id from the party
  SELECT host_id INTO host_user_id FROM watch_parties WHERE id = p_party_id;
  
  IF host_user_id IS NULL THEN
    RAISE EXCEPTION 'Party not found';
  END IF;
  
  -- Insert the system message
  INSERT INTO chat_messages (party_id, user_id, message, type)
  VALUES (p_party_id, host_user_id, p_message, 'system')
  RETURNING id INTO message_id;
  
  RETURN message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user growth data
CREATE OR REPLACE FUNCTION get_user_growth(days INTEGER DEFAULT 30)
RETURNS TABLE(date DATE, count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE(created_at) as date,
    COUNT(*) as count
  FROM profiles
  WHERE created_at >= NOW() - (days || ' days')::INTERVAL
  GROUP BY DATE(created_at)
  ORDER BY date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get content stats by genre
CREATE OR REPLACE FUNCTION get_content_by_genre()
RETURNS TABLE(genre TEXT, count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(m.genre, 'Unknown') as genre,
    COUNT(*) as count
  FROM movies m
  WHERE m.status = 'published'
  GROUP BY m.genre
  ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ENABLE REALTIME FOR ADMIN TABLES
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE movies;
ALTER PUBLICATION supabase_realtime ADD TABLE series;
ALTER PUBLICATION supabase_realtime ADD TABLE watch_parties;
ALTER PUBLICATION supabase_realtime ADD TABLE party_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE reports;
ALTER PUBLICATION supabase_realtime ADD TABLE admin_notifications;

-- ============================================
-- STORAGE BUCKET FOR MEDIA
-- ============================================
-- Run these in Supabase Dashboard > Storage

-- Create 'media' bucket for movies/series content
-- INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true);

-- Policy for public read access
-- CREATE POLICY "Public read access" ON storage.objects FOR SELECT USING (bucket_id = 'media');

-- Policy for admin upload
-- CREATE POLICY "Admin upload access" ON storage.objects FOR INSERT WITH CHECK (
--   bucket_id = 'media' AND 
--   EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'content_manager'))
-- );

-- Policy for admin delete
-- CREATE POLICY "Admin delete access" ON storage.objects FOR DELETE USING (
--   bucket_id = 'media' AND 
--   EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'content_manager'))
-- );
