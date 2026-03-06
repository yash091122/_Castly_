import { useState } from 'react';
import { useFriends } from '../context/FriendsContext';
import { useWatchParty } from '../context/WatchPartyContext';
import { useNotifications } from '../context/NotificationContext';

function PartyInviteModal({ movie, isOpen, onClose }) {
    const { friends, getOnlineFriends } = useFriends();
    const { createRoom, inviteFriend } = useWatchParty();
    const { addNotification } = useNotifications();
    const [selectedFriends, setSelectedFriends] = useState([]);
    const [roomCreated, setRoomCreated] = useState(null);
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    const onlineFriends = getOnlineFriends();

    const toggleFriend = (friend) => {
        setSelectedFriends(prev =>
            prev.find(f => f.id === friend.id)
                ? prev.filter(f => f.id !== friend.id)
                : [...prev, friend]
        );
    };

    const handleCreateParty = () => {
        const room = createRoom(movie.id);
        setRoomCreated(room);

        // Send invites to selected friends
        selectedFriends.forEach(friend => {
            inviteFriend(friend, room);
            addNotification({
                type: 'party_invite',
                message: `Invited ${friend.name} to watch ${movie.title}`,
                roomCode: room.id
            });
        });
    };

    const handleCopyCode = () => {
        navigator.clipboard.writeText(roomCreated.id);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleGoToRoom = () => {
        window.location.href = `/watch-party?room=${roomCreated.id}`;
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="party-invite-modal" onClick={e => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose}>
                    <i className="fas fa-times"></i>
                </button>

                {!roomCreated ? (
                    <>
                        <div className="modal-header">
                            <div className="movie-preview">
                                <img src={movie.posterUrl} alt={movie.title} />
                                <div className="movie-info">
                                    <h2>Watch Together</h2>
                                    <h3>{movie.title}</h3>
                                    <p>{movie.genre} • {movie.year}</p>
                                </div>
                            </div>
                        </div>

                        <div className="modal-content">
                            <div className="invite-section">
                                <h4>Invite Friends</h4>
                                <p>Select friends to invite to your watch party</p>

                                <div className="friends-select-list">
                                    {onlineFriends.length === 0 ? (
                                        <div className="no-friends">
                                            <i className="fas fa-user-friends"></i>
                                            <p>No friends online right now</p>
                                        </div>
                                    ) : (
                                        onlineFriends.map(friend => (
                                            <div
                                                key={friend.id}
                                                className={`friend-select-item ${selectedFriends.find(f => f.id === friend.id) ? 'selected' : ''}`}
                                                onClick={() => toggleFriend(friend)}
                                            >
                                                <div className="friend-avatar">
                                                    <img src={friend.avatar} alt={friend.name} />
                                                    <span className="status-dot"></span>
                                                </div>
                                                <span className="friend-name">{friend.name}</span>
                                                <div className="check-icon">
                                                    <i className="fas fa-check"></i>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="cancel-btn" onClick={onClose}>Cancel</button>
                            <button
                                className="create-btn"
                                onClick={handleCreateParty}
                            >
                                <i className="fas fa-video"></i>
                                Create Party {selectedFriends.length > 0 && `(${selectedFriends.length})`}
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="room-created">
                        <div className="success-icon">
                            <i className="fas fa-check-circle"></i>
                        </div>
                        <h2>Party Created!</h2>
                        <p>Share this code with friends to join</p>

                        <div className="room-code-box">
                            <span className="room-code">{roomCreated.id}</span>
                            <button className="copy-btn" onClick={handleCopyCode}>
                                <i className={`fas ${copied ? 'fa-check' : 'fa-copy'}`}></i>
                                {copied ? 'Copied!' : 'Copy'}
                            </button>
                        </div>

                        {selectedFriends.length > 0 && (
                            <div className="invites-sent">
                                <p>Invitations sent to:</p>
                                <div className="invited-avatars">
                                    {selectedFriends.map(friend => (
                                        <img key={friend.id} src={friend.avatar} alt={friend.name} title={friend.name} />
                                    ))}
                                </div>
                            </div>
                        )}

                        <button className="go-to-room-btn" onClick={handleGoToRoom}>
                            <i className="fas fa-play"></i>
                            Go to Watch Party
                        </button>
                    </div>
                )}

                <style>{`
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(10px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            animation: fadeIn 0.3s ease;
          }

          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          .party-invite-modal {
            width: 90%;
            max-width: 500px;
            background: rgba(30, 30, 45, 0.95);
            backdrop-filter: blur(20px);
            border-radius: 20px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            overflow: hidden;
            position: relative;
            animation: slideUp 0.3s ease;
          }

          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(30px) scale(0.95);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          .close-btn {
            position: absolute;
            top: 15px;
            right: 15px;
            width: 35px;
            height: 35px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.1);
            border: none;
            color: rgba(255, 255, 255, 0.7);
            cursor: pointer;
            transition: all 0.3s ease;
            z-index: 10;
          }

          .close-btn:hover {
            background: rgba(255, 255, 255, 0.2);
            color: white;
          }

          .modal-header {
            padding: 25px;
            background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.2));
          }

          .movie-preview {
            display: flex;
            gap: 20px;
            align-items: center;
          }

          .movie-preview img {
            width: 80px;
            height: 120px;
            object-fit: cover;
            border-radius: 10px;
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
          }

          .movie-info h2 {
            color: rgba(255, 255, 255, 0.7);
            font-size: 0.85rem;
            margin: 0 0 5px 0;
            text-transform: uppercase;
            letter-spacing: 1px;
          }

          .movie-info h3 {
            color: white;
            font-size: 1.4rem;
            margin: 0 0 5px 0;
          }

          .movie-info p {
            color: rgba(255, 255, 255, 0.6);
            margin: 0;
            font-size: 0.9rem;
          }

          .modal-content {
            padding: 25px;
          }

          .invite-section h4 {
            color: white;
            margin: 0 0 5px 0;
            font-size: 1.1rem;
          }

          .invite-section > p {
            color: rgba(255, 255, 255, 0.6);
            margin: 0 0 20px 0;
            font-size: 0.9rem;
          }

          .friends-select-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
            max-height: 250px;
            overflow-y: auto;
          }

          .friends-select-list::-webkit-scrollbar {
            width: 5px;
          }

          .friends-select-list::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.2);
            border-radius: 5px;
          }

          .no-friends {
            text-align: center;
            padding: 30px;
            color: rgba(255, 255, 255, 0.5);
          }

          .no-friends i {
            font-size: 2rem;
            margin-bottom: 10px;
          }

          .friend-select-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 15px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.3s ease;
            border: 2px solid transparent;
          }

          .friend-select-item:hover {
            background: rgba(255, 255, 255, 0.1);
          }

          .friend-select-item.selected {
            background: rgba(99, 102, 241, 0.2);
            border-color: rgba(99, 102, 241, 0.5);
          }

          .friend-select-item .friend-avatar {
            position: relative;
            width: 40px;
            height: 40px;
          }

          .friend-select-item .friend-avatar img {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            object-fit: cover;
          }

          .status-dot {
            position: absolute;
            bottom: 0;
            right: 0;
            width: 12px;
            height: 12px;
            background: #2ed573;
            border-radius: 50%;
            border: 2px solid rgba(30, 30, 45, 1);
          }

          .friend-select-item .friend-name {
            flex: 1;
            color: white;
            font-weight: 500;
          }

          .check-icon {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.1);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
          }

          .check-icon i {
            font-size: 0.7rem;
            color: transparent;
            transition: all 0.3s ease;
          }

          .friend-select-item.selected .check-icon {
            background: rgba(99, 102, 241, 0.8);
          }

          .friend-select-item.selected .check-icon i {
            color: white;
          }

          .modal-footer {
            display: flex;
            gap: 15px;
            padding: 20px 25px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
          }

          .cancel-btn, .create-btn {
            flex: 1;
            padding: 14px 20px;
            border-radius: 12px;
            border: none;
            cursor: pointer;
            font-size: 1rem;
            font-weight: 500;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
          }

          .cancel-btn {
            background: rgba(255, 255, 255, 0.1);
            color: rgba(255, 255, 255, 0.7);
          }

          .cancel-btn:hover {
            background: rgba(255, 255, 255, 0.15);
            color: white;
          }

          .create-btn {
            background: linear-gradient(135deg, rgba(99, 102, 241, 0.8), rgba(139, 92, 246, 0.8));
            color: white;
          }

          .create-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 20px rgba(99, 102, 241, 0.4);
          }

          /* Room Created State */
          .room-created {
            padding: 40px 30px;
            text-align: center;
          }

          .success-icon {
            font-size: 4rem;
            color: #2ed573;
            margin-bottom: 20px;
            animation: scaleIn 0.5s ease;
          }

          @keyframes scaleIn {
            from { transform: scale(0); }
            to { transform: scale(1); }
          }

          .room-created h2 {
            color: white;
            margin: 0 0 10px 0;
          }

          .room-created > p {
            color: rgba(255, 255, 255, 0.6);
            margin: 0 0 25px 0;
          }

          .room-code-box {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 15px;
            background: rgba(0, 0, 0, 0.3);
            padding: 15px 25px;
            border-radius: 12px;
            margin-bottom: 25px;
          }

          .room-code {
            font-size: 2rem;
            font-weight: bold;
            color: white;
            letter-spacing: 3px;
            font-family: monospace;
          }

          .copy-btn {
            background: rgba(255, 255, 255, 0.1);
            border: none;
            color: white;
            padding: 10px 15px;
            border-radius: 8px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.3s ease;
          }

          .copy-btn:hover {
            background: rgba(255, 255, 255, 0.2);
          }

          .invites-sent {
            margin-bottom: 25px;
          }

          .invites-sent p {
            color: rgba(255, 255, 255, 0.6);
            margin: 0 0 10px 0;
            font-size: 0.9rem;
          }

          .invited-avatars {
            display: flex;
            justify-content: center;
            gap: -10px;
          }

          .invited-avatars img {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            border: 2px solid rgba(30, 30, 45, 1);
            margin-left: -10px;
          }

          .invited-avatars img:first-child {
            margin-left: 0;
          }

          .go-to-room-btn {
            width: 100%;
            padding: 16px;
            background: linear-gradient(135deg, rgba(99, 102, 241, 0.8), rgba(139, 92, 246, 0.8));
            border: none;
            border-radius: 12px;
            color: white;
            font-size: 1.1rem;
            font-weight: 500;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            transition: all 0.3s ease;
          }

          .go-to-room-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 25px rgba(99, 102, 241, 0.5);
          }
        `}</style>
            </div>
        </div>
    );
}

export default PartyInviteModal;
