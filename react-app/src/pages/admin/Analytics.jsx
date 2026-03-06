import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAdmin } from '../../context/AdminContext';
import { 
  TrendingUp, Users, Film, PartyPopper, Eye, Clock,
  RefreshCw, Calendar, BarChart3
} from 'lucide-react';

export default function Analytics() {
  const { dashboardService, stats, loadStats } = useAdmin();
  const [loading, setLoading] = useState(true);
  const [userGrowth, setUserGrowth] = useState([]);
  const [topContent, setTopContent] = useState([]);
  const [timeRange, setTimeRange] = useState(30);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const [growthResult, contentResult] = await Promise.all([
        dashboardService.getUserGrowth(timeRange),
        dashboardService.getMostWatched(10)
      ]);
      
      if (growthResult?.data) {
        // Process growth data by day
        const grouped = {};
        growthResult.data.forEach(item => {
          const date = new Date(item.created_at).toLocaleDateString();
          grouped[date] = (grouped[date] || 0) + 1;
        });
        setUserGrowth(Object.entries(grouped).map(([date, count]) => ({ date, count })));
      }
      
      if (contentResult?.data) {
        setTopContent(contentResult.data);
      }
    } catch (err) {
      console.error('Error loading analytics:', err);
    } finally {
      setLoading(false);
    }
  }, [dashboardService, timeRange]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const statCards = [
    { label: 'Total Users', value: stats?.total_users || 0, icon: Users, color: '#3b82f6' },
    { label: 'Active Users', value: stats?.active_users || 0, icon: TrendingUp, color: '#22c55e' },
    { label: 'Total Movies', value: stats?.total_movies || 0, icon: Film, color: '#f59e0b' },
    { label: 'Active Parties', value: stats?.active_parties || 0, icon: PartyPopper, color: '#8b5cf6' },
  ];

  const maxGrowth = Math.max(...userGrowth.map(d => d.count), 1);
  const maxViews = Math.max(...topContent.map(c => c.view_count || 0), 1);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>Analytics Overview</h2>
          <p style={{ fontSize: 13, color: '#666' }}>Platform performance and insights</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <select 
            className="admin-form-select"
            style={{ width: 140, padding: '8px 12px', background: '#18181c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }}
            value={timeRange}
            onChange={(e) => setTimeRange(parseInt(e.target.value))}
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <button className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => { loadStats(); loadAnalytics(); }} disabled={loading}>
            <RefreshCw size={16} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="admin-stats-grid" style={{ marginBottom: 24 }}>
        {statCards.map((stat, index) => (
          <motion.div 
            key={stat.label} 
            className="admin-stat-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="admin-stat-info">
              <h3>{stat.label}</h3>
              <div className="admin-stat-value">{(stat.value || 0).toLocaleString()}</div>
            </div>
            <div className="admin-stat-icon" style={{ background: `${stat.color}20`, color: stat.color }}>
              <stat.icon size={24} />
            </div>
          </motion.div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24 }}>
        {/* User Growth Chart */}
        <motion.div className="admin-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="admin-card-header">
            <div>
              <h3 className="admin-card-title"><TrendingUp size={18} /> User Growth</h3>
              <p className="admin-card-subtitle">New registrations over time</p>
            </div>
          </div>
          <div style={{ padding: 20 }}>
            {loading ? (
              <div className="admin-skeleton" style={{ width: '100%', height: 200 }} />
            ) : userGrowth.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
                <BarChart3 size={32} style={{ opacity: 0.5, marginBottom: 8 }} />
                <p>No growth data available</p>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'flex-end', height: 200, gap: 4 }}>
                {userGrowth.slice(-14).map((day, index) => (
                  <motion.div 
                    key={day.date}
                    style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.05 }}
                  >
                    <motion.div
                      style={{
                        width: '100%',
                        background: 'rgba(59, 130, 246, 0.6)',
                        borderRadius: '4px 4px 0 0',
                        minHeight: 4
                      }}
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max((day.count / maxGrowth) * 160, 4)}px` }}
                      transition={{ duration: 0.5, delay: 0.4 + index * 0.05 }}
                    />
                    <p style={{ fontSize: 9, marginTop: 4, color: '#666', transform: 'rotate(-45deg)', whiteSpace: 'nowrap' }}>
                      {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Top Content */}
        <motion.div className="admin-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <div className="admin-card-header">
            <div>
              <h3 className="admin-card-title"><Eye size={18} /> Top Content</h3>
              <p className="admin-card-subtitle">Most viewed movies</p>
            </div>
          </div>
          <div style={{ padding: 20 }}>
            {loading ? (
              Array(5).fill(0).map((_, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div className="admin-skeleton" style={{ width: 40, height: 56, borderRadius: 6 }} />
                  <div style={{ flex: 1 }}>
                    <div className="admin-skeleton" style={{ width: '60%', height: 14, marginBottom: 4 }} />
                    <div className="admin-skeleton" style={{ width: '30%', height: 12 }} />
                  </div>
                </div>
              ))
            ) : topContent.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
                <Film size={32} style={{ opacity: 0.5, marginBottom: 8 }} />
                <p>No content data available</p>
              </div>
            ) : (
              topContent.map((content, index) => (
                <motion.div 
                  key={content.id}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, padding: '8px 0', borderBottom: index < topContent.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.05 }}
                >
                  <span style={{ width: 24, textAlign: 'center', fontWeight: 600, color: index < 3 ? '#f59e0b' : '#666' }}>#{index + 1}</span>
                  {content.poster_url ? (
                    <img src={content.poster_url} alt="" style={{ width: 40, height: 56, borderRadius: 6, objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: 40, height: 56, borderRadius: 6, background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Film size={16} style={{ color: '#666' }} /></div>
                  )}
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 500, marginBottom: 2 }}>{content.title}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#666' }}>
                      <Eye size={12} />
                      {(content.view_count || 0).toLocaleString()} views
                    </div>
                  </div>
                  <div style={{ width: 80 }}>
                    <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                      <motion.div 
                        style={{ height: '100%', background: '#3b82f6', borderRadius: 3 }}
                        initial={{ width: 0 }}
                        animate={{ width: `${((content.view_count || 0) / maxViews) * 100}%` }}
                        transition={{ duration: 0.5, delay: 0.5 + index * 0.05 }}
                      />
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* Platform Stats */}
      <motion.div className="admin-card" style={{ marginTop: 24 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <div className="admin-card-header">
          <h3 className="admin-card-title"><BarChart3 size={18} /> Platform Statistics</h3>
        </div>
        <div style={{ padding: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24 }}>
          <div style={{ textAlign: 'center', padding: 20, background: 'rgba(255,255,255,0.03)', borderRadius: 12 }}>
            <Film size={32} style={{ color: '#f59e0b', marginBottom: 12 }} />
            <div style={{ fontSize: 28, fontWeight: 600, marginBottom: 4 }}>{stats?.published_movies || 0}</div>
            <div style={{ fontSize: 13, color: '#666' }}>Published Movies</div>
          </div>
          <div style={{ textAlign: 'center', padding: 20, background: 'rgba(255,255,255,0.03)', borderRadius: 12 }}>
            <PartyPopper size={32} style={{ color: '#8b5cf6', marginBottom: 12 }} />
            <div style={{ fontSize: 28, fontWeight: 600, marginBottom: 4 }}>{stats?.total_parties || 0}</div>
            <div style={{ fontSize: 13, color: '#666' }}>Total Watch Parties</div>
          </div>
          <div style={{ textAlign: 'center', padding: 20, background: 'rgba(255,255,255,0.03)', borderRadius: 12 }}>
            <Users size={32} style={{ color: '#22c55e', marginBottom: 12 }} />
            <div style={{ fontSize: 28, fontWeight: 600, marginBottom: 4 }}>{stats?.blocked_users || 0}</div>
            <div style={{ fontSize: 13, color: '#666' }}>Blocked Users</div>
          </div>
          <div style={{ textAlign: 'center', padding: 20, background: 'rgba(255,255,255,0.03)', borderRadius: 12 }}>
            <Clock size={32} style={{ color: '#3b82f6', marginBottom: 12 }} />
            <div style={{ fontSize: 28, fontWeight: 600, marginBottom: 4 }}>{stats?.flagged_messages || 0}</div>
            <div style={{ fontSize: 13, color: '#666' }}>Flagged Messages</div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
