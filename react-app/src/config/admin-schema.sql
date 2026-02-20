-- Admin Panel Database Schema for Castly OTT Platform
-- Run this in Supabase SQL Editor

-- Add role column to profiles if not exists
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator', 'content_manager'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'blocked'));

-- Movies table (enhanced for admin)
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

ALTER TABLE movies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Movies are viewable by everyone" ON movies;
CREATE POLICY "Movies are viewable by everyone" ON movies FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage movies" ON movies;
CREATE POLICY "Admins can manage movies" ON movies FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'content_manager'))
);

-- Series table
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
CREATE POLICY "Series viewable by everyone" ON series FOR SELECT USING (true);
CREATE POLICY "Admins can manage series" ON series FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'content_manager'))
);

-- Seasons table
CREATE TABLE IF NOT EXISTS seasons (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  series_id UUID REFERENCES series(id) ON DELETE CASCADE NOT NULL,
  season_number INTEGER NOT NULL,
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(series_id, season_number)
);

ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Seasons viewable by everyone" ON seasons FOR SELECT USING (true);
CREATE POLICY "Admins can manage seasons" ON seasons FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'content_manager'))
);

-- Episodes table
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
CREATE POLICY "Episodes viewable by everyone" ON episodes FOR SELECT USING (true);
CREATE POLICY "Admins can manage episodes" ON episodes FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'content_manager'))
);

-- Chat messages table (enhanced)
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
CREATE POLICY "Users can view messages in parties" ON chat_messages FOR SELECT USING (true);
CREATE POLICY "Users can send messages" ON chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage messages" ON chat_messages FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
);

-- Reports table
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
CREATE POLICY "Users can create reports" ON reports FOR INSERT WITH CHECK (auth.uid() = reported_by);
CREATE POLICY "Admins can view all reports" ON reports FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
);
CREATE POLICY "Admins can manage reports" ON reports FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
);

-- Admin notifications/announcements table
CREATE TABLE IF NOT EXISTS admin_notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  target_audience TEXT DEFAULT 'all' CHECK (target_audience IN ('all', 'premium', 'active')),
  sent_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view notifications" ON admin_notifications FOR SELECT USING (true);
CREATE POLICY "Admins can create notifications" ON admin_notifications FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Announcement banners table
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
CREATE POLICY "Everyone can view active banners" ON announcement_banners FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage banners" ON announcement_banners FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Admin logs table
CREATE TABLE IF NOT EXISTS admin_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT CHECK (target_type IN ('user', 'movie', 'series', 'party', 'settings', 'report')),
  target_id TEXT,
  target_name TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view logs" ON admin_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "System can create logs" ON admin_logs FOR INSERT WITH CHECK (true);

-- App settings table
CREATE TABLE IF NOT EXISTS app_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view settings" ON app_settings FOR SELECT USING (true);
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

-- Create indexes for admin queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_movies_status ON movies(status);
CREATE INDEX IF NOT EXISTS idx_movies_created_at ON movies(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_is_flagged ON chat_messages(is_flagged);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON admin_logs(admin_id);

-- Function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
  p_admin_id UUID,
  p_action TEXT,
  p_target_type TEXT,
  p_target_id TEXT,
  p_target_name TEXT,
  p_details JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO admin_logs (admin_id, action, target_type, target_id, target_name, details)
  VALUES (p_admin_id, p_action, p_target_type, p_target_id, p_target_name, p_details)
  RETURNING id INTO log_id;
  RETURN log_id;
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
    'active_users', (SELECT COUNT(*) FROM profiles WHERE online_status = true OR last_seen > NOW() - INTERVAL '24 hours'),
    'blocked_users', (SELECT COUNT(*) FROM profiles WHERE status = 'blocked'),
    'total_movies', (SELECT COUNT(*) FROM movies),
    'published_movies', (SELECT COUNT(*) FROM movies WHERE status = 'published'),
    'total_series', (SELECT COUNT(*) FROM series),
    'active_parties', (SELECT COUNT(*) FROM watch_parties WHERE status = 'active'),
    'total_parties', (SELECT COUNT(*) FROM watch_parties),
    'pending_reports', (SELECT COUNT(*) FROM reports WHERE status = 'open'),
    'flagged_messages', (SELECT COUNT(*) FROM chat_messages WHERE is_flagged = true)
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
