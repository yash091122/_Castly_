-- Fix Foreign Key Constraints to Enable CASCADE Deletes
-- This will allow Supabase to automatically delete user data when a user is deleted

-- ============================================
-- 1. DROP EXISTING FOREIGN KEY CONSTRAINTS
-- ============================================

-- Profiles table
ALTER TABLE IF EXISTS profiles 
DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Favorites table
ALTER TABLE IF EXISTS favorites 
DROP CONSTRAINT IF EXISTS favorites_user_id_fkey;

-- Watch history table
ALTER TABLE IF EXISTS watch_history 
DROP CONSTRAINT IF EXISTS watch_history_user_id_fkey;

-- Friends table
ALTER TABLE IF EXISTS friends 
DROP CONSTRAINT IF EXISTS friends_user_id_fkey,
DROP CONSTRAINT IF EXISTS friends_friend_id_fkey;

-- Watch parties table
ALTER TABLE IF EXISTS watch_parties 
DROP CONSTRAINT IF EXISTS watch_parties_host_id_fkey;

-- Party participants table
ALTER TABLE IF EXISTS party_participants 
DROP CONSTRAINT IF EXISTS party_participants_user_id_fkey;

-- Chat messages table
ALTER TABLE IF EXISTS chat_messages 
DROP CONSTRAINT IF EXISTS chat_messages_user_id_fkey;

-- Notifications table
ALTER TABLE IF EXISTS notifications 
DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;

-- Reviews table
ALTER TABLE IF EXISTS reviews 
DROP CONSTRAINT IF EXISTS reviews_user_id_fkey;

-- Reports table
ALTER TABLE IF EXISTS reports 
DROP CONSTRAINT IF EXISTS reports_reported_user_id_fkey,
DROP CONSTRAINT IF EXISTS reports_reported_by_fkey;

-- ============================================
-- 2. ADD NEW CONSTRAINTS WITH CASCADE DELETE
-- ============================================

-- Profiles table - CASCADE from auth.users
ALTER TABLE profiles 
ADD CONSTRAINT profiles_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Favorites table - CASCADE from profiles
ALTER TABLE favorites 
ADD CONSTRAINT favorites_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Watch history table - CASCADE from profiles
ALTER TABLE watch_history 
ADD CONSTRAINT watch_history_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Friends table - CASCADE from profiles (both directions)
ALTER TABLE friends 
ADD CONSTRAINT friends_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
ADD CONSTRAINT friends_friend_id_fkey 
FOREIGN KEY (friend_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Watch parties table - CASCADE from profiles
ALTER TABLE watch_parties 
ADD CONSTRAINT watch_parties_host_id_fkey 
FOREIGN KEY (host_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Party participants table - CASCADE from profiles
ALTER TABLE party_participants 
ADD CONSTRAINT party_participants_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Chat messages table - CASCADE from profiles
ALTER TABLE chat_messages 
ADD CONSTRAINT chat_messages_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Notifications table - CASCADE from profiles
ALTER TABLE notifications 
ADD CONSTRAINT notifications_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Reviews table - CASCADE from auth.users (if it references auth.users directly)
ALTER TABLE reviews 
ADD CONSTRAINT reviews_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Reports table - CASCADE from profiles (both directions)
ALTER TABLE reports 
ADD CONSTRAINT reports_reported_user_id_fkey 
FOREIGN KEY (reported_user_id) REFERENCES profiles(id) ON DELETE CASCADE,
ADD CONSTRAINT reports_reported_by_fkey 
FOREIGN KEY (reported_by) REFERENCES profiles(id) ON DELETE CASCADE;

-- TV watch history - CASCADE from auth.users
ALTER TABLE IF EXISTS tv_watch_history 
DROP CONSTRAINT IF EXISTS tv_watch_history_user_id_fkey;

ALTER TABLE IF EXISTS tv_watch_history 
ADD CONSTRAINT tv_watch_history_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- User activity - CASCADE from auth.users
ALTER TABLE IF EXISTS user_activity 
DROP CONSTRAINT IF EXISTS user_activity_user_id_fkey;

ALTER TABLE IF EXISTS user_activity 
ADD CONSTRAINT user_activity_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ============================================
-- VERIFICATION
-- ============================================

-- Check all foreign key constraints
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
    ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
    AND (ccu.table_name = 'users' OR ccu.table_name = 'profiles')
ORDER BY tc.table_name;
