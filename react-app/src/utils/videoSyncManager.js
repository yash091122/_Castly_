import io from 'socket.io-client';

class VideoSyncManager {
    constructor() {
        this.socket = null;
        this.roomId = null;
        this.isHost = false;
        this.videoElement = null;
        this.syncThreshold = 2; // seconds
        this.listeners = new Map();
    }

    connect(serverUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001') {
        if (this.socket?.connected) return;

        this.socket = io(serverUrl, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5
        });

        this.setupSocketListeners();
    }

    setupSocketListeners() {
        this.socket.on('connect', () => {
            console.log('Connected to sync server');
            this.emit('connected');
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from sync server');
            this.emit('disconnected');
        });

        this.socket.on('sync:play', ({ timestamp }) => {
            if (!this.isHost && this.videoElement) {
                this.videoElement.currentTime = timestamp;
                this.videoElement.play();
                this.emit('synced', { action: 'play', timestamp });
            }
        });

        this.socket.on('sync:pause', ({ timestamp }) => {
            if (!this.isHost && this.videoElement) {
                this.videoElement.currentTime = timestamp;
                this.videoElement.pause();
                this.emit('synced', { action: 'pause', timestamp });
            }
        });

        this.socket.on('sync:seek', ({ timestamp }) => {
            if (!this.isHost && this.videoElement) {
                this.videoElement.currentTime = timestamp;
                this.emit('synced', { action: 'seek', timestamp });
            }
        });

        this.socket.on('sync:request', () => {
            if (this.isHost && this.videoElement) {
                this.broadcastState();
            }
        });

        this.socket.on('participant:joined', (data) => {
            this.emit('participant-joined', data);
            // Send current state to new participant
            if (this.isHost) {
                setTimeout(() => this.broadcastState(), 500);
            }
        });

        this.socket.on('participant:left', (data) => {
            this.emit('participant-left', data);
        });

        this.socket.on('chat:message', (message) => {
            this.emit('chat-message', message);
        });
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
            // Host controls - broadcast all actions
            videoElement.addEventListener('play', () => this.handlePlay());
            videoElement.addEventListener('pause', () => this.handlePause());
            videoElement.addEventListener('seeked', () => this.handleSeek());

            // Auto-sync check every 5 seconds
            this.syncInterval = setInterval(() => this.checkSync(), 5000);
        } else {
            // Non-host - request sync on load
            setTimeout(() => this.requestSync(), 1000);
        }
    }

    detachVideo() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
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

        const timestamp = this.videoElement.currentTime;
        this.socket.emit('sync:seek', {
            roomId: this.roomId,
            timestamp
        });
    }

    broadcastState() {
        if (!this.isHost || !this.videoElement) return;

        const state = {
            roomId: this.roomId,
            timestamp: this.videoElement.currentTime,
            paused: this.videoElement.paused
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
            timestamp: this.videoElement?.currentTime || 0
        });
    }

    sendChatMessage(message) {
        this.socket.emit('chat:message', {
            roomId: this.roomId,
            message
        });
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
