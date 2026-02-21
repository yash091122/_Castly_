import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase, db } from '../config/supabase';

const ProfileContext = createContext();

export function ProfileProvider({ children }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [watchHistory, setWatchHistory] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [watchParties, setWatchParties] = useState([]);
  const [activity, setActivity] = useState([]);
  const [badges, setBadges] = useState([]);
  const [stats, setStats] = useState({
    totalWatchTime: 0,
    moviesWatched: 0,
    seriesWatched: 0,
    partiesHosted: 0,
    partiesJoined: 0,
    friendsCount: 0
  });
  const [settings, setSettings] = useState({
    notifications: true,
    autoplay: true,
    hdQuality: true,
    subtitles: false
  });
  const [privacy, setPrivacy] = useState({
    watchPartyInvites: 'everyone',
    watchHistory: 'friends',
    onlineStatus: 'everyone'
  });
  const [loading, setLoading] = useState(true);

  // Load all profile data
  const loadProfileData = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Fetch data in parallel
      const [
        profileRes,
        movieHistoryRes,
        tvHistoryRes,
        favoritesRes,
        statsRes
      ] = await Promise.all([
        db.getProfile(user.id),
        db.getWatchHistory(user.id),
        db.getTvWatchHistory(user.id),
        db.getFavorites(user.id),
        db.getUserStats(user.id)
      ]);

      if (profileRes.data) {
        setProfile(profileRes.data);
        if (profileRes.data.settings) setSettings(profileRes.data.settings);
        if (profileRes.data.privacy) setPrivacy(profileRes.data.privacy);
      }

      // Merge and Sort Watch History
      const movies = movieHistoryRes.data || [];
      const shows = tvHistoryRes.data || [];

      if (movieHistoryRes.error || tvHistoryRes.error) {
        console.warn("⚠️ Watch history schema out of date or missing. Please run profile-schema.sql in your Supabase SQL editor to fix the 400 Bad Request errors.");
      }

      const combinedHistory = [
        ...movies.map(m => ({ ...m, type: 'movie' })),
        ...shows.map(s => ({ ...s, type: 'episode' }))
      ].sort((a, b) => new Date(b.last_watched) - new Date(a.last_watched));

      setWatchHistory(combinedHistory);

      if (favoritesRes.data) setFavorites(favoritesRes.data);

      if (statsRes.data) {
        setStats(prev => ({
          ...prev,
          ...statsRes.data
        }));
      }

      // Load watch parties
      await loadWatchParties();
      // Load badges
      await loadBadges();
      // Load activity
      await loadActivity();
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load watch parties
  const loadWatchParties = async () => {
    if (!user) return;

    try {
      let hostedParties = [];
      let participatedParties = [];

      // Get parties hosted by user
      const { data: hosted, error: hostedError } = await supabase
        .from('watch_parties')
        .select('*')
        .eq('host_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (hostedError) {
        console.error('Error fetching hosted parties:', hostedError);
      } else if (hosted) {
        hostedParties = hosted.map(p => ({
          ...p,
          role: 'host',
          // Use direct columns or fallback
          movie_title: p.movie_title || 'Unknown Movie',
          movie_poster: p.movie_poster || null
        }));
      }

      // Get parties user participated in
      try {
        const { data: participated, error: partError } = await supabase
          .from('party_participants')
          // Removed invalid join to movies
          .select('party_id, watch_parties(*)')
          .eq('user_id', user.id)
          .order('joined_at', { ascending: false })
          .limit(20);

        if (partError) {
          console.error('Error fetching participated parties:', partError);
        } else if (participated) {
          participatedParties = participated
            .map(p => p.watch_parties ? {
              ...p.watch_parties,
              role: 'participant',
              // Use direct columns or fallback
              movie_title: p.watch_parties.movie_title || 'Unknown Movie',
              movie_poster: p.watch_parties.movie_poster || null
            } : null)
            .filter(Boolean);
        }
      } catch (err) {
        console.error('Fatal error loading participated parties:', err);
      }

      const allParties = [...hostedParties, ...participatedParties];

      // Sort by date and remove duplicates
      const uniqueParties = allParties.reduce((acc, party) => {
        if (party && !acc.find(p => p.id === party.id)) acc.push(party);
        return acc;
      }, []);

      setWatchParties(uniqueParties.sort((a, b) =>
        new Date(b.created_at) - new Date(a.created_at)
      ));

      // Update stats
      setStats(prev => ({
        ...prev,
        partiesHosted: hostedParties.length,
        partiesJoined: participatedParties.length
      }));
    } catch (error) {
      console.error('Error loading watch parties:', error);
    }
  };

  // Load badges
  const loadBadges = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('user_badges')
        .select('*, badges(*)')
        .eq('user_id', user.id);

      if (data) {
        setBadges(data.map(b => ({
          id: b.badge_id,
          name: b.badges?.name || 'Unknown Badge',
          icon: b.badges?.icon || '🏆',
          description: b.badges?.description,
          earnedAt: b.earned_at
        })));
      }
    } catch (error) {
      // Badges table might not exist yet
      console.log('Badges not available');
      // Set default badges based on activity
      const defaultBadges = [];
      if (stats.moviesWatched >= 10) {
        defaultBadges.push({ id: 1, name: 'Movie Buff', icon: '🎬', earnedAt: new Date().toISOString() });
      }
      if (stats.partiesHosted >= 5) {
        defaultBadges.push({ id: 2, name: 'Party Starter', icon: '🎉', earnedAt: new Date().toISOString() });
      }
      setBadges(defaultBadges);
    }
  };

  // Load activity feed
  const loadActivity = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('user_activity')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (data) {
        setActivity(data);
      }
    } catch (error) {
      console.error('Error loading activity:', error);
      // Fallback: Generate from watch history if table is empty/error
      const recentActivity = watchHistory.slice(0, 5).map(h => ({
        id: h.id,
        type: 'watched',
        title: `Watched ${h.movies?.title || 'Unknown'}`,
        created_at: h.last_watched
      }));
      setActivity(recentActivity);
    }
  };

  // Update profile
  const updateProfile = async (updates) => {
    if (!user) return { error: 'Not authenticated' };

    try {
      const { data, error } = await db.updateProfile(user.id, updates);
      if (error) throw error;

      setProfile(prev => ({ ...prev, ...updates }));
      return { data, error: null };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { error: error.message };
    }
  };

  // Update settings
  const updateSettings = async (newSettings) => {
    if (!user) return { error: 'Not authenticated' };

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ settings: { ...settings, ...newSettings } })
        .eq('id', user.id);

      if (error) throw error;

      setSettings(prev => ({ ...prev, ...newSettings }));
      return { error: null };
    } catch (error) {
      console.error('Error updating settings:', error);
      return { error: error.message };
    }
  };

  // Update privacy settings
  const updatePrivacy = async (newPrivacy) => {
    if (!user) return { error: 'Not authenticated' };

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ privacy: { ...privacy, ...newPrivacy } })
        .eq('id', user.id);

      if (error) throw error;

      setPrivacy(prev => ({ ...prev, ...newPrivacy }));
      return { error: null };
    } catch (error) {
      console.error('Error updating privacy:', error);
      return { error: error.message };
    }
  };

  // Upload avatar
  const uploadAvatar = async (file) => {
    if (!user) return { error: 'Not authenticated' };

    try {
      const { publicUrl, error } = await db.uploadAvatar(user.id, file);
      if (error) throw error;

      await updateProfile({ avatar_url: publicUrl });
      return { url: publicUrl, error: null };
    } catch (error) {
      console.error('Error uploading avatar:', error);
      return { error: error.message };
    }
  };

  // Remove from watch history
  const removeFromHistory = async (historyId) => {
    if (!user) return { error: 'Not authenticated' };

    try {
      // Find the item to know which table to delete from
      const item = watchHistory.find(h => h.id === historyId);
      if (!item) return { error: 'Item not found' };

      const table = item.type === 'episode' ? 'tv_watch_history' : 'watch_history';

      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', historyId)
        .eq('user_id', user.id);

      if (error) throw error;

      setWatchHistory(prev => prev.filter(h => h.id !== historyId));
      return { error: null };
    } catch (error) {
      console.error('Error removing from history:', error);
      return { error: error.message };
    }
  };

  // Remove from favorites
  const removeFromFavorites = async (movieId) => {
    if (!user) return { error: 'Not authenticated' };

    try {
      const { error } = await db.removeFavorite(user.id, movieId);
      if (error) throw error;

      setFavorites(prev => prev.filter(f => f.movie_id !== movieId));
      return { error: null };
    } catch (error) {
      console.error('Error removing from favorites:', error);
      return { error: error.message };
    }
  };

  // Initial load
  useEffect(() => {
    if (user) {
      loadProfileData();
    }
  }, [user, loadProfileData]);

  // Recalculate stats when watchHistory changes
  useEffect(() => {
    if (watchHistory) {
      // Calculate total watch time from progress (in seconds, convert to minutes)
      const totalWatchTime = watchHistory.reduce((acc, item) => {
        return acc + (item.progress || 0);
      }, 0) / 60; // Convert seconds to minutes

      // Count movies watched (items of type 'movie' with progress)
      const moviesWatched = watchHistory.filter(item => {
        return item.type === 'movie' && (item.progress > (item.duration * 0.1));
      }).length;

      // Count series watched (Calculate UNIQUE show_ids from tv history)
      const uniqueShows = new Set();
      watchHistory.forEach(item => {
        if (item.type === 'episode' && item.show_id) {
          uniqueShows.add(item.show_id);
        }
      });
      const seriesWatched = uniqueShows.size;

      setStats(prev => ({
        ...prev,
        totalWatchTime: Math.round(totalWatchTime),
        moviesWatched,
        seriesWatched
      }));
    }
  }, [watchHistory]);

  // Set up realtime subscriptions
  useEffect(() => {
    if (!user) return;

    // Subscribe to profile changes
    const profileSub = supabase
      .channel(`profile:${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${user.id}`
      }, (payload) => {
        if (payload.new) {
          setProfile(payload.new);
        }
      })
      .subscribe();

    // Subscribe to watch history changes (Movies)
    const historySub = supabase
      .channel(`history:${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'watch_history',
        filter: `user_id=eq.${user.id}`
      }, () => {
        loadProfileData(); // Reload all to keep synced
      })
      .subscribe();

    // Subscribe to tv watch history changes
    const tvHistorySub = supabase
      .channel(`tv_history:${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tv_watch_history',
        filter: `user_id=eq.${user.id}`
      }, () => {
        loadProfileData(); // Reload all
      })
      .subscribe();

    // Subscribe to favorites changes
    const favoritesSub = supabase
      .channel(`favorites:${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'favorites',
        filter: `user_id=eq.${user.id}`
      }, () => {
        // Reload favorites on changes
        db.getFavorites(user.id).then(({ data }) => {
          if (data) setFavorites(data);
        });
      })
      .subscribe();

    // Subscribe to watch parties changes (as host)
    const partiesSub = supabase
      .channel(`parties:${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'watch_parties',
        filter: `host_id=eq.${user.id}`
      }, () => {
        loadWatchParties();
      })
      .subscribe();

    // Subscribe to party participation changes
    const participantsSub = supabase
      .channel(`party-participants:${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'party_participants',
        filter: `user_id=eq.${user.id}`
      }, () => {
        loadWatchParties();
      })
      .subscribe();

    // Subscribe to activity changes
    const activitySub = supabase
      .channel(`activity:${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_activity',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setActivity(prev => [payload.new, ...prev].slice(0, 20));
        } else {
          loadActivity();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(profileSub);
      supabase.removeChannel(historySub);
      supabase.removeChannel(tvHistorySub);
      supabase.removeChannel(favoritesSub);
      supabase.removeChannel(partiesSub);
      supabase.removeChannel(participantsSub);
      supabase.removeChannel(activitySub);
    };
  }, [user, loadProfileData]);

  const value = {
    profile,
    watchHistory,
    favorites,
    watchParties,
    activity,
    badges,
    stats,
    settings,
    privacy,
    loading,
    updateProfile,
    updateSettings,
    updatePrivacy,
    uploadAvatar,
    removeFromHistory,
    removeFromFavorites,
    refreshProfile: loadProfileData
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
}

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};

export default ProfileContext;
