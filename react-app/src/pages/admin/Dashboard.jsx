import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';
import RealtimeActivityFeed from '../../components/admin/RealtimeActivityFeed';
import { 
  Users, Film, Tv, PartyPopper, TrendingUp, TrendingDown,
  AlertTriangle, UserPlus, Clock, RefreshCw, Wifi, WifiOff
} from 'lucide-react';

// Animated Counter
const AnimatedCounter = ({ value, duration = 1500 }) => {
  const [count, setCount] = useState(0);
  const countRef = useRef(null);
  
  useEffect(() => {
    const end = parseInt(value) || 0;
    const startTime = Date.now();
    
    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easeOut * end));
      
      if (progress < 1) {
        countRef.current = requestAnimationFrame(animate);
      }
    };
    
    countRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(countRef.current);
  }, [value, duration]);
  
  return <span>{count.toLocaleString()}</span>;
};

export default function Dashboard() {
  const { 
    dashboardService, 
    logsService, 
    stats, 
    loadStats,
    realtimeEnabled,
    setRealtimeEnabled,
    realtimeService
  } = useAdmin();
  
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState([]);
  const [topMovies, setTopMovies] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  const loadData = useCallback(async () => {
    try {
      const [moviesResult, activityResult] = await Promise.all([
        dashboardService.getMostWatched(5),
        logsService.getLogs(1, 10)
      ]);
      
      if (moviesResult?.data?.length) {
        setTopMovies(moviesResult.data.map(m => ({
          title: m.title,
          views: m.view_count || 0
        })));
      }
      
      if (activityResult?.data?.length) {
        setActivities(activityResult.data.map(log => ({
          id: log.id,
          type: log.target_type === 'user' ? 'user' : log.target_type === 'movie' ? 'content' : 'warning',
          text: `${log.action} – ${log.target_name || 'Unknown'}`,
          time: formatTimeAgo(log.created_at),
          icon: getActivityIcon(log.target_type)
        })));
      }
    } catch (err) {
      console.warn('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [dashboardService, logsService]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Setup realtime subscription for activities
  useEffect(() => {
    if (!realtimeEnabled) return;

    const subscription = realtimeService.subscribeToUsers(() => {
      loadData();
      loadStats();
    });

    return () => realtimeService.unsubscribe(subscription);
  }, [realtimeEnabled, realtimeService, loadData, loadStats]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadStats(), loadData()]);
    setRefreshing(false);
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'user': return UserPlus;
      case 'movie': return Film;
      case 'party': return PartyPopper;
      default: return AlertTriangle;
    }
  };

  const statCards = [
    { label: 'Total Users', value: stats?.total_users || 0, change: 12.5, positive: true, icon: Users, link: '/admin/users' },
    { label: 'Total Movies', value: stats?.total_movies || 0, change: 3.1, positive: true, icon: Film, link: '/admin/content' },
    { label: 'Total Series', value: stats?.total_series || 0, change: 5.4, positive: true, icon: Tv, link: '/admin/content' },
    { label: 'Active Parties', value: stats?.active_parties || 0, change: 8.2, positive: true, icon: PartyPopper, link: '/admin/watch-parties' },
    { label: 'Pending Reports', value: stats?.pending_reports || 0, change: -2.3, positive: false, icon: AlertTriangle, link: '/admin/chat-reports' },
  ];

  const maxViews = Math.max(...topMovies.map(m => m.views), 1);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>Dashboard Overview</h2>
          <p style={{ fontSize: 13, color: '#666' }}>Platform statistics and real-time activity</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button 
            className={`admin-btn admin-btn-ghost admin-btn-sm`}
            onClick={() => setRealtimeEnabled(!realtimeEnabled)}
            title={realtimeEnabled ? 'Realtime updates enabled' : 'Realtime updates disabled'}
            style={{ color: realtimeEnabled ? '#22c55e' : '#666' }}
          >
            {realtimeEnabled ? <Wifi size={16} /> : <WifiOff size={16} />}
            {realtimeEnabled ? 'Live' : 'Paused'}
          </button>
          <button 
            className="admin-btn admin-btn-secondary admin-btn-sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw size={16} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="admin-stats-grid">
        {statCards.map((stat, index) => (
          <motion.div 
            key={stat.label} 
            className="admin-stat-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -4 }}
            onClick={() => navigate(stat.link)}
            style={{ cursor: 'pointer' }}
          >
            <div className="admin-stat-info">
              <h3>{stat.label}</h3>
              {loading ? (
                <div className="admin-skeleton" style={{ width: 80, height: 32, marginBottom: 8 }} />
              ) : (
                <div className="admin-stat-value">
                  <AnimatedCounter value={stat.value} />
                </div>
              )}
              <div className={`admin-stat-change ${stat.positive ? 'positive' : 'negative'}`}>
                {stat.positive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                <span>{Math.abs(stat.change)}% from last month</span>
              </div>
            </div>
            <div className="admin-stat-icon">
              <stat.icon size={24} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="admin-charts-grid">
        {/* User Growth Chart */}
        <motion.div 
          className="admin-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="admin-card-header">
            <div>
              <h3 className="admin-card-title">User Growth</h3>
              <p className="admin-card-subtitle">Daily active users over time</p>
            </div>
            <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => navigate('/admin/analytics')}>
              View Details
            </button>
          </div>
          <div className="admin-chart-container">
            <svg width="100%" height="100%" viewBox="0 0 600 250" preserveAspectRatio="xMidYMid meet">
              <defs>
                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                </linearGradient>
              </defs>
              {[50, 100, 150, 200].map((y) => (
                <line key={y} x1="0" y1={y} x2="600" y2={y} stroke="rgba(255,255,255,0.05)" />
              ))}
              <motion.path
                d="M0,200 L100,180 L200,150 L300,160 L400,100 L500,80 L600,50 L600,250 L0,250 Z"
                fill="url(#lineGradient)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1 }}
              />
              <motion.path
                d="M0,200 L100,180 L200,150 L300,160 L400,100 L500,80 L600,50"
                fill="none"
                stroke="rgba(255,255,255,0.8)"
                strokeWidth="2"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5 }}
              />
              {[[0,200], [100,180], [200,150], [300,160], [400,100], [500,80], [600,50]].map(([x, y], i) => (
                <motion.circle key={i} cx={x} cy={y} r="5" fill="white" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5 + i * 0.1 }} />
              ))}
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                <text key={day} x={i * 100} y="245" fill="#666" fontSize="11" textAnchor="middle">{day}</text>
              ))}
            </svg>
          </div>
        </motion.div>

        {/* Activity Feed - Using RealtimeActivityFeed Component */}
        <RealtimeActivityFeed maxItems={15} />
      </div>

      {/* Most Watched Movies */}
      <motion.div className="admin-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <div className="admin-card-header">
          <div>
            <h3 className="admin-card-title">Most Watched Movies</h3>
            <p className="admin-card-subtitle">Top performing content this month</p>
          </div>
          <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => navigate('/admin/content')}>View All</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', height: 200, gap: 24, padding: '20px 0' }}>
          {loading ? (
            Array(5).fill(0).map((_, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div className="admin-skeleton" style={{ width: '100%', height: 100, borderRadius: 8 }} />
                <div className="admin-skeleton" style={{ width: 60, height: 12, marginTop: 8 }} />
              </div>
            ))
          ) : topMovies.length === 0 ? (
            <div style={{ flex: 1, textAlign: 'center', color: '#666' }}>
              <Film size={32} style={{ marginBottom: 12, opacity: 0.5 }} />
              <p>No movie data available</p>
            </div>
          ) : (
            topMovies.map((movie, index) => (
              <motion.div 
                key={movie.title}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
              >
                <motion.div
                  style={{
                    width: '100%',
                    background: `rgba(255,255,255,${0.3 - index * 0.05})`,
                    borderRadius: '8px 8px 0 0',
                    cursor: 'pointer'
                  }}
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max((movie.views / maxViews) * 140, 20)}px` }}
                  transition={{ duration: 0.8, delay: 0.6 + index * 0.1 }}
                  whileHover={{ background: 'rgba(255,255,255,0.4)' }}
                />
                <p style={{ fontSize: 11, marginTop: 8, color: 'rgba(255,255,255,0.6)', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                  {movie.title}
                </p>
                <p style={{ fontSize: 12, fontWeight: 600 }}>
                  {movie.views >= 1000 ? `${(movie.views / 1000).toFixed(1)}K` : movie.views}
                </p>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
