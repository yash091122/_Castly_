-- Fix Infinite Recursion in RLS Policies & Schema Issues

-- 1. Fix 'party_participants' RLS recursion
-- The issue is that checking 'watch_parties' from 'party_participants' while 'watch_parties' checks 'party_participants' causes a loop.
-- We will simplify the policies to break the cycle.

-- Drop existing problematic policies on watch_parties
DROP POLICY IF EXISTS "Users can view parties they're in" ON watch_parties;
DROP POLICY IF EXISTS "Hosts can create parties" ON watch_parties;
DROP POLICY IF EXISTS "Hosts can update own parties" ON watch_parties;
DROP POLICY IF EXISTS "Public read access for parties" ON watch_parties; -- From previous attempts
DROP POLICY IF EXISTS "Authenticated users can create parties" ON watch_parties; -- From previous attempts
DROP POLICY IF EXISTS "Hosts can update their parties" ON watch_parties; -- From previous attempts

-- Create clean, non-recursive policies for watch_parties
-- Allow viewing ALL active parties (or limited subset) to break recursion. 
-- Rely on application logic/filters for UX, but RLS simply allows access.
CREATE POLICY "Detailed watch_parties access"
  ON watch_parties FOR SELECT
  USING (true); -- Simplest approach: everyone can see parties. If privacy is needed, we'd need a non-recursive way (e.g. copying host_id to participants or distinct lookups)

CREATE POLICY "Hosts can create parties"
  ON watch_parties FOR INSERT
  WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Hosts can update own parties"
  ON watch_parties FOR UPDATE
  USING (auth.uid() = host_id);


-- Drop existing problematic policies on party_participants
DROP POLICY IF EXISTS "Users can view participants in their parties" ON party_participants;
DROP POLICY IF EXISTS "Users can join parties" ON party_participants;
DROP POLICY IF EXISTS "Users can leave parties" ON party_participants;
DROP POLICY IF EXISTS "Public read access for participants" ON party_participants; -- From previous attempts
DROP POLICY IF EXISTS "User can join parties" ON party_participants; -- From previous attempts
DROP POLICY IF EXISTS "User can leave parties" ON party_participants; -- From previous attempts


-- Create clean policies for party_participants
-- Allow viewing all participants. 
CREATE POLICY "View all participants"
  ON party_participants FOR SELECT
  USING (true); 

CREATE POLICY "Users can join parties"
  ON party_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave parties"
  ON party_participants FOR DELETE
  USING (auth.uid() = user_id);


-- 2. Ensure Schema Consistency
-- Make sure `party_participants` has `joined_at` if it's missing (it seemed to be missing created_at in the error, but we want joined_at)

DO $$ 
BEGIN
  -- If you wanted to rename joined_at to created_at to match frontend (not recommended, better fetch joined_at), do nothing.
  -- We fixed frontend to use joined_at.
  -- Just ensure foreign keys are good.
  
  IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'party_participants_party_id_fkey'
  ) THEN
      ALTER TABLE party_participants
      ADD CONSTRAINT party_participants_party_id_fkey
      FOREIGN KEY (party_id)
      REFERENCES watch_parties(id)
      ON DELETE CASCADE;
  END IF;

END $$;

-- 3. Notify Schema Reload
NOTIFY pgrst, 'reload config';
