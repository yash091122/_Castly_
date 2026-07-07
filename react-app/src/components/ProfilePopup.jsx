import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { useNavigate } from 'react-router-dom';
import { Settings, LogOut, ChevronRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import EditProfileModal from './EditProfileModal';
import '../styles/profile.css';

const ProfilePopup = ({ isOpen, onClose }) => {
    const { user, signOut } = useAuth();
    const { profile } = useProfile();
    const navigate = useNavigate();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    console.log('ProfilePopup render | User:', user?.id, ' | isOpen:', isOpen);

    if (!user) {
        console.warn('ProfilePopup: No user found');
    }

    // Safety check for rendering content
    const safeUser = user || { email: 'Guest' };
    const safeProfile = profile || { display_name: 'Guest', avatar_url: null };

    const handleLogout = async () => {
        try {
            console.log('ProfilePopup: Logging out...');
            const { error } = await signOut();
            if (error) {
                console.error('ProfilePopup: Logout error:', error);
            } else {
                console.log('ProfilePopup: Logout successful');
                onClose();
                navigate('/login');
            }
        } catch (err) {
            console.error('ProfilePopup: Logout exception:', err);
        }
    };

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop to close popup */}
                    <motion.div
                        key="profile-backdrop"
                        className="profile-popup-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Popup Card */}
                    <motion.div
                        key="profile-card"
                        className="profile-popup-card"
                        initial={{ opacity: 0, scale: 0.9, x: "-50%", y: "-45%" }}
                        animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
                        exit={{ opacity: 0, scale: 0.9, x: "-50%", y: "-45%" }}
                        transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
                    >
                        {/* Header Section */}
                        <div className="profile-card-header-simple">
                            <div className="profile-avatar-wrapper">
                                <img
                                    src={safeProfile.avatar_url || 'https://via.placeholder.com/150'}
                                    alt={safeProfile.display_name || 'User'}
                                    className="profile-avatar-simple"
                                />
                                <span className={`status-dot-simple ${safeProfile.is_online ? 'online' : ''}`}></span>
                            </div>
                            <div className="profile-identity">
                                <h2 className="profile-name-simple">{safeProfile.display_name || 'User'}</h2>
                                <span className="profile-username-subtext">
                                    {safeProfile.username ? `@${safeProfile.username}` : '@user'}
                                </span>
                            </div>
                            <button className="profile-popup-close" onClick={onClose}>
                                <X size={20} />
                            </button>
                        </div>

                        {/* Email Section */}
                        <div className="profile-email-section">
                            <div className="profile-email-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <path d="M12 16v-4M12 8h.01"></path>
                                </svg>
                            </div>
                            <span className="profile-email-text">{safeUser.email}</span>
                        </div>

                        {/* Menu Actions */}
                        <div className="profile-menu-list">
                            <button
                                className="profile-menu-item"
                                onClick={() => setIsEditModalOpen(true)}
                            >
                                <div className="menu-item-left">
                                    <Settings size={20} />
                                    <span>Settings</span>
                                </div>
                                <ChevronRight size={16} className="menu-chevron" />
                            </button>

                            <div className="menu-divider"></div>

                            <button
                                className="profile-menu-item danger"
                                onClick={handleLogout}
                            >
                                <div className="menu-item-left">
                                    <LogOut size={20} />
                                    <span>Log out</span>
                                </div>
                                <ChevronRight size={16} className="menu-chevron" />
                            </button>
                        </div>

                        {/* Nested Modal for Edit Profile */}
                        <EditProfileModal
                            isOpen={isEditModalOpen}
                            onClose={() => setIsEditModalOpen(false)}
                        />
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default ProfilePopup;
