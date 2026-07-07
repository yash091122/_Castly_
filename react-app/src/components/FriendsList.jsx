import { useFriends } from '../context/FriendsContext';

function FriendsList({ onInvite, showInviteButton = true }) {
    const { friends, getOnlineFriends } = useFriends();
    const onlineFriends = getOnlineFriends();

    return (
        <div className="friends-list">
            <div className="friends-header">
                <h3>Friends</h3>
                <span className="online-count">{onlineFriends.length} online</span>
            </div>

            <div className="friends-section">
                <div className="section-label">Online</div>
                {onlineFriends.length === 0 ? (
                    <div className="no-friends">No friends online</div>
                ) : (
                    onlineFriends.map(friend => (
                        <div key={friend.id} className="friend-item">
                            <div className="friend-avatar">
                                <img src={friend.avatar} alt={friend.name} />
                                <span className="status-indicator online"></span>
                            </div>
                            <div className="friend-info">
                                <span className="friend-name">{friend.name}</span>
                                <span className="friend-status">Online</span>
                            </div>
                            {showInviteButton && (
                                <button
                                    className="invite-btn"
                                    onClick={() => onInvite && onInvite(friend)}
                                >
                                    <i className="fas fa-user-plus"></i>
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>

            <div className="friends-section">
                <div className="section-label">Offline</div>
                {friends.filter(f => !f.online).map(friend => (
                    <div key={friend.id} className="friend-item offline">
                        <div className="friend-avatar">
                            <img src={friend.avatar} alt={friend.name} />
                            <span className="status-indicator offline"></span>
                        </div>
                        <div className="friend-info">
                            <span className="friend-name">{friend.name}</span>
                            <span className="friend-status">Offline</span>
                        </div>
                    </div>
                ))}
            </div>

            <style>{`
        .friends-list {
          background: rgba(0, 0, 0, 0.3);
          border-radius: 15px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          overflow: hidden;
        }

        .friends-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 20px;
          background: rgba(255, 255, 255, 0.05);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .friends-header h3 {
          color: white;
          margin: 0;
          font-size: 1rem;
        }

        .online-count {
          font-size: 0.85rem;
          color: #2ed573;
        }

        .friends-section {
          padding: 10px 0;
        }

        .section-label {
          padding: 8px 20px;
          font-size: 0.75rem;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.5);
          letter-spacing: 0.5px;
        }

        .no-friends {
          padding: 20px;
          text-align: center;
          color: rgba(255, 255, 255, 0.4);
          font-size: 0.9rem;
        }

        .friend-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 20px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .friend-item:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .friend-item.offline {
          opacity: 0.6;
        }

        .friend-avatar {
          position: relative;
          width: 40px;
          height: 40px;
          flex-shrink: 0;
        }

        .friend-avatar img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
        }

        .status-indicator {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 2px solid rgba(20, 20, 30, 1);
        }

        .status-indicator.online {
          background: #2ed573;
        }

        .status-indicator.offline {
          background: #636e72;
        }

        .friend-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .friend-name {
          color: white;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .friend-status {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.5);
        }

        .invite-btn {
          width: 35px;
          height: 35px;
          border-radius: 50%;
          background: rgba(99, 102, 241, 0.2);
          border: none;
          color: rgba(99, 102, 241, 0.8);
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
        }

        .friend-item:hover .invite-btn {
          opacity: 1;
        }

        .invite-btn:hover {
          background: rgba(99, 102, 241, 0.4);
          color: white;
          transform: scale(1.1);
        }
      `}</style>
        </div>
    );
}

export default FriendsList;
