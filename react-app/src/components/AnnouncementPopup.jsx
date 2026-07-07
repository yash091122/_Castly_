import { useAnnouncements } from '../context/AnnouncementContext';
import { X, Bell, ChevronRight } from 'lucide-react';
import './AnnouncementPopup.css';

const AnnouncementPopup = () => {
    const { currentAnnouncement, showPopup, dismissAnnouncement, unreadCount } = useAnnouncements();

    if (!showPopup || !currentAnnouncement) {
        return null;
    }

    const handleDismiss = () => {
        dismissAnnouncement(currentAnnouncement.id);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="announcement-overlay" onClick={handleDismiss}>
            <div className="announcement-popup" onClick={e => e.stopPropagation()}>
                <button className="announcement-close" onClick={handleDismiss}>
                    <X size={20} />
                </button>

                <div className="announcement-icon">
                    <Bell size={28} />
                </div>

                <div className="announcement-content">
                    <span className="announcement-badge">
                        {unreadCount > 1 ? `${unreadCount} New` : 'New'}
                    </span>
                    <h3 className="announcement-title">{currentAnnouncement.title}</h3>
                    <p className="announcement-message">{currentAnnouncement.message}</p>
                    <span className="announcement-time">
                        {formatDate(currentAnnouncement.created_at)}
                    </span>
                </div>

                <div className="announcement-actions">
                    <button className="announcement-btn announcement-btn-dismiss" onClick={handleDismiss}>
                        Dismiss
                    </button>
                    {unreadCount > 1 && (
                        <button className="announcement-btn announcement-btn-next" onClick={handleDismiss}>
                            Next <ChevronRight size={16} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AnnouncementPopup;
