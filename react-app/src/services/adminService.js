import { supabase } from '../config/supabase';

// ============================================
// ADMIN SERVICE - Full Castly Platform Control
// ============================================

// Helper to log admin actions
const logAction = async (action, targetType, targetId, targetName, details = null) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('admin_logs').insert({
      admin_id: user?.id,
      action,
      target_type: targetType,
      target_id: targetId,
      target_name: targetName,
      details
    });
  } catch (err) {
    console.warn('Failed to log action:', err);
  }
};

// ============================================
// DASHBOARD SERVICE
// ============================================
export const dashboardService = {
  getStats: async () => {
    try {
      // Try RPC first
      const { data, error } = await supabase.rpc('get_admin_dashboard_stats');
      if (!error && data) return { data, error: null };
    } catch (e) {
      console.warn('RPC not available, using fallback');
    }

    // Fallback to manual queries
    try {
      const [users, movies, series, parties, reports] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('movies').select('*', { count: 'exact', head: true }),
        supabase.from('series').select('*', { count: 'exact', head: true }),
        supabase.from('watch_parties').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'open')
      ]);

      return {
        data: {
          total_users: users.count || 0,
          total_movies: movies.count || 0,
          total_series: series.count || 0,
          active_parties: parties.count || 0,
          pending_reports: reports.count || 0
        },
        error: null
      };
    } catch (err) {
      return { data: null, error: err };
    }
  },

  getUserGrowth: async (days = 30) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('profiles')
      .select('created_at')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    return { data, error };
  },

  getMostWatched: async (limit = 10) => {
    const { data, error } = await supabase
      .from('movies')
      .select('id, title, view_count, poster_url')
      .order('view_count', { ascending: false, nullsFirst: false })
      .limit(limit);

    return { data, error };
  },

  getRecentActivity: async (limit = 20) => {
    const { data, error } = await supabase
      .from('admin_logs')
      .select('*, admin:profiles(username, avatar_url)')
      .order('created_at', { ascending: false })
      .limit(limit);

    return { data, error };
  }
};

// ============================================
// USER SERVICE
// ============================================
export const userService = {
  getUsers: async (page = 1, limit = 20, filters = {}) => {
    let query = supabase.from('profiles').select('*', { count: 'exact' });

    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }
    if (filters.role && filters.role !== 'all') {
      query = query.eq('role', filters.role);
    }
    if (filters.search) {
      query = query.or(`username.ilike.%${filters.search}%,display_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    return { data: data || [], error, count: count || 0, totalPages: Math.ceil((count || 0) / limit) };
  },

  getUser: async (userId) => {
    const { data: user, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) return { data: null, error };

    // Get user stats
    const [watchHistory, favorites, parties, friends] = await Promise.all([
      supabase.from('watch_history').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('favorites').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('watch_parties').select('*', { count: 'exact', head: true }).eq('host_id', userId),
      supabase.from('friends').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'accepted')
    ]);

    return {
      data: {
        ...user,
        stats: {
          watchCount: watchHistory.count || 0,
          favoritesCount: favorites.count || 0,
          partiesHosted: parties.count || 0,
          friendsCount: friends.count || 0
        }
      },
      error: null
    };
  },

  updateUserStatus: async (userId, status) => {
    const { data, error } = await supabase
      .from('profiles')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (!error) {
      await logAction(status === 'blocked' ? 'Blocked User' : 'Unblocked User', 'user', userId, data?.username);
    }

    return { data, error };
  },

  updateUserRole: async (userId, role) => {
    const { data, error } = await supabase
      .from('profiles')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (!error) {
      await logAction('Changed Role', 'user', userId, data?.username, { newRole: role });
    }

    return { data, error };
  },

  deleteUser: async (userId) => {
    const { data: user } = await supabase.from('profiles').select('username').eq('id', userId).single();
    const { error } = await supabase.from('profiles').delete().eq('id', userId);

    if (!error) {
      await logAction('Deleted User', 'user', userId, user?.username);
    }

    return { error };
  },

  getUserWatchHistory: async (userId, limit = 20) => {
    const { data, error } = await supabase
      .from('watch_history')
      .select('*, movie:movies(id, title, poster_url)')
      .eq('user_id', userId)
      .order('last_watched', { ascending: false })
      .limit(limit);

    return { data, error };
  },

  getUserFavorites: async (userId) => {
    const { data, error } = await supabase
      .from('favorites')
      .select('*, movie:movies(id, title, poster_url)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    return { data, error };
  }
};


// ============================================
// MOVIE SERVICE
// ============================================
export const movieService = {
  getMovies: async (page = 1, limit = 20, filters = {}) => {
    let query = supabase.from('movies').select('*', { count: 'exact' });

    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }
    if (filters.genre) {
      query = query.eq('genre', filters.genre);
    }
    if (filters.search) {
      query = query.ilike('title', `%${filters.search}%`);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    return { data: data || [], error, count: count || 0, totalPages: Math.ceil((count || 0) / limit) };
  },

  getMovie: async (movieId) => {
    const { data, error } = await supabase.from('movies').select('*').eq('id', movieId).single();
    return { data, error };
  },

  createMovie: async (movieData) => {
    const { data, error } = await supabase.from('movies').insert(movieData).select().single();

    if (!error) {
      await logAction('Added Movie', 'movie', data.id, data.title);
    }

    return { data, error };
  },

  updateMovie: async (movieId, updates) => {
    const { data, error } = await supabase
      .from('movies')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', movieId)
      .select()
      .single();

    if (!error) {
      await logAction('Updated Movie', 'movie', movieId, data.title);
    }

    return { data, error };
  },

  deleteMovie: async (movieId) => {
    const { data: movie } = await supabase.from('movies').select('title').eq('id', movieId).single();
    const { error } = await supabase.from('movies').delete().eq('id', movieId);

    if (!error) {
      await logAction('Deleted Movie', 'movie', movieId, movie?.title);
    }

    return { error };
  },

  togglePublish: async (movieId, currentStatus) => {
    const newStatus = currentStatus === 'published' ? 'draft' : 'published';
    const { data, error } = await supabase
      .from('movies')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', movieId)
      .select()
      .single();

    if (!error) {
      await logAction(newStatus === 'published' ? 'Published Movie' : 'Unpublished Movie', 'movie', movieId, data.title);
    }

    return { data, error };
  },

  incrementViewCount: async (movieId) => {
    const { data, error } = await supabase.rpc('increment_view_count', { movie_id: movieId });
    return { data, error };
  },

  uploadMedia: async (file, type = 'poster') => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    const filePath = `movies/${type}s/${fileName}`;

    const { error: uploadError } = await supabase.storage.from('media').upload(filePath, file);
    if (uploadError) return { url: null, error: uploadError };

    const { data } = supabase.storage.from('media').getPublicUrl(filePath);
    return { url: data.publicUrl, error: null };
  }
};

// ============================================
// SERIES SERVICE
// ============================================
export const seriesService = {
  getSeries: async (page = 1, limit = 20, filters = {}) => {
    let query = supabase.from('series').select('*, seasons(count)', { count: 'exact' });

    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }
    if (filters.search) {
      query = query.ilike('title', `%${filters.search}%`);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    return { data: data || [], error, count: count || 0, totalPages: Math.ceil((count || 0) / limit) };
  },

  getSeriesWithSeasons: async (seriesId) => {
    const { data, error } = await supabase
      .from('series')
      .select('*, seasons(*, episodes(*))')
      .eq('id', seriesId)
      .single();

    return { data, error };
  },

  createSeries: async (seriesData) => {
    const { data, error } = await supabase.from('series').insert(seriesData).select().single();

    if (!error) {
      await logAction('Added Series', 'series', data.id, data.title);
    }

    return { data, error };
  },

  updateSeries: async (seriesId, updates) => {
    const { data, error } = await supabase
      .from('series')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', seriesId)
      .select()
      .single();

    if (!error) {
      await logAction('Updated Series', 'series', seriesId, data.title);
    }

    return { data, error };
  },

  deleteSeries: async (seriesId) => {
    const { data: series } = await supabase.from('series').select('title').eq('id', seriesId).single();
    const { error } = await supabase.from('series').delete().eq('id', seriesId);

    if (!error) {
      await logAction('Deleted Series', 'series', seriesId, series?.title);
    }

    return { error };
  },

  addSeason: async (seriesId, seasonNumber, title = null) => {
    const { data, error } = await supabase
      .from('seasons')
      .insert({ series_id: seriesId, season_number: seasonNumber, title })
      .select()
      .single();

    return { data, error };
  },

  addEpisode: async (seasonId, episodeData) => {
    const { data, error } = await supabase
      .from('episodes')
      .insert({ season_id: seasonId, ...episodeData })
      .select()
      .single();

    return { data, error };
  },

  deleteEpisode: async (episodeId) => {
    const { error } = await supabase.from('episodes').delete().eq('id', episodeId);
    return { error };
  }
};

// ============================================
// WATCH PARTY SERVICE
// ============================================
export const watchPartyService = {
  getParties: async (page = 1, limit = 20, filters = {}) => {
    let query = supabase
      .from('watch_parties')
      .select('*, host:profiles!watch_parties_host_id_fkey(id, username, avatar_url)', { count: 'exact' });

    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }
    if (filters.search) {
      query = query.ilike('movie_title', `%${filters.search}%`);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    return { data: data || [], error, count: count || 0, totalPages: Math.ceil((count || 0) / limit) };
  },

  getParty: async (partyId) => {
    const { data, error } = await supabase
      .from('watch_parties')
      .select('*, host:profiles!watch_parties_host_id_fkey(id, username, avatar_url), participants:party_participants(*, user:profiles(id, username, avatar_url))')
      .eq('id', partyId)
      .single();

    return { data, error };
  },

  endParty: async (partyId) => {
    const { data: party } = await supabase.from('watch_parties').select('movie_title').eq('id', partyId).single();
    const { data, error } = await supabase
      .from('watch_parties')
      .update({ status: 'ended', ended_at: new Date().toISOString() })
      .eq('id', partyId)
      .select()
      .single();

    if (!error) {
      await logAction('Ended Watch Party', 'party', partyId, party?.movie_title);
    }

    return { data, error };
  },

  removeParticipant: async (partyId, userId) => {
    const { data: user } = await supabase.from('profiles').select('username').eq('id', userId).single();
    const { error } = await supabase
      .from('party_participants')
      .delete()
      .eq('party_id', partyId)
      .eq('user_id', userId);

    if (!error) {
      await logAction('Removed Participant', 'party', partyId, user?.username);
    }

    return { error };
  },

  getActiveCount: async () => {
    const { count, error } = await supabase
      .from('watch_parties')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    return { count, error };
  },

  // Broadcast system message to a watch party
  broadcastMessage: async (partyId, message) => {
    try {
      // Try RPC first
      const { data, error } = await supabase.rpc('broadcast_party_message', {
        p_party_id: partyId,
        p_message: message
      });

      if (!error) {
        await logAction('Broadcast Message', 'party', partyId, message);
        return { data, error: null };
      }
    } catch (e) {
      console.warn('RPC not available, using fallback');
    }

    // Fallback: Get host_id and insert directly
    const { data: party } = await supabase
      .from('watch_parties')
      .select('host_id')
      .eq('id', partyId)
      .single();

    if (!party) return { data: null, error: new Error('Party not found') };

    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        party_id: partyId,
        user_id: party.host_id,
        message: message,
        type: 'system'
      })
      .select()
      .single();

    if (!error) {
      await logAction('Broadcast Message', 'party', partyId, message);
    }

    return { data, error };
  },

  // Get party participants with user details
  getParticipants: async (partyId) => {
    const { data, error } = await supabase
      .from('party_participants')
      .select('*, user:profiles(id, username, display_name, avatar_url, online_status)')
      .eq('party_id', partyId)
      .order('joined_at', { ascending: true });

    return { data, error };
  }
};


// ============================================
// CHAT SERVICE
// ============================================
export const chatService = {
  getMessages: async (page = 1, limit = 50, filters = {}) => {
    let query = supabase
      .from('chat_messages')
      .select('*, user:profiles(id, username, avatar_url), party:watch_parties(id, movie_title)', { count: 'exact' });

    if (filters.flagged) {
      query = query.eq('is_flagged', true);
    }
    if (filters.partyId) {
      query = query.eq('party_id', filters.partyId);
    }
    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    return { data: data || [], error, count: count || 0 };
  },

  toggleFlag: async (messageId, isFlagged) => {
    const { data, error } = await supabase
      .from('chat_messages')
      .update({ is_flagged: isFlagged })
      .eq('id', messageId)
      .select()
      .single();

    return { data, error };
  },

  deleteMessage: async (messageId) => {
    const { error } = await supabase.from('chat_messages').delete().eq('id', messageId);
    return { error };
  }
};

// ============================================
// REPORT SERVICE
// ============================================
export const reportService = {
  getReports: async (page = 1, limit = 20, filters = {}) => {
    let query = supabase
      .from('reports')
      .select('*, reported_user:profiles!reports_reported_user_id_fkey(id, username, avatar_url), reporter:profiles!reports_reported_by_fkey(id, username)', { count: 'exact' });

    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    return { data: data || [], error, count: count || 0 };
  },

  resolveReport: async (reportId, action) => {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('reports')
      .update({
        status: action === 'dismiss' ? 'dismissed' : 'resolved',
        resolved_by: user?.id,
        resolved_at: new Date().toISOString()
      })
      .eq('id', reportId)
      .select()
      .single();

    if (!error) {
      await logAction(`Report ${action}`, 'report', reportId, null);
    }

    return { data, error };
  },

  getPendingCount: async () => {
    const { count, error } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'open');

    return { count, error };
  }
};

// ============================================
// NOTIFICATION SERVICE
// ============================================
export const notificationService = {
  sendNotification: async (title, message, targetAudience = 'all') => {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('admin_notifications')
      .insert({ title, message, target_audience: targetAudience, sent_by: user?.id })
      .select()
      .single();

    if (!error) {
      // Get target users
      let usersQuery = supabase.from('profiles').select('id');
      if (targetAudience === 'active') {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        usersQuery = usersQuery.gte('last_seen', yesterday.toISOString());
      }

      const { data: users } = await usersQuery;

      if (users?.length) {
        const notifications = users.map(u => ({
          user_id: u.id,
          type: 'system',
          data: { title, message },
          read: false
        }));

        await supabase.from('notifications').insert(notifications);
      }

      await logAction('Sent Notification', 'settings', data.id, title, { targetAudience });
    }

    return { data, error };
  },

  getNotifications: async (limit = 50) => {
    const { data, error } = await supabase
      .from('admin_notifications')
      .select('*, sent_by_user:profiles(username)')
      .order('created_at', { ascending: false })
      .limit(limit);

    return { data: data || [], error };
  }
};

// ============================================
// BANNER SERVICE
// ============================================
export const bannerService = {
  getBanners: async () => {
    const { data, error } = await supabase
      .from('announcement_banners')
      .select('*')
      .order('created_at', { ascending: false });

    return { data: data || [], error };
  },

  createBanner: async (bannerData) => {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('announcement_banners')
      .insert({ ...bannerData, created_by: user?.id })
      .select()
      .single();

    return { data, error };
  },

  updateBanner: async (bannerId, updates) => {
    const { data, error } = await supabase
      .from('announcement_banners')
      .update(updates)
      .eq('id', bannerId)
      .select()
      .single();

    return { data, error };
  },

  toggleBanner: async (bannerId, isActive) => {
    const { data, error } = await supabase
      .from('announcement_banners')
      .update({ is_active: isActive })
      .eq('id', bannerId)
      .select()
      .single();

    return { data, error };
  },

  deleteBanner: async (bannerId) => {
    const { error } = await supabase.from('announcement_banners').delete().eq('id', bannerId);
    return { error };
  }
};

// ============================================
// HERO BANNER SERVICE
// ============================================
export const heroBannerService = {
  getBanners: async () => {
    const { data, error } = await supabase
      .from('hero_banners')
      .select('*')
      .order('display_order', { ascending: true });

    return { data: data || [], error };
  },

  createBanner: async (bannerData) => {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('hero_banners')
      .insert({ ...bannerData, created_by: user?.id })
      .select()
      .single();

    if (!error) {
      await logAction('Created Hero Banner', 'banner', data?.id, bannerData.title);
    }

    return { data, error };
  },

  updateBanner: async (bannerId, updates) => {
    const { data, error } = await supabase
      .from('hero_banners')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', bannerId)
      .select()
      .single();

    if (!error) {
      await logAction('Updated Hero Banner', 'banner', bannerId, updates.title || 'Banner');
    }

    return { data, error };
  },

  toggleBanner: async (bannerId, isActive) => {
    const { data, error } = await supabase
      .from('hero_banners')
      .update({ is_active: isActive })
      .eq('id', bannerId)
      .select()
      .single();

    if (!error) {
      await logAction(isActive ? 'Activated Hero Banner' : 'Deactivated Hero Banner', 'banner', bannerId, data?.title);
    }

    return { data, error };
  },

  deleteBanner: async (bannerId) => {
    const { error } = await supabase.from('hero_banners').delete().eq('id', bannerId);
    if (!error) {
      await logAction('Deleted Hero Banner', 'banner', bannerId, 'N/A');
    }
    return { error };
  }
};

// ============================================
// FEATURED CONTENT SERVICE
// ============================================
export const featuredContentService = {
  getFeatured: async (section = null) => {
    let query = supabase
      .from('featured_content')
      .select(`
        *,
        movies:movies(id, title, poster_url, genre, rating),
        series:series(id, title, poster_url, genre)
      `)
      .order('display_order', { ascending: true });

    if (section) {
      query = query.eq('section', section);
    }

    const { data, error } = await query;
    return { data: data || [], error };
  },

  addFeatured: async (contentId, contentType, section, displayOrder = 0) => {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('featured_content')
      .insert({
        content_id: contentId,
        content_type: contentType,
        section,
        display_order: displayOrder,
        created_by: user?.id
      })
      .select()
      .single();

    if (!error) {
      await logAction('Added Featured Content', 'movie', contentId, `${contentType} to ${section}`);
    }

    return { data, error };
  },

  updateFeatured: async (id, updates) => {
    const { data, error } = await supabase
      .from('featured_content')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    return { data, error };
  },

  removeFeatured: async (id) => {
    const { error } = await supabase.from('featured_content').delete().eq('id', id);
    if (!error) {
      await logAction('Removed Featured Content', 'movie', id, 'N/A');
    }
    return { error };
  },

  toggleFeatured: async (id, isActive) => {
    const { data, error } = await supabase
      .from('featured_content')
      .update({ is_active: isActive })
      .eq('id', id)
      .select()
      .single();

    return { data, error };
  }
};

// ============================================
// SETTINGS SERVICE
// ============================================
export const settingsService = {
  getSettings: async () => {
    const { data, error } = await supabase.from('app_settings').select('*');

    const settings = {};
    if (data) {
      data.forEach(s => {
        try {
          settings[s.key] = typeof s.value === 'string' ? JSON.parse(s.value) : s.value;
        } catch {
          settings[s.key] = s.value;
        }
      });
    }

    return { data: settings, error };
  },

  updateSetting: async (key, value) => {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('app_settings')
      .upsert({ key, value: JSON.stringify(value), updated_by: user?.id, updated_at: new Date().toISOString() })
      .select()
      .single();

    if (!error) {
      await logAction('Updated Setting', 'settings', key, key, { value });
    }

    return { data, error };
  },

  getMaintenanceMode: async () => {
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'maintenance_mode')
      .single();

    return { enabled: data?.value === 'true' || data?.value === true, error };
  },

  setMaintenanceMode: async (enabled) => {
    return settingsService.updateSetting('maintenance_mode', enabled);
  }
};

// ============================================
// LOGS SERVICE
// ============================================
export const logsService = {
  getLogs: async (page = 1, limit = 50, filters = {}) => {
    let query = supabase
      .from('admin_logs')
      .select('*, admin:profiles(id, username, avatar_url)', { count: 'exact' });

    if (filters.targetType) {
      query = query.eq('target_type', filters.targetType);
    }
    if (filters.adminId) {
      query = query.eq('admin_id', filters.adminId);
    }
    if (filters.search) {
      query = query.or(`action.ilike.%${filters.search}%,target_name.ilike.%${filters.search}%`);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    return { data: data || [], error, count: count || 0 };
  }
};

// ============================================
// REALTIME SERVICE (Enhanced)
// ============================================
export const realtimeService = {
  // Subscribe to user changes (new registrations, status updates, role changes)
  subscribeToUsers: (callback) => {
    return supabase
      .channel('admin-users-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profiles'
      }, (payload) => {
        console.log('[Realtime] User change:', payload.eventType, payload);
        callback(payload);
      })
      .subscribe((status) => {
        console.log('[Realtime] Users subscription status:', status);
      });
  },

  // Subscribe to watch party changes (new parties, status updates)
  subscribeToParties: (callback) => {
    return supabase
      .channel('admin-parties-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'watch_parties'
      }, (payload) => {
        console.log('[Realtime] Party change:', payload.eventType, payload);
        callback(payload);
      })
      .subscribe((status) => {
        console.log('[Realtime] Parties subscription status:', status);
      });
  },

  // Subscribe to new reports
  subscribeToReports: (callback) => {
    return supabase
      .channel('admin-reports-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'reports'
      }, (payload) => {
        console.log('[Realtime] Report change:', payload.eventType, payload);
        callback(payload);
      })
      .subscribe((status) => {
        console.log('[Realtime] Reports subscription status:', status);
      });
  },

  // Subscribe to chat messages (for moderation)
  subscribeToMessages: (callback) => {
    return supabase
      .channel('admin-messages-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chat_messages'
      }, (payload) => {
        console.log('[Realtime] Message change:', payload.eventType, payload);
        callback(payload);
      })
      .subscribe((status) => {
        console.log('[Realtime] Messages subscription status:', status);
      });
  },

  // Subscribe to movie/content changes
  subscribeToMovies: (callback) => {
    return supabase
      .channel('admin-movies-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'movies'
      }, (payload) => {
        console.log('[Realtime] Movie change:', payload.eventType, payload);
        callback(payload);
      })
      .subscribe((status) => {
        console.log('[Realtime] Movies subscription status:', status);
      });
  },

  // Subscribe to series changes
  subscribeToSeries: (callback) => {
    return supabase
      .channel('admin-series-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'series'
      }, (payload) => {
        console.log('[Realtime] Series change:', payload.eventType, payload);
        callback(payload);
      })
      .subscribe((status) => {
        console.log('[Realtime] Series subscription status:', status);
      });
  },

  // Subscribe to admin notifications
  subscribeToNotifications: (callback) => {
    return supabase
      .channel('admin-notifications-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'admin_notifications'
      }, (payload) => {
        console.log('[Realtime] New notification:', payload);
        callback(payload);
      })
      .subscribe((status) => {
        console.log('[Realtime] Notifications subscription status:', status);
      });
  },

  // Subscribe to all admin-relevant events at once
  subscribeToAll: (callbacks = {}) => {
    const channel = supabase.channel('admin-all-realtime');

    if (callbacks.onUserChange) {
      channel.on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, callbacks.onUserChange);
    }
    if (callbacks.onPartyChange) {
      channel.on('postgres_changes', { event: '*', schema: 'public', table: 'watch_parties' }, callbacks.onPartyChange);
    }
    if (callbacks.onReportChange) {
      channel.on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, callbacks.onReportChange);
    }
    if (callbacks.onMessageChange) {
      channel.on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages' }, callbacks.onMessageChange);
    }
    if (callbacks.onMovieChange) {
      channel.on('postgres_changes', { event: '*', schema: 'public', table: 'movies' }, callbacks.onMovieChange);
    }

    return channel.subscribe((status) => {
      console.log('[Realtime] All subscriptions status:', status);
    });
  },

  // Unsubscribe from a channel
  unsubscribe: (channel) => {
    if (channel) {
      supabase.removeChannel(channel);
      console.log('[Realtime] Unsubscribed from channel');
    }
  },

  // Unsubscribe from all channels
  unsubscribeAll: () => {
    supabase.removeAllChannels();
    console.log('[Realtime] Unsubscribed from all channels');
  }
};

// ============================================
// AUTH SERVICE
// ============================================
export const authService = {
  isAdmin: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      return ['admin', 'moderator', 'content_manager'].includes(data?.role);
    } catch {
      return true; // Default for dev
    }
  },

  getUserRole: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 'admin';

      const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      return data?.role || 'admin';
    } catch {
      return 'admin';
    }
  },

  hasPermission: async (requiredRoles) => {
    const role = await authService.getUserRole();
    return requiredRoles.includes(role);
  }
};

// ============================================
// DEFAULT EXPORT
// ============================================
export default {
  dashboard: dashboardService,
  users: userService,
  movies: movieService,
  series: seriesService,
  watchParties: watchPartyService,
  chat: chatService,
  reports: reportService,
  notifications: notificationService,
  banners: bannerService,
  heroBanners: heroBannerService,
  featuredContent: featuredContentService,
  settings: settingsService,
  logs: logsService,
  realtime: realtimeService,
  auth: authService
};
