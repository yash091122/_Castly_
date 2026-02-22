# URGENT: Fix User Creation Error

## Quick Fix (Do This Now!)

### Step 1: Run the Complete Fix SQL

1. Open your **Supabase Dashboard**
2. Go to **SQL Editor**
3. Copy and paste the entire contents of `fix-profiles-table-complete.sql`
4. Click **RUN**

This will:
- Fix the profiles table structure
- Create the trigger with proper error handling
- Set up correct RLS policies
- Grant necessary permissions

### Step 2: Test User Creation

1. Open your app in the browser
2. Open **Developer Console** (F12)
3. Try to create a new user
4. Check the console for detailed error messages

## What the Code Changes Do

I've updated `react-app/src/config/supabase.js` to:
- Add detailed error logging
- Wait 500ms for the trigger to execute
- Check if profile was created
- Create profile manually if trigger failed
- Show specific error messages for different issues

## Debugging

If you still get errors, check the browser console. You should now see detailed logs like:

```
✅ User created: <user-id>
⚠️ Profile not created by trigger, creating manually...
❌ Failed to create profile manually: {error details}
```

### Common Error Codes

- **23505**: Username already exists (unique constraint violation)
- **42501**: Permission denied (RLS policy issue)
- **23503**: Foreign key violation (auth.users reference issue)

## If It Still Doesn't Work

Run the diagnostic script:

1. Open Supabase SQL Editor
2. Copy contents of `diagnose-profiles-table.sql`
3. Run it
4. Share the output with me

## Manual Workaround

If you need to create a user immediately:

```sql
-- In Supabase SQL Editor
INSERT INTO profiles (id, email, username, display_name, online_status)
VALUES (
  '<user-id-from-auth.users>',
  'user@example.com',
  'username',
  'Display Name',
  false
);
```

## Prevention

After fixing, the system will:
1. Try to create profile via trigger (automatic)
2. If trigger fails, create manually via code (fallback)
3. Show specific error messages if both fail

This ensures users can always sign up successfully!
