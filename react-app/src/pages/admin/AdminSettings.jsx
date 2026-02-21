import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdmin } from '../../context/AdminContext';
import { 
  Settings, Bell, Shield, Palette, Globe, Database,
  Save, RefreshCw, Check, AlertTriangle, X, Plus, Trash2,
  ToggleLeft, ToggleRight, Send, Users, Megaphone
} from 'lucide-react';

export default function AdminSettings() {
  const { settingsService, notificationService, bannerService, canManageSettings } = useAdmin();
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({});
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  
  // Notification form
  const [notificationForm, setNotificationForm] = useState({ title: '', message: '', target: 'all' });
  const [sendingNotification, setSendingNotification] = useState(false);
  
  // Banner form
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [bannerForm, setBannerForm] = useState({ title: '', description: '', start_date: '', end_date: '', is_active: true });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const [settingsResult, bannersResult] = await Promise.all([
        settingsService.getSettings(),
        bannerService.getBanners()
      ]);
      
      if (settingsResult.data) setSettings(settingsResult.data);
      if (bannersResult.data) setBanners(bannersResult.data);
    } catch (err) {
      console.error('Error loading settings:', err);
      showToast('Failed to load settings', 'error');
    } finally {
      setLoading(false);
    }
  }, [settingsService, bannerService]);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const handleSaveSetting = async (key, value) => {
    setSaving(true);
    try {
      const { error } = await settingsService.updateSetting(key, value);
      if (error) throw error;
      
      setSettings(prev => ({ ...prev, [key]: value }));
      showToast('Setting saved successfully');
    } catch (err) {
      console.error('Error saving setting:', err);
      showToast('Failed to save setting', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleMaintenance = async () => {
    const newValue = !settings.maintenance_mode;
    await handleSaveSetting('maintenance_mode', newValue);
  };

  const handleSendNotification = async () => {
    if (!notificationForm.title.trim() || !notificationForm.message.trim()) {
      showToast('Title and message are required', 'error');
      return;
    }
    
    setSendingNotification(true);
    try {
      const { error } = await notificationService.sendNotification(
        notificationForm.title,
        notificationForm.message,
        notificationForm.target
      );
      if (error) throw error;
      
      setNotificationForm({ title: '', message: '', target: 'all' });
      showToast('Notification sent successfully');
    } catch (err) {
      console.error('Error sending notification:', err);
      showToast('Failed to send notification', 'error');
    } finally {
      setSendingNotification(false);
    }
  };

  const handleCreateBanner = async () => {
    if (!bannerForm.title.trim()) {
      showToast('Banner title is required', 'error');
      return;
    }
    
    setSaving(true);
    try {
      const { data, error } = await bannerService.createBanner(bannerForm);
      if (error) throw error;
      
      setBanners(prev => [data, ...prev]);
      setShowBannerModal(false);
      setBannerForm({ title: '', description: '', start_date: '', end_date: '', is_active: true });
      showToast('Banner created successfully');
    } catch (err) {
      console.error('Error creating banner:', err);
      showToast('Failed to create banner', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleBanner = async (bannerId, isActive) => {
    try {
      const { error } = await bannerService.toggleBanner(bannerId, !isActive);
      if (error) throw error;
      
      setBanners(prev => prev.map(b => b.id === bannerId ? { ...b, is_active: !isActive } : b));
      showToast(`Banner ${!isActive ? 'activated' : 'deactivated'}`);
    } catch (err) {
      console.error('Error toggling banner:', err);
      showToast('Failed to update banner', 'error');
    }
  };

  const handleDeleteBanner = async (bannerId) => {
    try {
      const { error } = await bannerService.deleteBanner(bannerId);
      if (error) throw error;
      
      setBanners(prev => prev.filter(b => b.id !== bannerId));
      showToast('Banner deleted successfully');
    } catch (err) {
      console.error('Error deleting banner:', err);
      showToast('Failed to delete banner', 'error');
    }
  };

  if (!canManageSettings()) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="admin-card admin-empty-state">
          <Shield size={48} style={{ color: '#666', marginBottom: 16 }} />
          <h3>Access Denied</h3>
          <p>You don't have permission to manage settings</p>
        </div>
      </motion.div>
    );
  }

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'banners', label: 'Banners', icon: Megaphone },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="admin-tabs" style={{ marginBottom: 24 }}>
        {tabs.map(tab => (
          <button 
            key={tab.id}
            className={`admin-tab ${activeTab === tab.id ? 'active' : ''}`} 
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon size={16} />{tab.label}
          </button>
        ))}
      </div>

      {/* General Settings */}
      {activeTab === 'general' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="admin-card" style={{ marginBottom: 24 }}>
            <div className="admin-card-header">
              <h3 className="admin-card-title"><Globe size={18} /> Platform Settings</h3>
              <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={loadSettings} disabled={loading}>
                <RefreshCw size={16} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
              </button>
            </div>
            
            <div style={{ padding: 20 }}>
              {/* Maintenance Mode */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <div>
                  <h4 style={{ fontWeight: 500, marginBottom: 4 }}>Maintenance Mode</h4>
                  <p style={{ fontSize: 13, color: '#666' }}>Temporarily disable the platform for maintenance</p>
                </div>
                <button 
                  className="admin-btn admin-btn-ghost"
                  onClick={handleToggleMaintenance}
                  disabled={saving}
                  style={{ color: settings.maintenance_mode ? '#dc2626' : '#22c55e' }}
                >
                  {settings.maintenance_mode ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                </button>
              </div>

              {/* App Name */}
              <div style={{ padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <label style={{ display: 'block', fontWeight: 500, marginBottom: 8 }}>App Name</label>
                <div style={{ display: 'flex', gap: 12 }}>
                  <input 
                    type="text" 
                    className="admin-form-input" 
                    value={settings.app_name || 'Castly'} 
                    onChange={(e) => setSettings(prev => ({ ...prev, app_name: e.target.value }))}
                    style={{ flex: 1 }}
                  />
                  <button 
                    className="admin-btn admin-btn-primary admin-btn-sm"
                    onClick={() => handleSaveSetting('app_name', settings.app_name)}
                    disabled={saving}
                  >
                    <Save size={16} />
                  </button>
                </div>
              </div>

              {/* Default Language */}
              <div style={{ padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <label style={{ display: 'block', fontWeight: 500, marginBottom: 8 }}>Default Language</label>
                <div style={{ display: 'flex', gap: 12 }}>
                  <select 
                    className="admin-form-input admin-form-select"
                    value={settings.default_language || 'English'}
                    onChange={(e) => setSettings(prev => ({ ...prev, default_language: e.target.value }))}
                    style={{ flex: 1 }}
                  >
                    <option value="English">English</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                    <option value="German">German</option>
                    <option value="Japanese">Japanese</option>
                  </select>
                  <button 
                    className="admin-btn admin-btn-primary admin-btn-sm"
                    onClick={() => handleSaveSetting('default_language', settings.default_language)}
                    disabled={saving}
                  >
                    <Save size={16} />
                  </button>
                </div>
              </div>

              {/* Max Party Size */}
              <div style={{ padding: '16px 0' }}>
                <label style={{ display: 'block', fontWeight: 500, marginBottom: 8 }}>Max Watch Party Size</label>
                <div style={{ display: 'flex', gap: 12 }}>
                  <input 
                    type="number" 
                    className="admin-form-input" 
                    value={settings.max_party_size || 10} 
                    onChange={(e) => setSettings(prev => ({ ...prev, max_party_size: parseInt(e.target.value) }))}
                    style={{ flex: 1 }}
                    min={2}
                    max={50}
                  />
                  <button 
                    className="admin-btn admin-btn-primary admin-btn-sm"
                    onClick={() => handleSaveSetting('max_party_size', settings.max_party_size)}
                    disabled={saving}
                  >
                    <Save size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Database Info */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h3 className="admin-card-title"><Database size={18} /> Database Status</h3>
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'rgba(34, 197, 94, 0.1)', borderRadius: 10, border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e' }} />
                <span style={{ color: '#22c55e', fontWeight: 500 }}>Connected to Supabase</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Notifications */}
      {activeTab === 'notifications' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="admin-card">
            <div className="admin-card-header">
              <h3 className="admin-card-title"><Send size={18} /> Send Notification</h3>
            </div>
            <div style={{ padding: 20 }}>
              <div className="admin-form-group">
                <label className="admin-form-label">Title</label>
                <input 
                  type="text" 
                  className="admin-form-input" 
                  placeholder="Notification title"
                  value={notificationForm.title}
                  onChange={(e) => setNotificationForm(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Message</label>
                <textarea 
                  className="admin-form-input admin-form-textarea" 
                  placeholder="Notification message"
                  value={notificationForm.message}
                  onChange={(e) => setNotificationForm(prev => ({ ...prev, message: e.target.value }))}
                  rows={4}
                />
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">Target Audience</label>
                <select 
                  className="admin-form-input admin-form-select"
                  value={notificationForm.target}
                  onChange={(e) => setNotificationForm(prev => ({ ...prev, target: e.target.value }))}
                >
                  <option value="all">All Users</option>
                  <option value="active">Active Users (last 24h)</option>
                  <option value="premium">Premium Users</option>
                </select>
              </div>
              <button 
                className="admin-btn admin-btn-primary"
                onClick={handleSendNotification}
                disabled={sendingNotification}
                style={{ width: '100%' }}
              >
                <Send size={16} />
                {sendingNotification ? 'Sending...' : 'Send Notification'}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Banners */}
      {activeTab === 'banners' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 500 }}>Announcement Banners</h3>
            <button className="admin-btn admin-btn-primary admin-btn-sm" onClick={() => setShowBannerModal(true)}>
              <Plus size={16} /> Add Banner
            </button>
          </div>

          {banners.length === 0 ? (
            <div className="admin-card" style={{ textAlign: 'center', padding: 40, color: '#666' }}>
              <Megaphone size={32} style={{ opacity: 0.5, marginBottom: 8 }} />
              <p>No banners created yet</p>
            </div>
          ) : (
            banners.map(banner => (
              <div key={banner.id} className="admin-card" style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                      <h4 style={{ fontWeight: 500 }}>{banner.title}</h4>
                      <span className={`admin-badge ${banner.is_active ? 'active' : 'draft'}`}>
                        {banner.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    {banner.description && <p style={{ fontSize: 13, color: '#666' }}>{banner.description}</p>}
                  </div>
                  <div className="admin-actions">
                    <button 
                      className="admin-action-btn" 
                      title={banner.is_active ? 'Deactivate' : 'Activate'}
                      onClick={() => handleToggleBanner(banner.id, banner.is_active)}
                    >
                      {banner.is_active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                    </button>
                    <button className="admin-action-btn danger" title="Delete" onClick={() => handleDeleteBanner(banner.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </motion.div>
      )}

      {/* Banner Modal */}
      <AnimatePresence>
        {showBannerModal && (
          <motion.div className="admin-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowBannerModal(false)}>
            <motion.div className="admin-modal" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h2 className="admin-modal-title">Create Banner</h2>
                <button className="admin-modal-close" onClick={() => setShowBannerModal(false)}><X size={18} /></button>
              </div>
              <div className="admin-modal-body">
                <div className="admin-form-group">
                  <label className="admin-form-label">Title *</label>
                  <input 
                    type="text" 
                    className="admin-form-input" 
                    placeholder="Banner title"
                    value={bannerForm.title}
                    onChange={(e) => setBannerForm(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Description</label>
                  <textarea 
                    className="admin-form-input admin-form-textarea" 
                    placeholder="Banner description"
                    value={bannerForm.description}
                    onChange={(e) => setBannerForm(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label className="admin-form-label">Start Date</label>
                    <input 
                      type="date" 
                      className="admin-form-input"
                      value={bannerForm.start_date}
                      onChange={(e) => setBannerForm(prev => ({ ...prev, start_date: e.target.value }))}
                    />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">End Date</label>
                    <input 
                      type="date" 
                      className="admin-form-input"
                      value={bannerForm.end_date}
                      onChange={(e) => setBannerForm(prev => ({ ...prev, end_date: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
              <div className="admin-modal-footer">
                <button className="admin-btn admin-btn-secondary" onClick={() => setShowBannerModal(false)}>Cancel</button>
                <button className="admin-btn admin-btn-primary" onClick={handleCreateBanner} disabled={saving}>
                  <Check size={16} />{saving ? 'Creating...' : 'Create Banner'}
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
