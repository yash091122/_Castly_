import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import contentService from '../services/contentService';

const ContentContext = createContext(null);

export const useContent = () => {
    const context = useContext(ContentContext);
    if (!context) {
        throw new Error('useContent must be used within a ContentProvider');
    }
    return context;
};

export const ContentProvider = ({ children }) => {
    const [movies, setMovies] = useState([]);
    const [tvShows, setTvShows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);

    // Realtime subscription refs
    const moviesSub = useRef(null);
    const seriesSub = useRef(null);

    // Load initial content
    const loadContent = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            console.log('[ContentContext] Starting to load content...');
            const [moviesData, showsData] = await Promise.all([
                contentService.getMovies(),
                contentService.getTvShows()
            ]);

            setMovies(moviesData?.map(m => ({ ...m, type: 'movie' })) || []);
            setTvShows(showsData?.map(s => ({ ...s, type: 'tv' })) || []);
            setLastUpdated(new Date().toISOString());
            console.log(`[ContentContext] Loaded ${moviesData?.length || 0} movies and ${showsData?.length || 0} TV shows`);
        } catch (err) {
            console.error('[ContentContext] Failed to load content:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    // Load content on mount
    useEffect(() => {
        loadContent();
    }, [loadContent]);

    // Setup realtime subscriptions
    useEffect(() => {
        // Subscribe to movie changes
        moviesSub.current = contentService.subscribeToMovies((payload) => {
            console.log('[ContentContext] 🎬 Movie realtime update:', payload.eventType, payload.new?.title || payload.old?.id);

            if (payload.eventType === 'INSERT') {
                // Only add if published
                if (payload.new.status === 'published') {
                    const newMovie = {
                        id: payload.new.id,
                        title: payload.new.title,
                        description: payload.new.description,
                        posterUrl: payload.new.poster_url,
                        bannerUrl: payload.new.banner_url,
                        trailerUrl: payload.new.trailer_url,
                        videoUrl: payload.new.video_url,
                        genre: payload.new.genre,
                        duration: payload.new.duration,
                        year: payload.new.year,
                        rating: payload.new.rating,
                        viewCount: payload.new.view_count,
                        type: 'movie'
                    };
                    setMovies(prev => [newMovie, ...prev]);
                    console.log('[ContentContext] ✅ New movie added:', newMovie.title);
                }
            } else if (payload.eventType === 'UPDATE') {
                setMovies(prev => {
                    // If unpublished, remove from list
                    if (payload.new.status !== 'published') {
                        console.log('[ContentContext] 🚫 Movie unpublished, removing:', payload.new.title);
                        return prev.filter(m => m.id !== payload.new.id);
                    }

                    const updatedMovie = {
                        id: payload.new.id,
                        title: payload.new.title,
                        description: payload.new.description,
                        posterUrl: payload.new.poster_url,
                        bannerUrl: payload.new.banner_url,
                        trailerUrl: payload.new.trailer_url,
                        videoUrl: payload.new.video_url,
                        genre: payload.new.genre,
                        duration: payload.new.duration,
                        year: payload.new.year,
                        rating: payload.new.rating,
                        viewCount: payload.new.view_count,
                        type: 'movie'
                    };

                    // Update existing or add new
                    const exists = prev.find(m => m.id === payload.new.id);
                    if (exists) {
                        console.log('[ContentContext] 🔄 Movie updated:', updatedMovie.title);
                        return prev.map(m => m.id === payload.new.id ? { ...m, ...updatedMovie } : m);
                    } else {
                        // Add if now published
                        console.log('[ContentContext] ✅ Movie published:', updatedMovie.title);
                        return [updatedMovie, ...prev];
                    }
                });
            } else if (payload.eventType === 'DELETE') {
                console.log('[ContentContext] 🗑️ Movie deleted:', payload.old.id);
                setMovies(prev => prev.filter(m => m.id !== payload.old.id));
            }

            setLastUpdated(new Date().toISOString());
        });

        // Subscribe to series changes
        seriesSub.current = contentService.subscribeToSeries((payload) => {
            console.log('[ContentContext] 📺 Series realtime update:', payload.eventType, payload.new?.title || payload.old?.id);

            if (payload.eventType === 'INSERT') {
                if (payload.new.status === 'published') {
                    const newShow = {
                        id: payload.new.id,
                        title: payload.new.title,
                        description: payload.new.description,
                        posterUrl: payload.new.poster_url,
                        bannerUrl: payload.new.banner_url,
                        genre: payload.new.genre?.split(',').map(g => g.trim()) || [],
                        rating: payload.new.rating || '8.0',
                        type: 'tv'
                    };
                    setTvShows(prev => [newShow, ...prev]);
                    console.log('[ContentContext] ✅ New series added:', newShow.title);
                }
            } else if (payload.eventType === 'UPDATE') {
                setTvShows(prev => {
                    if (payload.new.status !== 'published') {
                        console.log('[ContentContext] 🚫 Series unpublished, removing:', payload.new.title);
                        return prev.filter(s => s.id !== payload.new.id);
                    }

                    const updatedShow = {
                        id: payload.new.id,
                        title: payload.new.title,
                        description: payload.new.description,
                        posterUrl: payload.new.poster_url,
                        bannerUrl: payload.new.banner_url,
                        genre: payload.new.genre?.split(',').map(g => g.trim()) || [],
                        rating: payload.new.rating || '8.0',
                        type: 'tv'
                    };

                    const exists = prev.find(s => s.id === payload.new.id);
                    if (exists) {
                        console.log('[ContentContext] 🔄 Series updated:', updatedShow.title);
                        return prev.map(s => s.id === payload.new.id ? { ...s, ...updatedShow } : s);
                    } else {
                        console.log('[ContentContext] ✅ Series published:', updatedShow.title);
                        return [updatedShow, ...prev];
                    }
                });
            } else if (payload.eventType === 'DELETE') {
                console.log('[ContentContext] 🗑️ Series deleted:', payload.old.id);
                setTvShows(prev => prev.filter(s => s.id !== payload.old.id));
            }

            setLastUpdated(new Date().toISOString());
        });

        return () => {
            contentService.unsubscribe(moviesSub.current);
            contentService.unsubscribe(seriesSub.current);
        };
    }, []);

    // Get movie by ID
    const getMovie = useCallback(async (id) => {
        // Check local state first
        const cached = movies.find(m => m.id === id);
        if (cached) return cached;

        // Fetch from service
        return contentService.getMovieById(id);
    }, [movies]);

    // Get TV show by ID
    const getTvShow = useCallback(async (id) => {
        const cached = tvShows.find(s => s.id === id);
        if (cached) return cached;

        return contentService.getTvShowById(id);
    }, [tvShows]);

    // Filter helpers
    const getMoviesByGenre = useCallback((genre) => {
        return movies.filter(m => m.genre === genre || m.genre?.includes(genre));
    }, [movies]);

    const getTvShowsByGenre = useCallback((genre) => {
        return tvShows.filter(s => s.genre?.includes(genre));
    }, [tvShows]);

    const getTrendingMovies = useCallback((limit = 10) => {
        return [...movies]
            .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
            .slice(0, limit);
    }, [movies]);

    const getTopRatedMovies = useCallback((limit = 10) => {
        return [...movies]
            .sort((a, b) => parseFloat(b.rating || 0) - parseFloat(a.rating || 0))
            .slice(0, limit);
    }, [movies]);

    const searchMovies = useCallback((query) => {
        const q = query.toLowerCase();
        return movies.filter(m =>
            m.title?.toLowerCase().includes(q) ||
            m.description?.toLowerCase().includes(q) ||
            m.genre?.toLowerCase().includes(q)
        );
    }, [movies]);

    const searchTvShows = useCallback((query) => {
        const q = query.toLowerCase();
        return tvShows.filter(s =>
            s.title?.toLowerCase().includes(q) ||
            s.description?.toLowerCase().includes(q) ||
            s.genre?.some(g => g.toLowerCase().includes(q))
        );
    }, [tvShows]);

    const value = {
        // State
        movies,
        tvShows,
        loading,
        error,
        lastUpdated,

        // Actions
        refresh: loadContent,
        getMovie,
        getTvShow,

        // Filters
        getMoviesByGenre,
        getTvShowsByGenre,
        getTrendingMovies,
        getTopRatedMovies,
        searchMovies,
        searchTvShows
    };

    return (
        <ContentContext.Provider value={value}>
            {children}
        </ContentContext.Provider>
    );
};

export default ContentContext;
