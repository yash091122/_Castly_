# Castly Sync Server

Real-time video synchronization server for Castly watch parties using Socket.IO and WebRTC signaling.

## Features

- Real-time video playback synchronization
- WebRTC peer-to-peer signaling
- Room management
- Participant tracking
- Media status updates
- Health check endpoints

## Local Development

```bash
# Install dependencies
npm install

# Start server
npm start

# Development with auto-reload
npm run dev
```

Server runs on `http://localhost:3001`

## Deployment

### Render.com (Recommended)

1. Push code to GitHub
2. Go to [Render.com](https://render.com)
3. Create new Web Service
4. Connect GitHub repo
5. Set Root Directory: `server`
6. Deploy!

See `../DEPLOY_SYNC_SERVER_GUIDE.md` for detailed instructions.

### Environment Variables

- `PORT` - Server port (default: 3001, auto-set by hosting platforms)
- `NODE_ENV` - Environment (production/development)

## API Endpoints

- `GET /` - Health check
- `GET /health` - Detailed health status
- WebSocket on `/socket.io/`

## Socket Events

### Client → Server
- `join:room` - Join a watch party room
- `leave:room` - Leave a room
- `video:play` - Notify video play
- `video:pause` - Notify video pause
- `video:seek` - Notify video seek
- `video:update` - Update video state
- `signal` - WebRTC signaling
- `media:toggle` - Toggle audio/video
- `heartbeat` - Keep connection alive

### Server → Client
- `room:state` - Room state update
- `participant:joined` - New participant
- `participant:left` - Participant left
- `video:sync` - Video sync command
- `signal` - WebRTC signaling
- `media:status` - Media status update

## CORS Configuration

Server accepts connections from:
- `http://localhost:5173` (local dev)
- `https://*.vercel.app` (Vercel deployments)
- Your production domain

Update CORS in `syncServer.js` if needed.
