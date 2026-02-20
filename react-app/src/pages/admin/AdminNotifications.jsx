import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdmin } from '../../context/AdminContext';
import { 
  Bell, Send, Users, Clock, Check, AlertTriangle, 
  RefreshCw, Plus, X, Megaphone
} from 'lucide-react';

export default function AdminNotifications() {
  const { notificationService } = useAdmin();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    target: 'all'
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await notificationService.getNotifications(50);
      if (error) throw error;
      setNotifications(data || []);
    } catch (err) {
      console.error('Error loading notifications:', err);
      showToast('Failed to load notifications', 'error');
    } finally {
      setLoading(false);
    }
  }, [notificationService]);

  useEffect(() => { loadNotifications(); }, [loadNotifications]);

  const handleSendNotification = async () => {
    if (!formData.title.trim() || !formData.message.trim()) {
      showToast('Title and message are required', 'error');
      return;
    }
    
    setSending(true);
    try {
      const { data, error } = await notificationService.sendNotification(
        formData.title,
        formData.message,
        formData.target
      );
      if (error) throw error;
      
      setNotifications(prev => [data, ...prev]);
      setShowModal(false);
      setFormData({ title: '', message: '', target: 'all' });
      showToast('Notification sent successfully');
    } catch (err) {
      console.error('Error sending notification:', err);
      showToast('Failed to send notification', 'error');
    } finally {
      setSending(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleString('en-US', { 
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
  };

  const getTargetLabel = (target) => {
    switch (target) {
      case 'all': return 'All Users';
      case 'active': return 'Active Users';
      case 'premium': return 'Premium Users';
      default: return target;
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>Notifications</h2>
          <p style={{ fontSize: 13, color: '#666' }}>Send announcements to users</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={loadNotifications} disabled={loading}>
            <RefreshCw size={16} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
          <button className="admin-btn admin-btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> New Notification
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="admin-card" style={{ padding: 20, textAlign: 'center' }}>
          <Bell size={24} style={{ color: '#3b82f6', marginBottom: 8 }} />
          <div style={{ fontSize: 24, fontWeight: 600 }}>{notifications.length}</div>
          <div style={{ fontSize: 13, color: '#666' }}>Total Sent</div>
        </div>
        <div className="admin-card" style={{ padding: 20, textAlign: 'center' }}>
          <Users size={24} style={{ color: '#22c55e', marginBottom: 8 }} />
          <div style={{ fontSize: 24, fontWeight: 600 }}>{notifications.filter(n => n.target_audience === 'all').length}</div>
          <div style={{ fontSize: 13, color: '#666' }}>To All Users</div>
        </div>
        <div className="admin-card" style={{ padding: 20, textAlign: 'center' }}>
          <Megaphone size={24} style={{ color: '#f59e0b', marginBottom: 8 }} />
          <div style={{ fontSize: 24, fontWeight: 600 }}>{notifications.filter(n => new Date(n.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}</div>
          <div style={{ fontSize: 13, color: '#666' }}>This Week</div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h3 className="admin-card-title">Sent Notifications</h3>
        </div>
        <div style={{ maxHeight: 500, overflowY: 'auto' }}>
          {loading ? (
            Array(5).fill(0).map((_, i) => (
              <div key={i} style={{ padding: 16, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="admin-skeleton" style={{ width: '40%', height: 16, marginBottom: 8 }} />
                <div className="admin-skeleton" style={{ width: '80%', height: 14, marginBottom: 8 }} />
                <div className="admin-skeleton" style={{ width: '30%', height: 12 }} />
              </div>
            ))
          ) : notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#666' }}>
              <Bell size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
              <h3 style={{ marginBottom: 8 }}>No Notifications Sent</h3>
              <p>Send your first notification to users</p>
            </div>
          ) : (
            notifications.map((notification, index) => (
              <motion.div 
                key={notification.id}
                style={{ padding: 16, borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <h4 style={{ fontWeight: 500 }}>{notification.title}</h4>
                  <span style={{ 
                    fontSize: 11, 
                    padding: '4px 8px', 
                    background: 'rgba(255,255,255,0.08)', 
                    borderRadius: 4,
                    color: '#a0a0a0'
                  }}>
                    {getTargetLabel(notification.target_audience)}
                  </span>
                </div>
                <p style={{ fontSize: 14, color: '#a0a0a0', marginBottom: 8 }}>{notification.message}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: '#666' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={12} />
                    {formatDate(notification.created_at)}
                  </span>
                  {notification.sent_by_user && (
                    <span>by {notification.sent_by_user.username}</span>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Send Notification Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div className="admin-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)}>
            <motion.div className="admin-modal" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h2 className="admin-modal-title">Send Notification</h2>
                <button className="admin-modal-close" onClick={() => setShowModal(false)}><X size={18} /></button>
              </div>
              <div className="admin-modal-body">
                <div className="admin-form-group">
                  <label className="admin-form-label">Title *</label>
                  <input 
                    type="text" 
                    className="admin-form-input" 
                    placeholder="Notification title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Message *</label>
                  <textarea 
                    className="admin-form-input admin-form-textarea" 
                    placeholder="Notification message"
                    value={formData.message}
                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                    rows={4}
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Target Audience</label>
                  <select 
                    className="admin-form-input admin-form-select"
                    value={formData.target}
                    onChange={(e) => setFormData(prev => ({ ...prev, target: e.target.value }))}
                  >
                    <option value="all">All Users</option>
                    <option value="active">Active Users (last 24h)</option>
                    <option value="premium">Premium Users</option>
                  </select>
                </div>
              </div>
              <div className="admin-modal-footer">
                <button className="admin-btn admin-btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="admin-btn admin-btn-primary" onClick={handleSendNotification} disabled={sending}>
                  <Send size={16} />{sending ? 'Sending...' : 'Send Notification'}
                </button>
              </div>
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
