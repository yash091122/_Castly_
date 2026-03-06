import React from 'react';
import '../styles/Loader.css';

const Loader = ({ fullScreen = true, size = 'medium' }) => {
    if (fullScreen) {
        return (
            <div className="skeleton-fullscreen">
                {/* Top Navigation Skeleton */}
                <div className="skeleton-nav">
                    <div className="skeleton-logo"></div>
                    <div className="skeleton-nav-links">
                        <div className="skeleton-link"></div>
                        <div className="skeleton-link"></div>
                        <div className="skeleton-link"></div>
                    </div>
                    <div className="skeleton-profile"></div>
                </div>

                {/* Hero / Header Skeleton */}
                <div className="skeleton-hero"></div>

                {/* Content Rows Skeletons */}
                <div className="skeleton-row">
                    <div className="skeleton-title"></div>
                    <div className="skeleton-cards">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="skeleton-card"></div>
                        ))}
                    </div>
                </div>

                <div className="skeleton-row">
                    <div className="skeleton-title"></div>
                    <div className="skeleton-cards">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="skeleton-card"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Inline loader (Not fullscreen)
    return (
        <div className="loader-container">
            <div className={`loader-spinner ${size}`}></div>
        </div>
    );
};

export default Loader;
