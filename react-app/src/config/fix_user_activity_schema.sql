DO $$ 
BEGIN
    -- 1. Fix 'type' column mismatch
    -- If 'activity_type' exists but 'type' does not, rename it
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_activity' AND column_name = 'activity_type'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_activity' AND column_name = 'type'
    ) THEN
        ALTER TABLE user_activity RENAME COLUMN activity_type TO type;
    
    -- If neither exists, add 'type'
    ELSIF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_activity' AND column_name = 'type'
    ) THEN
        ALTER TABLE user_activity ADD COLUMN type VARCHAR(50);
    END IF;

    -- 2. Fix 'title' column mismatch 
    -- If 'content_title' exists but 'title' does not, rename it
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_activity' AND column_name = 'content_title'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_activity' AND column_name = 'title'
    ) THEN
        ALTER TABLE user_activity RENAME COLUMN content_title TO title;
        
    -- If neither exists, add 'title'
    ELSIF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_activity' AND column_name = 'title'
    ) THEN
        ALTER TABLE user_activity ADD COLUMN title TEXT;
    END IF;

    -- 3. Ensure 'metadata' column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_activity' AND column_name = 'metadata'
    ) THEN
        ALTER TABLE user_activity ADD COLUMN metadata JSONB DEFAULT '{}';
    END IF;

END $$;
