import { useEffect, useState, useCallback } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { formatRelativeTime } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { realtime, supabase } from '../config/supabase';
import {
    Bell,
    UserPlus,
    UserCheck,
    Video,
    Info,
    X,
    Check,
    CheckCheck,
    Clock,
    Filter,
    Sparkles,
    Play,
    CheckCircle
} from 'lucide-react';
import Loader from '../components/Loader';
import '../styles/notifications.css';

function Notifications() {
    const { user } = useAuth();
    const {
        notifications,
        markAsRead,
        markAllAsRead,
        removeNotification,
        refreshNotifications
    } = useNotifications();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('all');
    const [exitingIds, setExitingIds] = useState(new Set());
    const [isLoading, setIsLoading] = useState(true);

    // Initial load - sync once on mount
    useEffect(() => {
        if (!user) {
            setIsLoading(false);
            return;
        }

        const loadData = async () => {
            // Only show loading spinner if we have NO data yet
            if (notifications.length === 0) {
                setIsLoading(true);
            }

            try {
                await refreshNotifications();
            } catch (error) {
                console.error('Failed to load notifications:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [user, refreshNotifications]); // Removed notifications dependency to avoid loops

    // Check room statuses for active invites — queries the socket server directly
    const [roomStatuses, setRoomStatuses] = useState({}); // roomId -> { alive, movieId, contentType, season, episode }

    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

    useEffect(() => {
        const checkRoomStatuses = async () => {
            const partyNotifs = notifications.filter(n => n.type === 'party_invite');
            if (partyNotifs.length === 0) return;

            const uniqueRoomIds = [...new Set(
                partyNotifs
                    .map(n => n.room_id || n.data?.room_id)
                    .filter(Boolean)
            )];

            const results = await Promise.allSettled(
                uniqueRoomIds.map(async (roomId) => {
                    const res = await fetch(`${SOCKET_URL}/room/${roomId}/alive`, {
                        signal: AbortSignal.timeout(4000)
                    });
                    const json = await res.json();
                    return { roomId, ...json };
                })
            );

            const statuses = {};
            results.forEach(r => {
                if (r.status === 'fulfilled') {
                    statuses[r.value.roomId] = r.value;
                }
            });
            setRoomStatuses(statuses);
        };

        if (notifications.length > 0) {
            checkRoomStatuses();
        }
    }, [notifications, SOCKET_URL]);

    // Filter notifications based on active tab
    const filteredNotifications = notifications.filter(notification => {
        switch (activeTab) {
            case 'unread':
                return !notification.read;
            case 'friends':
                return notification.type === 'friend_request' || notification.type === 'friend_accepted';
            case 'party':
                return notification.type === 'party_invite';
            default:
                return true;
        }
    });

    // Count unread notifications
    const unreadCount = notifications.filter(n => !n.read).length;
    const friendRequestCount = notifications.filter(n =>
        (n.type === 'friend_request' || n.type === 'friend_accepted') && !n.read
    ).length;
    const partyInviteCount = notifications.filter(n =>
        n.type === 'party_invite' && !n.read
    ).length;

    const buildPartyUrl = (notification) => {
        const data = notification.data || {};
        const roomId = notification.room_id || data.room_id;
        const movieId = notification.movie_id || data.movie_id || 'big-buck-bunny';
        const contentType = notification.content_type || data.content_type || 'movie';
        const season = notification.season || data.season;
        const episode = notification.episode || data.episode;

        let url = `/watch-party-room?room=${roomId}&movie=${movieId}&type=${contentType}`;
        if (contentType === 'tv' && season) url += `&season=${season}`;
        if (contentType === 'tv' && episode) url += `&episode=${episode}`;
        return url;
    };

    const handleNotificationClick = (notification) => {
        markAsRead(notification.id);

        if (notification.type === 'friend_request') {
            navigate('/friends');
        } else if (notification.type === 'party_invite') {
            const data = notification.data || {};
            const roomId = notification.room_id || data.room_id;
            if (roomId) {
                navigate(buildPartyUrl(notification));
            } else {
                navigate('/watch-party-vision');
            }
        } else if (notification.type === 'friend_accepted') {
            navigate('/friends');
        }
    };

    const handleDelete = useCallback((e, notificationId) => {
        e.stopPropagation();
        // Add exiting animation
        setExitingIds(prev => new Set([...prev, notificationId]));
        // Remove after animation
        setTimeout(() => {
            removeNotification(notificationId);
            setExitingIds(prev => {
                const next = new Set(prev);
                next.delete(notificationId);
                return next;
            });
        }, 300);
    }, [removeNotification]);

    const getIcon = (type) => {
        switch (type) {
            case 'friend_request':
                return <UserPlus size={22} />;
            case 'friend_accepted':
                return <UserCheck size={22} />;
            case 'party_invite':
                return <Video size={22} />;
            case 'system':
            case 'info':
                return <Info size={22} />;
            default:
                return <Bell size={22} />;
        }
    };

    const getNotificationMessage = (notification) => {
        const message = notification.message || notification.data?.message;
        const data = notification.data || {};

        // Helper to get sender name from various possible locations
        const getSenderName = () => {
            const name = notification.from_user_name ||
                data.from_user_name ||
                data.name ||
                (data.userData && data.userData.name); // Check nested userData from socket

            return (name && name !== 'Someone') ? name : 'A friend';
        };

        if (!message) {
            // Generate message based on type
            const senderName = getSenderName();

            switch (notification.type) {
                case 'friend_request':
                    return <><span className="highlight">{senderName}</span> sent you a friend request</>;
                case 'friend_accepted':
                    return <><span className="highlight">{senderName}</span> accepted your friend request</>;
                case 'party_invite':
                    const movieTitle = notification.movie_title || data.movie_title || 'a movie';
                    return <><span className="highlight">{senderName}</span> invited you to watch <span className="highlight">{movieTitle}</span></>;
                default:
                    return 'You have a new notification';
            }
        }
        return message;
    };

    // Login prompt for unauthenticated users
    if (!user) {
        return (
            <div className="notifications-page">
                <div className="notifications-login-prompt">
                    <div className="login-prompt-icon">
                        <Bell size={40} />
                    </div>
                    <h3>Please login to view notifications</h3>
                    <button onClick={() => navigate('/login')} className="login-btn">
                        Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="notifications-page">
            {/* Premium Header */}
            <header className="notifications-header">
                <div className="notifications-header-content">
                    <div className="notifications-title-section">
                        <div className="notifications-icon-wrapper">
                            <Bell size={26} />
                        </div>
                        <div>
                            <h1 className="notifications-title">Notifications</h1>
                            <p className="notifications-subtitle">
                                {unreadCount > 0
                                    ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                                    : 'You\'re all caught up!'
                                }
                            </p>
                        </div>
                    </div>

                    {notifications.length > 0 && (
                        <div className="notifications-header-actions">
                            <button
                                className="header-action-btn primary"
                                onClick={markAllAsRead}
                                disabled={unreadCount === 0}
                            >
                                <CheckCheck size={16} />
                                Mark all read
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {/* Tab Navigation */}
            <nav className="notifications-tabs">
                <button
                    className={`notification-tab ${activeTab === 'all' ? 'active' : ''}`}
                    onClick={() => setActiveTab('all')}
                >
                    <Sparkles size={16} />
                    All
                    <span className="tab-count">{notifications.length}</span>
                </button>
                <button
                    className={`notification-tab ${activeTab === 'unread' ? 'active' : ''}`}
                    onClick={() => setActiveTab('unread')}
                >
                    <Bell size={16} />
                    Unread
                    <span className={`tab-count ${unreadCount > 0 ? 'has-unread' : ''}`}>
                        {unreadCount}
                    </span>
                </button>
                <button
                    className={`notification-tab ${activeTab === 'friends' ? 'active' : ''}`}
                    onClick={() => setActiveTab('friends')}
                >
                    <UserPlus size={16} />
                    Friends
                    <span className={`tab-count ${friendRequestCount > 0 ? 'has-unread' : ''}`}>
                        {friendRequestCount}
                    </span>
                </button>
                <button
                    className={`notification-tab ${activeTab === 'party' ? 'active' : ''}`}
                    onClick={() => setActiveTab('party')}
                >
                    <Video size={16} />
                    Watch Party
                    <span className={`tab-count ${partyInviteCount > 0 ? 'has-unread' : ''}`}>
                        {partyInviteCount}
                    </span>
                </button>
            </nav>

            {/* Content Glass Card Container */}
            <div className="notifications-content">
                {isLoading ? (
                    <Loader fullScreen={false} />
                ) : filteredNotifications.length === 0 ? (
                    <div className="empty-notifications">
                        <div className="empty-icon-wrapper">
                            {activeTab === 'unread' ? <CheckCircle size={40} /> : <Bell size={40} />}
                        </div>
                        <h3>{activeTab === 'unread' ? 'No unread notifications' : 'No notifications yet'}</h3>
                        <p>
                            {activeTab === 'unread'
                                ? 'You\'re up to date! Check "All" to see past notifications.'
                                : 'When you get friend requests or party invites, they\'ll appear here.'
                            }
                        </p>
                    </div>
                ) : (
                    <div className="notifications-list">
                        {filteredNotifications.map(notification => {
                            const data = notification.data || {};
                            const roomId = notification.room_id || data.room_id;
                            const roomInfo = roomStatuses[roomId]; // { alive, movieId, ... } or undefined
                            const isRoomAlive = roomInfo?.alive === true;

                            return (
                                <div
                                    key={notification.id}
                                    className={`notification-card ${!notification.read ? 'unread' : ''} ${exitingIds.has(notification.id) ? 'exiting' : ''}`}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    {/* Icon */}
                                    <div className={`notification-card-icon ${notification.type}`}>
                                        {getIcon(notification.type)}
                                    </div>

                                    {/* Content */}
                                    <div className="notification-card-content">
                                        <p className="notification-card-message">
                                            {getNotificationMessage(notification)}
                                        </p>
                                        <span className="notification-card-time">
                                            <Clock size={12} />
                                            {formatRelativeTime(notification.created_at || notification.createdAt)}
                                        </span>

                                        {/* Action Buttons for specific types */}
                                        {notification.type === 'friend_request' && (
                                            <div className="notification-card-actions">
                                                <button
                                                    className="notification-action-btn accept"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate('/friends');
                                                    }}
                                                >
                                                    <Check size={14} />
                                                    View Request
                                                </button>
                                            </div>
                                        )}

                                        {notification.type === 'party_invite' && roomId && isRoomAlive && (
                                            <div className="notification-card-actions">
                                                <button
                                                    className="notification-action-btn join"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        markAsRead(notification.id);
                                                        navigate(buildPartyUrl(notification));
                                                    }}
                                                >
                                                    <Play size={14} />
                                                    Join Party
                                                </button>
                                            </div>
                                        )}

                                        {notification.type === 'party_invite' && roomId && roomInfo && !isRoomAlive && (
                                            <span className="room-status-ended">
                                                Room Ended
                                                <style>{`
                                                    .room-status-ended {
                                                        display: inline-block;
                                                        font-size: 0.75rem;
                                                        color: rgba(255, 255, 255, 0.4);
                                                        margin-top: 8px;
                                                        background: rgba(255, 255, 255, 0.05);
                                                        padding: 2px 8px;
                                                        border-radius: 4px;
                                                    }
                                                `}</style>
                                            </span>
                                        )}

                                        {notification.type === 'party_invite' && roomId && !roomInfo && (
                                            <span className="room-status-ended" style={{ color: 'rgba(255,255,255,0.25)' }}>
                                                Checking room…
                                            </span>
                                        )}
                                    </div>

                                    {/* Delete Button */}
                                    <button
                                        className="notification-delete-btn"
                                        onClick={(e) => handleDelete(e, notification.id)}
                                        title="Remove notification"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Notifications;