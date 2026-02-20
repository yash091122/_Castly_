-- Complete Setup Script for Admin Panel
-- Run this ENTIRE script in Supabase SQL Editor (in order)

-- ============================================
-- PART 1: CREATE MISSING TABLES
-- ============================================

-- Create hero_banners table
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

-- Create featured_content table
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

-- ============================================
-- PART 2: ENABLE RLS ON NEW TABLES
-- ============================================
ALTER TABLE hero_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE featured_content ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PART 3: CREATE PERMISSIVE POLICIES (for development)
-- ============================================

-- Movies policies
DROP POLICY IF EXISTS "Movies are viewable by everyone" ON movies;
CREATE POLICY "Movies are viewable by everyone" ON movies FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can insert movies" ON movies;
CREATE POLICY "Anyone can insert movies" ON movies FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can update movies" ON movies;
CREATE POLICY "Anyone can update movies" ON movies FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Anyone can delete movies" ON movies;
CREATE POLICY "Anyone can delete movies" ON movies FOR DELETE USING (true);

-- Series policies
DROP POLICY IF EXISTS "Series viewable by everyone" ON series;
CREATE POLICY "Series viewable by everyone" ON series FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can insert series" ON series;
CREATE POLICY "Anyone can insert series" ON series FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can update series" ON series;
CREATE POLICY "Anyone can update series" ON series FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Anyone can delete series" ON series;
CREATE POLICY "Anyone can delete series" ON series FOR DELETE USING (true);

-- Seasons policies
DROP POLICY IF EXISTS "Seasons viewable by everyone" ON seasons;
CREATE POLICY "Seasons viewable by everyone" ON seasons FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can manage seasons" ON seasons;
CREATE POLICY "Anyone can manage seasons" ON seasons FOR ALL USING (true);

-- Episodes policies
DROP POLICY IF EXISTS "Episodes viewable by everyone" ON episodes;
CREATE POLICY "Episodes viewable by everyone" ON episodes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can manage episodes" ON episodes;
CREATE POLICY "Anyone can manage episodes" ON episodes FOR ALL USING (true);

-- Hero banners policies
DROP POLICY IF EXISTS "Hero banners viewable by everyone" ON hero_banners;
CREATE POLICY "Hero banners viewable by everyone" ON hero_banners FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can manage hero_banners" ON hero_banners;
CREATE POLICY "Anyone can manage hero_banners" ON hero_banners FOR ALL USING (true);

-- Featured content policies
DROP POLICY IF EXISTS "Featured content viewable by everyone" ON featured_content;
CREATE POLICY "Featured content viewable by everyone" ON featured_content FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can manage featured_content" ON featured_content;
CREATE POLICY "Anyone can manage featured_content" ON featured_content FOR ALL USING (true);

-- App settings policies
DROP POLICY IF EXISTS "Everyone can view settings" ON app_settings;
CREATE POLICY "Everyone can view settings" ON app_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can manage app_settings" ON app_settings;
CREATE POLICY "Anyone can manage app_settings" ON app_settings FOR ALL USING (true);

-- ============================================
-- PART 4: ENABLE REALTIME
-- ============================================
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE hero_banners;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE featured_content;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE app_settings;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- ============================================
-- PART 5: SAMPLE DATA
-- ============================================

-- Sample Hero Banners
INSERT INTO hero_banners (title, subtitle, description, image_url, link_url, display_order) VALUES
  ('Welcome to Castly', 'Stream. Watch. Enjoy.', 'Discover thousands of movies and TV shows', 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1920', '/', 1),
  ('New Releases', 'Fresh content every week', 'Check out the latest additions to our library', 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1920', '/movies', 2)
ON CONFLICT DO NOTHING;

-- Ensure default app settings exist
INSERT INTO app_settings (key, value) VALUES
  ('site_name', '"Castly"'),
  ('primary_color', '"#6366f1"'),
  ('maintenance_mode', 'false'),
  ('maintenance_message', '"We are performing scheduled maintenance."')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- SUCCESS!
-- ============================================
-- If you see "Success. No rows returned", the script ran correctly.
-- Refresh your admin panel page to see the changes.
