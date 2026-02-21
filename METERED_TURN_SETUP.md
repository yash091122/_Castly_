# Metered.ca TURN Server Setup Guide

## What is This For?

TURN servers help WebRTC connections work across different networks (like when users are on different WiFi networks or behind firewalls). Without TURN servers, your watch party video/audio might not connect when users are on different networks.

## Step 1: Sign Up for Metered.ca

1. **Visit**: https://www.metered.ca/tools/openrelay/
2. **Click**: "Get Started Free" button (green button on the page)
3. **Sign Up**: 
   - Enter your email address
   - Create a password
   - Click "Sign Up"
4. **Verify Email**: Check your inbox and click the verification link
5. **Log In**: Return to https://dashboard.metered.ca and log in

## Step 2: Get Your TURN Credentials

1. After logging in, you'll land on your **Dashboard**
2. Look for a section called **"Your TURN Server Credentials"** or **"API Credentials"**
3. You'll see:
   - **TURN Server URLs** (multiple URLs listed)
   - **Username** (a long string like: `a1b2c3d4e5f6g7h8`)
   - **Credential** (another long string like: `x9y8z7w6v5u4t3s2`)

4. **Copy both the Username and Credential** - you'll need them in the next steps

**Example of what you'll see:**
```
TURN Server URLs:
- turn:a.relay.metered.ca:80
- turn:a.relay.metered.ca:443
- turn:a.relay.metered.ca:443?transport=tcp
- turn:b.relay.metered.ca:80
- turn:b.relay.metered.ca:443
- turn:b.relay.metered.ca:443?transport=tcp

Username: a1b2c3d4e5f6g7h8
Credential: x9y8z7w6v5u4t3s2
```

**Important**: Keep these credentials private! Don't share them publicly.

## Step 3: Add Credentials to Local Development

1. **Open** the file `react-app/.env` in your project
   - If it doesn't exist, create it in the `react-app` folder
   
2. **Add these lines** (replace with your actual credentials):

```env
VITE_TURN_USERNAME=a1b2c3d4e5f6g7h8
VITE_TURN_CREDENTIAL=x9y8z7w6v5u4t3s2
```

3. **Save the file**

4. **Restart your dev server** if it's running:
   - Stop the server (Ctrl+C)
   - Run `npm run dev` again

## Step 4: Add Credentials to Vercel (Production)

This is the most important step for your deployed app to work!

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Select your project** (click on it)
3. **Go to Settings** (top navigation bar)
4. **Click "Environment Variables"** (left sidebar)
5. **Add First Variable**:
   - Key: `VITE_TURN_USERNAME`
   - Value: (paste your username from Metered.ca)
   - Environments: Check all three boxes (Production, Preview, Development)
   - Click "Save"
6. **Add Second Variable**:
   - Key: `VITE_TURN_CREDENTIAL`
   - Value: (paste your credential from Metered.ca)
   - Environments: Check all three boxes (Production, Preview, Development)
   - Click "Save"

**Screenshot guide for Vercel:**
```
Vercel Dashboard
  └─ Your Project
      └─ Settings
          └─ Environment Variables
              └─ Add New
                  ├─ Name: VITE_TURN_USERNAME
                  ├─ Value: your_username
                  └─ Environments: ✓ Production ✓ Preview ✓ Development
```

## Step 5: Redeploy Your App

After adding environment variables to Vercel:

1. **Go to Deployments** tab in Vercel
2. **Click the three dots** (•••) on your latest deployment
3. **Click "Redeploy"**
4. Wait for deployment to complete (usually 1-2 minutes)

**OR** just push a new commit to trigger automatic deployment:
```bash
git add .
git commit -m "Add TURN server credentials"
git push
```

## Step 6: Test Your Setup

After redeploying:

1. **Open your app** in a browser: https://castly-gtku.vercel.app
2. **Open Developer Console** (Press F12 or right-click → Inspect)
3. **Go to Console tab**
4. **Create or join a watch party**
5. **Look for these logs**:
   - `🔌 Socket connected`
   - `📡 Sending signal to: [peer-id]`
   - `ICE Candidate: candidate:...relay...` (this means TURN is working!)

**Good signs:**
- You see "relay" in ICE candidates
- Video/audio connects even on different networks
- No "Connection failed" errors

**Bad signs:**
- Only "host" or "srflx" candidates (no "relay")
- "Connection failed" errors
- Video doesn't show up

## Step 7: Test Across Different Networks

The real test is connecting from different networks:

1. **User 1**: Connect from your home WiFi
2. **User 2**: Connect from mobile data or different WiFi
3. **Start a watch party** and invite each other
4. **Check if video/audio works**

If it works, congratulations! Your TURN servers are configured correctly.

## Free Tier Limits

Metered.ca free tier includes:
- **50 GB/month** of TURN relay traffic
- Unlimited STUN requests
- Multiple server locations
- No credit card required

This is usually enough for:
- ~100 hours of video calls
- ~50 watch party sessions
- Testing and small-scale use

## Troubleshooting

### Problem: Can't find my credentials on Metered.ca
**Solution:**
- Log in to https://dashboard.metered.ca
- Credentials should be on the main dashboard page
- Look for "Your TURN Server Credentials" section
- If you still can't find them, check your welcome email

### Problem: Still getting "Connection failed" errors
**Solution:**
1. **Check Vercel environment variables**:
   - Go to Vercel → Settings → Environment Variables
   - Make sure both `VITE_TURN_USERNAME` and `VITE_TURN_CREDENTIAL` are there
   - Make sure there are no extra spaces in the values
   
2. **Verify you redeployed**:
   - Environment variables only take effect after redeployment
   - Go to Deployments tab and check the latest deployment time
   
3. **Check browser console**:
   - Press F12 → Console tab
   - Look for any error messages
   - Share them if you need help

4. **Clear cache and hard reload**:
   - Press Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - This forces browser to get fresh code

### Problem: Video works on same WiFi but not different networks
**Solution:**
- This means TURN servers aren't being used
- Double-check credentials are correct (copy-paste from Metered.ca)
- Make sure you redeployed after adding environment variables
- Check console for "relay" candidates (should see them if TURN is working)

### Problem: "Peer Error: Connection failed"
**Solution:**
- This is the error you're seeing now
- It means WebRTC can't establish connection
- Follow all steps above to add TURN credentials
- Make sure to redeploy after adding to Vercel

### Problem: Environment variables not working locally
**Solution:**
- Make sure `.env` file is in `react-app` folder (not root)
- Restart your dev server after adding variables
- Check file is named exactly `.env` (not `.env.txt`)

## Free Tier Limits

Metered.ca free tier includes:
- **50 GB/month** of TURN relay traffic
- Unlimited STUN requests
- Multiple server locations worldwide
- No credit card required

**This is enough for:**
- ~100 hours of video calls per month
- ~50 watch party sessions
- Testing and small-scale use
- Personal projects

**If you exceed limits:**
- Paid plans start at $29/month for 500GB
- Better for production apps with many users
- More reliable connections
- Priority support

## Summary Checklist

Before asking for help, make sure you've done ALL of these:

- [ ] Created Metered.ca account at https://www.metered.ca/tools/openrelay/
- [ ] Copied Username and Credential from dashboard
- [ ] Added both variables to Vercel environment variables
- [ ] Selected all three environments (Production, Preview, Development)
- [ ] Redeployed the app after adding variables
- [ ] Waited for deployment to complete
- [ ] Hard refreshed browser (Ctrl+Shift+R)
- [ ] Tested watch party connection
- [ ] Checked browser console for errors

## Need Help?

If you've followed all steps and it still doesn't work:

1. **Check console logs**: Press F12 → Console tab, copy any error messages
2. **Verify environment variables**: Screenshot your Vercel environment variables (hide the values)
3. **Test ICE candidates**: Look for "relay" in console logs when connecting
4. **Share details**: What error message you see, what network you're on, etc.

## Code Changes Made

The code has been updated to use your Metered.ca credentials via environment variables:
- ✅ `WatchPartyRoom.jsx` now uses `VITE_TURN_USERNAME` and `VITE_TURN_CREDENTIAL`
- ✅ Both SimplePeer configurations updated (host and guest)
- ✅ Multiple TURN server endpoints configured (a.relay and b.relay)
- ✅ Fallback STUN servers included for redundancy

**Next step**: Get your credentials from Metered.ca and add them to Vercel!
