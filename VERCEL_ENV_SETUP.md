# How to Add Environment Variables in Vercel

## Visual Step-by-Step Guide

### Step 1: Go to Vercel Dashboard
1. Open: https://vercel.com/dashboard
2. You'll see all your projects

### Step 2: Select Your Project
1. Click on your project name (castly or whatever it's called)
2. You'll land on the project overview page

### Step 3: Go to Settings
1. Look at the top navigation bar
2. Click "Settings" (between "Deployments" and "Analytics")

### Step 4: Open Environment Variables
1. Look at the left sidebar
2. Click "Environment Variables"
3. You'll see a list of existing variables (if any)

### Step 5: Add First Variable
1. Click "Add New" button (top right)
2. Fill in the form:
   - **Key**: `VITE_TURN_USERNAME`
   - **Value**: Paste your username from Metered.ca (looks like: `a1b2c3d4e5f6g7h8`)
   - **Environments**: Check ALL THREE boxes:
     - ✓ Production
     - ✓ Preview  
     - ✓ Development
3. Click "Save"

### Step 6: Add Second Variable
1. Click "Add New" button again
2. Fill in the form:
   - **Key**: `VITE_TURN_CREDENTIAL`
   - **Value**: Paste your credential from Metered.ca (looks like: `x9y8z7w6v5u4t3s2`)
   - **Environments**: Check ALL THREE boxes:
     - ✓ Production
     - ✓ Preview
     - ✓ Development
3. Click "Save"

### Step 7: Verify Variables Are Added
You should now see both variables in the list:
```
VITE_TURN_USERNAME     Production, Preview, Development
VITE_TURN_CREDENTIAL   Production, Preview, Development
```

### Step 8: Redeploy
1. Click "Deployments" in the top navigation
2. Find your latest deployment (top of the list)
3. Click the three dots (•••) on the right side
4. Click "Redeploy"
5. Wait for deployment to complete (1-2 minutes)

## Important Notes

⚠️ **Environment variables only work after redeployment**
- Adding variables doesn't automatically update your live app
- You MUST redeploy for changes to take effect

⚠️ **Check all three environment boxes**
- Production: Your live app (castly-gtku.vercel.app)
- Preview: Preview deployments from pull requests
- Development: Local development (if you use Vercel CLI)

⚠️ **No extra spaces**
- Copy-paste credentials directly from Metered.ca
- Don't add spaces before or after the values

⚠️ **Variable names must be exact**
- `VITE_TURN_USERNAME` (not `TURN_USERNAME` or `VITE_USERNAME`)
- `VITE_TURN_CREDENTIAL` (not `TURN_CREDENTIAL` or `VITE_PASSWORD`)

## How to Check If It Worked

After redeployment:

1. Open your app: https://castly-gtku.vercel.app
2. Press F12 to open Developer Console
3. Go to Console tab
4. Create or join a watch party
5. Look for logs like:
   ```
   📡 Sending signal to: [peer-id]
   ICE Candidate: candidate:...relay...
   ```
6. If you see "relay" in the candidates, TURN is working!

## Troubleshooting

### Problem: Variables not showing up
- Make sure you clicked "Save" for each variable
- Refresh the page to see updated list

### Problem: App still not working after redeploy
- Check deployment completed successfully (green checkmark)
- Hard refresh browser: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- Check console for errors

### Problem: Can't find Settings tab
- Make sure you're in the project view (not dashboard home)
- Click on your project name first

### Problem: Don't see "Add New" button
- Make sure you're in "Environment Variables" section
- You might need to scroll down

## Quick Reference

**What to add:**
```
Key: VITE_TURN_USERNAME
Value: [your Metered.ca username]
Environments: All three ✓

Key: VITE_TURN_CREDENTIAL  
Value: [your Metered.ca credential]
Environments: All three ✓
```

**Where to get credentials:**
https://www.metered.ca/tools/openrelay/ → Sign up → Dashboard

**After adding:**
Deployments → ••• → Redeploy → Wait → Test
