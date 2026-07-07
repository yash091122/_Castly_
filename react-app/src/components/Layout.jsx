import { useState, useCallback, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import GlobalSearch from './GlobalSearch';

function Layout() {
    const [searchActive, setSearchActive] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const location = useLocation();

    // Detect mobile device
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 767);
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Set page data attribute for styling
    useEffect(() => {
        const path = location.pathname.split('/')[1] || 'home';
        document.body.setAttribute('data-page', path);
    }, [location]);

    const toggleSearch = useCallback(() => {
        setSearchOpen(prev => !prev);
    }, []);

    const closeSearch = useCallback(() => {
        setSearchOpen(false);
    }, []);

    return (
        <div className={`background-wrapper ${isMobile ? 'mobile-layout' : 'desktop-layout'}`}>
            <Sidebar onSearchToggle={toggleSearch} searchOpen={searchOpen} isMobile={isMobile} />
            <main className="main-content glass-card">
                <Outlet context={{ searchActive, setSearchActive, isMobile }} />
            </main>
            <GlobalSearch isOpen={searchOpen} onClose={closeSearch} />
        </div>
    );
}

export default Layout;
