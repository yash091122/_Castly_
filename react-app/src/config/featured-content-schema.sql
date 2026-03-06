-- Featured Content Database Schema
-- Run this in Supabase SQL Editor

-- ============================================
-- FEATURED CONTENT TABLE
-- For admin-curated trending and featured sections
-- ============================================
CREATE TABLE IF NOT EXISTS featured_content (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  content_id UUID NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('movie', 'series')),
  section TEXT NOT NULL CHECK (section IN ('hero', 'trending', 'featured', 'new_releases', 'recommended')),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  start_date DATE,
  end_date DATE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE featured_content ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Featured content viewable by everyone" ON featured_content;
CREATE POLICY "Featured content viewable by everyone" ON featured_content FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage featured content" ON featured_content;
CREATE POLICY "Admins can manage featured content" ON featured_content FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'content_manager'))
);

-- ============================================
-- HERO BANNERS TABLE (Enhanced)
-- For homepage hero carousel
-- ============================================
CREATE TABLE IF NOT EXISTS hero_banners (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  image_url TEXT,
  video_url TEXT,
  link_url TEXT,
  link_text TEXT DEFAULT 'Watch Now',
  content_id UUID,
  content_type TEXT CHECK (content_type IN ('movie', 'series', 'custom')),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  start_date DATE,
  end_date DATE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE hero_banners ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Hero banners viewable by everyone" ON hero_banners;
CREATE POLICY "Hero banners viewable by everyone" ON hero_banners FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage hero banners" ON hero_banners;
CREATE POLICY "Admins can manage hero banners" ON hero_banners FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_featured_content_section ON featured_content(section);
CREATE INDEX IF NOT EXISTS idx_featured_content_active ON featured_content(is_active);
CREATE INDEX IF NOT EXISTS idx_featured_content_order ON featured_content(display_order);
CREATE INDEX IF NOT EXISTS idx_hero_banners_active ON hero_banners(is_active);
CREATE INDEX IF NOT EXISTS idx_hero_banners_order ON hero_banners(display_order);

-- ============================================
-- ENABLE REALTIME
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE featured_content;
ALTER PUBLICATION supabase_realtime ADD TABLE hero_banners;
ALTER PUBLICATION supabase_realtime ADD TABLE announcement_banners;
ALTER PUBLICATION supabase_realtime ADD TABLE app_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE admin_notifications;

-- ============================================
-- SAMPLE DATA
-- ============================================

-- Sample Hero Banners
INSERT INTO hero_banners (title, subtitle, description, image_url, link_url, display_order) VALUES
  ('Welcome to Castly', 'Stream. Watch. Enjoy.', 'Discover thousands of movies and TV shows', 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1920', '/', 1),
  ('New Releases', 'Fresh content every week', 'Check out the latest additions to our library', 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1920', '/movies', 2),
  ('Watch Parties', 'Stream together with friends', 'Host or join watch parties in real-time', 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=1920', '/watch-party', 3)
ON CONFLICT DO NOTHING;

-- Ensure default app settings exist
INSERT INTO app_settings (key, value) VALUES
  ('site_name', '"Castly"'),
  ('primary_color', '"#6366f1"'),
  ('maintenance_mode', 'false'),
  ('maintenance_message', '"We are performing scheduled maintenance. Please check back soon."'),
  ('announcement_enabled', 'false'),
  ('announcement_text', '""')
ON CONFLICT (key) DO NOTHING;
