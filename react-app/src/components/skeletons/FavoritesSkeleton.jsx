import React from 'react';
import './SkeletonStyles.css';

const FavoritesSkeleton = () => {
    return (
        <div className="content-container">
            <div className="page-container">
                {/* Page Header Skeleton */}
                <div className="skeleton-page-header">
                    <div className="skeleton-title skeleton-shimmer"></div>
                    <div className="skeleton-subtitle skeleton-shimmer"></div>
                </div>

                {/* Tabs Skeleton */}
                <div className="skeleton-tabs">
                    <div className="skeleton-tab skeleton-shimmer"></div>
                    <div className="skeleton-tab skeleton-shimmer"></div>
                </div>

                {/* Content Grid Skeleton */}
                <div className="skeleton-content-grid">
                    {[...Array(12)].map((_, i) => (
                        <div key={i} className="skeleton-content-card">
                            <div className="skeleton-card-image skeleton-shimmer"></div>
                            <div className="skeleton-card-content">
                                <div className="skeleton-card-title skeleton-shimmer"></div>
                                <div className="skeleton-card-meta skeleton-shimmer"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default FavoritesSkeleton;
