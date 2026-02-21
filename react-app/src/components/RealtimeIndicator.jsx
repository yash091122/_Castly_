import { useState, useEffect } from 'react';
import { useContent } from '../context/ContentContext';

/**
 * Realtime indicator component that shows when content updates are received
 * Displays a subtle toast notification when admin makes changes
 */
function RealtimeIndicator() {
    const { lastUpdated, movies, tvShows } = useContent();
    const [showNotification, setShowNotification] = useState(false);
    const [updateInfo, setUpdateInfo] = useState('');
    const [isConnected, setIsConnected] = useState(false);

    // Track content counts for change detection
    const [prevCounts, setPrevCounts] = useState({ movies: 0, tvShows: 0 });

    useEffect(() => {
        // Mark as connected after initial load
        if (movies.length > 0 || tvShows.length > 0) {
            setIsConnected(true);
            setPrevCounts({ movies: movies.length, tvShows: tvShows.length });
        }
    }, [movies.length, tvShows.length]);

    useEffect(() => {
        if (!lastUpdated || !isConnected) return;

        const moviesDiff = movies.length - prevCounts.movies;
        const showsDiff = tvShows.length - prevCounts.tvShows;

        let message = '';
        if (moviesDiff > 0) {
            message = `📺 ${moviesDiff} new movie${moviesDiff > 1 ? 's' : ''} added`;
        } else if (moviesDiff < 0) {
            message = `🗑️ Movie removed`;
        } else if (showsDiff > 0) {
            message = `📺 ${showsDiff} new series added`;
        } else if (showsDiff < 0) {
            message = `🗑️ Series removed`;
        } else {
            message = '🔄 Content updated';
        }

        setUpdateInfo(message);
        setShowNotification(true);
        setPrevCounts({ movies: movies.length, tvShows: tvShows.length });

        const timer = setTimeout(() => {
            setShowNotification(false);
        }, 3000);

        return () => clearTimeout(timer);
    }, [lastUpdated]);

    return (
        <>
            {/* Connection status indicator */}
            <div className="realtime-status" title={isConnected ? 'Realtime connected' : 'Connecting...'}>
                <span className={`status-dot ${isConnected ? 'connected' : 'connecting'}`}></span>
                <span className="status-text">{isConnected ? 'Live' : 'Connecting'}</span>
            </div>

            {/* Update notification toast */}
            {showNotification && (
                <div className="realtime-toast">
                    {updateInfo}
                </div>
            )}

            <style>{`
                .realtime-status {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: rgba(0, 0, 0, 0.8);
                    backdrop-filter: blur(10px);
                    padding: 8px 14px;
                    border-radius: 20px;
                    font-size: 0.8rem;
                    color: rgba(255, 255, 255, 0.8);
                    z-index: 1000;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }

                .status-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    animation: pulse 2s infinite;
                }

                .status-dot.connected {
                    background: #22c55e;
                    box-shadow: 0 0 10px rgba(34, 197, 94, 0.5);
                }

                .status-dot.connecting {
                    background: #fbbf24;
                    animation: blink 1s infinite;
                }

                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }

                @keyframes blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.3; }
                }

                .realtime-toast {
                    position: fixed;
                    bottom: 70px;
                    right: 20px;
                    background: linear-gradient(135deg, rgba(99, 102, 241, 0.9), rgba(139, 92, 246, 0.9));
                    backdrop-filter: blur(10px);
                    padding: 12px 20px;
                    border-radius: 12px;
                    font-size: 0.9rem;
                    color: white;
                    font-weight: 500;
                    z-index: 1001;
                    box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
                    animation: slideIn 0.3s ease, fadeOut 0.3s ease 2.7s forwards;
                }

                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }

                @keyframes fadeOut {
                    from { opacity: 1; }
                    to { opacity: 0; }
                }
            `}</style>
        </>
    );
}

export default RealtimeIndicator;
