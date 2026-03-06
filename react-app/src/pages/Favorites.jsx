import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useFavorites } from '../context/FavoritesContext';
import { useContent } from '../context/ContentContext';
import { FavoritesSkeleton } from '../components/skeletons';
import ContentCard from '../components/ContentCard';
import QuickViewModal from '../components/QuickViewModal';
import '../styles/favorites.css';

function Favorites() {
    const { favorites, loading: favLoading } = useFavorites();
    const { movies, tvShows, loading: contentLoading } = useContent();
    const [sortBy, setSortBy] = useState('latest');
    const [activeTab, setActiveTab] = useState('all'); // 'all', 'movies', 'tv'
    const [quickViewMovie, setQuickViewMovie] = useState(null);

    const loading = favLoading || contentLoading;

    // Get all favorite items with their content data
    const allFavorites = useMemo(() => {
        // Don't block if content is still loading but we have favorites
        if (favLoading && favorites.length === 0) return [];
        if (contentLoading && movies.length === 0 && tvShows.length === 0) return [];

        return favorites
            .map(id => {
                const movie = movies.find(m => m.id === id);
                if (movie) return { ...movie, type: 'movie' };

                const show = tvShows.find(s => s.id === id);
                if (show) return { ...show, type: 'tv' };

                return null;
            })
            .filter(Boolean);
    }, [favorites, movies, tvShows, favLoading, contentLoading]);

    // Filter by content type
    const filteredFavorites = useMemo(() => {
        if (activeTab === 'movies') {
            return allFavorites.filter(item => item.type === 'movie');
        }
        if (activeTab === 'tv') {
            return allFavorites.filter(item => item.type === 'tv');
        }
        return allFavorites;
    }, [allFavorites, activeTab]);

    // Sort favorites
    const sortedFavorites = useMemo(() => {
        const items = [...filteredFavorites];

        switch (sortBy) {
            case 'name':
                return items.sort((a, b) => a.title.localeCompare(b.title));
            case 'rating':
                return items.sort((a, b) => {
                    const ratingA = parseFloat(a.rating) || 0;
                    const ratingB = parseFloat(b.rating) || 0;
                    return ratingB - ratingA;
                });
            case 'year':
                return items.sort((a, b) => {
                    const yearA = parseInt(a.year) || 0;
                    const yearB = parseInt(b.year) || 0;
                    return yearB - yearA;
                });
            default: // 'latest' - keep original order (most recent first)
                return items;
        }
    }, [filteredFavorites, sortBy]);

    // Count by type
    const movieCount = allFavorites.filter(item => item.type === 'movie').length;
    const tvCount = allFavorites.filter(item => item.type === 'tv').length;

    if (loading) {
        return <FavoritesSkeleton />;
    }

    return (
        <div className="content-container">
            {/* Page Title - same as Movies page */}
            <h1 className="page-title" style={{ marginLeft: '20px', marginTop: '20px' }}>
                Favorites
                {allFavorites.length > 0 && (
                    <span className="favorites-count"> ({allFavorites.length})</span>
                )}
            </h1>

            {/* Tabs and Controls */}
            <div className="favorites-controls-section">
                <div className="favorites-tabs">
                    <button
                        className={`fav-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                        onClick={() => setActiveTab('all')}
                    >
                        All <span className="tab-count">{allFavorites.length}</span>
                    </button>
                    <button
                        className={`fav-tab-btn ${activeTab === 'movies' ? 'active' : ''}`}
                        onClick={() => setActiveTab('movies')}
                    >
                        Movies <span className="tab-count">{movieCount}</span>
                    </button>
                    <button
                        className={`fav-tab-btn ${activeTab === 'tv' ? 'active' : ''}`}
                        onClick={() => setActiveTab('tv')}
                    >
                        TV Shows <span className="tab-count">{tvCount}</span>
                    </button>
                </div>

                {sortedFavorites.length > 0 && (
                    <div className="favorites-sort">
                        <select
                            className="sort-select"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                        >
                            <option value="latest">Recently Added</option>
                            <option value="name">Name (A-Z)</option>
                            <option value="rating">Rating</option>
                            <option value="year">Year</option>
                        </select>
                    </div>
                )}
            </div>

            {/* Content */}
            {sortedFavorites.length > 0 ? (
                <div className="section">
                    <div className="content-row favorites-row">
                        {sortedFavorites.map(item => (
                            <ContentCard
                                key={item.id}
                                movie={item}
                                onQuickView={setQuickViewMovie}
                            />
                        ))}
                    </div>
                </div>
            ) : (
                <div className="favorites-empty">
                    <div className="empty-icon-container">
                        <i className="fas fa-heart-broken"></i>
                    </div>
                    <h3>No favorites yet</h3>
                    <p>Start exploring and add movies or TV shows to your favorites!</p>
                    <Link to="/movies" className="discover-btn">
                        <i className="fas fa-play"></i>
                        Browse Your Favorites
                    </Link>
                </div>
            )}

            {/* Quick View Modal */}
            <QuickViewModal
                movie={quickViewMovie}
                onClose={() => setQuickViewMovie(null)}
            />
        </div>
    );
}

export default Favorites;
