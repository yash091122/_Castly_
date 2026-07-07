-- =============================================
-- FIX DATABASE RELATIONSHIPS
-- Resolves 400 Errors for party_participants and user_badges
-- =============================================

-- 1. Fix party_participants -> watch_parties relationship
-- Ensure the foreign key exists and is named correctly for Supabase auto-detection
BEGIN;

-- Check if constraint exists, if not add it
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

-- 2. Fix user_badges -> badges relationship
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_badges_badge_id_fkey'
    ) THEN
        ALTER TABLE user_badges
        ADD CONSTRAINT user_badges_badge_id_fkey
        FOREIGN KEY (badge_id) 
        REFERENCES badges(id) 
        ON DELETE CASCADE;
    END IF;
END $$;

COMMIT;

-- 3. Verify Tables Exist (Optional Debug helper)
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('watch_parties', 'party_participants', 'badges', 'user_badges');
