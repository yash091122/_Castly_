import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { db, realtime } from '../config/supabase';
import { useSocketContext } from './SocketContext';
import NotificationToast from '../components/NotificationToast';
import '../styles/notification-toast.css';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
    const { user } = useAuth();
    const { socket } = useSocketContext();
    const [notifications, setNotifications] = useState([]);
    const [toasts, setToasts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [acceptFriendRequestCallback, setAcceptFriendRequestCallback] = useState(null);
    const processedInvitesRef = useRef(new Set()); // For deduplication

    // Add a toast notification
    const addToast = useCallback((notification) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const toast = { ...notification, id };
        setToasts(prev => [toast, ...prev]);

        // Also add to notifications list if it's a persistent type
        if (['party_invite', 'friend_request'].includes(notification.type)) {
            setNotifications(prev => [toast, ...prev]);
        }

        return id;
    }, []);

    // Remove a toast
    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    // Subscribe to Supabase real-time notifications
    useEffect(() => {
        if (!user) return;

        console.log('🔔 NotificationContext: Setting up Supabase real-time subscription for user:', user.id);

        const channel = realtime.subscribeToNotifications(user.id, (payload) => {
            console.log('📬 Supabase real-time notification:', payload);

            if (payload.new) {
                const newNotification = {
                    ...payload.new,
                    ...(payload.new.data || {}) // Flatten any extra data
                };

                // Add to notifications list if not already present
                setNotifications(prev => {
                    const exists = prev.some(n => n.id === newNotification.id);
                    if (exists) return prev;
                    return [newNotification, ...prev];
                });

                // Show toast for new notifications
                if (!newNotification.read) {
                    // Deduplicate party invites that might also come via socket
                    if (newNotification.type === 'party_invite') {
                        const dedupKey = `${newNotification.from_user_id}-${newNotification.room_id}`;
                        if (processedInvitesRef.current.has(dedupKey)) {
                            console.log('⏭️ Skipping duplicate party invite toast (Supabase):', dedupKey);
                            return;
                        }
                        processedInvitesRef.current.add(dedupKey);
                        setTimeout(() => processedInvitesRef.current.delete(dedupKey), 5000);
                    }

                    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                    setToasts(prev => [{ ...newNotification, id }, ...prev]);
                }
            }
        });

        return () => {
            if (channel) {
                console.log('🔔 Unsubscribing from Supabase real-time notifications');
                channel.unsubscribe();
            }
        };
    }, [user]);

    // Listen for socket events
    useEffect(() => {
        if (!socket || !user) return;

        console.log('✅ NotificationContext: Setting up socket listeners for user:', user.id);

        // Party invite
        const handlePartyInvite = ({ fromUserId, userData, roomId, movieId, movieTitle, timestamp }) => {
            console.log('📨 Received party invite:', { fromUserId, userData, roomId, movieTitle });

            // Deduplication
            const dedupKey = `${fromUserId}-${roomId}`;
            if (processedInvitesRef.current.has(dedupKey)) {
                console.log('⏭️ Skipping duplicate party invite toast (Socket):', dedupKey);
                return;
            }
            processedInvitesRef.current.add(dedupKey);
            setTimeout(() => processedInvitesRef.current.delete(dedupKey), 5000);

            // 1. Show Toast
            addToast({
                type: 'party_invite',
                from_user_id: fromUserId,
                from_user_name: userData?.username || userData?.name || 'Someone',
                from_user_avatar: userData?.avatar,
                room_id: roomId,
                movie_id: movieId,
                movie_title: movieTitle || 'Watch Party',
                read: false,
                created_at: timestamp ? new Date(timestamp).toISOString() : new Date().toISOString()
            });

            // 2. Refresh Notifications List from DB (Ensures list updates without reload)
            loadNotifications();

            // 3. Browser notification
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification(`Watch Party Invite`, {
                    body: `${userData?.username || userData?.name} invited you to watch ${movieTitle}`,
                    icon: userData?.avatar
                });
            }
        };

        // Friend request
        const handleFriendRequest = ({ fromUserId, userData, timestamp }) => {
            console.log('👋 Received friend request:', { fromUserId, userData });

            addToast({
                type: 'friend_request',
                from_user_id: fromUserId,
                from_user_name: userData?.username || userData?.name || 'Someone',
                from_user_avatar: userData?.avatar,
                read: false,
                created_at: new Date(timestamp).toISOString()
            });
        };

        // Friend accepted
        const handleFriendAccepted = ({ odId, userData }) => {
            console.log('✅ Friend request accepted:', { odId, userData });

            addToast({
                type: 'info',
                message: `${userData?.name || 'Someone'} accepted your friend request!`,
                from_user_name: userData?.name,
                from_user_avatar: userData?.avatar
            });
        };

        socket.on('party:invite', handlePartyInvite);
        // Unified under party:invite to avoid confusion, but keep watch_party for safety
        socket.on('watch_party:invite', handlePartyInvite);
        socket.on('friend:request', handleFriendRequest);
        socket.on('friend:accepted', handleFriendAccepted);

        return () => {
            socket.off('party:invite', handlePartyInvite);
            socket.off('watch_party:invite', handlePartyInvite);
            socket.off('friend:request', handleFriendRequest);
            socket.off('friend:accepted', handleFriendAccepted);
        };
    }, [socket, user, addToast]);

    // Load notifications from database
    const loadNotifications = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data, error } = await db.getNotifications(user.id);
            if (!error && data) {
                // Flatten data property for each notification
                const flattened = data.map(n => ({
                    ...n,
                    ...(n.data || {})
                }));
                setNotifications(flattened);
            }
        } catch (err) {
            console.error('Failed to load notifications:', err);
        }
        setLoading(false);
    }, [user]);

    // Initial load
    useEffect(() => {
        if (user) {
            loadNotifications();
        } else {
            setNotifications([]);
        }
    }, [user, loadNotifications]);

    const unreadCount = notifications.filter(n => !n.read).length;

    const markAsRead = useCallback(async (id) => {
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
        try {
            await db.markNotificationRead(id);
        } catch (err) {
            console.error('Failed to mark as read:', err);
        }
    }, []);

    const markAllAsRead = useCallback(async () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        try {
            if (user) {
                await db.markAllNotificationsRead(user.id);
            }
        } catch (err) {
            console.error('Failed to mark all as read:', err);
        }
    }, [user]);

    const removeNotification = useCallback(async (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
        try {
            await db.deleteNotification(id);
        } catch (err) {
            console.error('Failed to delete notification:', err);
        }
    }, []);

    const clearAll = () => {
        setNotifications([]);
        setToasts([]);
    };

    // Handle accepting friend request from toast
    const handleAcceptFriendRequest = useCallback(async (fromUserId) => {
        if (acceptFriendRequestCallback) {
            await acceptFriendRequestCallback(fromUserId);
        }
    }, [acceptFriendRequestCallback]);

    // Allow FriendsProvider to register its accept function
    const registerAcceptFriendRequest = useCallback((callback) => {
        setAcceptFriendRequestCallback(() => callback);
    }, []);

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            loading,
            addToast,
            markAsRead,
            markAllAsRead,
            removeNotification,
            removeToast,
            clearAll,
            refreshNotifications: loadNotifications,
            registerAcceptFriendRequest
        }}>
            {children}

            {/* Toast Container */}
            <div className="notification-toast-container">
                {toasts.slice(0, 3).map(toast => (
                    <NotificationToast
                        key={toast.id}
                        notification={toast}
                        onClose={removeToast}
                        onAcceptFriendRequest={handleAcceptFriendRequest}
                    />
                ))}
            </div>
        </NotificationContext.Provider>
    );
}

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
