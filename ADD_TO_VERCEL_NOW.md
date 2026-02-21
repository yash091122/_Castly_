# 🚀 Add These to Vercel RIGHT NOW

## Your Metered.ca Credentials

```
Username: 895844f552b0ad8e0d73bc12
Credential: I5yPaTHhFZLGQfNH
```

## Steps to Add to Vercel (2 minutes)

### 1. Go to Vercel
Open: https://vercel.com/dashboard

### 2. Select Your Project
Click on your project (castly)

### 3. Go to Settings → Environment Variables
- Click "Settings" in top nav
- Click "Environment Variables" in left sidebar

### 4. Add First Variable
Click "Add New" and enter:
```
Key: VITE_TURN_USERNAME
Value: 895844f552b0ad8e0d73bc12
Environments: ✓ Production ✓ Preview ✓ Development
```
Click "Save"

### 5. Add Second Variable
Click "Add New" again and enter:
```
Key: VITE_TURN_CREDENTIAL
Value: I5yPaTHhFZLGQfNH
Environments: ✓ Production ✓ Preview ✓ Development
```
Click "Save"

### 6. Redeploy
- Go to "Deployments" tab
- Click ••• on latest deployment
- Click "Redeploy"
- Wait for green checkmark

## OR Push to Git

The credentials are already in your local `.env` file, so you can also just push:

```bash
git add .
git commit -m "Add Metered.ca TURN credentials"
git push
```

This will trigger automatic deployment with the new credentials.

## Test After Deployment

1. Open: https://castly-gtku.vercel.app
2. Press F12 (console)
3. Create watch party
4. Join from different network
5. Look for "relay" in console logs
6. Video should work!

## What Was Updated

✅ Local `.env` file - credentials added
✅ `.env.example` - updated with your credentials
✅ `WatchPartyRoom.jsx` - both SimplePeer configs use `global.relay.metered.ca`
✅ All TURN endpoints configured (80, 443, TCP, TLS)

**Next step:** Add to Vercel and redeploy!
