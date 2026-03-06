# Castly Admin Panel - API Reference

## Overview
The admin panel uses Supabase as the backend with real-time subscriptions for live updates. All API calls are made through the `adminService` module.

## Setup

### 1. Run the Database Schema
Execute `admin-schema-complete.sql` in your Supabase SQL Editor to create all required tables, functions, and policies.

### 2. Enable Realtime
Ensure the following tables have realtime enabled in Supabase:
- `profiles`
- `movies`
- `watch_parties`
- `chat_messages`
- `reports`

### 3. Configure Storage
Create a `media` storage bucket for file uploads (posters, banners, videos).

---

## API Services

### Dashboard Service
```javascript
import adminService from './services/adminService';

// Get dashboard statistics
const { data } = await adminService.dashboard.getStats();
// Returns: { total_users, active_users, blocked_users, total_movies, published_movies, total_series, active_parties, total_parties, pending_reports, flagged_messages }

// Get user growth data
const { data } = await adminService.dashboard.getUserGrowth(30); // Last 30 days

// Get most watched content
const { data } = await adminService.dashboard.getMostWatched(10); // Top 10
```

### User Service
```javascript
// Get paginated users with filters
const { data, count, totalPages } = await adminService.users.getUsers(page, limit, {
  status: 'active', // 'active' | 'blocked' | 'all'
  role: 'user',     // 'user' | 'admin' | 'moderator' | 'content_manager' | 'all'
  search: 'john'    // Search by username/email
});

// Get single user with stats
const { data } = await adminService.users.getUser(userId);

// Block/Unblock user
await adminService.users.updateUserStatus(userId, 'blocked'); // or 'active'

// Change user role
await adminService.users.updateUserRole(userId, 'moderator');

// Delete user (cascade deletes all user data)
await adminService.users.deleteUser(userId);

// Get user's watch history
const { data } = await adminService.users.getUserWatchHistory(userId, 20);

// Get user's favorites
const { data } = await adminService.users.getUserFavorites(userId);
```

### Movie Service
```javascript
// Get paginated movies
const { data, count, totalPages } = await adminService.movies.getMovies(page, limit, {
  status: 'published', // 'published' | 'draft' | 'all'
  genre: 'Action',
  search: 'avengers'
});

// Get single movie
const { data } = await adminService.movies.getMovie(movieId);

// Create movie
const { data } = await adminService.movies.createMovie({
  title: 'Movie Title',
  description: 'Description...',
  genre: 'Action',
  duration: '2h 30m',
  release_date: '2024-01-15',
  year: 2024,
  rating: 8.5,
  status: 'draft',
  poster_url: 'https://...',
  banner_url: 'https://...',
  trailer_url: 'https://...',
  video_url: 'https://...'
});

// Update movie
await adminService.movies.updateMovie(movieId, { title: 'New Title' });

// Delete movie
await adminService.movies.deleteMovie(movieId);

// Toggle publish status
await adminService.movies.togglePublish(movieId, currentStatus);

// Upload media file
const { url } = await adminService.movies.uploadMedia(file, 'poster'); // 'poster' | 'banner' | 'trailer' | 'video'
```

### Series Service
```javascript
// Get paginated series
const { data } = await adminService.series.getSeries(page, limit, filters);

// Get series with seasons and episodes
const { data } = await adminService.series.getSeriesWithSeasons(seriesId);

// Create series
await adminService.series.createSeries({ title, description, poster_url, genre, status });

// Update series
await adminService.series.updateSeries(seriesId, updates);

// Delete series (cascades to seasons and episodes)
await adminService.series.deleteSeries(seriesId);

// Add season
await adminService.series.addSeason(seriesId, seasonNumber, title);

// Add episode
await adminService.series.addEpisode(seasonId, {
  title: 'Episode 1',
  description: '...',
  video_url: 'https://...',
  duration: '45m',
  episode_order: 1
});

// Delete episode
await adminService.series.deleteEpisode(episodeId);
```

### Watch Party Service
```javascript
// Get paginated parties
const { data } = await adminService.watchParties.getParties(page, limit, {
  status: 'active', // 'active' | 'ended' | 'all'
  search: 'movie title'
});

// Get party details with participants
const { data } = await adminService.watchParties.getParty(partyId);

// End watch party
await adminService.watchParties.endParty(partyId);

// Remove participant
await adminService.watchParties.removeParticipant(partyId, userId);

// Broadcast system message to party
await adminService.watchParties.broadcastMessage(partyId, 'Party will end in 5 minutes');

// Get active party count
const { count } = await adminService.watchParties.getActiveCount();
```

### Chat Service
```javascript
// Get messages with filters
const { data } = await adminService.chat.getMessages(page, limit, {
  flagged: true,    // Only flagged messages
  partyId: '...',   // Filter by party
  userId: '...'     // Filter by user
});

// Flag/Unflag message
await adminService.chat.toggleFlag(messageId, isFlagged);

// Delete message
await adminService.chat.deleteMessage(messageId);
```

### Report Service
```javascript
// Get reports
const { data } = await adminService.reports.getReports(page, limit, {
  status: 'open' // 'open' | 'resolved' | 'dismissed' | 'all'
});

// Resolve report
await adminService.reports.resolveReport(reportId, 'resolve'); // or 'dismiss'

// Get pending report count
const { count } = await adminService.reports.getPendingCount();
```

### Notification Service
```javascript
// Send notification to users
await adminService.notifications.sendNotification(
  'Title',
  'Message content',
  'all' // 'all' | 'active' | 'premium'
);

// Get sent notifications
const { data } = await adminService.notifications.getNotifications(50);
```

### Banner Service
```javascript
// Get all banners
const { data } = await adminService.banners.getBanners();

// Create banner
await adminService.banners.createBanner({
  title: 'Announcement',
  description: 'Details...',
  start_date: '2024-01-01',
  end_date: '2024-01-31',
  is_active: true
});

// Toggle banner active status
await adminService.banners.toggleBanner(bannerId, isActive);

// Delete banner
await adminService.banners.deleteBanner(bannerId);
```

### Settings Service
```javascript
// Get all settings
const { data } = await adminService.settings.getSettings();

// Update setting
await adminService.settings.updateSetting('app_name', 'New Name');

// Get/Set maintenance mode
const { enabled } = await adminService.settings.getMaintenanceMode();
await adminService.settings.setMaintenanceMode(true);
```

### Logs Service
```javascript
// Get admin activity logs
const { data } = await adminService.logs.getLogs(page, limit, {
  targetType: 'user', // 'user' | 'movie' | 'series' | 'party' | 'settings' | 'report'
  adminId: '...',
  search: 'blocked'
});
```

---

## Real-time Subscriptions

```javascript
import adminService from './services/adminService';

// Subscribe to user changes
const userSub = adminService.realtime.subscribeToUsers((payload) => {
  console.log('User event:', payload.eventType, payload.new);
  // payload.eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  // payload.new: New record data
  // payload.old: Previous record data (for UPDATE/DELETE)
});

// Subscribe to watch party changes
const partySub = adminService.realtime.subscribeToParties(callback);

// Subscribe to reports
const reportSub = adminService.realtime.subscribeToReports(callback);

// Subscribe to chat messages
const messageSub = adminService.realtime.subscribeToMessages(callback);

// Subscribe to movie changes
const movieSub = adminService.realtime.subscribeToMovies(callback);

// Subscribe to series changes
const seriesSub = adminService.realtime.subscribeToSeries(callback);

// Subscribe to all events at once
const allSub = adminService.realtime.subscribeToAll({
  onUserChange: (payload) => { ... },
  onPartyChange: (payload) => { ... },
  onReportChange: (payload) => { ... },
  onMessageChange: (payload) => { ... },
  onMovieChange: (payload) => { ... }
});

// Unsubscribe
adminService.realtime.unsubscribe(subscription);

// Unsubscribe from all
adminService.realtime.unsubscribeAll();
```

---

## Role-Based Access Control

### Roles
- `admin` - Full access to all features
- `moderator` - User management + chat moderation
- `content_manager` - Movies and series management only
- `user` - Regular user (no admin access)

### Permission Checks
```javascript
import { useAdmin } from './context/AdminContext';

const { canManageUsers, canManageContent, canManageSettings, canViewLogs } = useAdmin();

if (canManageUsers()) {
  // Show user management features
}

if (canManageContent()) {
  // Show content management features
}

if (canManageSettings()) {
  // Show settings (admin only)
}

if (canViewLogs()) {
  // Show admin logs (admin only)
}
```

---

## Database Functions

### get_admin_dashboard_stats()
Returns aggregated statistics for the dashboard.

### log_admin_action(admin_id, action, target_type, target_id, target_name, details)
Logs an admin action for audit trail.

### increment_view_count(movie_id)
Increments the view count for a movie.

### broadcast_party_message(party_id, message)
Sends a system message to all participants in a watch party.

### get_user_growth(days)
Returns user registration counts grouped by day.

---

## Storage

### Media Bucket
- Bucket name: `media`
- Folders: `movies/posters/`, `movies/banners/`, `movies/trailers/`, `movies/videos/`
- Public access: Yes (for viewing)
- Upload access: Admin and Content Manager roles only

---

## Error Handling

All service methods return `{ data, error }` objects:

```javascript
const { data, error } = await adminService.movies.createMovie(movieData);

if (error) {
  console.error('Failed to create movie:', error.message);
  showToast('Failed to create movie', 'error');
  return;
}

// Success
showToast('Movie created successfully');
```
