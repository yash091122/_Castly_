import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocketContext } from '../context/SocketContext';
import { useFriends } from '../context/FriendsContext';
import { useContent } from '../context/ContentContext';
import { useNotifications } from '../context/NotificationContext';
import { watchPartyMovies, getMovieById, getAllMovies } from '../data/watchPartyMovies';
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  MessageSquare, Users, Send, X, Sparkles,
  SkipBack, SkipForward, Settings, Maximize2,
  Plus, LogIn, Check, Lock, Eye, EyeOff,
  Mic, MicOff, Video, VideoOff, Search
} from 'lucide-react';
import SimplePeer from 'simple-peer';
import ContentCard from '../components/ContentCard';
import Loader from '../components/Loader';
import '../styles/watch-party-vision.css';
import '../styles/movies.css';
import '../styles/content-pages.css';

function WatchPartyVision() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocketContext();
  const { addToast } = useNotifications();
  const { friends = [], getOnlineFriends } = useFriends() || {};
  const { searchMovies, searchTvShows, movies, tvShows, loading } = useContent();

  // Debug logging
  useEffect(() => {
    console.log('🎬 WatchPartyVision Debug:');
    console.log('  User:', user?.id);
    console.log('  Socket connected:', socket?.connected);
    console.log('  All friends:', friends);
    console.log('  Online friends:', getOnlineFriends?.());
    console.log('  Movies loaded:', movies?.length);
    console.log('  TV Shows loaded:', tvShows?.length);
    console.log('  Content loading:', loading);
  }, [friends, socket, user, movies, tvShows, loading]);

  // Room state
  const roomId = searchParams.get('room');
  const movieId = searchParams.get('movie');
  const [isHost, setIsHost] = useState(searchParams.get('host') === 'true');
  const [participants, setParticipants] = useState([]);
  const [movieData, setMovieData] = useState(null);
  const [showLobby, setShowLobby] = useState(!roomId);

  // Video state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [buffering, setBuffering] = useState(false);

  // Chat state
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [showChat, setShowChat] = useState(true);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [unreadCount, setUnreadCount] = useState(0);

  // Sidebar state
  // Sidebar state
  const [sidebarTab, setSidebarTab] = useState('chat'); // 'chat' or 'invite'

  // Search state for create mode
  const [searchQuery, setSearchQuery] = useState('');

  // Lobby state
  const [lobbyMode, setLobbyMode] = useState('menu'); // 'menu', 'create', 'join'
  const [joinCode, setJoinCode] = useState('');
  const [joinStatus, setJoinStatus] = useState('idle'); // 'idle', 'requesting', 'waiting', 'approved', 'rejected', 'error'
  const [joinError, setJoinError] = useState('');

  // Host state
  const [pendingRequests, setPendingRequests] = useState([]);

  const videoRef = useRef(null);
  const chatEndRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const syncCheckIntervalRef = useRef(null);
  const peersRef = useRef([]);
  const joinedRef = useRef(false);

  // Video Chat state
  const [peers, setPeers] = useState([]);
  const [stream, setStream] = useState(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [showFilmstrip, setShowFilmstrip] = useState(true);
  const userVideo = useRef();

  // Combined movies list
  const allMovies = [...watchPartyMovies, ...getAllMovies().filter(m => !watchPartyMovies.find(wm => wm.id === m.id))];

  // Filter movies for search - combine results from both search functions
  const filteredMovies = searchQuery.trim()
    ? (() => {
      console.log('🔍 Search Query:', searchQuery);
      const movieResults = searchMovies ? searchMovies(searchQuery) : [];
      const tvResults = searchTvShows ? searchTvShows(searchQuery) : [];

      console.log('📽️ Movie Results:', movieResults.length);
      console.log('📺 TV Results:', tvResults.length);

      // Combine and normalize the results
      const combined = [...movieResults, ...tvResults].map(item => ({
        ...item,
        id: item.id,
        title: item.title,
        poster: item.posterUrl || item.poster,
        posterUrl: item.posterUrl || item.poster,
        year: item.year,
        genre: item.genre,
        rating: item.rating,
        type: item.type || 'movie'
      }));

      console.log('✅ Combined Results:', combined.length, combined);
      return combined;
    })()
    : [];

  // Load movie data
  useEffect(() => {
    if (movieId) {
      const movie = allMovies.find(m => m.id === movieId || m.id === parseInt(movieId));
      if (movie) {
        setMovieData(movie);
      }
    }
  }, [movieId]);
  // 1. Get User Media on Mount (if in room)
  useEffect(() => {
    if (!roomId) return;

    let myStream;
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(currentStream => {
        setStream(currentStream);
        myStream = currentStream;
        if (userVideo.current) {
          userVideo.current.srcObject = currentStream;
        }
      })
      .catch(err => {
        console.error("Failed to get media:", err);
        setIsVideoEnabled(false);
        setIsAudioEnabled(false);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        ctx.fillRect(0, 0, 1, 1);
        const dummyStream = canvas.captureStream();
        setStream(dummyStream);
        if (userVideo.current) {
          userVideo.current.srcObject = dummyStream;
        }
      });

    return () => {
      // Keep stream
    };
  }, [roomId]);

  // 2. Setup WebRTC Listeners & Join Room (Once Stream is Ready)
  useEffect(() => {
    if (!socket || !user || !roomId || !stream || joinedRef.current) return;

    // A. Setup Listeners
    const handleParticipantJoined = ({ userId: newUserId, socketId: newSocketId }) => {
      console.log('User joined, calling:', newUserId);
      const peer = createPeer(newSocketId, socket.id, stream);
      peersRef.current.push({
        peerID: newSocketId,
        peer,
      });
      setPeers(users => [...users, { peerID: newSocketId, peer }]);
    };

    const handleSignal = ({ from, signal }) => {
      const item = peersRef.current.find(p => p.peerID === from);
      if (item) {
        item.peer.signal(signal);
      } else {
        const peer = addPeer(signal, from, stream);
        peersRef.current.push({
          peerID: from,
          peer,
        });
        setPeers(users => [...users, { peerID: from, peer }]);
      }
    };

    socket.on('participant:joined', handleParticipantJoined);
    socket.on('signal', handleSignal);

    // B. Join Room
    console.log('Joining room with stream ready...');
    socket.emit('room:join', { roomId, userId: user.id, isHost });

    setParticipants([{
      id: user.id,
      name: user.user_metadata?.display_name || user.email?.split('@')[0] || 'You',
      avatar: user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`,
      isHost,
      isYou: true
    }]);

    joinedRef.current = true;

    return () => {
      socket.off('participant:joined', handleParticipantJoined);
      socket.off('signal', handleSignal);

      joinedRef.current = false;
      socket.emit('room:leave', { roomId });
      peersRef.current.forEach(p => p.peer.destroy());
      peersRef.current = [];
      setPeers([]);
    };
  }, [socket, user, roomId, isHost, stream]);

  // Join room on mount (if approved/host)
  useEffect(() => {
    if (!socket || !user || !roomId) return;

    // If host, join immediately
    if (isHost) {
      joinRoomDirectly();
    }
    // If not host, we wait for manual join/approval flow unless already in params (assuming verified)
    // For this implementation, we'll require re-verification or assume if they have the link they *might* need approval
    // But to keep it simple, if URL has params, try to join. 
    // ideally we'd check if they are already a participant? 
    // For now, let's trust the URL params but adding a safety check could be good.
    else {
      joinRoomDirectly();
    }

    function joinRoomDirectly() {
      socket.emit('room:join', {
        roomId,
        userId: user.id,
        isHost
      });

      setParticipants([{
        id: user.id,
        name: user.user_metadata?.display_name || user.email?.split('@')[0] || 'You',
        avatar: user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`,
        isHost,
        isYou: true
      }]);
    }

    return () => {
      socket.emit('room:leave', { roomId });
    };
  }, [socket, user, roomId, isHost]);

  // Video Chat Logic
  useEffect(() => {
    if (!roomId || !user) return;

    // Get User Media
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(currentStream => {
      setStream(currentStream);
      if (userVideo.current) {
        userVideo.current.srcObject = currentStream;
      }

      if (!socket) return;

      // Existing participants call the new user? 
      // Actually standard mesh: New user joins -> Server tells everyone. 
      // Everyone calls the new user.

      socket.on('participant:joined', ({ userId: newUserId, socketId: newSocketId }) => {
        // We are an existing peer, we call the new guy
        const peer = createPeer(newSocketId, socket.id, currentStream);
        peersRef.current.push({
          peerID: newSocketId,
          peer,
        });
        setPeers(users => [...users, { peerID: newSocketId, peer }]);
      });

      // We are the new user, we receive calls
      socket.on('signal', ({ from, signal }) => {
        const item = peersRef.current.find(p => p.peerID === from);
        if (item) {
          // We already have a peer for this user, signal them
          item.peer.signal(signal);
        } else {
          // Incoming call
          const peer = addPeer(signal, from, currentStream);
          peersRef.current.push({
            peerID: from,
            peer,
          });
          setPeers(users => [...users, { peerID: from, peer }]);
        }
      });
    });

    return () => {
      // Cleanup streams?
      // if (stream) stream.getTracks().forEach(track => track.stop());
    }
  }, [roomId, user, socket]);

  function createPeer(userToSignal, callerID, stream) {
    const peer = new SimplePeer({
      initiator: true,
      trickle: false,
      stream,
    });

    peer.on("signal", signal => {
      socket.emit("signal", { to: userToSignal, from: callerID, signal });
    });

    return peer;
  }

  function addPeer(incomingSignal, callerID, stream) {
    const peer = new SimplePeer({
      initiator: false,
      trickle: false,
      stream,
    });

    peer.on("signal", signal => {
      socket.emit("signal", { to: callerID, from: socket.id, signal });
    });

    peer.signal(incomingSignal);

    return peer;
  }

  const toggleVideo = () => {
    if (stream) {
      stream.getVideoTracks()[0].enabled = !isVideoEnabled;
      setIsVideoEnabled(!isVideoEnabled);
    }
  }

  const toggleAudio = () => {
    if (stream) {
      stream.getAudioTracks()[0].enabled = !isAudioEnabled;
      setIsAudioEnabled(!isAudioEnabled);
    }
  }

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('participant:joined', ({ userId, socketId, isHost: participantIsHost }) => {
      setParticipants(prev => {
        if (prev.find(p => p.id === userId)) return prev;
        return [...prev, {
          id: userId,
          socketId,
          name: `User ${userId.slice(0, 4)}`, // Ideally fetch user details
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
          isHost: participantIsHost
        }];
      });
    });

    socket.on('participant:left', ({ userId }) => {
      setParticipants(prev => prev.filter(p => p.id !== userId));
    });

    // Host: Handle join requests
    socket.on('room:join_request', ({ userId, userData, socketId }) => {
      setPendingRequests(prev => [...prev, { userId, userData, socketId }]);
      // Play notification sound?
    });

    // Client: Handle join approval/rejection
    // Client: Handle join approval/rejection
    socket.on('room:join_approved', ({ roomId: approvedRoomId, movieId: approvedMovieId, movieTitle, contentType, season, episode }) => {
      console.log('✅ Join approved:', { approvedRoomId, approvedMovieId, movieTitle, contentType });
      setJoinStatus('approved');
      setTimeout(() => {
        // Use the movie ID from the server response
        const movieToJoin = approvedMovieId || 'big-buck-bunny';
        const typeParam = contentType ? `&type=${contentType}` : '';
        const seasonParam = season ? `&season=${season}` : '';
        const episodeParam = episode ? `&episode=${episode}` : '';

        navigate(`/watch-party-room?room=${approvedRoomId}&movie=${movieToJoin}&host=false${typeParam}${seasonParam}${episodeParam}`);
        setShowLobby(false);
        setJoinStatus('idle');
      }, 1000);
    });

    socket.on('room:join_rejected', () => {
      setJoinStatus('rejected');
      setJoinError('The host declined your request.');
    });

    socket.on('room:error', ({ message }) => {
      setJoinStatus('error');
      setJoinError(message);
    });

    socket.on('sync:play', ({ timestamp }) => {
      if (videoRef.current && !isHost) {
        videoRef.current.currentTime = timestamp;
        videoRef.current.play();
        setIsPlaying(true);
      }
    });

    socket.on('sync:pause', ({ timestamp }) => {
      if (videoRef.current && !isHost) {
        videoRef.current.currentTime = timestamp;
        videoRef.current.pause();
        setIsPlaying(false);
      }
    });

    socket.on('sync:seek', ({ timestamp }) => {
      if (videoRef.current && !isHost) { // Allow seek even if paused
        videoRef.current.currentTime = timestamp;
      }
    });

    socket.on('sync:state', ({ timestamp, paused }) => {
      if (videoRef.current && !isHost) {
        const timeDiff = Math.abs(videoRef.current.currentTime - timestamp);
        if (timeDiff > 2) {
          videoRef.current.currentTime = timestamp;
        }
        if (paused && !videoRef.current.paused) {
          videoRef.current.pause();
          setIsPlaying(false);
        } else if (!paused && videoRef.current.paused) {
          videoRef.current.play();
          setIsPlaying(true);
        }
      }
    });

    socket.on('sync:request', () => {
      if (isHost && videoRef.current) {
        socket.emit('sync:state', {
          roomId,
          timestamp: videoRef.current.currentTime,
          paused: videoRef.current.paused
        });
      }
    });

    socket.on('chat:message', (message) => {
      setMessages(prev => [...prev, message]);
      if (!showChat) {
        setUnreadCount(prev => prev + 1);
      }
    });

    socket.on('chat:typing', ({ userId, isTyping }) => {
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        if (isTyping) {
          newSet.add(userId);
        } else {
          newSet.delete(userId);
        }
        return newSet;
      });
    });

    return () => {
      socket.off('participant:joined');
      socket.off('participant:left');
      socket.off('room:join_request');
      socket.off('room:join_approved');
      socket.off('room:join_rejected');
      socket.off('room:error');
      socket.off('sync:play');
      socket.off('sync:pause');
      socket.off('sync:seek');
      socket.off('sync:state');
      socket.off('sync:request');
      socket.off('chat:message');
      socket.off('chat:typing');
    };
  }, [socket, isHost, roomId, showChat, navigate]);

  // Periodic sync check
  useEffect(() => {
    if (!isHost || !socket || !videoRef.current) return;

    syncCheckIntervalRef.current = setInterval(() => {
      if (videoRef.current) {
        socket.emit('sync:state', {
          roomId,
          timestamp: videoRef.current.currentTime,
          paused: videoRef.current.paused
        });
      }
    }, 5000);

    return () => {
      if (syncCheckIntervalRef.current) {
        clearInterval(syncCheckIntervalRef.current);
      }
    };
  }, [isHost, socket, roomId]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Reset unread when chat opens
  useEffect(() => {
    if (showChat) {
      setUnreadCount(0);
    }
  }, [showChat]);

  // Video handlers (same as before)
  const handlePlayPause = () => {
    if (!videoRef.current || !isHost) return;

    if (videoRef.current.paused) {
      videoRef.current.play();
      socket.emit('sync:play', { roomId, timestamp: videoRef.current.currentTime });
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      socket.emit('sync:pause', { roomId, timestamp: videoRef.current.currentTime });
      setIsPlaying(false);
    }
  };

  const handleSeek = (e) => {
    if (!videoRef.current || !isHost) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const newTime = pos * duration;
    videoRef.current.currentTime = newTime;
    socket.emit('sync:seek', { roomId, timestamp: newTime });
  };

  const handleSkip = (seconds) => {
    if (!videoRef.current || !isHost) return;
    const newTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + seconds));
    videoRef.current.currentTime = newTime;
    socket.emit('sync:seek', { roomId, timestamp: newTime });
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setIsMuted(newVolume === 0);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    const container = document.querySelector('.vpv-player-section');
    if (!document.fullscreenElement) {
      container?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  // Chat handlers
  const handleSendMessage = (e) => {
    if (e) e.preventDefault();
    if (!messageInput.trim() || !socket) return;

    const message = {
      id: Date.now().toString(),
      userId: user.id,
      userName: user.user_metadata?.display_name || user.email?.split('@')[0] || 'You',
      userAvatar: user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`,
      text: messageInput,
      timestamp: Date.now()
    };

    socket.emit('chat:message', { roomId, message });
    setMessages(prev => [...prev, message]);
    setMessageInput('');
    socket.emit('chat:typing', { roomId, userId: user.id, isTyping: false });
  };

  const handleTyping = (e) => {
    setMessageInput(e.target.value);
    if (!socket) return;
    socket.emit('chat:typing', { roomId, userId: user.id, isTyping: true });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('chat:typing', { roomId, userId: user.id, isTyping: false });
    }, 2000);
  };

  // Lobby Actions
  const handleSelectMovie = (movie) => {
    const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    navigate(`/watch-party-room?room=${newRoomId}&movie=${movie.id}&type=${movie.type || 'movie'}&host=true`);
    setShowLobby(false);
  };

  const handleJoinRequest = (e) => {
    e.preventDefault();
    if (joinCode.length !== 6) return;

    // Normalize to uppercase to match host's room ID format
    const normalizedRoomId = joinCode.toUpperCase();

    setJoinStatus('requesting');
    setJoinError('');

    socket.emit('room:join_request', {
      roomId: normalizedRoomId,
      userId: user.id,
      userData: {
        name: user.user_metadata?.display_name || user.email?.split('@')[0],
        avatar: user.user_metadata?.avatar_url
      }
    });

    setJoinStatus('waiting');
  };

  // Host Actions
  const handleApproveRequest = (request) => {
    socket.emit('room:join_approve', {
      roomId,
      userId: request.userId,
      socketId: request.socketId
    });
    setPendingRequests(prev => prev.filter(r => r.userId !== request.userId));
  };

  const handleRejectRequest = (request) => {
    socket.emit('room:join_reject', {
      roomId,
      userId: request.userId,
      socketId: request.socketId
    });
    setPendingRequests(prev => prev.filter(r => r.userId !== request.userId));
  };

  const handleLeaveRoom = () => {
    if (socket) {
      socket.emit('room:leave', { roomId });
    }
    navigate('/watch-party-vision');
    setShowLobby(true);
    setLobbyMode('menu');
  };

  const handleInviteFriend = (friend) => {
    console.log('handleInviteFriend called with:', friend);
    console.log('Socket:', socket);
    console.log('RoomId:', roomId);

    if (!socket || !roomId) {
      console.error('Missing socket or roomId');
      addToast({
        type: 'error',
        message: 'Cannot send invite: Not connected to server or no room ID'
      });
      return;
    }

    const friendName = friend.display_name || friend.name || friend.email?.split('@')[0] || 'Friend';

    // Send invite notification via socket
    socket.emit('watch_party:invite', {
      fromUserId: user.id,
      toUserId: friend.id,
      roomId,
      movieTitle: movieData?.title || 'a movie',
      userData: {
        name: user.user_metadata?.display_name || user.email?.split('@')[0] || 'Someone',
        username: user.user_metadata?.username || user.user_metadata?.display_name || user.email?.split('@')[0],
        avatar: user.user_metadata?.avatar_url,
      }
    });

    console.log('✅ Invite sent to:', friendName);

    // Show success feedback
    addToast({
      type: 'success',
      message: `Invite sent to ${friendName}!`
    });
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  if (!user) {
    return (
      <div className="content-container">
        <div className="vpv-auth-content">
          <div className="vpv-auth-card">
            <Sparkles size={64} className="vpv-auth-icon" />
            <h2>Welcome to Watch Party</h2>
            <p>Sign in to experience the future of watching together</p>
            <button onClick={() => navigate('/login')} className="vpv-btn-primary">
              Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Lobby View
  if (showLobby) {
    return (
      <div className="content-container">
        {/* MENU MODE */}
        {lobbyMode === 'menu' && (
          <div className="vpv-menu-container">
            <div className="vpv-hero">
              <h1> Watch Party</h1>
              <p>Watch movies and shows with friends in real-time sync.</p>
            </div>

            <div className="vpv-options-grid">
              <div className="vpv-option-card" onClick={() => setLobbyMode('create')}>
                <div className="vpv-card-icon"><Plus size={48} /></div>
                <h3>Create Room</h3>
                <p>Start a new watch party and invite friends.</p>
              </div>

              <div className="vpv-option-card" onClick={() => setLobbyMode('join')}>
                <div className="vpv-card-icon"><LogIn size={48} /></div>
                <h3>Join Room</h3>
                <p>Enter a code to join an existing party.</p>
              </div>
            </div>
          </div>
        )}

        {/* CREATE MODE */}
        {lobbyMode === 'create' && (
          <div className="vpv-create-container">
            <div className="vpv-header-row">
              <button className="vpv-back-btn" onClick={() => setLobbyMode('menu')}>
                <SkipBack size={20} /> Back
              </button>
            </div>

            {/* Search Bar - Centered when empty */}
            <div className="vpv-search-container" style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: searchQuery ? 'flex-start' : 'center',
              minHeight: searchQuery ? 'auto' : '60vh',
              transition: 'all 0.3s ease',
              width: '100%',
              padding: '24px'
            }}>
              {!searchQuery && (
                <div style={{ marginBottom: '32px', textAlign: 'center' }}>
                  <h2 style={{ fontSize: '2rem', marginBottom: '16px' }}>What do you want to watch?</h2>
                  <p style={{ color: 'var(--wp-text-muted)' }}>Search for movies or TV shows to start your party</p>
                </div>
              )}

              <div className="vpv-search-bar" style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--wp-border)',
                borderRadius: '100px',
                padding: '16px 24px',
                width: '100%',
                maxWidth: '600px',
                gap: '12px',
                boxShadow: searchQuery ? 'none' : '0 10px 40px rgba(0,0,0,0.3)'
              }}>
                <Search size={24} className="text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search movies & shows..."
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: 'white',
                    flex: 1,
                    fontSize: '1.125rem'
                  }}
                  autoFocus
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#9ca3af',
                      cursor: 'pointer',
                      display: 'flex',
                    }}
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            </div>

            {/* Results - Using same layout as Movies page */}
            {searchQuery && (
              <div style={{ animation: 'fadeIn 0.5s ease' }}>
                {loading ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '40px'
                  }}>
                    <Loader fullScreen={false} />
                    <p style={{ marginTop: '20px', color: 'white' }}>Loading content...</p>
                  </div>
                ) : filteredMovies.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '40px',
                    color: 'var(--wp-text-muted)'
                  }}>
                    <p>No results found for "{searchQuery}"</p>
                  </div>
                ) : (
                  <div className="section">
                    <h2 className="section-title">Search Results ({filteredMovies.length})</h2>
                    <div className="content-row">
                      {filteredMovies.map(movie => (
                        <ContentCard
                          key={`${movie.type}-${movie.id}`}
                          movie={movie}
                          onClick={handleSelectMovie}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* JOIN MODE */}
        {
          lobbyMode === 'join' && (
            <div className="vpv-join-container">
              <button className="vpv-back-btn absolute-top-left" onClick={() => setLobbyMode('menu')}>
                <SkipBack size={20} /> Back
              </button>

              <div className="vpv-join-card">
                <h2>Join a Room</h2>
                <p>Enter the 6-character room code.</p>

                {joinStatus === 'idle' || joinStatus === 'error' ? (
                  <form onSubmit={handleJoinRequest}>
                    <input
                      className="vpv-code-input"
                      value={joinCode}
                      onChange={e => setJoinCode(e.target.value.toUpperCase())}
                      placeholder="CODE"
                      maxLength={6}
                    />
                    {joinError && <div className="vpv-error-msg">{joinError}</div>}
                    <button type="submit" className="vpv-btn-primary" disabled={joinCode.length !== 6}>
                      Request to Join
                    </button>
                  </form>
                ) : (
                  <div className="vpv-status-display">
                    {joinStatus === 'waiting' && (
                      <>
                        <Loader size="medium" fullScreen={false} />
                        <p style={{ marginTop: '16px' }}>Waiting for host approval...</p>
                      </>
                    )}
                    {joinStatus === 'approved' && (
                      <>
                        <Check size={48} className="text-green-500" />
                        <p>Approved! Joining...</p>
                      </>
                    )}
                    {joinStatus === 'rejected' && (
                      <>
                        <X size={48} className="text-red-500" />
                        <p>Request declined by host.</p>
                        <button className="vpv-btn-secondary" onClick={() => setJoinStatus('idle')}>Try Again</button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        }
      </div >
    );
  }

  // ROOM VIEW
  if (!movieData) return <Loader />;

  return (
    <div className="content-container no-padding">
      <div className="vpv-room-container">
        {/* Main Player Section */}
        <div className="vpv-player-section" onMouseMove={handleMouseMove}>
          {/* Video Filmstrip Overlay */}
          <div className={`vpv-video-filmstrip ${showControls ? 'visible' : ''}`}>
            {/* Local User */}
            <div className="vpv-video-tile local">
              <video playsInline muted ref={userVideo} autoPlay />
              <span className="vpv-video-name">You</span>
              <div className="vpv-video-controls">
                <button onClick={toggleAudio} className={`vpv-micro-btn ${!isAudioEnabled ? 'off' : ''}`}>
                  {isAudioEnabled ? <Mic size={16} /> : <MicOff size={16} />}
                </button>
                <button onClick={toggleVideo} className={`vpv-micro-btn ${!isVideoEnabled ? 'off' : ''}`}>
                  {isVideoEnabled ? <Video size={16} /> : <VideoOff size={16} />}
                </button>
              </div>
            </div>
            {/* Peers */}
            {peers.map((peer, index) => {
              return (
                <VideoTile key={index} peer={peer.peer} isHost={isHost} />
              );
            })}
          </div>

          <div className="vpv-video-wrapper">
            <video
              ref={videoRef}
              src={movieData.videoUrl}
              className="vpv-video"
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onWaiting={() => setBuffering(true)}
              onCanPlay={() => setBuffering(false)}
              onClick={handlePlayPause}
            />
            {buffering && <div className="vpv-buffering"><Loader size="large" fullScreen={false} /></div>}
          </div>

          {/* Controls Overlay */}
          <div className={`vpv-controls-overlay ${showControls ? 'visible' : ''}`}>
            <div className="vpv-top-bar">
              <div className="vpv-stat-badge">
                <Lock size={14} /> Room: {roomId}
              </div>
              <div className="vpv-stat-badge">
                <Users size={14} /> {participants.length}
              </div>
            </div>

            <div className="vpv-bottom-controls">
              {/* Progress Bar */}
              <div className="vpv-progress-bar-container" onClick={handleSeek}>
                <div className="vpv-progress-bg">
                  <div className="vpv-progress-fill" style={{ width: `${(currentTime / duration) * 100}%` }}></div>
                </div>
              </div>

              {/* Buttons */}
              <div className="vpv-buttons-row">
                <div className="vpv-left-controls">
                  <button className="vpv-control-btn primary" onClick={handlePlayPause}>
                    {isPlaying ? <Pause className="fill-current" /> : <Play className="fill-current" />}
                  </button>
                  <button className="vpv-control-btn" onClick={() => handleSkip(-10)}><SkipBack /></button>
                  <button className="vpv-control-btn" onClick={() => handleSkip(10)}><SkipForward /></button>

                  <div className="vpv-volume-control">
                    <button className="vpv-control-btn" onClick={toggleMute}>
                      {isMuted ? <VolumeX /> : <Volume2 />}
                    </button>
                    <input type="range" min="0" max="1" step="0.1" value={volume} onChange={handleVolumeChange} />
                  </div>

                  <span className="vpv-time-display">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                <div className="vpv-right-controls">
                  <button
                    onClick={() => setShowFilmstrip(!showFilmstrip)}
                    className={`vpv-control-btn ${showFilmstrip ? 'active' : ''}`}
                    title={showFilmstrip ? "Hide Video Overlay" : "Show Video Overlay"}
                  >
                    {showFilmstrip ? <Eye /> : <EyeOff />}
                  </button>
                  <button onClick={() => setShowChat(!showChat)} className={`vpv-control-btn ${showChat ? 'active' : ''}`}>
                    <MessageSquare />
                    {unreadCount > 0 && <span className="vpv-badge">{unreadCount}</span>}
                  </button>
                  <button className="vpv-control-btn" onClick={toggleFullscreen}>
                    {isFullscreen ? <Minimize /> : <Maximize2 />}
                  </button>
                  <button onClick={handleLeaveRoom} className="vpv-leave-btn">Leave</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Side Panel (Chat + Requests) */}
        <div className={`vpv-side-panel ${showChat ? 'visible' : 'hidden'}`}>

          {/* Sidebar Tabs */}
          <div className="vpv-sidebar-tabs">
            <button
              className={`vpv-tab ${sidebarTab === 'chat' ? 'active' : ''}`}
              onClick={() => setSidebarTab('chat')}
            >
              <MessageSquare size={18} />
              Chat
              {unreadCount > 0 && sidebarTab !== 'chat' && (
                <span className="vpv-tab-badge">{unreadCount}</span>
              )}
            </button>
            <button
              className={`vpv-tab ${sidebarTab === 'invite' ? 'active' : ''}`}
              onClick={() => setSidebarTab('invite')}
            >
              <Users size={18} />
              Invite
            </button>
          </div>

          {/* Pending Requests (Host Only) */}
          {isHost && pendingRequests.length > 0 && (
            <div className="vpv-requests-panel">
              <h3>Join Requests ({pendingRequests.length})</h3>
              <div className="vpv-requests-list">
                {pendingRequests.map(req => (
                  <div key={req.userId} className="vpv-request-item">
                    <span>{req.userData?.name || 'User'}</span>
                    <div className="vpv-req-actions">
                      <button className="vpv-btn-approve" onClick={() => handleApproveRequest(req)}><Check size={16} /></button>
                      <button className="vpv-btn-reject" onClick={() => handleRejectRequest(req)}><X size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chat Tab */}
          {sidebarTab === 'chat' && (
            <div className="vpv-chat-area">
              <div className="vpv-chat-header">
                <h3>Live Chat</h3>
              </div>
              <div className="vpv-messages-list">
                {messages.map(msg => (
                  <div key={msg.id} className={`vpv-message ${msg.userId === user.id ? 'own' : ''}`}>
                    <div className="vpv-msg-bubble">
                      <span className="vpv-msg-user">{msg.userName}</span>
                      <p>{msg.text}</p>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <form className="vpv-chat-input-area" onSubmit={handleSendMessage}>
                <div className="vpv-input-wrapper">
                  <input
                    className="vpv-chat-input"
                    value={messageInput}
                    onChange={handleTyping}
                    placeholder="Type a message..."
                  />
                  <button type="submit" className="vpv-send-btn"><Send size={18} /></button>
                </div>
              </form>
            </div>
          )}

          {/* Invite Tab */}
          {sidebarTab === 'invite' && (
            <div className="vpv-invite-area">
              <div className="vpv-invite-header">
                <h3>Invite Friends</h3>
                <p className="vpv-invite-subtitle">Share this room with your friends</p>
              </div>

              {/* Room Code */}
              <div className="vpv-room-code-section">
                <label>Room Code</label>
                <div className="vpv-code-display">
                  <span className="vpv-code-text">{roomId}</span>
                  <button
                    className="vpv-copy-code-btn"
                    onClick={() => {
                      navigator.clipboard.writeText(roomId);
                      alert('Room code copied!');
                    }}
                  >
                    Copy
                  </button>
                </div>
              </div>

              {/* Friends List */}
              <div className="vpv-friends-section">
                <h4>Friends ({friends?.length || 0}) - Online: ({getOnlineFriends()?.length || 0})</h4>
                {console.log('🔍 Debug Info:')}
                {console.log('  All friends:', friends)}
                {console.log('  Online friends:', getOnlineFriends())}
                {console.log('  Socket:', socket)}
                {console.log('  RoomId:', roomId)}
                <div className="vpv-friends-list">
                  {/* Show ALL friends for now, with online indicator */}
                  {friends?.length > 0 ? (
                    friends.map(friend => (
                      <div key={friend.id} className="vpv-friend-item">
                        <img
                          src={friend.avatar_url || friend.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.email || friend.id}`}
                          alt={friend.display_name || friend.name || 'Friend'}
                          className="vpv-friend-avatar"
                        />
                        <div className="vpv-friend-info">
                          <span className="vpv-friend-name">
                            {friend.display_name || friend.name || friend.email?.split('@')[0] || 'Friend'}
                          </span>
                          <span className="vpv-friend-status">
                            {friend.online && <span className="vpv-online-dot"></span>}
                            {friend.online ? 'Online' : 'Offline'}
                          </span>
                        </div>
                        <button
                          className="vpv-invite-btn"
                          onClick={() => {
                            console.log('Invite button clicked for friend:', friend);
                            handleInviteFriend(friend);
                          }}
                          disabled={!friend.online}
                          style={{
                            opacity: friend.online ? 1 : 0.5,
                            cursor: friend.online ? 'pointer' : 'not-allowed'
                          }}
                        >
                          {friend.online ? 'Invite' : 'Offline'}
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="vpv-empty-state">
                      <Users size={48} className="vpv-empty-icon" />
                      <p>No friends yet</p>
                      <span>Add friends to invite them to watch parties</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const VideoTile = ({ peer }) => {
  const ref = useRef();

  useEffect(() => {
    const applyStream = (stream) => {
      if (ref.current && ref.current.srcObject !== stream) {
        ref.current.srcObject = stream;
        ref.current.play().catch(e => console.warn('VideoTile play failed:', e));
      }
    }

    // Check if stream already exists
    if (peer._remoteStreams && peer._remoteStreams.length > 0) {
      applyStream(peer._remoteStreams[0]);
    }

    peer.on("stream", applyStream);
    peer.on("track", (track, stream) => {
      if (stream) applyStream(stream);
    });
  }, [peer]);

  return (
    <div className="vpv-video-tile">
      <video playsInline autoPlay ref={ref} />
    </div>
  );
};

export default WatchPartyVision;
