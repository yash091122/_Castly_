import React from 'react';
import './SkeletonStyles.css';

const PlayerSkeleton = () => {
    return (
        <div className="player-skeleton-container">
            {/* Video Player Skeleton */}
            <div className="skeleton-video-player skeleton-shimmer">
                <div className="skeleton-play-button skeleton-shimmer"></div>
            </div>

            {/* Controls Bar Skeleton */}
            <div className="skeleton-controls-bar">
                <div className="skeleton-progress-bar skeleton-shimmer"></div>
                <div className="skeleton-controls-row">
                    <div className="skeleton-control-group">
                        <div className="skeleton-control-btn skeleton-shimmer"></div>
                        <div className="skeleton-control-btn skeleton-shimmer"></div>
                        <div className="skeleton-time-display skeleton-shimmer"></div>
                    </div>
                    <div className="skeleton-control-group">
                        <div className="skeleton-control-btn skeleton-shimmer"></div>
                        <div className="skeleton-control-btn skeleton-shimmer"></div>
                        <div className="skeleton-control-btn skeleton-shimmer"></div>
                    </div>
                </div>
            </div>

            {/* Info Panel Skeleton */}
            <div className="skeleton-info-panel">
                <div className="skeleton-info-title skeleton-shimmer"></div>
                <div className="skeleton-info-meta skeleton-shimmer"></div>
            </div>
        </div>
    );
};

export default PlayerSkeleton;
