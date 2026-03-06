-- FIX SCRIPT FOR PARTY PARTICIPANTS RELATIONSHIP
-- Run this in Supabase SQL Editor

-- 1. Check if the constraint exists, if not recreate it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'party_participants_party_id_fkey' 
        AND table_name = 'party_participants'
    ) THEN
        -- Re-add the foreign key relationship explicitly
        ALTER TABLE party_participants
        ADD CONSTRAINT party_participants_party_id_fkey
        FOREIGN KEY (party_id)
        REFERENCES watch_parties(id)
        ON DELETE CASCADE;
    END IF;
END $$;

-- 2. Grant permissions explicitly slightly to sure
GRANT SELECT ON party_participants TO authenticated;
GRANT SELECT ON watch_parties TO authenticated;
GRANT SELECT ON profiles TO authenticated;

-- 3. Notify PostgREST to reload schema
NOTIFY pgrst, 'reload config';

-- 4. Just in case, try to add an explicit index on party_id if missing
CREATE INDEX IF NOT EXISTS idx_party_participants_party_id ON party_participants(party_id);
