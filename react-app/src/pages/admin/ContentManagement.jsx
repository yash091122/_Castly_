import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdmin } from '../../context/AdminContext';
import {
  Plus, Search, Edit, Trash2, Eye, Upload, X,
  ChevronDown, Film, Tv, Check, AlertTriangle,
  ChevronLeft, ChevronRight, RefreshCw, Globe, EyeOff
} from 'lucide-react';

const genres = ['Action', 'Comedy', 'Drama', 'Sci-Fi', 'Horror', 'Thriller', 'Romance', 'Documentary', 'Animation', 'Adventure', 'Fantasy', 'Crime', 'Anime'];

const TableRowSkeleton = () => (
  <tr>
    <td><div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><div className="admin-skeleton" style={{ width: 48, height: 68, borderRadius: 8 }} /><div><div className="admin-skeleton" style={{ width: 120, height: 14, marginBottom: 6 }} /><div className="admin-skeleton" style={{ width: 60, height: 12 }} /></div></div></td>
    <td><div className="admin-skeleton" style={{ width: 60, height: 14 }} /></td>
    <td><div className="admin-skeleton" style={{ width: 50, height: 14 }} /></td>
    <td><div className="admin-skeleton" style={{ width: 40, height: 14 }} /></td>
    <td><div className="admin-skeleton" style={{ width: 70, height: 24, borderRadius: 12 }} /></td>
    <td><div className="admin-skeleton" style={{ width: 80, height: 28 }} /></td>
  </tr>
);

export default function ContentManagement() {
  const { movieService, seriesService, canManageContent, realtimeService, realtimeEnabled } = useAdmin();
  const [activeTab, setActiveTab] = useState('movies');
  const [movies, setMovies] = useState([]);
  const [series, setSeries] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [openSeasons, setOpenSeasons] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterGenre, setFilterGenre] = useState('');
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const ITEMS_PER_PAGE = 20;

  const [formData, setFormData] = useState({
    title: '', description: '', genre: '', duration: '', release_date: '', status: 'draft', rating: '', year: '',
    poster_url: '', banner_url: '', trailer_url: '', video_url: ''
  });
  const [uploading, setUploading] = useState({});

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleFileUpload = async (file, type) => {
    if (!file) return;
    setUploading(prev => ({ ...prev, [type]: true }));
    try {
      const { url, error } = await movieService.uploadMedia(file, type);
      if (error) throw error;
      setFormData(prev => ({ ...prev, [`\${type}_url`]: url }));
      showToast(`\${type.charAt(0).toUpperCase() + type.slice(1)} uploaded successfully`);
    } catch (err) {
      console.error(`Error uploading \${type}:`, err);
      showToast(`Failed to upload \${type}`, 'error');
    } finally {
      setUploading(prev => ({ ...prev, [type]: false }));
    }
  };

  const loadMovies = useCallback(async () => {
    setLoading(true);
    try {
      const filters = { status: filterStatus };
      if (filterGenre) filters.genre = filterGenre;
      if (searchQuery) filters.search = searchQuery;
      const { data, count, totalPages: pages, error } = await movieService.getMovies(page, ITEMS_PER_PAGE, filters);
      if (error) throw error;
      setMovies(data || []);
      setTotalPages(pages || 1);
      setTotalCount(count || 0);
    } catch (err) {
      console.error('Error loading movies:', err);
      showToast('Failed to load movies', 'error');
    } finally {
      setLoading(false);
    }
  }, [movieService, page, filterStatus, filterGenre, searchQuery]);

  const loadSeries = useCallback(async () => {
    setLoading(true);
    try {
      const filters = { status: filterStatus };
      if (searchQuery) filters.search = searchQuery;
      const { data, count, totalPages: pages, error } = await seriesService.getSeries(page, ITEMS_PER_PAGE, filters);
      if (error) throw error;
      setSeries(data || []);
      setTotalPages(pages || 1);
      setTotalCount(count || 0);
    } catch (err) {
      console.error('Error loading series:', err);
      showToast('Failed to load series', 'error');
    } finally {
      setLoading(false);
    }
  }, [seriesService, page, filterStatus, searchQuery]);

  useEffect(() => {
    if (activeTab === 'movies') loadMovies();
    else loadSeries();
  }, [activeTab, loadMovies, loadSeries]);

  useEffect(() => {
    if (!realtimeEnabled) return;
    const subscription = realtimeService.subscribeToMovies((payload) => {
      if (payload.eventType === 'INSERT') {
        if (activeTab === 'movies') loadMovies();
      } else if (payload.eventType === 'UPDATE') {
        setMovies(prev => prev.map(m => m.id === payload.new.id ? { ...m, ...payload.new } : m));
      } else if (payload.eventType === 'DELETE') {
        setMovies(prev => prev.filter(m => m.id !== payload.old.id));
      }
    });
    return () => realtimeService.unsubscribe(subscription);
  }, [realtimeEnabled, realtimeService, activeTab, loadMovies]);

  useEffect(() => {
    const timer = setTimeout(() => setPage(1), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const toggleSeason = (seriesId, seasonNum) => {
    setOpenSeasons(prev => ({ ...prev, [`\${seriesId}-\${seasonNum}`]: !prev[`\${seriesId}-\${seasonNum}`] }));
  };

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        title: item.title || '', description: item.description || '', genre: item.genre || '',
        duration: item.duration || '', release_date: item.release_date || '', status: item.status || 'draft',
        rating: item.rating || '', year: item.year || '', poster_url: item.poster_url || '',
        banner_url: item.banner_url || '', trailer_url: item.trailer_url || '', video_url: item.video_url || ''
      });
    } else {
      setEditingItem(null);
      setFormData({ title: '', description: '', genre: '', duration: '', release_date: '', status: 'draft', rating: '', year: '', poster_url: '', banner_url: '', trailer_url: '', video_url: '' });
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      showToast('Title is required', 'error');
      return;
    }
    setSaving(true);
    try {
      const contentData = { ...formData };

      // Handle numeric fields - convert empty strings to null to avoid database errors
      if (contentData.year && contentData.year !== '') {
        contentData.year = parseInt(contentData.year);
        if (isNaN(contentData.year)) contentData.year = null;
      } else {
        contentData.year = null;
      }

      // Rating can be numeric or text (like "PG-13"), so only parse if it looks like a number
      if (contentData.rating && contentData.rating !== '') {
        const numRating = parseFloat(contentData.rating);
        // Only use numeric value if it's actually a number (for star ratings like 8.5)
        if (!isNaN(numRating) && contentData.rating.match(/^[\d.]+$/)) {
          contentData.rating = numRating;
        }
        // Otherwise keep as string (for ratings like "PG-13", "R", etc.)
      } else {
        contentData.rating = null;
      }

      // Clean up empty string fields
      Object.keys(contentData).forEach(key => {
        if (contentData[key] === '') {
          contentData[key] = null;
        }
      });

      if (activeTab === 'movies') {
        if (editingItem) {
          const { data, error } = await movieService.updateMovie(editingItem.id, contentData);
          if (error) throw error;
          setMovies(prev => prev.map(m => m.id === editingItem.id ? data : m));
          showToast('Movie updated successfully');
        } else {
          const { data, error } = await movieService.createMovie(contentData);
          if (error) throw error;
          setMovies(prev => [data, ...prev]);
          showToast('Movie added successfully');
        }
      } else {
        if (editingItem) {
          const { data, error } = await seriesService.updateSeries(editingItem.id, contentData);
          if (error) throw error;
          setSeries(prev => prev.map(s => s.id === editingItem.id ? data : s));
          showToast('Series updated successfully');
        } else {
          const { data, error } = await seriesService.createSeries(contentData);
          if (error) throw error;
          setSeries(prev => [data, ...prev]);
          showToast('Series added successfully');
        }
      }
      setShowModal(false);
    } catch (err) {
      console.error('Error saving content:', err);
      showToast('Failed to save content', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      if (activeTab === 'movies') {
        const { error } = await movieService.deleteMovie(id);
        if (error) throw error;
        setMovies(prev => prev.filter(m => m.id !== id));
      } else {
        const { error } = await seriesService.deleteSeries(id);
        if (error) throw error;
        setSeries(prev => prev.filter(s => s.id !== id));
      }
      setShowDeleteModal(null);
      showToast('Content deleted successfully');
    } catch (err) {
      console.error('Error deleting content:', err);
      showToast('Failed to delete content', 'error');
    }
  };

  const handleTogglePublish = async (movie) => {
    try {
      const { data, error } = await movieService.togglePublish(movie.id, movie.status);
      if (error) throw error;
      setMovies(prev => prev.map(m => m.id === movie.id ? data : m));
      showToast(`Movie \${data.status === 'published' ? 'published' : 'unpublished'}`);
    } catch (err) {
      console.error('Error toggling publish:', err);
      showToast('Failed to update status', 'error');
    }
  };

  const handleRefresh = () => {
    if (activeTab === 'movies') loadMovies();
    else loadSeries();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="admin-tabs">
        <button className={`admin-tab \${activeTab === 'movies' ? 'active' : ''}`} onClick={() => { setActiveTab('movies'); setPage(1); }}><Film size={16} />Movies</button>
        <button className={`admin-tab \${activeTab === 'series' ? 'active' : ''}`} onClick={() => { setActiveTab('series'); setPage(1); }}><Tv size={16} />Series</button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div className="admin-filters">
          <div className="admin-search" style={{ width: 280 }}>
            <Search className="admin-search-icon" size={18} />
            <input type="text" placeholder="Search content..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <button className={`admin-filter-btn \${filterStatus === 'all' ? 'active' : ''}`} onClick={() => { setFilterStatus('all'); setPage(1); }}>All</button>
          <button className={`admin-filter-btn \${filterStatus === 'published' ? 'active' : ''}`} onClick={() => { setFilterStatus('published'); setPage(1); }}><Globe size={14} />Published</button>
          <button className={`admin-filter-btn \${filterStatus === 'draft' ? 'active' : ''}`} onClick={() => { setFilterStatus('draft'); setPage(1); }}><EyeOff size={14} />Draft</button>
          {activeTab === 'movies' && (
            <select className="admin-form-select" style={{ width: 120, padding: '8px 12px', background: '#18181c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }} value={filterGenre} onChange={(e) => { setFilterGenre(e.target.value); setPage(1); }}>
              <option value="">All Genres</option>
              {genres.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          )}
          <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={handleRefresh} disabled={loading}>
            <RefreshCw size={16} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>
        {canManageContent() && (
          <button className="admin-btn admin-btn-primary" onClick={() => handleOpenModal()}>
            <Plus size={18} />Add {activeTab === 'movies' ? 'Movie' : 'Series'}
          </button>
        )}
      </div>

      {activeTab === 'movies' && (
        <motion.div className="admin-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="admin-table-container">
            <table className="admin-table">
              <thead><tr><th>Movie</th><th>Genre</th><th>Duration</th><th>Views</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {loading ? (
                  Array(5).fill(0).map((_, i) => <TableRowSkeleton key={i} />)
                ) : movies.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: 40, color: '#666' }}><Film size={32} style={{ opacity: 0.5, marginBottom: 8 }} /><p>No movies found</p></td></tr>
                ) : (
                  movies.map((movie, index) => (
                    <motion.tr key={movie.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          {movie.poster_url ? (
                            <img src={movie.poster_url} alt={movie.title} style={{ width: 48, height: 68, borderRadius: 8, objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: 48, height: 68, borderRadius: 8, background: 'linear-gradient(135deg, #222 0%, #333 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Film size={20} style={{ color: '#666' }} /></div>
                          )}
                          <div><div className="admin-table-title">{movie.title}</div><div className="admin-table-subtitle">{movie.year || 'N/A'}</div></div>
                        </div>
                      </td>
                      <td>{movie.genre || '-'}</td>
                      <td>{movie.duration || '-'}</td>
                      <td>{(movie.view_count || 0).toLocaleString()}</td>
                      <td>
                        <span className={`admin-badge \${movie.status || 'draft'}`} style={{ cursor: canManageContent() ? 'pointer' : 'default' }} onClick={() => canManageContent() && handleTogglePublish(movie)}>
                          {movie.status || 'draft'}
                        </span>
                      </td>
                      <td>
                        <div className="admin-actions">
                          <button className="admin-action-btn" title="Preview"><Eye size={16} /></button>
                          {canManageContent() && (
                            <>
                              <button className="admin-action-btn" title="Edit" onClick={() => handleOpenModal(movie)}><Edit size={16} /></button>
                              <button className="admin-action-btn danger" title="Delete" onClick={() => setShowDeleteModal(movie.id)}><Trash2 size={16} /></button>
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
              <span style={{ fontSize: 13, color: '#666' }}>Page {page} of {totalPages} ({totalCount} items)</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}><ChevronLeft size={16} />Previous</button>
                <button className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next<ChevronRight size={16} /></button>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {activeTab === 'series' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {loading ? (
            <div className="admin-card" style={{ padding: 60 }}><div className="admin-skeleton" style={{ width: '100%', height: 200 }} /></div>
          ) : series.length === 0 ? (
            <div className="admin-card" style={{ textAlign: 'center', padding: 60, color: '#666' }}><Tv size={32} style={{ opacity: 0.5, marginBottom: 8 }} /><p>No series found</p></div>
          ) : (
            series.map((show, idx) => (
              <motion.div key={show.id} className="admin-card" style={{ marginBottom: 16 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    {show.poster_url ? (
                      <img src={show.poster_url} alt={show.title} style={{ width: 60, height: 85, borderRadius: 10, objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: 60, height: 85, borderRadius: 10, background: 'linear-gradient(135deg, #222 0%, #333 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Tv size={24} style={{ color: '#666' }} /></div>
                    )}
                    <div>
                      <h3 style={{ fontSize: 18, fontWeight: 600 }}>{show.title}</h3>
                      <p style={{ fontSize: 13, color: '#666' }}>{show.seasons?.length || 0} Seasons</p>
                      <span className={`admin-badge \${show.status || 'draft'}`} style={{ marginTop: 8 }}>{show.status || 'draft'}</span>
                    </div>
                  </div>
                  {canManageContent() && (
                    <div className="admin-actions">
                      <button className="admin-action-btn" title="Edit" onClick={() => handleOpenModal(show)}><Edit size={16} /></button>
                      <button className="admin-action-btn danger" title="Delete" onClick={() => setShowDeleteModal(show.id)}><Trash2 size={16} /></button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </motion.div>
      )}

      <AnimatePresence>
        {showModal && (
          <motion.div className="admin-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)}>
            <motion.div className="admin-modal" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h2 className="admin-modal-title">{editingItem ? 'Edit' : 'Add New'} {activeTab === 'movies' ? 'Movie' : 'Series'}</h2>
                <button className="admin-modal-close" onClick={() => setShowModal(false)}><X size={18} /></button>
              </div>
              <div className="admin-modal-body">
                <div className="admin-form-group">
                  <label className="admin-form-label">Title *</label>
                  <input type="text" className="admin-form-input" placeholder="Enter title" value={formData.title} onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))} />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Description</label>
                  <textarea className="admin-form-input admin-form-textarea" placeholder="Enter description" value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} />
                </div>
                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label className="admin-form-label">Genre</label>
                    <select className="admin-form-input admin-form-select" value={formData.genre} onChange={(e) => setFormData(prev => ({ ...prev, genre: e.target.value }))}>
                      <option value="">Select genre</option>
                      {genres.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Duration</label>
                    <input type="text" className="admin-form-input" placeholder="e.g., 2h 30m" value={formData.duration} onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))} />
                  </div>
                </div>
                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label className="admin-form-label">Year</label>
                    <input type="number" className="admin-form-input" placeholder="e.g., 2024" value={formData.year} onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))} />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Rating</label>
                    <input type="text" className="admin-form-input" placeholder="e.g., PG-13" value={formData.rating} onChange={(e) => setFormData(prev => ({ ...prev, rating: e.target.value }))} />
                  </div>
                </div>
                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label className="admin-form-label">Release Date</label>
                    <input type="date" className="admin-form-input" value={formData.release_date} onChange={(e) => setFormData(prev => ({ ...prev, release_date: e.target.value }))} />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Status</label>
                    <select className="admin-form-input admin-form-select" value={formData.status} onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}>
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                    </select>
                  </div>
                </div>
                <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}><Upload size={16} style={{ marginRight: 8 }} />Media URLs</h4>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Poster URL</label>
                    <input type="text" className="admin-form-input" placeholder="https://..." value={formData.poster_url} onChange={(e) => setFormData(prev => ({ ...prev, poster_url: e.target.value }))} />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Banner URL</label>
                    <input type="text" className="admin-form-input" placeholder="https://..." value={formData.banner_url} onChange={(e) => setFormData(prev => ({ ...prev, banner_url: e.target.value }))} />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Trailer URL</label>
                    <input type="text" className="admin-form-input" placeholder="https://..." value={formData.trailer_url} onChange={(e) => setFormData(prev => ({ ...prev, trailer_url: e.target.value }))} />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Video URL</label>
                    <input type="text" className="admin-form-input" placeholder="https://..." value={formData.video_url} onChange={(e) => setFormData(prev => ({ ...prev, video_url: e.target.value }))} />
                  </div>
                </div>
              </div>
              <div className="admin-modal-footer">
                <button className="admin-btn admin-btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="admin-btn admin-btn-primary" onClick={handleSave} disabled={saving}>
                  <Check size={18} />{saving ? 'Saving...' : (editingItem ? 'Update' : 'Save')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDeleteModal && (
          <motion.div className="admin-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDeleteModal(null)}>
            <motion.div className="admin-modal" style={{ maxWidth: 400 }} initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h2 className="admin-modal-title">Delete Content</h2>
                <button className="admin-modal-close" onClick={() => setShowDeleteModal(null)}><X size={18} /></button>
              </div>
              <div className="admin-modal-body">
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(220, 38, 38, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#dc2626' }}><AlertTriangle size={32} /></div>
                  <p style={{ color: '#a0a0a0' }}>Are you sure you want to delete this content? This action cannot be undone.</p>
                </div>
              </div>
              <div className="admin-modal-footer">
                <button className="admin-btn admin-btn-secondary" onClick={() => setShowDeleteModal(null)}>Cancel</button>
                <button className="admin-btn admin-btn-danger" onClick={() => handleDelete(showDeleteModal)}><Trash2 size={16} />Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div className={`admin-toast \${toast.type}`} initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}>
            {toast.type === 'success' ? <Check size={18} style={{ color: '#22c55e' }} /> : <AlertTriangle size={18} style={{ color: '#dc2626' }} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
