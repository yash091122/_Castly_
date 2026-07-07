// Real-time Socket.io server for Castly Watch Party
// Complete sync engine with all features
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

// Health check endpoint for deployment platforms
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        service: 'Castly Sync Server',
        uptime: process.uptime(),
        rooms: rooms.size,
        onlineUsers: onlineUsers.size
    });
});

app.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
});

// Check if a specific room is still alive (used by Notifications page)
app.get('/room/:roomId/alive', (req, res) => {
    const { roomId } = req.params;
    const room = rooms.get(roomId);
    if (room && room.participants.size > 0) {
        res.json({
            alive: true,
            participants: room.participants.size,
            movieId: room.movieId,
            movieTitle: room.movieTitle,
            contentType: room.contentType,
            season: room.currentSeason,
            episode: room.currentEpisode,
        });
    } else {
        res.json({ alive: false });
    }
});

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true,
    pingTimeout: 300000,   // 5 min — wait this long before declaring a client dead
    pingInterval: 25000    // ping every 25s (client worker pings every 10s, so server always hears back)
});

// ============================================
// DATA STORES
// ============================================

// Store active rooms with full state
const rooms = new Map();
// Room structure: {
//   hostId: string,
//   hostSocketId: string,
//   movieId: string,
//   movieTitle: string,
//   playbackState: { isPlaying, currentTime, timestamp, playbackRate },
//   participants: Map<socketId, { userId, userData, isHost, syncStatus, bufferingStatus }>,
//   chat: [],
//   reactions: [],
//   votes: { active: boolean, options: [], votes: Map },
//   settings: { autoSync, driftThreshold, bufferPauseEnabled }
// }

// Store online users (userId -> socketId mapping)
const onlineUsers = new Map();

// Store user info (socketId -> user data)
const connectedUsers = new Map();

// Store last heartbeat time for each user
const userHeartbeats = new Map();

// Store pending disconnect grace period timeouts (userId -> timeout)
const pendingDisconnects = new Map();

// ============================================
// UTILITY FUNCTIONS
// ============================================

function createRoom(roomId, hostId, hostSocketId, movieId, movieTitle, userData) {
    return {
        hostId,
        hostSocketId,
        movieId,
        movieTitle,
        contentType: null, // 'movie' or 'tv'
        currentSeason: null,
        currentEpisode: null,
        videoUrl: null,
        playbackState: {
            isPlaying: false,
            currentTime: 0,
            timestamp: Date.now(),
            playbackRate: 1
        },
        participants: new Map([[hostSocketId, {
            odId: hostId,
            userData,
            isHost: true,
            syncStatus: 'synced',
            bufferingStatus: false,
            lastSyncTime: Date.now()
        }]]),
        chat: [],
        reactions: [],
        votes: { active: false, options: [], votes: new Map() },
        settings: {
            autoSync: true,
            driftThreshold: 2, // seconds
            bufferPauseEnabled: true
        }
    };
}

function getRoomState(room) {
    const participants = [];
    room.participants.forEach((p, socketId) => {
        participants.push({
            id: p.odId, // Use 'id' for consistency with friends
            odId: p.odId, // Keep odId for backward compatibility
            ...p.userData,
            isHost: p.isHost,
            syncStatus: p.syncStatus,
            bufferingStatus: p.bufferingStatus
        });
    });

    return {
        hostId: room.hostId,
        movieId: room.movieId,
        movieTitle: room.movieTitle,
        contentType: room.contentType,
        currentSeason: room.currentSeason,
        currentEpisode: room.currentEpisode,
        videoUrl: room.videoUrl,
        playbackState: room.playbackState,
        participants,
        settings: room.settings
    };
}

// ============================================
// HEARTBEAT & PRESENCE
// ============================================

setInterval(() => {
    const now = Date.now();
    userHeartbeats.forEach((lastHeartbeat, odId) => {
        if (now - lastHeartbeat > 120000) {
            console.log(`⏰ User ${odId} heartbeat timeout`);
            const socketId = onlineUsers.get(odId);
            if (socketId) {
                onlineUsers.delete(odId);
                connectedUsers.delete(socketId);
                userHeartbeats.delete(odId);
                io.emit('user:status', { userId: odId, online: false });
            }
        }
    });
}, 10000);

// ============================================
// SOCKET HANDLERS
// ============================================

io.on('connection', (socket) => {
    console.log('🔌 User connected:', socket.id);

    // ----------------------------------------
    // PRESENCE & AUTH
    // ----------------------------------------

    socket.on('ping', () => socket.emit('pong'));

    socket.on('heartbeat', ({ userId }) => {
        if (userId) userHeartbeats.set(userId, Date.now());
    });

    socket.on('user:online', ({ userId, userData }) => {
        console.log(`👤 User ${userId} (${userData.name}) is now online`);

        // Cancel any pending disconnect grace period
        if (pendingDisconnects.has(userId)) {
            clearTimeout(pendingDisconnects.get(userId));
            pendingDisconnects.delete(userId);
            console.log(`✅ Cancelled pending disconnect for ${userId} - user reconnected`);
        }

        const existingSocketId = onlineUsers.get(userId);
        if (existingSocketId && existingSocketId !== socket.id) {
            connectedUsers.delete(existingSocketId);
        }

        onlineUsers.set(userId, socket.id);
        connectedUsers.set(socket.id, { odId: userId, ...userData });
        userHeartbeats.set(userId, Date.now());

        console.log(`✅ Added to onlineUsers map: ${userId} -> ${socket.id}`);
        console.log(`📋 OnlineUsers map now has:`, Array.from(onlineUsers.entries()));

        io.emit('user:status', { userId, online: true, userData });

        const onlineUsersList = Array.from(onlineUsers.entries())
            .map(([uid, sid]) => {
                const userInfo = connectedUsers.get(sid);
                return {
                    userId: uid,
                    name: userInfo?.name || 'Anonymous User',
                    avatar: userInfo?.avatar
                };
            })
            .filter(u => u.userId);

        socket.emit('users:online', onlineUsersList);
        console.log(`📊 Total online users: ${onlineUsers.size}`);
    });

    // ----------------------------------------
    // ROOM MANAGEMENT
    // ----------------------------------------

    socket.on('room:create', ({ roomId, odId, movieId, movieTitle, userData }) => {
        if (rooms.has(roomId)) {
            socket.emit('room:error', { message: 'Room already exists' });
            return;
        }

        const room = createRoom(roomId, odId, socket.id, movieId, movieTitle, userData);
        rooms.set(roomId, room);
        socket.join(roomId);

        socket.emit('room:created', { roomId, roomState: getRoomState(room) });
        console.log(`🎬 Room ${roomId} created by ${userData.name}`);
    });

    socket.on('room:join', ({ roomId, odId, isHost, movieId, movieTitle, contentType, currentSeason, currentEpisode, videoUrl, userData }) => {
        console.log(`\n🚪 room:join received:`);
        console.log(`   Room: ${roomId}`);
        console.log(`   User: ${userData?.name} (${odId})`);
        console.log(`   Socket: ${socket.id}`);
        console.log(`   isHost: ${isHost}`);
        console.log(`   movieId: ${movieId}`);
        console.log(`   movieTitle: ${movieTitle}`);
        console.log(`   contentType: ${contentType}`);
        console.log(`   season: ${currentSeason}, episode: ${currentEpisode}`);
        console.log(`   videoUrl: ${videoUrl}`);

        // Check if this socket is already in the room
        if (rooms.has(roomId)) {
            const room = rooms.get(roomId);

            // Clean up any old socket entries for this user (e.g. they reconnected after tab switch)
            let oldSocketId = null;
            for (const [existingSocketId, participant] of room.participants.entries()) {
                if (participant.odId === odId && existingSocketId !== socket.id) {
                    oldSocketId = existingSocketId;
                    break;
                }
            }

            if (oldSocketId) {
                console.log(`   🔄 Migrating socket for user ${odId} from ${oldSocketId} to ${socket.id}`);
                const participantData = room.participants.get(oldSocketId);
                room.participants.delete(oldSocketId);

                // Add new socket instead
                room.participants.set(socket.id, participantData);
                if (room.hostSocketId === oldSocketId) {
                    room.hostSocketId = socket.id;
                }

                // Tell other clients to update their WebRTC signaling maps instead of dropping the video tile!
                socket.to(roomId).emit('participant:socket_migrated', {
                    id: odId,
                    odId,
                    oldSocketId,
                    newSocketId: socket.id
                });
            } else {
                // Completely new participant joining
                console.log(`   👋 New participant joined: ${userData.name}`);
                room.participants.set(socket.id, {
                    odId,
                    userData,
                    isHost: room.hostId === odId,
                    syncStatus: 'syncing',
                    bufferingStatus: true,
                    lastSyncTime: Date.now()
                });

                // Notify others in room
                socket.to(roomId).emit('participant:joined', {
                    id: odId,
                    odId,
                    userData: { ...userData, id: odId },
                    socketId: socket.id,
                    isHost: room.hostId === odId
                });
            }

            if (room.participants.has(socket.id)) {
                console.log(`   ⚠️ Socket ${socket.id} already in room, resending existing participants for WebRTC recovery`);
                socket.emit('room:state', getRoomState(room));

                // Resend existing participants to help client recover broken WebRTC peers
                const existingParticipants = [];
                room.participants.forEach((p, sId) => {
                    if (sId !== socket.id) {
                        existingParticipants.push({
                            socketId: sId,
                            odId: p.odId,
                            userData: { ...p.userData, id: p.odId }
                        });
                    }
                });
                socket.emit('room:existing_participants', existingParticipants);
                return;
            }
        }

        socket.join(roomId);

        // Get existing participants BEFORE adding new one (for WebRTC)
        const existingParticipants = [];
        if (rooms.has(roomId)) {
            rooms.get(roomId).participants.forEach((p, socketId) => {
                if (socketId !== socket.id) {
                    existingParticipants.push({
                        socketId,
                        odId: p.odId,
                        userData: { ...p.userData, id: p.odId }
                    });
                }
            });
            console.log(`   Found ${existingParticipants.length} existing participants`);
        } else {
            console.log(`   Room doesn't exist yet, will create`);
        }

        if (!rooms.has(roomId)) {
            const room = createRoom(roomId, odId, socket.id, movieId, movieTitle, userData);
            // Set content details for new room
            if (contentType) room.contentType = contentType;
            if (currentSeason) room.currentSeason = currentSeason;
            if (currentEpisode) room.currentEpisode = currentEpisode;
            if (videoUrl) room.videoUrl = videoUrl;
            rooms.set(roomId, room);
            console.log(`   ✅ Created new room with content:`, { movieId, movieTitle, contentType, currentSeason, currentEpisode });
        }

        const room = rooms.get(roomId);

        // CRITICAL FIX: Only update content if user is host
        // Guests should always receive the host's content from room state
        if (isHost) {
            if (movieId) room.movieId = movieId;
            if (movieTitle) room.movieTitle = movieTitle;
            if (contentType) room.contentType = contentType;
            if (currentSeason) room.currentSeason = currentSeason;
            if (currentEpisode) room.currentEpisode = currentEpisode;
            if (videoUrl) room.videoUrl = videoUrl;
            console.log(`   👑 Host updated room content:`, { movieId, movieTitle, contentType, currentSeason, currentEpisode });
        } else {
            // Guest joining - log what they'll receive
            console.log(`   👤 Guest joining - will sync to host's content:`, {
                hostMovieId: room.movieId,
                hostMovieTitle: room.movieTitle,
                hostContentType: room.contentType,
                hostSeason: room.currentSeason,
                hostEpisode: room.currentEpisode,
                guestRequestedMovieId: movieId // Log what guest tried to join with
            });
        }

        room.participants.set(socket.id, {
            odId,
            userData,
            // For existing rooms, determine host status from server's stored hostId, not from client
            isHost: room.hostId === odId,
            syncStatus: 'synced',
            bufferingStatus: false,
            lastSyncTime: Date.now()
        });

        // Only update hostId/hostSocketId if this user IS the stored host (reconnecting)
        // or if this is a brand new room with no host yet
        if (room.hostId === odId) {
            // Host reconnecting - update their socket
            room.hostSocketId = socket.id;
            console.log(`   👑 Host ${odId} reconnected, updated hostSocketId to ${socket.id}`);
        } else if (!room.hostId) {
            // Brand new room with no host - first joiner becomes host
            room.hostId = odId;
            room.hostSocketId = socket.id;
            room.participants.get(socket.id).isHost = true;
            console.log(`   👑 No host set, making ${odId} the host`);
        } else {
            console.log(`   👤 ${odId} joined as participant (host is ${room.hostId})`);
        }

        // Send current state to new participant
        console.log(`   Sending room:state to ${socket.id}`);
        const roomState = getRoomState(room);
        console.log(`   Room state being sent:`, { movieId: roomState.movieId, movieTitle: roomState.movieTitle, contentType: roomState.contentType });
        socket.emit('room:state', roomState);

        // Send list of existing participants for WebRTC connections
        console.log(`   Sending room:existing_participants to ${socket.id}:`, existingParticipants.map(p => `${p.socketId} (${p.userData?.name})`));
        socket.emit('room:existing_participants', existingParticipants);

        // Notify others (include socketId for WebRTC)
        console.log(`   Broadcasting participant:joined to room ${roomId}`);
        socket.to(roomId).emit('participant:joined', {
            id: odId,
            odId,
            userData: { ...userData, id: odId },
            socketId: socket.id,
            isHost: room.hostId === odId
        });

        console.log(`✅ User ${userData?.name} joined room ${roomId} (${room.participants.size} total)`);
    });

    socket.on('room:leave', ({ roomId }) => {
        handleLeaveRoom(socket, roomId);
    });

    // Host updates room details (movie, episode, etc.)
    socket.on('room:update_details', ({ roomId, movieId, movieTitle, contentType, season, episode, videoUrl }) => {
        const room = rooms.get(roomId);
        if (!room) return;

        // Verify sender is host
        const participant = room.participants.get(socket.id);
        const isHostBySocket = room.hostSocketId === socket.id;
        const isHostByUserId = participant && participant.odId === room.hostId;
        if (!isHostBySocket && !isHostByUserId) return;

        // Update room details
        if (movieId) room.movieId = movieId;
        if (movieTitle) room.movieTitle = movieTitle;
        if (contentType) room.contentType = contentType;
        if (season) room.currentSeason = season;
        if (episode) room.currentEpisode = episode;
        if (videoUrl) room.videoUrl = videoUrl;

        console.log(`📝 Room ${roomId} details updated:`, { movieId, movieTitle, contentType, season, episode });

        // CRITICAL FIX: Broadcast the update to all participants
        socket.to(roomId).emit('room:details_updated', {
            movieId,
            movieTitle,
            contentType,
            season,
            episode,
            videoUrl
        });
    });

    // Handle join request from guest
    socket.on('room:join_request', ({ roomId, userId, userData }) => {
        console.log(`\n👋 room:join_request received:`);
        console.log(`   Room ID: "${roomId}"`);
        console.log(`   User: ${userData?.name} (${userId})`);
        console.log(`   Requester Socket: ${socket.id}`);
        console.log(`   Total rooms in memory: ${rooms.size}`);
        console.log(`   Room IDs available: [${Array.from(rooms.keys()).join(', ')}]`);

        const room = rooms.get(roomId);
        if (!room) {
            console.log(`   ❌ Room "${roomId}" not found!`);
            socket.emit('room:error', { message: 'Room not found' });
            return;
        }

        console.log(`   ✅ Room found!`);
        console.log(`   Host ID: ${room.hostId}`);
        console.log(`   Host Socket ID: ${room.hostSocketId}`);
        console.log(`   Participants: ${room.participants.size}`);

        // Forward to host
        if (room.hostSocketId) {
            console.log(`   📤 Forwarding request to host socket: ${room.hostSocketId}`);
            io.to(room.hostSocketId).emit('room:join_request', {
                userId,
                userData,
                socketId: socket.id
            });
            console.log(`   ✅ Request forwarded successfully`);
        } else {
            console.log(`   ❌ No host socket ID found!`);
            socket.emit('room:error', { message: 'Host is not in the room' });
        }
    });

    // Host approves join request
    socket.on('room:join_approve', ({ roomId, userId, socketId }) => {
        const room = rooms.get(roomId);
        if (!room) return;

        // Verify sender is host
        const isHost = room.hostSocketId === socket.id;
        if (!isHost) {
            console.log(`⚠️ Non-host ${socket.id} tried to approve join request`);
            return;
        }

        console.log(`✅ Host approved join for ${userId}`);

        // Notify the requester
        io.to(socketId).emit('room:join_approved', {
            roomId,
            movieId: room.movieId,
            movieTitle: room.movieTitle,
            contentType: room.contentType,
            season: room.currentSeason,
            episode: room.currentEpisode
        });
    });

    // Host rejects join request
    socket.on('room:join_reject', ({ roomId, userId, socketId }) => {
        const room = rooms.get(roomId);
        if (!room) return;

        // Verify sender is host
        const isHost = room.hostSocketId === socket.id;
        if (!isHost) return;

        console.log(`❌ Host rejected join for ${userId}`);

        // Notify the requester
        io.to(socketId).emit('room:join_rejected', {});
    });

    // ----------------------------------------
    // MOVIE & CONTENT UPDATES
    // ----------------------------------------

    // Host updates movie/episode details
    socket.on('room:update_details', ({ roomId, movieId, movieTitle, contentType, season, episode, videoUrl }) => {
        const room = rooms.get(roomId);
        if (!room) return;

        // Verify host
        const isHost = room.hostSocketId === socket.id;
        if (!isHost) {
            console.log(`⚠️ Non-host tried to update room details`);
            return;
        }

        console.log(`🎬 Room ${roomId} details updated:`, { movieId, movieTitle, contentType, season, episode });

        // Update server state
        room.movieId = movieId;
        room.movieTitle = movieTitle;
        if (contentType) room.contentType = contentType;
        if (season) room.currentSeason = season;
        if (episode) room.currentEpisode = episode;
        if (videoUrl) room.videoUrl = videoUrl;

        // Broadcast to all participants (reusing room:state or sync:episode might be better, but let's send specific event)
        // Actually, let's just broadcast room:state so everyone syncs up full state
        const newState = getRoomState(room);
        io.to(roomId).emit('room:state', newState);

        // Also emit specific update event for toasts/notifications if needed
        socket.to(roomId).emit('room:details_updated', { movieId, movieTitle, contentType });
    });

    // Host ends the room for everyone
    socket.on('room:end', ({ roomId }) => {
        console.log(`🔴 room:end received for room ${roomId} from socket ${socket.id}`);

        const room = rooms.get(roomId);
        if (!room) {
            console.log(`⚠️ Room ${roomId} not found`);
            return;
        }

        // Get the participant data for this socket
        const participant = room.participants.get(socket.id);
        console.log(`   Participant:`, participant?.userData?.name);
        console.log(`   Room hostId:`, room.hostId);

        // Check if this user is the host (by userId OR socketId)
        const isHostBySocket = room.hostSocketId === socket.id;
        const isHostByUserId = participant && participant.odId === room.hostId;

        if (!isHostBySocket && !isHostByUserId) {
            console.log(`⚠️ Non-host tried to end room ${roomId}`);
            return;
        }

        console.log(`🔴 Host ending room ${roomId} - broadcasting room:ended`);

        // Notify all participants that room is ending
        io.to(roomId).emit('room:ended', {
            message: 'The host has ended the watch party',
            roomId
        });

        // Delay cleanup to ensure broadcast is sent
        setTimeout(() => {
            room.participants.forEach((p, socketId) => {
                const participantSocket = io.sockets.sockets.get(socketId);
                if (participantSocket) {
                    participantSocket.leave(roomId);
                }
            });
            rooms.delete(roomId);
            console.log(`🗑️ Room ${roomId} deleted`);
        }, 100);
    });

    // ----------------------------------------
    // MEDIA STATUS SYNC
    // ----------------------------------------

    // Participant toggles audio/video - broadcast to room
    socket.on('media:status', ({ roomId, userId, type, enabled }) => {
        const room = rooms.get(roomId);
        if (!room) return;

        console.log(`📡 Media status: User ${userId} ${type} ${enabled ? 'ON' : 'OFF'}`);

        // Broadcast to all other participants in the room
        socket.to(roomId).emit('media:status', {
            userId,
            type,
            enabled
        });
    });


    // Host plays video
    socket.on('sync:play', ({ roomId, timestamp }) => {
        const room = rooms.get(roomId);
        if (!room) return;

        room.playbackState = {
            ...room.playbackState,
            isPlaying: true,
            currentTime: timestamp,
            timestamp: Date.now()
        };

        socket.to(roomId).emit('sync:play', {
            timestamp,
            serverTime: Date.now()
        });
        console.log(`▶️ Room ${roomId}: Play at ${timestamp.toFixed(2)}s`);
    });

    // Host pauses video
    socket.on('sync:pause', ({ roomId, timestamp }) => {
        const room = rooms.get(roomId);
        if (!room) return;

        room.playbackState = {
            ...room.playbackState,
            isPlaying: false,
            currentTime: timestamp,
            timestamp: Date.now()
        };

        socket.to(roomId).emit('sync:pause', {
            timestamp,
            serverTime: Date.now()
        });
        console.log(`⏸️ Room ${roomId}: Pause at ${timestamp.toFixed(2)}s`);
    });

    // Host seeks to position
    socket.on('sync:seek', ({ roomId, timestamp }) => {
        const room = rooms.get(roomId);
        if (!room) return;

        room.playbackState = {
            ...room.playbackState,
            currentTime: timestamp,
            timestamp: Date.now()
        };

        socket.to(roomId).emit('sync:seek', {
            timestamp,
            serverTime: Date.now()
        });
        console.log(`⏩ Room ${roomId}: Seek to ${timestamp.toFixed(2)}s`);
    });

    // Guest reports their current time for drift detection
    socket.on('sync:report', ({ roomId, currentTime, odId }) => {
        const room = rooms.get(roomId);
        if (!room) return;

        const participant = room.participants.get(socket.id);
        if (!participant) return;

        // Calculate expected host time based on when playback state was last updated
        const timeSinceUpdate = (Date.now() - room.playbackState.timestamp) / 1000;
        const expectedHostTime = room.playbackState.isPlaying
            ? room.playbackState.currentTime + (timeSinceUpdate * room.playbackState.playbackRate)
            : room.playbackState.currentTime;

        const drift = Math.abs(currentTime - expectedHostTime);

        // Update participant sync status
        if (drift > room.settings.driftThreshold) {
            participant.syncStatus = 'behind';
            socket.emit('sync:drift', {
                drift,
                hostTime: expectedHostTime,
                action: drift > 5 ? 'jump' : 'speedup'
            });
        } else {
            participant.syncStatus = 'synced';
        }

        participant.lastSyncTime = Date.now();
    });

    // User is buffering
    socket.on('sync:buffering', ({ roomId, odId, isBuffering }) => {
        const room = rooms.get(roomId);
        if (!room) return;

        const participant = room.participants.get(socket.id);
        if (participant) {
            participant.bufferingStatus = isBuffering;
        }

        // Notify room about buffering status
        io.to(roomId).emit('sync:buffering_status', {
            odId,
            isBuffering
        });

        // If buffer pause is enabled and someone is buffering, pause for everyone
        if (room.settings.bufferPauseEnabled && isBuffering && room.playbackState.isPlaying) {
            room.playbackState.isPlaying = false;
            io.to(roomId).emit('sync:buffer_pause', {
                odId,
                message: `Waiting for ${participant?.userData?.name || 'someone'} to buffer...`
            });
            console.log(`⏳ Room ${roomId}: Paused for buffering`);
        }

        // Resume if no one is buffering
        if (!isBuffering) {
            let anyoneBuffering = false;
            room.participants.forEach(p => {
                if (p.bufferingStatus) anyoneBuffering = true;
            });

            if (!anyoneBuffering && !room.playbackState.isPlaying) {
                io.to(roomId).emit('sync:buffer_resume', {});
            }
        }
    });

    // Request current state from host
    socket.on('sync:request_state', ({ roomId }) => {
        const room = rooms.get(roomId);
        if (!room) return;

        if (room.hostSocketId) {
            io.to(room.hostSocketId).emit('sync:state_request', {
                requesterId: socket.id
            });
        }
    });

    // Host responds with current state
    socket.on('sync:state_response', ({ roomId, currentTime, isPlaying, requesterId }) => {
        const room = rooms.get(roomId);
        if (!room) return;

        // Verify sender is host
        const participant = room.participants.get(socket.id);
        const isHostBySocket = room.hostSocketId === socket.id;
        const isHostByUserId = participant && participant.odId === room.hostId;
        if (!isHostBySocket && !isHostByUserId) return;

        room.playbackState = {
            ...room.playbackState,
            currentTime,
            isPlaying,
            timestamp: Date.now()
        };

        if (requesterId) {
            io.to(requesterId).emit('sync:state', {
                currentTime,
                isPlaying,
                serverTime: Date.now()
            });
        } else {
            socket.to(roomId).emit('sync:state', {
                currentTime,
                isPlaying,
                serverTime: Date.now()
            });
        }
    });

    // Host changes playback speed
    socket.on('sync:speed', ({ roomId, speed }) => {
        const room = rooms.get(roomId);
        if (!room) return;

        // Verify sender is host
        const participant = room.participants.get(socket.id);
        const isHostBySocket = room.hostSocketId === socket.id;
        const isHostByUserId = participant && participant.odId === room.hostId;
        if (!isHostBySocket && !isHostByUserId) return;

        room.playbackState.playbackRate = speed;
        socket.to(roomId).emit('sync:speed', { speed });
        console.log(`⚡ Room ${roomId}: Speed changed to ${speed}x`);
    });

    // Host changes quality
    socket.on('sync:quality', ({ roomId, quality }) => {
        const room = rooms.get(roomId);
        if (!room) return;

        // Verify sender is host
        const participant = room.participants.get(socket.id);
        const isHostBySocket = room.hostSocketId === socket.id;
        const isHostByUserId = participant && participant.odId === room.hostId;
        if (!isHostBySocket && !isHostByUserId) return;

        socket.to(roomId).emit('sync:quality', { quality });
        console.log(`🎬 Room ${roomId}: Quality changed to ${quality}`);
    });

    // Host changes episode (TV shows)
    socket.on('sync:episode', ({ roomId, showId, season, episode, videoUrl }) => {
        const room = rooms.get(roomId);
        if (!room) return;

        // Verify sender is host
        const participant = room.participants.get(socket.id);
        const isHostBySocket = room.hostSocketId === socket.id;
        const isHostByUserId = participant && participant.odId === room.hostId;
        if (!isHostBySocket && !isHostByUserId) return;

        // Update room's movie info
        room.movieId = showId;
        room.movieTitle = `S${season} E${episode}`;
        room.contentType = 'tv';
        room.currentSeason = season;
        room.currentEpisode = episode;
        room.videoUrl = videoUrl;

        // Reset playback state for new episode
        room.playbackState = {
            isPlaying: false,
            currentTime: 0,
            timestamp: Date.now(),
            playbackRate: room.playbackState.playbackRate || 1
        };

        // Broadcast to all participants (including host for confirmation)
        io.to(roomId).emit('sync:episode', {
            showId,
            season,
            episode,
            videoUrl
        });

        console.log(`📺 Room ${roomId}: Episode changed to S${season} E${episode}`);
    });

    // ----------------------------------------
    // HOST CONTROLS
    // ----------------------------------------

    // Transfer host to another user
    socket.on('host:transfer', ({ roomId, newHostId }) => {
        console.log(`👑 host:transfer request for room ${roomId} -> new host ${newHostId}`);
        const room = rooms.get(roomId);
        if (!room) {
            console.log(`❌ Room ${roomId} not found`);
            return;
        }

        // Check if sender is host
        const participant = room.participants.get(socket.id);
        const isHostBySocket = room.hostSocketId === socket.id;
        const isHostByUserId = participant && participant.odId === room.hostId;

        console.log(`   Sender: ${socket.id} (OD: ${participant?.odId})`);
        console.log(`   Current Host: Socket=${room.hostSocketId}, OD=${room.hostId}`);
        console.log(`   Is Host? Socket=${isHostBySocket}, UserID=${isHostByUserId}`);

        if (!isHostBySocket && !isHostByUserId) {
            console.log(`❌ Sender is NOT host. Ignoring transfer.`);
            return;
        }

        // Find new host's socket
        let newHostSocketId = null;
        room.participants.forEach((p, sid) => {
            if (p.odId === newHostId) {
                newHostSocketId = sid;
            }
        });

        if (!newHostSocketId) {
            console.log(`⚠️ Cannot transfer host - user ${newHostId} not in room`);
            console.log('   Available participants:', Array.from(room.participants.values()).map(p => p.odId));
            return;
        }

        // Update old host
        const oldHost = room.participants.get(socket.id);
        if (oldHost) oldHost.isHost = false;

        // Update new host
        const newHost = room.participants.get(newHostSocketId);
        if (newHost) newHost.isHost = true;

        room.hostId = newHostId;
        room.hostSocketId = newHostSocketId;

        io.to(roomId).emit('host:changed', {
            newHostId,
            newHostName: newHost?.userData?.name
        });

        io.to(newHostSocketId).emit('host:promoted', {});
        socket.emit('host:demoted', {});

        console.log(`👑 Room ${roomId}: Host transferred to ${newHost?.userData?.name}`);
    });

    // Kick user from room
    socket.on('host:kick', ({ roomId, odId }) => {
        const room = rooms.get(roomId);
        if (!room) return;

        // Check if sender is host
        const participant = room.participants.get(socket.id);
        const isHostBySocket = room.hostSocketId === socket.id;
        const isHostByUserId = participant && participant.odId === room.hostId;
        if (!isHostBySocket && !isHostByUserId) return;

        // Find target's socket
        let targetSocketId = null;
        room.participants.forEach((p, sid) => {
            if (p.odId === odId) {
                targetSocketId = sid;
            }
        });

        if (!targetSocketId) {
            console.log(`⚠️ Cannot kick - user ${odId} not in room`);
            return;
        }

        io.to(targetSocketId).emit('room:kicked', {
            reason: 'You were removed by the host'
        });

        // Remove from room
        const targetSocket = io.sockets.sockets.get(targetSocketId);
        if (targetSocket) {
            targetSocket.leave(roomId);
        }
        room.participants.delete(targetSocketId);

        // Notify others
        socket.to(roomId).emit('participant:left', { id: odId, odId, socketId: targetSocketId });

        console.log(`🚫 Room ${roomId}: User ${odId} kicked`);
    });

    // Mute specific participant
    socket.on('host:mute_participant', ({ roomId, odId, muted }) => {
        const room = rooms.get(roomId);
        if (!room) return;

        // Check if sender is host
        const participant = room.participants.get(socket.id);
        const isHostBySocket = room.hostSocketId === socket.id;
        const isHostByUserId = participant && participant.odId === room.hostId;
        if (!isHostBySocket && !isHostByUserId) return;

        // Find target's socket
        let targetSocketId = null;
        room.participants.forEach((p, sid) => {
            if (p.odId === odId) {
                targetSocketId = sid;
            }
        });

        if (targetSocketId) {
            io.to(targetSocketId).emit('host:force_mute', { muted });
            console.log(`🔇 Room ${roomId}: User ${odId} ${muted ? 'muted' : 'unmuted'} by host`);
        }
    });

    // Mute all participants
    socket.on('host:mute_all', ({ roomId, muted }) => {
        const room = rooms.get(roomId);
        if (!room) return;

        // Check if sender is host
        const participant = room.participants.get(socket.id);
        const isHostBySocket = room.hostSocketId === socket.id;
        const isHostByUserId = participant && participant.odId === room.hostId;
        if (!isHostBySocket && !isHostByUserId) return;

        // Mute everyone except host
        room.participants.forEach((p, sid) => {
            if (sid !== socket.id) {
                io.to(sid).emit('host:force_mute', { muted });
            }
        });

        console.log(`🔇 Room ${roomId}: All participants ${muted ? 'muted' : 'unmuted'} by host`);
    });

    // Video off specific participant
    socket.on('host:video_off_participant', ({ roomId, odId, videoOff }) => {
        const room = rooms.get(roomId);
        if (!room) return;

        // Check if sender is host
        const participant = room.participants.get(socket.id);
        const isHostBySocket = room.hostSocketId === socket.id;
        const isHostByUserId = participant && participant.odId === room.hostId;
        if (!isHostBySocket && !isHostByUserId) return;

        // Find target's socket
        let targetSocketId = null;
        room.participants.forEach((p, sid) => {
            if (p.odId === odId) {
                targetSocketId = sid;
            }
        });

        if (targetSocketId) {
            io.to(targetSocketId).emit('host:force_video_off', { videoOff });
            console.log(`📹 Room ${roomId}: User ${odId} video ${videoOff ? 'off' : 'on'} by host`);
        }
    });

    // Video off all participants
    socket.on('host:video_off_all', ({ roomId, videoOff }) => {
        const room = rooms.get(roomId);
        if (!room) return;

        // Check if sender is host
        const participant = room.participants.get(socket.id);
        const isHostBySocket = room.hostSocketId === socket.id;
        const isHostByUserId = participant && participant.odId === room.hostId;
        if (!isHostBySocket && !isHostByUserId) return;

        // Video off everyone except host
        room.participants.forEach((p, sid) => {
            if (sid !== socket.id) {
                io.to(sid).emit('host:force_video_off', { videoOff });
            }
        });

        console.log(`📹 Room ${roomId}: All participants video ${videoOff ? 'off' : 'on'} by host`);
    });

    // Guest requests pause
    socket.on('guest:request_pause', ({ roomId, odId, reason }) => {
        const room = rooms.get(roomId);
        if (!room) return;

        const userData = room.participants.get(socket.id)?.userData;

        io.to(room.hostSocketId).emit('guest:pause_request', {
            odId,
            userName: userData?.name,
            reason
        });
        console.log(`✋ Room ${roomId}: ${userData?.name} requested pause`);
    });

    // ----------------------------------------
    // CHAT & REACTIONS
    // ----------------------------------------

    socket.on('chat:message', ({ roomId, message }) => {
        const room = rooms.get(roomId);
        if (room) {
            room.chat.push(message);
            if (room.chat.length > 100) room.chat.shift(); // Keep last 100 messages
        }
        io.to(roomId).emit('chat:message', message);
    });

    socket.on('chat:typing', ({ roomId, odId, isTyping }) => {
        socket.to(roomId).emit('chat:typing', { odId, isTyping });
    });

    // Floating reactions (emoji burst)
    socket.on('reaction:send', ({ roomId, emoji, odId, userData }) => {
        const reactionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        io.to(roomId).emit('reaction:received', {
            id: reactionId,
            emoji,
            odId,
            userName: userData?.name,
            timestamp: Date.now()
        });
    });

    // ----------------------------------------
    // VOTING SYSTEM
    // ----------------------------------------

    socket.on('vote:start', ({ roomId, question, options }) => {
        const room = rooms.get(roomId);
        if (!room || room.hostSocketId !== socket.id) return;

        room.votes = {
            active: true,
            question,
            options,
            votes: new Map()
        };

        io.to(roomId).emit('vote:started', { question, options });
        console.log(`🗳️ Room ${roomId}: Vote started - ${question}`);
    });

    socket.on('vote:cast', ({ roomId, odId, optionIndex }) => {
        const room = rooms.get(roomId);
        if (!room || !room.votes.active) return;

        room.votes.votes.set(userId, optionIndex);

        // Calculate results
        const results = room.votes.options.map((opt, idx) => {
            let count = 0;
            room.votes.votes.forEach(v => { if (v === idx) count++; });
            return { option: opt, count };
        });

        io.to(roomId).emit('vote:update', { results });
    });

    socket.on('vote:end', ({ roomId }) => {
        const room = rooms.get(roomId);
        if (!room || room.hostSocketId !== socket.id) return;

        room.votes.active = false;
        io.to(roomId).emit('vote:ended', {});
    });

    // ----------------------------------------
    // TV SHOWS - BINGE WATCHING FEATURES
    // ----------------------------------------

    // Host triggers next episode for all participants
    socket.on('tv:next_episode', ({ roomId, showId, season, episode }) => {
        const room = rooms.get(roomId);
        if (!room) return;

        // Verify sender is host
        const participant = room.participants.get(socket.id);
        const isHostBySocket = room.hostSocketId === socket.id;
        const isHostByUserId = participant && participant.odId === room.hostId;
        if (!isHostBySocket && !isHostByUserId) return;

        console.log(`📺 Room ${roomId}: Moving to S${season} E${episode}`);

        // Broadcast to all participants
        io.to(roomId).emit('tv:next_episode', { showId, season, episode });
    });

    // Toggle binge mode for the room
    socket.on('tv:binge_mode', ({ roomId, enabled }) => {
        const room = rooms.get(roomId);
        if (!room) return;

        // Verify sender is host
        const participant = room.participants.get(socket.id);
        const isHostBySocket = room.hostSocketId === socket.id;
        const isHostByUserId = participant && participant.odId === room.hostId;
        if (!isHostBySocket && !isHostByUserId) return;

        room.bingeMode = enabled;
        io.to(roomId).emit('tv:binge_mode', { enabled });
        console.log(`🔁 Room ${roomId}: Binge mode ${enabled ? 'enabled' : 'disabled'}`);
    });

    // Start voting for next episode
    socket.on('tv:start_vote', ({ roomId, type }) => {
        const room = rooms.get(roomId);
        if (!room) return;

        room.tvVote = {
            active: true,
            type,
            votes: new Map(),
            startTime: Date.now()
        };

        io.to(roomId).emit('tv:vote_started', { type });
        console.log(`🗳️ Room ${roomId}: Vote started for ${type}`);
    });

    // Cast vote for next episode
    socket.on('tv:cast_vote', ({ roomId, odId, vote }) => {
        const room = rooms.get(roomId);
        if (!room || !room.tvVote?.active) return;

        room.tvVote.votes.set(odId, vote);

        // Calculate results
        let continueCount = 0;
        let stopCount = 0;
        room.tvVote.votes.forEach(v => {
            if (v === 'continue') continueCount++;
            else if (v === 'stop') stopCount++;
        });

        io.to(roomId).emit('tv:vote_update', {
            votes: { continue: continueCount, stop: stopCount },
            totalVoters: room.participants.size
        });
    });

    // End voting
    socket.on('tv:end_vote', ({ roomId }) => {
        const room = rooms.get(roomId);
        if (!room || !room.tvVote) return;

        room.tvVote.active = false;
        io.to(roomId).emit('tv:vote_ended', {});
    });

    // Continue together - sync all users to same episode
    socket.on('tv:continue_together', ({ roomId, showId, season, episode }) => {
        const room = rooms.get(roomId);
        if (!room) return;

        // Verify sender is host
        const participant = room.participants.get(socket.id);
        const isHostBySocket = room.hostSocketId === socket.id;
        const isHostByUserId = participant && participant.odId === room.hostId;
        if (!isHostBySocket && !isHostByUserId) return;

        console.log(`👥 Room ${roomId}: Continue together to S${season} E${episode}`);

        // Reset playback state
        room.playbackState = {
            isPlaying: false,
            currentTime: 0,
            timestamp: Date.now(),
            playbackRate: 1
        };

        io.to(roomId).emit('tv:continue_together', { showId, season, episode });
    });

    // ----------------------------------------
    // WEBRTC SIGNALING
    // ----------------------------------------

    socket.on('signal', ({ to, signal, from, userName, userId, userAvatar }) => {
        console.log(`\n📡 WebRTC Signal:`);
        console.log(`   From: ${from} (${userName})`);
        console.log(`   To: ${to}`);
        console.log(`   Signal type: ${signal.type || 'candidate'}`);
        io.to(to).emit('signal', { signal, from, userName, userId, userAvatar });
        console.log(`   ✅ Signal relayed`);
    });

    // Media status updates (video/audio on/off)
    socket.on('media:status', ({ roomId, userId, type, enabled }) => {
        console.log(`\n🎥 Media Status Update:`);
        console.log(`   Room: ${roomId}`);
        console.log(`   User: ${userId}`);
        console.log(`   Type: ${type}`);
        console.log(`   Enabled: ${enabled}`);

        // Broadcast to all other participants in the room
        socket.to(roomId).emit('media:status', { userId, type, enabled });
        console.log(`   ✅ Media status broadcasted to room`);
    });

    // ----------------------------------------
    // FRIEND SYSTEM
    // ----------------------------------------

    socket.on('friend:request', ({ fromUserId, toUserId, userData }) => {
        const recipientSocketId = onlineUsers.get(toUserId);
        if (recipientSocketId) {
            io.to(recipientSocketId).emit('friend:request', {
                fromUserId, userData, timestamp: Date.now()
            });
        }
    });

    socket.on('friend:accept', ({ fromUserId, toUserId, userData }) => {
        const recipientSocketId = onlineUsers.get(toUserId);
        if (recipientSocketId) {
            io.to(recipientSocketId).emit('friend:accepted', {
                userId: fromUserId, userData
            });
        }
    });

    socket.on('friend:reject', ({ fromUserId, toUserId }) => {
        const recipientSocketId = onlineUsers.get(toUserId);
        if (recipientSocketId) {
            io.to(recipientSocketId).emit('friend:rejected', {
                userId: fromUserId
            });
        }
    });

    // ----------------------------------------
    // PARTY INVITES
    // ----------------------------------------

    socket.on('party:invite', ({ fromUserId, toUserId, roomId, movieId, movieTitle, userData }) => {
        console.log(`📤 Invite request received:`, {
            from: fromUserId,
            to: toUserId,
            room: roomId,
            movie: movieId
        });
        console.log(`📋 Current online users:`, Array.from(onlineUsers.entries()));

        let recipientSocketId = onlineUsers.get(toUserId);
        console.log(`🔍 Looking for user ${toUserId}, found socket: ${recipientSocketId}`);

        // Fallback: search in connectedUsers if not found in onlineUsers
        if (!recipientSocketId) {
            console.log(`🔍 Searching in connectedUsers...`);
            for (const [socketId, userData] of connectedUsers.entries()) {
                console.log(`  Checking socket ${socketId}:`, userData);
                if (userData.odId === toUserId) {
                    recipientSocketId = socketId;
                    console.log(`✅ Found user in connectedUsers: ${socketId}`);
                    break;
                }
            }
        }

        if (recipientSocketId) {
            io.to(recipientSocketId).emit('party:invite', {
                fromUserId, userData, roomId, movieId, movieTitle, timestamp: Date.now()
            });
            console.log(`💌 Party invite sent: ${userData.name} → ${toUserId} (Socket: ${recipientSocketId}, Room: ${roomId})`);
        } else {
            console.log(`⚠️ Cannot send invite - user ${toUserId} not found`);
            console.log(`   OnlineUsers:`, Array.from(onlineUsers.keys()));
            console.log(`   ConnectedUsers:`, Array.from(connectedUsers.entries()).map(([sid, ud]) => ({ socketId: sid, userId: ud.odId })));
        }
    });

    socket.on('watch_party:invite', ({ fromUserId, toUserId, roomId, movieTitle, userData }) => {
        const recipientSocketId = onlineUsers.get(toUserId);
        if (recipientSocketId) {
            io.to(recipientSocketId).emit('watch_party:invite', {
                fromUserId, userData, roomId, movieTitle, timestamp: Date.now()
            });
        }
    });

    // ----------------------------------------
    // DISCONNECT
    // ----------------------------------------

    socket.on('disconnect', (reason) => {
        console.log('User disconnected:', socket.id, 'Reason:', reason);
        const userData = connectedUsers.get(socket.id);
        connectedUsers.delete(socket.id);

        const isExplicit = reason === 'client namespace disconnect';

        if (isExplicit) {
            // ── Explicit leave (browser close / room:leave) → remove immediately ──
            if (userData?.odId) {
                const currentSocketId = onlineUsers.get(userData.odId);
                if (currentSocketId === socket.id) {
                    onlineUsers.delete(userData.odId);
                    userHeartbeats.delete(userData.odId);
                    io.emit('user:status', { userId: userData.odId, online: false });
                    console.log(`❌ User ${userData.odId} explicitly disconnected, removed immediately`);
                }
            }
            rooms.forEach((room, roomId) => {
                if (room.participants.has(socket.id)) {
                    handleLeaveRoom(socket, roomId);
                }
            });
        } else {
            // ── Transport close / ping timeout / tab switch → 30s grace period ──
            // CRITICAL FIX: Do NOT remove from onlineUsers here.
            // The user:online handler on reconnect will update onlineUsers to the new
            // socket ID. The grace-period timer then finds the new socket ID and migrates.
            // Only mark offline after grace period expires with no reconnect.
            const odId = userData?.odId;
            if (odId) {
                // Cancel any existing grace period for this user (edge case: double disconnect)
                if (pendingDisconnects.has(odId)) {
                    clearTimeout(pendingDisconnects.get(odId));
                }

                console.log(`⏳ User ${odId} disconnected (${reason}), starting 30s grace period...`);

                const gracePeriodTimeout = setTimeout(() => {
                    pendingDisconnects.delete(odId);

                    // Check if user came back with a new socket
                    const currentSocketId = onlineUsers.get(odId);
                    if (currentSocketId && currentSocketId !== socket.id) {
                        // ── Reconnected: migrate room membership to new socket ──
                        console.log(`✅ User ${odId} reconnected with new socket ${currentSocketId}, migrating rooms`);
                        rooms.forEach((room, roomId) => {
                            if (room.participants.has(socket.id)) {
                                const participantData = room.participants.get(socket.id);
                                room.participants.delete(socket.id);
                                room.participants.set(currentSocketId, participantData);
                                if (room.hostSocketId === socket.id) {
                                    room.hostSocketId = currentSocketId;
                                }
                                const newSocket = io.sockets.sockets.get(currentSocketId);
                                if (newSocket) {
                                    newSocket.join(roomId);
                                }
                                console.log(`🔄 Migrated ${odId}: ${socket.id} → ${currentSocketId} in room ${roomId}`);
                            }
                        });
                    } else {
                        // ── No reconnect: actually remove the user ──
                        console.log(`⏰ Grace period expired for ${odId}, removing from rooms & presence`);
                        rooms.forEach((room, roomId) => {
                            if (room.participants.has(socket.id)) {
                                handleLeaveRoom(socket, roomId);
                            }
                        });
                        // Now safe to mark offline (only if they haven't reconnected at all)
                        if (!onlineUsers.has(odId)) {
                            // already cleared by user:online on a new session — do nothing
                        } else if (onlineUsers.get(odId) === socket.id) {
                            onlineUsers.delete(odId);
                            userHeartbeats.delete(odId);
                            io.emit('user:status', { userId: odId, online: false });
                            console.log(`❌ User ${odId} is now offline (grace expired)`);
                        }
                    }
                }, 180000); // 3 min grace — covers worst-case mobile browser suspend

                pendingDisconnects.set(odId, gracePeriodTimeout);
            }
        }
    });
});

// ============================================
// HELPER FUNCTIONS
// ============================================

function handleLeaveRoom(socket, roomId) {
    const room = rooms.get(roomId);
    if (!room) return;

    const participant = room.participants.get(socket.id);
    if (participant) {
        socket.to(roomId).emit('participant:left', {
            id: participant.odId, // Add id for consistency
            odId: participant.odId,
            socketId: socket.id
        });

        room.participants.delete(socket.id);

        // USER REQUEST: "when the host reloads the window the host changes it should not be done until host wants"
        // If host left, DO NOT assign new host automatically so the original host can reclaim it on reload.
        /*
        if (room.hostSocketId === socket.id && room.participants.size > 0) {
            const [newHostSocketId, newHostData] = room.participants.entries().next().value;
            room.hostSocketId = newHostSocketId;
            room.hostId = newHostData.userId;
            newHostData.isHost = true;

            io.to(newHostSocketId).emit('host:promoted', {});
            io.to(roomId).emit('host:changed', {
                newHostId: newHostData.userId,
                newHostName: newHostData.userData?.name
            });
        }
        */

        if (room.participants.size === 0) {
            rooms.delete(roomId);
            console.log(`🗑️ Room ${roomId} deleted (empty)`);
        }
    }

    socket.leave(roomId);
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`🎬 Castly Sync Server running on port ${PORT}`);
    console.log(`   Features: Sync Engine, Chat, Reactions, Voting, WebRTC`);
});