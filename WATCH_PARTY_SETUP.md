# Watch Party WebRTC Setup & Troubleshooting

## Current Status

✅ **Completed:**
- Sync server code with WebSocket signaling
- WebRTC peer connection setup with TURN/STUN servers
- Video sync manager for playback synchronization
- Comprehensive TURN server configuration (10+ servers)

❌ **Issues:**
- Peer connections failing across different networks
- Free TURN servers are unreliable
- Video/audio not visible between host and guests on different networks

## Why Connections Fail

WebRTC peer-to-peer connections fail when:
1. **Both users are behind NAT/firewalls** (different networks)
2. **STUN servers can't establish direct connection**
3. **TURN servers are needed but free ones are unreliable**

## Solutions

### Option 1: Use Reliable TURN Service (Recommended)

Free TURN servers are unreliable. Use a paid service:

#### Twilio TURN (Recommended)
1. Sign up at https://www.twilio.com
2. Get TURN credentials from Twilio Console
3. Update `WatchPartyRoom.jsx` with Twilio TURN servers:

```javascript
iceServers: [
  { urls: 'stun:global.stun.twilio.com:3478' },
  {
    urls: 'turn:global.turn.twilio.com:3478?transport=udp',
    username: 'YOUR_TWILIO_USERNAME',
    credential: 'YOUR_TWILIO_CREDENTIAL'
  },
  {
    urls: 'turn:global.turn.twilio.com:3478?transport=tcp',
    username: 'YOUR_TWILIO_USERNAME',
    credential: 'YOUR_TWILIO_CREDENTIAL'
  }
]
```

**Cost:** ~$0.40 per GB of relayed traffic (very affordable)

#### Metered.ca (Alternative)
1. Sign up at https://www.metered.ca
2. Get free tier: 50GB/month
3. Use their TURN servers with your credentials

### Option 2: Self-Host TURN Server

Use Coturn on a VPS:

1. Get a VPS (DigitalOcean, AWS, etc.)
2. Install Coturn:
   ```bash
   sudo apt-get install coturn
   ```
3. Configure `/etc/turnserver.conf`
4. Use your server in the app

**Cost:** ~$5-10/month for VPS

### Option 3: Test on Same Network

For testing/demo purposes:
- Both users connect from same WiFi network
- Direct peer-to-peer connection works without TURN
- Video/audio will be visible

## Current Configuration

The app uses these TURN servers (in order):
1. OpenRelay Metered.ca (free, unreliable)
2. Relay Metered.ca (free, unreliable)
3. Numb TURN (free, unreliable)
4. Multiple Google STUN servers

**Problem:** Free TURN servers have:
- Rate limits
- Unreliable uptime
- Slow speeds
- Connection failures

## Deployment Checklist

### 1. Sync Server (Required)
- [x] Code ready in `server/` directory
- [ ] Deployed to Render.com/Railway/Fly.io
- [ ] `VITE_SOCKET_URL` set in Vercel environment variables
- [ ] Health check endpoint working

**Deploy sync server:**
```bash
# On Render.com
1. New Web Service
2. Connect GitHub repo
3. Root Directory: server
4. Build: npm install
5. Start: node syncServer.js
```

**Set in Vercel:**
```
VITE_SOCKET_URL=https://your-sync-server.onrender.com
```

### 2. TURN Server (Required for cross-network)
- [ ] Sign up for Twilio/Metered.ca
- [ ] Get TURN credentials
- [ ] Update WatchPartyRoom.jsx with credentials
- [ ] Test connection

### 3. Supabase Configuration
- [ ] Site URL set to production domain
- [ ] Email confirmation disabled (or configured)
- [ ] Google OAuth configured (optional)

## Testing

### Test 1: Same Network
1. Host creates watch party
2. Guest joins from same WiFi
3. Should see video/audio ✅

### Test 2: Different Networks
1. Host on WiFi, Guest on mobile data
2. Requires working TURN server
3. Will fail with free TURN servers ❌

### Test 3: Sync Server
1. Open browser console
2. Look for: `✅ Socket connected`
3. If error: Check VITE_SOCKET_URL

## Troubleshooting

### "Connection failed" errors
- **Cause:** TURN servers not working
- **Fix:** Use paid TURN service (Twilio)

### "WebSocket connection failed"
- **Cause:** Sync server not deployed or wrong URL
- **Fix:** Deploy sync server, set VITE_SOCKET_URL

### Video shows but is black
- **Cause:** Camera permissions or stream not captured
- **Fix:** Allow camera/mic permissions in browser

### Video works on same WiFi but not different networks
- **Cause:** Need TURN server for NAT traversal
- **Fix:** Use paid TURN service

## Recommended Production Setup

1. **Sync Server:** Render.com ($7/month) or Railway
2. **TURN Server:** Twilio (~$0.40/GB) or Metered.ca (50GB free)
3. **Total Cost:** ~$7-15/month for reliable watch parties

## Quick Fix for Demo

If you need it working NOW for a demo:
1. Both users connect from same WiFi network
2. Or use mobile hotspot and connect both devices to it
3. Direct P2P will work without TURN

## Files Modified

- `react-app/src/pages/WatchPartyRoom.jsx` - WebRTC peer setup
- `react-app/src/utils/videoSyncManager.js` - Video synchronization
- `react-app/src/context/SocketContext.jsx` - WebSocket connection
- `server/syncServer.js` - Signaling server

## Next Steps

1. Deploy sync server to Render.com
2. Set VITE_SOCKET_URL in Vercel
3. Sign up for Twilio TURN service
4. Update TURN credentials in code
5. Test watch party across different networks
