import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

export function useSocket(userId, userData) {
    const socketRef = useRef(null);
    const [isConnected, setIsConnected] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState([]);

    useEffect(() => {
        if (!userId) return;

        // Create socket connection
        socketRef.current = io(SOCKET_URL, {
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5
        });

        const socket = socketRef.current;

        socket.on('connect', () => {
            console.log('Socket connected:', socket.id);
            setIsConnected(true);
            
            // Announce user is online
            socket.emit('user:online', { userId, userData });
        });

        socket.on('disconnect', () => {
            console.log('Socket disconnected');
            setIsConnected(false);
        });

        socket.on('users:online', (users) => {
            setOnlineUsers(users);
        });

        socket.on('user:status', ({ userId: statusUserId, online, userData: statusUserData }) => {
            setOnlineUsers(prev => {
                if (online) {
                    // Add or update user
                    const exists = prev.find(u => u.userId === statusUserId);
                    if (exists) return prev;
                    return [...prev, { userId: statusUserId, ...statusUserData }];
                } else {
                    // Remove user
                    return prev.filter(u => u.userId !== statusUserId);
                }
            });
        });

        return () => {
            socket.disconnect();
        };
    }, [userId, userData]);

    return {
        socket: socketRef.current,
        isConnected,
        onlineUsers
    };
}
