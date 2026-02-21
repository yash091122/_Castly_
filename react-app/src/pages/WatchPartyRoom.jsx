import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocketContext } from '../context/SocketContext';
import { useFriends } from '../context/FriendsContext';
import { useProfile } from '../context/ProfileContext';
import { getMovieById } from '../data/watchPartyMovies';
import { db } from '../config/supabase';
import { useContent } from '../context/ContentContext';
import { useTvProgress } from '../context/TvProgressContext';
import contentService from '../services/contentService';
import { useNotifications } from '../context/NotificationContext';
import { WatchPartySkeleton } from '../components/skeletons';
import SimplePeerModule from 'simple-peer/simplepeer.min.js';
const SimplePeer = SimplePeerModule.default || SimplePeerModule;
import {
  Play, Pause, Volume2, VolumeX, Maximize, MessageCircle, Users,
  Send, Smile, X, Copy, Check, Video, VideoOff, Mic, MicOff,
  Eye, EyeOff, UserPlus, Crown, UserX, Settings, VolumeOff
} from 'lucide-react';
import '../styles/watch-party-room.css';

// Helper Component for Remote Video Tiles
const VideoTile = ({ peer, stream, participantName = "Participant", participantId, avatar, isAudioEnabled = true, isVideoEnabled = true }) => {
  const ref = useRef();
  const streamRef = useRef(stream);

  // Update streamRef when stream prop changes
  useEffect(() => {
    streamRef.current = stream;
    if (stream && ref.current) {
      if (ref.current.srcObject !== stream) {
        ref.current.srcObject = stream;
        ref.current.play().catch(e => console.warn('VideoTile prop stream play failed:', e));
      }
    }
  }, [stream]);

  useEffect(() => {
    const videoEl = ref.current;
    if (!videoEl) return;

    // Handle incoming stream (from props or from peer event)
    const applyStream = (newStream) => {
      if (!newStream) {
        console.log('📺 VideoTile: No stream to apply for', participantName);
        return;
      }

      const videoTracks = newStream.getVideoTracks();
      console.log('📺 VideoTile: Applying stream for', participantName, 'video tracks:', videoTracks.length, 'enabled:', videoTracks[0]?.enabled);

      if (videoEl.srcObject !== newStream) {
        console.log('📺 VideoTile: Setting new stream for', participantName);
        videoEl.srcObject = newStream;
        videoEl.play().catch(e => console.warn('VideoTile play failed:', e));
      } else {
        console.log('📺 VideoTile: Stream already set for', participantName);
        // Ensure play is called even if it's the same stream, mostly fixes Safari black frame issues
        videoEl.play().catch(e => console.warn('VideoTile play failed:', e));
      }
    };

    // Apply stream from ref (most current)
    if (streamRef.current) {
      applyStream(streamRef.current);
    }

    // 2. Listen for stream/track updates directly from peer
    const handleStream = (remoteStream) => {
      console.log('📺 VideoTile: Received stream event from peer for', participantName);
      streamRef.current = remoteStream;
      applyStream(remoteStream);
    };

    const handleTrack = (track, remoteStream) => {
      console.log('🎵 VideoTile: Received track event from peer for', participantName, track.kind, 'enabled:', track.enabled);
      if (remoteStream) {
        streamRef.current = remoteStream;
        applyStream(remoteStream);
      }
    };

    // Listen for video loaded metadata for extra safety
    const handleMetadata = (e) => {
      console.log('📺 VideoTile: loadedmetadata fired for', participantName);
      if (e.target && e.target.play) {
        e.target.play().catch(err => console.warn('Play blocked on loadedmetadata:', err));
      }
    };

    const handleCanPlay = (e) => {
      console.log('📺 VideoTile: canplay fired for', participantName);
      if (e.target && e.target.play) {
        e.target.play().catch(err => console.warn('Play blocked on canplay:', err));
      }
    };

    videoEl.addEventListener('loadedmetadata', handleMetadata);
    videoEl.addEventListener('canplay', handleCanPlay);

    if (peer) {
      peer.on("stream", handleStream);
      peer.on("track", handleTrack);

      // Check if peer already has remote stream (fallback)
      if (peer._remoteStreams?.length > 0) {
        console.log('📺 VideoTile: Found existing remote stream for', participantName);
        streamRef.current = peer._remoteStreams[0];
        applyStream(peer._remoteStreams[0]);
      }
    }

    return () => {
      videoEl.removeEventListener('loadedmetadata', handleMetadata);
      videoEl.removeEventListener('canplay', handleCanPlay);
      if (peer) {
        peer.off("stream", handleStream);
        peer.off("track", handleTrack);
      }
      // DON'T clear srcObject on cleanup - let it persist
    };
  }, [peer, participantName]); // Removed stream from dependencies to prevent re-runs

  const defaultAvatar = avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${participantId || participantName}`;

  console.log('🎨 VideoTile render:', participantName, 'isVideoEnabled:', isVideoEnabled, 'avatar:', avatar, 'defaultAvatar:', defaultAvatar);

  return (
    <div className="wp-participant-tile">
      {/* Video element - always present but hidden when video is off */}
      <video
        playsInline
        autoPlay
        ref={ref}
        style={{
          display: isVideoEnabled ? 'block' : 'none',
          width: '100%',
          height: '100%',
          objectFit: 'cover'
        }}
      />

      {/* Avatar fallback when video is off */}
      {!isVideoEnabled && (
        <div className="wp-tile-avatar-fallback">
          <img
            src={defaultAvatar}
            alt={participantName}
            onError={(e) => {
              console.warn('Avatar failed to load for', participantName, 'trying fallback');
              e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${participantId || participantName}`;
            }}
          />
        </div>
      )}

      <div className="wp-participant-name">{participantName}</div>
      <div className="wp-participant-status">
        {!isAudioEnabled && (
          <div className="status-icon muted">
            <MicOff size={12} />
          </div>
        )}
        {!isVideoEnabled && (
          <div className="status-icon video-off">
            <VideoOff size={12} />
          </div>
        )}
      </div>
    </div>
  );
}

function WatchPartyRoom() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { socket, onlineUsers } = useSocketContext();
  const { friends } = useFriends();
  const { addToast } = useNotifications();
  const { getMovie, getTvShow } = useContent();
  const { getEpisodeProgress } = useTvProgress() || {};

  // Room IDs
  const roomId = searchParams.get('room');
  const movieId = searchParams.get('movie');
  const [isHost, setIsHost] = useState(searchParams.get('host') === 'true');
  const isHostRef = useRef(searchParams.get('host') === 'true');
  const [movieData, setMovieData] = useState(null);

  // Video/Media State
  const [participants, setParticipants] = useState([]); // List for Sidebar
  const [peers, setPeers] = useState([]); // Array of { socketId, peer, name }
  const peersRef = useRef([]); // Keep track of peer objects
  const [stream, setStream] = useState(null);
  const streamRef = useRef(null);

  // Controls State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showVideoControls, setShowVideoControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [quality, setQuality] = useState('Auto');
  const [showEpisodeSidebar, setShowEpisodeSidebar] = useState(false);
  const [viewingSeason, setViewingSeason] = useState(null);
  const [isHostBuffering, setIsHostBuffering] = useState(false); // true when host video is buffering
  const [isVideoLoading, setIsVideoLoading] = useState(false); // true when local video is buffering

  // Local Media State
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const userVideo = useRef();

  // Chat State
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [activeTab, setActiveTab] = useState('chat');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', onConfirm: null });
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Emoji categories
  const emojiCategories = {
    smileys: ['😀', '😂', '🤣', '😊', '😍', '🥰', '😘', '😜', '🤪', '😎', '🥳', '😇', '🤩', '🤗', '🤔', '🤫', '🤭', '😈', '👿', '💀'],
    gestures: ['👍', '👎', '👏', '🙌', '🤝', '✌️', '🤞', '🤟', '🤙', '👋', '💪', '🙏', '✋', '🖐️', '👊', '🤛', '🤜', '👌', '🤌', '👆'],
    hearts: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❤️‍🔥', '💕', '💞', '💓', '💗', '💖', '💝', '💘', '💌', '💟'],
    objects: ['🎬', '🍿', '📺', '🎥', '🎞️', '🎭', '🎪', '🎤', '🎧', '🎼', '🎵', '🎶', '🔥', '⭐', '✨', '💥', '💫', '🌟', '⚡', '🏆'],
    reactions: ['😱', '😰', '😨', '😮', '😲', '🤯', '😳', '😬', '😭', '😢', '😤', '🤬', '😡', '😠', '😴', '🥱', '😪', '🤤', '🤢', '🤮']
  };
  const [copied, setCopied] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const showSidebarRef = useRef(showSidebar);

  // Sync ref with state
  useEffect(() => {
    showSidebarRef.current = showSidebar;
  }, [showSidebar]);

  // Host Controls State
  const [showHostControls, setShowHostControls] = useState(false);
  const [mutedParticipants, setMutedParticipants] = useState(new Set());
  const [videoOffParticipants, setVideoOffParticipants] = useState(new Set());
  const [joinRequests, setJoinRequests] = useState([]);
  const [activeAlert, setActiveAlert] = useState(null); // { title, message, type: 'info'|'error', onDismiss }

  const videoRef = useRef(null);
  const chatEndRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  const videoControlsTimeoutRef = useRef(null);
  const hasJoinedRoom = useRef(false);
  const stageRef = useRef(null);
  const cinemaScreenRef = useRef(null);
  const chatInputRef = useRef(null);

  // Sync local stream with ref
  useEffect(() => {
    if (stream && userVideo.current) {
      console.log('📹 Syncing local stream to ref');
      userVideo.current.srcObject = stream;
    }
  }, [stream]);

  // --- 1. Load Content (Movie or TV) ---
  useEffect(() => {
    const loadContent = async () => {
      console.log('🔄 loadContent called for:', movieId);

      // 1. Try local/static movie data first
      let content = getMovieById(movieId);
      if (content) {
        console.log('✅ Found local MOVIE for:', movieId);
        setMovieData({ ...content, type: 'movie' });
        return;
      }

      // 2. Try local/static TV show data
      const { getTvShowById: getStaticTvShow } = await import('../data/tvShows');
      content = getStaticTvShow(movieId);
      if (content) {
        console.log('✅ Found local TV SHOW for:', movieId);
        const currentSeason = parseInt(searchParams.get('season') || '1');
        const currentEpisode = parseInt(searchParams.get('episode') || '1');
        setViewingSeason(currentSeason);

        // Get episode video URL
        let videoUrl = content.videoUrl;
        const season = content.seasons?.find(s => s.seasonNumber === currentSeason);
        if (season) {
          const episode = season.episodes?.find(e => e.episodeNumber === currentEpisode);
          if (episode?.videoUrl) videoUrl = episode.videoUrl;
        }

        setMovieData({
          ...content,
          type: 'tv',
          videoUrl,
          currentSeason,
          currentEpisode
        });
        return;
      }

      // 2. Try Supabase data via ContentContext
      try {
        let type = searchParams.get('type') || 'movie';
        let contentType = type;
        console.log('🔎 Searching Supabase for:', movieId, 'Type:', type);

        if (type === 'movie') {
          content = await getMovie(movieId);
          // Smart Fallback: If not found as movie, try TV
          if (!content) {
            console.log('🤔 Not found as movie, checking if it is a TV show...');
            const tvContent = await getTvShow(movieId);
            if (tvContent) {
              console.log('✅ Found as TV Show! Switching type.');
              content = tvContent;
              contentType = 'tv';
            }
          }
        } else if (type === 'tv') {
          content = await getTvShow(movieId);
          // Smart Fallback: If not found as TV, try Movie
          if (!content) {
            console.log('🤔 Not found as TV show, checking if it is a movie...');
            const movieContent = await getMovie(movieId);
            if (movieContent) {
              console.log('✅ Found as Movie! Switching type.');
              content = movieContent;
              contentType = 'movie';
            }
          }

          if (content) {
            // Set initial viewing season for TV shows
            const s = parseInt(searchParams.get('season') || '1');
            setViewingSeason(s);
          }
        }

        if (content) {
          const currentSeason = parseInt(searchParams.get('season') || '1');
          const currentEpisode = parseInt(searchParams.get('episode') || '1');

          console.log('🎬 Loaded content:', {
            id: content.id,
            title: content.title,
            type: contentType,
            hasSeasons: !!content.seasons,
            seasonsCount: content.seasons?.length || 0,
            currentSeason,
            currentEpisode
          });

          // For TV shows, load the specific episode
          let videoUrl = content.videoUrl;
          if (contentType === 'tv' && content.seasons) {
            try {
              const episodeData = await contentService.getEpisodeById(movieId, currentSeason, currentEpisode);
              if (episodeData && episodeData.videoUrl) {
                videoUrl = episodeData.videoUrl;
              }
            } catch (err) {
              console.error('Failed to load episode:', err);
            }
          }

          setMovieData({
            ...content,
            id: content.id,
            title: content.title,
            poster: content.posterUrl || content.poster,
            videoUrl: videoUrl,
            type: contentType,
            seasons: content.seasons || [],
            currentSeason: contentType === 'tv' ? currentSeason : undefined,
            currentEpisode: contentType === 'tv' ? currentEpisode : undefined
          });
        } else {
          // Fallback
          console.error('❌ Content not found for:', movieId, type, '- Falling back to Big Buck Bunny');
          setMovieData(getMovieById('big-buck-bunny'));
        }
      } catch (err) {
        console.error('❌ Error loading content for watch party:', err);
        setMovieData(getMovieById('big-buck-bunny'));
      }
    };

    if (movieId) {
      loadContent();
    }
  }, [movieId, getMovie, getTvShow, searchParams]);

  // --- 2. Initialize Media & Join Room ---
  useEffect(() => {
    if (!user || !roomId || !socket) return;

    // We use a local flag to track if THIS specific effect instance is active.
    // This prevents race conditions (like in StrictMode) where a previous effect's 
    // getUserMedia promise resolves after the new effect has started.
    let isMounted = true;

    if (hasJoinedRoom.current) {
      console.log('⚠️ Already joined room, skipping');
      return;
    }

    hasJoinedRoom.current = true;
    let currentStream = null;

    // Map to store socketId -> userName for quick lookup
    const socketToName = new Map();

    // Helper to get name for a socket
    const getNameForSocket = (socketId, fallbackName) => {
      return socketToName.get(socketId) || fallbackName || 'Participant';
    };

    // Helper to update peer data (name and avatar)
    const updatePeerData = (socketId, { name, avatar }) => {
      const updates = {};
      if (name && name !== 'Participant') updates.name = name;
      if (avatar) updates.avatar = avatar;

      if (Object.keys(updates).length === 0) return;

      if (updates.name) {
        socketToName.set(socketId, updates.name);
      }

      // Update in peersRef
      const peerRef = peersRef.current.find(p => p.socketId === socketId);
      if (peerRef) {
        Object.assign(peerRef, updates);
      }

      // Update in state
      setPeers(prev => prev.map(p =>
        p.socketId === socketId ? { ...p, ...updates } : p
      ));
    };

    // Helper to check if peer already exists
    const peerExists = (socketId) => {
      return peersRef.current.some(p => p.socketId === socketId);
    };

    // Deterministic initiator selection to avoid offer glare:
    // exactly one side should initiate for any socket pair.
    const shouldInitiatePeer = (targetSocketId) => {
      if (!socket?.id || !targetSocketId) return false;
      return socket.id < targetSocketId;
    };

    // Helper to add peer to both ref and state
    const addPeer = (socketId, peer, name, odId = null, avatar = null) => {
      if (peerExists(socketId)) {
        console.log('  ⚠️ Peer already exists for:', socketId);
        return false;
      }
      const finalName = getNameForSocket(socketId, name);
      const peerData = { socketId, peer, name: finalName, odId, avatar };
      peersRef.current.push(peerData);
      setPeers(prev => [...prev, { ...peerData, stream: null }]);
      console.log('  ✅ Added peer:', socketId, finalName, 'odId:', odId, 'Total:', peersRef.current.length);
      return true;
    };

    // Helper to create peer connection
    const createPeer = (targetSocketId, initiator, peerName) => {
      if (peerExists(targetSocketId)) {
        console.log('  ⚠️ Peer already exists, skipping:', targetSocketId);
        return null;
      }
      // Allow connection even without local stream (receive-only)
      const streamToSend = currentStream || null;
      if (!streamToSend) {
        console.log('  ⚠️ No local stream available, joining as receive-only');
      } else {
        console.log('  📹 Sending local stream in peer creation:', {
          streamId: streamToSend.id,
          active: streamToSend.active,
          tracks: streamToSend.getTracks().map(t => ({ kind: t.kind, enabled: t.enabled, id: t.id, readyState: t.readyState }))
        });
      }

      const finalName = getNameForSocket(targetSocketId, peerName);
      console.log(`🔗 Creating peer (${initiator ? 'INITIATOR' : 'RECEIVER'}) for:`, targetSocketId, finalName);

      const peer = new SimplePeer({
        initiator,
        trickle: true,
        stream: streamToSend,
        config: {
          iceServers: [
            // Google STUN servers
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' },
            // Twilio STUN
            { urls: 'stun:global.stun.twilio.com:3478' },
            // OpenRelay TURN servers (multiple endpoints)
            {
              urls: 'turn:openrelay.metered.ca:80',
              username: 'openrelayproject',
              credential: 'openrelayproject'
            },
            {
              urls: 'turn:openrelay.metered.ca:443',
              username: 'openrelayproject',
              credential: 'openrelayproject'
            },
            {
              urls: 'turn:openrelay.metered.ca:443?transport=tcp',
              username: 'openrelayproject',
              credential: 'openrelayproject'
            },
            // Relay servers
            {
              urls: 'turn:relay.metered.ca:80',
              username: 'openrelayproject',
              credential: 'openrelayproject'
            },
            {
              urls: 'turn:relay.metered.ca:443',
              username: 'openrelayproject',
              credential: 'openrelayproject'
            },
            {
              urls: 'turn:relay.metered.ca:443?transport=tcp',
              username: 'openrelayproject',
              credential: 'openrelayproject'
            },
            // Numb TURN
            {
              urls: 'turn:numb.viagenie.ca',
              username: 'webrtc@live.com',
              credential: 'muazkh'
            },
            // Additional STUN servers for better connectivity
            { urls: 'stun:stun.services.mozilla.com' },
            { urls: 'stun:stun.stunprotocol.org:3478' }
          ],
          sdpSemantics: 'unified-plan',
          iceTransportPolicy: 'all',
          iceCandidatePoolSize: 10,
          bundlePolicy: 'max-bundle',
          rtcpMuxPolicy: 'require'
        },
        offerOptions: {
          offerToReceiveAudio: true,
          offerToReceiveVideo: true
        },
        channelConfig: {},
        channelName: `peer-${targetSocketId}`
      });

      const myName = profile?.display_name || user?.email?.split('@')[0];
      const myAvatar = profile?.avatar_url;

      peer.on("signal", signal => {
        console.log('📡 Sending signal to:', targetSocketId, 'type:', signal.type, 'myName:', myName);
        if (signal.type === 'offer' || signal.type === 'answer') {
          console.log('  SDP:', signal.sdp?.substring(0, 100) + '...');
        } else if (signal.candidate) {
          console.log('  ICE Candidate:', signal.candidate.candidate?.substring(0, 80));
        }
        socket.emit("signal", {
          to: targetSocketId,
          from: socket.id,
          signal,
          userName: myName,
          userId: user?.id,
          userAvatar: myAvatar
        });
      });

      peer.on('stream', remoteStream => {
        console.log('📺 RECEIVED STREAM from:', targetSocketId, 'streamId:', remoteStream.id, 'tracks:', remoteStream.getTracks().map(t => ({ kind: t.kind, enabled: t.enabled })));
        // Update both ref and state
        const peerRef = peersRef.current.find(p => p.socketId === targetSocketId);
        if (peerRef) {
          peerRef.stream = remoteStream;
          console.log('  ✅ Updated peerRef.stream');
        }
        setPeers(prev => {
          const updated = prev.map(p =>
            p.socketId === targetSocketId ? { ...p, stream: remoteStream } : p
          );
          console.log('  ✅ Updated peers state');
          return updated;
        });
      });

      peer.on('track', (track, remoteStream) => {
        console.log('🎵 RECEIVED TRACK from:', targetSocketId, track.kind, 'enabled:', track.enabled, 'readyState:', track.readyState);
        if (remoteStream) {
          // Update both ref and state
          const peerRef = peersRef.current.find(p => p.socketId === targetSocketId);
          if (peerRef) {
            peerRef.stream = remoteStream;
          }
          setPeers(prev => prev.map(p =>
            p.socketId === targetSocketId ? { ...p, stream: remoteStream } : p
          ));
        }
      });

      peer.on('connect', () => {
        console.log('✅ PEER CONNECTED:', targetSocketId);
        // Log the peer connection state
        if (peer._pc) {
          console.log('  Connection state:', peer._pc.connectionState);
          console.log('  ICE state:', peer._pc.iceConnectionState);
          console.log('  Signaling state:', peer._pc.signalingState);
          console.log('  Local streams:', peer._pc.getLocalStreams?.()?.length || 'N/A');
          console.log('  Remote streams:', peer._pc.getRemoteStreams?.()?.length || 'N/A');
        }
      });

      peer.on('error', err => {
        // Ignore known benign errors during cleanup
        if (err.code === 'ERR_DATA_CHANNEL' || err.message.includes('User-Initiated Abort')) {
          return;
        }
        console.error('❌ Peer Error:', targetSocketId, err.message, err);

        // Log ICE connection state for debugging
        if (peer._pc) {
          console.log('  ICE Connection State:', peer._pc.iceConnectionState);
          console.log('  Connection State:', peer._pc.connectionState);
        }

        // Clean up failed peer
        if (err.message.includes('Connection failed') || err.message.includes('setRemoteDescription')) {
          console.log('🧹 Cleaning up failed peer:', targetSocketId);
          try {
            peer.destroy();
          } catch (e) {
            console.log('  Peer already destroyed');
          }
          peersRef.current = peersRef.current.filter(p => p.socketId !== targetSocketId);
          setPeers(prev => prev.filter(p => p.socketId !== targetSocketId));
        }
      });

      peer.on('close', () => {
        console.log('🔌 Peer Closed:', targetSocketId);
        // Clean up closed peer
        peersRef.current = peersRef.current.filter(p => p.socketId !== targetSocketId);
        setPeers(prev => prev.filter(p => p.socketId !== targetSocketId));
      });

      // Monitor ICE connection state
      peer._pc.addEventListener('iceconnectionstatechange', () => {
        const state = peer._pc.iceConnectionState;
        console.log(`🧊 ICE Connection State (${targetSocketId}):`, state);

        if (state === 'failed') {
          console.warn(`⚠️ ICE connection failed for ${targetSocketId}`);
        }
      });

      return peer;
    };

    // Socket event handlers
    const handleRoomState = (state) => {
      console.log('📋 Room state received, participants:', state.participants?.length);
      console.log('   hostId:', state.hostId, 'my userId:', user?.id);
      console.log('   Server movieId:', state.movieId, 'movieTitle:', state.movieTitle);
      console.log('   My movieId:', movieId);
      console.log('   contentType:', state.contentType, 'season:', state.currentSeason, 'episode:', state.currentEpisode);
      console.log('   videoUrl:', state.videoUrl);
      console.log('   playbackState:', state.playbackState);

      // Authroritative host sync
      const currentHostId = state.hostId;
      const syncedParticipants = (state.participants || []).map(p => ({
        ...p,
        isHost: p.id === currentHostId
      }));

      setParticipants(syncedParticipants);
      const amIHost = currentHostId === user?.id;
      setIsHost(amIHost);
      isHostRef.current = amIHost;
      console.log('   Am I host?', amIHost, 'HostId:', currentHostId);

      // CRITICAL: Sync overall content and episode state for guests
      const serverMovieId = state.movieId;
      if (!amIHost) {
        let movieChanged = serverMovieId && serverMovieId !== movieId;
        let episodeChanged = state.contentType === 'tv' && state.currentSeason && state.currentEpisode &&
          (parseInt(searchParams.get('season') || '1') !== state.currentSeason ||
            parseInt(searchParams.get('episode') || '1') !== state.currentEpisode);

        if (movieChanged || episodeChanged) {
          const syncContent = async () => {
            let baseContent = movieData;
            const targetId = serverMovieId || movieId;

            if (movieChanged || !baseContent) {
              try {
                const { getMovieById } = await import('../data/movies');
                let content = getMovieById(targetId);
                if (!content) {
                  const { getTvShowById } = await import('../data/tvShows');
                  content = getTvShowById(targetId);
                }
                if (content) baseContent = content;
              } catch (err) {
                console.error('Failed to sync movie locally:', err);
              }
            }
            if (!baseContent) return;

            let finalContent = { ...baseContent };
            if (state.contentType === 'tv' && state.currentSeason && state.currentEpisode) {
              const hostSeason = state.currentSeason;
              const hostEpisode = state.currentEpisode;

              let resolvedVideoUrl = state.videoUrl || '';
              if (!resolvedVideoUrl && finalContent.seasons) {
                const seasonData = finalContent.seasons.find(s => s.seasonNumber === hostSeason);
                const epData = seasonData?.episodes?.find(e => e.episodeNumber === hostEpisode);
                if (epData?.videoUrl) resolvedVideoUrl = epData.videoUrl;
              }
              if (!resolvedVideoUrl) {
                try {
                  // Fallback to contentService
                  const epData = await contentService.getEpisodeById(targetId, hostSeason, hostEpisode);
                  if (epData?.videoUrl) resolvedVideoUrl = epData.videoUrl;
                } catch (e) { console.warn(e); }
              }

              finalContent.videoUrl = resolvedVideoUrl;
              finalContent.currentSeason = hostSeason;
              finalContent.currentEpisode = hostEpisode;

              const newParams = new URLSearchParams(searchParams);
              newParams.set('season', hostSeason);
              newParams.set('episode', hostEpisode);
              if (movieChanged) newParams.set('movie', targetId);
              setSearchParams(newParams, { replace: true });
            } else if (movieChanged) {
              const newParams = new URLSearchParams(searchParams);
              newParams.set('movie', targetId);
              setSearchParams(newParams, { replace: true });
            }
            setMovieData(finalContent);
          };
          syncContent();
        }
      }

      // Sync playback state for guests (runs after episode sync queues its update)
      if (!amIHost && state.playbackState) {
        const { currentTime, isPlaying } = state.playbackState;
        console.log('   🔄 Syncing to playback state:', { currentTime, isPlaying });

        const syncPlayback = () => {
          if (videoRef.current) {
            videoRef.current.currentTime = currentTime || 0;
            if (isPlaying) {
              videoRef.current.play().catch(err => console.error('Autoplay failed:', err));
              setIsPlaying(true);
            }
          }
        };

        // Queue after a short delay to allow episode update to propagate first
        if (videoRef.current) {
          if (videoRef.current.readyState >= 2) {
            syncPlayback();
          } else {
            videoRef.current.addEventListener('canplay', syncPlayback, { once: true });
          }
        } else {
          // Video element not mounted yet - try again shortly
          setTimeout(syncPlayback, 800);
        }
      }
    };

    const handleExistingParticipants = (existingParticipants) => {
      console.log('👥 Existing participants:', existingParticipants.length);

      existingParticipants.forEach(({ socketId, odId, userData }) => {
        if (socketId === socket.id) return;

        const peerName = userData?.name || 'Participant';
        const peerAvatar = userData?.avatar || null;
        // Store the mapping
        if (peerName && peerName !== 'Participant') {
          socketToName.set(socketId, peerName);
        }

        if (shouldInitiatePeer(socketId)) {
          const peer = createPeer(socketId, true, peerName);
          if (peer) {
            addPeer(socketId, peer, peerName, odId, peerAvatar);
          }
        }
      });
    };

    const handleParticipantJoined = ({ userData, socketId }) => {
      const peerName = userData?.name || 'Participant';
      console.log('👤 Participant joined/updated:', peerName, 'socketId:', socketId);

      // Store the mapping FIRST
      if (peerName && peerName !== 'Participant') {
        socketToName.set(socketId, peerName);
      }

      // Update participants list - UPDATE if exists, ADD if not
      setParticipants(prev => {
        const existing = prev.find(p => p.id === userData?.id);
        if (existing) {
          return prev.map(p => p.id === userData?.id ? { ...p, ...userData, name: peerName } : p);
        }
        return [...prev, { id: userData?.id, name: peerName, ...userData }];
      });

      // Update peer name if peer already exists (signal arrived first)
      updatePeerData(socketId, { name: peerName, avatar: userData?.avatar });

      // Existing participants should initiate to the new participant based on socket ordering.
      // This provides a reliable fallback if the opposite side did not initiate.
      if (socketId && socketId !== socket.id && !peerExists(socketId) && shouldInitiatePeer(socketId)) {
        const peer = createPeer(socketId, true, peerName);
        if (peer) {
          addPeer(socketId, peer, peerName, userData?.id || null, userData?.avatar || null);
        }
      }
    };

    const handleParticipantLeft = ({ socketId }) => {
      console.log('👋 Participant left:', socketId);

      socketToName.delete(socketId);

      const peerObj = peersRef.current.find(p => p.socketId === socketId);
      if (peerObj) {
        peerObj.peer?.destroy();
        peersRef.current = peersRef.current.filter(p => p.socketId !== socketId);
        setPeers(prev => prev.filter(p => p.socketId !== socketId));
      }
      setParticipants(prev => prev.filter(p => p.socketId !== socketId));
    };

    const handleSignal = ({ signal, from, userName, userId, userAvatar }) => {
      console.log('📡 Signal RECEIVED from:', from, 'userName:', userName, 'type:', signal.type);

      // Store the name mapping if we got a valid name
      if (userName && userName !== 'Participant') {
        socketToName.set(from, userName);
      }

      const existingPeer = peersRef.current.find(p => p.socketId === from);

      if (existingPeer) {
        console.log('  ✅ Found existing peer, passing signal');

        // Check if peer is destroyed
        if (existingPeer.peer.destroyed) {
          console.warn('  ⚠️ Peer is destroyed, removing and creating new one');
          peersRef.current = peersRef.current.filter(p => p.socketId !== from);
          setPeers(prev => prev.filter(p => p.socketId !== from));
          // Fall through to create new peer
        } else {
          // Check signaling state before applying signal
          const signalingState = existingPeer.peer._pc?.signalingState;
          console.log('  Current signaling state:', signalingState, 'Signal type:', signal.type);

          // Prevent applying answer in stable state
          if (signal.type === 'answer' && signalingState === 'stable') {
            console.warn('  ⚠️ Ignoring answer in stable state - peer already connected or wrong state');
            return;
          }

          // Prevent applying offer if we already have one
          if (signal.type === 'offer' && (signalingState === 'have-local-offer' || signalingState === 'have-remote-offer')) {
            console.warn('  ⚠️ Received offer but already in offer state, recreating peer');
            try {
              existingPeer.peer.destroy();
            } catch (e) {
              console.log('  Peer already destroyed');
            }
            peersRef.current = peersRef.current.filter(p => p.socketId !== from);
            setPeers(prev => prev.filter(p => p.socketId !== from));
            // Fall through to create new peer
          } else {
            // Update name/avatar if improved
            const newName = getNameForSocket(from, userName);
            updatePeerData(from, { name: newName, avatar: userAvatar });
            try {
              existingPeer.peer.signal(signal);
              return; // Exit early if successful
            } catch (err) {
              console.error('❌ Signal error:', err);
              // If signaling fails, clean up and create new peer
              try {
                existingPeer.peer.destroy();
              } catch (e) {
                console.log('  Peer already destroyed');
              }
              peersRef.current = peersRef.current.filter(p => p.socketId !== from);
              setPeers(prev => prev.filter(p => p.socketId !== from));
              // Fall through to create new peer
            }
          }
        }
      }

      // Only create new peer if we received an offer (not an answer or candidate)
      if (signal.type !== 'offer') {
        console.warn('  ⚠️ No existing peer and signal is not an offer, ignoring');
        return;
      }

      // Create new peer (either no existing peer or existing one failed)
      // New peer - we're receiving, so NOT initiator
      // CRITICAL FIX: Use streamRef.current instead of currentStream
      const peerName = getNameForSocket(from, userName);
      const localStream = streamRef.current;
      console.log('🔗 Creating RECEIVER peer for:', from, 'with stream:', !!localStream);

      if (localStream) {
        console.log('  📹 Local stream details:', {
          id: localStream.id,
          active: localStream.active,
          tracks: localStream.getTracks().map(t => ({
            kind: t.kind,
            id: t.id,
            enabled: t.enabled,
            readyState: t.readyState
          }))
        });
      } else {
        console.warn('  ⚠️ NO LOCAL STREAM AVAILABLE - peer will be receive-only');
      }

      const peer = new SimplePeer({
        initiator: false,
        trickle: true,
        stream: localStream || null,
        config: {
          iceServers: [
            // Google STUN servers
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' },
            // Twilio STUN
            { urls: 'stun:global.stun.twilio.com:3478' },
            // OpenRelay TURN servers (multiple endpoints)
            {
              urls: 'turn:openrelay.metered.ca:80',
              username: 'openrelayproject',
              credential: 'openrelayproject'
            },
            {
              urls: 'turn:openrelay.metered.ca:443',
              username: 'openrelayproject',
              credential: 'openrelayproject'
            },
            {
              urls: 'turn:openrelay.metered.ca:443?transport=tcp',
              username: 'openrelayproject',
              credential: 'openrelayproject'
            },
            // Relay servers
            {
              urls: 'turn:relay.metered.ca:80',
              username: 'openrelayproject',
              credential: 'openrelayproject'
            },
            {
              urls: 'turn:relay.metered.ca:443',
              username: 'openrelayproject',
              credential: 'openrelayproject'
            },
            {
              urls: 'turn:relay.metered.ca:443?transport=tcp',
              username: 'openrelayproject',
              credential: 'openrelayproject'
            },
            // Numb TURN
            {
              urls: 'turn:numb.viagenie.ca',
              username: 'webrtc@live.com',
              credential: 'muazkh'
            },
            // Additional STUN servers for better connectivity
            { urls: 'stun:stun.services.mozilla.com' },
            { urls: 'stun:stun.stunprotocol.org:3478' }
          ],
          sdpSemantics: 'unified-plan',
          iceTransportPolicy: 'all',
          iceCandidatePoolSize: 10,
          bundlePolicy: 'max-bundle',
          rtcpMuxPolicy: 'require'
        },
        answerOptions: {
          offerToReceiveAudio: true,
          offerToReceiveVideo: true
        },
        channelConfig: {},
        channelName: `peer-${from}`
      });

      const myName = profile?.display_name || user?.email?.split('@')[0];
      const myAvatar = profile?.avatar_url;

      peer.on("signal", sig => {
        console.log('📡 Sending signal to:', from, 'type:', sig.type, 'myName:', myName);
        if (sig.type === 'offer' || sig.type === 'answer') {
          console.log('  SDP:', sig.sdp?.substring(0, 100) + '...');
        } else if (sig.candidate) {
          console.log('  ICE Candidate:', sig.candidate.candidate?.substring(0, 80));
        }
        socket.emit("signal", {
          to: from,
          from: socket.id,
          signal: sig,
          userName: myName,
          userId: user?.id,
          userAvatar: myAvatar
        });
      });

      peer.on('stream', remoteStream => {
        console.log('📺 RECEIVED STREAM from:', from, 'streamId:', remoteStream.id, 'tracks:', remoteStream.getTracks().map(t => ({ kind: t.kind, enabled: t.enabled })));
        const peerRef = peersRef.current.find(p => p.socketId === from);
        if (peerRef) {
          peerRef.stream = remoteStream;
          console.log('  ✅ Updated peerRef.stream');
        }
        setPeers(prev => {
          const updated = prev.map(p =>
            p.socketId === from ? { ...p, stream: remoteStream } : p
          );
          console.log('  ✅ Updated peers state');
          return updated;
        });
      });

      peer.on('track', (track, remoteStream) => {
        console.log('🎵 RECEIVED TRACK from:', from, track.kind, 'enabled:', track.enabled, 'readyState:', track.readyState);
        if (remoteStream) {
          const peerRef = peersRef.current.find(p => p.socketId === from);
          if (peerRef) {
            peerRef.stream = remoteStream;
          }
          setPeers(prev => prev.map(p =>
            p.socketId === from ? { ...p, stream: remoteStream } : p
          ));
        }
      });

      peer.on('connect', () => {
        console.log('✅ PEER CONNECTED:', from);
        if (peer._pc) {
          console.log('  Connection state:', peer._pc.connectionState);
          console.log('  ICE state:', peer._pc.iceConnectionState);
          console.log('  Signaling state:', peer._pc.signalingState);
        }
      });

      peer.on('error', err => {
        if (err.code === 'ERR_DATA_CHANNEL' || err.message.includes('User-Initiated Abort')) {
          return;
        }
        console.error('❌ Peer Error:', from, err.message, err);

        // Log ICE connection state for debugging
        if (peer._pc) {
          console.log('  ICE Connection State:', peer._pc.iceConnectionState);
          console.log('  Connection State:', peer._pc.connectionState);
        }

        // Clean up failed peer
        if (err.message.includes('Connection failed') || err.message.includes('setRemoteDescription')) {
          console.log('🧹 Cleaning up failed peer:', from);
          try {
            peer.destroy();
          } catch (e) {
            console.log('  Peer already destroyed');
          }
          peersRef.current = peersRef.current.filter(p => p.socketId !== from);
          setPeers(prev => prev.filter(p => p.socketId !== from));
        }
      });

      peer.on('close', () => {
        console.log('🔌 Peer Closed:', from);
        // Clean up closed peer
        peersRef.current = peersRef.current.filter(p => p.socketId !== from);
        setPeers(prev => prev.filter(p => p.socketId !== from));
      });

      // Monitor ICE connection state
      peer._pc.addEventListener('iceconnectionstatechange', () => {
        const state = peer._pc.iceConnectionState;
        console.log(`🧊 ICE Connection State (${from}):`, state);

        if (state === 'failed') {
          console.warn(`⚠️ ICE connection failed for ${from}`);
        }
      });

      try {
        addPeer(from, peer, peerName, userId || null, userAvatar || null);
        console.log('  ✅ Added peer to list, now signaling...');
        peer.signal(signal);
      } catch (err) {
        console.error('❌ Signal error:', err);
      }
    };

    // Host Transfer Handlers
    const handleHostChanged = ({ newHostId }) => {
      setParticipants(prev => prev.map(p => ({
        ...p,
        isHost: p.id === newHostId
      })));

      const amINewHost = newHostId === user?.id;
      setIsHost(amINewHost);
      isHostRef.current = amINewHost;
      console.log('👑 Host changed to:', newHostId, 'Am I the new host?', amINewHost);
    };

    const handleHostPromoted = () => {
      setIsHost(true);
      isHostRef.current = true;
      setParticipants(prev => prev.map(p => ({
        ...p,
        isHost: p.id === user.id
      })));
      setActiveAlert({
        title: 'You are the Host!',
        message: 'You have been promoted to host of this watch party.',
        type: 'info'
      });
    };

    const handleHostDemoted = () => {
      setIsHost(false);
      isHostRef.current = false;
      setParticipants(prev => prev.map(p => ({
        ...p,
        isHost: false // Will be updated by host:changed or room:state
      })));
    };

    // Media status handler
    const handleMediaStatus = ({ userId, type, enabled }) => {
      console.log('🎥 Media status update:', userId, type, enabled);

      if (type === 'video') {
        setVideoOffParticipants(prev => {
          const newSet = new Set(prev);
          if (enabled) {
            newSet.delete(userId);
          } else {
            newSet.add(userId);
          }
          return newSet;
        });
      } else if (type === 'audio') {
        setMutedParticipants(prev => {
          const newSet = new Set(prev);
          if (enabled) {
            newSet.delete(userId);
          } else {
            newSet.add(userId);
          }
          return newSet;
        });
      }
    };

    // Room details updated handler (for episode switching)
    const handleRoomDetailsUpdated = async ({ movieId: newMovieId, movieTitle, contentType, season, episode, videoUrl }) => {
      console.log('📺 Room details updated:', { movieId: newMovieId, contentType, season, episode, videoUrl });

      if (!isHostRef.current) {
        // Guest receives episode change from host
        let baseContent = movieData;

        if (newMovieId && newMovieId !== movieId) {
          // Movie/show changed
          try {
            const { getMovieById } = await import('../data/movies');
            let content = getMovieById(newMovieId);
            if (!content) {
              const { getTvShowById } = await import('../data/tvShows');
              content = getTvShowById(newMovieId);
            }
            if (content) baseContent = content;
          } catch (err) {
            console.error('Failed to load new content:', err);
          }
        }

        if (baseContent && contentType === 'tv' && season && episode) {
          // Update to new episode
          setMovieData({
            ...baseContent,
            videoUrl: videoUrl || '',
            currentSeason: season,
            currentEpisode: episode,
            type: 'tv'
          });

          const newParams = new URLSearchParams(searchParams);
          newParams.set('season', season);
          newParams.set('episode', episode);
          if (newMovieId) newParams.set('movie', newMovieId);
          setSearchParams(newParams, { replace: true });

          // Reset playback
          setCurrentTime(0);
          setIsPlaying(false);

          console.log('✅ Guest synced to S' + season + 'E' + episode);
        }
      }
    };

    // Register listeners helper
    const registerListeners = () => {
      socket.on('room:state', handleRoomState);
      socket.on('room:existing_participants', handleExistingParticipants);
      socket.on('participant:joined', handleParticipantJoined);
      socket.on('participant:left', handleParticipantLeft);
      socket.on('signal', handleSignal);
      socket.on('media:status', handleMediaStatus);
      socket.on('room:details_updated', handleRoomDetailsUpdated);

      // Host transfer listeners
      socket.on('host:changed', handleHostChanged);
      socket.on('host:promoted', handleHostPromoted);
      socket.on('host:demoted', handleHostDemoted);
    };

    const emitJoin = () => {
      const contentType = searchParams.get('type') || 'movie';
      const currentSeason = contentType === 'tv' ? parseInt(searchParams.get('season') || '1') : null;
      const currentEpisode = contentType === 'tv' ? parseInt(searchParams.get('episode') || '1') : null;

      socket.emit('room:join', {
        roomId,
        odId: user.id,
        isHost,
        movieId,
        movieTitle: movieData?.title,
        contentType,
        currentSeason,
        currentEpisode,
        videoUrl: movieData?.videoUrl,
        userData: {
          id: user.id,
          name: profile?.display_name || user.email?.split('@')[0],
          avatar: profile?.avatar_url
        }
      });
    };

    // Get media and join room
    console.log('🎬 STARTING MEDIA ACQUISITION');
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(mediaStream => {
        // RACE CONDITION PROTECTION: If this specific effect instance is no longer active
        if (!isMounted) {
          console.log('🛑 Component unmounted or effect cleanup triggered, stopping stream');
          mediaStream.getTracks().forEach(track => track.stop());
          return;
        }

        console.log('✅ GOT MEDIA STREAM:', {
          id: mediaStream.id,
          active: mediaStream.active,
          tracks: mediaStream.getTracks().map(t => ({
            kind: t.kind,
            id: t.id,
            enabled: t.enabled,
            readyState: t.readyState
          }))
        });

        currentStream = mediaStream;
        setStream(mediaStream);
        streamRef.current = mediaStream;
        if (userVideo.current) {
          userVideo.current.srcObject = mediaStream;
          console.log('✅ Set local video element srcObject');
        }

        console.log('📹 Got media, joining room:', roomId);

        registerListeners();
        emitJoin();
      })
      .catch(err => {
        if (!isMounted) return; // Ignore error if unmounted
        console.error("❌ Media Error:", err);
        console.log('⚠️ Joining room WITHOUT media stream');
        setIsVideoEnabled(false);
        setIsAudioEnabled(false);
        socket.emit('media:status', { roomId, userId: user?.id, type: 'video', enabled: false });
        socket.emit('media:status', { roomId, userId: user?.id, type: 'audio', enabled: false });
        registerListeners();
        emitJoin();
      });

    return () => {
      isMounted = false; // Mark this effect instance as inactive
      hasJoinedRoom.current = false;
      socket.off('room:state', handleRoomState);
      socket.off('room:existing_participants', handleExistingParticipants);
      socket.off('participant:joined', handleParticipantJoined);
      socket.off('participant:left', handleParticipantLeft);
      socket.off('signal', handleSignal);
      socket.off('media:status', handleMediaStatus);
      socket.off('room:details_updated', handleRoomDetailsUpdated);

      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      peersRef.current.forEach(p => p.peer?.destroy());
      peersRef.current = [];
      setPeers([]);
      socket.emit('room:leave', { roomId });
    };
  }, [roomId, user, socket, profile]); // Added profile to dependencies

  // --- 2.5 Sync Movie Details (Host Only) ---
  useEffect(() => {
    if (isHost && socket && roomId && movieData && hasJoinedRoom.current) {
      const contentType = searchParams.get('type') || 'movie';
      socket.emit('room:update_details', {
        roomId,
        movieId,
        movieTitle: movieData.title,
        contentType,
        season: movieData.currentSeason || parseInt(searchParams.get('season') || '1'),
        episode: movieData.currentEpisode || parseInt(searchParams.get('episode') || '1'),
        videoUrl: movieData.videoUrl
      });
    }
  }, [isHost, socket, roomId, movieId, movieData?.title, movieData?.videoUrl, movieData?.currentSeason, movieData?.currentEpisode]);

  // --- 2.6 Sync Profile Updates (REMOVED - causes peer connection reset) ---
  // Profile updates are now handled in the initial room:join

  // --- 3. Sync & Chat Logic ---
  useEffect(() => {
    if (!socket) return;

    // Room ended by host - redirect all participants
    const handleRoomEnded = ({ message }) => {
      console.log('🔴 Room ended by host:', message);
      setActiveAlert({
        title: 'Room Ended',
        message: message || 'The host has ended the watch party',
        type: 'error',
        onDismiss: () => window.location.href = '/watch-party-vision'
      });
    };

    // Host kicked you out
    const handleKicked = ({ reason }) => {
      console.log('🚫 You were kicked:', reason);
      setActiveAlert({
        title: 'Removed from Room',
        message: reason || 'You have been removed from the watch party',
        type: 'error',
        onDismiss: () => window.location.href = '/watch-party-vision'
      });
    };

    // Host muted/unmuted you
    const handleForceMute = ({ muted }) => {
      console.log('🔇 Force mute:', muted);
      if (stream) {
        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack) {
          audioTrack.enabled = !muted;
          setIsAudioEnabled(!muted);
        }
      }
      if (muted) {
        setActiveAlert({
          title: 'Microphone Muted',
          message: 'The host has muted your microphone.',
          type: 'info'
        });
      }
    };

    // Host turned off your video
    const handleForceVideoOff = ({ videoOff }) => {
      console.log('📹 Force video off:', videoOff);
      if (stream) {
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.enabled = !videoOff;
          setIsVideoEnabled(!videoOff);
        }
      }
      if (videoOff) {
        setActiveAlert({
          title: 'Camera Turned Off',
          message: 'The host has turned off your camera.',
          type: 'info'
        });
      }
    };

    socket.on('room:ended', handleRoomEnded);
    socket.on('room:kicked', handleKicked);
    socket.on('host:force_mute', handleForceMute);
    socket.on('host:force_video_off', handleForceVideoOff);

    // Host: Join Requests
    socket.on('room:join_request', (request) => {
      setJoinRequests(prev => {
        const exists = prev.find(r => r.userId === request.userId);
        if (exists) return prev;
        return [...prev, request];
      });
    });

    // Chat Events
    socket.on('chat:message', (msg) => {
      setMessages(prev => [...prev, msg]);

      // Notify if sidebar is closed and it's not our own message
      if (!showSidebarRef.current && msg.userId !== user?.id) {
        addToast({
          type: 'chat_message',
          from_user_name: msg.userName,
          message: msg.text,
          duration: 3000
        });
      }

      if (chatEndRef.current) {
        chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    });

    // Sync Events - Use isHostRef.current to avoid stale closures
    socket.on('sync:play', ({ timestamp }) => {
      if (isHostRef.current) return;
      const applyPlay = () => {
        if (!videoRef.current) return;
        videoRef.current.currentTime = timestamp;
        setCurrentTime(timestamp);
        videoRef.current.play().catch(err => console.warn('Guest play failed:', err));
        setIsPlaying(true);
      };
      if (videoRef.current) {
        if (videoRef.current.readyState >= 2) {
          applyPlay();
        } else {
          // Queue the play until video is ready
          videoRef.current.addEventListener('canplay', applyPlay, { once: true });
        }
      }
    });

    socket.on('sync:pause', ({ timestamp }) => {
      if (isHostRef.current) return;
      const applyPause = () => {
        if (!videoRef.current) return;
        videoRef.current.currentTime = timestamp;
        setCurrentTime(timestamp);
        videoRef.current.pause();
        setIsPlaying(false);
      };
      if (videoRef.current) {
        if (videoRef.current.readyState >= 1) {
          applyPause();
        } else {
          videoRef.current.addEventListener('loadedmetadata', applyPause, { once: true });
        }
      }
    });

    socket.on('sync:seek', ({ timestamp }) => {
      if (isHostRef.current) return;
      if (videoRef.current) {
        if (videoRef.current.readyState >= 1) {
          videoRef.current.currentTime = timestamp;
          setCurrentTime(timestamp);
        } else {
          videoRef.current.addEventListener('loadedmetadata', () => {
            if (videoRef.current) {
              videoRef.current.currentTime = timestamp;
              setCurrentTime(timestamp);
            }
          }, { once: true });
        }
      }
    });

    socket.on('sync:speed', ({ speed }) => {
      if (!isHostRef.current && videoRef.current) {
        videoRef.current.playbackRate = speed;
        setPlaybackSpeed(speed);
      }
    });

    socket.on('sync:quality', ({ quality }) => {
      if (!isHostRef.current) {
        setQuality(quality);
      }
    });

    socket.on('sync:episode', async ({ showId, season, episode, videoUrl }) => {
      console.log('📺 Received episode sync:', { showId, season, episode, videoUrl });
      if (isHostRef.current) return; // Host already updated locally, skip

      // Resolve the video URL: use the one sent by host, or look it up from static data
      let resolvedVideoUrl = videoUrl || '';

      if (!resolvedVideoUrl) {
        try {
          // Try static tvShows.js data first (fast, works offline)
          const { getTvShowById } = await import('../data/tvShows');
          const staticShow = getTvShowById(showId);
          if (staticShow) {
            const seasonData = staticShow.seasons?.find(s => s.seasonNumber === season);
            const episodeData = seasonData?.episodes?.find(e => e.episodeNumber === episode);
            if (episodeData?.videoUrl) resolvedVideoUrl = episodeData.videoUrl;
          }

          // Fallback to contentService (Supabase) if still no URL
          if (!resolvedVideoUrl) {
            const epData = await contentService.getEpisodeById(showId, season, episode);
            if (epData?.videoUrl) resolvedVideoUrl = epData.videoUrl;
          }
        } catch (err) {
          console.warn('Could not resolve episode video URL:', err);
        }
      }

      // Update guest state with new episode
      setMovieData(prev => ({
        ...prev,
        videoUrl: resolvedVideoUrl,
        currentSeason: season,
        currentEpisode: episode
      }));
      setViewingSeason(season);

      const newParams = new URLSearchParams(searchParams);
      newParams.set('season', season);
      newParams.set('episode', episode);
      setSearchParams(newParams, { replace: true });

      // Reset video state
      setCurrentTime(0);
      setIsPlaying(false);

      console.log('✅ Guest: Episode synced to S' + season + 'E' + episode, '| URL:', resolvedVideoUrl || '(no video)');
    });

    // Request initial state when joining (for guests)
    socket.on('sync:state_request', ({ requesterId }) => {
      if (isHostRef.current && videoRef.current) {
        socket.emit('sync:state_response', {
          roomId,
          currentTime: videoRef.current.currentTime,
          isPlaying: !videoRef.current.paused,
          requesterId
        });
      }
    });

    // Receive initial state from host (for guests)
    socket.on('sync:state', ({ currentTime, isPlaying }) => {
      if (!isHostRef.current && videoRef.current) {
        const syncVideo = () => {
          if (videoRef.current) {
            const timeDiff = Math.abs(videoRef.current.currentTime - currentTime);

            // Only sync if there's a significant difference (more than 0.5 seconds)
            if (timeDiff > 0.5) {
              videoRef.current.currentTime = currentTime;
              setCurrentTime(currentTime);
            }

            if (isPlaying && videoRef.current.paused) {
              videoRef.current.play().catch(err => console.error('Play error:', err));
              setIsPlaying(true);
            } else if (!isPlaying && !videoRef.current.paused) {
              videoRef.current.pause();
              setIsPlaying(false);
            }
          }
        };

        // If video is ready, sync immediately
        if (videoRef.current.readyState >= 2) {
          syncVideo();
        } else {
          // Otherwise wait for video to be ready
          videoRef.current.addEventListener('loadedmetadata', syncVideo, { once: true });
        }
      }
    });

    // Listen for media status updates from other participants
    socket.on('media:status', ({ userId, type, enabled }) => {
      console.log('📡 Media status update:', { userId, type, enabled });
      if (type === 'audio') {
        setMutedParticipants(prev => {
          const newSet = new Set(prev);
          if (enabled) {
            newSet.delete(userId);
          } else {
            newSet.add(userId);
          }
          return newSet;
        });
      } else if (type === 'video') {
        setVideoOffParticipants(prev => {
          const newSet = new Set(prev);
          if (enabled) {
            newSet.delete(userId);
          } else {
            newSet.add(userId);
          }
          return newSet;
        });
      }
    });

    return () => {
      socket.off('room:ended', handleRoomEnded);
      socket.off('room:kicked', handleKicked);
      socket.off('host:force_mute', handleForceMute);
      socket.off('host:force_video_off', handleForceVideoOff);
      socket.off('chat:message');
      socket.off('sync:play');
      socket.off('sync:pause');
      socket.off('sync:seek');
      socket.off('sync:speed');
      socket.off('sync:quality');
      socket.off('sync:episode');
      socket.off('sync:state_request');
      socket.off('sync:state');
      socket.off('room:join_request');
      socket.off('media:status');
    };
  }, [socket, isHost, stream, roomId]);

  // Request initial state when video is ready (for guests)
  useEffect(() => {
    if (!isHost && socket && videoRef.current && roomId) {
      const requestSync = () => {
        if (videoRef.current && videoRef.current.readyState >= 2) {
          socket.emit('sync:request_state', { roomId });
        }
      };

      // Try immediately if already ready
      if (videoRef.current.readyState >= 2) {
        requestSync();
      } else {
        // Wait for video to be ready
        videoRef.current.addEventListener('loadedmetadata', requestSync, { once: true });
        videoRef.current.addEventListener('canplay', requestSync, { once: true });
      }
    }
  }, [isHost, socket, roomId, movieData?.videoUrl]);

  // Continuous sync monitoring for guests
  useEffect(() => {
    if (isHost || !socket || !videoRef.current || !roomId) return;

    const syncInterval = setInterval(() => {
      if (videoRef.current && !videoRef.current.paused && videoRef.current.readyState >= 2) {
        // Report current time to check for drift
        socket.emit('sync:report', {
          roomId,
          currentTime: videoRef.current.currentTime,
          odId: user?.id
        });
      }
    }, 3000); // Check every 3 seconds

    return () => clearInterval(syncInterval);
  }, [isHost, socket, roomId, user]);

  // Host: Broadcast state periodically to keep everyone in sync
  useEffect(() => {
    if (!isHost || !socket || !videoRef.current || !roomId) return;

    const broadcastInterval = setInterval(() => {
      if (videoRef.current && videoRef.current.readyState >= 2) {
        socket.emit('sync:state_response', {
          roomId,
          currentTime: videoRef.current.currentTime,
          isPlaying: !videoRef.current.paused,
          requesterId: null
        });
      }
    }, 8000); // Broadcast every 8 seconds - less frequent to avoid guest stutter

    return () => clearInterval(broadcastInterval);
  }, [isHost, socket, roomId]);

  // Handle drift correction
  useEffect(() => {
    if (!socket) return;

    socket.on('sync:drift', ({ drift, hostTime, action }) => {
      if (!isHost && videoRef.current && videoRef.current.readyState >= 2) {
        // Only correct if drift is significant (>3s for jump, >1s for speedup)
        if (action === 'jump' && drift > 3) {
          // Large drift - jump to correct time
          videoRef.current.currentTime = hostTime;
          setCurrentTime(hostTime);
        } else if (action === 'speedup') {
          // Small drift - temporarily speed up
          const originalSpeed = playbackSpeed;
          videoRef.current.playbackRate = 1.1;
          setTimeout(() => {
            if (videoRef.current) {
              videoRef.current.playbackRate = originalSpeed;
            }
          }, 2000);
        }
      }
    });

    return () => {
      socket.off('sync:drift');
    };
  }, [socket, isHost, playbackSpeed]);

  // --- Host Buffering Sync ---
  // When host buffers: emit sync:buffering → server pauses all guests
  // When host resumes: emit sync:buffering=false → server resumes all guests
  useEffect(() => {
    if (!socket || !videoRef.current || !roomId) return;
    const video = videoRef.current;

    if (isHost) {
      // Host: emit buffering events and update local UI
      const onWaiting = () => {
        setIsVideoLoading(true);
        socket.emit('sync:buffering', { roomId, odId: user?.id, isBuffering: true });
      };
      const onPlaying = () => {
        setIsVideoLoading(false);
        socket.emit('sync:buffering', { roomId, odId: user?.id, isBuffering: false });
      };
      const onCanPlay = () => {
        setIsVideoLoading(false);
        socket.emit('sync:buffering', { roomId, odId: user?.id, isBuffering: false });
      };

      video.addEventListener('waiting', onWaiting);
      video.addEventListener('playing', onPlaying);
      video.addEventListener('canplay', onCanPlay);

      return () => {
        video.removeEventListener('waiting', onWaiting);
        video.removeEventListener('playing', onPlaying);
        video.removeEventListener('canplay', onCanPlay);
      };
    } else {
      // Guest: listen for server buffer pause/resume events
      const handleBufferPause = ({ message }) => {
        console.log('⏳ Host is buffering, pausing guest video:', message);
        setIsHostBuffering(true);
        if (videoRef.current) {
          videoRef.current.pause();
        }
        setIsPlaying(false);
      };

      const handleBufferResume = () => {
        console.log('▶️ Host resumed, resuming guest video');
        setIsHostBuffering(false);
        if (videoRef.current) {
          videoRef.current.play().catch(err => console.warn('Guest resume failed:', err));
        }
        setIsPlaying(true);
      };

      // Also track local guest buffering
      const onGuestWaiting = () => setIsVideoLoading(true);
      const onGuestPlaying = () => setIsVideoLoading(false);
      const onGuestCanPlay = () => setIsVideoLoading(false);

      video.addEventListener('waiting', onGuestWaiting);
      video.addEventListener('playing', onGuestPlaying);
      video.addEventListener('canplay', onGuestCanPlay);

      // Also handle the buffering_status event (informational)
      const handleBufferingStatus = ({ odId: bufferingUserId, isBuffering }) => {
        // Only react if the host is buffering
        // (we don't know host's userId here reliably, so buffer_pause/resume is the main signal)
      };

      socket.on('sync:buffer_pause', handleBufferPause);
      socket.on('sync:buffer_resume', handleBufferResume);
      socket.on('sync:buffering_status', handleBufferingStatus);

      return () => {
        video.removeEventListener('waiting', onGuestWaiting);
        video.removeEventListener('playing', onGuestPlaying);
        video.removeEventListener('canplay', onGuestCanPlay);
        socket.off('sync:buffer_pause', handleBufferPause);
        socket.off('sync:buffer_resume', handleBufferResume);
        socket.off('sync:buffering_status', handleBufferingStatus);
      };
    }
  }, [isHost, socket, roomId, user]);

  // --- Handlers ---
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    const msg = {
      id: Date.now(),
      text: messageInput,
      userId: user.id,
      userName: profile?.display_name || user.email?.split('@')[0],
      userAvatar: profile?.avatar_url,
      timestamp: Date.now()
    };

    socket.emit('chat:message', { roomId, message: msg });
    setMessageInput('');

    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const toggleMedia = async (type) => {
    if (type === 'video') {
      if (isVideoEnabled) {
        // Turn OFF video - stop the track completely (camera light off)
        if (stream) {
          stream.getVideoTracks().forEach(track => {
            track.stop();
            stream.removeTrack(track);
          });
        }
        if (streamRef.current) {
          streamRef.current.getVideoTracks().forEach(track => {
            track.stop();
            streamRef.current.removeTrack(track);
          });
        }

        // Update video element
        if (userVideo.current) {
          userVideo.current.srcObject = null;
        }

        // Update peers to release the track
        peersRef.current.forEach(({ peer }) => {
          try {
            const sender = peer._pc?.getSenders().find(s => s.track?.kind === 'video');
            if (sender) {
              sender.replaceTrack(null).catch(e => console.warn('Failed to remove track from peer:', e));
            }
          } catch (err) {
            console.warn('Error replacing track on peer:', err);
          }
        });

        setIsVideoEnabled(false);
        // Broadcast video off status to other participants
        socket.emit('media:status', { roomId, userId: user.id, type: 'video', enabled: false });
      } else {
        // Turn ON video - request new video stream
        try {
          // Safety: Stop any existing video tracks first
          if (streamRef.current) {
            streamRef.current.getVideoTracks().forEach(track => track.stop());
          }

          const newVideoStream = await navigator.mediaDevices.getUserMedia({ video: true });

          // Safety: If room left while waiting for media, stop immediately
          if (!hasJoinedRoom.current) {
            newVideoStream.getTracks().forEach(t => t.stop());
            return;
          }

          const newVideoTrack = newVideoStream.getVideoTracks()[0];
          if (stream && newVideoTrack) {
            console.log('📹 Adding new video track to stream:', newVideoTrack.id);
            stream.addTrack(newVideoTrack);
            if (streamRef.current) {
              streamRef.current.addTrack(newVideoTrack);
            }
            // Update video element
            if (userVideo.current) {
              userVideo.current.srcObject = null;
              userVideo.current.srcObject = stream;
            }
            // Update peers with new track
            peersRef.current.forEach(({ peer, socketId }) => {
              try {
                const sender = peer._pc?.getSenders().find(s => s.track?.kind === 'video');
                if (sender) {
                  console.log('📹 Replacing video track for peer:', socketId);
                  sender.replaceTrack(newVideoTrack).catch(e => console.warn('Failed to replace track:', e));
                } else {
                  // No video sender exists, add the track
                  console.log('📹 Adding video track to peer:', socketId);
                  peer.addTrack(newVideoTrack, stream);
                }
              } catch (err) {
                console.warn('Error updating peer video track:', err);
              }
            });
          }
          setIsVideoEnabled(true);
          // Broadcast video on status
          socket.emit('media:status', { roomId, userId: user.id, type: 'video', enabled: true });
        } catch (err) {
          console.error('Failed to re-enable video:', err);
        }
      }
    } else {
      // Audio toggle - can use enabled property since mic light isn't visible
      if (stream) {
        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack) {
          const newEnabled = !audioTrack.enabled;
          audioTrack.enabled = newEnabled;
          setIsAudioEnabled(newEnabled);
          // Broadcast audio status to other participants
          socket.emit('media:status', { roomId, userId: user.id, type: 'audio', enabled: newEnabled });
        }
      }
    }
  };

  const togglePlay = () => {
    if (!isHost || !videoRef.current) return;
    const video = videoRef.current;

    if (!video.paused) {
      // Currently playing → pause
      video.pause();
      socket.emit('sync:pause', { roomId, timestamp: video.currentTime });
    } else {
      // Currently paused → play
      video.play()
        .then(() => {
          // Emit AFTER play() resolves so timestamp is accurate
          socket.emit('sync:play', { roomId, timestamp: video.currentTime });
        })
        .catch(err => console.error('Host play failed:', err));
    }
    // Note: setIsPlaying is driven by the onPlay/onPause video events, no need to set here
  };

  const skip = (seconds) => {
    if (!isHost || !videoRef.current) return;
    const newTime = Math.max(0, Math.min(videoRef.current.duration, videoRef.current.currentTime + seconds));
    videoRef.current.currentTime = newTime;
    socket.emit('sync:seek', { roomId, timestamp: newTime });
  };

  const handleSeek = (e) => {
    if (!isHost || !videoRef.current) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const newTime = pos * duration;

    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    socket.emit('sync:seek', { roomId, timestamp: newTime });
  };

  const handleVolumeChange = (e) => {
    if (!videoRef.current) return;
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    videoRef.current.volume = newVolume;
    setIsMuted(newVolume === 0);
  };

  const handleSpeedChange = (speed) => {
    if (!isHost || !videoRef.current) return;
    videoRef.current.playbackRate = speed;
    setPlaybackSpeed(speed);
    setShowSpeedMenu(false);
    // Sync speed change to all participants
    socket.emit('sync:speed', { roomId, speed });
  };

  const handleQualityChange = (q) => {
    if (!isHost) return;
    setQuality(q);
    setShowQualityMenu(false);
    // Sync quality change to all participants
    socket.emit('sync:quality', { roomId, quality: q });
  };

  const handleEpisodeChange = async (seasonNum, episodeNum) => {
    if (!isHost) return;

    console.log('🎬 Host changing episode:', { seasonNum, episodeNum });

    // Resolve episode video URL from static data first, then contentService
    let resolvedVideoUrl = '';
    try {
      // Try static tvShows.js (works for local data)
      const { getTvShowById } = await import('../data/tvShows');
      const staticShow = getTvShowById(movieId);
      if (staticShow) {
        const seasonData = staticShow.seasons?.find(s => s.seasonNumber === seasonNum);
        const episodeData = seasonData?.episodes?.find(e => e.episodeNumber === episodeNum);
        if (episodeData?.videoUrl) resolvedVideoUrl = episodeData.videoUrl;
      }

      // Fallback to contentService (Supabase)
      if (!resolvedVideoUrl) {
        const epData = await contentService.getEpisodeById(movieId, seasonNum, episodeNum);
        if (epData?.videoUrl) resolvedVideoUrl = epData.videoUrl;
      }
    } catch (err) {
      console.warn('Could not resolve episode video URL, proceeding anyway:', err);
    }

    // Update host's local state immediately (regardless of videoUrl)
    setMovieData(prev => ({
      ...prev,
      videoUrl: resolvedVideoUrl,
      currentSeason: seasonNum,
      currentEpisode: episodeNum
    }));

    const newParams = new URLSearchParams(searchParams);
    newParams.set('season', seasonNum);
    newParams.set('episode', episodeNum);
    setSearchParams(newParams, { replace: true });

    // Reset video state
    setCurrentTime(0);
    setIsPlaying(false);

    // Update room details on server (will broadcast to guests)
    socket.emit('room:update_details', {
      roomId,
      movieId,
      movieTitle: movieData?.title,
      contentType: 'tv',
      season: seasonNum,
      episode: episodeNum,
      videoUrl: resolvedVideoUrl
    });

    setShowEpisodeSidebar(false);
    console.log('✅ Host: Episode changed to S' + seasonNum + 'E' + episodeNum, '| URL:', resolvedVideoUrl || '(no video)');
  };

  const getViewableEpisodes = () => {
    if (!movieData || !movieData.seasons || movieData.type !== 'tv') return [];
    const seasonData = movieData.seasons.find(s => s.seasonNumber === viewingSeason);
    return seasonData ? seasonData.episodes : [];
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    videoRef.current.muted = newMuted;
    if (newMuted) {
      videoRef.current.volume = 0;
      setVolume(0);
    } else {
      videoRef.current.volume = volume || 0.5;
      setVolume(volume || 0.5);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Auto-hide video controls on mouse movement
  const handleVideoMouseMove = () => {
    setShowVideoControls(true);

    if (videoControlsTimeoutRef.current) {
      clearTimeout(videoControlsTimeoutRef.current);
    }

    videoControlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowVideoControls(false);
      }
    }, 2000);
  };

  const handleVideoMouseLeave = () => {
    if (videoControlsTimeoutRef.current) {
      clearTimeout(videoControlsTimeoutRef.current);
    }
    videoControlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowVideoControls(false);
      }
    }, 2000);
  };

  // Auto-hide controls on mouse movement
  const handleMouseMove = () => {
    setShowControls(true);

    // Clear existing timeout
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }

    // Set new timeout to hide controls after 2 seconds
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 2000);
  };

  const handleMouseLeave = () => {
    // Hide controls immediately when mouse leaves the stage area
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 2000);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      if (videoControlsTimeoutRef.current) {
        clearTimeout(videoControlsTimeoutRef.current);
      }
    };
  }, []);

  // Handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const checkIfOnline = (friendId) => {
    const isOnline = onlineUsers.some(u => u.userId === friendId);
    console.log(`🔍 Checking if friend ${friendId} is online:`, isOnline, 'Online users:', onlineUsers);
    return isOnline;
  };

  const inviteFriend = async (friend) => {
    if (!socket) {
      console.error('❌ Socket not connected');
      return;
    }

    console.log('📤 Sending invite to:', {
      toUserId: friend.id,
      toUserName: friend.name,
      roomId,
      movieId,
      movieTitle: movieData?.title
    });

    // 1. Send persistent notification to DB (Essential for reload persistence)
    // We use the same write-only safe pattern (no await response check needed)
    try {
      await db.createNotification(friend.id, 'party_invite', {
        from_user_name: profile?.display_name || user?.email?.split('@')[0],
        from_user_avatar: profile?.avatar_url,
        from_user_id: user?.id,
        movie_title: movieData?.title,
        room_id: roomId
      });
      console.log('✅ Invite persisted to DB');
    } catch (err) {
      console.error('❌ Failed to persist invite:', err);
    }

    // 2. Send Real-time Socket Event (Msgs toast immediately)
    socket.emit('party:invite', {
      fromUserId: user?.id,
      toUserId: friend.id,
      roomId,
      movieId, // Include movieId for the redirect
      movieTitle: movieData?.title || 'Watch Party',
      userData: {
        name: user?.user_metadata?.display_name || user?.email?.split('@')[0],
        username: user?.user_metadata?.username || user?.user_metadata?.display_name || user?.email?.split('@')[0],
        avatar: user?.user_metadata?.avatar_url
      }
    });

    addToast({
      type: 'success',
      message: `Invite sent to ${friend.name || friend.username}!`
    });
    console.log('✅ Invite sent successfully');
  };

  const copyRoomLink = () => {
    const link = `${window.location.origin}/watch-party-room?room=${roomId}&movie=${movieId}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // --- Host Control Functions ---
  const kickParticipant = (participantId, participantName) => {
    if (!isHost && !isHostRef.current) return;
    setConfirmModal({
      show: true,
      title: 'Remove Participant',
      message: `Remove ${participantName} from the watch party?`,
      onConfirm: () => {
        socket.emit('host:kick', { roomId, odId: participantId });
        console.log('🚫 Kicked participant:', participantId);
        setConfirmModal({ show: false, title: '', message: '', onConfirm: null });
      }
    });
  };

  const muteParticipant = (participantId, mute = true) => {
    if (!isHost && !isHostRef.current) return;
    socket.emit('host:mute_participant', { roomId, odId: participantId, muted: mute });
    setMutedParticipants(prev => {
      const newSet = new Set(prev);
      if (mute) newSet.add(participantId);
      else newSet.delete(participantId);
      return newSet;
    });
    console.log(`🔇 ${mute ? 'Muted' : 'Unmuted'} participant:`, participantId);
  };

  const muteAllParticipants = () => {
    if (!isHost && !isHostRef.current) return;
    socket.emit('host:mute_all', { roomId, muted: true });
    const allIds = participants.filter(p => p.id !== user?.id).map(p => p.id);
    setMutedParticipants(new Set(allIds));
    console.log('🔇 Muted all participants');
  };

  const unmuteAllParticipants = () => {
    if (!isHost && !isHostRef.current) return;
    socket.emit('host:mute_all', { roomId, muted: false });
    setMutedParticipants(new Set());
    console.log('🔊 Unmuted all participants');
  };

  const videoOffParticipant = (participantId, off = true) => {
    if (!isHost && !isHostRef.current) return;
    socket.emit('host:video_off_participant', { roomId, odId: participantId, videoOff: off });
    setVideoOffParticipants(prev => {
      const newSet = new Set(prev);
      if (off) newSet.add(participantId);
      else newSet.delete(participantId);
      return newSet;
    });
    console.log(`📹 ${off ? 'Video off' : 'Video on'} participant:`, participantId);
  };

  const videoOffAllParticipants = () => {
    if (!isHost && !isHostRef.current) return;
    socket.emit('host:video_off_all', { roomId, videoOff: true });
    const allIds = participants.filter(p => p.id !== user?.id).map(p => p.id);
    setVideoOffParticipants(new Set(allIds));
    console.log('📹 Video off all participants');
  };

  const videoOnAllParticipants = () => {
    if (!isHost && !isHostRef.current) return;
    socket.emit('host:video_off_all', { roomId, videoOff: false });
    setVideoOffParticipants(new Set());
    console.log('📹 Video on all participants');
  };

  const makeHost = (participantId, participantName) => {
    if (!isHost && !isHostRef.current) return;
    setConfirmModal({
      show: true,
      title: 'Transfer Host Ownership',
      message: `Make ${participantName} the new host? You will lose host controls.`,
      onConfirm: () => {
        socket.emit('host:transfer', { roomId, newHostId: participantId });
        console.log('👑 Transferred host to:', participantId);
        setConfirmModal({ show: false, title: '', message: '', onConfirm: null });
      }
    });
  };

  const handleJoinApprove = (request) => {
    socket.emit('room:join_approve', {
      roomId,
      userId: request.userId,
      socketId: request.socketId
    });
    setJoinRequests(prev => prev.filter(r => r.userId !== request.userId));
  };

  const handleJoinReject = (request) => {
    socket.emit('room:join_reject', {
      roomId,
      userId: request.userId,
      socketId: request.socketId
    });
    setJoinRequests(prev => prev.filter(r => r.userId !== request.userId));
  };

  const leaveRoom = () => {
    const amHost = isHostRef.current || isHost;
    if (amHost) {
      setShowLeaveModal(true);
    } else {
      window.location.href = '/watch-party-vision';
    }
  };

  const handleEndParty = () => {
    console.log('📤 Emitting room:end for room:', roomId);
    socket.emit('room:end', { roomId });
    window.location.href = '/watch-party-vision';
  };

  const handleLeaveOnly = () => {
    console.log('🚪 Host leaving alone');
    window.location.href = '/watch-party-vision';
  };

  if (!movieData) return <WatchPartySkeleton />;

  return (
    <div className={`wp-layout ${showSidebar ? 'sidebar-open' : ''}`}>
      {/* LEFT: Stage Area */}
      <div
        className="wp-stage"
        ref={stageRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Stage Header */}
        <div className="wp-header-simple">
          <div className="wp-header-title">
            <h2>{movieData.title}</h2>
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>

        </div>

        {/* Cinema Screen (Main Content) */}
        <div
          className="wp-cinema-screen"
          ref={cinemaScreenRef}
          onMouseMove={handleVideoMouseMove}
          onMouseLeave={handleVideoMouseLeave}
        >
          <video
            ref={videoRef}
            key={`${movieData.currentSeason}-${movieData.currentEpisode}-${movieData.videoUrl}`}
            src={movieData.videoUrl}
            className="wp-main-video"
            playsInline
            preload="auto"
            onClick={isHost ? togglePlay : undefined}
            onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
            onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />

          {/* Host Buffering Overlay - shown on guest screens when host is buffering */}
          {isHostBuffering && !isHost && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.55)',
              zIndex: 20, gap: '14px', pointerEvents: 'none'
            }}>
              <div style={{ position: 'relative', width: 56, height: 56 }}>
                {[0, 8, 16].map((inset, i) => (
                  <div key={i} style={{
                    position: 'absolute',
                    inset,
                    borderRadius: '50%',
                    border: '3px solid transparent',
                    borderTopColor: `rgba(255,255,255,${0.9 - i * 0.3})`,
                    animation: `spinnerRotate 1.2s cubic-bezier(0.5,0,0.5,1) infinite`,
                    animationDelay: `${-0.45 + i * 0.15}s`
                  }} />
                ))}
              </div>
              <span style={{
                fontSize: '0.8rem', fontWeight: 600,
                color: 'rgba(255,255,255,0.85)',
                letterSpacing: '0.06em', textTransform: 'uppercase'
              }}>Host is buffering…</span>
            </div>
          )}

          {/* Local Buffering Spinner */}
          {isVideoLoading && (
            <div className="player-buffering-overlay">
              <div className="player-buffering-spinner">
                <div className="spinner-ring"></div>
                <div className="spinner-ring"></div>
                <div className="spinner-ring"></div>
              </div>
            </div>
          )}

          {/* Video Player Controls - Only visible to host */}

          <div className={`wp-video-controls-overlay ${showVideoControls ? 'visible' : 'hidden'}`}>
            {/* Control Bar */}
            <div className="wp-video-control-bar">
              {/* Left: Playback Controls */}
              {isHost && (
                <div className="wp-video-controls-left">
                  <button className="wp-video-btn" onClick={() => skip(-10)} title="Rewind 10s">
                    <i className="fas fa-backward"></i>
                  </button>
                  <button className="wp-video-btn" onClick={togglePlay} title={isPlaying ? 'Pause' : 'Play'}>
                    <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'}`}></i>
                  </button>
                  <button className="wp-video-btn" onClick={() => skip(10)} title="Forward 10s">
                    <i className="fas fa-forward"></i>
                  </button>
                </div>
              )}

              {/* Center: Time and Progress */}
              <div className="wp-video-info-center">
                <div className="wp-video-time-display">
                  <span className="wp-video-current-time">{formatTime(currentTime)}</span>
                  <span className="wp-video-time-separator">/</span>
                  <span className="wp-video-total-time">{formatTime(duration)}</span>
                </div>
                <div className="wp-video-info-text">
                  <span className="wp-video-info-title">{movieData.title}</span>
                  <div
                    className="wp-video-progress-container"
                    onClick={isHost ? handleSeek : undefined}
                    style={{ cursor: isHost ? 'pointer' : 'default', pointerEvents: isHost ? 'auto' : 'none' }}
                  >
                    <div className="wp-video-progress-bar">
                      <div
                        className="wp-video-progress-fill"
                        style={{ width: `${(currentTime / duration) * 100}%` }}
                      >
                        <div className="wp-video-progress-thumb"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Additional Controls */}
              <div className="wp-video-controls-right">
                {/* Episodes List (TV Shows Only) */}
                {movieData?.type === 'tv' && movieData?.seasons && movieData.seasons.length > 0 && (
                  <button
                    className={`wp-video-btn ${showEpisodeSidebar ? 'active-control' : ''}`}
                    onClick={() => {
                      console.log('Episodes button clicked, current state:', showEpisodeSidebar);
                      setShowEpisodeSidebar(!showEpisodeSidebar);
                    }}
                    title="Episodes"
                  >
                    <i className="fas fa-list"></i>
                  </button>
                )}

                {/* Speed, Quality, Subtitles - Host Only */}
                {isHost && (
                  <>
                    {/* Speed Control */}
                    <div className="wp-video-control-group">
                      <button
                        className={`wp-video-btn ${showSpeedMenu ? 'active' : ''}`}
                        onClick={() => { setShowSpeedMenu(!showSpeedMenu); setShowQualityMenu(false); }}
                        title="Playback Speed"
                      >
                        <i className="fas fa-tachometer-alt"></i>
                      </button>
                      {showSpeedMenu && (
                        <div className="wp-video-popup-menu speed-menu">
                          {[0.5, 0.75, 1, 1.25, 1.5, 2].map(speed => (
                            <button
                              key={speed}
                              className={`popup-item ${playbackSpeed === speed ? 'active' : ''}`}
                              onClick={() => handleSpeedChange(speed)}
                            >
                              {speed}x
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Quality Control */}
                    <div className="wp-video-control-group">
                      <button
                        className={`wp-video-btn ${showQualityMenu ? 'active' : ''}`}
                        onClick={() => { setShowQualityMenu(!showQualityMenu); setShowSpeedMenu(false); }}
                        title="Quality"
                      >
                        <i className="fas fa-cog"></i>
                      </button>
                      {showQualityMenu && (
                        <div className="wp-video-popup-menu quality-menu">
                          {['Auto', '1080p', '720p', '480p'].map(q => (
                            <button
                              key={q}
                              className={`popup-item ${quality === q ? 'active' : ''}`}
                              onClick={() => handleQualityChange(q)}
                            >
                              {q}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <button className="wp-video-btn" title="Subtitles">
                      <i className="fas fa-closed-captioning"></i>
                    </button>
                  </>
                )}

                {/* Volume Control */}
                <div className="wp-video-volume-control">
                  <button className="wp-video-btn" onClick={toggleMute}>
                    <i className={`fas ${isMuted || volume === 0 ? 'fa-volume-mute' : volume < 0.5 ? 'fa-volume-down' : 'fa-volume-up'}`}></i>
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="wp-video-volume-slider"
                  />
                </div>

                <button className="wp-video-btn" onClick={toggleFullscreen}>
                  <i className={`fas ${isFullscreen ? 'fa-compress' : 'fa-expand'}`}></i>
                </button>
              </div>
            </div>
          </div>

          {/* Non-host overlay message */}
          {!isHost && !isPlaying && (
            <div className="wp-waiting-overlay">
              <div className="wp-waiting-message">
                <p>Waiting for host to start...</p>
              </div>
            </div>
          )}

          {/* Episode Sidebar (TV Shows Only) */}
          {(() => {
            const shouldShow = movieData?.type === 'tv' && showEpisodeSidebar;
            return shouldShow;
          })() && (
              <>
                <div className="wp-episode-sidebar-overlay" onClick={() => setShowEpisodeSidebar(false)}></div>
                <div className="wp-episode-sidebar">
                  <div className="sidebar-header">
                    <h3>Episodes</h3>
                    <button className="sidebar-close" onClick={() => setShowEpisodeSidebar(false)}>
                      <i className="fas fa-times"></i>
                    </button>
                  </div>

                  {/* Season Pills */}
                  <div className="sidebar-seasons">
                    {movieData.seasons && movieData.seasons.map(s => (
                      <button
                        key={s.seasonNumber}
                        className={`season-pill ${viewingSeason === s.seasonNumber ? 'active' : ''}`}
                        onClick={() => setViewingSeason(s.seasonNumber)}
                      >
                        Season {s.seasonNumber}
                      </button>
                    ))}
                  </div>

                  {/* Episode List */}
                  <div className="sidebar-list">
                    {getViewableEpisodes().map(ep => {
                      const currentSeason = movieData.currentSeason || parseInt(searchParams.get('season') || '1');
                      const currentEpisode = movieData.currentEpisode || parseInt(searchParams.get('episode') || '1');
                      const isCurrent = currentSeason === viewingSeason && currentEpisode === ep.episodeNumber;

                      return (
                        <div
                          key={ep.id}
                          className={`sidebar-episode-card ${isCurrent ? 'active' : ''} ${!isHost ? 'disabled' : ''}`}
                          onClick={() => isHost && handleEpisodeChange(viewingSeason, ep.episodeNumber)}
                        >
                          <div className="sidebar-ep-thumb">
                            <img src={ep.thumbnailUrl || movieData.poster} alt={ep.title} />
                            {isCurrent && <div className="now-playing-overlay"><i className="fas fa-play"></i></div>}
                          </div>
                          <div className="sidebar-ep-info">
                            <span className="sidebar-ep-num">{ep.episodeNumber}. {ep.title}</span>
                            <span className="sidebar-ep-dur">{ep.duration || '45 min'}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
        </div>

        {/* Participants Strip */}
        <div className="wp-participants-strip">
          {/* My Tile */}
          <div className="wp-participant-tile is-me">
            {/* Video - hidden when video is off */}
            <video
              ref={userVideo}
              autoPlay
              muted
              playsInline
              style={{ display: isVideoEnabled ? 'block' : 'none' }}
            />

            {/* Avatar fallback when video is off */}
            {!isVideoEnabled && (
              <div className="wp-tile-avatar-fallback">
                <img
                  src={profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`}
                  alt="You"
                />
              </div>
            )}

            <div className="wp-participant-name">You</div>
            <div className="wp-participant-status">
              {!isAudioEnabled && (
                <div className="status-icon muted">
                  <MicOff size={12} />
                </div>
              )}
              {!isVideoEnabled && (
                <div className="status-icon video-off">
                  <VideoOff size={12} />
                </div>
              )}
            </div>
          </div>

          {/* Peer Tiles */}
          {peers.map((p, i) => {
            const isMuted = mutedParticipants.has(p.odId);
            const isVideoOff = videoOffParticipants.has(p.odId);

            // ADDITIONAL CHECK: Also check if video track is disabled in the stream
            const hasVideoTrack = p.stream?.getVideoTracks().length > 0;
            const videoTrackEnabled = p.stream?.getVideoTracks()[0]?.enabled;
            const actuallyVideoOff = isVideoOff || !hasVideoTrack || !videoTrackEnabled;

            if (i === 0) { // Log first peer only to avoid spam
              console.log('🎨 Rendering peer tile:', {
                socketId: p.socketId,
                name: p.name,
                odId: p.odId,
                avatar: p.avatar,
                isVideoOff,
                hasVideoTrack,
                videoTrackEnabled,
                actuallyVideoOff
              });
            }
            return (
              <VideoTile
                key={p.socketId || i}
                peer={p.peer}
                stream={p.stream}
                participantName={p.name}
                participantId={p.odId}
                avatar={p.avatar}
                isAudioEnabled={!isMuted}
                isVideoEnabled={!actuallyVideoOff}
              />
            );
          })}
        </div>

        {/* Controls Dock (Floating) */}
        <div className={`wp-controls-dock ${showControls ? 'visible' : 'hidden'}`}>
          <button
            className={`wp-control-btn ${!isAudioEnabled ? 'danger' : ''}`}
            onClick={() => toggleMedia('audio')}
            title="Toggle Mic"
          >
            {isAudioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
          </button>

          <button
            className={`wp-control-btn ${!isVideoEnabled ? 'danger' : ''}`}
            onClick={() => toggleMedia('video')}
            title="Toggle Camera"
          >
            {isVideoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
          </button>

          <button
            className="wp-control-btn"
            onClick={() => setShowInviteModal(true)}
            title="Invite Friends"
          >
            <UserPlus size={20} />
          </button>

          <button
            className={`wp-control-btn ${showSidebar ? 'active' : ''}`}
            onClick={() => setShowSidebar(!showSidebar)}
            title="Toggle Chat"
          >
            <MessageCircle size={20} />
          </button>

          <button
            className="wp-control-btn danger"
            onClick={leaveRoom}
            title={isHost ? 'End Party' : 'Leave Party'}
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* RIGHT: Sidebar Panel */}
      <div className={`wp-sidebar-panel ${showSidebar ? 'show' : ''}`}>
        {/* Close button for mobile */}
        <button
          className="wp-sidebar-close"
          onClick={() => setShowSidebar(false)}
        >
          <X size={20} />
        </button>

        {/* Tabs */}
        <div className="wp-tabs">
          <button
            className={`wp-tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            <MessageCircle size={16} /> Room Chat
          </button>
          <button
            className={`wp-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <Users size={16} /> Participants
          </button>
        </div>

        {/* Chat View */}
        {activeTab === 'chat' && (
          <div className="wp-chat-container">
            <div className="wp-chat-messages">
              {messages.map(m => (
                <div key={m.id} className={`wp-chat-bubble ${m.userId === user.id ? 'me' : ''}`}>
                  <img
                    src={m.userAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.userId}`}
                    className="wp-avatar"
                    alt="avatar"
                  />
                  <div className="wp-bubble-content">
                    <div className="wp-bubble-header">
                      <span>{m.userName}</span>
                    </div>
                    <div className="wp-bubble-text">{m.text}</div>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>


            {/* Emoji Picker */}
            {showEmojiPicker && (
              <div className="wp-emoji-picker">
                <div className="wp-emoji-picker-header">
                  <span>Emojis</span>
                  <button
                    className="wp-emoji-close"
                    onClick={() => setShowEmojiPicker(false)}
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="wp-emoji-content">
                  {Object.entries(emojiCategories).map(([category, emojis]) => (
                    <div key={category} className="wp-emoji-category">
                      <span className="wp-emoji-category-label">{category}</span>
                      <div className="wp-emoji-grid">
                        {emojis.map((emoji, idx) => (
                          <button
                            key={idx}
                            className="wp-emoji-btn"
                            onClick={() => {
                              setMessageInput(prev => prev + emoji);
                              setShowEmojiPicker(false);
                              // Refocus the input after selecting an emoji so Enter works immediately
                              setTimeout(() => chatInputRef.current?.focus(), 0);
                            }}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <form className="wp-input-wrapper" onSubmit={handleSendMessage}>
              <button
                type="button"
                className={`wp-emoji-trigger ${showEmojiPicker ? 'active' : ''}`}
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                <Smile size={20} />
              </button>
              <input
                ref={chatInputRef}
                className="wp-chat-input"
                placeholder="Type a message..."
                value={messageInput}
                onChange={e => setMessageInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    handleSendMessage(e);
                  }
                }}
              />
              <button type="submit" className="wp-send-btn">
                <Send size={16} />
              </button>
            </form>
          </div>
        )}

        {/* Participants View */}
        {activeTab === 'users' && (
          <div className="wp-participants-list">
            {/* Host Controls Header */}
            {isHost && participants.length > 1 && (
              <div className="wp-host-controls-header">
                <span className="wp-host-badge">HOST CONTROLS</span>
                <div className="wp-host-actions">
                  <button
                    className="wp-host-action-btn"
                    onClick={muteAllParticipants}
                    title="Mute All"
                  >
                    <VolumeOff size={14} /> Mute All
                  </button>
                  <button
                    className="wp-host-action-btn"
                    onClick={videoOffAllParticipants}
                    title="Video Off All"
                  >
                    <VideoOff size={14} /> Video Off All
                  </button>
                </div>
              </div>
            )}

            {/* You (Host) */}
            <div className="wp-participant-item is-you">
              <img
                src={user?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`}
                className="wp-avatar"
                alt="You"
              />
              <div className="wp-participant-info">
                <span className="wp-participant-name-text">You {isHost && <span className="host-label">HOST</span>}</span>
              </div>
            </div>

            {/* Other Participants */}
            {participants.filter(p => p.id !== user?.id).map(p => (
              <div key={p.id} className="wp-participant-item">
                <img
                  src={p.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.id}`}
                  className="wp-avatar"
                  alt={p.name}
                />
                <div className="wp-participant-info">
                  <span className="wp-participant-name-text">
                    {p.name}
                    {p.isHost && <span className="host-label">HOST</span>}
                    {mutedParticipants.has(p.id) && <span className="wp-status-badge muted" title="Muted" />}
                    {videoOffParticipants.has(p.id) && <span className="wp-status-badge video-off" title="Video Off" />}
                  </span>
                </div>

                {/* Host Actions for this participant */}
                {isHost && !p.isHost && (
                  <div className="wp-participant-actions">
                    <button
                      className={`wp-action-btn ${mutedParticipants.has(p.id) ? 'active' : ''}`}
                      onClick={() => muteParticipant(p.id, !mutedParticipants.has(p.id))}
                      title={mutedParticipants.has(p.id) ? 'Unmute' : 'Mute'}
                    >
                      {mutedParticipants.has(p.id) ? <VolumeOff size={14} /> : <Mic size={14} />}
                    </button>
                    <button
                      className={`wp-action-btn ${videoOffParticipants.has(p.id) ? 'active' : ''}`}
                      onClick={() => videoOffParticipant(p.id, !videoOffParticipants.has(p.id))}
                      title={videoOffParticipants.has(p.id) ? 'Video On' : 'Video Off'}
                    >
                      {videoOffParticipants.has(p.id) ? <VideoOff size={14} /> : <Video size={14} />}
                    </button>
                    <button
                      className="wp-action-btn crown"
                      onClick={() => makeHost(p.id, p.name)}
                      title="Make Host"
                    >
                      <span style={{ fontSize: '9px', fontWeight: 'bold' }}>HOST</span>
                    </button>
                    <button
                      className="wp-action-btn danger"
                      onClick={() => kickParticipant(p.id, p.name)}
                      title="Remove"
                    >
                      <UserX size={14} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="wp-modal-overlay" onClick={() => setShowInviteModal(false)}>
          <div className="wp-modal" onClick={e => e.stopPropagation()}>
            <div className="wp-modal-header">
              <h3><UserPlus size={20} /> Invite Friends</h3>
              <button onClick={() => setShowInviteModal(false)}><X size={20} /></button>
            </div>

            <div className="wp-modal-content">
              {/* Room Code Display */}
              <div className="wp-join-code-section">
                <span>Room Code</span>
                <div className="wp-code-display" onClick={() => {
                  navigator.clipboard.writeText(roomId);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}>
                  {roomId}
                  <span className="code-copy-hint">
                    {copied ? 'Copied!' : 'Click to copy'}
                  </span>
                </div>
              </div>

              {/* Copy Link */}
              <div
                className="wp-copy-link"
                onClick={() => {
                  const link = `${window.location.origin}/watch-party-room?room=${roomId}&movie=${movieId}`;
                  navigator.clipboard.writeText(link);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
              >
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/watch-party-room?room=${roomId}&movie=${movieId}`}
                  style={{ pointerEvents: 'none' }}
                />
                <button title="Copy Link">
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                </button>
                <span className="code-copy-hint">
                  {copied ? 'Copied!' : 'Click to copy'}
                </span>
              </div>

              <div className="wp-divider">or invite from friends list</div>

              {/* Friends List */}
              <div className="wp-friends-list">
                {friends && friends.length > 0 ? (
                  friends.map(friend => {
                    const isOnline = checkIfOnline(friend.id);
                    return (
                      <div key={friend.id} className="wp-friend-item">
                        <div className="wp-friend-avatar">
                          {friend.avatar ? (
                            <img src={friend.avatar} alt={friend.name} />
                          ) : (
                            <div className="wp-avatar-placeholder">
                              {(friend.name || friend.username)?.[0]?.toUpperCase()}
                            </div>
                          )}
                          <span className={`wp-online-indicator ${isOnline ? 'online' : 'offline'}`} />
                        </div>
                        <div className="wp-friend-info">
                          <span className="wp-friend-name">{friend.name || friend.username}</span>
                          <span className={`wp-friend-status ${isOnline ? 'online' : 'offline'}`}>
                            {isOnline ? 'Online' : 'Offline'}
                          </span>
                        </div>
                        <button
                          onClick={() => inviteFriend(friend)}
                          className="wp-invite-btn"
                          disabled={!isOnline}
                        >
                          {isOnline ? 'Invite' : 'Offline'}
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div className="wp-no-friends">
                    No friends available. Add friends to invite them!
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leave Confirmation Modal (For Hosts) */}
      {showLeaveModal && (
        <div className="wp-modal-overlay" onClick={() => setShowLeaveModal(false)}>
          <div className="wp-modal leave-modal" onClick={e => e.stopPropagation()}>
            <div className="wp-modal-header">
              <h3><X size={20} /> Leave Watch Party</h3>
              <button onClick={() => setShowLeaveModal(false)}><X size={20} /></button>
            </div>

            <div className="wp-modal-content">
              <p className="leave-modal-desc">
                You are the host. How would you like to leave the watch party?
              </p>

              <div className="leave-options-grid">
                <button
                  className="leave-option-card danger"
                  onClick={handleEndParty}
                >
                  <div className="option-icon">
                    <X size={24} />
                  </div>
                  <div className="option-text">
                    <span className="option-title">End for Everyone</span>
                    <span className="option-desc">The party will end and all participants will be redirected.</span>
                  </div>
                </button>

                <button
                  className="leave-option-card"
                  onClick={handleLeaveOnly}
                >
                  <div className="option-icon">
                    <Send size={24} />
                  </div>
                  <div className="option-text">
                    <span className="option-title">Leave Party</span>
                    <span className="option-desc">Only you will leave. The party will continue for others.</span>
                  </div>
                </button>
              </div>
            </div>

            <div className="wp-modal-footer">
              <button className="wp-modal-cancel-btn" onClick={() => setShowLeaveModal(false)}>
                Stay in Party
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Join Requests Popup - Modern UI */}
      {joinRequests.length > 0 && (isHost || isHostRef.current) && (
        <div className="wp-join-requests-popup">
          <div className="wp-join-popup-header">
            <div className="wp-join-popup-title">
              <Users size={20} />
              <span>Join Requests</span>
              <div className="wp-join-badge">{joinRequests.length}</div>
            </div>
          </div>

          <div className="wp-join-requests-list">
            {joinRequests.map(req => (
              <div key={req.userId} className="wp-join-request-card">
                <div className="wp-join-request-user">
                  <div className="wp-join-avatar-wrapper">
                    <img
                      src={req.userData?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${req.userId}`}
                      alt={req.userData?.name}
                      className="wp-join-avatar"
                    />
                    <div className="wp-join-pulse"></div>
                  </div>
                  <div className="wp-join-user-info">
                    <span className="wp-join-user-name">{req.userData?.name || 'User'}</span>
                    <span className="wp-join-user-label">wants to join the party</span>
                  </div>
                </div>

                <div className="wp-join-actions">
                  <button
                    className="wp-join-btn wp-join-btn-approve"
                    onClick={() => handleJoinApprove(req)}
                    title="Approve"
                  >
                    <Check size={18} />
                    <span>Accept</span>
                  </button>
                  <button
                    className="wp-join-btn wp-join-btn-reject"
                    onClick={() => handleJoinReject(req)}
                    title="Reject"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Custom Alert Modal */}
      {activeAlert && (
        <div className="wp-alert-overlay" onClick={() => !activeAlert.onDismiss && setActiveAlert(null)}>
          <div className="wp-alert-modal" onClick={e => e.stopPropagation()}>
            <div className={`wp-alert-icon ${activeAlert.type === 'error' ? 'danger' : ''}`}>
              {activeAlert.type === 'error' ? <X size={32} /> : <div style={{ fontSize: '32px' }}>!</div>}
            </div>
            <h3 className="wp-alert-title">{activeAlert.title}</h3>
            <p className="wp-alert-message">{activeAlert.message}</p>
            <button
              className="wp-alert-btn"
              onClick={() => {
                const dismiss = activeAlert.onDismiss;
                setActiveAlert(null);
                if (dismiss) dismiss();
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default WatchPartyRoom;
