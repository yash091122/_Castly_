import { useState } from 'react';
import { useContent } from '../context/ContentContext';
import ContentCard from '../components/ContentCard';
import QuickViewModal from '../components/QuickViewModal';
import { HomeSkeleton } from '../components/skeletons';
import { Film, Tv, TrendingUp, Star, Clock } from 'lucide-react';
import '../styles/main.css';
import '../styles/content-pages.css';

import MovieRow from '../components/MovieRow';

function Home() {
    const { movies, tvShows, loading } = useContent();
    const [quickViewMovie, setQuickViewMovie] = useState(null);
    const [activeTab, setActiveTab] = useState('all'); // 'all', 'movies', 'shows'

    // Get featured content
    const featuredMovies = movies.slice(0, 8);
    const featuredShows = tvShows.slice(0, 8);
    const trendingMovies = movies.slice(0, 6);
    const trendingShows = tvShows.slice(0, 6);

    if (loading) {
        return <HomeSkeleton />;
    }

    const filteredMovies = activeTab === 'shows' ? [] : featuredMovies;
    const filteredShows = activeTab === 'movies' ? [] : featuredShows;

    return (
        <div className="content-container">
            <div className="page-container">
                {/* Page Header */}
                <div className="page-header">
                    <h1>Discover</h1>
                    <p>Explore movies and TV shows</p>
                </div>

                

                {/* Trending Movies Section */}
                {(activeTab === 'all' || activeTab === 'movies') && trendingMovies.length > 0 && (
                    <MovieRow
                        title="Trending Movies"
                        movies={trendingMovies}
                        onQuickView={setQuickViewMovie}
                        
                    />
                )}

               

                {/* Trending TV Shows */}
                {(activeTab === 'all' || activeTab === 'shows') && trendingShows.length > 0 && (
                    <MovieRow
                        title="Trending TV Shows"
                        movies={trendingShows}
                        onQuickView={setQuickViewMovie}
                    
                    />
                )}

                
            </div>

            <QuickViewModal
                movie={quickViewMovie}
                onClose={() => setQuickViewMovie(null)}
            />
        </div>
    );
}

export default Home;
