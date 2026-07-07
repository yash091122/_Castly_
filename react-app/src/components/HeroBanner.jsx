import { useBanners } from '../context/BannerContext';
import { ChevronLeft, ChevronRight, Play, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './HeroBanner.css';

const HeroBanner = () => {
    const { banners, currentBanner, currentBannerIndex, goToNext, goToPrev, goTo, loading } = useBanners();
    const navigate = useNavigate();

    if (loading) {
        return (
            <div className="hero-banner-skeleton">
                <div className="skeleton-shimmer"></div>
            </div>
        );
    }

    if (!currentBanner || banners.length === 0) {
        return null;
    }

    const handleAction = () => {
        if (currentBanner.content_id && currentBanner.content_type) {
            const prefix = currentBanner.content_type === 'movie' ? '/movie' : '/tv-show';
            navigate(`${prefix}/${currentBanner.content_id}`);
        } else if (currentBanner.link_url) {
            navigate(currentBanner.link_url);
        }
    };

    return (
        <div className="hero-banner">
            {/* Background Image */}
            <div
                className="hero-banner-bg"
                style={{ backgroundImage: `url(${currentBanner.image_url})` }}
            >
                <div className="hero-banner-overlay"></div>
            </div>

            {/* Content */}
            <div className="hero-banner-content">
                <div className="hero-banner-text">
                    {currentBanner.subtitle && (
                        <span className="hero-subtitle">{currentBanner.subtitle}</span>
                    )}
                    <h1 className="hero-title">{currentBanner.title}</h1>
                    {currentBanner.description && (
                        <p className="hero-description">{currentBanner.description}</p>
                    )}
                    <div className="hero-actions">
                        <button className="hero-btn hero-btn-primary" onClick={handleAction}>
                            <Play size={20} />
                            {currentBanner.link_text || 'Watch Now'}
                        </button>
                        <button className="hero-btn hero-btn-secondary" onClick={handleAction}>
                            <Info size={20} />
                            More Info
                        </button>
                    </div>
                </div>

                {/* Navigation Arrows */}
                {banners.length > 1 && (
                    <>
                        <button className="hero-nav hero-nav-prev" onClick={goToPrev}>
                            <ChevronLeft size={32} />
                        </button>
                        <button className="hero-nav hero-nav-next" onClick={goToNext}>
                            <ChevronRight size={32} />
                        </button>
                    </>
                )}

                {/* Indicators */}
                {banners.length > 1 && (
                    <div className="hero-indicators">
                        {banners.map((_, index) => (
                            <button
                                key={index}
                                className={`hero-indicator ${index === currentBannerIndex ? 'active' : ''}`}
                                onClick={() => goTo(index)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default HeroBanner;
