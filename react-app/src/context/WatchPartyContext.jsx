import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../config/supabase';
import { getMovieById } from '../data/movies';
import { useSocketContext } from './SocketContext';

const WatchPartyContext = createContext();

const generateRoomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

export function WatchPartyProvider({ children }) {
    const { user } = useAuth();
    const { socket } = useSocketContext();
    const [currentRoom, setCurrentRoom] = useState(null);
    const [messages, setMessages] = useState([]);
    const [participants, setParticipants] = useState([]);
    const [isHost, setIsHost] = useState(false);
    const [playbackState, setPlaybackState] = useState({
        isPlaying: false,
        currentTime: 0
    });
    const [typingUsers, setTypingUsers] = useState(new Set());

    // Setup room event listeners
    useEffect(() => {
        if (!socket || !currentRoom) return;

        // Participant events
        socket.on('participant:joined', ({ userId, socketId, isHost: participantIsHost }) => {
            console.log('Participant joined:', userId);
            // Don't add yourself again
            if (userId === user?.id) return;

            setParticipants(prev => {
                if (prev.find(p => p.id === userId)) return prev;
                return [...prev, {
                    id: userId,
                    socketId,
                    name: 'User',
                    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
                    isHost: participantIsHost
                }];
            });
        });

        socket.on('participant:left', ({ userId }) => {
            console.log('Participant left:', userId);
            setParticipants(prev => prev.filter(p => p.id !== userId));
        });

        // Playback sync events
        socket.on('sync:play', ({ timestamp }) => {
            setPlaybackState({ isPlaying: true, currentTime: timestamp });
        });

        socket.on('sync:pause', ({ timestamp }) => {
            setPlaybackState({ isPlaying: false, currentTime: timestamp });
        });

        socket.on('sync:seek', ({ timestamp }) => {
            setPlaybackState(prev => ({ ...prev, currentTime: timestamp }));
        });

        socket.on('sync:state', ({ timestamp, paused }) => {
            setPlaybackState({ isPlaying: !paused, currentTime: timestamp });
        });

        // Chat events
        socket.on('chat:message', (message) => {
            setMessages(prev => [...prev, message]);
        });

        socket.on('chat:typing', ({ userId, isTyping }) => {
            setTypingUsers(prev => {
                const newSet = new Set(prev);
                if (isTyping) {
                    newSet.add(userId);
                } else {
                    newSet.delete(userId);
                }
                return newSet;
            });
        });

        socket.on('chat:reaction', ({ messageId, emoji, userId }) => {
            setMessages(prev => prev.map(msg => {
                if (msg.id === messageId) {
                    const reactions = msg.reactions || [];
                    return {
                        ...msg,
                        reactions: [...reactions, { emoji, userId }]
                    };
                }
                return msg;
            }));
        });

        // Host promotion
        socket.on('host:promoted', () => {
            setIsHost(true);
            console.log('You are now the host');
        });

        return () => {
            socket.off('participant:joined');
            socket.off('participant:left');
            socket.off('sync:play');
            socket.off('sync:pause');
            socket.off('sync:seek');
            socket.off('sync:state');
            socket.off('chat:message');
            socket.off('chat:typing');
            socket.off('chat:reaction');
            socket.off('host:promoted');
        };
    }, [socket, currentRoom]);

    const createRoom = useCallback(async (movieId, hostInfo) => {
        if (!user || !socket) return null;

        const movie = getMovieById(movieId);
        const roomCode = generateRoomCode();

        const hostData = hostInfo || {
            id: user.id,
            name: user.user_metadata?.display_name || user.email,
            avatar: user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`,
            isHost: true
        };

        const room = {
            id: roomCode,
            movieId,
            movie,
            createdAt: new Date().toISOString(),
            host: hostData
        };

        // Create in database
        await db.createWatchParty(user.id, movieId, movie.title);

        setCurrentRoom(room);
        setIsHost(true);
        setParticipants([hostData]); // Only the host initially
        setMessages([]);

        // Join socket room
        socket.emit('room:join', {
            roomId: roomCode,
            userId: user.id,
            isHost: true
        });

        return room;
    }, [user, socket]);

    const joinRoom = useCallback(async (roomCode, userInfo) => {
        if (!user || !socket) return { success: false, error: 'Not authenticated' };

        const userData = userInfo || {
            id: user.id,
            name: user.user_metadata?.display_name || user.email,
            avatar: user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`
        };

        // Join socket room
        socket.emit('room:join', {
            roomId: roomCode,
            userId: user.id,
            isHost: false
        });

        // Create mock room (in production, fetch from database)
        const mockRoom = {
            id: roomCode,
            movieId: 'stranger-things',
            movie: getMovieById('stranger-things'),
            createdAt: new Date().toISOString(),
            host: { id: 'host', name: 'Room Host', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Host' }
        };

        setCurrentRoom(mockRoom);
        setIsHost(false);
        setParticipants([mockRoom.host, userData]);
        setMessages([]);

        // Request current playback state from host
        socket.emit('sync:request', { roomId: roomCode });

        return { success: true, room: mockRoom };
    }, [user, socket]);

    const leaveRoom = useCallback(() => {
        if (socket && currentRoom) {
            socket.emit('room:leave', { roomId: currentRoom.id });
        }

        setCurrentRoom(null);
        setMessages([]);
        setParticipants([]);
        setIsHost(false);
        setPlaybackState({ isPlaying: false, currentTime: 0 });
    }, [socket, currentRoom]);

    const sendMessage = useCallback((text, sender) => {
        if (!socket || !currentRoom || !user) return null;

        const senderData = sender || {
            id: user.id,
            name: user.user_metadata?.display_name || user.email,
            avatar: user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`
        };

        const message = {
            id: `${Date.now()}-${user.id}`,
            text,
            sender: senderData,
            timestamp: new Date().toISOString(),
            isMine: true,
            reactions: []
        };

        // Emit to socket
        socket.emit('chat:message', {
            roomId: currentRoom.id,
            message: { ...message, isMine: false } // Others will receive it as not theirs
        });

        // Add to local state
        setMessages(prev => [...prev, message]);

        return message;
    }, [socket, currentRoom, user]);

    const sendTypingIndicator = useCallback((isTyping) => {
        if (!socket || !currentRoom || !user) return;

        socket.emit('chat:typing', {
            roomId: currentRoom.id,
            userId: user.id,
            isTyping
        });
    }, [socket, currentRoom, user]);

    const reactToMessage = useCallback((messageId, emoji) => {
        if (!socket || !currentRoom || !user) return;

        socket.emit('chat:reaction', {
            roomId: currentRoom.id,
            messageId,
            emoji,
            userId: user.id
        });

        // Update local state
        setMessages(prev => prev.map(msg => {
            if (msg.id === messageId) {
                const reactions = msg.reactions || [];
                return {
                    ...msg,
                    reactions: [...reactions, { emoji, userId: user.id }]
                };
            }
            return msg;
        }));
    }, [socket, currentRoom, user]);

    const syncPlayback = useCallback((action, time) => {
        if (!socket || !currentRoom || !isHost) return;

        const timestamp = time !== undefined ? time : playbackState.currentTime;

        if (action === 'play') {
            socket.emit('sync:play', { roomId: currentRoom.id, timestamp });
        } else if (action === 'pause') {
            socket.emit('sync:pause', { roomId: currentRoom.id, timestamp });
        } else if (action === 'seek') {
            socket.emit('sync:seek', { roomId: currentRoom.id, timestamp });
        }

        setPlaybackState({
            isPlaying: action === 'play',
            currentTime: timestamp
        });
    }, [socket, currentRoom, isHost, playbackState.currentTime]);

    const inviteFriend = useCallback(async (friend, room) => {
        if (!socket || !user) return false;

        const roomToUse = room || currentRoom;
        if (!roomToUse) return false;

        const senderData = {
            name: user.user_metadata?.display_name || user.email,
            username: user.user_metadata?.username || user.user_metadata?.display_name || user.email?.split('@')[0],
            avatar: user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`
        };

        // Send socket event for immediate toast
        socket.emit('party:invite', {
            fromUserId: user.id,
            toUserId: friend.id,
            roomId: roomToUse.id,
            movieTitle: roomToUse.movie?.title || 'a movie',
            userData: senderData
        });

        // Create persistent notification in database
        try {
            const { error } = await db.createNotification(friend.id, 'party_invite', {
                from_user_name: senderData.name,
                from_user_avatar: senderData.avatar,
                from_user_id: user.id,
                movie_title: roomToUse.movie?.title,
                room_id: roomToUse.id
            });

            if (error) {
                console.error('DB Notification Error:', error);
                // Optional: Show toast debug info? No, keep it clean for user but log it.
            }
        } catch (error) {
            console.error('Failed to create db notification:', error);
        }

        console.log(`Invited ${friend.name} to room ${roomToUse.id}`);
        return true;
    }, [socket, user, currentRoom]);

    return (
        <WatchPartyContext.Provider value={{
            currentRoom,
            messages,
            participants,
            isHost,
            playbackState,
            typingUsers,
            createRoom,
            joinRoom,
            leaveRoom,
            sendMessage,
            sendTypingIndicator,
            reactToMessage,
            syncPlayback,
            inviteFriend,
            setParticipants
        }}>
            {children}
        </WatchPartyContext.Provider>
    );
}

export const useWatchParty = () => {
    const context = useContext(WatchPartyContext);
    if (!context) {
        throw new Error('useWatchParty must be used within a WatchPartyProvider');
    }
    return context;
};
