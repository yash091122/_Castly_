import { useNotifications } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';

function NotificationBell() {
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/notifications');
  };

  return (
    <div className="notification-bell">
      <button
        className={`bell-btn ${unreadCount > 0 ? 'has-unread' : ''}`}
        onClick={handleClick}
        title="View notifications"
      >
        <i className="fas fa-bell"></i>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      <style>{`
        .notification-bell {
          position: relative;
        }

        .bell-btn {
          width: 45px;
          height: 45px;
          border-radius: 15px;
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(8px);
          border: none;
          color: rgba(255, 255, 255, 0.7);
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          box-shadow: 
             inset 0 0 15px rgba(255, 255, 255, 0.05),
             0 5px 15px rgba(0, 0, 0, 0.2);
        }

        .bell-btn i {
          font-size: 1.3rem;
          transition: all 0.4s ease;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
        }

        .bell-btn:hover {
          background: rgba(255, 255, 255, 0.15);
          transform: translateY(-2px);
          color: white;
          box-shadow: 
            0 0 20px rgba(255, 255, 255, 0.1),
            inset 0 0 15px rgba(255, 255, 255, 0.1);
        }

        .bell-btn:hover i {
           transform: scale(1.2);
           text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
        }

        .bell-btn.has-unread {
          animation: bellShake 0.5s ease-in-out;
        }

        @keyframes bellShake {
          0%, 100% { transform: rotate(0); }
          25% { transform: rotate(-10deg); }
          75% { transform: rotate(10deg); }
        }

        .notification-badge {
          position: absolute;
          top: -2px;
          right: -2px;
          min-width: 18px;
          height: 18px;
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          border-radius: 10px;
          font-size: 0.7rem;
          font-weight: bold;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 5px;
          animation: popIn 0.3s ease;
          border: 2px solid rgba(0,0,0,0.2);
          box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
        }

        @keyframes popIn {
          0% { transform: scale(0); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

export default NotificationBell;
