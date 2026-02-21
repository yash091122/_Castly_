-- ============================================
-- CASTLY DATABASE SEED SCRIPT
-- Run this in Supabase SQL Editor after running admin-schema-complete.sql
-- ============================================

-- ============================================
-- MOVIES DATA
-- ============================================

INSERT INTO movies (id, title, description, poster_url, banner_url, trailer_url, video_url, genre, duration, year, rating, status, view_count) VALUES
(
  'a1b2c3d4-0001-4000-8000-000000000001',
  'Tous En Scene',
  'A koala named Buster Moon hosts a singing competition to save his theater.',
  '/assets/tous-en-scene.jpg',
  '/assets/tous-en-scene-backdrop.jpg',
  'https://www.youtube.com/watch?v=Y7uGHY-t80I',
  'https://castly.upns.xyz/#dcnozl',
  'Cartoon',
  '1h 50m',
  2024,
  8.2,
  'published',
  1250
),
(
  'a1b2c3d4-0002-4000-8000-000000000002',
  'The Last Kingdom',
  'As Alfred the Great defends his kingdom from Norse invaders, Uhtred--born a Saxon but raised by Vikings--seeks to claim his ancestral birthright.',
  '/assets/last-kingdom.jpg',
  '/assets/last-kingdom-backdrop.jpg',
  'https://www.youtube.com/watch?v=WxPApTGWwas',
  'https://res.cloudinary.com/dnhwq1wwr/video/upload/v1769161101/day--8_l1kapf.mp4',
  'Action',
  '1h 45m',
  2024,
  8.5,
  'published',
  2100
),
(
  'a1b2c3d4-0003-4000-8000-000000000003',
  'Love Death + Robots',
  'Terrifying creatures, wicked surprises and dark comedy converge in this NSFW anthology of animated stories.',
  '/assets/love-death-robots.jpg',
  '/assets/love-death-robots-backdrop.jpg',
  'https://www.youtube.com/watch?v=wUFwunMKa4E',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
  'Thriller',
  '15m per ep',
  2024,
  8.7,
  'published',
  1800
),
(
  'a1b2c3d4-0004-4000-8000-000000000004',
  'Naruto',
  'Follow Naruto Uzumaki, a young ninja with a sealed demon within him, as he strives to become the strongest ninja and leader of his village.',
  '/assets/naruto.jpg',
  '/assets/naruto-backdrop.jpg',
  'https://www.youtube.com/watch?v=QczGoCmX-pI',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
  'Anime',
  '24m per ep',
  2024,
  9.0,
  'published',
  3500
),
(
  'a1b2c3d4-0005-4000-8000-000000000005',
  'Django Unchained',
  'With the help of a German bounty hunter, a freed slave sets out to rescue his wife from a brutal Mississippi plantation owner.',
  '/assets/django.jpg',
  '/assets/django-backdrop.jpg',
  'https://www.youtube.com/watch?v=_iH0UBYDI4g',
  'https://castly.upns.xyz/#dcnozl',
  'Action',
  '2h 45m',
  2024,
  8.8,
  'published',
  2800
),
(
  'a1b2c3d4-0006-4000-8000-000000000006',
  'Shrek',
  'A mean lord exiles fairytale creatures to the swamp of a grumpy ogre, who must go on a quest and rescue a princess for the lord.',
  '/assets/shrek.jpg',
  '/assets/shrek-backdrop.jpg',
  'https://www.youtube.com/watch?v=CwXOrWvPBPk',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  'Fantasy',
  '1h 30m',
  2024,
  8.0,
  'published',
  4200
),
(
  'a1b2c3d4-0007-4000-8000-000000000007',
  'Stranger Things',
  'When a young boy vanishes, a small town uncovers a mystery involving secret experiments, terrifying supernatural forces, and one strange little girl.',
  '/assets/stranger-things.jpg',
  '/assets/stranger-things-backdrop.jpg',
  'https://youtu.be/bLxvdUroRic?si=LhS9apLuhRbI5BbO',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
  'Sci-Fi',
  '50m per ep',
  2024,
  8.7,
  'published',
  5100
),
(
  'a1b2c3d4-0008-4000-8000-000000000008',
  'Breaking Bad',
  'A high school chemistry teacher turned methamphetamine manufacturer partners with a former student to secure his family''s financial future as he battles terminal lung cancer.',
  '/assets/breaking-bad.jpg',
  '/assets/breaking-bad-backdrop.jpg',
  'https://www.youtube.com/watch?v=HhesaQXLuRY',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
  'Drama',
  '45m per ep',
  2024,
  9.5,
  'published',
  6200
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  poster_url = EXCLUDED.poster_url,
  banner_url = EXCLUDED.banner_url,
  trailer_url = EXCLUDED.trailer_url,
  video_url = EXCLUDED.video_url,
  genre = EXCLUDED.genre,
  duration = EXCLUDED.duration,
  year = EXCLUDED.year,
  rating = EXCLUDED.rating,
  status = EXCLUDED.status,
  updated_at = NOW();

-- ============================================
-- TV SERIES DATA
-- ============================================

INSERT INTO series (id, title, description, poster_url, banner_url, genre, status) VALUES
(
  'b1b2c3d4-0001-4000-8000-000000000001',
  'Stranger Things',
  'When a young boy vanishes, a small town uncovers a mystery involving secret experiments, terrifying supernatural forces, and one strange little girl.',
  '/assets/stranger-things.jpg',
  '/assets/stranger-things-backdrop.jpg',
  'Sci-Fi, Horror, Drama',
  'published'
),
(
  'b1b2c3d4-0002-4000-8000-000000000002',
  'Breaking Bad',
  'A high school chemistry teacher turned methamphetamine manufacturer partners with a former student to secure his family''s financial future.',
  '/assets/breaking-bad.jpg',
  '/assets/breaking-bad-backdrop.jpg',
  'Crime, Drama, Thriller',
  'published'
),
(
  'b1b2c3d4-0003-4000-8000-000000000003',
  'The Crown',
  'The story of Queen Elizabeth II''s reign and the events that shaped the second half of the twentieth century.',
  '/assets/the-crown.jpg',
  '/assets/the-crown-backdrop.jpg',
  'Drama, History, Biography',
  'published'
),
(
  'b1b2c3d4-0004-4000-8000-000000000004',
  'Game of Thrones',
  'Nine noble families fight for control over the lands of Westeros, while an ancient enemy returns after being dormant for millennia.',
  '/assets/game-of-thrones.jpg',
  '/assets/game-of-thrones-backdrop.jpg',
  'Fantasy, Drama, Action',
  'published'
),
(
  'b1b2c3d4-0005-4000-8000-000000000005',
  'The Witcher',
  'Geralt of Rivia, a solitary monster hunter, struggles to find his place in a world where people often prove more wicked than beasts.',
  '/assets/the-witcher.jpg',
  '/assets/the-witcher-backdrop.jpg',
  'Fantasy, Action, Adventure',
  'published'
),
(
  'b1b2c3d4-0006-4000-8000-000000000006',
  'Dark',
  'A family saga with a supernatural twist, set in a German town where the disappearance of two young children exposes the relationships among four families.',
  '/assets/dark.jpg',
  '/assets/dark-backdrop.jpg',
  'Sci-Fi, Thriller, Mystery',
  'published'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  poster_url = EXCLUDED.poster_url,
  banner_url = EXCLUDED.banner_url,
  genre = EXCLUDED.genre,
  status = EXCLUDED.status,
  updated_at = NOW();

-- ============================================
-- SEASONS DATA
-- ============================================

-- Stranger Things Seasons
INSERT INTO seasons (id, series_id, season_number, title) VALUES
('c1000001-0001-4000-8000-000000000001', 'b1b2c3d4-0001-4000-8000-000000000001', 1, 'Season 1'),
('c1000001-0002-4000-8000-000000000002', 'b1b2c3d4-0001-4000-8000-000000000001', 2, 'Season 2')
ON CONFLICT (series_id, season_number) DO NOTHING;

-- Breaking Bad Seasons
INSERT INTO seasons (id, series_id, season_number, title) VALUES
('c2000001-0001-4000-8000-000000000001', 'b1b2c3d4-0002-4000-8000-000000000002', 1, 'Season 1')
ON CONFLICT (series_id, season_number) DO NOTHING;

-- The Crown Seasons
INSERT INTO seasons (id, series_id, season_number, title) VALUES
('c3000001-0001-4000-8000-000000000001', 'b1b2c3d4-0003-4000-8000-000000000003', 1, 'Season 1')
ON CONFLICT (series_id, season_number) DO NOTHING;

-- Game of Thrones Seasons
INSERT INTO seasons (id, series_id, season_number, title) VALUES
('c4000001-0001-4000-8000-000000000001', 'b1b2c3d4-0004-4000-8000-000000000004', 1, 'Season 1')
ON CONFLICT (series_id, season_number) DO NOTHING;

-- The Witcher Seasons
INSERT INTO seasons (id, series_id, season_number, title) VALUES
('c5000001-0001-4000-8000-000000000001', 'b1b2c3d4-0005-4000-8000-000000000005', 1, 'Season 1')
ON CONFLICT (series_id, season_number) DO NOTHING;

-- Dark Seasons
INSERT INTO seasons (id, series_id, season_number, title) VALUES
('c6000001-0001-4000-8000-000000000001', 'b1b2c3d4-0006-4000-8000-000000000006', 1, 'Season 1')
ON CONFLICT (series_id, season_number) DO NOTHING;

-- ============================================
-- EPISODES DATA
-- ============================================

-- Stranger Things S1 Episodes
INSERT INTO episodes (id, season_id, title, description, video_url, thumbnail_url, duration, episode_order) VALUES
('e1010001-0001-4000-8000-000000000001', 'c1000001-0001-4000-8000-000000000001', 
 'Chapter One: The Vanishing of Will Byers',
 'On his way home from a friend''s house, young Will sees something terrifying. Nearby, a sinister secret lurks in the depths of a government lab.',
 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
 '/assets/episodes/st-s1-e1.jpg', '47m', 1),
('e1010001-0002-4000-8000-000000000002', 'c1000001-0001-4000-8000-000000000001',
 'Chapter Two: The Weirdo on Maple Street',
 'Lucas, Mike and Dustin try to talk to the girl they found in the woods. Hopper questions an anxious Joyce about an unsettling phone call.',
 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
 '/assets/episodes/st-s1-e2.jpg', '55m', 2),
('e1010001-0003-4000-8000-000000000003', 'c1000001-0001-4000-8000-000000000001',
 'Chapter Three: Holly, Jolly',
 'An increasingly concerned Nancy looks for Barb and finds out what Jonathan''s been up to. Joyce is convinced Will is trying to talk to her.',
 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
 '/assets/episodes/st-s1-e3.jpg', '51m', 3),
('e1010001-0004-4000-8000-000000000004', 'c1000001-0001-4000-8000-000000000001',
 'Chapter Four: The Body',
 'Refusing to believe Will is dead, Joyce tries to connect with her son. The boys give Eleven a makeover. Nancy and Jonathan form an unlikely alliance.',
 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
 '/assets/episodes/st-s1-e4.jpg', '50m', 4)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  video_url = EXCLUDED.video_url,
  updated_at = NOW();

-- Stranger Things S2 Episodes
INSERT INTO episodes (id, season_id, title, description, video_url, thumbnail_url, duration, episode_order) VALUES
('e1020001-0001-4000-8000-000000000001', 'c1000001-0002-4000-8000-000000000002',
 'Chapter One: MADMAX',
 'As the town preps for Halloween, a high-scoring rival shakes up the arcade''s leaderboard, and a skeptical Hopper inspects a field of rotting pumpkins.',
 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
 '/assets/episodes/st-s2-e1.jpg', '48m', 1),
('e1020001-0002-4000-8000-000000000002', 'c1000001-0002-4000-8000-000000000002',
 'Chapter Two: Trick or Treat, Freak',
 'After Will sees something terrible on trick-or-treat night, Mike wonders if Eleven is still out there. Nancy wrestles with the truth about Barb.',
 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
 '/assets/episodes/st-s2-e2.jpg', '56m', 2)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  video_url = EXCLUDED.video_url,
  updated_at = NOW();

-- Breaking Bad S1 Episodes
INSERT INTO episodes (id, season_id, title, description, video_url, thumbnail_url, duration, episode_order) VALUES
('e2010001-0001-4000-8000-000000000001', 'c2000001-0001-4000-8000-000000000001',
 'Pilot',
 'Diagnosed with terminal lung cancer, chemistry teacher Walter White teams up with his former student Jesse Pinkman to cook and sell crystal meth.',
 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
 '/assets/episodes/bb-s1-e1.jpg', '58m', 1),
('e2010001-0002-4000-8000-000000000002', 'c2000001-0001-4000-8000-000000000001',
 'Cat''s in the Bag...',
 'Walt and Jesse attempt to tie up loose ends. The desperate situation gets more complicated with the introduction of Krazy-8.',
 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
 '/assets/episodes/bb-s1-e2.jpg', '48m', 2)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  video_url = EXCLUDED.video_url,
  updated_at = NOW();

-- The Crown S1 Episodes
INSERT INTO episodes (id, season_id, title, description, video_url, thumbnail_url, duration, episode_order) VALUES
('e3010001-0001-4000-8000-000000000001', 'c3000001-0001-4000-8000-000000000001',
 'Wolferton Splash',
 'Princess Elizabeth and Prince Philip marry. King George VI''s health worsens, while Winston Churchill is elected Prime Minister for the second time.',
 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
 '/assets/episodes/tc-s1-e1.jpg', '56m', 1)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  video_url = EXCLUDED.video_url,
  updated_at = NOW();

-- Game of Thrones S1 Episodes
INSERT INTO episodes (id, season_id, title, description, video_url, thumbnail_url, duration, episode_order) VALUES
('e4010001-0001-4000-8000-000000000001', 'c4000001-0001-4000-8000-000000000001',
 'Winter Is Coming',
 'Eddard Stark is torn between his family and an old friend when asked to serve at the side of King Robert Baratheon.',
 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
 '/assets/episodes/got-s1-e1.jpg', '62m', 1),
('e4010001-0002-4000-8000-000000000002', 'c4000001-0001-4000-8000-000000000001',
 'The Kingsroad',
 'While Bran recovers from his fall, Ned takes only his daughters to King''s Landing. Jon Snow goes with his uncle Benjen to the Wall.',
 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
 '/assets/episodes/got-s1-e2.jpg', '56m', 2)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  video_url = EXCLUDED.video_url,
  updated_at = NOW();

-- The Witcher S1 Episodes
INSERT INTO episodes (id, season_id, title, description, video_url, thumbnail_url, duration, episode_order) VALUES
('e5010001-0001-4000-8000-000000000001', 'c5000001-0001-4000-8000-000000000005',
 'The End''s Beginning',
 'Geralt of Rivia, a mutated monster hunter, struggles to find his place in a world where people often prove more wicked than beasts.',
 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
 '/assets/episodes/tw-s1-e1.jpg', '61m', 1)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  video_url = EXCLUDED.video_url,
  updated_at = NOW();

-- Dark S1 Episodes
INSERT INTO episodes (id, season_id, title, description, video_url, thumbnail_url, duration, episode_order) VALUES
('e6010001-0001-4000-8000-000000000001', 'c6000001-0001-4000-8000-000000000006',
 'Secrets',
 'In 2019, a local boy''s disappearance stokes fear in the residents of Winden, a small German town with a strange and tragic history.',
 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
 '/assets/episodes/dk-s1-e1.jpg', '51m', 1)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  video_url = EXCLUDED.video_url,
  updated_at = NOW();

-- ============================================
-- GRANT REALTIME ACCESS
-- ============================================
-- Enable realtime for content tables if not already done
DO $$
BEGIN
  -- Check if movies table is already in publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'movies'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE movies;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'series'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE series;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'episodes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE episodes;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'seasons'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE seasons;
  END IF;
END $$;

-- ============================================
-- VERIFICATION QUERY
-- ============================================
-- Run this to verify data was inserted correctly:
-- SELECT 'Movies: ' || COUNT(*) FROM movies WHERE status = 'published'
-- UNION ALL
-- SELECT 'Series: ' || COUNT(*) FROM series WHERE status = 'published'
-- UNION ALL
-- SELECT 'Seasons: ' || COUNT(*) FROM seasons
-- UNION ALL
-- SELECT 'Episodes: ' || COUNT(*) FROM episodes;
