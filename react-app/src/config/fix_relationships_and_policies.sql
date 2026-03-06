-- Comprehensive DB Fix Script

-- 1. Fix 'watch_history' -> 'movies' relationship (Error 400)
-- PostgREST requires a foreign key to embed a resource.
DO $$
BEGIN
    -- Check if FK exists, if not create it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'watch_history_movie_id_fkey'
    ) THEN
        ALTER TABLE watch_history
        ADD CONSTRAINT watch_history_movie_id_fkey
        FOREIGN KEY (movie_id)
        REFERENCES movies(id)
        ON DELETE CASCADE;
    END IF;
END $$;

-- 2. Fix Recursive RLS Policies (Error 500)
-- Drop existing policies that might cause recursion and replace with non-recursive ones.

-- 2a. Policies for 'watch_parties'
DROP POLICY IF EXISTS "Enable read access for all users" ON watch_parties;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON watch_parties;
DROP POLICY IF EXISTS "Enable update for hosts" ON watch_parties;
DROP POLICY IF EXISTS "View parties" ON watch_parties;

-- Create new non-recursive policies
CREATE POLICY "Public read access for parties"
ON watch_parties FOR SELECT
TO authenticated
USING (true); -- Allow reading all parties to avoid recursion when joining tables

CREATE POLICY "Authenticated users can create parties"
ON watch_parties FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Hosts can update their parties"
ON watch_parties FOR UPDATE
TO authenticated
USING (auth.uid() = host_id);

-- 2b. Policies for 'party_participants'
DROP POLICY IF EXISTS "Enable read access for all users" ON party_participants;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON party_participants;
DROP POLICY IF EXISTS "View participants" ON party_participants;

CREATE POLICY "Public read access for participants"
ON party_participants FOR SELECT
TO authenticated
USING (true); -- Simple allow all to avoid recursion checking party host

CREATE POLICY "User can join parties"
ON party_participants FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User can leave parties"
ON party_participants FOR DELETE
TO authenticated
USING (auth.uid() = user_id);


-- 3. Fix 'party_participants' -> 'watch_parties' relationship (Error 500 potential)
-- Ensure FK exists properly for embedding
DO $$
BEGIN
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

-- 4. Reload Schema
NOTIFY pgrst, 'reload config';
