import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft, ChevronRight, Check, Film, TrendingUp, Star, Sparkles, Zap
} from 'lucide-react';
import { useFavorites } from '../context/FavoritesContext';
import { useFriends } from '../context/FriendsContext';
import { useAuth } from '../context/AuthContext';
import { useContent } from '../context/ContentContext';
import ContentCard from '../components/ContentCard';
import QuickViewModal from '../components/QuickViewModal';
import WatchPartyInviteModal from '../components/WatchPartyInviteModal';
import { getAllMovies as getStaticMovies } from '../data/movies';
import '../styles/movies.css';
import '../styles/content-pages.css';

const genres = ['Action', 'Sci-Fi', 'Drama', 'Fantasy', 'Anime', 'Cartoon', 'Thriller'];

import MovieRow from '../components/MovieRow';

// Filter Dropdown Component
function FilterDropdown({ label, options, value, onChange, icon: Icon }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="filter-dropdown" ref={dropdownRef}>
            <button
                className={`filter-btn ${value ? 'active' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                {Icon && <Icon size={16} />}
                {value || label}
                <ChevronRight size={14} style={{ transform: isOpen ? 'rotate(90deg)' : 'none', transition: '0.2s' }} />
            </button>
            {isOpen && (
                <div className="filter-dropdown-menu">
                    {options.map(option => (
                        <div
                            key={option}
                            className={`filter-option ${value === option ? 'selected' : ''}`}
                            onClick={() => { onChange(option); setIsOpen(false); }}
                        >
                            {value === option && <Check size={14} />}
                            {option}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// Main Movies Page Component
function MoviesPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { isFavorite, toggleFavorite } = useFavorites();
    const { friends } = useFriends();
    const { movies: dbMovies, loading: contentLoading, getMoviesByGenre, getTrendingMovies, getTopRatedMovies, searchMovies } = useContent();

    // Use database movies if available, otherwise fall back to static
    const allMovies = useMemo(() => {
        return dbMovies.length > 0 ? dbMovies : getStaticMovies();
    }, [dbMovies]);


    const [filters, setFilters] = useState({ genre: '' });
    const [filteredMovies, setFilteredMovies] = useState([]);
    const [isFiltering, setIsFiltering] = useState(false);
    const [selectedMovie, setSelectedMovie] = useState(null);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [quickViewMovie, setQuickViewMovie] = useState(null);



    // Get categorized movies - use ContentContext helpers if database is available
    const trendingMovies = useMemo(() => {
        return dbMovies.length > 0 ? getTrendingMovies(8) : allMovies.slice(0, 8);
    }, [dbMovies, allMovies, getTrendingMovies]);

    const topRatedMovies = useMemo(() => {
        return dbMovies.length > 0
            ? getTopRatedMovies(8)
            : [...allMovies].sort((a, b) => parseFloat(b.rating || 0) - parseFloat(a.rating || 0)).slice(0, 8);
    }, [dbMovies, allMovies, getTopRatedMovies]);

    const newReleases = useMemo(() => allMovies.slice(0, 8), [allMovies]);



    // Handle filters - use ContentContext getMoviesByGenre if available
    useEffect(() => {
        const hasFilters = filters.genre;
        setIsFiltering(!!hasFilters);

        if (hasFilters) {
            if (dbMovies.length > 0) {
                setFilteredMovies(getMoviesByGenre(filters.genre));
            } else {
                setFilteredMovies(allMovies.filter(m => m.genre === filters.genre));
            }
        }
    }, [filters, dbMovies, allMovies, getMoviesByGenre]);

    const handleWatchNow = useCallback((movie) => {
        navigate(`/player/${movie.id}`);
    }, [navigate]);

    const handleWatchParty = useCallback((movie) => {
        setSelectedMovie(movie);
        setShowInviteModal(true);
    }, []);

    const handleMovieClick = useCallback((movie) => {
        navigate(`/movie/${movie.id}`);
    }, [navigate]);

    const handleFavorite = useCallback((movieId) => {
        toggleFavorite(movieId);
    }, [toggleFavorite]);

    const clearFilters = () => {
        setFilters({ genre: '' });
    };

    // Group movies by genre for filtered view - use ContentContext if available
    const actionMovies = useMemo(() => dbMovies.length > 0 ? getMoviesByGenre('Action') : allMovies.filter(m => m.genre === 'Action'), [dbMovies, allMovies, getMoviesByGenre]);
    const sciFiMovies = useMemo(() => dbMovies.length > 0 ? getMoviesByGenre('Sci-Fi') : allMovies.filter(m => m.genre === 'Sci-Fi'), [dbMovies, allMovies, getMoviesByGenre]);
    const dramaMovies = useMemo(() => dbMovies.length > 0 ? getMoviesByGenre('Drama') : allMovies.filter(m => m.genre === 'Drama'), [dbMovies, allMovies, getMoviesByGenre]);
    const animeMovies = useMemo(() => dbMovies.length > 0 ? getMoviesByGenre('Anime') : allMovies.filter(m => m.genre === 'Anime'), [dbMovies, allMovies, getMoviesByGenre]);
    const thrillerMovies = useMemo(() => dbMovies.length > 0 ? getMoviesByGenre('Thriller') : allMovies.filter(m => m.genre === 'Thriller'), [dbMovies, allMovies, getMoviesByGenre]);

    return (
        <div className="content-container">
            <div className="page-container">
                {/* Page Header */}
                <div className="page-header">
                    <h1>Movies</h1>
                    <p>Discover amazing movies</p>
                </div>

                {/* Filtered Results or Category Rows */}
                {isFiltering ? (
                    <section className="section">
                        <h2 className="section-title">{filters.genre} Movies ({filteredMovies.length})</h2>
                        {filteredMovies.length > 0 ? (
                            <div className="content-row" style={{ flexWrap: 'wrap' }}>
                                {filteredMovies.map(movie => (
                                    <ContentCard
                                        key={movie.id}
                                        movie={movie}
                                        onQuickView={setQuickViewMovie}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="no-results">
                                <Film size={60} />
                                <h3>No movies found</h3>
                                <p>Try a different genre</p>
                            </div>
                        )}
                    </section>
                ) : (
                    <>
                        <MovieRow
                            title=" Trending Now"
                            movies={trendingMovies}
                            onQuickView={setQuickViewMovie}
                        />
                        <MovieRow
                            title=" Top Rated"
                            movies={topRatedMovies}
                            onQuickView={setQuickViewMovie}
                        />
                        <MovieRow
                            title=" New Releases"
                            movies={newReleases}
                            onQuickView={setQuickViewMovie}
                        />
                        {actionMovies.length > 0 && (
                            <MovieRow
                                title=" Action"
                                movies={actionMovies}
                                onQuickView={setQuickViewMovie}
                            />
                        )}
                        {sciFiMovies.length > 0 && (
                            <MovieRow
                                title=" Sci-Fi"
                                movies={sciFiMovies}
                                onQuickView={setQuickViewMovie}
                            />
                        )}
                        {dramaMovies.length > 0 && (
                            <MovieRow
                                title=" Drama"
                                movies={dramaMovies}
                                onQuickView={setQuickViewMovie}
                            />
                        )}
                        {animeMovies.length > 0 && (
                            <MovieRow
                                title=" Anime"
                                movies={animeMovies}
                                onQuickView={setQuickViewMovie}
                            />
                        )}
                        {thrillerMovies.length > 0 && (
                            <MovieRow
                                title=" Thriller"
                                movies={thrillerMovies}
                                onQuickView={setQuickViewMovie}
                            />
                        )}
                    </>
                )}
            </div>

            {/* Quick View Modal */}
            <QuickViewModal
                movie={quickViewMovie}
                onClose={() => setQuickViewMovie(null)}
            />

            {/* Watch Party Invite Modal */}
            {showInviteModal && selectedMovie && (
                <WatchPartyInviteModal
                    movie={selectedMovie}
                    isOpen={showInviteModal}
                    onClose={() => { setShowInviteModal(false); setSelectedMovie(null); }}
                />
            )}
        </div>
    );
}

export default MoviesPage;
