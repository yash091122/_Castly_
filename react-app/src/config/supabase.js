import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials not found. Please add them to your .env file.');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    },
    realtime: {
        params: {
            eventsPerSecond: 10
        }
    }
});

// Auth helpers
export const auth = {
    signUp: async (email, password, username) => {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        username,
                        display_name: username
                    },
                    // Email redirect URL for confirmation
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                    // Disable email confirmation for immediate access
                    emailConfirmation: false
                }
            });

            if (error) return { data, error };

            // Fallback: If trigger didn't create profile, create it manually
            if (data?.user && !error) {
                try {
                    // Check if profile exists
                    const { data: existingProfile } = await supabase
                        .from('profiles')
                        .select('id')
                        .eq('id', data.user.id)
                        .maybeSingle();

                    // If profile doesn't exist, create it
                    if (!existingProfile) {
                        console.log('⚠️ Profile not created by trigger, creating manually...');
                        const { error: profileError } = await supabase
                            .from('profiles')
                            .insert({
                                id: data.user.id,
                                email: email,
                                username: username,
                                display_name: username,
                                online_status: false
                            });

                        if (profileError) {
                            console.error('❌ Failed to create profile manually:', profileError);
                            // Return a more user-friendly error
                            return {
                                data: null,
                                error: {
                                    message: 'Failed to create user profile. Please contact support.',
                                    details: profileError
                                }
                            };
                        }
                        console.log('✅ Profile created manually');
                    }
                } catch (profileCheckError) {
                    console.error('❌ Error checking/creating profile:', profileCheckError);
                }
            }

            return { data, error };
        } catch (err) {
            console.error('❌ Signup error:', err);
            return {
                data: null,
                error: {
                    message: 'An unexpected error occurred during signup. Please try again.',
                    details: err
                }
            };
        }
    },

    signIn: async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        return { data, error };
    },

    signInWithGoogle: async () => {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`
            }
        });
        return { data, error };
    },

    signOut: async () => {
        const { error } = await supabase.auth.signOut();
        return { error };
    },

    getCurrentUser: async () => {
        const { data: { user }, error } = await supabase.auth.getUser();
        return { user, error };
    },

    onAuthStateChange: (callback) => {
        return supabase.auth.onAuthStateChange(callback);
    }
};

// Database helpers
export const db = {
    // Users
    getProfile: async (userId) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        return { data, error };
    },

    updateProfile: async (userId, updates) => {
        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', userId)
            .select()
            .maybeSingle();
        return { data, error };
    },

    getUserStats: async (userId) => {
        // Get friends count
        const { count: friendsCount, error: friendsError } = await supabase
            .from('friends')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('status', 'accepted');

        // Get watch parties count (as host or participant)
        const { count: partiesCount, error: partiesError } = await supabase
            .from('watch_parties')
            .select('*', { count: 'exact', head: true })
            .eq('host_id', userId);

        return {
            data: {
                friends: friendsCount || 0,
                watchParties: partiesCount || 0
            },
            error: friendsError || partiesError
        };
    },

    // Reviews
    getReviews: async (movieId) => {
        const { data, error } = await supabase
            .from('reviews')
            .select(`
                *,
                user:profiles(id, username, display_name, avatar_url)
            `)
            .eq('movie_id', movieId)
            .order('created_at', { ascending: false });
        return { data, error };
    },

    addReview: async (userId, movieId, rating, comment) => {
        const { data, error } = await supabase
            .from('reviews')
            .insert({
                user_id: userId,
                movie_id: movieId,
                rating,
                comment
            })
            .select(`
                *,
                user:profiles(id, username, display_name, avatar_url)
            `)
            .single();
        return { data, error };
    },

    deleteReview: async (reviewId) => {
        const { error } = await supabase
            .from('reviews')
            .delete()
            .eq('id', reviewId);
        return { error };
    },

    searchUsers: async (query) => {
        const safeQuery = query.replace(/[^\w\s]/g, '').trim();
        if (!safeQuery) return { data: [], error: null };

        const { data, error } = await supabase
            .from('profiles')
            .select('id, username, display_name, avatar_url, online_status')
            .or(`username.ilike.%${safeQuery}%,display_name.ilike.%${safeQuery}%`)
            .limit(10);
        return { data, error };
    },

    // Favorites
    getFavorites: async (userId) => {
        const { data, error } = await supabase
            .from('favorites')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        return { data, error };
    },

    addFavorite: async (userId, itemId, type = 'movie') => {
        // Convert ID to string for compatibility with TEXT column
        const stringId = String(itemId);
        const payload = {
            user_id: userId,
            content_type: type,
            [type === 'tv' ? 'series_id' : 'movie_id']: stringId
        };

        const { data, error } = await supabase
            .from('favorites')
            .insert(payload)
            .select()
            .single();
        return { data, error };
    },

    removeFavorite: async (userId, itemId, type = 'movie') => {
        // Convert ID to string for compatibility with TEXT column
        const stringId = String(itemId);
        let query = supabase
            .from('favorites')
            .delete()
            .eq('user_id', userId);

        if (type === 'tv') {
            query = query.eq('series_id', stringId);
        } else {
            query = query.eq('movie_id', stringId);
        }

        const { error } = await query;
        return { error };
    },

    // Watch History
    getWatchHistory: async (userId) => {
        try {
            const { data, error } = await supabase
                .from('watch_history')
                .select('*')
                .eq('user_id', userId)
                .order('last_watched', { ascending: false })
                .limit(20);

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            // Silently swallow 400 error caused by missing schema
            return { data: [], error };
        }
    },

    updateWatchProgress: async (userId, movieId, progress, duration) => {
        const { data, error } = await supabase
            .from('watch_history')
            .upsert({
                user_id: userId,
                movie_id: movieId,
                progress,
                duration,
                last_watched: new Date().toISOString()
            })
            .select()
            .single();
        return { data, error };
    },

    // TV Show Watch History
    getTvWatchHistory: async (userId) => {
        try {
            const { data, error } = await supabase
                .from('tv_watch_history')
                .select('*')
                .eq('user_id', userId)
                .order('last_watched', { ascending: false })
                .limit(20);

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            // Silently swallow 400 error caused by missing schema
            return { data: [], error };
        }
    },

    updateTvWatchProgress: async (userId, showId, seasonNum, episodeNum, progress, duration) => {
        const { data, error } = await supabase
            .from('tv_watch_history')
            .upsert({
                user_id: userId,
                show_id: showId,
                season_number: seasonNum,
                episode_number: episodeNum,
                progress,
                duration,
                completed: progress >= duration * 0.9,
                last_watched: new Date().toISOString()
            })
            .select()
            .single();
        return { data, error };
    },

    getTvShowProgress: async (userId, showId) => {
        const { data, error } = await supabase
            .from('tv_watch_history')
            .select('*')
            .eq('user_id', userId)
            .eq('show_id', showId)
            .order('last_watched', { ascending: false })
            .limit(1)
            .single();
        return { data, error };
    },

    getContinueWatchingTv: async (userId) => {
        const { data, error } = await supabase
            .from('tv_watch_history')
            .select('*')
            .eq('user_id', userId)
            .eq('completed', false)
            .order('last_watched', { ascending: false })
            .limit(10);
        return { data, error };
    },

    // Friends
    getFriends: async (userId) => {
        const { data, error } = await supabase
            .from('friends')
            .select(`
        *,
        friend:profiles!friends_friend_id_fkey(id, username, display_name, avatar_url, online_status)
      `)
            .eq('user_id', userId)
            .eq('status', 'accepted')
            .order('created_at', { ascending: false });
        return { data, error };
    },

    getFriendRequests: async (userId) => {
        const { data, error } = await supabase
            .from('friends')
            .select(`
        *,
        requester:profiles!friends_user_id_fkey(id, username, display_name, avatar_url)
      `)
            .eq('friend_id', userId)
            .eq('status', 'pending')
            .order('created_at', { ascending: false });
        return { data, error };
    },

    sendFriendRequest: async (userId, friendId) => {
        const { data, error } = await supabase
            .from('friends')
            .insert({
                user_id: userId,
                friend_id: friendId,
                status: 'pending'
            })
            .select()
            .single();
        return { data, error };
    },

    acceptFriendRequest: async (requestId) => {
        // First, get the friend request details
        const { data: request, error: fetchError } = await supabase
            .from('friends')
            .select('user_id, friend_id')
            .eq('id', requestId)
            .single();

        if (fetchError) return { data: null, error: fetchError };

        // Update the original request to accepted
        const { data, error } = await supabase
            .from('friends')
            .update({ status: 'accepted' })
            .eq('id', requestId)
            .select()
            .single();

        if (error) return { data, error };

        // Create the reverse friendship so both users see each other
        const { error: reverseError } = await supabase
            .from('friends')
            .insert({
                user_id: request.friend_id,
                friend_id: request.user_id,
                status: 'accepted'
            });

        if (reverseError) {
            console.error('Error creating reverse friendship:', reverseError);
            // Don't fail the whole operation if reverse creation fails
        }

        return { data, error: null };
    },

    rejectFriendRequest: async (requestId) => {
        const { error } = await supabase
            .from('friends')
            .delete()
            .eq('id', requestId);
        return { error };
    },

    removeFriend: async (friendshipId) => {
        // First, get the friendship details to find the reverse
        const { data: friendship, error: fetchError } = await supabase
            .from('friends')
            .select('user_id, friend_id')
            .eq('id', friendshipId)
            .maybeSingle();

        if (fetchError) return { error: fetchError };
        if (!friendship) return { error: null }; // Already removed, count as success

        // Delete the original friendship
        const { error } = await supabase
            .from('friends')
            .delete()
            .eq('id', friendshipId);

        if (error) return { error };

        // Delete the reverse friendship
        const { error: reverseError } = await supabase
            .from('friends')
            .delete()
            .eq('user_id', friendship.friend_id)
            .eq('friend_id', friendship.user_id);

        if (reverseError) {
            console.error('Error removing reverse friendship:', reverseError);
            // Don't fail if reverse deletion fails
        }

        return { error: null };
    },

    // Notifications
    getNotifications: async (userId) => {
        console.log('📥 Fetching notifications for user:', userId);
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) console.error('❌ Error fetching notifications:', error);
        else console.log(`✅ Fetched ${data?.length || 0} notifications`);

        return { data, error };
    },

    markNotificationRead: async (notificationId) => {
        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', notificationId);
        return { error };
    },

    markAllNotificationsRead: async (userId) => {
        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('user_id', userId)
            .eq('read', false); // Only update unread ones
        return { error };
    },

    deleteNotification: async (notificationId) => {
        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('id', notificationId);
        return { error };
    },

    createNotification: async (userId, type, data) => {
        console.log('📤 Creating notification:', { userId, type, data });
        // Don't select the returned row because RLS prevents selecting notifications created for OTHERS.
        // We only need to know if the insert failed or succeeded.
        const { error } = await supabase
            .from('notifications')
            .insert({
                user_id: userId,
                type,
                data,
                read: false
            });

        if (error) console.error('❌ Error creating notification:', error);
        else console.log('✅ Notification created (write-only success)');

        return { data: null, error };
    },

    // Watch Parties
    createWatchParty: async (hostId, movieId, movieTitle) => {
        const { data, error } = await supabase
            .from('watch_parties')
            .insert({
                host_id: hostId,
                movie_id: movieId,
                movie_title: movieTitle,
                status: 'active'
            })
            .select()
            .single();
        return { data, error };
    },

    joinWatchParty: async (partyId, userId) => {
        const { data, error } = await supabase
            .from('party_participants')
            .insert({
                party_id: partyId,
                user_id: userId
            })
            .select()
            .single();
        return { data, error };
    },

    getWatchParty: async (partyId) => {
        const { data, error } = await supabase
            .from('watch_parties')
            .select(`
        *,
        host:profiles!watch_parties_host_id_fkey(id, username, display_name, avatar_url),
        participants:party_participants(
          *,
          user:profiles(id, username, display_name, avatar_url)
        )
      `)
            .eq('id', partyId)
            .single();
        return { data, error };
    },

    endWatchParty: async (partyId) => {
        const { error } = await supabase
            .from('watch_parties')
            .update({ status: 'ended' })
            .eq('id', partyId);
        return { error };
    },

    // Storage
    uploadAvatar: async (userId, file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}-${Math.random()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file, { upsert: true });

        if (uploadError) {
            return { error: uploadError };
        }

        const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
        return { publicUrl: data.publicUrl };
    }
};

// Real-time subscriptions
export const realtime = {
    subscribeToNotifications: (userId, callback) => {
        return supabase
            .channel(`notifications:${userId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${userId}`
                },
                callback
            )
            .subscribe();
    },

    subscribeToFriendStatus: (callback) => {
        return supabase
            .channel('online-users')
            .on('presence', { event: 'sync' }, callback)
            .subscribe();
    },

    subscribeToWatchParty: (partyId, callback) => {
        return supabase
            .channel(`watch-party:${partyId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'watch_parties',
                    filter: `id=eq.${partyId}`
                },
                callback
            )
            .subscribe();
    },

    subscribeToChat: (partyId, callback) => {
        return supabase
            .channel(`chat:${partyId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'chat_messages',
                    filter: `party_id=eq.${partyId}`
                },
                callback
            )
            .subscribe();
    },

    subscribeToFavorites: (userId, callback) => {
        return supabase
            .channel(`favorites:${userId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'favorites',
                    filter: `user_id=eq.${userId}`
                },
                callback
            )
            .subscribe();
    },

    subscribeToWatchHistory: (userId, callback) => {
        return supabase
            .channel(`watch-history:${userId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'watch_history',
                    filter: `user_id=eq.${userId}`
                },
                callback
            )
            .subscribe();
    },

    subscribeToWatchParties: (userId, callback) => {
        return supabase
            .channel(`user-parties:${userId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'watch_parties',
                    filter: `host_id=eq.${userId}`
                },
                callback
            )
            .subscribe();
    },

    subscribeToFriends: (userId, callback) => {
        return supabase
            .channel(`friends:${userId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'friends',
                    filter: `user_id=eq.${userId}`
                },
                callback
            )
            .subscribe();
    },

    subscribeToActivity: (userId, callback) => {
        return supabase
            .channel(`user-activity:${userId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'user_activity',
                    filter: `user_id=eq.${userId}`
                },
                callback
            )
            .subscribe();
    }
};

export default supabase;
