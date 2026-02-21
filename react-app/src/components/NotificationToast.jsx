import { useEffect, useState } from 'react';
import { X, Users, UserPlus, Bell, Play, Clock, Check, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import '../styles/notification-toast.css';

export default function NotificationToast({ notification, onClose, onAcceptFriendRequest }) {
  const [isExiting, setIsExiting] = useState(false);
  const totalTime = notification.duration || (notification.type === 'info' || notification.type === 'success' || notification.type === 'chat_message' ? 5000 : 10000);
  const [progress, setProgress] = useState(100);
  const [isAccepting, setIsAccepting] = useState(false);

  useEffect(() => {
    // Smooth progress bar starts at 100 and goes to 0
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / totalTime) * 100);
      setProgress(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        handleClose();
      }
    }, 10); // Update every 10ms for smooth movement

    return () => clearInterval(interval);
  }, [notification.id]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => onClose(notification.id), 300);
  };

  const handleAccept = async () => {
    if (notification.type === 'party_invite') {
      window.location.href = `/watch-party-room?room=${notification.room_id}&movie=${notification.movie_id || 'big-buck-bunny'}&host=false`;
    } else if (notification.type === 'friend_request') {
      setIsAccepting(true);
      if (onAcceptFriendRequest) {
        await onAcceptFriendRequest(notification.from_user_id);
      }
    }
    handleClose();
  };

  const handleDecline = () => {
    handleClose();
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'party_invite':
        return <Play size={20} />;
      case 'friend_request':
        return <UserPlus size={20} />;
      case 'info':
      case 'success':
        return <CheckCircle size={20} />;
      case 'error':
        return <Bell size={20} style={{ color: '#ef4444' }} />;
      default:
        return <Bell size={20} />;
    }
  };

  const getTitle = () => {
    switch (notification.type) {
      case 'party_invite':
        return 'Watch Party Invite';
      case 'friend_request':
        return 'Friend Request';
      case 'success':
        return 'Success';
      case 'error':
        return 'Failed';
      case 'info':
        if (notification.message?.toLowerCase().includes('accepted')) {
          return 'Friendship';
        }
        return 'Update';
      default:
        return 'Notification';
    }
  };

  const getMessage = () => {
    if (notification.message) return notification.message;

    switch (notification.type) {
      case 'party_invite':
        return (
          <>
            <span className="toast-highlight">{notification.from_user_name || 'Someone'}</span> invited you to watch{' '}
            <span className="toast-highlight">{notification.movie_title || 'Watch Party'}</span>
          </>
        );
      case 'friend_request':
        return (
          <>
            <span className="toast-highlight">{notification.from_user_name}</span> wants to be your friend
          </>
        );
      default:
        return 'You have a new notification';
    }
  };

  if (notification.type === 'chat_message') {
    return (
      <div className={`notification-toast chat-toast ${isExiting ? 'exiting' : ''}`}>
        <div className="chat-toast-content">
          <span className="chat-toast-username">{notification.from_user_name}:</span>
          <span className="chat-toast-text">{notification.message}</span>
        </div>
        <div className="toast-progress">
          <div
            className="toast-progress-bar"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`notification-toast ${isExiting ? 'exiting' : ''}`}>
      {/* Close button */}
      <button onClick={handleDecline} className="toast-close" aria-label="Close">
        <X size={16} />
      </button>

      {/* Header with icon and title */}
      <div className="toast-header">
        <div className="toast-icon">{getIcon()}</div>
        <div className="toast-title-section">
          <h4 className="toast-title">{getTitle()}</h4>
        </div>
      </div>

      {/* Avatar and message */}
      <div className="toast-body">
        {notification.from_user_avatar && (
          <img
            src={notification.from_user_avatar}
            alt={notification.from_user_name}
            className="toast-avatar"
          />
        )}
        {!notification.from_user_avatar && notification.from_user_name && (
          <div className="toast-avatar-placeholder">
            {notification.from_user_name[0]?.toUpperCase()}
          </div>
        )}
        <p className="toast-message">{getMessage()}</p>
      </div>

      {/* Action buttons */}
      {(notification.type === 'party_invite' || notification.type === 'friend_request') && (
        <div className="toast-actions">
          <button
            onClick={handleAccept}
            className="toast-btn toast-btn-primary"
            disabled={isAccepting}
          >
            {isAccepting ? (
              <>
                <Check size={18} /> ACCEPTED
              </>
            ) : (
              <>
                {notification.type === 'party_invite' ? (
                  <><Play size={18} fill="currentColor" /> JOIN PARTY</>
                ) : (
                  <><UserPlus size={18} /> ACCEPT</>
                )}
              </>
            )}
          </button>
          <button onClick={handleDecline} className="toast-btn toast-btn-secondary">
            <X size={18} /> DECLINE
          </button>
        </div>
      )}

      {/* Progress bar */}
      <div className="toast-progress">
        <div
          className="toast-progress-bar"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
