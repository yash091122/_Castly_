import { Link } from 'react-router-dom';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import { useFavorites } from '../context/FavoritesContext';

function ContentCard({ movie, onQuickView, progress, viewMode = 'grid', onClick }) {
    const { isFavorite, toggleFavorite } = useFavorites();
    const favorited = isFavorite(movie.id);

    const handleClick = (e) => {
        if (onClick) {
            e.preventDefault();
            e.stopPropagation();
            onClick(movie);
        }
    };

    const handlePlay = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (movie.type === 'tv') {
            window.location.href = `/tv-player/${movie.id}/1/1`;
        } else {
            window.location.href = `/player/${movie.id}`;
        }
    };

    const handleFavorite = (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(movie.id, movie.type || 'movie');
    };

    const handleInfo = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (onQuickView) {
            onQuickView(movie);
        }
    };

    const linkPath = movie.type === 'tv' ? `/tv-show/${movie.id}` : `/movie/${movie.id}`;

    // List view rendering
    if (viewMode === 'list') {
        return (
            <div className="content-card-list" onClick={handleClick}>
                <Link to={linkPath} className="card-list-link">
                    <div className="card-list-poster">
                        <LazyLoadImage
                            src={movie.posterUrl || movie.poster}
                            alt={movie.title}
                            effect="blur"
                            wrapperClassName="lazy-image-wrapper"
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }}
                        />
                        {progress !== undefined && (
                            <div className="card-list-progress-container">
                                <div className="card-list-progress-bar" style={{ width: `${progress}%` }}></div>
                            </div>
                        )}
                    </div>
                    <div className="card-list-info">
                        <div className="card-list-header">
                            <h3>{movie.title}</h3>
                            <div className="card-list-meta">
                                <span className="meta-item">
                                    <i className="fas fa-calendar"></i>
                                    {movie.year}
                                </span>
                                {movie.rating && (
                                    <span className="meta-item rating">
                                        <i className="fas fa-star"></i>
                                        {movie.rating}
                                    </span>
                                )}
                                <span className="meta-item">
                                    <i className={`fas fa-${movie.type === 'tv' ? 'tv' : 'film'}`}></i>
                                    {movie.type === 'tv' ? 'TV Show' : 'Movie'}
                                </span>
                            </div>
                        </div>
                        {movie.description && (
                            <p className="card-list-description">{movie.description}</p>
                        )}
                        <div className="card-list-genres">
                            {movie.genre && movie.genre.split(',').map((g, i) => (
                                <span key={i} className="genre-tag">{g.trim()}</span>
                            ))}
                        </div>
                    </div>
                    {onQuickView && (
                        <div className="card-list-actions">
                            <button className="btn-play" onClick={handlePlay} title="Play now">
                                <i className="fas fa-play"></i>
                            </button>
                            <button
                                className={`btn-favorite ${favorited ? 'active' : ''}`}
                                onClick={handleFavorite}
                                title={favorited ? 'Remove from favorites' : 'Add to favorites'}
                            >
                                <i className="fas fa-heart"></i>
                            </button>
                            <button className="btn-info" onClick={handleInfo} title="Quick view">
                                <i className="fas fa-info-circle"></i>
                            </button>
                        </div>
                    )}
                </Link>
            </div>
        );
    }

    // Grid view rendering (default)
    return (
        <div className="content-card" onClick={handleClick}>
            <Link to={linkPath}>
                <LazyLoadImage
                    src={movie.posterUrl || movie.poster}
                    alt={movie.title}
                    effect="blur"
                    wrapperClassName="lazy-image-wrapper"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }}
                />
                <div className="card-overlay">
                    <h3>{movie.title}</h3>
                    <div className="card-meta">
                        <span>{Array.isArray(movie.genre) ? movie.genre[0] : movie.genre}</span>
                        <span>{movie.year}</span>
                    </div>
                    {onQuickView && progress === undefined && (
                        <div className="card-actions">
                            <button className="btn-play" onClick={handlePlay}>
                                <i className="fas fa-play"></i>
                            </button>
                            <button
                                className={`btn-favorite ${favorited ? 'active' : ''}`}
                                onClick={handleFavorite}
                            >
                                <i className="fas fa-heart"></i>
                            </button>
                            <button className="btn-info" onClick={handleInfo}>
                                <i className="fas fa-info-circle"></i>
                            </button>
                        </div>
                    )}
                </div>
                {progress !== undefined && (
                    <div className="card-progress-container">
                        <div className="card-progress-bar" style={{ width: `${progress}%` }}></div>
                        <div className="card-play-overlay">
                            <i className="fas fa-play"></i>
                        </div>
                    </div>
                )}
            </Link>
            <style>{`
                .lazy-image-wrapper {
                    width: 100%;
                    height: 100%;
                    display: block;
                }
            `}</style>
        </div>
    );
}

export default ContentCard;
