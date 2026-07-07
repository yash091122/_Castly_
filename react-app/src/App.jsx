import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import Loader from './components/Loader';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { FriendsProvider } from './context/FriendsContext';
import { NotificationProvider } from './context/NotificationContext';
import { WatchPartyProvider } from './context/WatchPartyContext';
import { TvProgressProvider } from './context/TvProgressContext';
import { ContentProvider } from './context/ContentContext';
import { AdminProvider } from './context/AdminContext';
import { ProfileProvider } from './context/ProfileContext';
import { AppSettingsProvider, useAppSettings } from './context/AppSettingsContext';
import { BannerProvider } from './context/BannerContext';
import { FeaturedProvider } from './context/FeaturedContext';
import { AnnouncementProvider } from './context/AnnouncementContext';
import AnnouncementPopup from './components/AnnouncementPopup';
import MaintenancePage from './pages/MaintenancePage';

// Eager load critical components
import Layout from './components/Layout';
import Home from './pages/Home'; // Home is critical, keep eager
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ProfileSelection from './pages/ProfileSelection';

// Lazy load non-critical pages

const MoviesPage = lazy(() => import('./pages/MoviesPage'));

const TvShowsHome = lazy(() => import('./pages/TvShowsHome'));
const SeriesDetailPage = lazy(() => import('./pages/SeriesDetailPage'));
const TvPlayer = lazy(() => import('./pages/TvPlayer'));
const Favorites = lazy(() => import('./pages/Favorites'));
const Friends = lazy(() => import('./pages/Friends'));

const MovieDetailPage = lazy(() => import('./pages/MovieDetailPage'));
const Player = lazy(() => import('./pages/Player'));
const WatchPartyRoom = lazy(() => import('./pages/WatchPartyRoom'));
const WatchPartyVision = lazy(() => import('./pages/WatchPartyVision'));
const Notifications = lazy(() => import('./pages/Notifications'));
const AuthCallback = lazy(() => import('./pages/AuthCallback'));

// Admin pages
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const ContentManagement = lazy(() => import('./pages/admin/ContentManagement'));
const UserManagement = lazy(() => import('./pages/admin/UserManagement'));
const WatchPartyManagement = lazy(() => import('./pages/admin/WatchPartyManagement'));
const ChatReports = lazy(() => import('./pages/admin/ChatReports'));
const Analytics = lazy(() => import('./pages/admin/Analytics'));
const AdminNotifications = lazy(() => import('./pages/admin/AdminNotifications'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));
const AdminLogs = lazy(() => import('./pages/admin/AdminLogs'));

import './styles/main.css';
import './styles/admin.css';
import './styles/tv-shows.css';
import './styles/tv-player.css';
import './styles/tv-watch-party.css';
import './styles/profile.css';

// Loading Fallback Component
const PageLoader = () => (
  <Loader />
);

// Wrapper to handle maintenance mode
const AppContent = () => {
  const { isMaintenanceMode, loading } = useAppSettings();

  // Show maintenance page if enabled (except for admin routes)
  if (!loading && isMaintenanceMode && !window.location.pathname.startsWith('/admin')) {
    return <MaintenancePage />;
  }

  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Auth routes without layout */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/profiles" element={<ProfileSelection />} />
          <Route path="/player/:id" element={<Player />} />
          <Route path="/tv-player/:showId/:season/:episode" element={<TvPlayer />} />
          <Route path="/watch-party-room" element={<WatchPartyRoom />} />


          {/* Routes with layout */}
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/movies" element={<MoviesPage />} />

            <Route path="/tv-shows" element={<TvShowsHome />} />

            <Route path="/tv-show/:id" element={<SeriesDetailPage />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/friends" element={<Friends />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/movie/:id" element={<MovieDetailPage />} />

            <Route path="/watch-party" element={<WatchPartyVision />} />
            <Route path="/watch-party-vision" element={<WatchPartyVision />} />
          </Route>

          {/* Admin routes */}
          <Route path="/admin" element={<AdminProvider><AdminLayout /></AdminProvider>}>
            <Route index element={<AdminDashboard />} />
            <Route path="content" element={<ContentManagement />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="watch-parties" element={<WatchPartyManagement />} />
            <Route path="chat-reports" element={<ChatReports />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="notifications" element={<AdminNotifications />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="logs" element={<AdminLogs />} />
          </Route>
        </Routes>
      </Suspense>
      <AnnouncementPopup />
    </BrowserRouter>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppSettingsProvider>
        <SocketProvider>
          <NotificationProvider>
            <FriendsProvider>
              <ContentProvider>
                <FavoritesProvider>
                  <WatchPartyProvider>
                    <TvProgressProvider>
                      <BannerProvider>
                        <FeaturedProvider>
                          <AnnouncementProvider>
                            <ProfileProvider>
                              <AppContent />
                            </ProfileProvider>
                          </AnnouncementProvider>
                        </FeaturedProvider>
                      </BannerProvider>
                    </TvProgressProvider>
                  </WatchPartyProvider>
                </FavoritesProvider>
              </ContentProvider>
            </FriendsProvider>
          </NotificationProvider>
        </SocketProvider>
      </AppSettingsProvider>
    </AuthProvider>
  );
}

export default App;
