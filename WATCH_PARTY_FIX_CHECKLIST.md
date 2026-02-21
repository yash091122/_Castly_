# Watch Party Connection Fix - Complete Checklist

## ✅ What's Been Done (Code Changes)

- [x] Updated WatchPartyRoom.jsx to use environment variables for TURN servers
- [x] Replaced hardcoded credentials with Metered.ca configuration
- [x] Added multiple TURN endpoints (a.relay and b.relay)
- [x] Updated both SimplePeer configurations (host and guest)
- [x] Added TURN credentials to .env and .env.example
- [x] Created detailed setup documentation

## 📋 What You Need to Do

### 1. Get Metered.ca Credentials ⏱️ 2 minutes

- [ ] Go to https://www.metered.ca/tools/openrelay/
- [ ] Click "Get Started Free"
- [ ] Sign up with email
- [ ] Verify email
- [ ] Log in to dashboard
- [ ] Copy your Username (looks like: `a1b2c3d4e5f6g7h8`)
- [ ] Copy your Credential (looks like: `x9y8z7w6v5u4t3s2`)

**Where to find credentials:**
Dashboard → "Your TURN Server Credentials" section

### 2. Add to Vercel ⏱️ 2 minutes

- [ ] Go to https://vercel.com/dashboard
- [ ] Click your project (castly)
- [ ] Click Settings → Environment Variables
- [ ] Click "Add New"
- [ ] Add `VITE_TURN_USERNAME` with your username
- [ ] Check all 3 environments (Production, Preview, Development)
- [ ] Click Save
- [ ] Click "Add New" again
- [ ] Add `VITE_TURN_CREDENTIAL` with your credential
- [ ] Check all 3 environments
- [ ] Click Save

**Detailed guide:** See `VERCEL_ENV_SETUP.md`

### 3. Redeploy ⏱️ 1 minute

- [ ] Go to Deployments tab in Vercel
- [ ] Click ••• on latest deployment
- [ ] Click "Redeploy"
- [ ] Wait for green checkmark (deployment complete)

**OR** push a commit:
```bash
git add .
git commit -m "Add TURN server credentials"
git push
```

### 4. Test ⏱️ 2 minutes

- [ ] Open https://castly-gtku.vercel.app
- [ ] Press F12 (open console)
- [ ] Create a watch party
- [ ] Join from different network (mobile data or different WiFi)
- [ ] Check if video/audio works
- [ ] Look for "relay" in console ICE candidates

## 🎯 Success Criteria

You'll know it's working when:
- ✅ Video connects across different networks
- ✅ No "Connection failed" errors
- ✅ Console shows: `ICE Candidate: candidate:...relay...`
- ✅ Both users can see/hear each other

## 📚 Documentation Created

Quick guides:
- `QUICK_TURN_SETUP.md` - 5-minute quick start
- `VERCEL_ENV_SETUP.md` - Visual Vercel guide

Detailed guides:
- `METERED_TURN_SETUP.md` - Complete setup with troubleshooting
- `TURN_SETUP_COMPLETE.md` - Summary of code changes

## 🔧 Troubleshooting

### Issue: Still getting "Connection failed"

Check these in order:

1. **Credentials correct?**
   - [ ] No extra spaces in Vercel variables
   - [ ] Copied directly from Metered.ca dashboard
   - [ ] Both variables added (USERNAME and CREDENTIAL)

2. **Redeployed?**
   - [ ] Deployment completed successfully
   - [ ] Check timestamp is after adding variables
   - [ ] Green checkmark in Vercel deployments

3. **Browser cache?**
   - [ ] Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - [ ] Try incognito/private window
   - [ ] Try different browser

4. **Console errors?**
   - [ ] Press F12 → Console tab
   - [ ] Look for error messages
   - [ ] Check for "relay" in ICE candidates

### Issue: Can't find credentials on Metered.ca

- Log in to https://dashboard.metered.ca
- Look for "Your TURN Server Credentials" section
- Check welcome email for dashboard link
- Contact Metered.ca support if still can't find

### Issue: Variables not in Vercel

- Make sure you clicked "Save" for each variable
- Refresh Vercel page
- Check you're in correct project
- Try adding again

## 💡 Tips

- **Test on different networks**: Same WiFi doesn't test TURN servers
- **Check console logs**: F12 → Console shows connection details
- **Free tier limits**: 50GB/month = ~100 hours of video calls
- **Keep credentials private**: Don't commit to git or share publicly

## 🆘 Need Help?

If you've completed all steps and it still doesn't work:

1. Check console logs (F12 → Console)
2. Screenshot any error messages
3. Verify Vercel environment variables are set
4. Check deployment completed successfully
5. Try from completely different network (mobile data)

## 📊 What Changed in Code

**File: `react-app/src/pages/WatchPartyRoom.jsx`**

Before:
```javascript
{
  urls: 'turn:openrelay.metered.ca:80',
  username: 'openrelayproject',
  credential: 'openrelayproject'
}
```

After:
```javascript
{
  urls: 'turn:a.relay.metered.ca:80',
  username: TURN_USERNAME,  // from environment variable
  credential: TURN_CREDENTIAL  // from environment variable
}
```

**Environment Variables:**
```env
VITE_TURN_USERNAME=your_metered_username
VITE_TURN_CREDENTIAL=your_metered_credential
```

## 🚀 Next Steps After Setup

Once working:
1. Test with multiple users
2. Monitor usage in Metered.ca dashboard
3. Consider upgrading if you exceed free tier
4. Add more TURN servers for redundancy (optional)

## ⏰ Total Time Required

- Get credentials: 2 minutes
- Add to Vercel: 2 minutes
- Redeploy: 1 minute
- Test: 2 minutes

**Total: ~7 minutes**

---

**Current Status:** Code is ready, waiting for you to add Metered.ca credentials to Vercel.

**Next Action:** Follow Step 1 above to get your credentials.
