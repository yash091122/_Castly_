import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFriends } from '../context/FriendsContext';
import { useWatchParty } from '../context/WatchPartyContext';
import { useSocketContext } from '../context/SocketContext';
import { db, realtime } from '../config/supabase';
import { formatRelativeTime } from '../utils/formatters';
import { Users, UserPlus, Search, Check, X, Video, User, MessageCircle, Clock, Loader, Activity, TrendingUp, Zap, Link as LinkIcon, UserMinus, MoreHorizontal, Film } from 'lucide-react';
import '../styles/main.css';
import '../styles/content-pages.css';

import { useNotifications } from '../context/NotificationContext';

function Friends() {
    const { user } = useAuth();
    const { friends, pendingRequests, sentRequests, acceptRequest, rejectRequest, removeFriend, getOnlineFriends, refreshFriends } = useFriends();
    const { addToast } = useNotifications();
    const { onlineUsers: socketOnlineUsers } = useSocketContext();
    const { inviteFriend, createRoom } = useWatchParty();
    const [activeTab, setActiveTab] = useState('friends');

    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTimeout, setSearchTimeout] = useState(null);

    // Other data
    const [activityFeed, setActivityFeed] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [removingFriend, setRemovingFriend] = useState(null);

    // Load initial feed and suggestions
    useEffect(() => {
        if (user) {
            loadActivityFeed();
            loadSuggestions();
        }
    }, [user]);

    // Format requests from context
    const requests = pendingRequests.map(req => ({
        id: req.id,
        requester: {
            id: req.user_id,
            username: req.name,
            display_name: req.name, // Display name might just be name in requests
            avatar_url: req.avatar
        },
        created_at: req.sentAt
    }));

    const loadActivityFeed = async () => {
        if (friends.length === 0) return;

        const activities = [];
        for (const friend of friends.slice(0, 10)) {
            const { data: history } = await db.getWatchHistory(friend.id);
            if (history && history.length > 0) {
                activities.push({
                    user: friend,
                    activity: history[0],
                    type: 'watching'
                });
            }
        }
        activities.sort((a, b) =>
            new Date(b.activity.last_watched) - new Date(a.activity.last_watched)
        );
        setActivityFeed(activities.slice(0, 10));
    };

    const loadSuggestions = async () => {
        if (friends.length === 0) return;

        const suggestionsList = [];
        for (const friend of friends.slice(0, 5)) {
            const { data: theirFriends } = await db.getFriends(friend.id);
            if (theirFriends) {
                theirFriends.forEach(tf => {
                    if (tf.friend.id !== user.id &&
                        !friends.some(f => f.id === tf.friend.id) &&
                        !suggestionsList.some(s => s.id === tf.friend.id)) {
                        suggestionsList.push({
                            ...tf.friend,
                            mutualFriend: friend
                        });
                    }
                });
            }
        }
        setSuggestions(suggestionsList.slice(0, 5));
    };



    const handleSearchChange = (e) => {
        const query = e.target.value;
        setSearchQuery(query);

        if (searchTimeout) clearTimeout(searchTimeout);

        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        const timeout = setTimeout(() => {
            performSearch(query);
        }, 500);
        setSearchTimeout(timeout);
    };

    const performSearch = async (query) => {
        setLoading(true);
        const { data, error } = await db.searchUsers(query);
        if (!error && data) {
            const filtered = data.filter(u => u.id !== user.id);
            setSearchResults(filtered);
        }
        setLoading(false);
    };

    const sendFriendRequest = async (friendId) => {
        const { error } = await db.sendFriendRequest(user.id, friendId);
        if (!error) {
            setSearchResults(prev => prev.filter(u => u.id !== friendId));
            setSuggestions(prev => prev.filter(u => u.id !== friendId));

            await db.createNotification(friendId, 'friend_request', {
                requester_id: user.id,
                from_user_name: user.user_metadata?.display_name || user.email?.split('@')[0],
                from_user_avatar: user.user_metadata?.avatar_url
            });
        }
    };

    const handleInviteToParty = async (friendId) => {
        const friend = friends.find(f => f.id === friendId);
        const room = await createRoom('default-movie'); // defaulting movie incase
        if (room && friend) {
            inviteFriend(friend, room);
            addToast({
                type: 'success',
                message: `Invite sent to ${friend.display_name || friend.username}!`
            });
        }
    };

    const confirmRemoveFriend = async () => {
        if (!removingFriend) return;
        await removeFriend(removingFriend.friendshipId);
        setRemovingFriend(null);
        loadSuggestions();
    };

    if (!user) {
        return (
            <div className="content-container">
                <div className="page-container">
                    <div className="empty-state">
                        <Users size={64} />
                        <h3>Please Log In</h3>
                        <p>You need to be logged in to view your friends.</p>
                        <button
                            onClick={() => window.location.href = '/login'}
                            className="btn-primary"
                        >
                            Go to Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="content-container">
            <div className="page-container">
                {/* Page Header */}
                <div className="page-header">
                    <h1>Friends</h1>
                    <p>Connect with other movie buffs around the world</p>
                </div>

                {/* Tabs */}
                <div className="page-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'friends' ? 'active' : ''}`}
                        onClick={() => setActiveTab('friends')}
                    >
                        <Users size={18} />
                        Friends
                        <span className="badge">{friends.length}</span>
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
                        onClick={() => setActiveTab('requests')}
                    >
                        <UserPlus size={18} />
                        Requests
                        {requests.length > 0 && <span className="badge active">{requests.length}</span>}
                    </button>
                </div>

                {/* Main Content Area */}
                <div className="friends-content-area">

                    {/* Friends Tab */}
                    {activeTab === 'friends' && (
                        <div>
                            {/* Search bar for filtering friends */}
                            <div className="friends-search-wrapper">
                                <Search className="friends-search-icon" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search users by username..."
                                    value={searchQuery}
                                    onChange={handleSearchChange}
                                    className="friends-search-input"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => {
                                            setSearchQuery('');
                                            setSearchResults([]);
                                        }}
                                        className="clear-search-btn"
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>

                            <div className="friends-grid">
                                {loading && searchQuery ? (
                                    <div className="loading-state">
                                        <Loader className="animate-spin" size={32} />
                                        <p>Searching...</p>
                                    </div>
                                ) : searchQuery ? (
                                    // Search Results View
                                    searchResults.length === 0 ? (
                                        <div className="empty-state glass-card search-empty">
                                            <div className="empty-state-icon-wrapper">
                                                <Search size={40} strokeWidth={1.5} />
                                            </div>
                                            <h3>No users found</h3>
                                            <p>We couldn't find any matches for <span className="query-highlight">"{searchQuery}"</span></p>
                                            <button onClick={() => {
                                                setSearchQuery('');
                                                setSearchResults([]);
                                            }} className="btn-clear-search-premium">
                                                Clear Search
                                            </button>
                                        </div>
                                    ) : (
                                        searchResults.map(result => {
                                            const isFriend = friends.some(f => f.id === result.id);
                                            const hasIncomingRequest = pendingRequests.some(r => r.user_id === result.id);
                                            const hasSentRequest = sentRequests.includes(result.id);

                                            // Find friend object if isFriend is true (for Remove action)
                                            const friendObj = isFriend ? friends.find(f => f.id === result.id) : null;

                                            return (
                                                <div key={result.id} className="friend-card-modern">
                                                    <div className="friend-image-container">
                                                        {result.avatar_url ? (
                                                            <img src={result.avatar_url} alt="" className="friend-image" />
                                                        ) : (
                                                            <div className="friend-image-placeholder">
                                                                {result.username?.charAt(0).toUpperCase()}
                                                            </div>
                                                        )}
                                                        <div className="friend-overlay" />
                                                    </div>

                                                    <div className="modern-card-content">
                                                        <div className="friend-info-modern">
                                                            <div className="name-row">
                                                                <h3>{result.display_name || result.username}</h3>
                                                            </div>
                                                            <p className="friend-bio-modern">@{result.username}</p>
                                                        </div>

                                                        <div className="modern-card-bottom">
                                                            {isFriend ? (
                                                                <button
                                                                    className="modern-action-btn danger"
                                                                    onClick={() => setRemovingFriend(friendObj)}
                                                                    style={{ flex: 1, background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}
                                                                >
                                                                    Remove
                                                                </button>
                                                            ) : hasIncomingRequest ? (
                                                                <button
                                                                    className="modern-action-btn primary"
                                                                    onClick={() => {
                                                                        const request = pendingRequests.find(r => r.user_id === result.id);
                                                                        if (request) acceptRequest(request.id);
                                                                    }}
                                                                >
                                                                    <Check size={16} /> Accept Request
                                                                </button>
                                                            ) : hasSentRequest ? (
                                                                <button className="modern-action-btn disabled" disabled>
                                                                    <Clock size={16} /> Request Sent
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    className="modern-action-btn primary"
                                                                    onClick={() => sendFriendRequest(result.id)}
                                                                >
                                                                    <UserPlus size={16} /> Add Friend
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )
                                ) : (
                                    // Existing Friends View (Default)
                                    loading ? (
                                        <div className="loading-state">
                                            <Loader className="animate-spin" size={32} />
                                            <p>Loading your circle...</p>
                                        </div>
                                    ) : friends.length === 0 ? (
                                        <div className="empty-state glass-card">
                                            <Users size={48} />
                                            <h3>No friends here yet</h3>
                                            <p>Search for users to add them to your movie circle!</p>
                                        </div>
                                    ) : (
                                        friends.map(friend => (
                                            <div key={friend.id} className="friend-card-modern">
                                                <div className="friend-image-container">
                                                    {friend.avatar ? (
                                                        <img
                                                            src={friend.avatar}
                                                            alt={friend.username}
                                                            className="friend-image"
                                                        />
                                                    ) : (
                                                        <div className="friend-image-placeholder">
                                                            {friend.username?.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                    {friend.online && (
                                                        <div className="online-status-badge" title="Online">
                                                            <div className="online-status-dot" />
                                                        </div>
                                                    )}
                                                    <div className="friend-overlay" />
                                                </div>

                                                <div className="modern-card-content">
                                                    <div className="friend-info-modern">
                                                        <div className="name-row">
                                                            <h3>{friend.display_name || friend.username}</h3>
                                                            {friend.online && <Check size={16} strokeWidth={4} className="verified-badge-modern" />}
                                                        </div>
                                                        <p className="friend-bio-modern">@{friend.username}</p>
                                                    </div>

                                                    <div className="modern-card-bottom">
                                                        <button
                                                            className="modern-action-btn danger"
                                                            onClick={() => setRemovingFriend(friend)}
                                                            style={{ flex: 1, background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )
                                )}
                            </div>
                        </div>
                    )}

                    {/* Requests Tab */}
                    {activeTab === 'requests' && (
                        <div className="requests-container">
                            {loading ? (
                                <div className="loading-state">
                                    <Loader className="animate-spin" size={32} />
                                </div>
                            ) : requests.length === 0 ? (
                                <div className="empty-state glass-card">
                                    <div className="empty-state-icon-wrapper">
                                        <UserPlus size={40} strokeWidth={1.5} />
                                    </div>
                                    <h3>No pending requests</h3>
                                    <p>You're all caught up! No one is waiting for approval right now.</p>
                                </div>
                            ) : (
                                <div className="friends-grid">
                                    {requests.map(req => (
                                        <div key={req.id} className="friend-card-modern">
                                            <div className="friend-image-container">
                                                {req.requester.avatar_url ? (
                                                    <img src={req.requester.avatar_url} alt="" className="friend-image" />
                                                ) : (
                                                    <div className="friend-image-placeholder">
                                                        {req.requester.username?.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                <div className="friend-overlay" />
                                            </div>

                                            <div className="modern-card-content">
                                                <div className="friend-info-modern">
                                                    <div className="name-row">
                                                        <h3>{req.requester.display_name || req.requester.username}</h3>
                                                    </div>
                                                    <p className="friend-bio-modern">@{req.requester.username}</p>
                                                    <div className="request-time" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <Clock size={12} /> {formatRelativeTime(req.created_at)}
                                                    </div>
                                                </div>

                                                <div className="modern-card-bottom" style={{ gap: '10px' }}>
                                                    <button
                                                        className="modern-action-btn primary"
                                                        onClick={() => acceptRequest(req.id)}
                                                        style={{ flex: 1 }}
                                                    >
                                                        Accept
                                                    </button>
                                                    <button
                                                        className="modern-action-btn danger"
                                                        onClick={() => rejectRequest(req.id)}
                                                        style={{ flex: 1, background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}
                                                    >
                                                        Decline
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}






                </div>

                {/* Modals */}
                {removingFriend && (
                    <div className="modal-overlay">
                        <div className="confirmation-modal glass-card">
                            <div className="modal-icon-wrapper">
                                <UserMinus size={32} className="modal-icon" />
                            </div>
                            <h3>Remove Friend?</h3>
                            <p>Are you sure you want to remove <strong>{removingFriend.display_name || removingFriend.username}</strong>?</p>
                            <div className="modal-actions">
                                <button onClick={() => setRemovingFriend(null)} className="btn-cancel-modal">Cancel</button>
                                <button onClick={confirmRemoveFriend} className="btn-remove-modal">Remove</button>
                            </div>
                        </div>
                    </div>
                )}

                <style>{`
                    /* Layout & Grid */
                    .friends-content-area {
                        max-width: 1200px;
                        margin: 0 auto;
                        padding-bottom: 4rem;
                    }

                    .friends-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                        gap: 2rem;
                    }

                    /* MODERN CARD DESIGN (Based on Reference) */
                    .friend-card-modern {
                        position: relative;
                        background: #111;
                        border-radius: 32px;
                        overflow: hidden;
                        height: 400px;
                        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
                        border: 6px solid #1a1a1a;
                        transition: transform 0.3s ease, box-shadow 0.3s ease;
                        display: flex;
                        flex-direction: column;
                    }

                    .friend-card-modern:hover {
                        transform: translateY(-8px);
                        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
                        border-color: #2a2a2a;
                    }

                    .friend-image-container {
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        z-index: 0;
                    }

                    .friend-image {
                        width: 100%;
                        height: 100%;
                        object-fit: cover;
                    }
                    
                    .friend-image-placeholder {
                        width: 100%;
                        height: 100%;
                        background: linear-gradient(135deg, #1f1f1f 0%, #0a0a0a 100%);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: rgba(255,255,255,0.1);
                        font-size: 5rem;
                        font-weight: 800;
                    }

                    .friend-overlay {
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: linear-gradient(
                            to bottom,
                            transparent 0%,
                            rgba(0,0,0,0.1) 40%,
                            rgba(0,0,0,0.8) 80%,
                            rgba(0,0,0,0.95) 100%
                        );
                    }

                    /* Online Status Badge (Green Dot on Avatar) */
                    .online-status-badge {
                        position: absolute;
                        top: 12px;
                        right: 12px;
                        width: 24px;
                        height: 24px;
                        background: #1a1a1a;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 10;
                        border: 3px solid #1a1a1a;
                        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
                    }

                    .online-status-dot {
                        width: 12px;
                        height: 12px;
                        background: #22c55e;
                        border-radius: 50%;
                        animation: pulse-dot 2s ease-in-out infinite;
                    }

                    @keyframes pulse-dot {
                        0%, 100% {
                            transform: scale(1);
                            box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
                        }
                        50% {
                            transform: scale(1.1);
                            box-shadow: 0 0 0 4px rgba(34, 197, 94, 0);
                        }
                    }
                    
                    .modern-card-top {
                        position: relative;
                        z-index: 10;
                        display: flex;
                        justify-content: flex-end;
                        padding: 1.5rem;
                    }
                    
                    .icon-btn-glass {
                        width: 36px;
                        height: 36px;
                        border-radius: 50%;
                        background: rgba(255, 255, 255, 0.1);
                        backdrop-filter: blur(4px);
                        border: 1px solid rgba(255, 255, 255, 0.2);
                        color: #fff;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        cursor: pointer;
                        opacity: 0;
                        transform: translateY(-10px);
                        transition: all 0.3s ease;
                    }
                    
                    .friend-card-modern:hover .icon-btn-glass {
                        opacity: 1;
                        transform: translateY(0);
                    }
                    
                    .icon-btn-glass:hover {
                        background: rgba(255, 255, 255, 0.2);
                        transform: scale(1.1);
                    }

                    .modern-card-content {
                        position: absolute;
                        bottom: 0;
                        left: 0;
                        width: 100%;
                        padding: 1.5rem;
                        z-index: 10;
                    }

                    .friend-info-modern {
                        margin-bottom: 1.5rem;
                    }
                    
                    .name-row {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        margin-bottom: 4px;
                    }

                    .name-row h3 {
                        font-size: 1.5rem;
                        font-weight: 700;
                        color: #fff;
                        letter-spacing: -0.5px;
                        text-shadow: 0 2px 4px rgba(0,0,0,0.3);
                        margin: 0;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    }

                    .verified-badge-modern {
                        color: #22c55e;
                        background: rgba(34, 197, 94, 0.2);
                        border-radius: 50%;
                        padding: 2px;
                        width: 20px;
                        height: 20px;
                        flex-shrink: 0;
                        box-shadow: 0 0 10px rgba(34, 197, 94, 0.5);
                        animation: pulse-online 2s ease-in-out infinite;
                    }

                    @keyframes pulse-online {
                        0%, 100% {
                            box-shadow: 0 0 10px rgba(34, 197, 94, 0.5);
                        }
                        50% {
                            box-shadow: 0 0 20px rgba(34, 197, 94, 0.8);
                        }
                    }

                    .friend-bio-modern {
                        color: rgba(255, 255, 255, 0.8);
                        font-size: 0.95rem;
                        line-height: 1.4;
                        font-weight: 400;
                        display: -webkit-box;
                        -webkit-line-clamp: 2;
                        -webkit-box-orient: vertical;
                        overflow: hidden;
                        text-shadow: 0 1px 2px rgba(0,0,0,0.5);
                    }

                    .modern-card-bottom {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                    }

                    .stats-row-modern {
                        display: flex;
                        gap: 1.5rem;
                    }

                    .stat-modern {
                        display: flex;
                        align-items: center;
                        gap: 6px;
                        color: rgba(255, 255, 255, 0.9);
                        font-size: 0.9rem;
                        font-weight: 500;
                    }

                    .modern-action-btn {
                         background: #fff;
                         color: #000;
                         border: none;
                         padding: 10px 20px;
                         border-radius: 30px;
                         font-size: 0.95rem;
                         font-weight: 600;
                         cursor: pointer;
                         transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                         box-shadow: 0 4px 10px rgba(0,0,0,0.2);
                         display: flex;
                         align-items: center;
                         justify-content: center;
                         gap: 8px;
                    }

                    .modern-action-btn:hover {
                        transform: scale(1.05);
                        box-shadow: 0 6px 15px rgba(255,255,255,0.3);
                    }
                    
                    .modern-action-btn.disabled {
                         opacity: 0.7;
                         cursor: default;
                    }
                    
                    .modern-action-btn.disabled:hover {
                         transform: none;
                         box-shadow: none;
                    }

                    /* Friends Search Bar (for filtering existing friends) */
                    .friends-search-wrapper {
                        position: relative;
                        margin-bottom: 2rem;
                        display: flex;
                        align-items: center;
                        background: rgba(255, 255, 255, 0.03);
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        border-radius: 50px;
                        padding: 0.5rem 1rem;
                        transition: all 0.3s ease;
                        max-width: 600px;
                        margin-left: auto;
                        margin-right: auto;
                    }

                    .friends-search-wrapper:focus-within {
                        background: rgba(255, 255, 255, 0.08);
                        border-color: rgba(255, 255, 255, 0.3);
                        box-shadow: 0 0 20px rgba(0,0,0,0.3);
                    }

                    .friends-search-input {
                        flex: 1;
                        padding: 0.8rem 1rem 0.8rem 2.5rem;
                        background: transparent;
                        border: none;
                        color: #fff;
                        font-size: 1rem;
                        outline: none;
                    }

                    .friends-search-input::placeholder {
                        color: rgba(255, 255, 255, 0.4);
                    }

                    .friends-search-icon {
                        position: absolute;
                        left: 1.5rem;
                        top: 50%;
                        transform: translateY(-50%);
                        color: rgba(255, 255, 255, 0.4);
                        pointer-events: none;
                    }

                    .clear-search-btn {
                        background: rgba(255, 255, 255, 0.1);
                        border: none;
                        border-radius: 50%;
                        width: 28px;
                        height: 28px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: rgba(255, 255, 255, 0.6);
                        cursor: pointer;
                        transition: all 0.2s;
                    }

                    .clear-search-btn:hover {
                        background: rgba(255, 255, 255, 0.2);
                        color: #fff;
                    }

                    /* Search Bar (for finding new users) */
                    .search-container {
                        max-width: 800px;
                        margin: 0 auto;
                        margin-top: -1rem;
                    }

                    .search-bar-wrapper {
                        position: relative;
                        margin-bottom: 2rem;
                        display: flex;
                        align-items: center;
                        background: rgba(255, 255, 255, 0.03);
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        border-radius: 50px;
                        padding: 0.5rem;
                        transition: all 0.3s ease;
                        z-index: 50;
                    }

                    .search-bar-wrapper:focus-within {
                        background: rgba(255, 255, 255, 0.08);
                        border-color: rgba(255, 255, 255, 0.3);
                        box-shadow: 0 0 20px rgba(0,0,0,0.3);
                    }

                    .search-input {
                        flex: 1;
                        padding: 1rem 1rem 1rem 3rem;
                        background: transparent;
                        border: none;
                        color: #fff;
                        font-size: 1rem;
                        outline: none;
                        height: 100%;
                    }

                    .search-input:focus {
                         background: transparent;
                         border: none;
                    }

                    .search-icon {
                        position: absolute;
                        left: 1.5rem;
                        top: 50%;
                        transform: translateY(-50%);
                        color: rgba(255, 255, 255, 0.4);
                        pointer-events: none;
                    }
                    
                    .search-btn {
                         padding: 0.8rem 2rem;
                         background: #fff;
                         color: #000;
                         border: none;
                         border-radius: 30px;
                         font-weight: 600;
                         cursor: pointer;
                         transition: all 0.2s;
                         margin-right: 0.2rem;
                    }
                    
                    .search-btn:hover {
                        transform: scale(1.05);
                        box-shadow: 0 0 15px rgba(255,255,255,0.3);
                    }

                    /* Activity Feed */
                    .activity-feed {
                         max-width: 800px;
                         margin: 0 auto;
                         display: flex;
                         flex-direction: column;
                         gap: 1rem;
                    }
                    
                    .activity-item {
                        display: flex;
                        align-items: center;
                        gap: 1rem;
                        padding: 1rem;
                        transition: all 0.2s;
                    }
                    
                    .activity-item:hover {
                         background: rgba(255,255,255,0.08);
                    }
                    
                    .activity-user-avatar img, .activity-user-avatar .avatar-placeholder {
                         width: 48px;
                         height: 48px;
                         border-radius: 50%;
                         object-fit: cover;
                    }
                    
                    .activity-user-avatar .avatar-placeholder {
                         background: rgba(255,255,255,0.1);
                         display: flex;
                         align-items: center;
                         justify-content: center;
                         color: #fff;
                    }

                    .activity-content {
                         flex: 1;
                    }
                    
                    .activity-text {
                         margin-bottom: 0.25rem;
                         color: rgba(255,255,255,0.8);
                    }
                    
                    .user-name {
                         font-weight: 600;
                         color: #fff;
                    }
                    
                    .movie-title {
                         font-weight: 600;
                         color: #a855f7;
                    }
                    
                    .activity-time {
                         font-size: 0.8rem;
                         color: rgba(255,255,255,0.5);
                         display: flex;
                         align-items: center;
                         gap: 0.25rem;
                    }

                    /* Simple Request Card */
                    .requests-container {
                         max-width: 800px;
                         margin: 0 auto;
                    }
                    
                    .requests-list {
                         display: flex;
                         flex-direction: column;
                         gap: 1rem;
                    }

                    .request-card {
                        display: flex;
                        align-items: center;
                        gap: 1rem;
                        padding: 1.5rem;
                        background: rgba(255,255,255,0.03);
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        border-radius: 16px;
                    }

                    .request-avatar img, .request-avatar .avatar-placeholder {
                        width: 60px;
                        height: 60px;
                        border-radius: 50%;
                        object-fit: cover;
                    }
                    
                    .request-avatar .avatar-placeholder {
                        background: rgba(255,255,255,0.1);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: #fff;
                    }

                    .request-info {
                         flex: 1;
                    }
                    
                    .request-info h3 {
                         font-size: 1.1rem;
                         margin-bottom: 0.25rem;
                         color: #fff;
                    }
                    
                    .request-time {
                         font-size: 0.85rem;
                         color: rgba(255,255,255,0.5);
                         display: flex;
                         align-items: center;
                         gap: 0.25rem;
                    }

                    .request-actions {
                        display: flex;
                        gap: 0.75rem;
                    }

                    .btn-accept, .btn-reject {
                        padding: 0.6rem 1.2rem;
                        border-radius: 10px;
                        font-weight: 500;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                        border: none;
                        transition: all 0.2s;
                    }

                    .btn-accept {
                        background: rgba(34, 197, 94, 0.2);
                        color: #4ade80;
                    }

                    .btn-accept:hover {
                        background: rgba(34, 197, 94, 0.3);
                    }

                    .btn-reject {
                        background: rgba(239, 68, 68, 0.2);
                        color: #f87171;
                    }

                    .btn-reject:hover {
                        background: rgba(239, 68, 68, 0.3);
                    }

                    /* Modal */
                    .modal-overlay {
                         position: fixed;
                         top: 0; left: 0; right: 0; bottom: 0;
                         background: rgba(0,0,0,0.8);
                         backdrop-filter: blur(5px);
                         display: flex;
                         align-items: center;
                         justify-content: center;
                         z-index: 1000;
                    }
                    
                    .confirmation-modal {
                         width: 100%;
                         max-width: 400px;
                         padding: 2rem;
                         text-align: center;
                         background: #1a1a1a;
                         border: 1px solid rgba(255,255,255,0.1);
                         border-radius: 16px;
                    }
                    
                    .modal-icon-wrapper {
                         width: 60px;
                         height: 60px;
                         background: rgba(239, 68, 68, 0.1);
                         border-radius: 50%;
                         display: flex;
                         align-items: center;
                         justify-content: center;
                         margin: 0 auto 1rem;
                         color: #ef4444;
                    }
                    
                    .modal-actions {
                         display: flex;
                         gap: 1rem;
                         margin-top: 2rem;
                    }
                    
                    .btn-cancel-modal, .btn-remove-modal {
                         flex: 1;
                         padding: 0.8rem;
                         border-radius: 10px;
                         border: none;
                         cursor: pointer;
                         font-weight: 500;
                    }
                    
                    .btn-cancel-modal {
                         background: rgba(255,255,255,0.1);
                         color: #fff;
                    }
                                        .btn-remove-modal {
                         background: #ef4444;
                         color: #fff;
                     }

                     .loading-state {
                         grid-column: 1 / -1;
                         display: flex;
                         flex-direction: column;
                         align-items: center;
                         justify-content: center;
                         padding: 5rem 2rem;
                         color: rgba(255,255,255,0.5);
                         width: 100%;
                         gap: 1rem;
                     }

                     /* Premium Empty States */
                    .empty-state {
                         grid-column: 1 / -1;
                         display: flex;
                         flex-direction: column;
                         align-items: center;
                         justify-content: center;
                         padding: 5rem 2rem;
                         text-align: center;
                         border-radius: 32px;
                         background: rgba(255, 255, 255, 0.02);
                         border: 1px solid rgba(255, 255, 255, 0.05);
                         animation: emptyStateAppear 0.6s cubic-bezier(0.16, 1, 0.3, 1);
                         width: 100%;
                         max-width: 600px;
                         margin: 2rem auto;
                    }

                    @keyframes emptyStateAppear {
                         from {
                             opacity: 0;
                             transform: translateY(20px);
                         }
                         to {
                             opacity: 1;
                             transform: translateY(0);
                         }
                    }

                    .empty-state-icon-wrapper {
                         width: 80px;
                         height: 80px;
                         background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.02) 100%);
                         border-radius: 24px;
                         display: flex;
                         align-items: center;
                         justify-content: center;
                         margin-bottom: 2rem;
                         color: rgba(255, 255, 255, 0.3);
                         border: 1px solid rgba(255, 255, 255, 0.1);
                         position: relative;
                    }

                    .empty-state-icon-wrapper::after {
                         content: '';
                         position: absolute;
                         inset: -10px;
                         background: radial-gradient(circle, rgba(255, 255, 255, 0.05) 0%, transparent 70%);
                         z-index: -1;
                    }

                    .empty-state h3 {
                         font-size: 1.75rem;
                         font-weight: 700;
                         color: #fff;
                         margin-bottom: 0.75rem;
                         letter-spacing: -0.5px;
                    }

                    .empty-state p {
                         font-size: 1.1rem;
                         color: rgba(255, 255, 255, 0.5);
                         max-width: 400px;
                         margin-bottom: 2rem;
                         line-height: 1.6;
                    }

                    .query-highlight {
                         color: #fff;
                         font-weight: 600;
                         background: rgba(255, 255, 255, 0.08);
                         padding: 2px 8px;
                         border-radius: 6px;
                         margin-left: 4px;
                    }

                    .btn-clear-search-premium {
                         background: #fff;
                         color: #000;
                         border: none;
                         padding: 12px 32px;
                         border-radius: 50px;
                         font-size: 1rem;
                         font-weight: 600;
                         cursor: pointer;
                         transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                         box-shadow: 0 10px 20px rgba(0,0,0,0.2);
                    }

                    .btn-clear-search-premium:hover {
                         transform: scale(1.05) translateY(-2px);
                         box-shadow: 0 15px 30px rgba(255, 255, 255, 0.2);
                    }

                    .btn-clear-search-premium:active {
                         transform: scale(0.98);
                    }
                `}</style>
            </div>
        </div>
    );
}

export default Friends;
