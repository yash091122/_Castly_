import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useAuth } from './AuthContext';
import { io } from 'socket.io-client';

const SocketContext = createContext();

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

// Create a singleton socket instance outside the component
let globalSocket = null;
let globalSocketUserId = null;
let globalHeartbeatInterval = null;

export function SocketProvider({ children }) {
    const { user } = useAuth();
    const [isConnected, setIsConnected] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const reconnectAttempts = useRef(0);

    useEffect(() => {
        console.log('🔄 SocketProvider useEffect triggered. User:', user?.id);

        if (!user) {
            // Disconnect if user logs out
            if (globalSocket) {
                console.log('User logged out, disconnecting socket...');
                globalSocket.disconnect();
                globalSocket = null;
                globalSocketUserId = null;
            }
            if (globalHeartbeatInterval) {
                clearInterval(globalHeartbeatInterval);
                globalHeartbeatInterval = null;
            }
            setIsConnected(false);
            return;
        }

        // Only create socket once per user, reuse if same user
        if (globalSocket && globalSocketUserId === user.id) {
            console.log('✅ Socket already exists for this user, reusing connection:', globalSocket.id);
            setIsConnected(globalSocket.connected);

            // Make sure heartbeat is running
            if (!globalHeartbeatInterval) {
                console.log('🔄 Starting heartbeat for existing socket');
                globalHeartbeatInterval = setInterval(() => {
                    if (globalSocket && globalSocket.connected) {
                        globalSocket.emit('ping');
                        globalSocket.emit('heartbeat', { userId: globalSocketUserId });
                        console.log('💓 Sent heartbeat for user:', globalSocketUserId);
                    } else {
                        console.log('⚠️ Cannot send heartbeat - socket not connected');
                    }
                }, 4000);
            }
            return;
        }

        // If socket exists but for different user, disconnect old one
        if (globalSocket && globalSocketUserId !== user.id) {
            console.log('🔄 Different user, disconnecting old socket');
            if (globalHeartbeatInterval) {
                clearInterval(globalHeartbeatInterval);
                globalHeartbeatInterval = null;
            }
            globalSocket.disconnect();
            globalSocket = null;
        }

        console.log('🔌 Creating NEW persistent socket connection for user:', user.id);

        const socket = io(SOCKET_URL, {
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: Infinity,
            timeout: 20000,
            transports: ['websocket', 'polling'],
            autoConnect: true
        });

        globalSocket = socket;
        globalSocketUserId = user.id;

        socket.on('connect', () => {
            reconnectAttempts.current = 0;
            console.log('✅ Socket connected:', socket.id);
            setIsConnected(true);

            // Announce user is online
            socket.emit('user:online', {
                userId: user.id,
                userData: {
                    name: user.user_metadata?.display_name || user.email,
                    avatar: user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`
                }
            });

            // Send immediate heartbeat
            socket.emit('heartbeat', { userId: user.id });
            console.log('💓 Sent initial heartbeat for user:', user.id);
        });

        socket.on('disconnect', (reason) => {
            console.log('❌ Socket disconnected:', reason);
            setIsConnected(false);

            // Auto-reconnect unless manually disconnected
            if (reason === 'io server disconnect') {
                socket.connect();
            }
        });

        socket.on('reconnect_attempt', (attemptNumber) => {
            reconnectAttempts.current = attemptNumber;
            console.log(`🔄 Reconnection attempt #${attemptNumber}...`);
        });

        socket.on('reconnect', (attemptNumber) => {
            console.log(`✅ Reconnected after ${attemptNumber} attempts`);
            setIsConnected(true);

            // Re-announce user is online after reconnection
            socket.emit('user:online', {
                userId: user.id,
                userData: {
                    name: user.user_metadata?.display_name || user.email,
                    avatar: user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`
                }
            });
        });

        socket.on('reconnect_error', (error) => {
            console.error('❌ Reconnection error:', error.message);
        });

        socket.on('reconnect_failed', () => {
            console.error('❌ Reconnection failed after all attempts');
        });

        socket.on('users:online', (users) => {
            console.log('📋 Received online users list:', users.length, users);
            setOnlineUsers(users);
        });

        socket.on('user:status', (payload) => {
            const statusUserId = payload.userId || payload.odId;
            const online = payload.online;
            const statusUserData = payload.userData;

            console.log(`👤 User status update: ${statusUserId} is now ${online ? 'ONLINE' : 'OFFLINE'}`);
            setOnlineUsers(prev => {
                if (online) {
                    const exists = prev.find(u => u.userId === statusUserId);
                    if (exists) {
                        console.log(`  ℹ️  User ${statusUserId} already in list`);
                        return prev;
                    }
                    console.log(`  ✅ Adding user ${statusUserId} to online list`);
                    return [...prev, { userId: statusUserId, name: statusUserData?.name, avatar: statusUserData?.avatar }];
                } else {
                    console.log(`  ❌ Removing user ${statusUserId} from online list`);
                    return prev.filter(u => u.userId !== statusUserId);
                }
            });
        });

        // Debug: Listen for party invites to verify socket is receiving them
        socket.on('party:invite', (data) => {
            console.log('🎉 SocketContext: Received party:invite event!', data);
        });

        // Keep-alive ping and heartbeat every 15 seconds
        if (globalHeartbeatInterval) {
            clearInterval(globalHeartbeatInterval);
        }

        console.log('🔄 Starting heartbeat interval');
        globalHeartbeatInterval = setInterval(() => {
            if (globalSocket && globalSocket.connected) {
                globalSocket.emit('ping');
                globalSocket.emit('heartbeat', { userId: globalSocketUserId });
                console.log('💓 Sent heartbeat for user:', globalSocketUserId);
            } else {
                console.log('⚠️ Cannot send heartbeat - socket not connected');
            }
        }, 4000);

        // Cleanup only when component unmounts
        return () => {
            console.log('🔌 SocketProvider cleanup called for user:', user?.id);
            // Don't clear the interval or disconnect - keep everything alive
        };
    }, [user]); // Only re-run if user changes

    return (
        <SocketContext.Provider value={{
            socket: globalSocket,
            isConnected,
            onlineUsers
        }}>
            {children}
        </SocketContext.Provider>
    );
}

export const useSocketContext = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocketContext must be used within a SocketProvider');
    }
    return context;
};
