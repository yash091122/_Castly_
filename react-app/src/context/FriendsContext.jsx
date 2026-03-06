import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { supabase, db } from '../config/supabase';
import { useSocketContext } from './SocketContext';
import { useNotifications } from './NotificationContext';

const FriendsContext = createContext();

export function FriendsProvider({ children }) {
    const { user } = useAuth();
    const { socket, onlineUsers } = useSocketContext();
    const { registerAcceptFriendRequest, addToast } = useNotifications();
    const [friends, setFriends] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [sentRequests, setSentRequests] = useState([]);
    const [loading, setLoading] = useState(false);

    // Use ref to avoid infinite loops
    const acceptRequestByUserIdRef = useRef();

    // Load friends from Supabase
    useEffect(() => {
        if (user) {
            loadFriends();
            loadFriendRequests();
        }
    }, [user]);

    // Register accept function with NotificationProvider
    useEffect(() => {
        if (registerAcceptFriendRequest) {
            registerAcceptFriendRequest(acceptRequestByUserId);
        }
    }, [registerAcceptFriendRequest]);

    // Update online status based on socket connection
    useEffect(() => {
        if (!friends.length) return;

        console.log('🔄 Updating friend online status. Online users:', onlineUsers.length);

        setFriends(prevFriends => {
            let hasChanges = false;
            const newFriends = prevFriends.map(friend => {
                // Check if friend's ID matches any online user's userId (coerce to string for safety)
                const isOnline = onlineUsers.some(u => String(u.userId) === String(friend.id));

                if (friend.online !== isOnline) {
                    hasChanges = true;
                    console.log(`  👤 ${friend.username} is now ${isOnline ? 'ONLINE ✅' : 'OFFLINE ❌'}`);
                    return { ...friend, online: isOnline };
                }
                return friend;
            });

            // Only update state if there are actual changes to prevent infinite loops
            return hasChanges ? newFriends : prevFriends;
        });
    }, [onlineUsers, friends]); // We can now safely depend on 'friends' because we check for changes

    // Listen for real-time friend requests
    useEffect(() => {
        if (!socket) return;

        const handleFriendRequest = ({ fromUserId, userData, timestamp }) => {
            console.log('📨 Received friend request from:', userData.name);
            const newRequest = {
                id: `${fromUserId}-${timestamp}`,
                user_id: fromUserId,
                name: userData.name,
                avatar: userData.avatar,
                sentAt: new Date(timestamp).toISOString()
            };
            setPendingRequests(prev => [...prev, newRequest]);
        };

        const handleFriendAccepted = ({ userId, userData }) => {
            console.log('✅ Friend request accepted by:', userId);
            // Reload friends list to get the new friend
            loadFriends();
        };

        socket.on('friend:request', handleFriendRequest);
        socket.on('friend:accepted', handleFriendAccepted);
        socket.on('friend:accept', handleFriendAccepted); // Handle both event names

        return () => {
            socket.off('friend:request', handleFriendRequest);
            socket.off('friend:accepted', handleFriendAccepted);
            socket.off('friend:accept', handleFriendAccepted);
        };
    }, [socket]);

    // Subscribe to Supabase realtime for friends table changes
    useEffect(() => {
        if (!user) return;

        // Subscribe to friends where user is the owner
        const friendsSub = supabase
            .channel(`friends-realtime:${user.id}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'friends',
                filter: `user_id=eq.${user.id}`
            }, () => {
                loadFriends();
                loadFriendRequests();
            })
            .subscribe();

        // Also subscribe to friend requests sent to this user
        const requestsSub = supabase
            .channel(`friend-requests:${user.id}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'friends',
                filter: `friend_id=eq.${user.id}`
            }, () => {
                loadFriends();
                loadFriendRequests();
            })
            .subscribe();

        // Subscribe to profile updates (for avatar/name changes of friends)
        const profilesSub = supabase
            .channel('public:profiles')
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'profiles'
            }, (payload) => {
                const updatedProfile = payload.new;
                setFriends(prev => prev.map(f => {
                    if (f.id === updatedProfile.id) {
                        console.log('🔄 Friend profile updated:', updatedProfile.display_name);
                        return {
                            ...f,
                            username: updatedProfile.username,
                            display_name: updatedProfile.display_name,
                            name: updatedProfile.display_name || updatedProfile.username,
                            avatar: updatedProfile.avatar_url,
                        };
                    }
                    return f;
                }));

                // Also update pending requests if the requester updated their profile
                setPendingRequests(prev => prev.map(req => {
                    if (req.user_id === updatedProfile.id) {
                        return {
                            ...req,
                            name: updatedProfile.display_name || updatedProfile.username,
                            avatar: updatedProfile.avatar_url
                        };
                    }
                    return req;
                }));
            })
            .subscribe();

        return () => {
            supabase.removeChannel(friendsSub);
            supabase.removeChannel(requestsSub);
            supabase.removeChannel(profilesSub);
        };
    }, [user]);

    const loadFriends = async () => {
        if (!user) return;

        setLoading(true);
        const { data, error } = await db.getFriends(user.id);

        if (!error && data) {
            const formattedFriends = data.map(f => ({
                id: f.friend.id,
                friendshipId: f.id,
                username: f.friend.username,
                display_name: f.friend.display_name,
                name: f.friend.display_name || f.friend.username,
                avatar: f.friend.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${f.friend.username}`,
                online: f.friend.online_status || false
            }));
            setFriends(formattedFriends);
        }
        setLoading(false);
    };

    const loadFriendRequests = async () => {
        if (!user) return;

        const { data, error } = await db.getFriendRequests(user.id);

        if (!error && data) {
            const formattedRequests = data.map(r => ({
                id: r.id,
                user_id: r.requester.id,
                name: r.requester.display_name || r.requester.username,
                avatar: r.requester.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${r.requester.username}`,
                sentAt: r.created_at
            }));
            setPendingRequests(formattedRequests);
        }
    };

    const sendFriendRequest = async (friendUser) => {
        if (!user || !socket) return null;

        // Send to database
        const { data, error } = await db.sendFriendRequest(user.id, friendUser.id);

        if (!error && data) {
            // Send real-time notification via socket
            socket.emit('friend:request', {
                fromUserId: user.id,
                toUserId: friendUser.id,
                userData: {
                    name: user.user_metadata?.display_name || user.email,
                    avatar: user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`
                }
            });

            const request = {
                id: data.id,
                ...friendUser,
                sentAt: data.created_at
            };
            setSentRequests(prev => [...prev, request]);
            return request;
        }

        return null;
    };

    const acceptRequest = async (requestId) => {
        if (!user || !socket) return;

        console.log('🔄 Attempting to accept request:', requestId);

        // Try to find request in local state first
        let request = pendingRequests.find(r => r.id === requestId);
        let requesterId = request?.user_id;

        const { data: acceptedFriendship, error } = await db.acceptFriendRequest(requestId);

        if (!error) {
            console.log('✅ DB accepted request:', requestId);

            // If we didn't have the request locally, get the requester ID from the DB response
            // acceptedFriendship is the 'friends' row: { id, user_id, friend_id, status }
            // user_id is the person who sent the request (requester)
            if (!requesterId && acceptedFriendship) {
                requesterId = acceptedFriendship.user_id;
            }

            const acceptData = {
                name: user.user_metadata?.display_name || user.email,
                avatar: user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`
            };

            // Notify the requester via socket with user data
            if (requesterId) {
                socket.emit('friend:accept', {
                    fromUserId: user.id,
                    toUserId: requesterId,
                    userData: acceptData
                });

                // Create persistent notification in database
                try {
                    await db.createNotification(requesterId, 'friend_accepted', {
                        from_user_name: acceptData.name,
                        from_user_avatar: acceptData.avatar,
                        from_user_id: user.id
                    });
                } catch (error) {
                    console.error('Failed to create db notification:', error);
                }
            } else {
                console.warn('⚠️ Could not identify requester ID to send socket notification');
            }

            // Update local state - add the new friend
            // We might need to fetch the friend profile if we don't have 'request' object
            if (request) {
                const newFriend = {
                    id: request.user_id,
                    friendshipId: acceptedFriendship.id,
                    username: request.username || request.name,
                    display_name: request.display_name || request.name,
                    name: request.name,
                    avatar: request.avatar,
                    online: onlineUsers.some(u => u.userId === request.user_id)
                };
                setFriends(prev => [newFriend, ...prev]);
            } else {
                // Determine we should reload friends to get the full profile
                setTimeout(() => loadFriends(), 200);
            }

            setPendingRequests(prev => prev.filter(r => r.id !== requestId));

            console.log('✅ Friend request processed successfully');

            // Reload friends to ensure consistency
            setTimeout(() => loadFriends(), 500);

            addToast({
                type: 'success',
                message: `Request accepted! You are now friends with ${request?.name || 'them'}.`
            });
        } else {
            console.error('❌ Error accepting friend request:', error);
            addToast({
                type: 'error',
                message: `Failed to accept request: ${error.message}`
            });
        }
    };

    // Accept friend request by user ID (for notification toasts)
    const acceptRequestByUserId = async (fromUserId) => {
        if (!user || !socket) return;

        const request = pendingRequests.find(r => r.user_id === fromUserId);
        if (request) {
            // Use the existing acceptRequest function
            await acceptRequest(request.id);
        } else {
            console.log('⚠️ No pending request found for user:', fromUserId);
            // We could try to find it via DB, but for now just log
        }
    };

    // Update ref whenever the function changes
    acceptRequestByUserIdRef.current = acceptRequestByUserId;

    // Register accept function with NotificationProvider (only once on mount)
    useEffect(() => {
        if (registerAcceptFriendRequest) {
            // Pass a stable function that calls the ref
            registerAcceptFriendRequest((userId) => {
                if (acceptRequestByUserIdRef.current) {
                    return acceptRequestByUserIdRef.current(userId);
                }
            });
        }
    }, [registerAcceptFriendRequest]);

    const rejectRequest = async (requestId) => {
        if (!user || !socket) return;

        console.log('🔄 Rejecting request:', requestId);

        const request = pendingRequests.find(r => r.id === requestId);
        // Store requester ID before deletion if possible
        const requesterId = request?.user_id;

        const { error } = await db.rejectFriendRequest(requestId);

        if (!error) {
            console.log('✅ Request rejected in DB');

            if (requesterId) {
                socket.emit('friend:reject', {
                    fromUserId: user.id,
                    toUserId: requesterId
                });
            } else {
                // Attempt to get friend ID if we can (hard since row is deleted)
                // But typically if user clicks 'Decline' on UI, 'pendingRequests' has it.
            }

            setPendingRequests(prev => prev.filter(r => r.id !== requestId));
        } else {
            console.error('❌ Error rejecting request:', error);
            addToast({
                type: 'error',
                message: `Failed to decline request: ${error.message}`
            });
        }
    };

    const removeFriend = async (friendshipId) => {
        if (!user) return;

        console.log('🔄 Attempting to remove friend:', friendshipId);
        const { error } = await db.removeFriend(friendshipId);

        if (!error) {
            console.log('✅ Friend removed in DB');
            setFriends(prev => prev.filter(f => f.friendshipId !== friendshipId));
            addToast({
                type: 'info',
                message: 'Friend removed successfully.'
            });
        } else {
            console.error('❌ Error removing friend:', error);
            addToast({
                type: 'error',
                message: `Failed to remove friend: ${error.message}`
            });
        }
    };

    const addPendingRequest = (request) => {
        setPendingRequests(prev => [...prev, request]);
    };

    const getOnlineFriends = () => friends.filter(f => f.online);

    return (
        <FriendsContext.Provider value={{
            friends,
            pendingRequests,
            sentRequests,
            loading,
            sendFriendRequest,
            acceptRequest,
            acceptRequestByUserId,
            rejectRequest,
            removeFriend,
            addPendingRequest,
            getOnlineFriends,
            refreshFriends: loadFriends
        }}>
            {children}
        </FriendsContext.Provider>
    );
}

export const useFriends = () => {
    const context = useContext(FriendsContext);
    if (!context) {
        throw new Error('useFriends must be used within a FriendsProvider');
    }
    return context;
};
