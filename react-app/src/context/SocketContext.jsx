import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { io } from 'socket.io-client';

const SocketContext = createContext();

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

// ─────────────────────────────────────────────────────────────────────────────
// Singleton socket — one instance for the entire browser session.
// ─────────────────────────────────────────────────────────────────────────────
let _socket = null;
let _socketUserId = null;
let _visibilityHandler = null;

// Web Worker ref — kept outside React so it's truly a singleton
let _heartbeatWorker = null;
// navigator.locks release function
let _lockRelease = null;

// ── Wake up free-tier servers (Render/Railway sleep on inactivity) ────────
async function wakeUpServer() {
  try {
    const res = await fetch(SOCKET_URL, { signal: AbortSignal.timeout(10_000) });
    console.log('🔔 Server awake:', res.ok);
    return res.ok;
  } catch (e) {
    console.warn('⚠️ Server wake-up failed:', e.message);
    return false;
  }
}

function buildUserPayload(user) {
  return {
    userId: user.id,
    userData: {
      name: user.user_metadata?.display_name || user.email,
      avatar:
        user.user_metadata?.avatar_url ||
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`
    }
  };
}

// ── Start the Web Worker heartbeat ───────────────────────────────────────
// The worker runs in a separate OS thread — the browser NEVER throttles it.
// Even if the tab is backgrounded, minimized, or the user switches apps,
// the worker keeps ticking and we send a heartbeat to the server.
function startWorkerHeartbeat(socket, userId) {
  stopWorkerHeartbeat();

  try {
    _heartbeatWorker = new Worker('/socket-heartbeat-worker.js');

    _heartbeatWorker.onmessage = () => {
      // Worker ticked — send heartbeat if socket is alive
      if (socket && socket.connected) {
        socket.emit('ping');
        socket.emit('heartbeat', { userId });
        console.log('💓 [Worker] Heartbeat sent');
      } else if (socket && !socket.connected) {
        // Socket dropped — try to reconnect immediately
        console.log('🔄 [Worker] Socket not connected, triggering reconnect');
        socket.connect();
      }
    };

    _heartbeatWorker.onerror = (e) => {
      console.warn('⚠️ Heartbeat worker error:', e.message);
      // Fall back to regular interval
      startFallbackHeartbeat(socket, userId);
    };

    _heartbeatWorker.postMessage('start');
    console.log('✅ Web Worker heartbeat started');
  } catch (e) {
    console.warn('⚠️ Web Worker not supported, using fallback:', e.message);
    startFallbackHeartbeat(socket, userId);
  }
}

// Fallback: regular setInterval (will be throttled by browser in background,
// but better than nothing)
let _fallbackInterval = null;
function startFallbackHeartbeat(socket, userId) {
  if (_fallbackInterval) clearInterval(_fallbackInterval);
  _fallbackInterval = setInterval(() => {
    if (socket && socket.connected) {
      socket.emit('ping');
      socket.emit('heartbeat', { userId });
    } else if (socket && !socket.connected) {
      socket.connect();
    }
  }, 10_000);
}

function stopWorkerHeartbeat() {
  if (_heartbeatWorker) {
    _heartbeatWorker.postMessage('stop');
    _heartbeatWorker.terminate();
    _heartbeatWorker = null;
  }
  if (_fallbackInterval) {
    clearInterval(_fallbackInterval);
    _fallbackInterval = null;
  }
}

// ── navigator.locks — prevent browser from suspending the tab ────────────
// Requesting a Web Lock tells the browser this tab has "active work" and
// should not be aggressively throttled. Chrome respects this in most cases.
function acquireWakeLock(userId) {
  releaseWakeLock();

  if (!navigator.locks) {
    console.warn('⚠️ navigator.locks not supported');
    return;
  }

  navigator.locks.request(
    `castly-socket-${userId}`,
    { mode: 'shared' }, // shared = multiple tabs can hold it
    () => new Promise((resolve) => {
      // Store resolve so we can release it later
      _lockRelease = resolve;
      console.log('🔒 Wake lock acquired for user:', userId);
    })
  ).catch(e => console.warn('⚠️ Wake lock failed:', e.message));
}

function releaseWakeLock() {
  if (_lockRelease) {
    _lockRelease(); // resolves the promise → releases the lock
    _lockRelease = null;
    console.log('🔓 Wake lock released');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
export function SocketProvider({ children }) {
  const { user } = useAuth();

  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [reconnectCount, setReconnectCount] = useState(0);

  // Stable accessor — always returns the live socket even in stale closures
  const getSocket = useCallback(() => socketRef.current, []);

  function attachVisibilityHandler(socket, userId, userPayload) {
    if (_visibilityHandler) {
      document.removeEventListener('visibilitychange', _visibilityHandler);
    }
    _visibilityHandler = () => {
      if (document.visibilityState !== 'visible') return;
      console.log('👁️ Tab visible — checking socket…');

      if (!socket.connected) {
        console.log('🔄 Socket disconnected in background, reconnecting…');
        socket.connect();
      } else {
        // Already connected — re-announce presence in case server lost us
        socket.emit('heartbeat', { userId });
        socket.emit('user:online', userPayload);
      }
    };
    document.addEventListener('visibilitychange', _visibilityHandler);
  }

  useEffect(() => {
    if (!user) {
      // Logged out — tear everything down
      stopWorkerHeartbeat();
      releaseWakeLock();
      if (_visibilityHandler) {
        document.removeEventListener('visibilitychange', _visibilityHandler);
        _visibilityHandler = null;
      }
      if (_socket) {
        _socket.disconnect();
        _socket = null;
        _socketUserId = null;
      }
      socketRef.current = null;
      setIsConnected(false);
      return;
    }

    // Reuse existing socket for the same user
    if (_socket && _socketUserId === user.id) {
      console.log('✅ Reusing existing socket:', _socket.id);
      socketRef.current = _socket;
      setIsConnected(_socket.connected);
      // Ensure heartbeat + lock are running
      if (!_heartbeatWorker && !_fallbackInterval) {
        startWorkerHeartbeat(_socket, user.id);
      }
      if (!_lockRelease) {
        acquireWakeLock(user.id);
      }
      attachVisibilityHandler(_socket, user.id, buildUserPayload(user));
      return;
    }

    // Different user — disconnect old socket
    if (_socket && _socketUserId !== user.id) {
      stopWorkerHeartbeat();
      releaseWakeLock();
      _socket.disconnect();
      _socket = null;
    }

    let cancelled = false;

    (async () => {
      await wakeUpServer();
      if (cancelled) return;

      console.log('🔌 Creating socket for user:', user.id);

      const socket = io(SOCKET_URL, {
        reconnection: true,
        reconnectionDelay: 1_000,
        reconnectionDelayMax: 8_000,
        reconnectionAttempts: Infinity,     // never give up
        timeout: 30_000,
        transports: ['websocket', 'polling'],
        autoConnect: true,
        upgrade: true,
        rememberUpgrade: false,
        forceNew: false,
        withCredentials: false
      });

      _socket = socket;
      _socketUserId = user.id;
      socketRef.current = socket;

      const userPayload = buildUserPayload(user);

      socket.on('connect', () => {
        console.log('✅ Socket connected:', socket.id);
        setIsConnected(true);

        socket.emit('user:online', userPayload);
        socket.emit('heartbeat', { userId: user.id });

        // Start worker heartbeat on connect (keeps socket alive in background)
        startWorkerHeartbeat(socket, user.id);
        // Acquire wake lock (prevents browser from suspending tab)
        acquireWakeLock(user.id);
      });

      socket.on('disconnect', (reason) => {
        console.log('❌ Socket disconnected:', reason);
        setIsConnected(false);

        // socket.io auto-reconnects for all reasons except server-initiated kick
        if (reason === 'io server disconnect') {
          console.log('🔄 Server kicked us — reconnecting manually…');
          socket.connect();
        }
      });

      socket.on('reconnect', (n) => {
        console.log(`✅ Reconnected after ${n} attempt(s)`);
        setIsConnected(true);
        setReconnectCount(c => c + 1); // WatchPartyRoom re-joins on this

        socket.emit('user:online', userPayload);
        socket.emit('heartbeat', { userId: user.id });

        // Restart worker after reconnect
        startWorkerHeartbeat(socket, user.id);
        acquireWakeLock(user.id);
      });

      socket.on('reconnect_attempt', (n) => console.log(`🔄 Reconnect attempt #${n}`));
      socket.on('reconnect_error', (e) => console.error('❌ Reconnect error:', e.message));
      socket.on('reconnect_failed', () => console.error('❌ All reconnect attempts failed'));

      // Presence
      socket.on('users:online', (users) => {
        console.log('📋 Online users:', users.length);
        setOnlineUsers(users);
      });

      socket.on('user:status', (payload) => {
        const uid = payload.userId || payload.odId;
        const online = payload.online;
        const meta = payload.userData;
        setOnlineUsers(prev => {
          if (online) {
            if (prev.find(u => u.userId === uid)) return prev;
            return [...prev, { userId: uid, name: meta?.name, avatar: meta?.avatar }];
          }
          return prev.filter(u => u.userId !== uid);
        });
      });

      // Debug
      socket.on('party:invite', (data) => {
        console.log('🎉 SocketContext: party:invite received', data);
      });

      attachVisibilityHandler(socket, user.id, userPayload);
    })();

    return () => {
      cancelled = true;
      if (_visibilityHandler) {
        document.removeEventListener('visibilitychange', _visibilityHandler);
        _visibilityHandler = null;
      }
      // Do NOT disconnect socket or stop heartbeat here —
      // must survive React lifecycle noise and tab switches.
    };
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <SocketContext.Provider value={{
      socket: socketRef.current,
      getSocket,
      isConnected,
      onlineUsers,
      reconnectCount
    }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocketContext = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocketContext must be used within a SocketProvider');
  return context;
};