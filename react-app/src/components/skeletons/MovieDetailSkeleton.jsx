import React from 'react';
import './SkeletonStyles.css';

const MovieDetailSkeleton = () => {
    return (
        <div className="content-container mdp-glass-wrapper">
            <div className="mdp-unified-container">
                {/* Hero Section Skeleton */}
                <section className="skeleton-mdp-hero">
                    <div className="skeleton-backdrop skeleton-shimmer"></div>
                    
                    <div className="mdp-hero-content">
                        <div className="mdp-content-stack">
                            {/* Meta badges */}
                            <div className="skeleton-meta-badges">
                                <div className="skeleton-badge skeleton-shimmer"></div>
                                <div className="skeleton-badge skeleton-shimmer"></div>
                                <div className="skeleton-badge skeleton-shimmer"></div>
                            </div>

                            {/* Title */}
                            <div className="skeleton-mdp-title skeleton-shimmer"></div>

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
                                <div className="skeleton-desc-line skeleton-shimmer" style={{ width: '70%' }}></div>
                            </div>

                            {/* Action buttons */}
                            <div className="skeleton-action-buttons">
                                <div className="skeleton-btn-primary skeleton-shimmer"></div>
                                <div className="skeleton-btn-secondary skeleton-shimmer"></div>
                                <div className="skeleton-btn-secondary skeleton-shimmer"></div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Cast & Crew Section Skeleton */}
                <section className="skeleton-section">
                    <div className="skeleton-section-title skeleton-shimmer"></div>
                    <div className="skeleton-cast-grid">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="skeleton-cast-card">
                                <div className="skeleton-cast-avatar skeleton-shimmer"></div>
                                <div className="skeleton-cast-name skeleton-shimmer"></div>
                                <div className="skeleton-cast-role skeleton-shimmer"></div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Similar Movies Section Skeleton */}
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

export default MovieDetailSkeleton;
