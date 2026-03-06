import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdmin } from '../../context/AdminContext';
import { 
  Search, Eye, Ban, Trash2, X, Mail, Calendar, Shield,
  Film, Heart, AlertTriangle, ArrowLeft, Check, UserX,
  ChevronLeft, ChevronRight, RefreshCw, Users, Crown
} from 'lucide-react';

const TableRowSkeleton = () => (
  <tr>
    <td><div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><div className="admin-skeleton" style={{ width: 40, height: 40, borderRadius: 10 }} /><div className="admin-skeleton" style={{ width: 100, height: 14 }} /></div></td>
    <td><div className="admin-skeleton" style={{ width: 150, height: 14 }} /></td>
    <td><div className="admin-skeleton" style={{ width: 80, height: 14 }} /></td>
    <td><div className="admin-skeleton" style={{ width: 100, height: 14 }} /></td>
    <td><div className="admin-skeleton" style={{ width: 60, height: 24, borderRadius: 12 }} /></td>
    <td><div className="admin-skeleton" style={{ width: 80, height: 28 }} /></td>
  </tr>
);

export default function UserManagement() {
  const { userService, canManageUsers, realtimeService, realtimeEnabled } = useAdmin();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [showRoleModal, setShowRoleModal] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const ITEMS_PER_PAGE = 20;

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const filters = { status: filterStatus, role: filterRole };
      if (searchQuery) filters.search = searchQuery;
      
      const { data, count, totalPages: pages, error } = await userService.getUsers(page, ITEMS_PER_PAGE, filters);
      
      if (error) throw error;
      
      setUsers(data || []);
      setTotalPages(pages || 1);
      setTotalCount(count || 0);
    } catch (err) {
      console.error('Error loading users:', err);
      showToast('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  }, [userService, page, filterStatus, filterRole, searchQuery]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  // Realtime subscription
  useEffect(() => {
    if (!realtimeEnabled) return;
    
    const subscription = realtimeService.subscribeToUsers((payload) => {
      if (payload.eventType === 'INSERT') {
        loadUsers();
      } else if (payload.eventType === 'UPDATE') {
        setUsers(prev => prev.map(u => u.id === payload.new.id ? { ...u, ...payload.new } : u));
      } else if (payload.eventType === 'DELETE') {
        setUsers(prev => prev.filter(u => u.id !== payload.old.id));
      }
    });

    return () => realtimeService.unsubscribe(subscription);
  }, [realtimeEnabled, realtimeService, loadUsers]);

  useEffect(() => {
    const timer = setTimeout(() => setPage(1), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadUserDetails = async (userId) => {
    try {
      const { data, error } = await userService.getUser(userId);
      if (error) throw error;
      setUserDetails(data);
    } catch (err) {
      console.error('Error loading user details:', err);
      showToast('Failed to load user details', 'error');
    }
  };

  const handleViewUser = async (user) => {
    setSelectedUser(user);
    await loadUserDetails(user.id);
  };

  const handleBlockUser = async (userId) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    setActionLoading(userId);
    try {
      const newStatus = user.status === 'blocked' ? 'active' : 'blocked';
      const { error } = await userService.updateUserStatus(userId, newStatus);
      if (error) throw error;
      
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
      if (selectedUser?.id === userId) setSelectedUser(prev => ({ ...prev, status: newStatus }));
      showToast(`User ${newStatus === 'blocked' ? 'blocked' : 'unblocked'} successfully`);
    } catch (err) {
      console.error('Error updating user status:', err);
      showToast('Failed to update user status', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    setActionLoading(userId);
    try {
      const { error } = await userService.updateUserRole(userId, newRole);
      if (error) throw error;
      
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      setShowRoleModal(null);
      showToast(`User role changed to ${newRole}`);
    } catch (err) {
      console.error('Error changing role:', err);
      showToast('Failed to change user role', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId) => {
    setActionLoading(userId);
    try {
      const { error } = await userService.deleteUser(userId);
      if (error) throw error;
      
      setUsers(prev => prev.filter(u => u.id !== userId));
      setShowDeleteModal(null);
      showToast('User deleted successfully');
    } catch (err) {
      console.error('Error deleting user:', err);
      showToast('Failed to delete user', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getInitials = (user) => {
    if (user?.display_name) return user.display_name.substring(0, 2).toUpperCase();
    if (user?.username) return user.username.substring(0, 2).toUpperCase();
    return 'U';
  };

  const getRoleBadge = (role) => {
    const colors = {
      admin: { bg: 'rgba(220, 38, 38, 0.15)', color: '#dc2626' },
      moderator: { bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' },
      content_manager: { bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' },
      user: { bg: 'rgba(255, 255, 255, 0.08)', color: '#a0a0a0' }
    };
    const style = colors[role] || colors.user;
    return <span style={{ ...style, padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 500 }}>{role || 'user'}</span>;
  };

  if (selectedUser) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <button className="admin-btn admin-btn-ghost" onClick={() => { setSelectedUser(null); setUserDetails(null); }} style={{ marginBottom: 24 }}>
          <ArrowLeft size={18} /> Back to Users
        </button>
        
        <div className="admin-card" style={{ marginBottom: 24 }}>
          <div className="admin-user-header" style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {selectedUser.avatar_url ? (
              <img src={selectedUser.avatar_url} alt={selectedUser.username} style={{ width: 80, height: 80, borderRadius: 16, objectFit: 'cover' }} />
            ) : (
              <div style={{ width: 80, height: 80, borderRadius: 16, background: 'linear-gradient(135deg, #333 0%, #555 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 24 }}>{getInitials(selectedUser)}</div>
            )}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <h2 style={{ fontSize: 20, fontWeight: 600 }}>{selectedUser.display_name || selectedUser.username}</h2>
                {getRoleBadge(selectedUser.role)}
                <span className={`admin-badge ${selectedUser.status || 'active'}`}>{selectedUser.status || 'active'}</span>
              </div>
              <p style={{ fontSize: 14, color: '#a0a0a0', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}><Mail size={14} />@{selectedUser.username}</p>
              <p style={{ fontSize: 13, color: '#666', display: 'flex', alignItems: 'center', gap: 6 }}><Calendar size={14} />Joined {formatDate(selectedUser.created_at)}</p>
              
              <div style={{ display: 'flex', gap: 24, marginTop: 16 }}>
                <div><div style={{ fontSize: 20, fontWeight: 600 }}>{userDetails?.stats?.watchCount || 0}</div><div style={{ fontSize: 12, color: '#666' }}>Watched</div></div>
                <div><div style={{ fontSize: 20, fontWeight: 600 }}>{userDetails?.stats?.favoritesCount || 0}</div><div style={{ fontSize: 12, color: '#666' }}>Favorites</div></div>
                <div><div style={{ fontSize: 20, fontWeight: 600 }}>{userDetails?.stats?.partiesHosted || 0}</div><div style={{ fontSize: 12, color: '#666' }}>Parties</div></div>
                <div><div style={{ fontSize: 20, fontWeight: 600 }}>{userDetails?.stats?.friendsCount || 0}</div><div style={{ fontSize: 12, color: '#666' }}>Friends</div></div>
              </div>
            </div>
            
            {canManageUsers() && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => setShowRoleModal(selectedUser)}>
                  <Crown size={16} /> Change Role
                </button>
                <button className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => handleBlockUser(selectedUser.id)} disabled={actionLoading === selectedUser.id}>
                  {selectedUser.status === 'blocked' ? <Check size={16} /> : <Ban size={16} />}
                  {selectedUser.status === 'blocked' ? 'Unblock' : 'Block'}
                </button>
                <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => setShowDeleteModal(selectedUser.id)}>
                  <Trash2 size={16} /> Delete
                </button>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
          <div className="admin-card">
            <div className="admin-card-header"><h3 className="admin-card-title"><Film size={18} /> Watch History</h3></div>
            <div style={{ padding: 20, textAlign: 'center', color: '#666' }}>
              <Film size={32} style={{ opacity: 0.5, marginBottom: 8 }} />
              <p>Watch history data will appear here</p>
            </div>
          </div>
          <div className="admin-card">
            <div className="admin-card-header"><h3 className="admin-card-title"><Heart size={18} /> Favorites</h3></div>
            <div style={{ padding: 20, textAlign: 'center', color: '#666' }}>
              <Heart size={32} style={{ opacity: 0.5, marginBottom: 8 }} />
              <p>Favorites data will appear here</p>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="admin-filters" style={{ marginBottom: 24 }}>
        <div className="admin-search" style={{ width: 280 }}>
          <Search className="admin-search-icon" size={18} />
          <input type="text" placeholder="Search users..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <button className={`admin-filter-btn ${filterStatus === 'all' ? 'active' : ''}`} onClick={() => { setFilterStatus('all'); setPage(1); }}>All</button>
        <button className={`admin-filter-btn ${filterStatus === 'active' ? 'active' : ''}`} onClick={() => { setFilterStatus('active'); setPage(1); }}>Active</button>
        <button className={`admin-filter-btn ${filterStatus === 'blocked' ? 'active' : ''}`} onClick={() => { setFilterStatus('blocked'); setPage(1); }}>Blocked</button>
        <select 
          className="admin-form-select" 
          style={{ width: 140, padding: '8px 12px', background: '#18181c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }}
          value={filterRole}
          onChange={(e) => { setFilterRole(e.target.value); setPage(1); }}
        >
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="moderator">Moderator</option>
          <option value="content_manager">Content Manager</option>
          <option value="user">User</option>
        </select>
        <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={loadUsers} disabled={loading} style={{ marginLeft: 'auto' }}>
          <RefreshCw size={16} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
        </button>
      </div>

      <div className="admin-card">
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Username</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(5).fill(0).map((_, i) => <TableRowSkeleton key={i} />)
              ) : users.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: 40, color: '#666' }}>
                  <Users size={32} style={{ opacity: 0.5, marginBottom: 8 }} />
                  <p>No users found</p>
                </td></tr>
              ) : (
                users.map((user, index) => (
                  <motion.tr key={user.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt={user.username} style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #333 0%, #555 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 14 }}>{getInitials(user)}</div>
                        )}
                        <span className="admin-table-title">{user.display_name || user.username}</span>
                      </div>
                    </td>
                    <td style={{ color: '#a0a0a0' }}>@{user.username}</td>
                    <td>{getRoleBadge(user.role)}</td>
                    <td style={{ color: '#666' }}>{formatDate(user.created_at)}</td>
                    <td><span className={`admin-badge ${user.status || 'active'}`}>{user.status || 'active'}</span></td>
                    <td>
                      <div className="admin-actions">
                        <button className="admin-action-btn" title="View Profile" onClick={() => handleViewUser(user)}><Eye size={16} /></button>
                        {canManageUsers() && (
                          <>
                            <button className="admin-action-btn" title="Change Role" onClick={() => setShowRoleModal(user)}><Crown size={16} /></button>
                            <button className="admin-action-btn" title={user.status === 'blocked' ? 'Unblock' : 'Block'} onClick={() => handleBlockUser(user.id)} disabled={actionLoading === user.id}>
                              {user.status === 'blocked' ? <UserX size={16} /> : <Ban size={16} />}
                            </button>
                            <button className="admin-action-btn danger" title="Delete" onClick={() => setShowDeleteModal(user.id)}><Trash2 size={16} /></button>
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
            <span style={{ fontSize: 13, color: '#666' }}>Page {page} of {totalPages} ({totalCount} users)</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft size={16} />Previous</button>
              <button className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next<ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>

      {/* Role Change Modal */}
      <AnimatePresence>
        {showRoleModal && (
          <motion.div className="admin-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowRoleModal(null)}>
            <motion.div className="admin-modal" style={{ maxWidth: 400 }} initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h2 className="admin-modal-title">Change User Role</h2>
                <button className="admin-modal-close" onClick={() => setShowRoleModal(null)}><X size={18} /></button>
              </div>
              <div className="admin-modal-body">
                <p style={{ marginBottom: 16, color: '#a0a0a0' }}>Select a new role for <strong>{showRoleModal.username}</strong>:</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {['admin', 'moderator', 'content_manager', 'user'].map(role => (
                    <button
                      key={role}
                      className={`admin-btn ${showRoleModal.role === role ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
                      onClick={() => handleChangeRole(showRoleModal.id, role)}
                      disabled={actionLoading === showRoleModal.id}
                      style={{ justifyContent: 'flex-start' }}
                    >
                      <Shield size={16} />
                      {role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      {showRoleModal.role === role && <Check size={16} style={{ marginLeft: 'auto' }} />}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div className="admin-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDeleteModal(null)}>
            <motion.div className="admin-modal" style={{ maxWidth: 400 }} initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h2 className="admin-modal-title">Delete User</h2>
                <button className="admin-modal-close" onClick={() => setShowDeleteModal(null)}><X size={18} /></button>
              </div>
              <div className="admin-modal-body">
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(220, 38, 38, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#dc2626' }}><AlertTriangle size={32} /></div>
                  <p style={{ color: '#a0a0a0' }}>Are you sure you want to delete this user? This action cannot be undone.</p>
                </div>
              </div>
              <div className="admin-modal-footer">
                <button className="admin-btn admin-btn-secondary" onClick={() => setShowDeleteModal(null)}>Cancel</button>
                <button className="admin-btn admin-btn-danger" onClick={() => handleDeleteUser(showDeleteModal)} disabled={actionLoading === showDeleteModal}>
                  <Trash2 size={16} />{actionLoading === showDeleteModal ? 'Deleting...' : 'Delete User'}
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
