import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useContent } from '../context/ContentContext';
import { useAuth } from '../context/AuthContext';
import { db } from '../config/supabase';
import videoSyncManager from '../utils/videoSyncManager';
import '../styles/player.css';
import { PlayerSkeleton } from '../components/skeletons';

function Player() {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const roomId = searchParams.get('room');
    const isHost = searchParams.get('host') === 'true';

    const { user } = useAuth();
    const { getMovie } = useContent();
    const [movie, setMovie] = useState(null);
    const [loading, setLoading] = useState(true);
    const videoRef = useRef(null);
    const containerRef = useRef(null);
    const progressRef = useRef(null);
    const hideTimeoutRef = useRef(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [progress, setProgress] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncStatus, setSyncStatus] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const [showVolumeSlider, setShowVolumeSlider] = useState(false);
    const [playFeedback, setPlayFeedback] = useState(null); // 'play' or 'pause'
    const [showSpeedMenu, setShowSpeedMenu] = useState(false);
    const [showQualityMenu, setShowQualityMenu] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [quality, setQuality] = useState('Auto');
    const [isVideoLoading, setIsVideoLoading] = useState(false);

    // Load movie from Supabase/ContentContext
    useEffect(() => {
        const loadMovie = async () => {
            setLoading(true);
            const movieData = await getMovie(id);
            setMovie(movieData);
            setLoading(false);
        };
        loadMovie();
    }, [id, getMovie]);

    const formatTime = (seconds) => {
        if (isNaN(seconds)) return '0:00';
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        if (hrs > 0) {
            return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Auto-hide controls
    const resetHideTimer = useCallback(() => {
        setShowControls(true);
        if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
        if (isPlaying) {
            hideTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
        }
    }, [isPlaying]);

    const handleMouseMove = useCallback(() => resetHideTimer(), [resetHideTimer]);
    const handleMouseLeave = useCallback(() => {
        if (isPlaying) {
            hideTimeoutRef.current = setTimeout(() => setShowControls(false), 1000);
        }
    }, [isPlaying]);

    useEffect(() => {
        if (user && movie) {
            const loadHistory = async () => {
                const { data } = await db.getWatchHistory(user.id);
                const history = data?.find(h => h.movie_id === movie.id);
                if (history?.progress && videoRef.current) {
                    videoRef.current.currentTime = history.progress;
                }
            };
            loadHistory();
        }
    }, [user, movie]);

    useEffect(() => {
        if (!user || !movie) return;

        // Save progress periodically
        const saveInterval = setInterval(() => {
            if (videoRef.current && db.updateWatchProgress) {
                db.updateWatchProgress(user.id, movie.id, videoRef.current.currentTime, videoRef.current.duration);
            }
        }, 10000); // Save every 10 seconds

        // Save on component unmount
        return () => {
            clearInterval(saveInterval);
            if (videoRef.current && db.updateWatchProgress) {
                db.updateWatchProgress(user.id, movie.id, videoRef.current.currentTime, videoRef.current.duration);
            }
        };
    }, [user, movie]);

    useEffect(() => {
        if (roomId && videoRef.current) {
            setIsSyncing(true);
            videoSyncManager.connect();
            videoSyncManager.joinRoom(roomId, user?.id, isHost);
            videoSyncManager.attachVideo(videoRef.current);
            videoSyncManager.on('synced', ({ action }) => {
                setSyncStatus(`Synced: ${action}`);
                setTimeout(() => setSyncStatus(''), 2000);
            });
            return () => {
                videoSyncManager.detachVideo();
                videoSyncManager.leaveRoom();
            };
        }
    }, [roomId, isHost, user]);

    useEffect(() => {
        // Wait for loading to finish and video element to exist
        if (loading || !videoRef.current) return;

        const video = videoRef.current;
        const updateTime = () => {
            setCurrentTime(video.currentTime);
            if (video.duration) {
                setProgress((video.currentTime / video.duration) * 100);
            }
        };
        const updateDuration = () => setDuration(video.duration);
        const handlePlayEvent = () => setIsPlaying(true);
        const handlePauseEvent = () => setIsPlaying(false);

        const handleWaiting = () => setIsVideoLoading(true);
        const handleCanPlay = () => setIsVideoLoading(false);
        const handlePlaying = () => setIsVideoLoading(false);

        video.addEventListener('timeupdate', updateTime);
        video.addEventListener('loadedmetadata', updateDuration);
        video.addEventListener('play', handlePlayEvent);
        video.addEventListener('pause', handlePauseEvent);
        video.addEventListener('waiting', handleWaiting);
        video.addEventListener('canplay', handleCanPlay);
        video.addEventListener('playing', handlePlaying);

        // Initial sync
        if (!video.paused) setIsPlaying(true);
        setDuration(video.duration);

        return () => {
            video.removeEventListener('timeupdate', updateTime);
            video.removeEventListener('loadedmetadata', updateDuration);
            video.removeEventListener('play', handlePlayEvent);
            video.removeEventListener('pause', handlePauseEvent);
            video.removeEventListener('waiting', handleWaiting);
            video.removeEventListener('canplay', handleCanPlay);
            video.removeEventListener('playing', handlePlaying);
        };
    }, [loading, movie]); // Re-run when loading finishes or movie changes

    useEffect(() => {
        const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.target.tagName === 'INPUT') return;
            switch (e.key) {
                case ' ': case 'k': e.preventDefault(); togglePlay(); break;
                case 'ArrowLeft': e.preventDefault(); skip(-10); break;
                case 'ArrowRight': e.preventDefault(); skip(10); break;
                case 'f': e.preventDefault(); toggleFullscreen(); break;
                case 'm': e.preventDefault(); toggleMute(); break;
                case 'Escape': if (isFullscreen) document.exitFullscreen(); break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isFullscreen]);

    const togglePlay = () => {
        const video = videoRef.current;
        if (!video) return;

        if (video.paused) {
            video.play().catch(err => {
                console.error('Error playing video:', err);
            });
            setPlayFeedback('play');
        } else {
            video.pause();
            setPlayFeedback('pause');
        }

        // Clear feedback after animation
        setTimeout(() => setPlayFeedback(null), 500);
        resetHideTimer();
    };

    const skip = (seconds) => {
        const video = videoRef.current;
        video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + seconds));
        resetHideTimer();
    };

    const toggleMute = () => {
        const video = videoRef.current;
        if (isMuted) { video.volume = volume || 1; setIsMuted(false); }
        else { video.volume = 0; setIsMuted(true); }
    };

    const handleVolumeChange = (e) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        const video = videoRef.current;
        if (video) {
            video.volume = newVolume;
            setIsMuted(newVolume === 0);
        }
    };

    const handleSpeedChange = (speed) => {
        const video = videoRef.current;
        if (video) {
            video.playbackRate = speed;
            setPlaybackSpeed(speed);
            setShowSpeedMenu(false);
        }
    };

    const handleQualityChange = (q) => {
        setQuality(q);
        setShowQualityMenu(false);
        // In a real app, this would trigger HLS level change
    };

    const toggleFullscreen = () => {
        document.fullscreenElement ? document.exitFullscreen() : containerRef.current?.requestFullscreen();
    };

    // Progress bar seek - click and drag
    const handleProgressSeek = (e) => {
        if (!progressRef.current || !videoRef.current) return;
        const rect = progressRef.current.getBoundingClientRect();
        const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const newTime = pos * videoRef.current.duration;
        videoRef.current.currentTime = newTime;
        setProgress(pos * 100);
        resetHideTimer();
    };

    const handleProgressMouseDown = (e) => {
        setIsDragging(true);
        handleProgressSeek(e);
    };

    const handleProgressMouseMove = useCallback((e) => {
        if (isDragging) {
            handleProgressSeek(e);
        }
    }, [isDragging]);

    const handleProgressMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    // Add/remove mouse event listeners for dragging
    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleProgressMouseMove);
            window.addEventListener('mouseup', handleProgressMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleProgressMouseMove);
            window.removeEventListener('mouseup', handleProgressMouseUp);
        };
    }, [isDragging, handleProgressMouseMove, handleProgressMouseUp]);

    if (loading) {
        return <PlayerSkeleton />;
    }

    if (!movie) {
        return (
            <div className="player-loading">
                <h2>Movie not found</h2>
                <Link to="/">Go back home</Link>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className={`player-container ${showControls ? 'show-controls' : ''}`}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            {/* Back Button */}
            <Link
                to={roomId ? `/watch-party?room=${roomId}` : `/movie/${id}`}
                className={`player-back-btn ${showControls ? 'visible' : ''}`}
            >
                <i className="fas fa-arrow-left"></i>
            </Link>

            {/* Sync Badge */}
            {isSyncing && (
                <div className="player-sync-badge">
                    <i className="fas fa-users"></i>
                    <span>{isHost ? 'Hosting' : 'Synced'}</span>
                </div>
            )}

            {/* Video */}
            <video
                ref={videoRef}
                className="player-video"
                poster={movie.posterUrl}
                onClick={togglePlay}
                onDoubleClick={toggleFullscreen}
                playsInline
                preload="auto"
            >
                <source src={movie.videoUrl || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"} type="video/mp4" />
                Your browser does not support the video tag.
            </video>

            {/* Buffering Spinner */}
            {isVideoLoading && (
                <div className="player-buffering-overlay">
                    <div className="player-buffering-spinner">
                        <div className="spinner-ring"></div>
                        <div className="spinner-ring"></div>
                        <div className="spinner-ring"></div>
                    </div>
                </div>
            )}

            {/* Center Play/Pause Feedback */}
            {playFeedback && (
                <div className="player-center-feedback animate-ping">
                    <i className={`fas ${playFeedback === 'play' ? 'fa-play' : 'fa-pause'}`}></i>
                </div>
            )}

            {/* Center Play Button (only when paused and no feedback showing) */}
            {!isPlaying && !playFeedback && !isVideoLoading && (
                <button className="player-center-play" onClick={togglePlay}>
                    <i className="fas fa-play"></i>
                </button>
            )}

            {/* Bottom Control Bar - Matching the reference image exactly */}
            <div className={`player-control-bar ${showControls ? 'visible' : ''}`}>
                {/* Left: Playback Controls */}
                <div className="player-controls-left">
                    <button className="player-btn" onClick={() => skip(-10)} title="Rewind 10s">
                        <i className="fas fa-backward"></i>
                    </button>
                    <button className="player-btn" onClick={togglePlay} title={isPlaying ? 'Pause' : 'Play'}>
                        <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'}`}></i>
                    </button>
                    <button className="player-btn" onClick={() => skip(10)} title="Forward 10s">
                        <i className="fas fa-forward"></i>
                    </button>
                </div>

                {/* Center: Time and Progress Bar */}
                <div className="player-info-center">
                    <div className="player-time-display">
                        <span className="player-current-time">{formatTime(currentTime)}</span>
                        <span className="player-time-separator">/</span>
                        <span className="player-total-time">{formatTime(duration)}</span>
                    </div>
                    <div className="player-info-text">
                        <span className="player-info-title">{movie.title}</span>
                        {/* Clickable/Draggable Progress bar */}
                        <div
                            ref={progressRef}
                            className="player-info-progress"
                            onMouseDown={handleProgressMouseDown}
                            onClick={handleProgressSeek}
                        >
                            <div className="player-info-progress-fill" style={{ width: `${progress}%` }}>
                                <div className="player-info-progress-thumb"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Additional Controls */}
                <div className="player-controls-right">
                    {/* Speed Control */}
                    <div className="player-control-group">
                        <button
                            className={`player-btn ${showSpeedMenu ? 'active' : ''}`}
                            onClick={() => { setShowSpeedMenu(!showSpeedMenu); setShowQualityMenu(false); }}
                            title="Playback Speed"
                        >
                            <i className="fas fa-tachometer-alt"></i>
                        </button>
                        {showSpeedMenu && (
                            <div className="player-popup-menu speed-menu">
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
                    <div className="player-control-group">
                        <button
                            className={`player-btn ${showQualityMenu ? 'active' : ''}`}
                            onClick={() => { setShowQualityMenu(!showQualityMenu); setShowSpeedMenu(false); }}
                            title="Quality"
                        >
                            <i className="fas fa-cog"></i>
                        </button>
                        {showQualityMenu && (
                            <div className="player-popup-menu quality-menu">
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

                    <button className="player-btn" title="Subtitles">
                        <i className="fas fa-closed-captioning"></i>
                    </button>
                    <div
                        className="volume-control-container"
                        onMouseEnter={() => setShowVolumeSlider(true)}
                        onMouseLeave={() => setShowVolumeSlider(false)}
                    >
                        {showVolumeSlider && (
                            <div className="volume-slider-popup">
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.05"
                                    value={isMuted ? 0 : volume}
                                    onChange={handleVolumeChange}
                                    className="volume-slider"
                                />
                            </div>
                        )}
                        <button className="player-btn" onClick={toggleMute} title={isMuted ? 'Unmute' : 'Mute'}>
                            <i className={`fas ${isMuted || volume === 0 ? 'fa-volume-mute' : volume < 0.5 ? 'fa-volume-down' : 'fa-volume-up'}`}></i>
                        </button>
                    </div>
                    <button className="player-btn" onClick={toggleFullscreen} title="Fullscreen">
                        <i className={`fas ${isFullscreen ? 'fa-compress' : 'fa-expand'}`}></i>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Player;
