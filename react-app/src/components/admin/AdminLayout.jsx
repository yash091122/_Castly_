import { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdmin } from '../../context/AdminContext';
import {
  LayoutDashboard, Film, Users, PartyPopper, MessageSquare,
  BarChart3, Bell, Settings, FileText, ChevronLeft, ChevronRight,
  Search, Menu, Plus, X, LogOut, User
} from 'lucide-react';

const navItems = [
  { path: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { path: '/admin/content', icon: Film, label: 'Content Management' },
  { path: '/admin/users', icon: Users, label: 'Users' },
  { path: '/admin/watch-parties', icon: PartyPopper, label: 'Watch Parties' },
  { path: '/admin/chat-reports', icon: MessageSquare, label: 'Chat & Reports' },
  { path: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
  { path: '/admin/notifications', icon: Bell, label: 'Notifications' },
  { path: '/admin/settings', icon: Settings, label: 'Settings' },
  { path: '/admin/logs', icon: FileText, label: 'Admin Logs' },
];

export default function AdminLayout() {
  const { userRole, stats, user } = useAdmin();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Close profile menu on click outside
  useEffect(() => {
    const handleClick = () => setShowProfileMenu(false);
    if (showProfileMenu) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [showProfileMenu]);

  const getPageTitle = () => {
    const item = navItems.find(n =>
      n.exact ? location.pathname === n.path : location.pathname.startsWith(n.path) && n.path !== '/admin'
    ) || navItems[0];
    return item.label;
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      console.log('Searching for:', searchQuery);
    }
  };

  const getRoleLabel = () => {
    switch (userRole) {
      case 'admin': return 'Super Admin';
      case 'moderator': return 'Moderator';
      case 'content_manager': return 'Content Manager';
      default: return 'Admin';
    }
  };

  const getInitials = () => {
    if (user?.user_metadata?.display_name) {
      return user.user_metadata.display_name.substring(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return 'AD';
  };

  return (
    <div className={`admin-layout ${collapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 150
            }}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`admin-sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="admin-sidebar-header">
          <div className="admin-logo">C</div>
          {!collapsed && <span className="admin-brand">Castly Admin</span>}
        </div>

        <nav className="admin-nav">
          <div className="admin-nav-section">
            {!collapsed && <div className="admin-nav-label">Main Menu</div>}
            {navItems.slice(0, 5).map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
                data-tooltip={item.label}
              >
                <item.icon className="admin-nav-icon" size={20} />
                {!collapsed && <span className="admin-nav-text">{item.label}</span>}
              </NavLink>
            ))}
          </div>

          <div className="admin-nav-section">
            {!collapsed && <div className="admin-nav-label">System</div>}
            {navItems.slice(5).map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
                data-tooltip={item.label}
              >
                <item.icon className="admin-nav-icon" size={20} />
                {!collapsed && <span className="admin-nav-text">{item.label}</span>}
              </NavLink>
            ))}
          </div>
        </nav>

        <div className="admin-sidebar-toggle">
          <button className="admin-toggle-btn" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <header className="admin-header">
          <div className="admin-header-left">
            <button
              className="admin-header-btn mobile-menu"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <h1 className="admin-page-title">{getPageTitle()}</h1>
          </div>

          <div className="admin-header-right">
            <form onSubmit={handleSearch} className="admin-search">
              <Search className="admin-search-icon" size={18} />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>

            <button
              className="admin-header-btn"
              onClick={() => navigate('/admin/notifications')}
            >
              <Bell size={20} />
              {stats?.pending_reports > 0 && (
                <span className="admin-notification-badge">{stats.pending_reports}</span>
              )}
            </button>

            <div
              className="admin-profile"
              onClick={(e) => {
                e.stopPropagation();
                setShowProfileMenu(!showProfileMenu);
              }}
              style={{ position: 'relative' }}
            >
              <div className="admin-profile-avatar">{getInitials()}</div>
              <div className="admin-profile-info">
                <div className="admin-profile-name">{user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Admin'}</div>
                <div className="admin-profile-role">{getRoleLabel()}</div>
              </div>

              <AnimatePresence>
                {showProfileMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      right: 0,
                      background: '#111114',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 10,
                      padding: 8,
                      minWidth: 180,
                      zIndex: 100
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => navigate('/admin/settings')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        width: '100%',
                        padding: '10px 12px',
                        background: 'transparent',
                        border: 'none',
                        borderRadius: 6,
                        color: '#a0a0a0',
                        cursor: 'pointer',
                        fontSize: 14
                      }}
                    >
                      <User size={16} />
                      Profile Settings
                    </button>
                    <button
                      onClick={() => navigate('/')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        width: '100%',
                        padding: '10px 12px',
                        background: 'transparent',
                        border: 'none',
                        borderRadius: 6,
                        color: '#dc2626',
                        cursor: 'pointer',
                        fontSize: 14
                      }}
                    >
                      <LogOut size={16} />
                      Exit Admin
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <div className="admin-content">
          <Outlet />
        </div>
      </main>

      {/* Floating Action Button */}
      <motion.button
        className="admin-fab"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate('/admin/content')}
        title="Add Content"
      >
        <Plus size={24} />
      </motion.button>
    </div>
  );
}
