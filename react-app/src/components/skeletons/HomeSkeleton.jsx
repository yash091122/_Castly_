import React from 'react';
import './SkeletonStyles.css';

const HomeSkeleton = () => {
    return (
        <div className="content-container">
            <div className="page-container">
                {/* Page Header Skeleton */}
                <div className="skeleton-page-header">
                    <div className="skeleton-title skeleton-shimmer"></div>
                    <div className="skeleton-subtitle skeleton-shimmer"></div>
                </div>

                {/* Movie Rows Skeleton */}
                {[1, 2, 3].map((row) => (
                    <div key={row} className="skeleton-movie-row">
                        <div className="skeleton-row-title skeleton-shimmer"></div>
                        <div className="skeleton-cards-grid">
                            {[...Array(6)].map((_, i) => (
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
                ))}
            </div>
        </div>
    );
};

export default HomeSkeleton;
