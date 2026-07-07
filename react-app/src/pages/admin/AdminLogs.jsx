import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Loader from '../../components/Loader';
import { useAdmin } from '../../context/AdminContext';
import {
  Search, User, Film, PartyPopper, Shield, Clock,
  RefreshCw, ChevronLeft, ChevronRight, FileText
} from 'lucide-react';

const getTargetIcon = (type) => {
  switch (type) {
    case 'user': return User;
    case 'movie': case 'series': return Film;
    case 'party': return PartyPopper;
    default: return Shield;
  }
};

const getActionStyle = (action) => {
  const dangerActions = ['Blocked', 'Deleted', 'Ended', 'Removed'];
  const isDanger = dangerActions.some(a => action?.includes(a));
  return {
    background: isDanger ? 'rgba(220, 38, 38, 0.15)' : 'rgba(255, 255, 255, 0.08)',
    color: isDanger ? '#dc2626' : '#fff'
  };
};

const TableRowSkeleton = () => (
  <tr>
    <td><div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><div className="admin-skeleton" style={{ width: 36, height: 36, borderRadius: 10 }} /><div className="admin-skeleton" style={{ width: 80, height: 14 }} /></div></td>
    <td><div className="admin-skeleton" style={{ width: 100, height: 24, borderRadius: 6 }} /></td>
    <td><div className="admin-skeleton" style={{ width: 80, height: 14 }} /></td>
    <td><div className="admin-skeleton" style={{ width: 100, height: 14 }} /></td>
  </tr>
);

export default function AdminLogs() {
  const { logsService, canViewLogs } = useAdmin();
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const ITEMS_PER_PAGE = 50;

  const loadLogs = useCallback(async () => {
    if (!canViewLogs()) return;
    setLoading(true);
    try {
      const filters = {};
      if (filter !== 'all') filters.targetType = filter;
      if (searchQuery) filters.search = searchQuery;

      const { data, count, error } = await logsService.getLogs(page, ITEMS_PER_PAGE, filters);
      if (error) throw error;

      setLogs(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      console.error('Error loading logs:', err);
    } finally {
      setLoading(false);
    }
  }, [logsService, page, filter, searchQuery, canViewLogs]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  useEffect(() => {
    const timer = setTimeout(() => setPage(1), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

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

  const getInitials = (user) => {
    if (user?.username) return user.username.charAt(0).toUpperCase();
    return 'A';
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  if (!canViewLogs()) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="admin-card admin-empty-state">
          <Shield size={48} style={{ color: '#666', marginBottom: 16 }} />
          <h3>Access Denied</h3>
          <p>You don't have permission to view admin logs</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div className="admin-filters" style={{ marginBottom: 0 }}>
          <div className="admin-search" style={{ width: 280 }}>
            <Search className="admin-search-icon" size={18} />
            <input type="text" placeholder="Search logs..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <button className={`admin-filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => { setFilter('all'); setPage(1); }}>All</button>
          <button className={`admin-filter-btn ${filter === 'user' ? 'active' : ''}`} onClick={() => { setFilter('user'); setPage(1); }}><User size={14} />User</button>
          <button className={`admin-filter-btn ${filter === 'movie' ? 'active' : ''}`} onClick={() => { setFilter('movie'); setPage(1); }}><Film size={14} />Content</button>
          <button className={`admin-filter-btn ${filter === 'party' ? 'active' : ''}`} onClick={() => { setFilter('party'); setPage(1); }}><PartyPopper size={14} />Party</button>
          <button className={`admin-filter-btn ${filter === 'settings' ? 'active' : ''}`} onClick={() => { setFilter('settings'); setPage(1); }}><Shield size={14} />System</button>
        </div>
        <button className="admin-btn admin-btn-secondary admin-btn-sm" onClick={loadLogs} disabled={loading}>
          <RefreshCw size={16} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      <div className="admin-card">
        <div className="admin-table-container" style={{ maxHeight: 'calc(100vh - 300px)' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Admin</th>
                <th>Action</th>
                <th>Target</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4" style={{ height: '300px' }}><Loader size="medium" fullScreen={false} /></td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan="4" style={{ textAlign: 'center', padding: 40, color: '#666' }}>
                  <FileText size={32} style={{ opacity: 0.5, marginBottom: 8 }} />
                  <p>No logs found</p>
                </td></tr>
              ) : (
                logs.map((log, index) => {
                  const TargetIcon = getTargetIcon(log.target_type);
                  const actionStyle = getActionStyle(log.action);
                  return (
                    <motion.tr key={log.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.02 }}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          {log.admin?.avatar_url ? (
                            <img src={log.admin.avatar_url} alt="" style={{ width: 36, height: 36, borderRadius: 10, objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #333 0%, #555 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 12 }}>{getInitials(log.admin)}</div>
                          )}
                          <span style={{ fontWeight: 500 }}>{log.admin?.username || 'System'}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ ...actionStyle, padding: '6px 12px', borderRadius: 6, fontSize: 13, display: 'inline-block' }}>
                          {log.action}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <TargetIcon size={16} style={{ color: '#666' }} />
                          {log.target_name || '-'}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#666' }}>
                          <Clock size={14} />
                          {formatTimeAgo(log.created_at)}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <span style={{ fontSize: 13, color: '#666' }}>Page {page} of {totalPages} ({totalCount} logs)</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft size={16} />Previous</button>
              <button className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next<ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: 16, fontSize: 13, color: '#666' }}>
        Showing {logs.length} of {totalCount} logs
      </div>
    </motion.div>
  );
}
