# Deploy Sync Server Guide

Your Castly app needs a WebSocket server for real-time features (watch parties, chat, presence).

## Quick Deploy to Render.com (Recommended - Free)

1. **Sign up at [render.com](https://render.com)**

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub: `yash091122/_Castly_`

3. **Configure Service**
   ```
   Name: castly-sync-server
   Root Directory: server
   Environment: Node
   Build Command: npm install
   Start Command: node syncServer.js
   Plan: Free
   ```

4. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment (2-3 minutes)
   - Copy your service URL: `https://castly-sync-server.onrender.com`

5. **Update Vercel Environment Variables**
   - Go to Vercel Dashboard → Castly Project → Settings → Environment Variables
   - Add new variable:
     - Key: `VITE_SOCKET_URL`
     - Value: `https://castly-sync-server.onrender.com`
   - Save and redeploy

## Alternative: Railway.app

1. Go to [railway.app](https://railway.app)
2. "New Project" → "Deploy from GitHub"
3. Select your repo
4. Set root directory: `server`
5. Copy the deployed URL
6. Add to Vercel as `VITE_SOCKET_URL`

## Alternative: Fly.io

```bash
cd server
fly launch --name castly-sync
fly deploy
```

Copy the URL and add to Vercel.

## Testing Locally (Development Only)

If you want to test with your local server from the deployed app:

1. **Install Cloudflare Tunnel:**
   ```bash
   brew install cloudflare/cloudflare/cloudflared
   ```

2. **Start your local server:**
   ```bash
   cd server
   npm start
   ```

3. **Create tunnel:**
   ```bash
   cloudflared tunnel --url http://localhost:3001
   ```

4. **Copy the tunnel URL** (e.g., `https://abc-123.trycloudflare.com`)

5. **Update Vercel env var** temporarily with tunnel URL

⚠️ **Note**: Tunnels are temporary and will close when you stop the command.

## Verify Deployment

After deploying and updating Vercel:

1. Visit your deployed app
2. Open browser console
3. You should see: `✅ Socket connected` instead of connection errors
4. Test watch party features

## Troubleshooting

**"WebSocket connection failed"**
- Check if sync server is running
- Verify `VITE_SOCKET_URL` in Vercel matches your deployed server URL
- Ensure server URL uses `https://` (not `http://`)
- Redeploy Vercel after changing environment variables

**"Cannot send heartbeat"**
- Socket server is down or unreachable
- Check server logs on Render/Railway/Fly

**CORS errors**
- Server already has CORS enabled for all origins
- If issues persist, check server logs
