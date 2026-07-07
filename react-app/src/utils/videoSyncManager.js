import io from 'socket.io-client';

class VideoSyncManager {
    constructor() {
        this.socket = null;
        this.roomId = null;
        this.isHost = false;
        this.videoElement = null;
        this.syncThreshold = 0.5; // Reduced from 2 to 0.5 seconds for tighter sync
        this.listeners = new Map();
        this.lastSyncTime = 0;
        this.syncDebounceMs = 100; // Debounce rapid sync events
        this.predictiveSync = true; // Enable predictive sync for smoother playback
    }

    connect(serverUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001') {
        if (this.socket?.connected) return;

        this.socket = io(serverUrl, {
            transports: ['websocket'], // WebSocket only for lower latency
            reconnection: true,
            reconnectionDelay: 500, // Faster reconnection
            reconnectionAttempts: 10,
            timeout: 5000,
            // Performance optimizations
            upgrade: false, // Skip polling upgrade
            rememberUpgrade: true,
            perMessageDeflate: false // Disable compression for speed
        });

        this.setupSocketListeners();
    }

    setupSocketListeners() {
        this.socket.on('connect', () => {
            console.log('✅ Connected to sync server');
            this.emit('connected');
        });

        this.socket.on('disconnect', () => {
            console.log('❌ Disconnected from sync server');
            this.emit('disconnected');
        });

        this.socket.on('sync:play', ({ timestamp, serverTime }) => {
            if (!this.isHost && this.videoElement) {
                this.applySyncWithPrediction('play', timestamp, serverTime);
            }
        });

        this.socket.on('sync:pause', ({ timestamp, serverTime }) => {
            if (!this.isHost && this.videoElement) {
                this.applySyncWithPrediction('pause', timestamp, serverTime);
            }
        });

        this.socket.on('sync:seek', ({ timestamp, serverTime }) => {
            if (!this.isHost && this.videoElement) {
                this.applySyncWithPrediction('seek', timestamp, serverTime);
            }
        });

        this.socket.on('sync:request', () => {
            if (this.isHost && this.videoElement) {
                this.broadcastState();
            }
        });

        this.socket.on('participant:joined', (data) => {
            this.emit('participant-joined', data);
            // Send current state to new participant immediately
            if (this.isHost) {
                setTimeout(() => this.broadcastState(), 100); // Reduced delay
            }
        });

        this.socket.on('participant:left', (data) => {
            this.emit('participant-left', data);
        });

        this.socket.on('chat:message', (message) => {
            this.emit('chat-message', message);
        });
    }

    // Predictive sync with network latency compensation
    applySyncWithPrediction(action, timestamp, serverTime) {
        if (!this.videoElement) return;

        const now = Date.now();
        const networkLatency = serverTime ? (now - serverTime) / 1000 : 0;
        
        // Compensate for network latency
        let adjustedTimestamp = timestamp;
        if (this.predictiveSync && action === 'play' && networkLatency > 0) {
            adjustedTimestamp = timestamp + networkLatency;
        }

        // Check if sync is needed
        const drift = Math.abs(this.videoElement.currentTime - adjustedTimestamp);
        
        if (action === 'play') {
            // Only seek if drift is significant
            if (drift > this.syncThreshold) {
                this.videoElement.currentTime = adjustedTimestamp;
            }
            this.videoElement.play().catch(e => console.warn('Play failed:', e));
            this.emit('synced', { action: 'play', timestamp: adjustedTimestamp, drift });
        } else if (action === 'pause') {
            if (drift > this.syncThreshold) {
                this.videoElement.currentTime = adjustedTimestamp;
            }
            this.videoElement.pause();
            this.emit('synced', { action: 'pause', timestamp: adjustedTimestamp, drift });
        } else if (action === 'seek') {
            this.videoElement.currentTime = adjustedTimestamp;
            this.emit('synced', { action: 'seek', timestamp: adjustedTimestamp, drift });
        }
    }

    joinRoom(roomId, userId, isHost = false) {
        this.roomId = roomId;
        this.isHost = isHost;

        this.socket.emit('room:join', {
            roomId,
            userId,
            isHost
        });

        this.emit('room-joined', { roomId, isHost });
    }

    leaveRoom() {
        if (this.roomId) {
            this.socket.emit('room:leave', { roomId: this.roomId });
            this.roomId = null;
            this.isHost = false;
            this.emit('room-left');
        }
    }

    attachVideo(videoElement) {
        this.videoElement = videoElement;

        if (this.isHost) {
            // Host controls - broadcast all actions with debouncing
            const debouncedSeek = this.debounce(() => this.handleSeek(), this.syncDebounceMs);
            
            videoElement.addEventListener('play', () => this.handlePlay());
            videoElement.addEventListener('pause', () => this.handlePause());
            videoElement.addEventListener('seeked', debouncedSeek);
            videoElement.addEventListener('ratechange', () => this.handleRateChange());

            // More frequent sync check for tighter synchronization
            this.syncInterval = setInterval(() => this.checkSync(), 2000); // Reduced from 5s to 2s
        } else {
            // Non-host - request sync immediately
            setTimeout(() => this.requestSync(), 300); // Reduced delay
            
            // Periodic drift correction for guests
            this.driftCheckInterval = setInterval(() => this.correctDrift(), 3000);
        }
    }

    detachVideo() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        if (this.driftCheckInterval) {
            clearInterval(this.driftCheckInterval);
        }
        this.videoElement = null;
    }

    handlePlay() {
        if (!this.isHost || !this.videoElement) return;

        const timestamp = this.videoElement.currentTime;
        this.socket.emit('sync:play', {
            roomId: this.roomId,
            timestamp
        });
    }

    handlePause() {
        if (!this.isHost || !this.videoElement) return;

        const timestamp = this.videoElement.currentTime;
        this.socket.emit('sync:pause', {
            roomId: this.roomId,
            timestamp
        });
    }

    handleSeek() {
        if (!this.isHost || !this.videoElement) return;

        const now = Date.now();
        if (now - this.lastSyncTime < this.syncDebounceMs) return;
        this.lastSyncTime = now;

        const timestamp = this.videoElement.currentTime;
        this.socket.emit('sync:seek', {
            roomId: this.roomId,
            timestamp
        });
    }

    handleRateChange() {
        if (!this.isHost || !this.videoElement) return;

        this.socket.emit('sync:speed', {
            roomId: this.roomId,
            speed: this.videoElement.playbackRate
        });
    }

    broadcastState() {
        if (!this.isHost || !this.videoElement) return;

        const state = {
            roomId: this.roomId,
            timestamp: this.videoElement.currentTime,
            paused: this.videoElement.paused,
            playbackRate: this.videoElement.playbackRate
        };

        this.socket.emit('sync:state', state);
    }

    requestSync() {
        if (this.isHost) return;

        this.socket.emit('sync:request', { roomId: this.roomId });
    }

    checkSync() {
        // Auto re-sync if users fall behind
        if (!this.isHost) return;

        this.socket.emit('sync:check', {
            roomId: this.roomId,
            timestamp: this.videoElement?.currentTime || 0,
            isPlaying: !this.videoElement?.paused
        });
    }

    // Guest drift correction
    correctDrift() {
        if (this.isHost || !this.videoElement) return;
        
        // Request current state from host to check for drift
        this.requestSync();
    }

    sendChatMessage(message) {
        this.socket.emit('chat:message', {
            roomId: this.roomId,
            message
        });
    }

    // Utility: Debounce function
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Event emitter pattern
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    off(event, callback) {
        if (!this.listeners.has(event)) return;
        const callbacks = this.listeners.get(event);
        const index = callbacks.indexOf(callback);
        if (index > -1) {
            callbacks.splice(index, 1);
        }
    }

    emit(event, data) {
        if (!this.listeners.has(event)) return;
        this.listeners.get(event).forEach(callback => callback(data));
    }

    disconnect() {
        this.leaveRoom();
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        this.listeners.clear();
    }
}

// Singleton instance
const videoSyncManager = new VideoSyncManager();

export default videoSyncManager;
