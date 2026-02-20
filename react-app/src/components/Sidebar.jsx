import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import NotificationBell from './NotificationBell';
import { useFriends } from '../context/FriendsContext';
import ProfilePopup from './ProfilePopup';

function Sidebar({ onSearchToggle, searchOpen, isMobile }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { pendingRequests } = useFriends();
    const requestCount = pendingRequests?.length || 0;
    const [showProfile, setShowProfile] = useState(false);

    console.log('Sidebar render, showProfile:', showProfile);

    const handleBack = () => {
        navigate(-1);
    };

    // Hide back button on home page
    const isHomePage = location.pathname === '/';

    return (
        <>
            <nav className={`sidebar glass-card ${isMobile ? 'mobile-nav' : 'desktop-nav'}`}>
                {!isMobile && (
                    <div className="logo">
                        <img src="/assets/Castly.png" alt="Castly" />
                    </div>
                )}
                <div className="nav-items">
                    {!isHomePage && (
                        <button
                            className="nav-item"
                            onClick={handleBack}
                            data-tooltip="Go Back"
                            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                            <i className="fas fa-arrow-left"></i>
                        </button>
                    )}
                    <NavLink
                        to="/"
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        data-tooltip="Home"
                    >
                        <i className="fas fa-home"></i>
                    </NavLink>

                    {/* Search Toggle Button */}
                    <button
                        className={`nav-item ${searchOpen ? 'active' : ''}`}
                        onClick={onSearchToggle}
                        data-tooltip="Search"
                        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                        <i className="fas fa-search"></i>
                    </button>

                    <NavLink
                        to="/movies"
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        data-tooltip="Movies"
                    >
                        <i className="fas fa-film"></i>
                    </NavLink>
                    <NavLink
                        to="/tv-shows"
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        data-tooltip="TV Shows"
                    >
                        <i className="fas fa-tv"></i>
                    </NavLink>
                    <NavLink
                        to="/favorites"
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        data-tooltip="Favorites"
                    >
                        <i className="fas fa-heart"></i>
                    </NavLink>
                    <NavLink
                        to="/friends"
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        data-tooltip="Friends"
                        style={{ position: 'relative' }}
                    >
                        <i className="fas fa-user-friends"></i>
                        {requestCount > 0 && (
                            <span className="request-badge">
                                {requestCount > 9 ? '9+' : requestCount}
                            </span>
                        )}
                    </NavLink>
                    <NavLink
                        to="/watch-party-vision"
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        data-tooltip="Watch Party"
                    >
                        <i className="fas fa-video"></i>
                    </NavLink>
                    <div className="nav-notification" data-tooltip="Notifications">
                        <NotificationBell />
                    </div>

                    {/* Profile Trigger Button */}
                    <button
                        className={`nav-item ${showProfile ? 'active' : ''}`}
                        onClick={() => {
                            console.log('Sidebar: Toggling profile to true');
                            setShowProfile(true);
                        }}
                        data-tooltip="Profile"
                        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                        <i className="fas fa-user"></i>
                    </button>

                    <ProfilePopup
                        isOpen={showProfile}
                        onClose={() => setShowProfile(false)}
                    />
                </div>

                <style>{`
            .nav-notification {
              display: flex;
              align-items: center;
              justify-content: center;
            }

            .request-badge {
                position: absolute;
                top: 5px;
                right: 5px;
                background: #ffffff;
                color: #000000;
                font-size: 10px;
                font-weight: 800;
                min-width: 18px;
                height: 18px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 0 4px;
                border: 2px solid #000000;
                box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
                animation: popInBadge 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                z-index: 10;
            }

            @keyframes popInBadge {
                0% { transform: scale(0); }
                100% { transform: scale(1); }
            }
          `}</style>
            </nav>
        </>
    );
}

export default Sidebar;
