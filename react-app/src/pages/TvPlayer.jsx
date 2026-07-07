import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect, useCallback } from 'react';
import contentService from '../services/contentService';
import { useAuth } from '../context/AuthContext';
import { useTvProgress } from '../context/TvProgressContext';
import videoSyncManager from '../utils/videoSyncManager';
import '../styles/player.css';
import { PlayerSkeleton } from '../components/skeletons';

function TvPlayer() {
    const { showId, season, episode } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const roomId = searchParams.get('room');
    const isHost = searchParams.get('host') === 'true';

    const { user } = useAuth();
    const { updateProgress, getEpisodeProgress } = useTvProgress();

    // Async content loading
    const [show, setShow] = useState(null);
    const [currentEpisode, setCurrentEpisode] = useState(null);
    const [nextEpisode, setNextEpisode] = useState(null);
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
    const [isDragging, setIsDragging] = useState(false);
    const [isVideoLoading, setIsVideoLoading] = useState(false);
    const [videoError, setVideoError] = useState(null);

    // Standardized Controls State
    const [showVolumeSlider, setShowVolumeSlider] = useState(false);
    const [showSpeedMenu, setShowSpeedMenu] = useState(false);
    const [showQualityMenu, setShowQualityMenu] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [quality, setQuality] = useState('Auto');

    // Episode Sidebar State
    const [showEpisodeSidebar, setShowEpisodeSidebar] = useState(false);
    const [viewingSeason, setViewingSeason] = useState(null);

    // Load show and episode data from Supabase
    useEffect(() => {
        const loadContent = async () => {
            setLoading(true);
            try {
                const [showData, episodeData, nextEpData] = await Promise.all([
                    contentService.getTvShowById(showId),
                    contentService.getEpisodeById(showId, season, episode),
                    contentService.getNextEpisode(showId, season, episode)
                ]);
                setShow(showData);
                setCurrentEpisode(episodeData);
                setNextEpisode(nextEpData);

                // Set default viewing season if not set
                if (viewingSeason === null) {
                    setViewingSeason(parseInt(season));
                }
            } catch (err) {
                console.error('[TvPlayer] Failed to load content:', err);
            }
            setLoading(false);
        };
        loadContent();
    }, [showId, season, episode]);

    // Update viewing season when current season changes (only if sidebar is closed or user hasn't manually selected)
    useEffect(() => {
        if (!showEpisodeSidebar) {
            setViewingSeason(parseInt(season));
        }
    }, [season, showEpisodeSidebar]);

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
        if (isPlaying && !showEpisodeSidebar) { // Don't hide if sidebar is open
            hideTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
        }
    }, [isPlaying, showEpisodeSidebar]);

    const handleMouseMove = useCallback(() => resetHideTimer(), [resetHideTimer]);
    const handleMouseLeave = useCallback(() => {
        if (isPlaying && !showEpisodeSidebar) {
            hideTimeoutRef.current = setTimeout(() => setShowControls(false), 1000);
        }
    }, [isPlaying, showEpisodeSidebar]);

    // Load watch history
    useEffect(() => {
        if (user && currentEpisode) {
            const savedProgress = getEpisodeProgress(showId, parseInt(season), parseInt(episode));
            if (savedProgress > 0 && savedProgress < 95 && videoRef.current) {
                const resumeTime = (savedProgress / 100) * videoRef.current.duration;
                if (!isNaN(resumeTime)) {
                    videoRef.current.currentTime = resumeTime;
                }
            }
        }
    }, [user, currentEpisode, getEpisodeProgress, showId, season, episode]);

    // Save watch progress periodically
    useEffect(() => {
        if (!user || !currentEpisode) return;
        const saveInterval = setInterval(() => {
            if (videoRef.current && videoRef.current.duration) {
                updateProgress(
                    showId,
                    parseInt(season),
                    parseInt(episode),
                    videoRef.current.currentTime,
                    videoRef.current.duration
                );
            }
        }, 10000);
        return () => clearInterval(saveInterval);
    }, [user, currentEpisode, showId, season, episode, updateProgress]);

    // Watch party sync
    useEffect(() => {
        if (roomId && videoRef.current) {
            setIsSyncing(true);
            videoSyncManager.connect();
            videoSyncManager.joinRoom(roomId, user?.id, isHost);
            videoSyncManager.attachVideo(videoRef.current);
            return () => {
                videoSyncManager.detachVideo();
                videoSyncManager.leaveRoom();
            };
        }
    }, [roomId, isHost, user]);

    // Video event listeners
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const updateTime = () => {
            setCurrentTime(video.currentTime);
            setProgress((video.currentTime / video.duration) * 100);
        };

        const updateDuration = () => setDuration(video.duration);
        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);
        const handleWaiting = () => setIsVideoLoading(true);
        const handleCanPlay = () => setIsVideoLoading(false);
        const handlePlaying = () => setIsVideoLoading(false);
        const handleError = (e) => {
            console.error('Video error:', e);
            setVideoError('Failed to load episode. Please try again.');
            setIsVideoLoading(false);
        };

        video.addEventListener('timeupdate', updateTime);
        video.addEventListener('loadedmetadata', updateDuration);
        video.addEventListener('play', handlePlay);
        video.addEventListener('pause', handlePause);
        video.addEventListener('waiting', handleWaiting);
        video.addEventListener('canplay', handleCanPlay);
        video.addEventListener('playing', handlePlaying);
        video.addEventListener('error', handleError);

        return () => {
            video.removeEventListener('timeupdate', updateTime);
            video.removeEventListener('loadedmetadata', updateDuration);
            video.removeEventListener('play', handlePlay);
            video.removeEventListener('pause', handlePause);
            video.removeEventListener('waiting', handleWaiting);
            video.removeEventListener('canplay', handleCanPlay);
            video.removeEventListener('playing', handlePlaying);
            video.removeEventListener('error', handleError);
        };
    }, [currentEpisode]);

    // Additional Control Handlers
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
    };

    // Fullscreen change listener
    useEffect(() => {
        const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.target.tagName === 'INPUT') return;
            switch (e.key) {
                case ' ': case 'k': e.preventDefault(); togglePlay(); break;
                case 'ArrowLeft': e.preventDefault(); skip(-10); break;
                case 'ArrowRight': e.preventDefault(); skip(10); break;
                case 'f': e.preventDefault(); toggleFullscreen(); break;
                case 'm': e.preventDefault(); toggleMute(); break;
                case 'n': e.preventDefault(); if (nextEpisode) playNextEpisode(); break;
                case 'Escape':
                    if (showEpisodeSidebar) setShowEpisodeSidebar(false);
                    else if (isFullscreen) document.exitFullscreen();
                    break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isFullscreen, nextEpisode, showEpisodeSidebar]);

    const togglePlay = () => {
        const video = videoRef.current;
        if (!video) return;
        video.paused ? video.play().catch(console.error) : video.pause();
        resetHideTimer();
    };

    const skip = (seconds) => {
        const video = videoRef.current;
        if (!video || !video.duration) return;
        video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + seconds));
        resetHideTimer();
    };

    const toggleMute = () => {
        const video = videoRef.current;
        if (isMuted) { video.volume = volume || 1; setIsMuted(false); }
        else { video.volume = 0; setIsMuted(true); }
    };

    const toggleFullscreen = () => {
        document.fullscreenElement ? document.exitFullscreen() : containerRef.current?.requestFullscreen();
    };

    // Progress bar seek
    const handleProgressSeek = (e) => {
        if (!progressRef.current || !videoRef.current || !videoRef.current.duration) return;
        const rect = progressRef.current.getBoundingClientRect();
        const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const newTime = pos * videoRef.current.duration;
        if (!isNaN(newTime)) {
            videoRef.current.currentTime = newTime;
            setProgress(pos * 100);
        }
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

    const playNextEpisode = () => {
        if (nextEpisode) {
            if (roomId && isHost) {
                videoSyncManager.emit('tv:next_episode', {
                    roomId,
                    showId,
                    season: nextEpisode.seasonNumber,
                    episode: nextEpisode.episodeNumber
                });
            }
            navigate(`/tv-player/${showId}/${nextEpisode.seasonNumber}/${nextEpisode.episodeNumber}${roomId ? `?room=${roomId}&host=${isHost}` : ''}`);
        }
    };

    // Sidebar Helpers
    const getViewableEpisodes = () => {
        if (!show || !show.seasons) return [];
        const seasonData = show.seasons.find(s => s.seasonNumber === viewingSeason);
        return seasonData ? seasonData.episodes : [];
    };

    const handleEpisodeClick = (ep) => {
        if (parseInt(season) === viewingSeason && parseInt(episode) === ep.episodeNumber) {
            return; // Already playing
        }

        // Navigate
        navigate(`/tv-player/${showId}/${viewingSeason}/${ep.episodeNumber}${roomId ? `?room=${roomId}&host=${isHost}` : ''}`);
        setShowEpisodeSidebar(false);
    };

    if (loading) {
        return <PlayerSkeleton />;
    }

    if (!show || !currentEpisode) {
        return (
            <div className="player-loading">
                <h2>Episode not found</h2>
                <Link to="/tv-shows">Go back to TV Shows</Link>
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
                to={roomId ? `/watch-party?room=${roomId}` : `/tv-show/${showId}`}
                className={`player-back-btn ${showControls ? 'visible' : ''}`}
            >
                <i className="fas fa-arrow-left"></i>
            </Link>

            {/* Episode Info Badge */}
            <div className={`player-episode-badge ${showControls ? 'visible' : ''}`}>
                <span>{show.title} • S{season} E{episode}</span>
            </div>

            {/* Sync Badge */}
            {isSyncing && (
                <div className="player-sync-badge">
                    <i className="fas fa-users"></i>
                    <span>{isHost ? 'Hosting' : 'Synced'}</span>
                </div>
            )}

            {/* Video */}
            <video
                key={currentEpisode.id || `${season}-${episode}`}
                ref={videoRef}
                className="player-video"
                poster={currentEpisode.thumbnailUrl || show.posterUrl}
                onClick={togglePlay}
                onDoubleClick={toggleFullscreen}
                playsInline
                preload="auto"
            >
                <source src={currentEpisode.videoUrl || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"} type="video/mp4" />
            </video>

            {/* Episode Sidebar Overlay (Right Side) */}
            <div className={`episode-sidebar-overlay ${showEpisodeSidebar ? 'open' : ''}`} onClick={() => setShowEpisodeSidebar(false)}></div>
            <div className={`episode-sidebar ${showEpisodeSidebar ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <h3>Episodes</h3>
                    <button className="sidebar-close" onClick={() => setShowEpisodeSidebar(false)}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                {/* Season Pills */}
                <div className="sidebar-seasons">
                    {show.seasons && show.seasons.map(s => (
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
                        const isCurrent = parseInt(season) === viewingSeason && parseInt(episode) === ep.episodeNumber;
                        const progress = getEpisodeProgress(showId, viewingSeason, ep.episodeNumber);

                        return (
                            <div
                                key={ep.id}
                                className={`sidebar-episode-card ${isCurrent ? 'active' : ''}`}
                                onClick={() => handleEpisodeClick(ep)}
                            >
                                <div className="sidebar-ep-thumb">
                                    <img src={ep.thumbnailUrl || show.posterUrl} alt={ep.title} />
                                    {isCurrent && <div className="now-playing-overlay"><i className="fas fa-play"></i></div>}
                                    {progress > 0 && <div className="sidebar-progress" style={{ width: `${progress}%` }}></div>}
                                </div>
                                <div className="sidebar-ep-info">
                                    <span className="sidebar-ep-num">{ep.episodeNumber}. {ep.title}</span>
                                    <span className="sidebar-ep-dur">{ep.duration}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

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

            {/* Video Error */}
            {videoError && (
                <div className="player-error-overlay">
                    <div className="player-error-content">
                        <i className="fas fa-exclamation-triangle"></i>
                        <p>{videoError}</p>
                        <button onClick={() => window.location.reload()} className="player-error-retry">
                            Retry
                        </button>
                    </div>
                </div>
            )}

            {/* Center Play Button */}
            {!isPlaying && !isVideoLoading && (
                <button className="player-center-play" onClick={togglePlay}>
                    <i className="fas fa-play"></i>
                </button>
            )}

            {/* Bottom Control Bar */}
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

                    {/* Next Episode Button */}
                    {nextEpisode && (
                        <button
                            className="player-btn"
                            onClick={playNextEpisode}
                            title={`Next: S${nextEpisode.seasonNumber} E${nextEpisode.episodeNumber}`}
                            style={{ marginLeft: '10px' }}
                        >
                            <i className="fas fa-step-forward"></i>
                        </button>
                    )}
                </div>

                {/* Center: Time and Progress Bar */}
                <div className="player-info-center">
                    <div className="player-time-display">
                        <span className="player-current-time">{formatTime(currentTime)}</span>
                        <span className="player-time-separator">/</span>
                        <span className="player-total-time">{formatTime(duration)}</span>
                    </div>
                    <div className="player-info-text">
                        <span className="player-info-title">{currentEpisode.title}</span>
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
                    {/* Episodes Toggle */}
                    <button
                        className={`player-btn ${showEpisodeSidebar ? 'active-control' : ''}`}
                        onClick={() => setShowEpisodeSidebar(!showEpisodeSidebar)}
                        title="Episodes"
                    >
                        <i className="fas fa-list"></i>
                    </button>

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

                    {/* Volume Control */}
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

            <style>{`
                /* Episode Badge */
                .player-episode-badge {
                    position: absolute;
                    top: 20px;
                    left: 80px;
                    background: rgba(0, 0, 0, 0.7);
                    padding: 8px 16px;
                    border-radius: 8px;
                    font-size: 0.9rem;
                    color: #fff;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                    z-index: 15;
                }

                .player-episode-badge.visible {
                    opacity: 1;
                }
                
                .active-control {
                    color: #ffffff !important;
                    text-shadow: 0 0 10px rgba(255, 255, 255, 0.5); /* Glowing white */
                }

                /* Force Controls to Top Layer */
                .player-control-bar, 
                .player-center-play, 
                .player-back-btn,
                .player-sync-badge {
                    z-index: 200 !important;
                    position: absolute;
                    pointer-events: auto !important;
                }
                
                /* Ensure popup menus are above control bar */
                .player-popup-menu, .volume-slider-popup {
                    z-index: 210 !important;
                }

                /* --- Ultra-Modern Monochrome Popup Styles --- */
                .episode-sidebar-overlay {
                    position: fixed;
                    inset: 0;
                    background: transparent;
                    z-index: 100; /* Below controls */
                    opacity: 0;
                    pointer-events: none;
                    transition: opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .episode-sidebar-overlay.open {
                    opacity: 1;
                    pointer-events: auto;
                }
                
                .episode-sidebar {
                    position: absolute;
                    top: 20px;
                    right: 20px;
                    bottom: 90px;
                    width: 380px;
                    background: rgba(5, 5, 5, 0.85); /* Deep dark glass */
                    backdrop-filter: blur(40px);
                    -webkit-backdrop-filter: blur(40px);
                    z-index: 150; /* Above overlay, below controls */
                    transform: scale(0.96) translateY(10px);
                    opacity: 0;
                    pointer-events: none;
                    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); /* Snappy pop */
                    display: flex;
                    flex-direction: column;
                    border: 1px solid rgba(255, 255, 255, 0.08); /* Ultra subtle border */
                    border-radius: 28px; /* Slightly softer corners */
                    box-shadow: 0 24px 48px rgba(0,0,0,0.6); /* Deep elevation */
                }
                .episode-sidebar.open {
                    transform: scale(1) translateY(0);
                    opacity: 1;
                    pointer-events: auto;
                }
                
                .sidebar-header {
                    padding: 28px 28px 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                }
                
                .sidebar-header h3 {
                    margin: 0;
                    font-size: 1.5rem;
                    font-weight: 800;
                    color: #fff;
                    letter-spacing: -0.02em;
                }
                
                .sidebar-close {
                    background: rgba(255, 255, 255, 0.05);
                    border: none;
                    color: #fff;
                    width: 36px;
                    height: 36px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    cursor: pointer;
                    transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
                }
                .sidebar-close:hover {
                    background: #fff; /* Invert on hover */
                    color: #000;
                    transform: scale(1.1);
                }
                
                .sidebar-seasons {
                    padding: 20px 28px 10px;
                    display: flex;
                    gap: 8px;
                    overflow-x: auto;
                    scrollbar-width: none;
                }
                .sidebar-seasons::-webkit-scrollbar { display: none; }
                
                .season-pill {
                    background: transparent;
                    border: 1px solid transparent; /* Ghost style */
                    color: rgba(255, 255, 255, 0.5);
                    padding: 8px 18px;
                    border-radius: 100px;
                    font-size: 0.95rem;
                    font-weight: 600;
                    cursor: pointer;
                    white-space: nowrap;
                    transition: all 0.2s ease;
                }
                .season-pill:hover {
                    background: rgba(255, 255, 255, 0.08);
                    color: #fff;
                }
                .season-pill.active {
                    background: #fff;
                    color: #000;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                }
                
                .sidebar-list {
                    flex: 1;
                    overflow-y: auto;
                    padding: 10px 24px 30px;
                }
                .sidebar-list::-webkit-scrollbar { width: 4px; }
                .sidebar-list::-webkit-scrollbar-track { background: transparent; }
                .sidebar-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
                
                .sidebar-episode-card {
                    display: flex;
                    gap: 18px;
                    padding: 14px;
                    border-radius: 16px;
                    cursor: pointer;
                    transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
                    border: 1px solid transparent;
                    margin-bottom: 8px;
                    position: relative;
                    overflow: hidden;
                }
                .sidebar-episode-card:hover {
                    background: rgba(255, 255, 255, 0.04);
                }
                .sidebar-episode-card.active {
                    background: #fff;
                    box-shadow: 0 8px 24px rgba(0,0,0,0.2);
                    transform: scale(1.02); /* Slight pop */
                    z-index: 1;
                }
                
                .sidebar-ep-thumb {
                    width: 130px;
                    height: 74px;
                    border-radius: 10px;
                    overflow: hidden;
                    position: relative;
                    flex-shrink: 0;
                    background: #111;
                }
                .sidebar-ep-thumb img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    filter: grayscale(100%);
                    transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
                    opacity: 0.8; 
                }
                .sidebar-episode-card:hover .sidebar-ep-thumb img,
                .sidebar-episode-card.active .sidebar-ep-thumb img {
                    filter: grayscale(0%);
                    opacity: 1;
                    transform: scale(1.08);
                }
                
                .now-playing-overlay {
                    position: absolute;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.4);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #fff;
                    font-size: 1rem;
                    opacity: 0;
                    transition: opacity 0.2s ease;
                }
                .sidebar-episode-card.active .now-playing-overlay {
                    opacity: 1;
                }
                
                .sidebar-progress {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    height: 3px;
                    background: #fff;
                }
                
                .sidebar-ep-info {
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    flex: 1;
                }
                
                .sidebar-ep-num {
                    font-size: 1rem;
                    font-weight: 700;
                    color: rgba(255, 255, 255, 0.8);
                    margin-bottom: 4px;
                    line-height: 1.3;
                    letter-spacing: -0.01em;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                .sidebar-episode-card.active .sidebar-ep-num {
                    color: #000;
                }
                
                .sidebar-ep-dur {
                    font-size: 0.8rem;
                    color: rgba(255, 255, 255, 0.4);
                    font-weight: 500;
                }
                .sidebar-episode-card.active .sidebar-ep-dur {
                    color: rgba(0, 0, 0, 0.6);
                }
            `}</style>
        </div>
    );
}

export default TvPlayer;
