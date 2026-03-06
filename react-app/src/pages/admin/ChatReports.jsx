import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdmin } from '../../context/AdminContext';
import { 
  Search, Flag, Trash2, X, MessageSquare, AlertTriangle, Check,
  ChevronLeft, ChevronRight, RefreshCw, Eye, Ban, CheckCircle, XCircle
} from 'lucide-react';

const TableRowSkeleton = () => (
  <tr>
    <td><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div className="admin-skeleton" style={{ width: 32, height: 32, borderRadius: 8 }} /><div className="admin-skeleton" style={{ width: 80, height: 14 }} /></div></td>
    <td><div className="admin-skeleton" style={{ width: 200, height: 14 }} /></td>
    <td><div className="admin-skeleton" style={{ width: 100, height: 14 }} /></td>
    <td><div className="admin-skeleton" style={{ width: 60, height: 24, borderRadius: 12 }} /></td>
    <td><div className="admin-skeleton" style={{ width: 80, height: 28 }} /></td>
  </tr>
);

export default function ChatReports() {
  const { chatService, reportService, userService, canManageUsers, realtimeService, realtimeEnabled } = useAdmin();
  const [activeTab, setActiveTab] = useState('reports');
  const [reports, setReports] = useState([]);
  const [messages, setMessages] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [showReportModal, setShowReportModal] = useState(null);
  const ITEMS_PER_PAGE = 20;

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const filters = { status: filterStatus };
      const { data, count, error } = await reportService.getReports(page, ITEMS_PER_PAGE, filters);
      if (error) throw error;
      
      setReports(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      console.error('Error loading reports:', err);
      showToast('Failed to load reports', 'error');
    } finally {
      setLoading(false);
    }
  }, [reportService, page, filterStatus]);

  const loadMessages = useCallback(async () => {
    setLoading(true);
    try {
      const filters = { flagged: filterStatus === 'flagged' };
      const { data, count, error } = await chatService.getMessages(page, ITEMS_PER_PAGE, filters);
      if (error) throw error;
      
      setMessages(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      console.error('Error loading messages:', err);
      showToast('Failed to load messages', 'error');
    } finally {
      setLoading(false);
    }
  }, [chatService, page, filterStatus]);

  useEffect(() => {
    if (activeTab === 'reports') loadReports();
    else loadMessages();
  }, [activeTab, loadReports, loadMessages]);

  // Realtime subscription
  useEffect(() => {
    if (!realtimeEnabled) return;
    
    const subscription = realtimeService.subscribeToReports((payload) => {
      if (payload.eventType === 'INSERT') {
        loadReports();
        showToast('New report received', 'warning');
      }
    });

    return () => realtimeService.unsubscribe(subscription);
  }, [realtimeEnabled, realtimeService, loadReports]);

  const handleResolveReport = async (reportId, action) => {
    setActionLoading(reportId);
    try {
      const { error } = await reportService.resolveReport(reportId, action);
      if (error) throw error;
      
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: action === 'dismiss' ? 'dismissed' : 'resolved' } : r));
      setShowReportModal(null);
      showToast(`Report ${action === 'dismiss' ? 'dismissed' : 'resolved'}`);
    } catch (err) {
      console.error('Error resolving report:', err);
      showToast('Failed to resolve report', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleBlockReportedUser = async (userId) => {
    setActionLoading(userId);
    try {
      const { error } = await userService.updateUserStatus(userId, 'blocked');
      if (error) throw error;
      showToast('User blocked successfully');
    } catch (err) {
      console.error('Error blocking user:', err);
      showToast('Failed to block user', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleFlag = async (messageId, isFlagged) => {
    setActionLoading(messageId);
    try {
      const { error } = await chatService.toggleFlag(messageId, !isFlagged);
      if (error) throw error;
      
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, is_flagged: !isFlagged } : m));
      showToast(`Message ${!isFlagged ? 'flagged' : 'unflagged'}`);
    } catch (err) {
      console.error('Error toggling flag:', err);
      showToast('Failed to update message', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    setActionLoading(messageId);
    try {
      const { error } = await chatService.deleteMessage(messageId);
      if (error) throw error;
      
      setMessages(prev => prev.filter(m => m.id !== messageId));
      showToast('Message deleted');
    } catch (err) {
      console.error('Error deleting message:', err);
      showToast('Failed to delete message', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleString('en-US', { 
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
  };

  const getInitials = (user) => {
    if (user?.username) return user.username.substring(0, 2).toUpperCase();
    return 'U';
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="admin-tabs" style={{ marginBottom: 24 }}>
        <button className={`admin-tab ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => { setActiveTab('reports'); setPage(1); setFilterStatus('all'); }}>
          <AlertTriangle size={16} />Reports
        </button>
        <button className={`admin-tab ${activeTab === 'messages' ? 'active' : ''}`} onClick={() => { setActiveTab('messages'); setPage(1); setFilterStatus('all'); }}>
          <MessageSquare size={16} />Chat Messages
        </button>
      </div>

      <div className="admin-filters" style={{ marginBottom: 24 }}>
        <div className="admin-search" style={{ width: 280 }}>
          <Search className="admin-search-icon" size={18} />
          <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        {activeTab === 'reports' ? (
          <>
            <button className={`admin-filter-btn ${filterStatus === 'all' ? 'active' : ''}`} onClick={() => { setFilterStatus('all'); setPage(1); }}>All</button>
            <button className={`admin-filter-btn ${filterStatus === 'open' ? 'active' : ''}`} onClick={() => { setFilterStatus('open'); setPage(1); }}>Open</button>
            <button className={`admin-filter-btn ${filterStatus === 'resolved' ? 'active' : ''}`} onClick={() => { setFilterStatus('resolved'); setPage(1); }}>Resolved</button>
            <button className={`admin-filter-btn ${filterStatus === 'dismissed' ? 'active' : ''}`} onClick={() => { setFilterStatus('dismissed'); setPage(1); }}>Dismissed</button>
          </>
        ) : (
          <>
            <button className={`admin-filter-btn ${filterStatus === 'all' ? 'active' : ''}`} onClick={() => { setFilterStatus('all'); setPage(1); }}>All</button>
            <button className={`admin-filter-btn ${filterStatus === 'flagged' ? 'active' : ''}`} onClick={() => { setFilterStatus('flagged'); setPage(1); }}><Flag size={14} />Flagged</button>
          </>
        )}
        <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => activeTab === 'reports' ? loadReports() : loadMessages()} disabled={loading} style={{ marginLeft: 'auto' }}>
          <RefreshCw size={16} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
        </button>
      </div>

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="admin-card">
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Reported User</th>
                  <th>Reason</th>
                  <th>Reported By</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array(5).fill(0).map((_, i) => <TableRowSkeleton key={i} />)
                ) : reports.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: 40, color: '#666' }}>
                    <AlertTriangle size={32} style={{ opacity: 0.5, marginBottom: 8 }} />
                    <p>No reports found</p>
                  </td></tr>
                ) : (
                  reports.map((report, index) => (
                    <motion.tr key={report.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {report.reported_user?.avatar_url ? (
                            <img src={report.reported_user.avatar_url} alt="" style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>{getInitials(report.reported_user)}</div>
                          )}
                          <span>{report.reported_user?.username || 'Unknown'}</span>
                        </div>
                      </td>
                      <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{report.reason}</td>
                      <td style={{ color: '#a0a0a0' }}>{report.reporter?.username || 'Unknown'}</td>
                      <td style={{ color: '#666' }}>{formatDate(report.created_at)}</td>
                      <td><span className={`admin-badge ${report.status}`}>{report.status}</span></td>
                      <td>
                        <div className="admin-actions">
                          <button className="admin-action-btn" title="View Details" onClick={() => setShowReportModal(report)}><Eye size={16} /></button>
                          {report.status === 'open' && canManageUsers() && (
                            <>
                              <button className="admin-action-btn" title="Resolve" onClick={() => handleResolveReport(report.id, 'resolve')} disabled={actionLoading === report.id}><CheckCircle size={16} /></button>
                              <button className="admin-action-btn" title="Dismiss" onClick={() => handleResolveReport(report.id, 'dismiss')} disabled={actionLoading === report.id}><XCircle size={16} /></button>
                            </>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <span style={{ fontSize: 13, color: '#666' }}>Page {page} of {totalPages} ({totalCount} reports)</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft size={16} />Previous</button>
                <button className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next<ChevronRight size={16} /></button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Messages Tab */}
      {activeTab === 'messages' && (
        <div className="admin-card">
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Message</th>
                  <th>Party</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array(5).fill(0).map((_, i) => <TableRowSkeleton key={i} />)
                ) : messages.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: 40, color: '#666' }}>
                    <MessageSquare size={32} style={{ opacity: 0.5, marginBottom: 8 }} />
                    <p>No messages found</p>
                  </td></tr>
                ) : (
                  messages.map((msg, index) => (
                    <motion.tr key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }} style={{ background: msg.is_flagged ? 'rgba(220, 38, 38, 0.05)' : 'transparent' }}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {msg.user?.avatar_url ? (
                            <img src={msg.user.avatar_url} alt="" style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>{getInitials(msg.user)}</div>
                          )}
                          <span>{msg.user?.username || 'Unknown'}</span>
                        </div>
                      </td>
                      <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {msg.is_flagged && <Flag size={12} style={{ color: '#dc2626', marginRight: 6 }} />}
                        {msg.message}
                      </td>
                      <td style={{ color: '#a0a0a0' }}>{msg.party?.movie_title || 'Unknown'}</td>
                      <td style={{ color: '#666' }}>{formatDate(msg.created_at)}</td>
                      <td>
                        <div className="admin-actions">
                          <button 
                            className="admin-action-btn" 
                            title={msg.is_flagged ? 'Unflag' : 'Flag'}
                            onClick={() => handleToggleFlag(msg.id, msg.is_flagged)}
                            disabled={actionLoading === msg.id}
                            style={{ color: msg.is_flagged ? '#dc2626' : undefined }}
                          >
                            <Flag size={16} />
                          </button>
                          <button className="admin-action-btn danger" title="Delete" onClick={() => handleDeleteMessage(msg.id)} disabled={actionLoading === msg.id}><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <span style={{ fontSize: 13, color: '#666' }}>Page {page} of {totalPages} ({totalCount} messages)</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft size={16} />Previous</button>
                <button className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next<ChevronRight size={16} /></button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Report Detail Modal */}
      <AnimatePresence>
        {showReportModal && (
          <motion.div className="admin-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowReportModal(null)}>
            <motion.div className="admin-modal" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h2 className="admin-modal-title">Report Details</h2>
                <button className="admin-modal-close" onClick={() => setShowReportModal(null)}><X size={18} /></button>
              </div>
              <div className="admin-modal-body">
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>Reported User</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {showReportModal.reported_user?.avatar_url ? (
                      <img src={showReportModal.reported_user.avatar_url} alt="" style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{getInitials(showReportModal.reported_user)}</div>
                    )}
                    <span style={{ fontWeight: 500 }}>{showReportModal.reported_user?.username || 'Unknown'}</span>
                  </div>
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>Reason</label>
                  <p style={{ fontWeight: 500 }}>{showReportModal.reason}</p>
                </div>
                {showReportModal.description && (
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>Description</label>
                    <p style={{ color: '#a0a0a0' }}>{showReportModal.description}</p>
                  </div>
                )}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>Reported By</label>
                  <p>{showReportModal.reporter?.username || 'Unknown'}</p>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>Status</label>
                  <span className={`admin-badge ${showReportModal.status}`}>{showReportModal.status}</span>
                </div>
              </div>
              {showReportModal.status === 'open' && canManageUsers() && (
                <div className="admin-modal-footer">
                  <button 
                    className="admin-btn admin-btn-danger admin-btn-sm" 
                    onClick={() => handleBlockReportedUser(showReportModal.reported_user_id)}
                    disabled={actionLoading === showReportModal.reported_user_id}
                  >
                    <Ban size={16} /> Block User
                  </button>
                  <div style={{ flex: 1 }} />
                  <button className="admin-btn admin-btn-secondary" onClick={() => handleResolveReport(showReportModal.id, 'dismiss')}>Dismiss</button>
                  <button className="admin-btn admin-btn-primary" onClick={() => handleResolveReport(showReportModal.id, 'resolve')}>
                    <Check size={16} /> Resolve
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div className={`admin-toast ${toast.type}`} initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}>
            {toast.type === 'success' ? <Check size={18} style={{ color: '#22c55e' }} /> : <AlertTriangle size={18} style={{ color: '#dc2626' }} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
