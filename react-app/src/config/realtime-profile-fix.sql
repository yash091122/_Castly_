-- ============================================
-- SQL SCRIPT: Real-time Profile & Activity Fix
-- ============================================

-- 1. Create user_activity table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_activity (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('watched', 'party', 'favorite', 'friend', 'badge')) NOT NULL,
  title TEXT, -- For display purposes (Movie title, Friend name, Badge name)
  metadata JSONB DEFAULT '{}'::jsonb, -- Store IDs, images, extra info
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view own activity" ON public.user_activity;
CREATE POLICY "Users can view own activity"
  ON public.user_activity FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert activity" ON public.user_activity;
CREATE POLICY "System can insert activity"
  ON public.user_activity FOR INSERT
  WITH CHECK (true);

-- 2. Trigger Function: Log Favorite Activity
CREATE OR REPLACE FUNCTION public.handle_new_favorite()
RETURNS TRIGGER AS $$
DECLARE
  content_title TEXT;
BEGIN
  -- Try to fetch title from movies table if it exists
  -- We assume a 'movies' table or similar exists, but to be safe we'll use a subquery or fallback
  BEGIN
    IF NEW.movie_id IS NOT NULL THEN
       SELECT title INTO content_title FROM public.movies WHERE id = NEW.movie_id::text;
    ELSIF NEW.series_id IS NOT NULL THEN
       SELECT title INTO content_title FROM public.tv_shows WHERE id = NEW.series_id::text; 
    END IF;
  EXCEPTION WHEN OTHERS THEN
    content_title := 'New Favorite';
  END;

  IF content_title IS NULL THEN 
    content_title := 'Content';
  END IF;

  INSERT INTO public.user_activity (user_id, type, title, metadata)
  VALUES (
    NEW.user_id, 
    'favorite', 
    'Favorited ' || content_title, 
    jsonb_build_object('movie_id', NEW.movie_id, 'series_id', NEW.series_id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for Favorites
DROP TRIGGER IF EXISTS on_favorite_added ON public.favorites;
CREATE TRIGGER on_favorite_added
  AFTER INSERT ON public.favorites
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_favorite();


-- 3. Trigger Function: Log Watch Party Activity
CREATE OR REPLACE FUNCTION public.handle_party_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- We only care if a user JOINS a party (insert into party_participants)
  -- But we need to get the party title
  DECLARE
    p_title TEXT;
  BEGIN
    SELECT movie_title INTO p_title FROM public.watch_parties WHERE id = NEW.party_id;
    
    INSERT INTO public.user_activity (user_id, type, title, metadata)
    VALUES (
      NEW.user_id,
      'party',
      'Joined party for ' || COALESCE(p_title, 'a movie'),
      jsonb_build_object('party_id', NEW.party_id)
    );
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for Party Participants
DROP TRIGGER IF EXISTS on_party_joined ON public.party_participants;
CREATE TRIGGER on_party_joined
  AFTER INSERT ON public.party_participants
  FOR EACH ROW EXECUTE FUNCTION public.handle_party_activity();


-- 4. Trigger Function: Log Watch History (Finished Movie)
CREATE OR REPLACE FUNCTION public.handle_watch_activity()
RETURNS TRIGGER AS $$
DECLARE
  m_title TEXT;
  progress_pct NUMERIC;
BEGIN
  -- Calculate progress percentage
  IF NEW.duration > 0 THEN
    progress_pct := (NEW.progress::numeric / NEW.duration::numeric) * 100;
  ELSE
    progress_pct := 0;
  END IF;

  -- Only log if progress > 90% (Finished) AND it wasn't already > 90% (avoid duplicates)
  -- Or if it's a new insert and > 90%
  IF progress_pct >= 90 AND (TG_OP = 'INSERT' OR (OLD.progress::numeric / NULLIF(OLD.duration, 0)::numeric * 100) < 90) THEN
    
    BEGIN
      SELECT title INTO m_title FROM public.movies WHERE id = NEW.movie_id::text;
    EXCEPTION WHEN OTHERS THEN
       m_title := 'Movie';
    END;

    INSERT INTO public.user_activity (user_id, type, title, metadata)
    VALUES (
      NEW.user_id,
      'watched',
      'Watched ' || COALESCE(m_title, 'a movie'),
      jsonb_build_object('movie_id', NEW.movie_id)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for Watch History
DROP TRIGGER IF EXISTS on_watch_progress ON public.watch_history;
CREATE TRIGGER on_watch_progress
  AFTER INSERT OR UPDATE ON public.watch_history
  FOR EACH ROW EXECUTE FUNCTION public.handle_watch_activity();


-- 5. Trigger Function: Log New Friend
CREATE OR REPLACE FUNCTION public.handle_friend_activity()
RETURNS TRIGGER AS $$
DECLARE
  friend_name TEXT;
BEGIN
  -- Only for accepted friends
  IF NEW.status = 'accepted' AND (TG_OP = 'INSERT' OR OLD.status <> 'accepted') THEN
    
    SELECT display_name INTO friend_name FROM public.profiles WHERE id = NEW.friend_id;

    INSERT INTO public.user_activity (user_id, type, title, metadata)
    VALUES (
      NEW.user_id,
      'friend',
      'Became friends with ' || COALESCE(friend_name, 'someone'),
      jsonb_build_object('friend_id', NEW.friend_id)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for Friends
DROP TRIGGER IF EXISTS on_friend_added ON public.friends;
CREATE TRIGGER on_friend_added
  AFTER INSERT OR UPDATE ON public.friends
  FOR EACH ROW EXECUTE FUNCTION public.handle_friend_activity();

-- 6. Trigger Function: Badge Awarding Automation
CREATE OR REPLACE FUNCTION public.check_badges()
RETURNS TRIGGER AS $$
DECLARE
  stats_movies INTEGER;
  stats_parties INTEGER;
  stats_friends INTEGER;
  badge_exists BOOLEAN;
BEGIN
  -- Get user stats
  SELECT count(*) INTO stats_movies FROM public.watch_history WHERE user_id = NEW.user_id AND (progress::numeric / NULLIF(duration, 0)::numeric) > 0.9;
  SELECT count(*) INTO stats_parties FROM public.watch_parties WHERE host_id = NEW.user_id; 
  -- Note: Depending on where this is called, NEW.user_id might vary. 
  -- We'll attach this to user_activity to centralize checks? No, better to attach to specific tables.
  -- But for simplicity, let's create a separate function we call from other triggers.
  -- Simpler approach: Just check specific condition based on the table modified.
  
  -- Logic handled in separate dedicated functions below to avoid confusion
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6a. Check Movie Buff Badge (Attached to watch_history)
CREATE OR REPLACE FUNCTION public.check_movie_badge()
RETURNS TRIGGER AS $$
DECLARE
  count_val INTEGER;
  b_id INTEGER;
BEGIN
   SELECT count(*) INTO count_val FROM public.watch_history WHERE user_id = NEW.user_id AND (progress::numeric / NULLIF(duration, 0)::numeric) > 0.9;
   
   IF count_val >= 10 THEN
     SELECT id INTO b_id FROM public.badges WHERE name = 'Movie Buff' LIMIT 1;
     IF b_id IS NOT NULL THEN
        -- Insert if not exists
        INSERT INTO public.user_badges (user_id, badge_id) VALUES (NEW.user_id, b_id) ON CONFLICT DO NOTHING;
     END IF;
   END IF;
   RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS check_movie_badge_trigger ON public.watch_history;
CREATE TRIGGER check_movie_badge_trigger AFTER INSERT OR UPDATE ON public.watch_history FOR EACH ROW EXECUTE FUNCTION public.check_movie_badge();

-- 6b. Check Party Starter Badge (Attached to watch_parties)
CREATE OR REPLACE FUNCTION public.check_party_badge()
RETURNS TRIGGER AS $$
DECLARE
  count_val INTEGER;
  b_id INTEGER;
BEGIN
   SELECT count(*) INTO count_val FROM public.watch_parties WHERE host_id = NEW.host_id;
   
   IF count_val >= 5 THEN
     SELECT id INTO b_id FROM public.badges WHERE name = 'Party Starter' LIMIT 1;
     IF b_id IS NOT NULL THEN
        INSERT INTO public.user_badges (user_id, badge_id) VALUES (NEW.host_id, b_id) ON CONFLICT DO NOTHING;
     END IF;
   END IF;
   RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS check_party_badge_trigger ON public.watch_parties;
CREATE TRIGGER check_party_badge_trigger AFTER INSERT OR UPDATE ON public.watch_parties FOR EACH ROW EXECUTE FUNCTION public.check_party_badge();

-- 6c. Check Social Butterfly Badge (Attached to friends)
CREATE OR REPLACE FUNCTION public.check_social_badge()
RETURNS TRIGGER AS $$
DECLARE
  count_val INTEGER;
  b_id INTEGER;
BEGIN
   IF NEW.status = 'accepted' THEN
     SELECT count(*) INTO count_val FROM public.friends WHERE user_id = NEW.user_id AND status = 'accepted';
     
     IF count_val >= 10 THEN
       SELECT id INTO b_id FROM public.badges WHERE name = 'Social Butterfly' LIMIT 1;
       IF b_id IS NOT NULL THEN
          INSERT INTO public.user_badges (user_id, badge_id) VALUES (NEW.user_id, b_id) ON CONFLICT DO NOTHING;
       END IF;
     END IF;
   END IF;
   RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS check_social_badge_trigger ON public.friends;
CREATE TRIGGER check_social_badge_trigger AFTER INSERT OR UPDATE ON public.friends FOR EACH ROW EXECUTE FUNCTION public.check_social_badge();

-- 7. Add Badge notification to activity
CREATE OR REPLACE FUNCTION public.handle_new_badge()
RETURNS TRIGGER AS $$
DECLARE
  b_name TEXT;
  b_icon TEXT;
BEGIN
  SELECT name, icon INTO b_name, b_icon FROM public.badges WHERE id = NEW.badge_id;
  
  INSERT INTO public.user_activity (user_id, type, title, metadata)
  VALUES (
    NEW.user_id, 
    'badge', 
    'Earned ' || b_icon || ' ' || b_name || ' Badge!',
    jsonb_build_object('badge_id', NEW.badge_id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_badge_earned ON public.user_badges;
CREATE TRIGGER on_badge_earned
  AFTER INSERT ON public.user_badges
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_badge();
