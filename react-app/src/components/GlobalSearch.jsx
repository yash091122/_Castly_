import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContent } from '../context/ContentContext';
import '../styles/GlobalSearch.css';

function GlobalSearch({ isOpen, onClose }) {
    const [query, setQuery] = useState('');
    const [movieResults, setMovieResults] = useState([]);
    const [tvResults, setTvResults] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef(null);
    const navigate = useNavigate();
    const { searchMovies, searchTvShows } = useContent();

    // Combine all results for navigation
    const allResults = [...movieResults, ...tvResults];

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current.focus(), 100);
        }
        if (!isOpen) {
            setQuery('');
            setMovieResults([]);
            setTvResults([]);
            setSelectedIndex(0);
        }
    }, [isOpen]);

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isOpen) return;

            if (e.key === 'Escape') {
                onClose();
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => Math.min(prev + 1, allResults.length - 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => Math.max(prev - 1, 0));
            } else if (e.key === 'Enter' && allResults[selectedIndex]) {
                handleResultClick(allResults[selectedIndex]);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose, selectedIndex, allResults]);

    // Debounced search
    const handleSearch = useCallback((searchQuery) => {
        if (!searchQuery.trim()) {
            setMovieResults([]);
            setTvResults([]);
            setSelectedIndex(0);
            return;
        }
        const movies = searchMovies(searchQuery);
        const tvShows = searchTvShows(searchQuery);
        setMovieResults(movies.slice(0, 6));
        setTvResults(tvShows.slice(0, 6));
        setSelectedIndex(0);
    }, [searchMovies, searchTvShows]);

    // Real-time search on query change
    useEffect(() => {
        const timer = setTimeout(() => {
            handleSearch(query);
        }, 80);
        return () => clearTimeout(timer);
    }, [query, handleSearch]);

    // Navigate to content
    const handleResultClick = (item) => {
        if (item.type === 'movie') {
            navigate(`/movie/${item.id}`);
        } else {
            navigate(`/tv-show/${item.id}`);
        }
        onClose();
    };

    if (!isOpen) return null;

    const hasResults = allResults.length > 0;

    return (
        <div className="spotlight-overlay" onClick={onClose}>
            <div className="spotlight-container" onClick={(e) => e.stopPropagation()}>
                {/* Search Bar - Spotlight Style */}
                <div className="spotlight-search-bar">
                    <i className="fas fa-search spotlight-search-icon"></i>
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="spotlight-input"
                        autoComplete="off"
                        spellCheck="false"
                    />
                </div>

                {/* Results Panel */}
                {hasResults && (
                    <div className="spotlight-results">
                        {/* Movies Section */}
                        {movieResults.length > 0 && (
                            <div className="spotlight-section">
                                <div className="spotlight-section-header">Movies</div>
                                {movieResults.map((movie, index) => {
                                    const globalIndex = index;
                                    return (
                                        <div
                                            key={movie.id}
                                            className={`spotlight-item ${selectedIndex === globalIndex ? 'selected' : ''}`}
                                            onClick={() => handleResultClick(movie)}
                                            onMouseEnter={() => setSelectedIndex(globalIndex)}
                                        >
                                            <div className="spotlight-item-icon">
                                                {movie.posterUrl ? (
                                                    <img src={movie.posterUrl} alt={movie.title} />
                                                ) : (
                                                    <i className="fas fa-film"></i>
                                                )}
                                            </div>
                                            <div className="spotlight-item-content">
                                                <span className="spotlight-item-title">{movie.title}</span>
                                                <span className="spotlight-item-subtitle">
                                                    {movie.year && `${movie.year}`}
                                                    {movie.year && movie.genre && ' • '}
                                                    {movie.genre}
                                                </span>
                                            </div>
                                            {movie.rating && (
                                                <span className="spotlight-item-badge">
                                                    <i className="fas fa-star"></i> {movie.rating}
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* TV Shows Section */}
                        {tvResults.length > 0 && (
                            <div className="spotlight-section">
                                <div className="spotlight-section-header">TV Shows</div>
                                {tvResults.map((show, index) => {
                                    const globalIndex = movieResults.length + index;
                                    return (
                                        <div
                                            key={show.id}
                                            className={`spotlight-item ${selectedIndex === globalIndex ? 'selected' : ''}`}
                                            onClick={() => handleResultClick(show)}
                                            onMouseEnter={() => setSelectedIndex(globalIndex)}
                                        >
                                            <div className="spotlight-item-icon">
                                                {show.posterUrl ? (
                                                    <img src={show.posterUrl} alt={show.title} />
                                                ) : (
                                                    <i className="fas fa-tv"></i>
                                                )}
                                            </div>
                                            <div className="spotlight-item-content">
                                                <span className="spotlight-item-title">{show.title}</span>
                                                <span className="spotlight-item-subtitle">
                                                    {Array.isArray(show.genre) ? show.genre.join(', ') : show.genre}
                                                </span>
                                            </div>
                                            {show.rating && (
                                                <span className="spotlight-item-badge">
                                                    <i className="fas fa-star"></i> {show.rating}
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* No Results */}
                {query && !hasResults && (
                    <div className="spotlight-no-results">
                        <span>No results for "{query}"</span>
                    </div>
                )}
            </div>
        </div>
    );
}

export default GlobalSearch;
