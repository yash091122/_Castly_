# Quick TURN Setup - 5 Minutes

Fix the "Connection failed" error in watch party by adding TURN servers.

## What You Need

1. Metered.ca account (free)
2. 2 credentials from Metered.ca
3. Access to Vercel dashboard

## Steps

### 1. Get Credentials (2 minutes)

1. Go to: https://www.metered.ca/tools/openrelay/
2. Click "Get Started Free"
3. Sign up with email
4. Copy your **Username** and **Credential** from dashboard

### 2. Add to Vercel (2 minutes)

1. Go to: https://vercel.com/dashboard
2. Click your project → Settings → Environment Variables
3. Add these two variables:

```
VITE_TURN_USERNAME = [paste your username]
VITE_TURN_CREDENTIAL = [paste your credential]
```

4. Check all 3 environment boxes (Production, Preview, Development)
5. Click Save for each

### 3. Redeploy (1 minute)

1. Go to Deployments tab
2. Click ••• on latest deployment
3. Click "Redeploy"
4. Wait for it to finish

### 4. Test

1. Open your app: https://castly-gtku.vercel.app
2. Create a watch party
3. Join from different network (mobile data)
4. Video should work now!

## Still Not Working?

Check the detailed guide: `METERED_TURN_SETUP.md`

## What Changed in Code

✅ Both SimplePeer configurations now use environment variables
✅ Multiple TURN endpoints configured (a.relay and b.relay)
✅ Proper fallback to STUN servers
✅ No more hardcoded credentials

## Why This Fixes It

- TURN servers relay video/audio when direct connection fails
- Works across different WiFi networks
- Works with firewalls and NAT
- Free tier: 50GB/month (enough for ~100 hours of calls)
