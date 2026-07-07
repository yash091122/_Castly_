import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { X, Users, Check, Clock, Search, UserPlus } from 'lucide-react';
import { useFriends } from '../context/FriendsContext';
import { useAuth } from '../context/AuthContext';
import { useSocketContext } from '../context/SocketContext';

function WatchPartyInviteModal({ movie, isOpen, onClose }) {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { friends, getOnlineFriends } = useFriends();
    const { socket, onlineUsers } = useSocketContext();

    const [selectedFriends, setSelectedFriends] = useState([]);
    const [inviteStatus, setInviteStatus] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    const [isStarting, setIsStarting] = useState(false);
    const [roomId, setRoomId] = useState(null);

    useEffect(() => {
        if (isOpen) {
            const code = Math.random().toString(36).substring(2, 8).toUpperCase();
            setRoomId(code);
            setSelectedFriends([]);
            setInviteStatus({});
        }
    }, [isOpen]);

    // Listen for invite responses
    useEffect(() => {
        if (!socket || !roomId) return;

        const handleInviteResponse = ({ odId, status, userName }) => {
            setInviteStatus(prev => ({ ...prev, [odId]: status }));
        };

        socket.on('party:invite_response', handleInviteResponse);
        return () => socket.off('party:invite_response', handleInviteResponse);
    }, [socket, roomId]);

    const toggleFriend = (friendId) => {
        setSelectedFriends(prev =>
            prev.includes(friendId)
                ? prev.filter(id => id !== friendId)
                : [...prev, friendId]
        );
    };

    const sendInvites = () => {
        if (!socket || !user || selectedFriends.length === 0) return;

        selectedFriends.forEach(friendId => {
            socket.emit('party:invite', {
                fromUserId: user.id,
                toUserId: friendId,
                roomId,
                movieId: movie.id,
                movieTitle: movie.title,
                userData: {
                    name: user.user_metadata?.display_name || user.email,
                    avatar: user.user_metadata?.avatar_url
                }
            });
            setInviteStatus(prev => ({ ...prev, [friendId]: 'pending' }));
        });
    };

    const startParty = () => {
        setIsStarting(true);
        sendInvites();
        setTimeout(() => {
            // Check if this is a TV show
            if (movie.type === 'tv') {
                const season = movie.selectedSeason || 1;
                const episode = movie.selectedEpisode?.episodeNumber || 1;
                navigate(`/watch-party-room?room=${roomId}&movie=${movie.id}&season=${season}&episode=${episode}&host=true`);
            } else {
                navigate(`/watch-party-room?room=${roomId}&movie=${movie.id}&host=true`);
            }
        }, 500);
    };

    const isFriendOnline = (friendId) => {
        return onlineUsers.some(u => u.userId === friendId);
    };

    const filteredFriends = friends.filter(f =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const onlineFriends = filteredFriends.filter(f => isFriendOnline(f.id));
    const offlineFriends = filteredFriends.filter(f => !isFriendOnline(f.id));

    if (!isOpen) return null;

    return createPortal(
        <div className="wpi-overlay" onClick={onClose}>
            <div className="wpi-modal" onClick={e => e.stopPropagation()}>
                <button className="wpi-close" onClick={onClose}>
                    <X size={24} />
                </button>

                <div className="wpi-header">
                    <div className="wpi-movie-info">
                        <img src={movie.posterUrl} alt={movie.title} className="wpi-poster" />
                        <div>
                            <h2>Watch Party</h2>
                            <h3>{movie.title}</h3>
                            {movie.type === 'tv' && movie.selectedEpisode && (
                                <p className="wpi-episode-info">
                                    S{movie.selectedSeason || 1} E{movie.selectedEpisode.episodeNumber}: {movie.selectedEpisode.title}
                                </p>
                            )}
                            <p className="wpi-room-code">Room: {roomId}</p>
                        </div>
                    </div>
                </div>

                <div className="wpi-content">
                    <div className="wpi-search">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Search friends..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="wpi-friends-list">
                        {onlineFriends.length > 0 && (
                            <>
                                <div className="wpi-section-label">
                                    <span className="online-dot"></span> Online ({onlineFriends.length})
                                </div>
                                {onlineFriends.map(friend => (
                                    <FriendItem
                                        key={friend.id}
                                        friend={friend}
                                        isSelected={selectedFriends.includes(friend.id)}
                                        status={inviteStatus[friend.id]}
                                        onToggle={() => toggleFriend(friend.id)}
                                        isOnline={true}
                                    />
                                ))}
                            </>
                        )}

                        {offlineFriends.length > 0 && (
                            <>
                                <div className="wpi-section-label">Offline ({offlineFriends.length})</div>
                                {offlineFriends.map(friend => (
                                    <FriendItem
                                        key={friend.id}
                                        friend={friend}
                                        isSelected={selectedFriends.includes(friend.id)}
                                        status={inviteStatus[friend.id]}
                                        onToggle={() => toggleFriend(friend.id)}
                                        isOnline={false}
                                    />
                                ))}
                            </>
                        )}

                        {friends.length === 0 && (
                            <div className="wpi-empty">
                                <UserPlus size={40} />
                                <p>No friends yet</p>
                                <span>Add friends to invite them to watch parties</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="wpi-footer">
                    <div className="wpi-selected-count">
                        {selectedFriends.length} friend{selectedFriends.length !== 1 ? 's' : ''} selected
                    </div>
                    <div className="wpi-actions">
                        <button className="wpi-btn-secondary" onClick={onClose}>Cancel</button>
                        <button
                            className="wpi-btn-primary"
                            onClick={startParty}
                            disabled={isStarting}
                        >
                            {isStarting ? 'Starting...' : (
                                <>
                                    <Users size={18} />
                                    {selectedFriends.length > 0 ? 'Start & Invite' : 'Start Party'}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                .wpi-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.85);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    backdrop-filter: blur(10px);
                }

                .wpi-modal {
                    background: #111;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 20px;
                    width: 90%;
                    max-width: 500px;
                    max-height: 80vh;
                    display: flex;
                    flex-direction: column;
                    position: relative;
                    overflow: hidden;
                }

                .wpi-close {
                    position: absolute;
                    top: 15px;
                    right: 15px;
                    background: rgba(255, 255, 255, 0.1);
                    border: none;
                    color: #fff;
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                    z-index: 10;
                }

                .wpi-close:hover {
                    background: rgba(220, 38, 38, 0.3);
                    color: #dc2626;
                }

                .wpi-header {
                    padding: 25px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                }

                .wpi-movie-info {
                    display: flex;
                    gap: 15px;
                    align-items: center;
                }

                .wpi-poster {
                    width: 60px;
                    height: 90px;
                    object-fit: cover;
                    border-radius: 8px;
                }

                .wpi-movie-info h2 {
                    font-size: 0.9rem;
                    color: rgba(255, 255, 255, 0.6);
                    margin-bottom: 5px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }

                .wpi-movie-info h3 {
                    font-size: 1.3rem;
                    color: #fff;
                    margin-bottom: 5px;
                }

                .wpi-room-code {
                    font-size: 0.9rem;
                    color: rgba(255, 255, 255, 0.5);
                    font-family: monospace;
                }

                .wpi-episode-info {
                    font-size: 0.85rem;
                    color: rgba(255, 255, 255, 0.7);
                    margin-bottom: 5px;
                }

                .wpi-content {
                    flex: 1;
                    overflow-y: auto;
                    padding: 20px;
                }

                .wpi-search {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    padding: 12px 15px;
                    margin-bottom: 20px;
                }

                .wpi-search svg {
                    color: rgba(255, 255, 255, 0.4);
                }

                .wpi-search input {
                    flex: 1;
                    background: none;
                    border: none;
                    color: #fff;
                    font-size: 1rem;
                    outline: none;
                }

                .wpi-search input::placeholder {
                    color: rgba(255, 255, 255, 0.3);
                }

                .wpi-section-label {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 0.85rem;
                    color: rgba(255, 255, 255, 0.5);
                    margin-bottom: 10px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .online-dot {
                    width: 8px;
                    height: 8px;
                    background: #22c55e;
                    border-radius: 50%;
                }

                .wpi-friends-list {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .wpi-empty {
                    text-align: center;
                    padding: 40px 20px;
                    color: rgba(255, 255, 255, 0.5);
                }

                .wpi-empty svg {
                    margin-bottom: 15px;
                    opacity: 0.5;
                }

                .wpi-empty p {
                    color: #fff;
                    margin-bottom: 5px;
                }

                .wpi-footer {
                    padding: 20px 25px;
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: rgba(0, 0, 0, 0.3);
                }

                .wpi-selected-count {
                    font-size: 0.9rem;
                    color: rgba(255, 255, 255, 0.6);
                }

                .wpi-actions {
                    display: flex;
                    gap: 10px;
                }

                .wpi-btn-primary, .wpi-btn-secondary {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 12px 24px;
                    border-radius: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    border: none;
                }

                .wpi-btn-primary {
                    background: #fff;
                    color: #000;
                }

                .wpi-btn-primary:hover:not(:disabled) {
                    background: rgba(255, 255, 255, 0.9);
                    transform: scale(1.02);
                }

                .wpi-btn-primary:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .wpi-btn-secondary {
                    background: transparent;
                    color: #dc2626;
                    border: 1px solid rgba(220, 38, 38, 0.5);
                }

                .wpi-btn-secondary:hover {
                    background: rgba(220, 38, 38, 0.1);
                }
            `}</style>
        </div>,
        document.body
    );
}

// Friend Item Component
function FriendItem({ friend, isSelected, status, onToggle, isOnline }) {
    return (
        <div
            className={`wpi-friend-item ${isSelected ? 'selected' : ''} ${!isOnline ? 'offline' : ''}`}
            onClick={onToggle}
        >
            <div className="wpi-friend-avatar">
                <img src={friend.avatar} alt={friend.name} />
                {isOnline && <span className="wpi-online-indicator"></span>}
            </div>
            <div className="wpi-friend-info">
                <span className="wpi-friend-name">{friend.name}</span>
                <span className="wpi-friend-status">
                    {status === 'pending' && <><Clock size={12} /> Invite sent</>}
                    {status === 'accepted' && <><Check size={12} /> Joined</>}
                    {status === 'declined' && 'Declined'}
                    {!status && (isOnline ? 'Online' : 'Offline')}
                </span>
            </div>
            <div className="wpi-friend-checkbox">
                {isSelected ? <Check size={18} /> : <div className="wpi-checkbox-empty"></div>}
            </div>

            <style>{`
                .wpi-friend-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 15px;
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .wpi-friend-item:hover {
                    background: rgba(255, 255, 255, 0.08);
                    border-color: rgba(255, 255, 255, 0.15);
                }

                .wpi-friend-item.selected {
                    background: rgba(255, 255, 255, 0.1);
                    border-color: rgba(255, 255, 255, 0.3);
                }

                .wpi-friend-item.offline {
                    opacity: 0.6;
                }

                .wpi-friend-avatar {
                    position: relative;
                    width: 45px;
                    height: 45px;
                }

                .wpi-friend-avatar img {
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    object-fit: cover;
                }

                .wpi-online-indicator {
                    position: absolute;
                    bottom: 2px;
                    right: 2px;
                    width: 12px;
                    height: 12px;
                    background: #22c55e;
                    border: 2px solid #111;
                    border-radius: 50%;
                }

                .wpi-friend-info {
                    flex: 1;
                }

                .wpi-friend-name {
                    display: block;
                    color: #fff;
                    font-weight: 500;
                    margin-bottom: 2px;
                }

                .wpi-friend-status {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    font-size: 0.8rem;
                    color: rgba(255, 255, 255, 0.5);
                }

                .wpi-friend-checkbox {
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #fff;
                }

                .wpi-checkbox-empty {
                    width: 20px;
                    height: 20px;
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    border-radius: 6px;
                }

                .wpi-friend-item.selected .wpi-checkbox-empty {
                    background: #fff;
                    border-color: #fff;
                }

                .wpi-friend-item.selected .wpi-friend-checkbox {
                    background: #fff;
                    border-radius: 6px;
                    color: #000;
                }
            `}</style>
        </div>
    );
}

export default WatchPartyInviteModal;
