// Legacy hook – kept for backward compatibility.
// New code should use useSocketContext() from SocketContext instead.
import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

export function useSocket(userId, userData) {
    const socketRef = useRef(null);
    const [isConnected, setIsConnected] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState([]);

    useEffect(() => {
        if (!userId) return;

        const socket = io(SOCKET_URL, {
            reconnection: true,
            reconnectionDelay: 1_000,
            reconnectionDelayMax: 8_000,
            reconnectionAttempts: Infinity, // ← was 5, which caused permanent failure
            timeout: 30_000,
            transports: ['websocket', 'polling']
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('Socket connected:', socket.id);
            setIsConnected(true);
            socket.emit('user:online', { userId, userData });
        });

        socket.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason);
            setIsConnected(false);
            if (reason === 'io server disconnect') socket.connect();
        });

        socket.on('reconnect', () => {
            setIsConnected(true);
            socket.emit('user:online', { userId, userData });
        });

        socket.on('users:online', (users) => setOnlineUsers(users));

        socket.on('user:status', ({ userId: uid, online, userData: meta }) => {
            setOnlineUsers(prev => {
                if (online) {
                    if (prev.find(u => u.userId === uid)) return prev;
                    return [...prev, { userId: uid, ...meta }];
                }
                return prev.filter(u => u.userId !== uid);
            });
        });

        return () => { socket.disconnect(); };
    }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

    return { socket: socketRef.current, isConnected, onlineUsers };
}