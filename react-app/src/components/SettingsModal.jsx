import { useProfile } from '../context/ProfileContext';
import { X, Bell, Play, Monitor, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SettingsModal = ({ isOpen, onClose }) => {
    const { settings, updateSettings, privacy, updatePrivacy } = useProfile();

    if (!isOpen) return null;

    const handleToggle = (key) => {
        updateSettings({ [key]: !settings[key] });
    };

    const handlePrivacyChange = (key, value) => {
        updatePrivacy({ [key]: value });
    };

    return (
        <AnimatePresence>
            <motion.div
                className="modal-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            >
                <motion.div
                    className="modal-content settings-modal"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="modal-header">
                        <h2>Settings</h2>
                        <button className="modal-close-btn" onClick={onClose}>
                            <X size={20} />
                        </button>
                    </div>

                    <div className="settings-section">
                        <h3>App Preferences</h3>

                        <div className="setting-item">
                            <div className="setting-info">
                                <Bell size={20} />
                                <div>
                                    <h4>Notifications</h4>
                                    <p>Receive updates about new movies and parties</p>
                                </div>
                            </div>
                            <label className="switch">
                                <input
                                    type="checkbox"
                                    checked={settings?.notifications}
                                    onChange={() => handleToggle('notifications')}
                                />
                                <span className="slider round"></span>
                            </label>
                        </div>

                        <div className="setting-item">
                            <div className="setting-info">
                                <Play size={20} />
                                <div>
                                    <h4>Autoplay Trailer</h4>
                                    <p>Automatically play trailers on hover</p>
                                </div>
                            </div>
                            <label className="switch">
                                <input
                                    type="checkbox"
                                    checked={settings?.autoplay}
                                    onChange={() => handleToggle('autoplay')}
                                />
                                <span className="slider round"></span>
                            </label>
                        </div>

                        <div className="setting-item">
                            <div className="setting-info">
                                <Monitor size={20} />
                                <div>
                                    <h4>HD Quality</h4>
                                    <p>Stream in high definition when available</p>
                                </div>
                            </div>
                            <label className="switch">
                                <input
                                    type="checkbox"
                                    checked={settings?.hdQuality}
                                    onChange={() => handleToggle('hdQuality')}
                                />
                                <span className="slider round"></span>
                            </label>
                        </div>
                    </div>

                    <div className="settings-section">
                        <h3>Privacy</h3>

                        <div className="form-group">
                            <label>Who can see my watch history?</label>
                            <select
                                value={privacy?.watchHistory}
                                onChange={(e) => handlePrivacyChange('watchHistory', e.target.value)}
                            >
                                <option value="everyone">Everyone</option>
                                <option value="friends">Friends Only</option>
                                <option value="private">Only Me</option>
                            </select>
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button className="btn-primary full-width" onClick={onClose}>Done</button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default SettingsModal;
