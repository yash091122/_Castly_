-- Safe User Deletion Script
-- This script deletes a user and all their associated data
-- Replace 'USER_EMAIL_HERE' with the actual user email

-- Step 1: Get the user ID from email
DO $$
DECLARE
    target_user_id UUID;
BEGIN
    -- Get user ID from auth.users
    SELECT id INTO target_user_id 
    FROM auth.users 
    WHERE email = 'anushka.23bce10733@vitbhopal.ac.in';
    
    IF target_user_id IS NULL THEN
        RAISE NOTICE 'User not found';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Deleting user: %', target_user_id;
    
    -- Step 2: Delete from all related tables (in order of dependencies)
    
    -- Delete notifications
    DELETE FROM notifications WHERE user_id = target_user_id;
    RAISE NOTICE 'Deleted notifications';
    
    -- Delete chat messages
    DELETE FROM chat_messages WHERE user_id = target_user_id;
    RAISE NOTICE 'Deleted chat messages';
    
    -- Delete party participants
    DELETE FROM party_participants WHERE user_id = target_user_id;
    RAISE NOTICE 'Deleted party participants';
    
    -- Delete watch parties hosted by user
    DELETE FROM watch_parties WHERE host_id = target_user_id;
    RAISE NOTICE 'Deleted watch parties';
    
    -- Delete friends (both directions)
    DELETE FROM friends WHERE user_id = target_user_id OR friend_id = target_user_id;
    RAISE NOTICE 'Deleted friends';
    
    -- Delete watch history
    DELETE FROM watch_history WHERE user_id = target_user_id;
    RAISE NOTICE 'Deleted watch history';
    
    -- Delete TV watch history
    DELETE FROM tv_watch_history WHERE user_id = target_user_id;
    RAISE NOTICE 'Deleted TV watch history';
    
    -- Delete favorites
    DELETE FROM favorites WHERE user_id = target_user_id;
    RAISE NOTICE 'Deleted favorites';
    
    -- Delete reviews
    DELETE FROM reviews WHERE user_id = target_user_id;
    RAISE NOTICE 'Deleted reviews';
    
    -- Delete reports (both as reporter and reported)
    DELETE FROM reports WHERE reported_user_id = target_user_id OR reported_by = target_user_id;
    RAISE NOTICE 'Deleted reports';
    
    -- Delete user activity
    DELETE FROM user_activity WHERE user_id = target_user_id;
    RAISE NOTICE 'Deleted user activity';
    
    -- Delete admin logs (if user was admin)
    UPDATE admin_logs SET admin_id = NULL WHERE admin_id = target_user_id;
    RAISE NOTICE 'Updated admin logs';
    
    -- Step 3: Delete profile
    DELETE FROM profiles WHERE id = target_user_id;
    RAISE NOTICE 'Deleted profile';
    
    -- Step 4: Delete from auth.users (this is the final step)
    DELETE FROM auth.users WHERE id = target_user_id;
    RAISE NOTICE 'Deleted auth user';
    
    RAISE NOTICE 'User deletion completed successfully';
END $$;
