import React from 'react';
import './SkeletonStyles.css';

const WatchPartySkeleton = () => {
    return (
        <div className="watch-party-skeleton-container">
            {/* Main Stage Skeleton */}
            <div className="skeleton-wp-stage">
                {/* Video Area */}
                <div className="skeleton-wp-video skeleton-shimmer"></div>

                {/* Participants Strip */}
                <div className="skeleton-wp-participants">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="skeleton-wp-participant skeleton-shimmer"></div>
                    ))}
                </div>
            </div>

            {/* Sidebar Skeleton */}
            <div className="skeleton-wp-sidebar">
                {/* Tabs */}
                <div className="skeleton-wp-tabs">
                    <div className="skeleton-wp-tab skeleton-shimmer"></div>
                    <div className="skeleton-wp-tab skeleton-shimmer"></div>
                </div>

                {/* Chat Messages */}
                <div className="skeleton-wp-chat">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="skeleton-wp-message">
                            <div className="skeleton-wp-avatar skeleton-shimmer"></div>
                            <div className="skeleton-wp-message-content">
                                <div className="skeleton-wp-message-text skeleton-shimmer"></div>
                                <div className="skeleton-wp-message-text skeleton-shimmer" style={{ width: '60%' }}></div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Input */}
                <div className="skeleton-wp-input skeleton-shimmer"></div>
            </div>
        </div>
    );
};

export default WatchPartySkeleton;
