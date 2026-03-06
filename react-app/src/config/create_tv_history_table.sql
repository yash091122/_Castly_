-- Create tv_watch_history table
CREATE TABLE IF NOT EXISTS public.tv_watch_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    show_id TEXT NOT NULL,
    season_number INTEGER NOT NULL,
    episode_number INTEGER NOT NULL,
    progress INTEGER DEFAULT 0, -- in seconds
    duration INTEGER DEFAULT 0, -- in seconds
    completed BOOLEAN DEFAULT false,
    last_watched TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Unique constraint to prevent duplicate entries for same episode
    UNIQUE(user_id, show_id, season_number, episode_number)
);

-- Enable RLS
ALTER TABLE public.tv_watch_history ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view own tv watch history" ON public.tv_watch_history;
CREATE POLICY "Users can view own tv watch history"
    ON public.tv_watch_history FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own tv watch history" ON public.tv_watch_history;
CREATE POLICY "Users can insert own tv watch history"
    ON public.tv_watch_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own tv watch history" ON public.tv_watch_history;
CREATE POLICY "Users can update own tv watch history"
    ON public.tv_watch_history FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own tv watch history" ON public.tv_watch_history;
CREATE POLICY "Users can delete own tv watch history"
    ON public.tv_watch_history FOR DELETE
    USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tv_watch_history_user_id ON public.tv_watch_history(user_id);
CREATE INDEX IF NOT EXISTS idx_tv_watch_history_show_id ON public.tv_watch_history(show_id);
CREATE INDEX IF NOT EXISTS idx_tv_watch_history_last_watched ON public.tv_watch_history(last_watched);

-- Notify schema reload
NOTIFY pgrst, 'reload config';
