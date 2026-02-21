import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../config/supabase';
import '../styles/profile-selection.css';

const AVATAR_COLORS = [
  '#ffb800', '#ff0000', '#000000', '#00ffff',
  '#ff8800', '#ff00ff', '#800080', '#00ff00'
];

const ProfileSelection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);
  const [newProfile, setNewProfile] = useState({
    name: '',
    avatar_color: AVATAR_COLORS[0],
    is_kids: false
  });

  useEffect(() => {
    if (user) {
      loadProfiles();
    }
  }, [user]);

  const loadProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('account_id', user.id)
        .order('last_used_at', { ascending: false });

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error loading profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectProfile = async (profile) => {
    try {
      // Update last_used_at
      await supabase
        .from('user_profiles')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', profile.id);

      // Store selected profile in localStorage
      localStorage.setItem('selectedProfile', JSON.stringify(profile));

      // Navigate to home
      navigate('/');
    } catch (error) {
      console.error('Error selecting profile:', error);
    }
  };

  const createProfile = async () => {
    if (!newProfile.name.trim()) return;

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .insert([{
          account_id: user.id,
          name: newProfile.name,
          avatar_color: newProfile.avatar_color,
          avatar_url: '/assets/smiley.svg',
          is_kids: newProfile.is_kids
        }])
        .select()
        .single();

      if (error) throw error;

      setProfiles([...profiles, data]);
      setShowCreateModal(false);
      setNewProfile({
        name: '',
        avatar_color: AVATAR_COLORS[0],
        is_kids: false
      });
    } catch (error) {
      console.error('Error creating profile:', error);
      alert('Failed to create profile. You can have maximum 5 profiles.');
    }
  };

  const updateProfile = async () => {
    if (!editingProfile.name.trim()) return;

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          name: editingProfile.name,
          avatar_color: editingProfile.avatar_color,
          avatar_url: '/assets/smiley.svg',
          is_kids: editingProfile.is_kids
        })
        .eq('id', editingProfile.id);

      if (error) throw error;

      setProfiles(profiles.map(p =>
        p.id === editingProfile.id ? editingProfile : p
      ));
      setShowEditModal(false);
      setEditingProfile(null);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const deleteProfile = async (profileId) => {
    if (profiles.length <= 1) {
      alert('You must have at least one profile');
      return;
    }

    if (!confirm('Are you sure you want to delete this profile?')) return;

    try {
      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', profileId);

      if (error) throw error;

      setProfiles(profiles.filter(p => p.id !== profileId));
      setShowEditModal(false);
      setEditingProfile(null);
    } catch (error) {
      console.error('Error deleting profile:', error);
    }
  };

  const openEditModal = (profile) => {
    setEditingProfile({
      ...profile,
      avatar_icon: '/assets/smiley.svg'
    });
    setShowEditModal(true);
  };

  if (loading) {
    return (
      <div className="profile-selection-container">
        <div className="profile-loader">Loading profiles...</div>
      </div>
    );
  }

  return (
    <div className="profile-selection-container">
      <div className="profile-selection-content">
        <h1 className="profile-title">Who's watching?</h1>

        <div className="profile-constellation">
          <svg className="constellation-lines" viewBox="-200 -200 400 400">
            {profiles.map((_, i) => {
              const angle = profiles.length === 2
                ? (i * 180) * (Math.PI / 180)
                : (i * (360 / profiles.length)) * (Math.PI / 180) - (Math.PI / 2);
              const radius = window.innerWidth <= 768 ? 130 : 180;
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;
              return (
                <g key={`line-group-${i}`}>
                  {/* Flare shape recreating the image's funnel effect */}
                  <path
                    d={`M 0 0 Q ${x * 0.5} ${y * 0.5 - 20} ${x} ${y} Q ${x * 0.5 + 20} ${y * 0.5} 0 0`}
                    fill="rgba(255,255,255,0.01)"
                  />
                  <line
                    x1="0" y1="0" x2={x} y2={y}
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth="1.5"
                    className="constellation-stroke"
                  />
                </g>
              );
            })}
          </svg>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem', position: 'relative', zIndex: 10 }}>
            <div
              className={`profile-center-hub ${profiles.length >= 5 ? 'disabled' : ''}`}
              onClick={() => { if (profiles.length < 5) setShowCreateModal(true); }}
              title={profiles.length < 5 ? "Add Profile" : "Maximum Profiles Reached"}
            >
              <span className="hub-spark">✦</span>
            </div>
            <p className="profile-name">Add</p>
          </div>

          {profiles.map((profile, i) => {
            const angle = profiles.length === 2
              ? (i * 180) * (Math.PI / 180)
              : (i * (360 / profiles.length)) * (Math.PI / 180) - (Math.PI / 2);
            // Dynamic radius based on viewport width (handled closer in CSS variables)
            const radius = window.innerWidth <= 768 ? 130 : 180;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;

            return (
              <div
                key={profile.id}
                className="profile-orbit-item"
                style={{ '--tx': `${x}px`, '--ty': `${y}px`, '--rot': `${angle}rad` }}
                onClick={() => selectProfile(profile)}
              >
                <div style={{ position: 'relative', width: '100px', height: '100px' }}>
                  <div
                    className="profile-avatar"
                    style={{ backgroundColor: profile.avatar_color }}
                  >
                    <div className="profile-mask" style={{ WebkitMaskImage: `url(/assets/smiley.svg)`, maskImage: `url(/assets/smiley.svg)` }}></div>
                  </div>
                  {profile.is_kids && (
                    <div className="profile-kids-badge" style={{ backgroundColor: profile.avatar_color }}>
                      kids
                    </div>
                  )}
                </div>
                <p className="profile-name">{profile.name}</p>
                {isEditMode && (
                  <button
                    className="profile-edit-btn"
                    onClick={(e) => { e.stopPropagation(); openEditModal(profile); }}
                  >
                    <img src="/assets/edit-icon.svg" alt="Edit" style={{ width: '16px', height: '16px', filter: 'invert(1)' }} />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="profile-actions-row">
          <button
            className={`manage-profiles-btn ${isEditMode ? 'active' : ''}`}
            onClick={() => setIsEditMode(!isEditMode)}
          >
            <img src="/assets/edit-icon.svg" alt="Edit" className="btn-edit-icon" />
            {isEditMode ? 'Done' : 'Edit Profiles'}
          </button>

          <button className="manage-profiles-btn" onClick={() => navigate('/login')}>
            Switch Account
          </button>
        </div>
      </div>

      {/* Create Profile Modal */}
      {showCreateModal && (
        <div className="profile-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Create Profile</h2>

            <div className="modal-form">
              <input
                type="text"
                placeholder="Profile Name"
                value={newProfile.name}
                onChange={(e) => setNewProfile({ ...newProfile, name: e.target.value })}
                maxLength={50}
              />



              <div className="color-selector">
                <label>Choose Color:</label>
                <div className="color-options">
                  {AVATAR_COLORS.map((color) => (
                    <div
                      key={color}
                      className={`color-option ${newProfile.avatar_color === color ? 'selected' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewProfile({ ...newProfile, avatar_color: color })}
                    />
                  ))}
                </div>
              </div>

              <label className="kids-toggle">
                <input
                  type="checkbox"
                  checked={newProfile.is_kids}
                  onChange={(e) => setNewProfile({ ...newProfile, is_kids: e.target.checked })}
                />
                <span>Kids Profile (age-appropriate content only)</span>
              </label>

              <div className="modal-actions">
                <button className="btn-cancel" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button className="btn-save" onClick={createProfile}>
                  Create Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditModal && editingProfile && (
        <div className="profile-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Edit Profile</h2>

            <div className="modal-form">
              <input
                type="text"
                placeholder="Profile Name"
                value={editingProfile.name}
                onChange={(e) => setEditingProfile({ ...editingProfile, name: e.target.value })}
                maxLength={50}
              />



              <div className="color-selector">
                <label>Choose Color:</label>
                <div className="color-options">
                  {AVATAR_COLORS.map((color) => (
                    <div
                      key={color}
                      className={`color-option ${editingProfile.avatar_color === color ? 'selected' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setEditingProfile({ ...editingProfile, avatar_color: color })}
                    />
                  ))}
                </div>
              </div>

              <label className="kids-toggle">
                <input
                  type="checkbox"
                  checked={editingProfile.is_kids}
                  onChange={(e) => setEditingProfile({ ...editingProfile, is_kids: e.target.checked })}
                />
                <span>Kids Profile (age-appropriate content only)</span>
              </label>

              <div className="modal-actions">
                <button className="btn-delete" onClick={() => deleteProfile(editingProfile.id)}>
                  Delete Profile
                </button>
                <button className="btn-cancel" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button className="btn-save" onClick={updateProfile}>
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileSelection;
