import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

function VideoGrid({ participants, localStream, isAudioEnabled, isVideoEnabled, onToggleAudio, onToggleVideo }) {
    const { user } = useAuth();
    const localVideoRef = useRef(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    const toggleFullscreen = () => {
        const container = document.querySelector('.video-grid-container');
        if (document.fullscreenElement) {
            document.exitFullscreen();
            setIsFullscreen(false);
        } else {
            container?.requestFullscreen();
            setIsFullscreen(true);
        }
    };

    // Filter out current user from participants (they're shown in local video)
    const remoteParticipants = participants?.filter(p => p.id !== user?.id) || [];

    return (
        <div className="video-grid-container">
            <div className={`video-grid ${remoteParticipants.length > 1 ? 'multi' : ''}`}>
                {/* Local video (You) */}
                <div className="video-tile local">
                    <video
                        ref={localVideoRef}
                        autoPlay
                        muted
                        playsInline
                        className={!isVideoEnabled ? 'hidden' : ''}
                    />
                    {!isVideoEnabled && (
                        <div className="video-placeholder">
                            <img
                                src={user?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'You'}`}
                                alt="You"
                            />
                        </div>
                    )}
                    <div className="video-label">
                        <span>You</span>
                        {!isAudioEnabled && <i className="fas fa-microphone-slash"></i>}
                    </div>
                </div>

                {/* Remote participants (excluding yourself) */}
                {remoteParticipants.map((participant, index) => (
                    <div key={participant.id || index} className="video-tile">
                        <div className="video-placeholder">
                            <img
                                src={participant.avatar}
                                alt={participant.name}
                            />
                        </div>
                        <div className="video-label">
                            <span>{participant.name}</span>
                            {participant.isMuted && <i className="fas fa-microphone-slash"></i>}
                        </div>
                        <div className="video-status">
                            <div className="status-dot online"></div>
                        </div>
                    </div>
                ))}

                {/* Add participant placeholder */}
                {remoteParticipants.length < 3 && (
                    <div className="video-tile add-participant">
                        <div className="add-icon">
                            <i className="fas fa-user-plus"></i>
                        </div>
                        <span>Invite Friend</span>
                    </div>
                )}
            </div>

            <div className="video-controls">
                <button
                    className={`control-btn ${!isAudioEnabled ? 'muted' : ''}`}
                    onClick={onToggleAudio}
                    title={isAudioEnabled ? 'Mute' : 'Unmute'}
                >
                    <i className={`fas ${isAudioEnabled ? 'fa-microphone' : 'fa-microphone-slash'}`}></i>
                </button>
                <button
                    className={`control-btn ${!isVideoEnabled ? 'muted' : ''}`}
                    onClick={onToggleVideo}
                    title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
                >
                    <i className={`fas ${isVideoEnabled ? 'fa-video' : 'fa-video-slash'}`}></i>
                </button>
                <button
                    className="control-btn"
                    onClick={toggleFullscreen}
                    title="Fullscreen"
                >
                    <i className={`fas ${isFullscreen ? 'fa-compress' : 'fa-expand'}`}></i>
                </button>
            </div>

            <style>{`
        .video-grid-container {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .video-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }

        .video-grid.multi {
          grid-template-columns: repeat(2, 1fr);
        }

        .video-tile {
          position: relative;
          aspect-ratio: 16/9;
          background: rgba(0, 0, 0, 0.4);
          border-radius: 12px;
          overflow: hidden;
          border: 2px solid rgba(255, 255, 255, 0.1);
          transition: all 0.3s ease;
        }

        .video-tile:hover {
          border-color: rgba(255, 255, 255, 0.3);
        }

        .video-tile.local {
          border-color: rgba(99, 102, 241, 0.5);
        }

        .video-tile video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .video-tile video.hidden {
          display: none;
        }

        .video-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, rgba(30, 30, 40, 0.9), rgba(20, 20, 30, 0.9));
        }

        .video-placeholder img {
          width: 60%;
          height: 60%;
          object-fit: contain;
          border-radius: 50%;
          border: 3px solid rgba(255, 255, 255, 0.2);
        }

        .video-label {
          position: absolute;
          bottom: 8px;
          left: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 5px 10px;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          font-size: 0.8rem;
          color: white;
        }

        .video-label i {
          color: #ff4757;
          font-size: 0.75rem;
        }

        .video-status {
          position: absolute;
          top: 8px;
          right: 8px;
        }

        .status-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #2ed573;
          box-shadow: 0 0 10px rgba(46, 213, 115, 0.5);
        }

        .status-dot.online {
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 0 5px rgba(46, 213, 115, 0.5);
          }
          50% {
            box-shadow: 0 0 15px rgba(46, 213, 115, 0.8);
          }
        }

        .video-tile.add-participant {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          background: rgba(255, 255, 255, 0.05);
          border: 2px dashed rgba(255, 255, 255, 0.2);
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .video-tile.add-participant:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.4);
        }

        .add-icon {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .video-tile.add-participant:hover .add-icon {
          background: rgba(255, 255, 255, 0.2);
          transform: scale(1.1);
        }

        .add-icon i {
          font-size: 1.2rem;
          color: rgba(255, 255, 255, 0.7);
        }

        .video-tile.add-participant span {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.6);
        }

        .video-controls {
          display: flex;
          justify-content: center;
          gap: 15px;
          padding: 10px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 30px;
          width: fit-content;
          margin: 0 auto;
        }

        .control-btn {
          width: 45px;
          height: 45px;
          border-radius: 50%;
          border: none;
          background: rgba(255, 255, 255, 0.15);
          color: white;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
        }

        .control-btn:hover {
          background: rgba(255, 255, 255, 0.25);
          transform: scale(1.1);
        }

        .control-btn.muted {
          background: rgba(255, 71, 87, 0.3);
          color: #ff4757;
        }

        .control-btn.muted:hover {
          background: rgba(255, 71, 87, 0.5);
        }
      `}</style>
        </div>
    );
}

export default VideoGrid;
