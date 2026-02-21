import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useProfile } from '../context/ProfileContext';
import { Camera, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/profile.css';

const EditProfileModal = ({ isOpen, onClose }) => {
    const { profile, updateProfile, uploadAvatar } = useProfile();
    const [displayName, setDisplayName] = useState(profile?.display_name || '');
    const [username, setUsername] = useState(profile?.username || '');
    const [bio, setBio] = useState(profile?.bio || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const updates = {
            display_name: displayName,
            username,
            bio,
            updated_at: new Date(),
        };

        const { error: updateError } = await updateProfile(updates);
        setLoading(false);

        if (updateError) {
            setError(updateError);
        } else {
            onClose();
        }
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            setLoading(true);
            const { error: uploadError } = await uploadAvatar(file);
            setLoading(false);
            if (uploadError) setError(uploadError);
        }
    };

    return createPortal(
        <AnimatePresence>
            <motion.div
                className="profile-popup-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            />
            <motion.div
                className="profile-popup-card edit-profile-card"
                initial={{ opacity: 0, scale: 0.9, x: "-50%", y: "-45%" }}
                animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
                exit={{ opacity: 0, scale: 0.9, x: "-50%", y: "-45%" }}
                transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="profile-card-header-simple">
                    <h2 className="profile-name-simple">Edit Profile</h2>
                    <button className="profile-popup-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="profile-edit-form">
                    <div className="avatar-edit-section">
                        <div className="current-avatar-wrapper">
                            <img
                                src={profile?.avatar_url || 'https://via.placeholder.com/150'}
                                alt="Avatar"
                                className="profile-avatar-large"
                            />
                            <label className="avatar-upload-trigger">
                                <Camera size={18} />
                                <input type="file" hidden accept="image/*" onChange={handleAvatarChange} />
                            </label>
                        </div>
                        <p className="avatar-hint">Tap to change avatar</p>
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <div className="form-group">
                        <label className="profile-label">Display Name</label>
                        <input
                            type="text"
                            className="profile-input"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Enter display name"
                        />
                    </div>

                    <div className="form-group">
                        <label className="profile-label">Username</label>
                        <input
                            type="text"
                            className="profile-input"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="@username"
                        />
                    </div>

                    <div className="form-group">
                        <label className="profile-label">Bio</label>
                        <textarea
                            className="profile-input profile-textarea"
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Tell us about yourself..."
                            rows={3}
                        />
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="profile-btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="profile-btn-primary" disabled={loading}>
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </AnimatePresence>,
        document.body
    );
};

export default EditProfileModal;
