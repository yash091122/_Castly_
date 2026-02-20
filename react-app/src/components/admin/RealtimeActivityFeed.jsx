import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdmin } from '../../context/AdminContext';
import { 
  Users, Film, PartyPopper, MessageSquare, AlertTriangle, 
  Bell, Clock, Wifi, WifiOff, ChevronDown, ChevronUp
} from 'lucide-react';

const getEventIcon = (type) => {
  switch (type) {
    case 'user': return Users;
    case 'movie': case 'series': return Film;
    case 'party': return PartyPopper;
    case 'message': return MessageSquare;
    case 'report': return AlertTriangle;
    default: return Bell;
  }
};

const getEventColor = (type, eventType) => {
  if (eventType === 'DELETE') return '#dc2626';
  switch (type) {
    case 'user': return '#3b82f6';
    case 'movie': case 'series': return '#f59e0b';
    case 'party': return '#8b5cf6';
    case 'message': return '#22c55e';
    case 'report': return '#dc2626';
    default: return '#666';
  }
};

const formatEventMessage = (event) => {
  const { type, data } = event;
  const eventType = data?.eventType || 'UPDATE';
  
  switch (type) {
    case 'user':
      if (eventType === 'INSERT') return `New user registered: ${data.new?.username || 'Unknown'}`;
      if (eventType === 'UPDATE') {
        if (data.new?.status === 'blocked') return `User blocked: ${data.new?.username}`;
        if (data.new?.online_status) return `User came online: ${data.new?.username}`;
        return `User updated: ${data.new?.username || 'Unknown'}`;
      }
      if (eventType === 'DELETE') return `User deleted`;
      break;
    case 'movie':
      if (eventType === 'INSERT') return `New movie added: ${data.new?.title || 'Unknown'}`;
      if (eventType === 'UPDATE') {
        if (data.new?.status === 'published') return `Movie published: ${data.new?.title}`;
        return `Movie updated: ${data.new?.title || 'Unknown'}`;
      }
      if (eventType === 'DELETE') return `Movie deleted`;
      break;
    case 'party':
      if (eventType === 'INSERT') return `New watch party started: ${data.new?.movie_title || 'Unknown'}`;
      if (eventType === 'UPDATE') {
        if (data.new?.status === 'ended') return `Watch party ended: ${data.new?.movie_title}`;
        return `Watch party updated`;
      }
      break;
    case 'message':
      if (data.new?.is_flagged) return `Message flagged in party`;
      if (eventType === 'DELETE') return `Message deleted`;
      return `New chat message`;
    case 'report':
      if (eventType === 'INSERT') return `New report submitted`;
      if (data.new?.status === 'resolved') return `Report resolved`;
      return `Report updated`;
    default:
      return `${type} ${eventType.toLowerCase()}`;
  }
  return `${type} event`;
};

const formatTimeAgo = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  
  if (diff < 5) return 'Just now';
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return date.toLocaleDateString();
};

export default function RealtimeActivityFeed({ maxItems = 20, compact = false }) {
  const { realtimeEvents, realtimeEnabled, setRealtimeEnabled } = useAdmin();
  const [expanded, setExpanded] = useState(true);
  const [filter, setFilter] = useState('all');
  const feedRef = useRef(null);
  
  const filteredEvents = realtimeEvents
    .filter(e => filter === 'all' || e.type === filter)
    .slice(0, maxItems);

  // Auto-scroll to top on new events
  useEffect(() => {
    if (feedRef.current && filteredEvents.length > 0) {
      feedRef.current.scrollTop = 0;
    }
  }, [filteredEvents.length]);

  if (compact) {
    return (
      <div style={{ 
        background: 'rgba(255,255,255,0.03)', 
        borderRadius: 12, 
        padding: 16,
        border: '1px solid rgba(255,255,255,0.08)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {realtimeEnabled ? (
              <Wifi size={14} style={{ color: '#22c55e' }} />
            ) : (
              <WifiOff size={14} style={{ color: '#666' }} />
            )}
            <span style={{ fontSize: 12, fontWeight: 500 }}>Live Activity</span>
          </div>
          <span style={{ fontSize: 11, color: '#666' }}>{filteredEvents.length} events</span>
        </div>
        
        <div style={{ maxHeight: 200, overflowY: 'auto' }} ref={feedRef}>
          <AnimatePresence mode="popLayout">
            {filteredEvents.slice(0, 5).map((event) => {
              const Icon = getEventIcon(event.type);
              const color = getEventColor(event.type, event.data?.eventType);
              
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.05)'
                  }}
                >
                  <div style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    background: `${color}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Icon size={12} style={{ color }} />
                  </div>
                  <span style={{ flex: 1, fontSize: 12, color: '#a0a0a0' }}>
                    {formatEventMessage(event)}
                  </span>
                  <span style={{ fontSize: 10, color: '#666' }}>
                    {formatTimeAgo(event.timestamp)}
                  </span>
                </motion.div>
              );
            })}
          </AnimatePresence>
          
          {filteredEvents.length === 0 && (
            <div style={{ textAlign: 'center', padding: 20, color: '#666', fontSize: 12 }}>
              No recent activity
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="admin-card">
      <div className="admin-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h3 className="admin-card-title">Real-time Activity</h3>
          <button
            onClick={() => setRealtimeEnabled(!realtimeEnabled)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              background: realtimeEnabled ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255,255,255,0.05)',
              border: 'none',
              borderRadius: 20,
              color: realtimeEnabled ? '#22c55e' : '#666',
              fontSize: 11,
              cursor: 'pointer'
            }}
          >
            {realtimeEnabled ? <Wifi size={12} /> : <WifiOff size={12} />}
            {realtimeEnabled ? 'Live' : 'Paused'}
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              padding: '6px 10px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 6,
              color: '#fff',
              fontSize: 12
            }}
          >
            <option value="all">All Events</option>
            <option value="user">Users</option>
            <option value="movie">Movies</option>
            <option value="party">Parties</option>
            <option value="report">Reports</option>
            <option value="message">Messages</option>
          </select>
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#666',
              cursor: 'pointer',
              padding: 4
            }}
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>
      
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div 
              ref={feedRef}
              style={{ 
                maxHeight: 400, 
                overflowY: 'auto',
                padding: '0 20px 20px'
              }}
            >
              <AnimatePresence mode="popLayout">
                {filteredEvents.map((event, index) => {
                  const Icon = getEventIcon(event.type);
                  const color = getEventColor(event.type, event.data?.eventType);
                  
                  return (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ delay: index * 0.02 }}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 12,
                        padding: '12px 0',
                        borderBottom: '1px solid rgba(255,255,255,0.05)'
                      }}
                    >
                      <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: `${color}15`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <Icon size={16} style={{ color }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 13, marginBottom: 4 }}>
                          {formatEventMessage(event)}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#666' }}>
                          <Clock size={10} />
                          {formatTimeAgo(event.timestamp)}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              
              {filteredEvents.length === 0 && (
                <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
                  <Bell size={32} style={{ opacity: 0.3, marginBottom: 12 }} />
                  <p>No activity yet</p>
                  <p style={{ fontSize: 12, marginTop: 4 }}>
                    {realtimeEnabled ? 'Waiting for events...' : 'Enable realtime to see live updates'}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
