import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../config/supabase';
import adminService from '../services/adminService';

const AdminContext = createContext(null);

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

export const AdminProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(true);
  const [userRole, setUserRole] = useState('admin');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [realtimeEnabled, setRealtimeEnabled] = useState(true);
  
  // Realtime subscriptions
  const subscriptions = useRef([]);

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        setUser(authUser);
        
        if (authUser) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', authUser.id)
            .single();
          
          if (profile?.role) {
            setUserRole(profile.role);
            setIsAdmin(['admin', 'moderator', 'content_manager'].includes(profile.role));
          }
        }
      } catch (err) {
        console.warn('Auth check failed:', err);
      } finally {
        setLoading(false);
      }
    };
    
    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription?.unsubscribe();
  }, []);

  // Load dashboard stats
  const loadStats = useCallback(async () => {
    try {
      const { data } = await adminService.dashboard.getStats();
      if (data) setStats(data);
    } catch (err) {
      console.warn('Error loading stats:', err);
    }
  }, []);

  // Initial stats load
  useEffect(() => {
    if (!loading) {
      loadStats();
    }
  }, [loading, loadStats]);

  // Realtime event handlers
  const [realtimeEvents, setRealtimeEvents] = useState([]);
  
  const addRealtimeEvent = useCallback((type, data) => {
    const event = {
      id: Date.now(),
      type,
      data,
      timestamp: new Date().toISOString()
    };
    setRealtimeEvents(prev => [event, ...prev].slice(0, 50)); // Keep last 50 events
  }, []);

  // Setup realtime subscriptions
  useEffect(() => {
    if (!realtimeEnabled || loading) return;

    console.log('[AdminContext] Setting up realtime subscriptions...');

    // Subscribe to user changes
    const userSub = adminService.realtime.subscribeToUsers((payload) => {
      console.log('[AdminContext] User change:', payload.eventType);
      addRealtimeEvent('user', payload);
      loadStats();
    });
    subscriptions.current.push(userSub);

    // Subscribe to watch party changes
    const partySub = adminService.realtime.subscribeToParties((payload) => {
      console.log('[AdminContext] Party change:', payload.eventType);
      addRealtimeEvent('party', payload);
      loadStats();
    });
    subscriptions.current.push(partySub);

    // Subscribe to report changes
    const reportSub = adminService.realtime.subscribeToReports((payload) => {
      console.log('[AdminContext] Report change:', payload.eventType);
      addRealtimeEvent('report', payload);
      loadStats();
    });
    subscriptions.current.push(reportSub);

    // Subscribe to movie changes
    const movieSub = adminService.realtime.subscribeToMovies((payload) => {
      console.log('[AdminContext] Movie change:', payload.eventType);
      addRealtimeEvent('movie', payload);
      loadStats();
    });
    subscriptions.current.push(movieSub);

    // Subscribe to chat messages for moderation
    const messageSub = adminService.realtime.subscribeToMessages((payload) => {
      console.log('[AdminContext] Message change:', payload.eventType);
      addRealtimeEvent('message', payload);
      // Only refresh stats if message was flagged
      if (payload.new?.is_flagged) {
        loadStats();
      }
    });
    subscriptions.current.push(messageSub);

    // Subscribe to series changes
    const seriesSub = adminService.realtime.subscribeToSeries((payload) => {
      console.log('[AdminContext] Series change:', payload.eventType);
      addRealtimeEvent('series', payload);
      loadStats();
    });
    subscriptions.current.push(seriesSub);

    return () => {
      console.log('[AdminContext] Cleaning up realtime subscriptions...');
      subscriptions.current.forEach(sub => {
        adminService.realtime.unsubscribe(sub);
      });
      subscriptions.current = [];
    };
  }, [realtimeEnabled, loading, loadStats, addRealtimeEvent]);

  // Permission checks
  const canManageUsers = useCallback(() => ['admin', 'moderator'].includes(userRole), [userRole]);
  const canManageContent = useCallback(() => ['admin', 'content_manager'].includes(userRole), [userRole]);
  const canManageSettings = useCallback(() => userRole === 'admin', [userRole]);
  const canViewLogs = useCallback(() => userRole === 'admin', [userRole]);

  const value = {
    user,
    isAdmin,
    userRole,
    loading,
    stats,
    loadStats,
    realtimeEnabled,
    setRealtimeEnabled,
    realtimeEvents,
    canManageUsers,
    canManageContent,
    canManageSettings,
    canViewLogs,
    // Services
    dashboardService: adminService.dashboard,
    userService: adminService.users,
    movieService: adminService.movies,
    seriesService: adminService.series,
    watchPartyService: adminService.watchParties,
    chatService: adminService.chat,
    reportService: adminService.reports,
    notificationService: adminService.notifications,
    bannerService: adminService.banners,
    settingsService: adminService.settings,
    logsService: adminService.logs,
    realtimeService: adminService.realtime
  };

  // Show loading state
  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0a0c',
        color: '#fff'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 40,
            height: 40,
            border: '3px solid rgba(255,255,255,0.1)',
            borderTopColor: '#fff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ color: '#666' }}>Loading Admin Panel...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};

export default AdminContext;
