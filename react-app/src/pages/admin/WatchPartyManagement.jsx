import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdmin } from '../../context/AdminContext';
import { 
  Search, Eye, X, Users, Clock, Film, AlertTriangle, Check,
  ChevronLeft, ChevronRight, RefreshCw, StopCircle, UserMinus, PartyPopper,
  Send, MessageSquare, Wifi
} from 'lucide-react';

const TableRowSkeleton = () => (
  <tr>
    <td><div className="admin-skeleton" style={{ width: 150, height: 14 }} /></td>
    <td><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div className="admin-skeleton" style={{ width: 32, height: 32, borderRadius: 8 }} /><div className="admin-skeleton" style={{ width: 80, height: 14 }} /></div></td>
    <td><div className="admin-skeleton" style={{ width: 40, height: 14 }} /></td>
    <td><div className="admin-skeleton" style={{ width: 100, height: 14 }} /></td>
    <td><div className="admin-skeleton" style={{ width: 60, height: 24, borderRadius: 12 }} /></td>
    <td><div className="admin-skeleton" style={{ width: 80, height: 28 }} /></td>
  </tr>
);

export default function WatchPartyManagement() {
  const { watchPartyService, realtimeService, realtimeEnabled } = useAdmin();
  const [parties, setParties] = useState([]);
  const [selectedParty, setSelectedParty] = useState(null);
  const [partyDetails, setPartyDetails] = useState(null);
  const [showEndModal, setShowEndModal] = useState(null);
  const [showBroadcastModal, setShowBroadcastModal] = useState(null);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
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

  const loadParties = useCallback(async () => {
    setLoading(true);
    try {
      const filters = { status: filterStatus };
      if (searchQuery) filters.search = searchQuery;
      
      const { data, count, totalPages: pages, error } = await watchPartyService.getParties(page, ITEMS_PER_PAGE, filters);
      if (error) throw error;
      
      setParties(data || []);
      setTotalPages(pages || 1);
      setTotalCount(count || 0);
    } catch (err) {
      console.error('Error loading parties:', err);
      showToast('Failed to load watch parties', 'error');
    } finally {
      setLoading(false);
    }
  }, [watchPartyService, page, filterStatus, searchQuery]);

  useEffect(() => { loadParties(); }, [loadParties]);

  // Realtime subscription
  useEffect(() => {
    if (!realtimeEnabled) return;
    
    const subscription = realtimeService.subscribeToParties((payload) => {
      if (payload.eventType === 'INSERT') {
        loadParties();
      } else if (payload.eventType === 'UPDATE') {
        setParties(prev => prev.map(p => p.id === payload.new.id ? { ...p, ...payload.new } : p));
      } else if (payload.eventType === 'DELETE') {
        setParties(prev => prev.filter(p => p.id !== payload.old.id));
      }
    });

    return () => realtimeService.unsubscribe(subscription);
  }, [realtimeEnabled, realtimeService, loadParties]);

  useEffect(() => {
    const timer = setTimeout(() => setPage(1), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadPartyDetails = async (partyId) => {
    try {
      const { data, error } = await watchPartyService.getParty(partyId);
      if (error) throw error;
      setPartyDetails(data);
    } catch (err) {
      console.error('Error loading party details:', err);
      showToast('Failed to load party details', 'error');
    }
  };

  const handleViewParty = async (party) => {
    setSelectedParty(party);
    await loadPartyDetails(party.id);
  };

  const handleEndParty = async (partyId) => {
    setActionLoading(partyId);
    try {
      const { error } = await watchPartyService.endParty(partyId);
      if (error) throw error;
      
      setParties(prev => prev.map(p => p.id === partyId ? { ...p, status: 'ended' } : p));
      if (selectedParty?.id === partyId) setSelectedParty(prev => ({ ...prev, status: 'ended' }));
      setShowEndModal(null);
      showToast('Watch party ended successfully');
    } catch (err) {
      console.error('Error ending party:', err);
      showToast('Failed to end watch party', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveParticipant = async (partyId, userId) => {
    setActionLoading(userId);
    try {
      const { error } = await watchPartyService.removeParticipant(partyId, userId);
      if (error) throw error;
      
      if (partyDetails) {
        setPartyDetails(prev => ({
          ...prev,
          participants: prev.participants.filter(p => p.user_id !== userId)
        }));
      }
      showToast('Participant removed successfully');
    } catch (err) {
      console.error('Error removing participant:', err);
      showToast('Failed to remove participant', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleBroadcastMessage = async () => {
    if (!broadcastMessage.trim()) {
      showToast('Please enter a message', 'error');
      return;
    }
    
    setActionLoading('broadcast');
    try {
      const { error } = await watchPartyService.broadcastMessage(showBroadcastModal, broadcastMessage);
      if (error) throw error;
      
      setShowBroadcastModal(null);
      setBroadcastMessage('');
      showToast('Message broadcast successfully');
    } catch (err) {
      console.error('Error broadcasting message:', err);
      showToast('Failed to broadcast message', 'error');
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

  const formatDuration = (startDate) => {
    if (!startDate) return 'Unknown';
    const start = new Date(startDate);
    const now = new Date();
    const diff = Math.floor((now - start) / 1000 / 60);
    if (diff < 60) return `${diff} min`;
    return `${Math.floor(diff / 60)}h ${diff % 60}m`;
  };

  const getInitials = (user) => {
    if (user?.username) return user.username.substring(0, 2).toUpperCase();
    return 'U';
  };

  if (selectedParty) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <button className="admin-btn admin-btn-ghost" onClick={() => { setSelectedParty(null); setPartyDetails(null); }} style={{ marginBottom: 24 }}>
          <ChevronLeft size={18} /> Back to Watch Parties
        </button>
        
        <div className="admin-card" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <Film size={24} />
                <h2 style={{ fontSize: 20, fontWeight: 600 }}>{selectedParty.movie_title || 'Unknown Movie'}</h2>
                <span className={`admin-badge ${selectedParty.status}`}>{selectedParty.status}</span>
              </div>
              <div style={{ display: 'flex', gap: 24, color: '#666', fontSize: 14 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Clock size={14} />Started {formatDate(selectedParty.created_at)}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Users size={14} />{partyDetails?.participants?.length || 0} participants</span>
              </div>
            </div>
            
            {selectedParty.status === 'active' && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="admin-btn admin-btn-secondary" onClick={() => setShowBroadcastModal(selectedParty.id)}>
                  <MessageSquare size={16} /> Broadcast Message
                </button>
                <button className="admin-btn admin-btn-danger" onClick={() => setShowEndModal(selectedParty.id)}>
                  <StopCircle size={16} /> End Party
                </button>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
          <div className="admin-card">
            <div className="admin-card-header">
              <h3 className="admin-card-title">Host</h3>
            </div>
            <div style={{ padding: 16 }}>
              {partyDetails?.host ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {partyDetails.host.avatar_url ? (
                    <img src={partyDetails.host.avatar_url} alt="" style={{ width: 48, height: 48, borderRadius: 12, objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #333 0%, #555 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>{getInitials(partyDetails.host)}</div>
                  )}
                  <div>
                    <div style={{ fontWeight: 500 }}>{partyDetails.host.username}</div>
                    <div style={{ fontSize: 12, color: '#666' }}>Party Host</div>
                  </div>
                </div>
              ) : (
                <p style={{ color: '#666' }}>Host information unavailable</p>
              )}
            </div>
          </div>

          <div className="admin-card">
            <div className="admin-card-header">
              <h3 className="admin-card-title">Participants ({partyDetails?.participants?.length || 0})</h3>
            </div>
            <div style={{ padding: 16, maxHeight: 300, overflowY: 'auto' }}>
              {partyDetails?.participants?.length > 0 ? (
                partyDetails.participants.map(p => (
                  <div key={p.user_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {p.user?.avatar_url ? (
                        <img src={p.user.avatar_url} alt="" style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>{getInitials(p.user)}</div>
                      )}
                      <span>{p.user?.username || 'Unknown'}</span>
                    </div>
                    {selectedParty.status === 'active' && (
                      <button 
                        className="admin-action-btn danger" 
                        title="Remove" 
                        onClick={() => handleRemoveParticipant(selectedParty.id, p.user_id)}
                        disabled={actionLoading === p.user_id}
                      >
                        <UserMinus size={14} />
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <p style={{ color: '#666', textAlign: 'center' }}>No participants</p>
              )}
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
          <input type="text" placeholder="Search by movie..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <button className={`admin-filter-btn ${filterStatus === 'all' ? 'active' : ''}`} onClick={() => { setFilterStatus('all'); setPage(1); }}>All</button>
        <button className={`admin-filter-btn ${filterStatus === 'active' ? 'active' : ''}`} onClick={() => { setFilterStatus('active'); setPage(1); }}>Active</button>
        <button className={`admin-filter-btn ${filterStatus === 'ended' ? 'active' : ''}`} onClick={() => { setFilterStatus('ended'); setPage(1); }}>Ended</button>
        <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={loadParties} disabled={loading} style={{ marginLeft: 'auto' }}>
          <RefreshCw size={16} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
        </button>
      </div>

      <div className="admin-card">
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Movie</th>
                <th>Host</th>
                <th>Participants</th>
                <th>Started</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(5).fill(0).map((_, i) => <TableRowSkeleton key={i} />)
              ) : parties.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: 40, color: '#666' }}>
                  <PartyPopper size={32} style={{ opacity: 0.5, marginBottom: 8 }} />
                  <p>No watch parties found</p>
                </td></tr>
              ) : (
                parties.map((party, index) => (
                  <motion.tr key={party.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Film size={16} style={{ color: '#666' }} />
                        <span className="admin-table-title">{party.movie_title || 'Unknown'}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {party.host?.avatar_url ? (
                          <img src={party.host.avatar_url} alt="" style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: 28, height: 28, borderRadius: 6, background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>{getInitials(party.host)}</div>
                        )}
                        <span style={{ color: '#a0a0a0' }}>{party.host?.username || 'Unknown'}</span>
                      </div>
                    </td>
                    <td><Users size={14} style={{ marginRight: 4, color: '#666' }} />{party.participants?.[0]?.count || 0}</td>
                    <td style={{ color: '#666' }}>{formatDate(party.created_at)}</td>
                    <td><span className={`admin-badge ${party.status}`}>{party.status}</span></td>
                    <td>
                      <div className="admin-actions">
                        <button className="admin-action-btn" title="View Details" onClick={() => handleViewParty(party)}><Eye size={16} /></button>
                        {party.status === 'active' && (
                          <button className="admin-action-btn danger" title="End Party" onClick={() => setShowEndModal(party.id)}><StopCircle size={16} /></button>
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
            <span style={{ fontSize: 13, color: '#666' }}>Page {page} of {totalPages} ({totalCount} parties)</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft size={16} />Previous</button>
              <button className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next<ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>

      {/* End Party Modal */}
      <AnimatePresence>
        {showEndModal && (
          <motion.div className="admin-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowEndModal(null)}>
            <motion.div className="admin-modal" style={{ maxWidth: 400 }} initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h2 className="admin-modal-title">End Watch Party</h2>
                <button className="admin-modal-close" onClick={() => setShowEndModal(null)}><X size={18} /></button>
              </div>
              <div className="admin-modal-body">
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(220, 38, 38, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#dc2626' }}><StopCircle size={32} /></div>
                  <p style={{ color: '#a0a0a0' }}>Are you sure you want to end this watch party? All participants will be disconnected.</p>
                </div>
              </div>
              <div className="admin-modal-footer">
                <button className="admin-btn admin-btn-secondary" onClick={() => setShowEndModal(null)}>Cancel</button>
                <button className="admin-btn admin-btn-danger" onClick={() => handleEndParty(showEndModal)} disabled={actionLoading === showEndModal}>
                  <StopCircle size={16} />{actionLoading === showEndModal ? 'Ending...' : 'End Party'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Broadcast Message Modal */}
      <AnimatePresence>
        {showBroadcastModal && (
          <motion.div className="admin-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowBroadcastModal(null)}>
            <motion.div className="admin-modal" style={{ maxWidth: 500 }} initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h2 className="admin-modal-title">Broadcast System Message</h2>
                <button className="admin-modal-close" onClick={() => setShowBroadcastModal(null)}><X size={18} /></button>
              </div>
              <div className="admin-modal-body">
                <p style={{ color: '#a0a0a0', marginBottom: 16 }}>Send a system message to all participants in this watch party. This will appear in the chat as a system announcement.</p>
                <div className="admin-form-group">
                  <label className="admin-form-label">Message</label>
                  <textarea 
                    className="admin-form-input admin-form-textarea" 
                    placeholder="Enter your message..."
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    rows={4}
                  />
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => setBroadcastMessage('⚠️ This party will end in 5 minutes.')}>5 min warning</button>
                  <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => setBroadcastMessage('📢 Please keep the chat respectful.')}>Chat reminder</button>
                  <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => setBroadcastMessage('🎬 Enjoy the movie!')}>Welcome</button>
                </div>
              </div>
              <div className="admin-modal-footer">
                <button className="admin-btn admin-btn-secondary" onClick={() => { setShowBroadcastModal(null); setBroadcastMessage(''); }}>Cancel</button>
                <button className="admin-btn admin-btn-primary" onClick={handleBroadcastMessage} disabled={actionLoading === 'broadcast' || !broadcastMessage.trim()}>
                  <Send size={16} />{actionLoading === 'broadcast' ? 'Sending...' : 'Send Message'}
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
