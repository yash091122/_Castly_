-- ============================================
-- SQL SCRIPT: Fix Realtime Replication
-- ============================================

-- Ensure the supabase_realtime publication exists (it should by default)
-- Then add the tables to the publication to enable real-time events

begin;
  -- Remove tables first to avoid duplicates or errors (optional, but cleaner)
  -- in case we want to reset. But ADD TABLE is safer if we just want to ensure they are there.
  -- PostgreSQL doesn't have "ADD TABLE IF NOT EXISTS" for publications easily.
  -- We'll try to add them. If they are already there, it might throw a warning or error depending on version.
  -- Best approach for Supabase: Re-run ALTER PUBLICATION for all tables we care about.

  drop publication if exists supabase_realtime;
  create publication supabase_realtime for table 
    profiles, 
    watch_history, 
    favorites, 
    friends, 
    watch_parties, 
    party_participants,
    notifications,
    user_activity;
    
commit;

-- Explicitly enable replication on the tables (sometimes needed)
ALTER TABLE watch_history REPLICA IDENTITY FULL;
ALTER TABLE favorites REPLICA IDENTITY FULL;
ALTER TABLE friends REPLICA IDENTITY FULL;
ALTER TABLE user_activity REPLICA IDENTITY FULL;
ALTER TABLE watch_parties REPLICA IDENTITY FULL;
ALTER TABLE party_participants REPLICA IDENTITY FULL;
ALTER TABLE notifications REPLICA IDENTITY FULL;
ALTER TABLE profiles REPLICA IDENTITY FULL;
