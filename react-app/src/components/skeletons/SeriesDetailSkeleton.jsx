import React from 'react';
import './SkeletonStyles.css';

const SeriesDetailSkeleton = () => {
    return (
        <div className="content-container sdp-glass-wrapper">
            <div className="sdp-unified-container">
                {/* Hero Section Skeleton */}
                <section className="skeleton-sdp-hero">
                    <div className="skeleton-backdrop skeleton-shimmer"></div>
                    
                    <div className="sdp-hero-content">
                        <div className="sdp-content-stack">
                            {/* Meta badges */}
                            <div className="skeleton-meta-badges">
                                <div className="skeleton-badge skeleton-shimmer"></div>
                                <div className="skeleton-badge skeleton-shimmer"></div>
                                <div className="skeleton-badge skeleton-shimmer"></div>
                            </div>

                            {/* Title */}
                            <div className="skeleton-sdp-title skeleton-shimmer"></div>

                            {/* Meta row */}
                            <div className="skeleton-meta-row">
                                <div className="skeleton-meta-item skeleton-shimmer"></div>
                                <div className="skeleton-meta-item skeleton-shimmer"></div>
                                <div className="skeleton-meta-item skeleton-shimmer"></div>
                            </div>

                            {/* Description */}
                            <div className="skeleton-description">
                                <div className="skeleton-desc-line skeleton-shimmer"></div>
                                <div className="skeleton-desc-line skeleton-shimmer"></div>
                            </div>

                            {/* Action buttons */}
                            <div className="skeleton-action-buttons">
                                <div className="skeleton-btn-primary skeleton-shimmer"></div>
                                <div className="skeleton-btn-secondary skeleton-shimmer"></div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Seasons Section Skeleton */}
                <section className="skeleton-section">
                    <div className="skeleton-section-title skeleton-shimmer"></div>
                    <div className="skeleton-season-selector">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="skeleton-season-btn skeleton-shimmer"></div>
                        ))}
                    </div>
                </section>

                {/* Episodes Grid Skeleton */}
                <section className="skeleton-section">
                    <div className="skeleton-episodes-grid">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="skeleton-episode-card">
                                <div className="skeleton-episode-thumb skeleton-shimmer"></div>
                                <div className="skeleton-episode-info">
                                    <div className="skeleton-episode-title skeleton-shimmer"></div>
                                    <div className="skeleton-episode-meta skeleton-shimmer"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Similar Shows Section Skeleton */}
                <section className="skeleton-section">
                    <div className="skeleton-section-title skeleton-shimmer"></div>
                    <div className="skeleton-cards-grid">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="skeleton-content-card">
                                <div className="skeleton-card-image skeleton-shimmer"></div>
                                <div className="skeleton-card-content">
                                    <div className="skeleton-card-title skeleton-shimmer"></div>
                                    <div className="skeleton-card-meta skeleton-shimmer"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default SeriesDetailSkeleton;
